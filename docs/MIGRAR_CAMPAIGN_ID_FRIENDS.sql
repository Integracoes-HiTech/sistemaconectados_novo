-- =====================================================
-- MIGRAR CAMPAIGN_ID BASEADO NO CÓDIGO DA CAMPANHA - FRIENDS
-- Atualiza campaign_id na tabela friends baseado no campo campaign (código)
-- =====================================================

-- Verificar quantos registros precisam ser migrados (ANTES)
SELECT 
    COUNT(*) as total_friends,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as friends_para_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as friends_ja_migrados
FROM friends;

-- Atualizar campaign_id baseado no código da campanha (campaign)
UPDATE friends f
SET campaign_id = c.id
FROM campaigns c
WHERE f.campaign = c.code
AND f.campaign_id IS NULL
AND f.campaign IS NOT NULL;

-- Verificar resultado da migração (DEPOIS)
SELECT 
    COUNT(*) as total_friends,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as friends_ainda_sem_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as friends_migrados
FROM friends;

-- Detalhar resultado por campanha
SELECT 
    f.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_friends,
    COUNT(CASE WHEN f.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN f.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM friends f
LEFT JOIN campaigns c ON f.campaign = c.code
GROUP BY f.campaign, c.name
ORDER BY f.campaign;

-- Listar friends que não foram migrados (campanha não encontrada)
SELECT 
    id,
    name,
    campaign AS codigo_campanha,
    campaign_id
FROM friends
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    f.campaign AS codigo_campanha_friends,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM friends f
LEFT JOIN campaigns c ON f.campaign = c.code
WHERE f.campaign IS NOT NULL
ORDER BY f.campaign;

