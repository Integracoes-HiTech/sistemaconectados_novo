-- =====================================================
-- CORREÇÃO DO ERRO DE AMBIGUIDADE NA COLUNA CONTRATOS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- ERROR: 42702: column reference "contracts_completed" is ambiguous
-- A coluna contracts_completed existe tanto na tabela members quanto na CTE
-- Isso causa ambiguidade no UPDATE

-- =====================================================
-- SOLUÇÃO: CORRIGIR FUNÇÃO update_ranking_by_campaign
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
  
  -- Calcular todas as posições da campanha corrigindo a ambiguidade
  WITH ranked_campaign_members AS (
    SELECT 
      id,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro
          created_at ASC            -- Em caso de empate, mais antigo primeiro
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
    End,
    -- CORREÇÃO: Especificar a tabela members para evitar ambiguidade
    is_top_1500 = (rm.final_position <= 1500),
    can_be_replaced = (CASE
      WHEN members.contracts_completed < 1 THEN true
      WHEN members.contracts_completed < 15 AND rm.final_position > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM ranked_campaign_members rm
  WHERE members.id = rm.id;
  
  RAISE NOTICE 'Campanha % recalculada - %', campaign_param, now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TAMBÉM CORRIGIR A FUNÇÃO PRINCIPAL PARA EVITAR PROBLEMAS SIMILARES
-- =====================================================

DROP FUNCTION IF EXISTS update_complete_ranking();

CREATE OR REPLACE FUNCTION update_complete_ranking()
RETURNS VOID AS $$
BEGIN
  -- Limpar posições incorretas
  UPDATE members 
  SET ranking_position = NULL
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- Atualizar status baseado em contratos
  UPDATE members 
  SET 
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    End,
    updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- CALCULAR RANKING POR CAMPANHA CORRETAMENTE
  WITH all_ranked_members AS (
    SELECT 
      id,
      campaign,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY campaign
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro
          created_at ASC            -- Em caso de empate, datas
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
  
  -- Atualizar TOP 1500 e substituição
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
-- TESTAR AS FUNÇÕES CORRIGIDAS
-- =====================================================

-- Executar correção completa
SELECT update_complete_ranking();

-- Verificar resultado
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status,
    is_top_1500,
    can_be_replaced
FROM members 
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY campaign, ranking_position;

-- =====================================================
-- TESTAR FUNÇÃO DE CAMPANHA ESPECÍFICA
-- =====================================================

-- Testar atualização da Campanha A
SELECT update_ranking_by_campaign('A');

-- Verificar resultado da Campanha A
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status
FROM members 
WHERE campaign = 'A'
  AND status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY ranking_position;

-- =====================================================
-- VERIFICAR CONSISTÊNCIA FINAL
-- =====================================================

SELECT 
    campaign,
    COUNT(*) as total_membros,
    MIN(ranking_position) as posicao_minima,
    MAX(ranking_position) as posicao_maxima,
    COUNT(DISTINCT ranking_position) as posicoes_unicas,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT ranking_position) AND MIN(ranking_position) = 1 THEN '✅ Consistente'
        ELSE '❌ Inconsistente'
    END as status_consistencia
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;
