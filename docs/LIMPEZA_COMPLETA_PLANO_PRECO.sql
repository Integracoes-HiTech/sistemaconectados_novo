-- =====================================================
-- LIMPEZA COMPLETA: REMOVER TUDO RELACIONADO A PLANO_PRECO_ID
-- Execute este script COMPLETO no Supabase SQL Editor
-- =====================================================

-- PASSO 1: Remover todos os triggers
DROP TRIGGER IF EXISTS trigger_vincular_plano_auth_users ON auth_users CASCADE;
DROP TRIGGER IF EXISTS trigger_vincular_plano_members ON members CASCADE;
DROP TRIGGER IF EXISTS trigger_vincular_plano_friends ON friends CASCADE;
DROP TRIGGER IF EXISTS trigger_vincular_plano_users ON users CASCADE;

-- PASSO 2: Remover a função
DROP FUNCTION IF EXISTS vincular_plano_ao_usuario() CASCADE;

-- PASSO 3: Remover todos os índices
DROP INDEX IF EXISTS idx_auth_users_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_members_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_friends_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_users_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_user_links_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_campaigns_plano_preco_id CASCADE;
DROP INDEX IF EXISTS idx_auth_users_campaign_plano CASCADE;
DROP INDEX IF EXISTS idx_members_campaign_plano CASCADE;
DROP INDEX IF EXISTS idx_friends_campaign_plano CASCADE;
DROP INDEX IF EXISTS idx_users_campaign_plano CASCADE;
DROP INDEX IF EXISTS idx_user_links_campaign_plano CASCADE;
DROP INDEX IF EXISTS idx_campaigns_code_plano CASCADE;

-- PASSO 4: Remover colunas (SE AINDA EXISTIREM)
-- Descomente as linhas abaixo APENAS se as colunas ainda existirem
-- ALTER TABLE auth_users DROP COLUMN IF EXISTS plano_preco_id CASCADE;
-- ALTER TABLE members DROP COLUMN IF EXISTS plano_preco_id CASCADE;
-- ALTER TABLE friends DROP COLUMN IF EXISTS plano_preco_id CASCADE;
-- ALTER TABLE users DROP COLUMN IF EXISTS plano_preco_id CASCADE;
-- ALTER TABLE user_links DROP COLUMN IF EXISTS plano_preco_id CASCADE;
-- ALTER TABLE campaigns DROP COLUMN IF EXISTS plano_preco_id CASCADE;

-- PASSO 5: Verificação final - deve retornar 0 linhas
SELECT 'Triggers restantes:' as tipo, trigger_name as nome
FROM information_schema.triggers 
WHERE trigger_name LIKE '%plano%'
UNION ALL
SELECT 'Funções restantes:', routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%plano%'
UNION ALL
SELECT 'Índices restantes:', indexname
FROM pg_indexes
WHERE indexname LIKE '%plano%';

-- PASSO 6: Verificar se as colunas foram removidas - deve retornar 0 linhas
SELECT table_name, column_name
FROM information_schema.columns 
WHERE column_name = 'plano_preco_id'
AND table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links', 'campaigns');

