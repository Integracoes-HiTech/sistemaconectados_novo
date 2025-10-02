-- =====================================================
-- CRIAR ADMINISTRADORES ESPECIAIS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELA MEMBERS_SAUDE (SEM DUPLAS)
-- =====================================================

CREATE TABLE IF NOT EXISTS members_saude (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  instagram VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  referrer VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  
  -- Campos específicos do sistema de membros
  contracts_completed INTEGER DEFAULT 0,
  ranking_position INTEGER,
  ranking_status VARCHAR(10) DEFAULT 'Vermelho' CHECK (ranking_status IN ('Verde', 'Amarelo', 'Vermelho')),
  is_top_1500 BOOLEAN DEFAULT false,
  can_be_replaced BOOLEAN DEFAULT false,
  
  -- Campo para campanha
  campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B')),
  
  -- Campo para soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRIAR TABELA MEMBERS_20 (SEM INSTAGRAM)
-- =====================================================

CREATE TABLE IF NOT EXISTS members_20 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  -- Instagram removido - não é obrigatório
  city VARCHAR(255) NOT NULL,
  sector VARCHAR(255) NOT NULL,
  referrer VARCHAR(255) NOT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  
  -- Dados da segunda pessoa (obrigatório - regra da dupla)
  couple_name VARCHAR(255) NOT NULL,
  couple_phone VARCHAR(20) NOT NULL,
  -- couple_instagram removido - não é obrigatório
  couple_city VARCHAR(255) NOT NULL,
  couple_sector VARCHAR(255) NOT NULL,
  
  -- Campos específicos do sistema de membros
  contracts_completed INTEGER DEFAULT 0,
  ranking_position INTEGER,
  ranking_status VARCHAR(10) DEFAULT 'Vermelho' CHECK (ranking_status IN ('Verde', 'Amarelo', 'Vermelho')),
  is_top_1500 BOOLEAN DEFAULT false,
  can_be_replaced BOOLEAN DEFAULT false,
  
  -- Campo para campanha
  campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B')),
  
  -- Campo para soft delete
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para members_saude
CREATE INDEX IF NOT EXISTS idx_members_saude_campaign ON members_saude(campaign);
CREATE INDEX IF NOT EXISTS idx_members_saude_status ON members_saude(status);
CREATE INDEX IF NOT EXISTS idx_members_saude_referrer ON members_saude(referrer);
CREATE INDEX IF NOT EXISTS idx_members_saude_instagram ON members_saude(instagram);

-- Índices para members_20
CREATE INDEX IF NOT EXISTS idx_members_20_campaign ON members_20(campaign);
CREATE INDEX IF NOT EXISTS idx_members_20_status ON members_20(status);
CREATE INDEX IF NOT EXISTS idx_members_20_referrer ON members_20(referrer);

-- =====================================================
-- 4. CRIAR USUÁRIOS ADMINISTRADORES ESPECIAIS
-- =====================================================

-- Inserir administradores especiais
INSERT INTO auth_users (username, password, name, role, full_name, campaign, instagram, phone, is_active) VALUES
-- Admin Saúde - cadastra membros sem duplas
('adminsaude', 'saude123', 'Admin Saúde', 'Administrador', 'Admin Saúde - Administrador', 'A', 'adminsaude', '62988888888', true),

-- Admin 20 - cadastra pessoas sem Instagram
('admin20', 'admin20123', 'Admin 20', 'Administrador', 'Admin 20 - Administrador', 'A', 'admin20', '62999999999', true);

-- =====================================================
-- 5. CRIAR POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE members_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE members_20 ENABLE ROW LEVEL SECURITY;

-- Política para members_saude - permitir inserção e visualização
CREATE POLICY "Allow insert and select for members_saude" ON members_saude
    FOR ALL USING (true);

-- Política para members_20 - permitir inserção e visualização
CREATE POLICY "Allow insert and select for members_20" ON members_20
    FOR ALL USING (true);

-- =====================================================
-- 6. CRIAR VIEWS PARA ESTATÍSTICAS
-- =====================================================

-- View para estatísticas de members_saude
CREATE OR REPLACE VIEW v_members_saude_stats AS
SELECT 
  campaign,
  COUNT(*) as total_members,
  COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as active_members,
  COUNT(CASE WHEN ranking_status = 'Verde' THEN 1 END) as green_members,
  COUNT(CASE WHEN ranking_status = 'Amarelo' THEN 1 END) as yellow_members,
  COUNT(CASE WHEN ranking_status = 'Vermelho' THEN 1 END) as red_members,
  COUNT(CASE WHEN is_top_1500 = true THEN 1 END) as top_1500_members
FROM members_saude 
WHERE deleted_at IS NULL
GROUP BY campaign;

-- View para estatísticas de members_20
CREATE OR REPLACE VIEW v_members_20_stats AS
SELECT 
  campaign,
  COUNT(*) as total_members,
  COUNT(CASE WHEN status = 'Ativo' THEN 1 END) as active_members,
  COUNT(CASE WHEN ranking_status = 'Verde' THEN 1 END) as green_members,
  COUNT(CASE WHEN ranking_status = 'Amarelo' THEN 1 END) as yellow_members,
  COUNT(CASE WHEN ranking_status = 'Vermelho' THEN 1 END) as red_members,
  COUNT(CASE WHEN is_top_1500 = true THEN 1 END) as top_1500_members
FROM members_20 
WHERE deleted_at IS NULL
GROUP BY campaign;

-- =====================================================
-- 7. VERIFICAR IMPLEMENTAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'members_saude' THEN '✅ Tabela members_saude criada'
        WHEN table_name = 'members_20' THEN '✅ Tabela members_20 criada'
        ELSE '✅ Tabela ' || table_name || ' existe'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('members_saude', 'members_20')
ORDER BY table_name;

-- Verificar usuários criados
SELECT 
    username,
    name,
    role,
    campaign,
    is_active
FROM auth_users 
WHERE username IN ('adminsaude', 'admin20')
ORDER BY username;

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE members_saude IS 'Membros cadastrados sem duplas (Admin Saúde)';
COMMENT ON TABLE members_20 IS 'Membros cadastrados sem Instagram (Admin 20)';

COMMENT ON COLUMN members_saude.name IS 'Nome do membro (sem dupla)';
COMMENT ON COLUMN members_20.name IS 'Nome do primeiro membro';
COMMENT ON COLUMN members_20.couple_name IS 'Nome do segundo membro';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- NOVOS ADMINISTRADORES:
-- - adminsaude: Cadastra membros sem duplas
-- - admin20: Cadastra pessoas sem Instagram
-- 
-- NOVAS TABELAS:
-- - members_saude: Membros individuais
-- - members_20: Duplas sem Instagram
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este script no Supabase
-- 2. Criar telas de cadastro específicas
-- 3. Atualizar dashboard para mostrar dados
-- 4. Testar funcionalidades
-- =====================================================
