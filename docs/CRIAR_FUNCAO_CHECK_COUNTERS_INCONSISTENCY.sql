-- =====================================================
-- CRIAR FUNÇÃO CHECK_COUNTERS_INCONSISTENCY
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

-- 2. Testar a função
SELECT 
    'Função criada' as status,
    'check_counters_inconsistency' as function_name;

-- 3. Executar a função para verificar inconsistências
SELECT 
    member_name,
    contracts_completed,
    friends_count,
    status_mismatch
FROM check_counters_inconsistency()
ORDER BY member_name;

-- 4. Contar inconsistências
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN status_mismatch = true THEN 1 END) as inconsistent_members,
    COUNT(CASE WHEN status_mismatch = false THEN 1 END) as consistent_members
FROM check_counters_inconsistency();

-- 5. Verificar se há inconsistências
SELECT 
    CASE 
        WHEN COUNT(CASE WHEN status_mismatch = true THEN 1 END) = 0 THEN '✅ Nenhuma inconsistência encontrada'
        ELSE '⚠️ ' || COUNT(CASE WHEN status_mismatch = true THEN 1 END) || ' inconsistências encontradas'
    END as status
FROM check_counters_inconsistency();
