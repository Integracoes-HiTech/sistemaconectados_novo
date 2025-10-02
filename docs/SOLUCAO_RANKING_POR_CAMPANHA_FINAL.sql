-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA RANKING POR CAMPANHA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA ATUAL:
-- =====================================================
-- 1. Function update_complete_ranking() calcula ranking GLOBAL
-- 2. Mistura membros da Campanha A com Campanha B
-- 3. Posições não respeitam o isolamento por campanha
-- 4. Cada vez que registra novo membro, bagunça todo o ranking

-- =====================================================
-- SOLUÇÃO: FUNCTION CORRIGIDA E OTIMIZADA
-- =====================================================

-- Drop da função anterior
DROP FUNCTION IF EXISTS update_complete_ranking();

-- Criar função corrigida para ranking por campanha
CREATE OR REPLACE FUNCTION update_complete_ranking()
RETURNS VOID AS $$
BEGIN
  -- =====================================================
  -- PARTE 1: ATUALIZAR STATUS BASEADO EM CONTRATOS
  -- =====================================================
  UPDATE members 
  SET 
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    updated_at = NOW()
  WHERE status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- =====================================================
  -- PARTE 2: CALCULAR RANKING POR CAMPANHA
  -- =====================================================
  WITH ranked_members_by_campaign AS (
    SELECT 
      id,
      campaign,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY campaign  -- CHAVE: ISOLAMENTO POR CAMPANHA
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro (1º lugar)
          created_at ASC            -- Em caso de empate, mais antigo primeiro
      ) as new_position
    FROM members 
    WHERE status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = rm.new_position,
    updated_at = NOW()
  FROM ranked_members_by_campaign rm
  WHERE members.id = rm.id;
  
  -- =====================================================
  -- PARTE 3: ATUALIZAR TOP 1500 POR CAMPANHA
  -- =====================================================
  UPDATE members 
  SET 
    is_top_1500 = (ranking_position <= 1500),
    updated_at = NOW()
  WHERE status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- =====================================================
  -- PARTE 4: ATUALIZAR QUEM PODE SER SUBSTITUÍDO
  -- =====================================================
  UPDATE members 
  SET 
    can_be_replaced = (ranking_status = 'Vermelho' AND NOT is_top_1500),
    updated_at = NOW()
  WHERE status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- Log de sucesso
  RAISE NOTICE 'Ranking por campanha atualizado com sucesso - % executado em %', 'update_complete_ranking()', now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO ADICIONAL: RANKING APENAS PARA UMA CAMPANHA
-- =====================================================

