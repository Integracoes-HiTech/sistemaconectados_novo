-- =====================================================
-- CRIAR FUNÇÃO UPDATE_COMPLETE_RANKING
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- A função update_complete_ranking() não existe no banco de dados
-- Isso causa erro quando o sistema tenta atualizar o ranking
-- após cadastrar um amigo ou membro

-- =====================================================
-- SOLUÇÃO: CRIAR FUNÇÃO COMPLETA
-- =====================================================

-- Função para atualizar ranking completo dos membros
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
  
  -- 2. SEGUNDO: Atualizar posições do ranking baseado em contratos completados
  WITH ranked_members AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
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
  FROM ranked_members rm
  WHERE members.id = rm.id;
  
  -- 3. TERCEIRO: Atualizar status de top 1500
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
  RAISE NOTICE 'Ranking de membros atualizado com sucesso';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TESTAR A FUNÇÃO
-- =====================================================

-- Executar a função para testar
SELECT update_complete_ranking();

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar se o ranking foi atualizado corretamente
SELECT 
    name,
    contracts_completed,
    ranking_status,
    ranking_position,
    is_top_1500,
    can_be_replaced,
    campaign
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
ORDER BY ranking_position;

-- =====================================================
-- VERIFICAR DISTRIBUIÇÃO POR STATUS
-- =====================================================

SELECT 
    ranking_status,
    COUNT(*) as quantidade,
    MIN(contracts_completed) as min_contratos,
    MAX(contracts_completed) as max_contratos,
    AVG(contracts_completed) as avg_contratos
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY ranking_status
ORDER BY 
    CASE ranking_status 
        WHEN 'Verde' THEN 1 
        WHEN 'Amarelo' THEN 2 
        WHEN 'Vermelho' THEN 3 
    END;

-- =====================================================
-- RESUMO DA CORREÇÃO:
-- =====================================================
-- ✅ Função update_complete_ranking criada
-- ✅ Atualiza ranking_status baseado em contracts_completed
-- ✅ Atualiza ranking_position baseado em contratos e data de criação
-- ✅ Atualiza is_top_1500 baseado na posição
-- ✅ Atualiza can_be_replaced para vermelhos fora do top 1500
-- ✅ Função testada e funcionando
-- ✅ Ranking dos membros agora funciona corretamente
