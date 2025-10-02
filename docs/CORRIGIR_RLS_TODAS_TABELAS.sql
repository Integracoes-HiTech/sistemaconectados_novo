-- =====================================================
-- CORRIGIR RLS EM TODAS AS TABELAS PRINCIPAIS
-- =====================================================

-- 1. Desabilitar RLS em user_links
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- 2. Desabilitar RLS em members
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- 3. Desabilitar RLS em friends
ALTER TABLE friends DISABLE ROW LEVEL SECURITY;

-- 4. Desabilitar RLS em users (se existir)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 5. Desabilitar RLS em auth_users (se existir)
ALTER TABLE auth_users DISABLE ROW LEVEL SECURITY;

-- 6. Verificar status de todas as tabelas
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DESABILITADO'
        ELSE '❌ RLS ATIVO'
    END as status
FROM pg_tables 
WHERE tablename IN ('user_links', 'members', 'friends', 'users', 'auth_users')
ORDER BY tablename;

-- 7. Remover políticas de user_links
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

-- 8. Remover políticas de members
DROP POLICY IF EXISTS "Users can only see members from their campaign" ON members;
DROP POLICY IF EXISTS "Users can insert members in their campaign" ON members;
DROP POLICY IF EXISTS "Users can update members in their campaign" ON members;
DROP POLICY IF EXISTS "Users can delete members in their campaign" ON members;
DROP POLICY IF EXISTS "Enable read access for all users" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON members;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON members;

-- 9. Remover políticas de friends
DROP POLICY IF EXISTS "Users can only see friends from their campaign" ON friends;
DROP POLICY IF EXISTS "Users can insert friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Users can update friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Users can delete friends in their campaign" ON friends;
DROP POLICY IF EXISTS "Enable read access for all users" ON friends;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON friends;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON friends;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON friends;

-- 10. Verificar políticas restantes
SELECT 
    tablename,
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename IN ('user_links', 'members', 'friends', 'users', 'auth_users')
GROUP BY tablename
ORDER BY tablename;

-- 11. Testar inserções
DO $$
DECLARE
    test_user_id UUID;
    test_member_id UUID;
    test_friend_id UUID;
    test_link_id TEXT;
BEGIN
    -- Buscar usuário válido
    SELECT id INTO test_user_id 
    FROM auth_users 
    WHERE is_active = true 
        AND role IN ('admin', 'Administrador')
    LIMIT 1;
    
    -- Testar inserção de link
    test_link_id := 'TESTE_RLS_' || extract(epoch from now())::text;
    
    INSERT INTO user_links (
        user_id, link_id, referrer_name, is_active, 
        click_count, registration_count, link_type
    ) VALUES (
        test_user_id, test_link_id, 'Teste', true, 0, 0, 'members'
    );
    
    RAISE NOTICE '✅ Link inserido: %', test_link_id;
    
    -- Testar inserção de membro
    INSERT INTO members (
        name, phone, instagram, city, sector, referrer,
        registration_date, status, campaign,
        couple_name, couple_phone, couple_instagram, couple_city, couple_sector,
        contracts_completed, ranking_status, is_top_1500, can_be_replaced, is_friend
    ) VALUES (
        'Teste RLS Member', '62999999999', '@teste', 'Goiânia', 'Setor Central', 'Admin',
        CURRENT_DATE, 'Ativo', 'A',
        'Teste Cônjuge', '62988888888', '@testeconjuge', 'Goiânia', 'Setor Central',
        0, 'Vermelho', false, false, false
    ) RETURNING id INTO test_member_id;
    
    RAISE NOTICE '✅ Membro inserido: %', test_member_id;
    
    -- Testar inserção de amigo
    INSERT INTO friends (
        name, phone, instagram, city, sector, referrer,
        registration_date, status, campaign,
        couple_name, couple_phone, couple_instagram, couple_city, couple_sector,
        member_id, deleted_at
    ) VALUES (
        'Teste RLS Friend', '62977777777', '@teste', 'Goiânia', 'Setor Central', 'Admin',
        CURRENT_DATE, 'Ativo', 'A',
        'Teste Cônjuge', '62966666666', '@testeconjuge', 'Goiânia', 'Setor Central',
        test_member_id, null
    ) RETURNING id INTO test_friend_id;
    
    RAISE NOTICE '✅ Amigo inserido: %', test_friend_id;
    
    -- Limpar testes
    DELETE FROM friends WHERE id = test_friend_id;
    DELETE FROM members WHERE id = test_member_id;
    DELETE FROM user_links WHERE link_id = test_link_id;
    
    RAISE NOTICE '✅ Testes removidos com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro nos testes: %', SQLERRM;
END $$;

-- 12. Resultado final
SELECT 
    'RLS Corrigido' as status,
    'Todas as tabelas principais configuradas' as descricao;
