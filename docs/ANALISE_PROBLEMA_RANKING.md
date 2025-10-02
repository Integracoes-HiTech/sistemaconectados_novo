# Análise do Problema do Ranking e Solução Definitiva

## Problema Identificado

### **Ranking bagunçando posições e misturando campanhas**

**Sintomas:**
1. Toda vez que registra um membro novo, bagunça o ranking
2. Campanha A e Campanha B são misturadas nas posições
3. Posições não são sequenciais dentro de cada campanha
4. Membros ficam com posições incorretas após inserções

**Causa Raiz:**
- A função `update_complete_ranking()` está calculando ranking GLOBAL
- Não está isolando por campanha usando `PARTITION BY campaign`
- Trigger automático não está funcionando adequadamente

## Solução Definitiva

### **1. Correção da Função Principal**

```sql
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
  
  -- CALCULAR RANKING POR CAMPANHA (CHAVE DA SOLUÇÃO)
  WITH all_ranked_members AS (
    SELECT 
      id,
      campaign,
      contracts_completed,
      created_at,
      ROW_NUMBER() OVER (
        PARTITION BY campaign  -- ← ISOLAMENTO POR CAMPANHA
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
  
  RAISE NOTICE 'Ranking por campanha recalculado - %', now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;
```

### **2. Função para Uma Campanha Específica**

```sql
CREATE OR REPLACE FUNCTION update_ranking_by_campaign(campaign_param TEXT)
RETURNS VOID AS $$
BEGIN
  -- Resetar posições da campanha
  UPDATE members 
  SET ranking_position = NULL
  WHERE campaign = campaign_param 
    AND status = 'Ativo' 
    AND deleted_at IS NULL;
  
  -- Calcular posições apenas da campanha específica
  WITH ranked_campaign_members AS (
    SELECT 
      id,
      contracts_completed,
      created_at,
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
    End,
    is_top_1500 = (rm.final_position <= 1500),
    can_be_replaced = (CASE
      WHEN contracts_completed < 1 THEN true
      WHEN contracts_completed < 15 AND rm.final_position > 1500 THEN true
      ELSE false
    End),
    updated_at = NOW()
  FROM ranked_campaign_members rm
  WHERE members.id = rm.id;
  
  RAISE NOTICE 'Campanha % recalculada - %', campaign_param, now()::timestamp;
  
END;
$$ LANGUAGE plpgsql;
```

### **3. Trigger para Atualização Automática**

```sql
CREATE OR REPLACE FUNCTION trigger_update_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ranking da campanha específica
  PERFORM update_ranking_by_campaign(NEW.campaign);
  
  -- Se mudou campanha, atualizar a anterior também
  IF TG_OP = 'UPDATE' AND OLD.campaign != NEW.campaign THEN
    PERFORM update_ranking_by_campaign(OLD.campaign);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS auto_update_ranking ON members;
CREATE TRIGGER auto_update_ranking
    AFTER INSERT OR UPDATE OF contracts_completed, campaign
    ON members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ranking();
```

### **4. Como Usar no Frontend**

**Para atualizar ranking completo (todas campanhas):**
```typescript
const { } = await supabase.rpc('update_complete_ranking');
if (error) throw error;
```

**Para atualizar apenas uma campanha específica:**
```typescript
const { error } await supabase.rpc('update_ranking_by_campaign', {
  campaign_param: user?.campaign || 'A'
});
if (error) throw error;
```

## Resultado Esperado

### **Campanha A:**
```
1º - Membro com 5 contratos   (Verde)
2º - Membro com 3 contratos   (Amarelo)  
3º - Membro com 1 contratos   (Amarelo)
4º - Membro com 0 contratos   (Vermelho)
5º - Membro com 0 contratos   (Vermelho)
```

### **Campanha B:**
```
1º - Membro com 2 contratos   (Amarelo)
2º - Membro com 1 contratos   (Amarelo)
3º - Membro com 0 contratos   (Vermelho)
```

## Características da Solução

✅ **Isolamento por Campanha**: Cada campanha tem ranking independente
✅ **Posições Sequenciais**: 1, 2, 3, 4... em cada campanha
✅ **Desempate por Data**: Contratos iguais ordenados por data de criação
✅ **Atualização Automática**: Trigger atualiza ranking quando necessário
✅ **Performance**: Usa CTE otimizado com PARTITION BY
✅ **Flexibilidade**: Permite atualizar uma campanha específica

## Testes de Validação

1. **Inserir novo membro**: Deve recalcular apenas sua campanha
2. **Atualizar contratos**: Deve reposicionar dentro da campanha
3. **Mudar campanha**: Deve atualizar ambas as campanhas
4. **Ranking completo**: Deve recalcular todas as campanhas

Esta solução resolve definitivamente o problema de ranking misturado e posições incorretas.
