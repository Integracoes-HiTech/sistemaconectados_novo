-- ============================================
-- TABELA DE PLANOS E PREÇOS
-- Sistema CONECTADOS - Landing Page
-- ============================================

-- 1. Criar tabela planos_precos
CREATE TABLE IF NOT EXISTS planos_precos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_plano VARCHAR(100) NOT NULL,
    descricao TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    recorrencia VARCHAR(50) DEFAULT 'mensal', -- mensal, trimestral, semestral, anual
    features JSONB, -- Array de funcionalidades
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER,
    order_display INTEGER DEFAULT 0, -- Ordem de exibição
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna plano_preco_id na tabela landing_leads
ALTER TABLE landing_leads 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id);

-- 3. Inserir planos padrão
INSERT INTO planos_precos (nome_plano, descricao, amount, features, max_users, order_display) VALUES
(
    'Gratuito',
    'Ideal para começar e testar o sistema',
    0.00,
    '["100 cadastros", "Painel básico", "Suporte por email"]'::jsonb,
    100,
    1
),
(
    'Essencial',
    'Para pequenas equipes e projetos',
    650.00,
    '["1.000 cadastros", "Painel completo", "Mapa interativo", "Relatórios básicos", "Backup diário", "Suporte via WhatsApp"]'::jsonb,
    1000,
    2
),
(
    'Profissional',
    'Mais escolhido para médias equipes',
    1250.00,
    '["5.000 cadastros", "Painel completo", "Mapa interativo", "Relatórios avançados", "Exportação Excel/PDF", "Backup diário", "Suporte prioritário"]'::jsonb,
    5000,
    3
),
(
    'Avançado',
    'Para grandes organizações sem limites',
    1500.00,
    '["Cadastros ilimitados", "Painel completo", "Mapa interativo", "Relatórios personalizados", "Exportação Excel/PDF", "API de integração", "Backup em tempo real", "Suporte 24h dedicado"]'::jsonb,
    999999,
    4
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_planos_precos_is_active ON planos_precos(is_active);
CREATE INDEX IF NOT EXISTS idx_planos_precos_order ON planos_precos(order_display);
CREATE INDEX IF NOT EXISTS idx_landing_leads_plano ON landing_leads(plano_preco_id);

-- 5. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_planos_precos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar trigger para updated_at
DROP TRIGGER IF EXISTS trigger_planos_precos_updated_at ON planos_precos;
CREATE TRIGGER trigger_planos_precos_updated_at
    BEFORE UPDATE ON planos_precos
    FOR EACH ROW
    EXECUTE FUNCTION update_planos_precos_updated_at();

-- 7. Criar políticas RLS (Row Level Security)
ALTER TABLE planos_precos ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública dos planos ativos
CREATE POLICY "Planos ativos são públicos"
    ON planos_precos
    FOR SELECT
    USING (is_active = true);

-- Apenas admins podem inserir/atualizar/deletar
CREATE POLICY "Apenas admins podem modificar planos"
    ON planos_precos
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth_users
            WHERE username = current_user
            AND (role ILIKE '%admin%' OR role ILIKE '%AdminHitech%')
        )
    );

-- 8. Comentários nas colunas
COMMENT ON TABLE planos_precos IS 'Tabela de planos e preços para landing page';
COMMENT ON COLUMN planos_precos.nome_plano IS 'Nome do plano (ex: Gratuito, Essencial)';
COMMENT ON COLUMN planos_precos.amount IS 'Valor do plano em reais';
COMMENT ON COLUMN planos_precos.recorrencia IS 'Tipo de recorrência do plano';
COMMENT ON COLUMN planos_precos.features IS 'Array JSON com funcionalidades do plano';
COMMENT ON COLUMN planos_precos.is_active IS 'Se o plano está ativo e disponível';
COMMENT ON COLUMN planos_precos.max_users IS 'Número máximo de usuários/cadastros';
COMMENT ON COLUMN planos_precos.order_display IS 'Ordem de exibição na página';

-- 9. Consultas úteis

-- Listar planos ativos
-- SELECT * FROM planos_precos WHERE is_active = true ORDER BY order_display;

-- Buscar plano por ID
-- SELECT * FROM planos_precos WHERE id = 'uuid-aqui';

-- Ver leads por plano
-- SELECT 
--     p.nome_plano,
--     COUNT(l.id) as total_leads,
--     SUM(p.amount) as receita_potencial
-- FROM planos_precos p
-- LEFT JOIN landing_leads l ON l.plano_preco_id = p.id
-- GROUP BY p.id, p.nome_plano
-- ORDER BY total_leads DESC;

-- 10. Migração dos dados existentes (opcional)
-- Atualizar leads existentes baseado no plano_escolhido (texto)
UPDATE landing_leads l
SET plano_preco_id = p.id
FROM planos_precos p
WHERE LOWER(l.plano_escolhido) = LOWER(p.nome_plano)
AND l.plano_preco_id IS NULL;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

