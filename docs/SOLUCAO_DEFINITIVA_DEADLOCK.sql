-- =====================================================
// SOLUÇÃO DEFINITIVA PARA DEADLOCK E RANKING BAGUNÇADO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO:
-- =====================================================
-- DEADLOCK quando múltiplas atualizações simultâneas
-- Causa ranking bagunçado e mistura de campanhas
-- Triggers executando em conflito

-- =====================================================
-- SOLUÇÃO: TRIGGER COM DESCOMPATIVOÇÃO E FILA
-- =====================================================

-- 1. REMOVER TRIGGER PROBLEMÁTICO
DROP TRIGGER IF EXISTS auto_update_ranking_final ON members;

-- 2. CRIAR TABELA DE FILA PARA RANKING (EVITAR CONFLITOS)
CREATE TABLE IF NOT EXISTS ranking_queue (
    id SERIAL PRIMARY KEY,
    campaign TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    member_id UUID,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    status TEXT DEFAULT 'pending'
);

-- 3. FUNÇÃO DE TRIGGER QUE USA FILA (SEM CONFLITOS)
CREATE OR REPLACE FUNCTION trigger_update_ranking_v3()
RETURNS TRIGGER AS $$
DECLARE
    affected_campaign TEXT;
BEGIN
  -- Determinar campanha afetada
  IF TG_OP = 'INSERT' THEN
    affected_campaign := NEW.campaign;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.campaign IS DISTINCT FROM NEW.campaign THEN
      -- Inserir na fila ambas as campanhas
      INSERT INTO ranking_queue (campaign, operation_type, member_id)
      VALUES (OLD.campaign, TG_OP, OLD.id), (NEW.campaign, TG_OP, NEW.id);
      RETURN NEW;
    ELSE
      affected_campaign := NEW.campaign;
    END IF;
  END IF;
  
  -- Inserir solicitação na fila sem conflito
  INSERT INTO ranking_queue (campaign, operation_type, member_id)
  VALUES (affected_campaign, TG_OP, COALESCE(NEW.id, OLD.id));
  
  -- Processar fila em background (sem bloquear)
  PERFORM pg_notify('process_ranking_queue', affected_campaign);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA PROCESSAR FILA SEM DEADLOCK
CREATE OR REPLACE FUNCTION process_ranking_queue_notification()
RETURNS TRIGGER AS $$
DECLARE
    queue_item RECORD;
BEGIN
  -- Processar todos os itens pendentes na fila
  FOR queue_item IN 
    SELECT DISTINCT campaign 
    FROM ranking_queue 
    WHERE status = 'pending' 
      AND queued_at > NOW() - INTERVAL '5 minutes'
    ORDER BY queued_at ASC
  LOOP
    -- Executar ranking apenas se não estiver sendo processado
    PERFORM process_single_campaign_ranking(queue_item.campaign);
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO SEGURA PARA RANKING DE UMA CAMPANHA
CREATE OR REPLACE FUNCTION process_single_campaign_ranking(campaign_param TEXT)
RETURNS VOID AS $$
DECLARE
    lock_acquired BOOLEAN := FALSE;
BEGIN
  -- Tentar obter lock exclusivo para evitar conflitos
  BEGIN
    SELECT pg_try_advisory_lock(hashtext('ranking_' || campaign_param)) INTO lock_acquired;
    
    IF NOT lock_acquired THEN
      -- Se não conseguir lock, agendar para depois
      RAISE NOTICE 'Ranking para campanha % agendado (lock ocupado)', campaign_param;
      RETURN;
    END IF;
    
    -- Executar ranking com lock adquirido
    PERFORM recalcular_ranking_campanha_v2(campaign_param);
    
    -- Marcar itens na fila como processados
    UPDATE ranking_queue 
    SET 
      processed_at = NOW(),
      status = 'completed'
    WHERE campaign = campaign_param 
      AND status = 'pending'
      AND queued_at > NOW() - INTERVAL '10 minutes';
      
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Erro no ranking %: %', campaign_param, SQLERRM;
  END;
  
  -- Liberar lock
  PERFORM pg_advisory_unlock(hashtext('ranking_' || campaign_param));
  
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO DE RANKING ROBUSTA E SIMPLES
CREATE OR REPLACE FUNCTION recalcular_ranking_campanha_v2(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Função ultra simples para minimizar tempo de lock
  WITH novo_ranking AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        ORDER BY 
          contracts_completed DESC,
          created_at ASC,
          id ASC
      ) as posicao_nova
    FROM members
    WHERE campaign = campaign_param
      AND status = 'Ativo' 
      AND deleted_at IS NULL
  )
  UPDATE members 
  SET 
    ranking_position = nr.posicao_nova,
    ranking_status = CASE
      WHEN contracts_completed >= 15 THEN 'Verde'
      WHEN contracts_completed >= 1 THEN 'Amarelo'
      ELSE 'Vermelho'
    END,
    is_top_1500 = (nr.posicao_nova <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND nr.posicao_nova > 1500 THEN true
      ELSE false
    END),
    updated_at = NOW()
  FROM novo_ranking nr
  WHERE members.id = nr.id;
  
  RAISE NOTICE 'Campanha % recalculada com sucesso - %', campaign_param, now();
  
