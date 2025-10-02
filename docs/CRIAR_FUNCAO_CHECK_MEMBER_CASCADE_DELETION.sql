-- =====================================================
-- CRIAR FUNÇÃO CHECK_MEMBER_CASCADE_DELETION
-- =====================================================

-- 1. Criar função para verificar exclusão em cascata de membro
CREATE OR REPLACE FUNCTION check_member_cascade_deletion(member_id UUID)
RETURNS TABLE (
    member_name TEXT,
    current_contracts INTEGER,
    actual_friends INTEGER,
    status_mismatch BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name::TEXT as member_name,
        m.contracts_completed as current_contracts,
        COALESCE(f.friends_count, 0)::INTEGER as actual_friends,
        (m.contracts_completed != COALESCE(f.friends_count, 0)) AS status_mismatch
    FROM members m
    LEFT JOIN (
        SELECT 
            referrer,
            COUNT(*) as friends_count
        FROM friends 
        WHERE status = 'Ativo' 
        AND deleted_at IS NULL
        GROUP BY referrer
    ) f ON m.name = f.referrer
    WHERE m.id = member_id
    AND m.status = 'Ativo' 
    AND m.deleted_at IS NULL;
END;
$$;

-- 2. Testar a função
SELECT 
    'Função criada' as status,
    'check_member_cascade_deletion' as function_name;

-- 3. Verificar se a função foi criada
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'check_member_cascade_deletion'
    AND routine_schema = 'public';

-- 4. Verificar estrutura das tabelas
SELECT 
    'members' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name IN ('id', 'name', 'contracts_completed', 'status', 'deleted_at')
ORDER BY column_name;

-- 5. Verificar estrutura da tabela friends
SELECT 
    'friends' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'friends' 
    AND column_name IN ('referrer', 'status', 'deleted_at')
ORDER BY column_name;

-- 6. Testar com membro real (se existir)
DO $$
DECLARE
    test_member_id UUID;
    cascade_result RECORD;
BEGIN
    -- Buscar um membro existente
    SELECT id INTO test_member_id 
    FROM members 
    WHERE status = 'Ativo' 
        AND deleted_at IS NULL
    LIMIT 1;
    
    IF test_member_id IS NOT NULL THEN
        -- Executar função com membro real
        SELECT * INTO cascade_result 
        FROM check_member_cascade_deletion(test_member_id);
        
        RAISE NOTICE 'Teste com membro real:';
        RAISE NOTICE '  Member name: %', cascade_result.member_name;
        RAISE NOTICE '  Current contracts: %', cascade_result.current_contracts;
        RAISE NOTICE '  Actual friends: %', cascade_result.actual_friends;
        RAISE NOTICE '  Status mismatch: %', cascade_result.status_mismatch;
    ELSE
        RAISE NOTICE 'Nenhum membro encontrado para teste';
    END IF;
END $$;

-- 8. Executar função para testar (substitua pelo UUID real)
-- SELECT * FROM check_member_cascade_deletion('00000000-0000-0000-0000-000000000000'::UUID);
