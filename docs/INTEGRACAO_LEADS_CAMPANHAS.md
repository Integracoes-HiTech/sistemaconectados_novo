# 🔗 Integração: Landing Leads → Campanhas

## 📋 Visão Geral

Este documento explica como vincular os **leads da landing page** (`landing_leads`) às **campanhas e usuários** do sistema principal.

---

## 🎯 Objetivo

Criar rastreabilidade completa do **funil de conversão**:

```
Landing Page → Lead → Pagamento → Usuário → Ações no Sistema
```

---

## 🗄️ Estrutura de Dados

### **Antes (Isolado):**

```
┌─────────────────┐
│ landing_leads   │  (Isolada)
└─────────────────┘

┌─────────────────┐
│ auth_users      │  (Isolada)
│ members         │
│ friends         │
│ users           │
│ user_links      │
└─────────────────┘
```

### **Depois (Integrado):**

```
┌─────────────────┐
│ landing_leads   │◄───┐
└─────────────────┘    │
                       │ lead_id (FK)
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

### **1. Adicionar Coluna `lead_id`**

```sql
-- Exemplo para auth_users
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS lead_id UUID 
REFERENCES landing_leads(id) ON DELETE SET NULL;
```

**Características:**
- ✅ `UUID` - mesmo tipo do ID de `landing_leads`
- ✅ `REFERENCES landing_leads(id)` - chave estrangeira
- ✅ `ON DELETE SET NULL` - se o lead for deletado, mantém o usuário mas remove o vínculo
- ✅ `NULLABLE` - usuários podem existir sem lead (criados manualmente)

---

### **2. Criar Índices**

```sql
-- Índice simples
CREATE INDEX idx_auth_users_lead_id ON auth_users(lead_id);

-- Índice composto (campaign + lead_id)
CREATE INDEX idx_auth_users_campaign_lead ON auth_users(campaign, lead_id);
```

**Performance:**
- ⚡ Busca rápida por `lead_id`
- ⚡ Filtragem combinada `campaign + lead_id`

---

### **3. Vincular Automaticamente**

```sql
-- Função para vincular lead ao usuário pelo email
CREATE OR REPLACE FUNCTION vincular_lead_ao_usuario()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        SELECT id INTO NEW.lead_id
        FROM landing_leads
        WHERE email = NEW.email
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auth_users
CREATE TRIGGER trigger_vincular_lead_auth_users
    BEFORE INSERT ON auth_users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_lead_ao_usuario();
```

**Comportamento:**
1. ✅ Ao criar usuário, busca lead pelo email
2. ✅ Vincula automaticamente o `lead_id`
3. ✅ Se não encontrar lead, deixa `NULL`

---

### **4. Atualizar Registros Existentes**

```sql
-- Vincular auth_users existentes aos leads
UPDATE auth_users au
SET lead_id = ll.id
FROM landing_leads ll
WHERE au.email = ll.email
AND au.lead_id IS NULL;
```

---

## 📊 Consultas Úteis

### **1. Ver Usuários Criados a Partir de Leads**

```sql
SELECT 
    ll.nome_completo as lead_nome,
    ll.email,
    ll.plano_escolhido,
    ll.status as lead_status,
    au.username,
    au.role,
    au.campaign,
    au.created_at as user_criado_em
FROM auth_users au
INNER JOIN landing_leads ll ON au.lead_id = ll.id
ORDER BY au.created_at DESC;
```

---

### **2. Ver Leads Sem Usuários**

```sql
SELECT 
    ll.nome_completo,
    ll.email,
    ll.plano_escolhido,
    ll.status,
    ll.created_at
FROM landing_leads ll
WHERE NOT EXISTS (
    SELECT 1 FROM auth_users WHERE lead_id = ll.id
)
ORDER BY ll.created_at DESC;
```

---

### **3. Taxa de Conversão (Lead → Usuário)**

```sql
SELECT 
    COUNT(DISTINCT ll.id) as total_leads,
    COUNT(DISTINCT au.id) as total_usuarios,
    ROUND(
        (COUNT(DISTINCT au.id)::NUMERIC / NULLIF(COUNT(DISTINCT ll.id), 0)) * 100,
        2
    ) as taxa_conversao_percent
