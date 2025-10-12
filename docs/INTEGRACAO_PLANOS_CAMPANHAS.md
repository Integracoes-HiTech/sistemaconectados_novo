# 🎯 Integração: Planos de Preços → Campanhas

## 📋 Visão Geral

Este documento explica como vincular os **planos de preços** (`planos_precos`) às **campanhas e usuários** do sistema.

---

## 🎯 Objetivo

Criar rastreabilidade completa do **plano contratado** por cada usuário/campanha:

```
Landing Page → Lead escolhe plano → Pagamento → Usuário criado com plano → Recursos liberados
```

---

## 🗄️ Estrutura de Dados

### **Antes (Sem vínculo):**

```
┌─────────────────┐
│ planos_precos   │  (Isolada)
└─────────────────┘

┌─────────────────┐
│ landing_leads   │  (Tem plano_preco_id)
└─────────────────┘

┌─────────────────┐
│ auth_users      │  (Sem plano)
│ members         │  (Sem plano)
│ friends         │  (Sem plano)
└─────────────────┘
```

### **Depois (Com vínculo):**

```
┌─────────────────┐
│ planos_precos   │◄───┐
│ - Gratuito      │    │
│ - Essencial     │    │ plano_preco_id (FK)
│ - Profissional  │    │
│ - Avançado      │    │
└─────────────────┘    │
                       │
┌─────────────────┐    │
│ landing_leads   │────┤
│ plano_preco_id  │    │
└─────────────────┘    │
                       │
┌─────────────────┐    │
│ auth_users      │────┤
│ members         │────┤
│ friends         │────┤
│ users           │────┤
│ user_links      │────┘
└─────────────────┘
```

---

## 🔧 Implementação

### **1. Adicionar Coluna `plano_preco_id`**

```sql
-- Exemplo para auth_users
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID 
REFERENCES planos_precos(id) ON DELETE SET NULL;
```

**Características:**
- ✅ `UUID` - mesmo tipo do ID de `planos_precos`
- ✅ `REFERENCES planos_precos(id)` - chave estrangeira
- ✅ `ON DELETE SET NULL` - se o plano for deletado, mantém o usuário
- ✅ `NULLABLE` - usuários podem existir sem plano definido

---

### **2. Criar Índices**

```sql
-- Índice simples
CREATE INDEX idx_auth_users_plano_preco_id ON auth_users(plano_preco_id);

-- Índice composto (campaign + plano_preco_id)
CREATE INDEX idx_auth_users_campaign_plano ON auth_users(campaign, plano_preco_id);
```

---

### **3. Vincular Automaticamente**

```sql
-- Função para vincular plano ao usuário pelo WhatsApp
CREATE OR REPLACE FUNCTION vincular_plano_ao_usuario()
RETURNS TRIGGER AS $$
DECLARE
    lead_plano_id UUID;
BEGIN
    IF NEW.phone IS NOT NULL THEN
        SELECT plano_preco_id INTO lead_plano_id
        FROM landing_leads
        WHERE whatsapp = NEW.phone
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF lead_plano_id IS NOT NULL THEN
            NEW.plano_preco_id := lead_plano_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auth_users
CREATE TRIGGER trigger_vincular_plano_auth_users
    BEFORE INSERT ON auth_users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_plano_ao_usuario();
```

**Comportamento:**
1. ✅ Ao criar usuário, busca plano do lead pelo WhatsApp
2. ✅ Vincula automaticamente o `plano_preco_id`
3. ✅ Se não encontrar, deixa `NULL`

---

## 📊 Consultas Úteis

### **1. Ver Usuários com Seus Planos**

```sql
SELECT 
    au.username,
    au.name,
    au.role,
    au.campaign,
    pp.nome_plano,
    pp.amount,
    pp.recorrencia
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
ORDER BY au.created_at DESC;
```

---

### **2. Distribuição de Usuários por Plano**

```sql
SELECT 
    pp.nome_plano,
    pp.amount,
    COUNT(au.id) as total_usuarios
FROM planos_precos pp
LEFT JOIN auth_users au ON au.plano_preco_id = pp.id
GROUP BY pp.id, pp.nome_plano, pp.amount
ORDER BY pp.order_display;
```

