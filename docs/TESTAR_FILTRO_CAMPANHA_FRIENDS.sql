-- =====================================================
-- TESTAR FILTRO POR CAMPANHA NA TABELA FRIENDS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar quantos amigos existem por campanha
SELECT 
    campaign,
    COUNT(*) as total_friends,
    COUNT(*) FILTER (WHERE status = 'Ativo') as amigos_ativos,
    COUNT(*) FILTER (WHERE status = 'Inativo') as amigos_inativos
FROM friends 
GROUP BY campaign
ORDER BY campaign;

-- 2. Verificar se há amigos sem campanha (NULL)
SELECT 
    'Sem campanha' as status_campanha,
    COUNT(*) as total
FROM friends 
WHERE campaign IS NULL
UNION ALL
SELECT 
    'Com campanha' as status_campanha,
    COUNT(*) as total
FROM friends 
WHERE campaign IS NOT NULL;

-- 3. Verificar dados específicos de uma campanha (substitua 'B' pela campanha que você quer testar)
SELECT 
    id,
    campaign,
    status,
    name,
    couple_name,
    couple_phone,
    created_at
FROM friends 
WHERE campaign = 'B'  -- Substitua pela campanha que você quer testar
ORDER BY created_at DESC
LIMIT 10;

-- 4. Verificar se há inconsistências nos dados
SELECT 
    'Amigos com status diferente de Ativo/Inativo' as problema,
    status,
    COUNT(*) as total
FROM friends 
WHERE status NOT IN ('Ativo', 'Inativo')
GROUP BY status
UNION ALL
SELECT 
    'Amigos sem member_id' as problema,
    'NULL' as status,
    COUNT(*) as total
FROM friends 
WHERE member_id IS NULL;

-- 5. Verificar se o JOIN com members está funcionando
SELECT 
    f.id,
    f.campaign as friend_campaign,
    f.name as friend_name,
    m.campaign as member_campaign,
    m.name as member_name
FROM friends f
LEFT JOIN members m ON f.member_id = m.id
WHERE f.campaign = 'B'  -- Substitua pela campanha que você quer testar
LIMIT 5;