FROM landing_leads ll
LEFT JOIN auth_users au ON au.lead_id = ll.id;
```

**Exemplo de Resultado:**
```
total_leads | total_usuarios | taxa_conversao_percent
------------|----------------|----------------------
    150     |      87        |         58.00
```

---

### **4. Análise por Plano**

```sql
SELECT 
    ll.plano_escolhido,
    COUNT(DISTINCT ll.id) as total_leads,
    COUNT(DISTINCT au.id) as usuarios_criados,
    ROUND(
        (COUNT(DISTINCT au.id)::NUMERIC / NULLIF(COUNT(DISTINCT ll.id), 0)) * 100,
        2
    ) as conversao_percent
FROM landing_leads ll
LEFT JOIN auth_users au ON au.lead_id = ll.id
GROUP BY ll.plano_escolhido
ORDER BY conversao_percent DESC;
```

**Exemplo de Resultado:**
```
plano_escolhido | total_leads | usuarios_criados | conversao_percent
----------------|-------------|------------------|------------------
Profissional    |     80      |       52         |      65.00
Essencial       |     40      |       22         |      55.00
Avançado        |     20      |       10         |      50.00
Gratuito        |     10      |        3         |      30.00
```

---

### **5. Funil Completo (Lead → Pagamento → Usuário)**

```sql
SELECT 
    ll.nome_completo,
    ll.email,
    ll.plano_escolhido,
    ll.status as lead_status,
    ll.created_at as lead_data,
    lp.status as payment_status,
    lp.amount as valor_pago,
    lp.created_at as payment_data,
    au.username,
    au.role,
    au.campaign,
    au.created_at as user_data
FROM landing_leads ll
LEFT JOIN landing_payments lp ON lp.lead_id = ll.id
LEFT JOIN auth_users au ON au.lead_id = ll.id
ORDER BY ll.created_at DESC;
```

---

## 🎯 Casos de Uso

### **1. Marketing: Rastrear Origem dos Usuários**

```sql
-- Quantos usuários vieram da landing page?
SELECT 
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_origem_landing,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as criados_manualmente,
    COUNT(*) as total
FROM auth_users;
```

---

### **2. Vendas: Identificar Leads Quentes**

```sql
-- Leads que pagaram mas ainda não viraram usuários
SELECT 
    ll.nome_completo,
    ll.email,
    ll.whatsapp,
    ll.plano_escolhido,
    lp.amount,
    lp.status as payment_status
FROM landing_leads ll
INNER JOIN landing_payments lp ON lp.lead_id = ll.id
WHERE lp.status = 'received'
AND NOT EXISTS (
    SELECT 1 FROM auth_users WHERE lead_id = ll.id
)
ORDER BY lp.created_at DESC;
```

---

### **3. Suporte: Histórico Completo do Cliente**

```sql
-- Ver tudo sobre um cliente específico
SELECT 
    'll - Lead' as tipo,
    ll.created_at,
    ll.nome_completo as nome,
    ll.email,
    ll.plano_escolhido as detalhe
FROM landing_leads ll
WHERE ll.email = 'cliente@example.com'

UNION ALL

SELECT 
    'lp - Pagamento' as tipo,
    lp.created_at,
    lp.status as nome,
    ll.email,
    'R$ ' || lp.amount::TEXT as detalhe
FROM landing_payments lp
JOIN landing_leads ll ON lp.lead_id = ll.id
WHERE ll.email = 'cliente@example.com'

UNION ALL

SELECT 
    'au - Usuário' as tipo,
    au.created_at,
    au.name as nome,
    au.email,
    au.role || ' / ' || au.campaign as detalhe
FROM auth_users au
WHERE au.email = 'cliente@example.com'

