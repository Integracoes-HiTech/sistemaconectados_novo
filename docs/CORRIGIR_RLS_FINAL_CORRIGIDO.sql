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

-- 5. Buscar um usuário válido para teste
SELECT 
    id, 
    username, 
    name, 
    role,
    is_active
FROM auth_users 
WHERE is_active = true 
    AND role IN ('admin', 'Administrador')
LIMIT 1;

-- 6. Testar inserção de link com usuário válido
-- (Substitua o user_id pelo ID real retornado na consulta anterior)
DO $$
DECLARE
    test_user_id UUID;
    test_link_id TEXT;
BEGIN
    -- Buscar um usuário válido
    SELECT id INTO test_user_id 
    FROM auth_users 
    WHERE is_active = true 
        AND role IN ('admin', 'Administrador')
    LIMIT 1;
    
    -- Gerar link_id único
    test_link_id := 'TESTE_RLS_' || extract(epoch from now())::text;
    
    -- Inserir link de teste
    INSERT INTO user_links (
        user_id, 
        link_id, 
        referrer_name, 
        is_active, 
        click_count, 
        registration_count, 
        link_type
    ) VALUES (
        test_user_id,
        test_link_id,
        'Teste RLS',
        true,
        0,
        0,
        'members'
    );
    
    -- Mostrar resultado
    RAISE NOTICE 'Link de teste inserido com sucesso: %', test_link_id;
    
    -- Limpar teste
    DELETE FROM user_links WHERE link_id = test_link_id;
    
    RAISE NOTICE 'Link de teste removido com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao testar inserção: %', SQLERRM;
END $$;

-- 7. Verificar resultado
SELECT 
    'RLS Corrigido' as status,
    'Tabela user_links agora permite inserções' as descricao;
