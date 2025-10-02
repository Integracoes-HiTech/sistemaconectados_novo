-- =====================================================
-- DESABILITAR RLS NA TABELA FRIENDS
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
WHERE tablename = 'friends';

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
WHERE tablename = 'friends';

-- 3. Remover todas as políticas
DROP POLICY IF EXISTS "Users can only see friends from their campaign" ON friends;
DROP POLICY IF EXISTS "Users can insert friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Users can update friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Users can delete friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Enable read access for all users" ON friends;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON friends;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON friends;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON friends;

-- 4. Desabilitar RLS
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'friends';

-- 6. Verificar se não há mais políticas
SELECT 
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'friends';

-- 7. Testar inserção de amigo
DO $$
DECLARE
    test_friend_id UUID;
    test_member_id UUID;
BEGIN
    -- Buscar um membro existente para usar como referrer
    SELECT id INTO test_member_id 
    FROM members 
    WHERE status = 'Ativo' 
        AND deleted_at IS NULL
    LIMIT 1;
    
    IF test_member_id IS NULL THEN
        RAISE NOTICE 'Nenhum membro encontrado para teste';
        RETURN;
    END IF;
    
    -- Inserir amigo de teste
    INSERT INTO friends (
        name, 
        phone, 
        instagram, 
        city, 
        sector, 
        referrer, 
        registration_date, 
        status, 
        campaign,
        couple_name, 
        couple_phone, 
        couple_instagram, 
        couple_city, 
        couple_sector,
        member_id,
        deleted_at
    ) VALUES (
        'Teste RLS Friend',
        '62999999999',
        '@teste',
        'Goiânia',
        'Setor Central',
        'Admin',
        CURRENT_DATE,
        'Ativo',
        'A',
        'Teste Cônjuge',
        '62988888888',
        '@testeconjuge',
        'Goiânia',
        'Setor Central',
        test_member_id,
        null
    ) RETURNING id INTO test_friend_id;
    
    -- Mostrar resultado
    RAISE NOTICE '✅ Amigo de teste inserido com sucesso: %', test_friend_id;
    
    -- Limpar teste
    DELETE FROM friends WHERE id = test_friend_id;
    
    RAISE NOTICE '✅ Amigo de teste removido com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao testar inserção: %', SQLERRM;
END $$;

-- 8. Resultado final
SELECT 
    'RLS Desabilitado' as status,
    'Tabela friends agora permite inserções' as descricao;