-- Função para atualizar ranking de apenas uma campanha específica
CREATE OR REPLACE FUNCTION update_ranking_by_campaign(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Atualizar status da campanha específica
  UPDATE members 
  SET 
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    updated_at = NOW()
  WHERE status = 'Ativo' 
    AND deleted_at IS NULL
    AND campaign = campaign_param;
  
  -- Calcular ranking da campanha específica
  WITH ranked_campaign_members AS (
    SELECT 
      id,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,  -- Mais contratos primeiro
          created_at ASC            -- Em caso de empate, mais antigo primeiro
      ) as new_position
    FROM members 
    WHERE status = 'Ativo' 
      AND deleted_at IS NULL
      AND campaign = campaign_param
  )
  UPDATE members 
  SET 
    ranking_position = rm.new_position,
    is_top_1500 = (rm.new_position <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND rm.new_position > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM ranked_campaign_members rm
  WHERE members.id = rm.id;
  
  -- Log específico da campanha
  RAISE NOTICE 'Ranking da campanha % atualizado com sucesso - % executado em %', campaign_param, 'update_ranking_by_campaign()', now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TESTAR AS FUNÇÕES
-- =====================================================

-- Primeiro, executar a função principal
SELECT update_complete_ranking();

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Verificar ranking por campanha (ordenado corretamente)
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status,
    is_top_1500,
    created_at
FROM members 
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY 
    campaign ASC,           -- Campanhas separadas
    ranking_position ASC;   -- Posições dentro de cada campanha

-- =====================================================
-- VERIFICAR SE CADA CAMPANHA TEM POSIÇÕES CORRETAS
-- =====================================================

-- Verificar consistência das posições por campanha
SELECT 
    campaign,
    COUNT(*) as total_membros,
    MIN(ranking_position) as posicao_minima,
    MAX(ranking_position) as posicao_maxima,
    COUNT(DISTINCT ranking_position) as posicoes_unicas,
    CASE 
        WHEN COUNT(*) = MAX(ranking_position) THEN '✅ Consistente'
        ELSE '❌ Inconsistente'
    END as status_consistencia
FROM members 
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;

-- =====================================================
-- VERIFICAR DESEMPATE POR DATA
-- =====================================================

-- Verificar se membros com mesmo número de contratos estão ordenados corretamente
SELECT 
    campaign,
    contracts_completed,
    COUNT(*) as quantidade_membros,
    MIN(ranking_position) as menor_posicao,
    MAX(ranking_position) as maior_posicao,
    CASE 
        WHEN COUNT(*) = MAX(ranking_position) - MIN(ranking_position) + 1 THEN '✅ Desempate correto'
        ELSE '❌ Erro no desempate'
    END as status_desempate
FROM members 
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
GROUP BY campaign, contracts_completed
HAVING COUNT(*) > 1
ORDER BY campaign, contracts_completed DESC;

-- =====================================================
-- CRIAR TRIGGER PARA AUTO-ATUALIZAÇÃO
-- =====================================================

-- Trigger para atualizar ranking automaticamente quando contracts_completed muda
CREATE OR REPLACE FUNCTION trigger_update_ranking()
RETURNS TRIGGER AS $$
DECLARE
    affected_campaign TEXT;
BEGIN
    -- Se está inserindo novo membro
    IF TG_OP = 'INSERT' THEN
        affected_campaign := NEW.campaign;
        
        -- Atualizar ranking apenas da campanha específica
        PERFORM update_ranking_by_campaign(affected_campaign);
        
        RETURN NEW;
    END IF;
    
    -- Se está atualizando contracts_completed
    IF TG_OP = 'UPDATE' AND (OLD.contracts_completed != NEW.contracts_completed) THEN
        affected_campaign := NEW.campaign;
        
        -- Atualizar ranking apenas da campanha específica
        PERFORM update_ranking_by_campaign(affected_campaign);
        
        -- Se mudou para outra campanha, atualizar a antiga também
        IF OLD.campaign != NEW.campaign THEN
            PERFORM update_ranking_by_campaign(OLD.campaign);
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela members
DROP TRIGGER IF EXISTS auto_update_ranking ON members;
CREATE TRIGGER auto_update_ranking
    AFTER INSERT OR UPDATE OF contracts_completed, campaign
    ON members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ranking();

-- =====================================================
-- VERIFICAR TRIGGER
-- =====================================================

-- Testar inserção de novo membro (deve atualizar ranking automaticamente)
INSERT INTO members (
    name, phone, instagram, city, sector, referrer, 
    registration_date, status, contracts_completed, 
    ranking_status, ranking_position, is_top_1500, 
    can_be_replaced, couple_name, couple_phone, 
    couple_instagram, couple_city, couple_sector, 
    is_friend, campaign
) VALUES (
    'Teste Auto Ranking', '61999999999', '@testeauto',
    'Brasília', 'Asa Norte', 'Admin', 
    CURRENT_DATE, 'Ativo', 3, 
    'Amarelo', 999, false, 
    false, 'Teste Parceiro', '61888888888',
    '@testeparceiro', 'Brasília', 'Asa Norte',
    false, 'A'
);

-- Verificar se o trigger funcionou
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status
FROM members 
WHERE name = 'Teste Auto Ranking'
ORDER BY campaign, ranking_position;
