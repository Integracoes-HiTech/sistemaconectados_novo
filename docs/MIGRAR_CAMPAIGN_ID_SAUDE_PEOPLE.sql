-- =====================================================
-- MIGRAR CAMPAIGN_ID BASEADO NO CÓDIGO DA CAMPANHA
-- Atualiza campaign_id na tabela people baseado no campo campaign (código)
-- =====================================================

-- Verificar quantos registros precisam ser migrados
SELECT 
    COUNT(*) as total_people,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as people_para_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as people_ja_migrados
FROM people;

-- Atualizar campaign_id baseado no código da campanha (campaign)
UPDATE people p
SET campaign_id = c.id
FROM campaigns c
WHERE p.campaign = c.code
AND p.campaign_id IS NULL
AND p.campaign IS NOT NULL;

-- Verificar resultado da migração
SELECT 
    p.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_people,
    COUNT(CASE WHEN p.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN p.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM people p
LEFT JOIN campaigns c ON p.campaign = c.code
GROUP BY p.campaign, c.name
ORDER BY p.campaign;

-- Listar pessoas que não foram migradas (campanha não encontrada)
SELECT 
    id,
    lider_nome_completo,
    pessoa_nome_completo,
    campaign AS codigo_campanha,
    campaign_id
FROM people
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    p.campaign AS codigo_campanha_people,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM people p
LEFT JOIN campaigns c ON p.campaign = c.code
WHERE p.campaign IS NOT NULL
ORDER BY p.campaign;