**Exemplo de Resultado:**
```
nome_plano      | amount  | total_usuarios
----------------|---------|---------------
Gratuito        |    0.00 |      15
Essencial       |  650.00 |      32
Profissional    | 1250.00 |      48
Avançado        | 1500.00 |      12
```

---

### **3. Receita Potencial por Plano**

```sql
SELECT 
    pp.nome_plano,
    pp.amount,
    COUNT(au.id) as total_usuarios,
    pp.amount * COUNT(au.id) as receita_mensal_potencial
FROM planos_precos pp
LEFT JOIN auth_users au ON au.plano_preco_id = pp.id
WHERE pp.amount > 0
GROUP BY pp.id, pp.nome_plano, pp.amount
ORDER BY receita_mensal_potencial DESC;
```

**Exemplo de Resultado:**
```
nome_plano      | amount  | usuarios | receita_potencial
----------------|---------|----------|------------------
Profissional    | 1250.00 |    48    |     60,000.00
Essencial       |  650.00 |    32    |     20,800.00
Avançado        | 1500.00 |    12    |     18,000.00
                                       TOTAL: 98,800.00
```

---

### **4. Usuários Sem Plano Definido**

```sql
SELECT 
    au.username,
    au.name,
    au.role,
    au.campaign,
    au.phone,
    au.created_at
FROM auth_users au
WHERE au.plano_preco_id IS NULL
ORDER BY au.created_at DESC;
```

---

### **5. Campanhas por Plano**

```sql
SELECT 
    au.campaign,
    pp.nome_plano,
    COUNT(au.id) as total_usuarios,
    pp.amount,
    pp.amount * COUNT(au.id) as receita_potencial
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
GROUP BY au.campaign, pp.nome_plano, pp.amount
ORDER BY au.campaign, receita_potencial DESC;
```

**Exemplo de Resultado:**
```
campaign | nome_plano     | usuarios | amount  | receita_potencial
---------|----------------|----------|---------|------------------
A        | Profissional   |    35    | 1250.00 |     43,750.00
A        | Essencial      |    25    |  650.00 |     16,250.00
B        | Profissional   |    13    | 1250.00 |     16,250.00
B        | Avançado       |     8    | 1500.00 |     12,000.00
```

---

### **6. Funil Completo (Lead → Plano → Pagamento → Usuário)**

```sql
SELECT 
    ll.nome_completo as lead_nome,
    ll.email,
    ll.whatsapp,
    pp_lead.nome_plano as plano_escolhido,
    pp_lead.amount as valor_plano,
    lp.status as status_pagamento,
    lp.amount as valor_pago,
    au.username,
    au.name as user_name,
    au.role,
    pp_user.nome_plano as plano_vinculado
FROM landing_leads ll
LEFT JOIN planos_precos pp_lead ON ll.plano_preco_id = pp_lead.id
LEFT JOIN landing_payments lp ON lp.lead_id = ll.id
LEFT JOIN auth_users au ON au.phone = ll.whatsapp
LEFT JOIN planos_precos pp_user ON au.plano_preco_id = pp_user.id
ORDER BY ll.created_at DESC;
```

---

## 🎯 Casos de Uso

### **1. Controle de Acesso por Plano**

```sql
-- Verificar se usuário tem plano pago
SELECT 
    au.username,
    pp.nome_plano,
    pp.amount > 0 as is_plano_pago
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE au.username = 'joao';
```

---

### **2. Limitar Recursos por Plano**

```sql
-- Obter limite de membros do plano do usuário
SELECT 
    au.username,
    pp.nome_plano,
    pp.max_users as limite_usuarios
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE au.username = 'admin_campanha';
```

---

### **3. Upgrade de Plano**

```sql
-- Atualizar plano do usuário
UPDATE auth_users
SET plano_preco_id = (
    SELECT id FROM planos_precos WHERE nome_plano = 'Profissional'
)
WHERE username = 'joao';
```

---

### **4. Relatório de Receita por Período**

