-- Script para testar cadastro de membros no plano Profissional

-- 1. Verificar campanhas com plano Profissional
SELECT 
    code,
    name,
    nome_plano,
    plano_id,
    primary_color,
    secondary_color,
    is_active
FROM campaigns 
WHERE nome_plano ILIKE '%profissional%'
ORDER BY created_at DESC;

-- 2. Verificar quantos membros existem por campanha
SELECT 
    campaign,
    COUNT(*) as total_membros,
    COUNT(*) FILTER (WHERE status = 'Ativo') as membros_ativos,
    COUNT(*) FILTER (WHERE status = 'Inativo') as membros_inativos
FROM members 
WHERE deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;

-- 3. Verificar se há algum problema com RLS policies na tabela members
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
WHERE tablename = 'members'
ORDER BY policyname;

-- 4. Verificar se há triggers ativos na tabela members
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'members'
ORDER BY trigger_name;

-- 5. Testar inserção manual de um membro (substitua os valores pelos da sua campanha)
-- DESCOMENTE E AJUSTE OS VALORES ABAIXO PARA TESTAR:
/*
INSERT INTO members (
    name,
    phone,
    instagram,
    cep,
    city,
    sector,
    referrer,
    registration_date,
    status,
    couple_name,
    couple_phone,
    couple_instagram,
    couple_cep,
    couple_city,
    couple_sector,
    contracts_completed,
    ranking_status,
    is_top_1500,
    can_be_replaced,
    is_friend,
    campaign,
    created_at,
    updated_at
) VALUES (
    'Teste Profissional',
    '11999999999',
    '@teste_profissional',
    '01234567',
    'São Paulo',
    'Centro',
    'admin_profissional', -- Substitua pelo referrer correto
    NOW(),
    'Ativo',
    'Parceiro Teste',
    '11888888888',
    '@parceiro_teste',
    '01234567',
    'São Paulo',
    'Centro',
    0,
    'Vermelho',
    false,
    false,
    false,
    'PROFISSIONAL', -- Substitua pelo código da campanha Profissional
    NOW(),
    NOW()
);
*/

-- 6. Verificar se a inserção funcionou
-- SELECT * FROM members WHERE name = 'Teste Profissional';

-- 7. Limpar o teste (descomente se necessário)
-- DELETE FROM members WHERE name = 'Teste Profissional';
