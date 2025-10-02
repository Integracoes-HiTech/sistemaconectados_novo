-- =====================================================
-- ATUALIZAR TABELA USER_LINKS PARA SUPORTAR LINKS ESPECÍFICOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA PARA TIPO DE LINK ESPECÍFICO
-- =====================================================

-- Adicionar coluna para identificar o tipo de link específico
ALTER TABLE user_links ADD COLUMN IF NOT EXISTS link_specific_type VARCHAR(20) DEFAULT 'normal' CHECK (link_specific_type IN ('normal', 'saude', '20'));

-- Adicionar coluna para descrição específica
ALTER TABLE user_links ADD COLUMN IF NOT EXISTS specific_description TEXT;

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para o tipo específico de link
CREATE INDEX IF NOT EXISTS idx_user_links_specific_type ON user_links(link_specific_type);

-- Índice composto para busca eficiente
CREATE INDEX IF NOT EXISTS idx_user_links_type_specific ON user_links(link_type, link_specific_type);

-- =====================================================
-- 3. ATUALIZAR DADOS EXISTENTES
-- =====================================================

-- Marcar todos os links existentes como 'normal'
UPDATE user_links SET link_specific_type = 'normal' WHERE link_specific_type IS NULL;

-- =====================================================
-- 4. CRIAR VIEWS PARA ESTATÍSTICAS ESPECÍFICAS
-- =====================================================

-- View para estatísticas de links de saúde
CREATE OR REPLACE VIEW v_user_links_saude_stats AS
SELECT 
  campaign,
  created_by,
  COUNT(*) as total_links,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_links,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_links,
  SUM(current_uses) as total_uses,
  COUNT(CASE WHEN link_type = 'Membro' THEN 1 END) as member_links,
  COUNT(CASE WHEN link_type = 'Amigo' THEN 1 END) as friend_links
FROM user_links 
WHERE link_specific_type = 'saude' AND deleted_at IS NULL
GROUP BY campaign, created_by;

-- View para estatísticas de links de 20
CREATE OR REPLACE VIEW v_user_links_20_stats AS
SELECT 
  campaign,
  created_by,
  COUNT(*) as total_links,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_links,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_links,
  SUM(current_uses) as total_uses,
  COUNT(CASE WHEN link_type = 'Membro' THEN 1 END) as member_links,
  COUNT(CASE WHEN link_type = 'Amigo' THEN 1 END) as friend_links
FROM user_links 
WHERE link_specific_type = '20' AND deleted_at IS NULL
GROUP BY campaign, created_by;

-- View para estatísticas de links normais
CREATE OR REPLACE VIEW v_user_links_normal_stats AS
SELECT 
  campaign,
  created_by,
  COUNT(*) as total_links,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_links,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_links,
  SUM(current_uses) as total_uses,
  COUNT(CASE WHEN link_type = 'Membro' THEN 1 END) as member_links,
  COUNT(CASE WHEN link_type = 'Amigo' THEN 1 END) as friend_links
FROM user_links 
WHERE link_specific_type = 'normal' AND deleted_at IS NULL
GROUP BY campaign, created_by;

-- =====================================================
-- 5. CRIAR FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar código de link único
CREATE OR REPLACE FUNCTION generate_unique_link_code()
RETURNS text AS $$
DECLARE
    new_code text;
    exists boolean;
BEGIN
    LOOP
        -- Gerar código aleatório de 8 caracteres
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM user_links WHERE link_code = new_code) INTO exists;
        
        -- Se não existe, retornar o código
        IF NOT exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. INSERIR LINKS DE EXEMPLO
-- =====================================================

-- Inserir links de exemplo para adminsaude
INSERT INTO user_links (
    user_id, link_code, link_type, created_by, description, 
    link_specific_type, specific_description, campaign
) VALUES (
    (SELECT id FROM auth_users WHERE username = 'adminsaude' LIMIT 1),
    generate_unique_link_code(),
    'Membro',
    'adminsaude',
    'Link de cadastro para membros individuais',
    'saude',
    'Link específico para cadastro de membros individuais (sem duplas)',
    'A'
) ON CONFLICT DO NOTHING;

-- Inserir links de exemplo para admin20
INSERT INTO user_links (
    user_id, link_code, link_type, created_by, description, 
    link_specific_type, specific_description, campaign
) VALUES (
    (SELECT id FROM auth_users WHERE username = 'admin20' LIMIT 1),
    generate_unique_link_code(),
    'Membro',
    'admin20',
    'Link de cadastro para duplas sem Instagram',
    '20',
    'Link específico para cadastro de duplas sem Instagram',
    'A'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. VERIFICAR IMPLEMENTAÇÃO
-- =====================================================

-- Verificar se a coluna foi adicionada
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_links' AND column_name = 'link_specific_type';

-- Verificar links criados
SELECT 
    link_code,
    created_by,
    link_type,
    link_specific_type,
    specific_description,
    is_active
FROM user_links 
WHERE created_by IN ('adminsaude', 'admin20')
ORDER BY created_by, link_specific_type;

-- Verificar estatísticas
SELECT 
    'saude' as tipo,
    COUNT(*) as total_links
FROM user_links 
WHERE link_specific_type = 'saude' AND deleted_at IS NULL
UNION ALL
SELECT 
    '20' as tipo,
    COUNT(*) as total_links
FROM user_links 
WHERE link_specific_type = '20' AND deleted_at IS NULL
UNION ALL
SELECT 
    'normal' as tipo,
    COUNT(*) as total_links
FROM user_links 
WHERE link_specific_type = 'normal' AND deleted_at IS NULL;

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN user_links.link_specific_type IS 'Tipo específico do link: normal, saude, 20';
COMMENT ON COLUMN user_links.specific_description IS 'Descrição específica do tipo de link';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- MODIFICAÇÕES:
-- - Adicionada coluna link_specific_type na tabela user_links
-- - Adicionada coluna specific_description na tabela user_links
-- - Criados índices para performance
-- - Criadas views de estatísticas específicas
-- - Criada função para gerar códigos únicos
-- - Inseridos links de exemplo
-- 
-- VANTAGENS:
-- - Reutiliza tabela existente
-- - Mantém compatibilidade com links normais
-- - Facilita manutenção
-- - Reduz complexidade
-- 
-- PRÓXIMOS PASSOS:
-- 1. Atualizar hooks para usar a tabela user_links
-- 2. Modificar lógica de geração de links
-- 3. Atualizar dashboard
-- 4. Testar funcionalidades
-- =====================================================