ORDER BY created_at;
```

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| 🎯 **Rastreabilidade** | Saber exatamente de onde cada usuário veio |
| 📊 **Análise de Conversão** | Medir taxa de conversão por plano, campanha, período |
| 🔗 **Dados Unificados** | Histórico completo do cliente em um só lugar |
| 🤖 **Automação** | Vínculo automático ao criar usuário |
| ⚡ **Performance** | Índices otimizados para consultas rápidas |
| 💰 **ROI Marketing** | Saber quais campanhas geram mais usuários pagos |

---

## 🚀 Como Usar

### **Passo 1: Executar SQL**
```bash
# No Supabase SQL Editor
Execute: docs/ADICIONAR_LEAD_ID_CAMPANHAS.sql
```

### **Passo 2: Verificar**
```sql
-- Ver estrutura
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name = 'lead_id'
AND table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links');
```

### **Passo 3: Testar**
```sql
-- Criar um lead de teste
INSERT INTO landing_leads (
    nome_completo, email, cpf_cnpj, whatsapp, plano_escolhido
) VALUES (
    'João Teste', 'joao@teste.com', '12345678900', '62999999999', 'Profissional'
);

-- Criar usuário (deve vincular automaticamente)
INSERT INTO auth_users (
    username, password, name, email, role, campaign
) VALUES (
    'joao_teste', 'senha123', 'João Teste', 'joao@teste.com', 'Membro', 'A'
);

-- Verificar vínculo
SELECT 
    au.username,
    au.email,
    ll.nome_completo,
    ll.plano_escolhido
FROM auth_users au
LEFT JOIN landing_leads ll ON au.lead_id = ll.id
WHERE au.email = 'joao@teste.com';
```

---

## 📝 Notas Importantes

1. ⚠️ **Nullable:** `lead_id` é opcional - usuários podem ser criados manualmente
2. 🔄 **ON DELETE SET NULL:** Se deletar lead, usuário permanece
3. 📧 **Email como Chave:** Vínculo automático usa email
4. ⏰ **LIMIT 1:** Se houver múltiplos leads com mesmo email, pega o mais recente
5. 🔒 **RLS:** Respeita políticas de segurança existentes

---

## 🎓 Exemplo Completo de Fluxo

```
1. 👤 Cliente preenche landing page
   ↓
   INSERT INTO landing_leads (nome_completo, email, plano_escolhido)
   
2. 💳 Cliente paga
   ↓
   INSERT INTO landing_payments (lead_id, amount, status)
   UPDATE landing_leads SET status = 'pago'
   
3. 🔧 Sistema cria usuário (manual ou automático)
   ↓
   INSERT INTO auth_users (username, email, ...)
   TRIGGER vincular_lead_ao_usuario() → busca lead_id automaticamente
   
4. 📊 Análise de conversão
   ↓
   SELECT * FROM auth_users WHERE lead_id IS NOT NULL
   JOIN landing_leads, landing_payments
```

---

## 🔍 Troubleshooting

### **Lead não está vinculando ao usuário**

```sql
-- 1. Verificar se o trigger existe
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_vincular_lead_auth_users';

-- 2. Verificar se há lead com o email
SELECT * FROM landing_leads WHERE email = 'usuario@email.com';

-- 3. Vincular manualmente
UPDATE auth_users 
SET lead_id = (
    SELECT id FROM landing_leads 
    WHERE email = 'usuario@email.com' 
    LIMIT 1
)
WHERE email = 'usuario@email.com';
```

---

## ✅ Checklist de Implementação

- [ ] Executar `ADICIONAR_LEAD_ID_CAMPANHAS.sql`
- [ ] Verificar colunas criadas
- [ ] Verificar chaves estrangeiras
- [ ] Verificar índices
- [ ] Verificar triggers
- [ ] Testar cadastro de lead → usuário
- [ ] Verificar vínculo automático
- [ ] Atualizar registros existentes
- [ ] Testar consultas de análise
- [ ] Documentar uso para equipe

---

**Implementação completa! 🎉**

Agora você tem rastreabilidade total do funil de conversão: **Landing → Lead → Pagamento → Usuário → Ações**.

