-- =====================================================
-- DROP DAS TABELAS user_links_saude E user_links_20
-- =====================================================

-- Remover views dependentes primeiro
DROP VIEW IF EXISTS v_user_links_saude_stats CASCADE;
DROP VIEW IF EXISTS v_user_links_20_stats CASCADE;

-- Remover políticas RLS se existirem
DROP POLICY IF EXISTS "Users can only see links from their campaign" ON user_links_saude;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links_saude;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links_saude;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links_saude;

DROP POLICY IF EXISTS "Users can only see links from their campaign" ON user_links_20;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links_20;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links_20;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links_20;

-- Desabilitar RLS se estiver habilitado
ALTER TABLE IF EXISTS user_links_saude DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_links_20 DISABLE ROW LEVEL SECURITY;

-- Remover as tabelas
DROP TABLE IF EXISTS user_links_saude CASCADE;
DROP TABLE IF EXISTS user_links_20 CASCADE;

-- Verificar se as tabelas foram removidas
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('user_links_saude', 'user_links_20');

-- Se não retornar nenhuma linha, as tabelas foram removidas com sucesso