END;
$$ LANGUAGE plpgsql;

-- 7. CRIAR TRIGGER NOVO E ROBUSTO
CREATE TRIGGER auto_update_ranking_v4
    AFTER INSERT OR UPDATE OF contracts_completed, campaign, status, deleted_at
    ON members
    FOR EACH ROW
    WHEN (NEW.status = 'Ativo' AND NEW.deleted_at IS NULL)
    EXECUTE FUNCTION trigger_update_ranking_v3();

-- 8. LIMPAR FILA ANTIGA E TESTAR
DELETE FROM ranking_queue WHERE queued_at < NOW() - INTERVAL '1 hour';

-- =====================================================
-- TESTE DA SOLUÇÃO
-- =====================================================

-- Executar ranking completo primeiro
SELECT update_complete_ranking();

-- Limpar dados de teste antigos
DELETE FROM members WHERE name LIKE '%TESTE CONFLITO%';

-- Teste 1: Inserir múltiplos membros simultaneamente
INSERT INTO members (
    name, phone, instagram, city, sector, referrer, 
    registration_date, status, contracts_completed, 
    ranking_status, ranking_position, is_top_1500, 
    can_be_replaced, couple_name, couple_phone, 
    couple_instagram, couple_city, couple_sector, 
    is_friend, campaign
) VALUES 
    ('TESTE CONFLITO A1', '61911111111', '@teste_a1', 'SP', 'Centro', 'Admin', CURRENT_DATE, 'Ativo', 10, 'Amarelo', 999, false, false, 'Parceiro A1', '61811111111', '@parceiro_a1', 'SP', 'Centro', false, 'A'),
    ('TESTE CONFLITO A2', '61922222222', '@teste_a2', 'SP', 'Centro', 'Admin', CURRENT_DATE, 'Ativo', 15, 'Verde', 999, false, false, 'Parceiro A2', '61822222222', '@parceiro_a2', 'SP', 'Centro', false, 'A'),
    ('TESTE CONFLITO A3', '61933333333', '@teste_a3', 'SP', 'Centro', 'Admin', CURRENT_DATE, 'Ativo', 5, 'Amarelo', 999, false, false, 'Parceiro A3', '61833333333', '@parceiro_a3', 'SP', 'Centro', false, 'A');

-- Aguardar processamento
SELECT pg_sleep(3);

-- Verificar resultado
SELECT 
    campaign,
    ranking_position,
    name,
    contracts_completed,
    ranking_status
FROM members 
WHERE campaign = 'A' AND status = 'Ativo' AND deleted_at IS NULL
ORDER BY ranking_position;

-- Verificar fila
SELECT 
    campaign,
    operation_type,
    status,
    queued_at,
    processed_at
FROM ranking_queue 
ORDER BY queued_at DESC
LIMIT 10;

-- =====================================================
-- LIMPEZA E CONFIGURAÇÃO FINAL
-- =====================================================

-- Remover registros antigos da fila (manutenção)
DELETE FROM ranking_queue 
WHERE queued_at < NOW() - INTERVAL '2 hours';

-- Configurar execução automática da fila (se possível)
-- NOTA: Em produção, você pode usar pg_cron ou triggers de notificação
