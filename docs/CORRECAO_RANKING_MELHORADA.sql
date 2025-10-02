-- =====================================================
-- CORREÇÃO MELHORADA DO RANKING POR CAMPANHA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMAS IDENTIFICADOS:
-- =====================================================
-- 1. Trigger não está funcionando adequadamente
-- 2. Membros podem ficar com posições incorretas
-- 3. Não está recalculando após inserções
-- 4. Possíveis duplicações de membros

-- =====================================================
-- SOLUÇÃO MELHORADA E ROBUSTA
-- =====================================================

-- 1. Limpar dados duplicados primeiro
DELETE FROM members WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY name, phone ORDER BY created_at DESC) as rn
        FROM members
        WHERE status = 'Ativo' AND deleted_at IS NULL
    ) t WHERE t.rn > 1
);

-- 2. Atualizar função com correções
DROP FUNCTION IF EXISTS update_complete_ranking();

CREATE OR REPLACE FUNCTION update_complete_ranking()
RETURNS VOID AS $$
BEGIN
  -- =====================================================
  -- PARTE 1: LIMPAR POSIÇÕES INCORRETAS
  -- =====================================================
  UPDATE members 
  SET ranking_position = NULL
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- =====================================================
  -- PARTE 2: ATUALIZAR STATUS BASEADO EM CONTRATOS
  -- =====================================================
  UPDATE members 
  SET 
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- =====================================================
  -- PARTE 3: CALCULAR RANKING POR CAMPANHA CORRETAMENTE
  -- =====================================================
  WITH ranked_members_by_campaign AS (
    SELECT 
      id,
      campaign,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY campaign
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro
          created_at ASC            -- Em caso de empate, mais antingo primeiro
      ) as new_position
    FROM members 
    WHERE status = 'Ativo' 
      AND deleted_at IS NULL
      AND ranking_position IS NULL  -- Recalcular apenas os sem posição
  )
  UPDATE members 
  SET 
    ranking_position = rm.new_position,
    updated_at = NOW()
  FROM ranked_members_by_campaign rm
  WHERE members.id = rm.id;
  
  -- Recalcular TODOS os rankings (para garantir consistência)
  WITH all_ranked_members AS (
    SELECT 
      id,
      campaign,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY campaign
        ORDER BY 
          contracts_completed DESC,
          created_at ASC
      ) as final_position
    FROM members 
    WHERE status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = rm.final_position,
    updated_at = NOW()
  FROM all_ranked_members rm
  WHERE members.id = rm.id;
  
  -- =====================================================
  -- PARTE 4: ATUALIZAR TOP 1500 E SUBSTITUIÇÃO
  -- =====================================================
  UPDATE members 
  SET 
    is_top_1500 = (ranking_position <= 1500),
    can_be_replaced = (ranking_status = 'Vermelho' AND NOT is_top_1500),
    updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  RAISE NOTICE 'Ranking por campanha recalculado completamente - %', now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO SIMPLIFICADA PARA UMA CAMPANHA
-- =====================================================

DROP FUNCTION IF EXISTS update_ranking_by_campaign(TEXT);

CREATE OR REPLACE FUNCTION update_ranking_by_campaign(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Resetar posições da campanha
  UPDATE members 
  SET ranking_position = NULL
  WHERE campaign = campaign_param 
    AND status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- Calcular todas as posições da campanha
  WITH ranked_campaign_members AS (
    SELECT 
      id,
      ranking_position as calc_position,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,
          created_at ASC
      ) as final_position
    FROM members 
    WHERE campaign = campaign_param
      AND status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = rm.final_position,
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    is_top_1500 = (rm.final_position <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND rm.final_position > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM ranked_campaign_members rm
  WHERE members.id = rm.id;
  
  RAISE NOTICE 'Campanha % recalculada - %', campaign_param, now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CONTAR MEMBROS POR CAMPANHA
-- =====================================================

CREATE OR REPLACE FUNCTION count_members_by_campaign()
RETURNS TABLE (
  campaign TEXT,
  total_members INTEGER,
  green_members INTEGER,
  yellow_members INTEGER,
  red_members INTEGER,
  top_1500 INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.campaign as campaign,
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE m.ranking_status = 'Verde') as green_members,
    COUNT(*) FILTER (WHERE m.ranking_status = 'Amarelo') as yellow_members,
    COUNT(*) FILTER (WHERE m.ranking_status = 'Vermelho') as red_members,
    COUNT(*) FILTER (WHERE m.is_top_1500 = true) as top_1500
  FROM members m
  WHERE m.status = 'Ativo' 
    AND m.deleted_at IS NULL
  GROUP BY m.campaign
  ORDER BY m.campaign;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EXECUTAR CORREÇÃO COMPLETA
-- =====================================================

SELECT 'Iniciando correção do ranking...' as status;

-- Executar correção completa
SELECT update_complete_ranking();

-- Verificar resultado
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status,
    created_at
FROM members 
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY campaign, ranking_position;

-- Contar membros por campanha
SELECT * FROM count_members_by_campaign();

-- =====================================================
-- VERIFICAR CONSISTÊNCIA FINAL
-- =====================================================

SELECT 
    campaign,
    COUNT(*) as total,
    MIN(ranking_position) as min_pos,
    MAX(ranking_position) as max_pos,
    COUNT(DISTINCT ranking_position) as unique_positions,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT ranking_position) AND MIN(ranking_position) = 1 THEN '✅ Perfeito'
        ELSE '❌ Problema'
    END as status
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;
