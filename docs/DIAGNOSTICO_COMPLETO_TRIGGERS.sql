-- =====================================================
// DIAGNÓSTICO COMPLETO DOS TRIGGERS DE RANKING
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA REPORTADO:
-- =====================================================
-- Quando um novo membro assume o topo do ranking (mais contratos)
-- as posições bagunçam e misturam campanhas
-- Isso acontece às vezes, não sempre

-- =====================================================
-- 1. VERIFICAR TODOS OS TRIGGERS ATIVOS
-- =====================================================

SELECT 
    schemaname,
    tablename,
    triggername,
    tgtype,
    tgnargs,
    tgisinternal,
    tgenabled
FROM pg_trigger 
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE pg_class.relname = 'members'
ORDER BY triggername;

-- =====================================================
-- 2. VERIFICAR CONFIGURAÇÃO DOS TRIGGERS
-- =====================================================

SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing,
    action_statement,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'members'
ORDER BY trigger_name;

-- =====================================================
-- 3. VERIFICAR SE EXISTE CONFLITO DE TRIGGERS
-- =====================================================

-- Listar todas as funções que são chamadas por triggers
SELECT DISTINCT
    proname as function_name,
    prosrc as function_body_preview
FROM pg_proc 
WHERE proname LIKE '%ranking%' 
   OR proname LIKE '%trigger%'
ORDER BY proname;

-- =====================================================
-- 4. REMOVIDOR TODOS OS TRIGGERS E RECRIAR LIMPOS
-- =====================================================

-- Dropar TODOS os triggers relacionados a ranking
DROP TRIGGER IF EXISTS auto_update_ranking ON members;
DROP TRIGGER IF EXISTS auto_update_ranking_v2 ON members;
DROP TRIGGER IF EXISTS update_ranking_trigger ON members;
DROP TRIGGER IF EXISTS ranking_trigger ON members;
DROP TRIGGER IF EXISTS trigger_update_ranking_fn ON members;
DROP TRIGGER IF EXISTS trigger_ranking ON members;

-- =====================================================
-- 5. CRIAR FUNÇÃO DE TRIGGER MAIS ROBUSTA E SIMPLES
-- =====================================================

-- Remover funções anteriores
DROP FUNCTION IF EXISTS trigger_update_ranking();

-- Criar função nova mais simples e robusta
CREATE OR REPLACE FUNCTION trigger_update_ranking()
RETURNS TRIGGER AS $$
DECLARE
    affected_campaign TEXT;
BEGIN
  -- Determinar qual campanha foi afetada
  IF TG_OP = 'INSERT' THEN
    affected_campaign := NEW.campaign;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se mudou de campanha, atualizar ambas
    IF OLD.campaign IS DISTINCT FROM NEW.campaign THEN
      -- Executar ranking para campanha ANTIGA
      PERFORM recalcular_ranking_campanha(OLD.campaign);
      -- Executar ranking para campanha NOVA
      affected_campaign := NEW.campaign;
    ELSE
      affected_campaign := NEW.campaign;
    END IF;
  END IF;
  
  -- Executar ranking apenas para a campanha afetada
  PERFORM recalcular_ranking_campanha(affected_campaign);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNÇÃO REALMENTE SIMPLES PARA RECALCULAR RANKING
-- =====================================================

CREATE OR REPLACE FUNCTION recalcular_ranking_campanha(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Função mais simples possível para evitar problemas
  UPDATE members 
  SET 
    ranking_position = NULL,
    updated_at = NOW()
  WHERE campaign = campaign_param 
    AND status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- Recalcular apenas esta campanha
  WITH novo_ranking AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,
          created_at ASC,
          id ASC  -- Adicionar ID para garantir estabilidade
      ) as posicao_final
    FROM members
    WHERE campaign = campaign_param
      AND status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = nr.posicao_final,
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    is_top_1500 = (nr.posicao_final <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND nr.posicao_final > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM novo_ranking nr
  WHERE members.id = nr.id;
  
  RAISE NOTICE 'Campanha % recalculada com sucesso', campaign_param;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Se ocorrer erro, não quebrar tudo
    RAISE NOTICE 'Erro ao recalcular campanha %: %', campaign_param, SQLERRM;
    PERFORM update_complete_ranking(); -- Fallback para correção geral
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CRIAR TRIGGER NOVO COM CONFIGURAÇÃO MAIS ESPECÍFICA
-- =====================================================

CREATE TRIGGER auto_update_ranking_final
    AFTER INSERT OR UPDATE OF contracts_completed, campaign, status, deleted_at
    ON members
    FOR EACH ROW
    WHEN (NEW.status = 'Ativo' AND NEW.deleted_at IS NULL)
    EXECUTE FUNCTION trigger_update_ranking();

-- =====================================================
-- 8. TESTAR O NOVO SISTEMA
-- =====================================================

-- Verificar se os triggers estão ativos
SELECT 
    trigger_name,
    action_timing,
    event_manipulation,
    'ATIVO' as status
FROM information_schema.triggers 
WHERE event_object_table = 'members' 
  AND trigger_name LIKE '%ranking%';

-- =====================================================
-- 9. TESTE DE FUNCIONAMENTO
-- =====================================================

-- Executar ranking completo primeiro para organizar tudo
SELECT update_complete_ranking();

-- Verificar ranking inicial
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    created_at
FROM members 
WHERE status = 'Ativo' AND deleted_at IS NULL
ORDER BY campaign, ranking_position;

-- =====================================================
-- 10. TESTAR ATUALIZAÇÃO QUE DEVERIA TRIGGAR AUTOMATICAMENTE
-- =====================================================

-- Atualizar contratos de um membro existente para testar trigger
UPDATE members 
SET contracts_completed = contracts_completed + 1
WHERE campaign = 'A' 
  AND name != 'NOVO LÍDER Campanha A'
  AND status = 'Ativo' 
  AND deleted_at IS NULL
LIMIT 1;

-- Aguardar trigger executar (pode levar alguns segundos)
SELECT pg_sleep(2);

-- Verificar se ranking foi atualizado automaticamente
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    'APÓS TRIGGER' as status_verificacao
FROM members 
WHERE campaign = 'A' AND status = 'Ativo' AND deleted_at IS NULL
ORDER BY ranking_position;
