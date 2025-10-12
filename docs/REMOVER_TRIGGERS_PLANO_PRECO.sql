-- =====================================================
-- REMOVER TRIGGERS E FUNÇÕES DE PLANO_PRECO_ID
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Remover todos os triggers relacionados a plano_preco_id
DROP TRIGGER IF EXISTS trigger_vincular_plano_auth_users ON auth_users;
DROP TRIGGER IF EXISTS trigger_vincular_plano_members ON members;
DROP TRIGGER IF EXISTS trigger_vincular_plano_friends ON friends;
DROP TRIGGER IF EXISTS trigger_vincular_plano_users ON users;

-- 2. Remover a função que vincula plano_preco_id
DROP FUNCTION IF EXISTS vincular_plano_ao_usuario() CASCADE;

-- 3. Verificar se os triggers foram removidos
SELECT 
    trigger_name, 
    event_object_table, 
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%plano%'
ORDER BY event_object_table;

-- 4. Verificar se a função foi removida
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%plano%'
ORDER BY routine_name;

