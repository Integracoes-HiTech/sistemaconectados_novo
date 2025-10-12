# 🎯 Novo Fluxo - Planos e Preços do Banco de Dados

## 📋 Visão Geral

Sistema refatorado para buscar planos e preços diretamente do banco de dados, **evitando fraudes** e permitindo gerenciamento centralizado.

---

## 🗄️ Estrutura do Banco

### **Tabela: `planos_precos`**

```sql
CREATE TABLE planos_precos (
    id UUID PRIMARY KEY,
    nome_plano VARCHAR(100) NOT NULL,
    descricao TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    recorrencia VARCHAR(50) DEFAULT 'mensal',
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    max_users INTEGER,
    order_display INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### **Tabela: `landing_leads` (atualizada)**

```sql
ALTER TABLE landing_leads 
ADD COLUMN plano_preco_id UUID REFERENCES planos_precos(id);
```

---

## 🔒 Segurança Contra Fraudes

### **ANTES (inseguro):**
```javascript
// Cliente podia modificar o preço no frontend
{
  plan: 'profissional',
  amount: 1  // ❌ FRAUDE! Cliente alterou de 1250 para 1
}
```

### **AGORA (seguro):**
```javascript
// Cliente só envia o ID do plano
{
  plano_preco_id: 'uuid-do-plano'
}

// Servidor busca o valor no banco
SELECT amount FROM planos_precos WHERE id = 'uuid-do-plano'
// ✅ amount = 1250 (valor real do banco)
```

---

## 🔄 Novo Fluxo Completo

### **1. Carregar Planos (ao abrir a página)**

```javascript
// Frontend carrega planos do banco
GET /rest/v1/planos_precos?is_active=eq.true&order=order_display.asc

// Resposta:
[
  {
    id: 'uuid-1',
    nome_plano: 'Gratuito',
    amount: 0,
    features: ['100 cadastros', ...],
    ...
  },
  {
    id: 'uuid-2',
    nome_plano: 'Profissional',
    amount: 1250,
    features: ['5.000 cadastros', ...],
    ...
  }
]
```

### **2. Usuário Escolhe Plano**

```javascript
// Ao clicar no plano
selectPlan('uuid-2', 'Profissional')

// Armazena:
selected Plan Id = 'uuid-2'
selectedPlan = 'Profissional'
```

### **3. Usuário Preenche Formulário**

```javascript
{
  nome_completo: 'João Silva',
  email: 'joao@email.com',
  ...
  plano_preco_id: 'uuid-2'  // ✅ Só o ID
}
```

### **4. Salvar no Banco**

```javascript
// Frontend envia
POST /rest/v1/landing_leads
{
  nome_completo: 'João Silva',
  plano_preco_id: 'uuid-2',  // ✅ ID do plano
  ...
}

// Banco retorna
{
  id: 'lead-uuid',
  plano_preco_id: 'uuid-2',
  ...
}
```

### **5. Webhook N8N Busca Dados**

```javascript
// Webhook recebe
{
  lead_id: 'lead-uuid'
}

// Webhook faz JOIN no banco
SELECT 
  l.*,
  p.nome_plano,
  p.amount,
  p.descricao
FROM landing_leads l
JOIN planos_precos p ON p.id = l.plano_preco_id
WHERE l.id = 'lead-uuid'

// Retorna dados completos
{
  nome_completo: 'João Silva',
  plano: 'Profissional',
  amount: 1250,  // ✅ Valor do banco (seguro)
  ...
}
```

### **6. Webhook Cria Pagamento no ASAAS**

```javascript
// Usa o amount do banco
POST https://api.asaas.com/v3/payments
{
  customer: '...',
  value: 1250,  // ✅ Valor real do banco
  description: 'Plano Profissional - CONECTADOS'
}
```

### **7. Webhook Retorna payment_url**

```javascript
{
  payment_id: 'pay_xxx',
  payment_url: 'https://www.asaas.com/...',
  due_date: '2025-10-20'
}
```

### **8. Redireciona para Tela de Sucesso**

```javascript
/sucesso.html?lead_id=xxx&plano_preco_id=uuid-2&payment_url=https://...

// Página de sucesso busca dados do plano
SELECT * FROM planos_precos WHERE id = 'uuid-2'

