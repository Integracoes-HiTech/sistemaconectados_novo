-- =====================================================
-- CRIAR FUNÇÃO FIX_COUNTERS_INCONSISTENCY (CORRIGIDA)
-- =====================================================

-- 1. Criar função para corrigir inconsistências nos contadores
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

-- 2. Testar a função
SELECT 
    'Função criada' as status,
    'fix_counters_inconsistency' as function_name;

-- 3. Executar a função para corrigir inconsistências
SELECT 
    member_name,
    old_contracts_completed,
    new_contracts_completed,
    action_taken
FROM fix_counters_inconsistency()
ORDER BY member_name;

-- 4. Verificar se as correções foram aplicadas
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN status_mismatch = true THEN 1 END) = 0 THEN '✅ Todas as inconsistências foram corrigidas'
        ELSE '⚠️ ' || COUNT(CASE WHEN status_mismatch = true THEN 1 END) || ' inconsistências ainda existem'
    END as status
FROM check_counters_inconsistency();

-- 5. Verificar tipos de dados
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name = 'name';

-- 6. Verificar estrutura da função
SELECT 
    p.parameter_name,
    p.data_type,
    p.parameter_mode,
    r.routine_name
FROM information_schema.parameters p
JOIN information_schema.routines r ON p.specific_name = r.specific_name
WHERE r.routine_name = 'fix_counters_inconsistency';
