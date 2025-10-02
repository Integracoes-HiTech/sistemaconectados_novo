-- =====================================================
-- CRIAR FUNÇÃO GET_USER_STATS
-- =====================================================

-- 1. Criar função para obter estatísticas do usuário
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    recent_registrations BIGINT,
    engagement_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(u.id) as total_users,
        COUNT(CASE WHEN u.status = 'Ativo' THEN 1 END) as active_users,
        COUNT(CASE WHEN u.registration_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_registrations,
        CASE 
            WHEN COUNT(u.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN u.status = 'Ativo' THEN 1 END)::DECIMAL / COUNT(u.id)) * 100, 1)
            ELSE 0 
        END as engagement_rate
    FROM auth_users au
    LEFT JOIN users u ON au.full_name = u.referrer
    WHERE au.id = user_id_param;
END;
$$;

-- 2. Testar a função
SELECT 
    'Função criada' as status,
    'get_user_stats' as function_name;

-- 3. Executar a função para testar
-- (Substitua o UUID pelo ID de um usuário existente)
SELECT 
    total_users,
    active_users,
    recent_registrations,
    engagement_rate
FROM get_user_stats('00000000-0000-0000-0000-000000000000'::UUID);

-- 4. Verificar se a função foi criada
SELECT 
    routine_name,
    routine_type,
    data_type,
    parameter_name,
    parameter_mode
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'get_user_stats'
    AND r.routine_schema = 'public';

-- 5. Verificar estrutura das tabelas
SELECT 
    'auth_users' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'auth_users' 
    AND column_name IN ('id', 'full_name')

UNION ALL

SELECT 
    'users' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name IN ('id', 'status', 'registration_date', 'referrer')
ORDER BY table_name, column_name;

-- 6. Testar com usuário real (se existir)
DO $$
DECLARE
    test_user_id UUID;
    stats_result RECORD;
BEGIN
    -- Buscar um usuário existente
    SELECT id INTO test_user_id 
    FROM auth_users 
    WHERE is_active = true 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Executar função com usuário real
        SELECT * INTO stats_result 
        FROM get_user_stats(test_user_id);
        
        RAISE NOTICE 'Teste com usuário real:';
        RAISE NOTICE '  Total users: %', stats_result.total_users;
        RAISE NOTICE '  Active users: %', stats_result.active_users;
        RAISE NOTICE '  Recent registrations: %', stats_result.recent_registrations;
        RAISE NOTICE '  Engagement rate: %', stats_result.engagement_rate;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
END $$;
