-- =====================================================
-- CORRIGIR RANKING POR CAMPANHA - VERSÃO FINAL
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- A função update_complete_ranking() está calculando ranking GLOBAL
-- em vez de ranking POR CAMPANHA. Isso faz com que:
-- - Membro da Campanha B apareça na posição 1 (global)
-- - Em vez da posição 1 (dentro da Campanha B)
-- - Causando confusão no dashboard

-- =====================================================
-- SOLUÇÃO: FUNÇÃO CORRIGIDA POR CAMPANHA
-- =====================================================

-- Função para atualizar ranking POR CAMPANHA
CREATE OR REPLACE FUNCTION update_complete_ranking()
RETURNS VOID AS $$
BEGIN
  -- 1. PRIMEIRO: Atualizar ranking_status baseado em contracts_completed
  UPDATE members 
  SET ranking_status = CASE
    WHEN contracts_completed >= 15 THEN 'Verde'
    WHEN contracts_completed >= 1 THEN 'Amarelo'
    ELSE 'Vermelho'
  END,
  updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- 2. SEGUNDO: Atualizar posições do ranking POR CAMPANHA
  -- Para cada campanha, calcular ranking separadamente
  WITH ranked_members_by_campaign AS (
    SELECT 
      id,
      campaign,
      ROW_NUMBER() OVER (
        PARTITION BY campaign  -- ← CHAVE: PARTIÇÃO POR CAMPANHA
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro
          created_at ASC            -- Em caso de empate, mais antigo primeiro
      ) as new_position
    FROM members 
    WHERE status = 'Ativo' AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = rm.new_position,
    updated_at = NOW()
  FROM ranked_members_by_campaign rm
  WHERE members.id = rm.id;
  
  -- 3. TERCEIRO: Atualizar status de top 1500 (por campanha)
  UPDATE members 
  SET 
    is_top_1500 = (ranking_position <= 1500),
    updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- 4. QUARTO: Atualizar quem pode ser substituído (vermelhos fora do top 1500)
  UPDATE members 
  SET 
    can_be_replaced = (ranking_status = 'Vermelho' AND NOT is_top_1500),
    updated_at = NOW()
  WHERE status = 'Ativo' AND deleted_at IS NULL;
  
  -- Log da operação
  RAISE NOTICE 'Ranking por campanha atualizado com sucesso';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TESTAR A FUNÇÃO CORRIGIDA
-- =====================================================

-- Executar a função para testar
SELECT update_complete_ranking();

-- =====================================================
-- VERIFICAR RESULTADO POR CAMPANHA
-- =====================================================

-- Verificar ranking por campanha
SELECT 
    campaign,
    name,
    contracts_completed,
    ranking_position,
    ranking_status,
    is_top_1500
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
ORDER BY campaign, ranking_position;

-- =====================================================
-- VERIFICAR SE CADA CAMPANHA TEM POSIÇÕES CORRETAS
-- =====================================================

-- Verificar se cada campanha tem posições sequenciais
SELECT 
    campaign,
    COUNT(*) as total_membros,
    MIN(ranking_position) as posicao_minima,
    MAX(ranking_position) as posicao_maxima,
    COUNT(DISTINCT ranking_position) as posicoes_unicas
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;

-- =====================================================
-- VERIFICAR SE HÁ POSIÇÕES DUPLICADAS
-- =====================================================

-- Verificar se há posições duplicadas dentro da mesma campanha
SELECT 
    campaign,
    ranking_position,
    COUNT(*) as quantidade
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY campaign, ranking_position
HAVING COUNT(*) > 1
ORDER BY campaign, ranking_position;
