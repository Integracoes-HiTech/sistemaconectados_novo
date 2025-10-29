-- =====================================================
-- MIGRAR CAMPAIGN_ID BASEADO NO CÓDIGO DA CAMPANHA
-- Atualiza campaign_id na tabela members baseado no campo campaign (código)
-- =====================================================

-- Verificar quantos registros precisam ser migrados
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as members_para_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as members_ja_migrados
FROM members;

-- Atualizar campaign_id baseado no código da campanha (campaign)
UPDATE members m
SET campaign_id = c.id
FROM campaigns c
WHERE m.campaign = c.code
AND m.campaign_id IS NULL
AND m.campaign IS NOT NULL;

-- Verificar resultado da migração
SELECT 
    m.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_membros,
    COUNT(CASE WHEN m.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN m.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM members m
LEFT JOIN campaigns c ON m.campaign = c.code
GROUP BY m.campaign, c.name
ORDER BY m.campaign;

-- Listar membros que não foram migrados (campanha não encontrada)
SELECT 
    id,
    name,
    campaign AS codigo_campanha,
    campaign_id
FROM members
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    m.campaign AS codigo_campanha_members,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM members m
LEFT JOIN campaigns c ON m.campaign = c.code
WHERE m.campaign IS NOT NULL
ORDER BY m.campaign;

