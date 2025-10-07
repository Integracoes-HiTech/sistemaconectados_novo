-- =====================================================
-- INSERT ADMIN3 - ADMINISTRADOR SAÚDE
-- =====================================================

INSERT INTO auth_users (
    id,
    username,
    password,
    name,
    role,
    full_name,
    display_name,
    campaign,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin3',
    'admin3123',
    'Admin Saúde',
    'admin3',
    'Admin Saúde - Administrador Campanha Saúde',
    'Admin Saúde',
    'A',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se o admin3 foi criado
SELECT 
    username,
    name,
    role,
    campaign,
    is_active,
    created_at
FROM auth_users 
WHERE username = 'admin3';
