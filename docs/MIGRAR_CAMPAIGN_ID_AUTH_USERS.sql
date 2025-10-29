-- =====================================================
-- MIGRAR CAMPAIGN_ID BASEADO NO CÓDIGO DA CAMPANHA - AUTH_USERS
-- Atualiza campaign_id na tabela auth_users baseado no campo campaign (código)
-- =====================================================

-- Verificar quantos registros precisam ser migrados (ANTES)
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as users_para_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as users_ja_migrados
FROM auth_users;

-- Atualizar campaign_id baseado no código da campanha (campaign)
UPDATE auth_users au
SET campaign_id = c.id
FROM campaigns c
WHERE au.campaign = c.code
AND au.campaign_id IS NULL
AND au.campaign IS NOT NULL;

-- Verificar resultado da migração (DEPOIS)
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as users_ainda_sem_migrar,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as users_migrados
FROM auth_users;

-- Detalhar resultado por campanha
SELECT 
    au.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_usuarios,
    COUNT(CASE WHEN au.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN au.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM auth_users au
LEFT JOIN campaigns c ON au.campaign = c.code
GROUP BY au.campaign, c.name
ORDER BY au.campaign;

-- Listar usuários que não foram migrados (campanha não encontrada)
SELECT 
    id,
    username,
    name,
    campaign AS codigo_campanha,
    campaign_id
FROM auth_users
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    au.campaign AS codigo_campanha_auth_users,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM auth_users au
LEFT JOIN campaigns c ON au.campaign = c.code
WHERE au.campaign IS NOT NULL
ORDER BY au.campaign;

