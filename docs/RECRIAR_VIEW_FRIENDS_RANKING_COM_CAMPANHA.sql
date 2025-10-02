-- =====================================================
-- RECRIAR VIEW v_friends_ranking COM COLUNA CAMPAIGN
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- A view v_friends_ranking não tem a coluna "campaign"
-- Isso impede o filtro por campanha no hook useFriendsRanking
-- Causando vazamento de dados entre campanhas

-- =====================================================
-- SOLUÇÃO: RECRIAR VIEW COM COLUNA CAMPAIGN
-- =====================================================

-- Dropar a view existente
DROP VIEW IF EXISTS v_friends_ranking;

-- Recriar a view incluindo a coluna campaign
CREATE VIEW v_friends_ranking AS
SELECT 
    f.id,
    f.member_id,
    f.name,
    f.phone,
    f.instagram,
    f.city,
    f.sector,
    f.referrer,
    f.registration_date,
    f.status,
    f.couple_name,
    f.couple_phone,
    f.couple_instagram,
    f.couple_city,
    f.couple_sector,
    f.contracts_completed,
    f.ranking_position,
    f.ranking_status,
    f.is_top_1500,
    f.can_be_replaced,
    f.post_verified_1,
    f.post_verified_2,
    f.post_url_1,
    f.post_url_2,
    f.created_at,
    f.updated_at,
    f.campaign, -- ← COLUNA ADICIONADA
    -- Dados do membro que cadastrou
    m.name as member_name,
    m.instagram as member_instagram,
    m.phone as member_phone,
    m.city as member_city,
    m.sector as member_sector
FROM friends f
LEFT JOIN members m ON f.member_id = m.id
WHERE f.status = 'Ativo' 
  AND f.deleted_at IS NULL
  AND m.status = 'Ativo' 
  AND m.deleted_at IS NULL;

-- =====================================================
-- TESTAR A VIEW RECRIADA
-- =====================================================

-- Verificar se a view foi criada corretamente
SELECT 
    name, 
    couple_name, 
    referrer, 
    campaign,
    member_name
FROM v_friends_ranking 
ORDER BY created_at DESC;

-- =====================================================
-- TESTAR FILTRO POR CAMPANHA
-- =====================================================

-- Testar filtro por Campanha A
SELECT 
    name, 
    couple_name, 
    referrer, 
    campaign,
    member_name
FROM v_friends_ranking 
WHERE campaign = 'A'
ORDER BY created_at DESC;

-- Testar filtro por Campanha B
SELECT 
    name, 
    couple_name, 
    referrer, 
    campaign,
    member_name
FROM v_friends_ranking 
WHERE campaign = 'B'
ORDER BY created_at DESC;

-- =====================================================
-- VERIFICAR ESTRUTURA DA VIEW
-- =====================================================

-- Verificar colunas da view
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'v_friends_ranking' 
ORDER BY ordinal_position;
