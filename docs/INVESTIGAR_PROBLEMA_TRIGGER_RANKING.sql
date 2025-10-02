-- =====================================================
-- INVESTIGAR PROBLEMA DO TRIGGER DE RANKING
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- Quando um novo membro assume o topo do ranking (mais contratos)
-- as posições bagunçam e misturam campanhas
-- Isso indica problema no trigger automático ou função de ranking

-- =====================================================
-- 1. VERIFICAR TODOS OS TRIGGERS EXISTENTES
-- =====================================================

SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'members'
ORDER BY trigger_name;

-- =====================================================
-- 2. VERIFICAR FUNÇÕES DE TRIGGER
-- =====================================================

SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%ranking%' 
   OR routine_name LIKE '%trigger%'
ORDER BY routine_name;

-- =====================================================
-- 3. REMOVER TRIGGERS PROBLEMÁTICOS
-- =====================================================

-- Dropar todos os triggers relacionados a ranking
DROP TRIGGER IF EXISTS auto_update_ranking ON members;
DROP TRIGGER IF EXISTS update_ranking_trigger ON members;
DROP TRIGGER IF EXISTS ranking_trigger ON members;

-- =====================================================
-- 4. CRIAR TRIGGER CORRIGIDO E ROBUSTO
-- =====================================================

-- Primeiro, criar função de trigger simplificada
CREATE OR REPLACE FUNCTION trigger_update_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- AGUARDAR UM PEQUENO DELAY PARA EVITAR RACES CONDITIONS
  PERFORM pg_sleep(0.1);
  
  -- Executar função de ranking apenas para a campanha específica
  -- Usar função mais simples que apenas atualiza posições
  PERFORM update_simple_ranking_by_campaign(
    CASE 
      WHEN TG_OP = 'INSERT' THEN NEW.campaign
      WHEN TG_OP = 'UPDATE' AND OLD.campaign != NEW.campaign THEN OLD.campaign
      ELSE NEW.campaign
    END
  );
  
  -- Se mudou de campanha no UPDATE, atualizar ambas
  IF TG_OP = 'UPDATE' AND OLD.campaign != NEW.campaign THEN
    PERFORM update_simple_ranking_by_campaign(NEW.campaign);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. FUNÇÃO SIMPLIFICADA PARA RANKING POR CAMPANHA
-- =====================================================

CREATE OR REPLACE FUNCTION update_simple_ranking_by_campaign(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Calcular ranking apenas para a campanha específica
  WITH ranked_campaign AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,
          created_at ASC
      ) as new_position
    FROM members 
    WHERE campaign = campaign_param
      AND status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = rc.new_position,
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    is_top_1500 = (rc.new_position <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND rc.new_position > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM ranked_campaign rc
  WHERE members.id = rc.id
    AND members.campaign = campaign_param
    AND members.status = 'Ativo'
    AND members.deleted_at IS NULL;
    
  RAISE NOTICE 'Campanha % atualizada com ranking simplificado', campaign_param;
  
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CRIAR TRIGGER NOVAMENTE COM CONFIGURAÇÃO ROBUSTA
-- =====================================================

CREATE TRIGGER auto_update_ranking_v2
    AFTER INSERT OR UPDATE OF contracts_completed, campaign, status
    ON members
    FOR EACH ROW
    WHEN (NEW.status = 'Ativo' AND NEW.deleted_at IS NULL)
    EXECUTE FUNCTION trigger_update_ranking();

-- =====================================================
-- 7. TESTAR INSERÇÃO E ATUALIZAÇÃO
-- =====================================================

-- Limpar dados de teste anteriores
DELETE FROM members WHERE name LIKE '%TESTE RANKING%' OR name LIKE '%Teste Ranking%';

-- Teste 1: Inserir membro novato (deve ficar no final)
INSERT INTO members (
    name, phone, instagram, city, sector, referrer, 
    registration_date, status, contracts_completed, 
    ranking_status, ranking_position, is_top_1500, 
    can_be_replaced, couple_name, couple_phone, 
    couple_instagram, couple_city, couple_sector, 
    is_friend, campaign
) VALUES (
    'TESTE RANKING NOVO', '61911111111', '@teste_novo',
    'São Paulo', 'Centro', 'Admin', 
    CURRENT_DATE, 'Ativo', 0, 
    'Vermelho', 999, false, 
    true, 'Parceiro Novo', '61811111111',
    '@parceiro_novo', 'São Paulo', 'Centro',
    false, 'A'
);

-- Aguardar trigger executar
SELECT pg_sleep(1);

-- Verificar ranking da Campanha A após inserção
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status,
    created_at
FROM members 
WHERE campaign = 'A' 
  AND status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY ranking_position;

-- Teste 2: Atualizar contratos do novo membro (deve subir no ranking)
UPDATE members 
SET contracts_completed = 20 
WHERE name = 'TESTE RANKING NOVO';

-- Aguardar trigger executar
SELECT pg_sleep(1);

-- Verificar se subiu para o topo
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status,
    'MUDOU DE POSIÇÃO' as status_teste
FROM members 
WHERE name = 'TESTE RANKING NOVO';

-- =====================================================
-- 8. VERIFICAÇÃO FINAL - RANKING POR CAMPANHA
-- =====================================================

-- Verificar se não há mistura de campanhas
SELECT 
    campaign,
    COUNT(*) as total_membros,
    MIN(ranking_position) as posicao_minima,
    MAX(ranking_position) as posicao_maxima,
    COUNT(DISTINCT ranking_position) as posicoes_unicas,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT ranking_position) AND MIN(ranking_position) = 1 THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE'
    END as status_consistencia
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;

-- =====================================================
-- 9. LOGS DE DEBUG DOS TRIGGERS
-- =====================================================

-- Verificar se o trigger está funcionando
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    'ATIVO' as status_trigger
FROM information_schema.triggers 
WHERE event_object_table = 'members' 
  AND trigger_name LIKE '%ranking%';
