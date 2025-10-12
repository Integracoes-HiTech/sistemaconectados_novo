-- =====================================================
-- VERIFICAR TRIGGERS E FUNÇÕES ATIVAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Listar TODOS os triggers nas tabelas members, users, friends, auth_users
SELECT 
    trigger_name,
    event_object_table as tabela,
    action_timing as quando,
    event_manipulation as acao,
    action_statement as funcao
FROM information_schema.triggers 
WHERE event_object_table IN ('members', 'users', 'friends', 'auth_users')
ORDER BY event_object_table, trigger_name;

-- 2. Listar TODAS as funções que mencionam 'plano' ou 'preco'
SELECT 
    routine_name as nome_funcao,
    routine_type as tipo,
    routine_definition as definicao
FROM information_schema.routines
WHERE routine_name LIKE '%plano%' 
   OR routine_name LIKE '%preco%'
   OR routine_definition LIKE '%plano_preco_id%';

-- 3. Verificar estrutura EXATA da tabela members
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'members'
ORDER BY ordinal_position;

-- 4. Verificar estrutura EXATA da tabela users
SELECT 
    column_name as coluna,
    data_type as tipo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Verificar constraints (restrições) nas tabelas
SELECT
    tc.table_name as tabela,
    tc.constraint_name as restricao,
    tc.constraint_type as tipo,
    kcu.column_name as coluna
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('members', 'users', 'friends', 'auth_users')
ORDER BY tc.table_name, tc.constraint_type;

