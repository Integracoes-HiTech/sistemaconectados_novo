-- =====================================================
-- MIGRAR PLANO_ID BASEADO NO NOME DO PLANO - CAMPAIGNS
-- Atualiza plano_id na tabela campaigns baseado no campo nome_plano
-- =====================================================

-- Verificar quantos registros precisam ser migrados (ANTES)
SELECT 
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN plano_id IS NULL AND nome_plano IS NOT NULL THEN 1 END) as campaigns_para_migrar,
    COUNT(CASE WHEN plano_id IS NOT NULL THEN 1 END) as campaigns_ja_migrados
FROM campaigns;

-- Verificar associações possíveis antes de migrar
SELECT 
    c.nome_plano AS nome_plano_campaign,
    pp.nome_plano AS nome_plano_tabela,
    pp.id AS plano_preco_id,
    COUNT(*) AS total_campaigns_match
FROM campaigns c
LEFT JOIN planos_precos pp ON LOWER(TRIM(c.nome_plano)) = LOWER(TRIM(pp.nome_plano))
GROUP BY c.nome_plano, pp.nome_plano, pp.id
ORDER BY c.nome_plano;

-- Atualizar plano_id baseado no nome do plano
UPDATE campaigns c
SET plano_id = pp.id
FROM planos_precos pp
WHERE LOWER(TRIM(c.nome_plano)) = LOWER(TRIM(pp.nome_plano))
AND c.plano_id IS NULL
AND c.nome_plano IS NOT NULL;

-- Verificar resultado da migração (DEPOIS)
SELECT 
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN plano_id IS NULL AND nome_plano IS NOT NULL THEN 1 END) as campaigns_ainda_sem_migrar,
    COUNT(CASE WHEN plano_id IS NOT NULL THEN 1 END) as campaigns_migrados
FROM campaigns;

-- Detalhar resultado por plano
SELECT 
    c.nome_plano AS nome_plano_campaign,
    pp.nome_plano AS nome_plano_tabela,
    pp.amount AS valor_plano,
    COUNT(*) AS total_campaigns,
    COUNT(CASE WHEN c.plano_id IS NOT NULL THEN 1 END) AS com_plano_id,
    COUNT(CASE WHEN c.plano_id IS NULL THEN 1 END) AS sem_plano_id
FROM campaigns c
LEFT JOIN planos_precos pp ON c.plano_id = pp.id
GROUP BY c.nome_plano, pp.nome_plano, pp.amount
ORDER BY c.nome_plano;

-- Listar campanhas que não foram migradas (plano não encontrado)
SELECT 
    id,
    name,
    code,
    nome_plano AS nome_plano_campaign,
    plano_id
FROM campaigns
WHERE nome_plano IS NOT NULL 
AND plano_id IS NULL
ORDER BY nome_plano;

-- Verificar se todos os nomes de plano na tabela campaigns existem na tabela planos_precos
SELECT DISTINCT 
    c.nome_plano AS nome_plano_campaigns,
    CASE 
        WHEN pp.id IS NOT NULL THEN 'Plano encontrado'
        ELSE 'Plano NÃO encontrado na tabela planos_precos'
    END AS status
FROM campaigns c
LEFT JOIN planos_precos pp ON LOWER(TRIM(c.nome_plano)) = LOWER(TRIM(pp.nome_plano))
WHERE c.nome_plano IS NOT NULL
ORDER BY c.nome_plano;

