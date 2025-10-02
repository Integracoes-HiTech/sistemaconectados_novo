-- =====================================================
-- CRIAR FUNÇÕES DE CONTADORES (VERSÃO FINAL)
-- =====================================================

-- 1. Criar função para verificar inconsistências nos contadores
CREATE OR REPLACE FUNCTION check_counters_inconsistency()
RETURNS TABLE (
    member_name TEXT,
    contracts_completed INTEGER,
    friends_count INTEGER,
    status_mismatch BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name::TEXT,
        m.contracts_completed,
        COALESCE(f.friends_count, 0)::INTEGER,
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
    WHERE m.status = 'Ativo' 
    AND m.deleted_at IS NULL
    ORDER BY m.name;
END;
$$;

-- 2. Criar função para corrigir inconsistências nos contadores
CREATE OR REPLACE FUNCTION fix_counters_inconsistency()
RETURNS TABLE (
    member_name TEXT,
    old_contracts_completed INTEGER,
    new_contracts_completed INTEGER,
    action_taken TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inconsistency_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Corrigir inconsistências na tabela members (contracts_completed)
    FOR inconsistency_record IN
        SELECT 
            m.id,
            m.name,
            m.contracts_completed,
            COALESCE(f.friends_count, 0) as expected_contracts
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
        WHERE m.status = 'Ativo' 
            AND m.deleted_at IS NULL
            AND m.contracts_completed != COALESCE(f.friends_count, 0)
    LOOP
        -- Atualizar contracts_completed
        UPDATE members 
        SET 
            contracts_completed = inconsistency_record.expected_contracts,
            updated_at = NOW()
        WHERE id = inconsistency_record.id;
        
        -- Retornar informação da correção
        RETURN QUERY SELECT 
            inconsistency_record.name::TEXT,
            inconsistency_record.contracts_completed,
            inconsistency_record.expected_contracts,
            'updated'::TEXT;
        
        updated_count := updated_count + 1;
    END LOOP;

    -- Se não houve correções, retornar mensagem
    IF updated_count = 0 THEN
        RETURN QUERY SELECT 
            'Nenhuma inconsistência encontrada'::TEXT,
            0,
            0,
            'no_action_needed'::TEXT;
    END IF;

END;
$$;

-- 3. Testar as funções
SELECT 
    'Funções criadas' as status,
    'check_counters_inconsistency e fix_counters_inconsistency' as function_names;

-- 4. Executar verificação de inconsistências
SELECT 
    member_name,
    contracts_completed,
    friends_count,
    status_mismatch
FROM check_counters_inconsistency()
ORDER BY member_name;

-- 5. Contar inconsistências
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN status_mismatch = true THEN 1 END) as inconsistent_members,
    COUNT(CASE WHEN status_mismatch = false THEN 1 END) as consistent_members
FROM check_counters_inconsistency();

-- 6. Verificar se há inconsistências
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN status_mismatch = true THEN 1 END) = 0 THEN '✅ Nenhuma inconsistência encontrada'
        ELSE '⚠️ ' || COUNT(CASE WHEN status_mismatch = true THEN 1 END) || ' inconsistências encontradas'
    END as status
FROM check_counters_inconsistency();

-- 7. Executar correção de inconsistências (se necessário)
-- SELECT * FROM fix_counters_inconsistency();

-- 8. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('check_counters_inconsistency', 'fix_counters_inconsistency')
    AND routine_schema = 'public';

-- 9. Verificar tipos de dados da tabela members
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name IN ('name', 'contracts_completed')
ORDER BY column_name;
