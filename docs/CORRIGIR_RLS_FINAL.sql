-- =====================================================
-- CORRIGIR RLS PARA FUNCIONAMENTO NORMAL DO SISTEMA
-- =====================================================

-- 1. Desabilitar RLS na tabela user_links
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can only see links from their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can see their campaign links and normal links" ON user_links;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_links;

-- 3. Verificar se RLS está desabilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DESABILITADO'
        ELSE '❌ RLS AINDA ATIVO'
    END as status
FROM pg_tables 
WHERE tablename = 'user_links';

-- 4. Verificar políticas restantes
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'user_links';

-- 5. Testar inserção de link
INSERT INTO user_links (
    user_id, 
    link_id, 
    referrer_name, 
    is_active, 
    click_count, 
    registration_count, 
    link_type
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'TESTE_RLS_' || extract(epoch from now())::text,
    'Teste RLS',
    true,
    0,
    0,
    'members'
) RETURNING id, link_id, created_at;

-- 6. Limpar teste
DELETE FROM user_links WHERE link_id LIKE 'TESTE_RLS_%';

-- 7. Verificar resultado
SELECT 
    'RLS Corrigido' as status,
    'Tabela user_links agora permite inserções' as descricao;
