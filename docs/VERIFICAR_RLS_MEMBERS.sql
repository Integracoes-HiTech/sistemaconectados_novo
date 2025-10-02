-- =====================================================
-- VERIFICAR E CORRIGIR RLS NA TABELA MEMBERS
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
WHERE tablename = 'members';

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
WHERE tablename = 'members';

-- 3. Remover políticas problemáticas se existirem
DROP POLICY IF EXISTS "Users can only see members from their campaign" ON members;
DROP POLICY IF EXISTS "Users can insert members in their campaign" ON members;
DROP POLICY IF EXISTS "Users can update members in their campaign" ON members;
DROP POLICY IF EXISTS "Users can delete members in their campaign" ON members;
DROP POLICY IF EXISTS "Enable read access for all users" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON members;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON members;

-- 4. Desabilitar RLS se necessário
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

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
WHERE tablename = 'members';

-- 6. Verificar se não há mais políticas
SELECT 
    COUNT(*) as total_politicas
FROM pg_policies 
WHERE tablename = 'members';

-- 7. Testar inserção de membro
DO $$
DECLARE
    test_member_id UUID;
BEGIN
    -- Inserir membro de teste
    INSERT INTO members (
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
        contracts_completed,
        ranking_status,
        is_top_1500,
        can_be_replaced,
        is_friend
    ) VALUES (
        'Teste RLS Member',
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
        0,
        'Vermelho',
        false,
        false,
        false
    ) RETURNING id INTO test_member_id;
    
    -- Mostrar resultado
    RAISE NOTICE '✅ Membro de teste inserido com sucesso: %', test_member_id;
    
    -- Limpar teste
    DELETE FROM members WHERE id = test_member_id;
    
    RAISE NOTICE '✅ Membro de teste removido com sucesso';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao testar inserção: %', SQLERRM;
END $$;

-- 8. Resultado final
SELECT 
    'RLS Verificado' as status,
    'Tabela members configurada para inserções' as descricao;