```sql
-- Receita gerada por novos usuários no último mês
SELECT 
    DATE_TRUNC('day', au.created_at) as data,
    pp.nome_plano,
    COUNT(au.id) as novos_usuarios,
    pp.amount * COUNT(au.id) as receita_dia
FROM auth_users au
INNER JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE au.created_at >= NOW() - INTERVAL '30 days'
AND pp.amount > 0
GROUP BY DATE_TRUNC('day', au.created_at), pp.nome_plano, pp.amount
ORDER BY data DESC, receita_dia DESC;
```

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| 🎯 **Controle de Acesso** | Liberar recursos baseado no plano |
| 💰 **Análise de Receita** | Calcular receita potencial e real |
| 📊 **Segmentação** | Filtrar usuários por plano contratado |
| 🔗 **Rastreabilidade** | Lead → Plano → Pagamento → Usuário |
| 🤖 **Automação** | Vínculo automático ao criar usuário |
| ⚡ **Performance** | Índices otimizados para consultas |
| 📈 **Relatórios** | Gerar relatórios de distribuição e receita |

---

## 🚀 Como Usar

### **Passo 1: Executar SQL**
```bash
# No Supabase SQL Editor
Execute: docs/ADICIONAR_PLANO_PRECO_ID_CAMPANHAS.sql
```

### **Passo 2: Verificar**
```sql
-- Ver estrutura
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'plano_preco_id'
AND table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links');
```

### **Passo 3: Testar**
```sql
-- Ver distribuição de planos
SELECT 
    pp.nome_plano,
    COUNT(au.id) as total_usuarios
FROM planos_precos pp
LEFT JOIN auth_users au ON au.plano_preco_id = pp.id
GROUP BY pp.nome_plano;
```

---

## 🔍 Fluxo Completo de Exemplo

```
1. 👤 Cliente escolhe "Profissional" na landing page
   ↓
   INSERT INTO landing_leads (nome_completo, whatsapp, plano_preco_id)
   VALUES ('João Silva', '62999999999', 'uuid-profissional')
   
2. 💳 Cliente paga R$ 1.250,00
   ↓
   INSERT INTO landing_payments (lead_id, amount, status)
   ↓
   Webhook N8N valida: amount = planos_precos.amount ✅
   
3. 🔧 Sistema cria usuário admin
   ↓
   INSERT INTO auth_users (username, phone, ...)
   VALUES ('admin_joao', '62999999999', ...)
   ↓
   TRIGGER vincular_plano_ao_usuario() executa:
   - Busca lead pelo phone
   - Vincula plano_preco_id automaticamente ✅
   
4. ✅ Usuário logado com plano "Profissional"
   ↓
   SELECT * FROM auth_users 
   JOIN planos_precos ON auth_users.plano_preco_id = planos_precos.id
   WHERE username = 'admin_joao'
   
   Resultado:
   - username: admin_joao
   - plano: Profissional
   - limite_usuarios: 5000
   - recursos: ['Painel completo', 'Mapa', 'Relatórios']
```

---

## 📝 Notas Importantes

1. ⚠️ **Nullable:** `plano_preco_id` é opcional - usuários podem ser criados manualmente sem plano
2. 🔄 **ON DELETE SET NULL:** Se deletar plano, usuário permanece
3. 📞 **WhatsApp como Chave:** Vínculo automático usa `phone` (WhatsApp)
4. ⏰ **LIMIT 1:** Se houver múltiplos leads com mesmo WhatsApp, pega o mais recente
5. 🔒 **RLS:** Respeita políticas de segurança existentes
6. 💰 **Receita Potencial:** Calculada com base no valor mensal do plano

---

## ✅ Checklist de Implementação

- [ ] Executar `ADICIONAR_PLANO_PRECO_ID_CAMPANHAS.sql`
- [ ] Verificar colunas criadas
- [ ] Verificar chaves estrangeiras
- [ ] Verificar índices
- [ ] Verificar triggers
- [ ] Testar cadastro lead → usuário → plano vinculado
- [ ] Verificar vínculo automático
- [ ] Atualizar registros existentes
- [ ] Testar consultas de receita
- [ ] Gerar relatório de distribuição de planos
- [ ] Implementar controle de acesso por plano

---

**Implementação completa! 🎉**

Agora você tem controle total de **planos**, **receita** e **recursos** por usuário/campanha! 💰🚀

