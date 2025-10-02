-- =====================================================
-- DESABILITAR RLS NA TABELA USER_LINKS
-- =====================================================

-- 1. Verificar status atual do RLS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DESABILITADO'
        ELSE '❌ RLS ATIVO'
    END as status
FROM pg_tables 
WHERE tablename = 'user_links';

-- 2. Listar políticas existentes
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

-- 3. Remover todas as políticas
DROP POLICY IF EXISTS "Users can only see links from their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can see their campaign links and normal links" ON user_links;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON user_links;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_links;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_links;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_links;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_links;

-- 4. Desabilitar RLS
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- 5. Verificar se RLS foi desabilitado
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

-- 6. Verificar se não há mais políticas
SELECT 
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'user_links';

-- 7. Testar inserção com usuário válido
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
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'Nenhum usuário administrador encontrado';
        RETURN;
    END IF;
    
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
    RAISE NOTICE '✅ Link de teste inserido com sucesso: %', test_link_id;
    
    -- Limpar teste
    DELETE FROM user_links WHERE link_id = test_link_id;
    
    RAISE NOTICE '✅ Link de teste removido com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao testar inserção: %', SQLERRM;
END $$;

-- 8. Resultado final
SELECT 
    'RLS Desabilitado' as status,
    'Tabela user_links agora permite inserções' as descricao;