// Exibe:
- Plano: Profissional
- Valor: R$ 1.250,00  // ✅ Do banco
- Botão: Pagar Agora
```

---

## 📊 Dados Armazenados

### **landing_leads:**
```sql
id                  | lead-uuid
nome_completo       | João Silva
email               | joao@email.com
plano_preco_id      | uuid-2  ✅ Referência ao plano
created_at          | 2025-10-11 18:00:00
```

### **planos_precos:**
```sql
id                  | uuid-2
nome_plano          | Profissional
amount              | 1250.00  ✅ Valor real
features            | ["5.000 cadastros", ...]
is_active           | true
```

### **Relacionamento:**
```
landing_leads.plano_preco_id → planos_precos.id
```

---

## 🛡️ Prevenção de Fraudes

### **Tentativa de Fraude:**

```javascript
// Cliente tenta modificar no console
selectedPlanId = 'uuid-1'  // Muda de Profissional para Gratuito
amount = 0

// ❌ NÃO FUNCIONA!
// Servidor ignora e busca do banco:
SELECT amount FROM planos_precos WHERE id = 'uuid-2'
// Retorna: 1250
```

### **Validação no Backend:**

```javascript
// Webhook N8N
const leadData = await supabase
  .from('landing_leads')
  .select('*, planos_precos(*)')  // JOIN
  .eq('id', lead_id)
  .single();

// ✅ amount vem do banco, não do cliente
const amount = leadData.planos_precos.amount;
```

---

## 🎨 Interface (Landing Page)

### **Cards de Planos Dinâmicos:**

```html
<!-- Gerado dinamicamente do banco -->
<div class="pricing-card" onclick="selectPlan('uuid-2', 'Profissional')">
  <h3>Profissional</h3>
  <p class="price">R$ 1.250,00/mês</p>
  <ul>
    <li>5.000 cadastros</li>
    <li>Painel completo</li>
    <li>Mapa interativo</li>
  </ul>
  <button>Escolher Plano</button>
</div>
```

---

## 🔧 Gerenciamento de Planos

### **AdminHitech pode gerenciar:**

```sql
-- Criar novo plano
INSERT INTO planos_precos (nome_plano, amount, ...) VALUES (...);

-- Atualizar preço
UPDATE planos_precos SET amount = 1500 WHERE id = 'uuid-2';

-- Desativar plano
UPDATE planos_precos SET is_active = false WHERE id = 'uuid-1';

-- Reordenar exibição
UPDATE planos_precos SET order_display = 1 WHERE id = 'uuid-2';
```

---

## 📋 Consultas Úteis

### **Listar planos ativos:**
```sql
SELECT * FROM planos_precos 
WHERE is_active = true 
ORDER BY order_display;
```

### **Ver receita potencial por plano:**
```sql
SELECT 
  p.nome_plano,
  COUNT(l.id) as total_leads,
  SUM(p.amount) as receita_potencial
FROM planos_precos p
LEFT JOIN landing_leads l ON l.plano_preco_id = p.id
GROUP BY p.id, p.nome_plano
ORDER BY receita_potencial DESC;
```

### **Leads sem plano definido:**
```sql
SELECT * FROM landing_leads 
WHERE plano_preco_id IS NULL;
```

---

## ✅ Benefícios

| Benefício | Antes | Agora |
|-----------|-------|-------|
| **Segurança** | ❌ Cliente controla preço | ✅ Banco controla preço |
| **Fraude** | ❌ Possível alterar amount | ✅ Impossível fraudar |
| **Gerenciamento** | ❌ Hardcoded no frontend | ✅ Admin gerencia no banco |
| **Auditoria** | ❌ Sem histórico | ✅ Histórico completo |
| **Flexibilidade** | ❌ Precisa alterar código | ✅ Atualiza no banco |

---

## 🚀 Próximos Passos

1. ✅ Criar tabela `planos_precos`
2. ✅ Adicionar coluna `plano_preco_id` em `landing_leads`
3. ⏳ Modificar frontend para carregar planos do banco
4. ⏳ Modificar frontend para enviar `plano_preco_id`
5. ⏳ Atualizar webhook N8N para fazer JOIN
6. ⏳ Atualizar página de sucesso para buscar plano do banco
7. ⏳ Testar fluxo completo

---

**Data:** 11/10/2025
**Versão:** 2.0 - Sistema com Segurança Antifraude

