# 🔄 Fluxo Completo de Pagamento - Landing Page

## 📋 Visão Geral

Sistema integrado com **Supabase**, **N8N** e **ASAAS** para processar cadastros e pagamentos de planos.

---

## 🎯 Fluxo de Cadastro e Pagamento

### **1️⃣ Usuário Escolhe o Plano**
```
Usuário clica em "Escolher Plano" → Plano é destacado → Scroll automático para formulário
```

**Dados salvos:**
- `selectedPlanId` (ID do banco - tabela `planos_precos`)
- `selectedPlan` (nome do plano para exibição)

---

### **2️⃣ Usuário Preenche o Formulário**
```
Formulário com validações:
- Nome completo
- Email
- WhatsApp (com máscara e validação)
- Instagram
- CEP (busca automática via ViaCEP)
- Cidade / Bairro (preenchimento automático)
- Documento (CPF ou CNPJ com validação)
- Cores do sistema (cor_principal, cor_secundaria)
```

---

### **3️⃣ Usuário Clica em "Avançar para Pagamento"**

**Validações:**
- ✅ Plano foi selecionado?
- ✅ Todos os campos obrigatórios preenchidos?
- ✅ Dados válidos (telefone, documento, CEP)?

---

### **4️⃣ Sistema Salva o Lead no Banco (Supabase)**

**Tabela:** `landing_leads`

```javascript
{
  nome_completo: "João Silva",
  email: "joao@email.com",
  whatsapp: "(11) 98765-4321",
  instagram: "@joaosilva",
  cep: "01310-100",
  cidade: "São Paulo",
  bairro: "Bela Vista",
  documento: "123.456.789-00",
  tipo_documento: "cpf",
  plano_escolhido: "profissional",
  plano_preco_id: "uuid-do-plano",  // 🔑 ID do banco (antifraude)
  cor_principal: "#4F46E5",
  cor_secundaria: "#10B981"
}
```

**Retorna:** `lead_id` (UUID)

---

### **5️⃣ Sistema Envia lead_id para Webhook N8N**

**Endpoint:** `https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0`

**Método:** `POST`

**Payload:**
```json
{
  "lead_id": "uuid-do-lead"
}
```

**⚠️ Importante:**
- O webhook N8N **busca os dados completos** do lead no Supabase usando o `lead_id`
- Isso garante que o preço não pode ser manipulado no frontend (antifraude)

---

### **6️⃣ N8N Processa e Chama ASAAS**

**Fluxo no N8N:**
1. Recebe `lead_id`
2. Busca dados completos em `landing_leads` (via Supabase)
3. Busca preço e detalhes em `planos_precos` usando `plano_preco_id`
4. Cria cobrança no ASAAS com os dados validados
5. Retorna link de checkout

**Resposta do N8N:**
```json
{
  "LinkToCheckout": "https://sandbox.asaas.com/checkoutSession/show/b7c146c3-76ae-4b8d-bf07-7b3c8a0d1b9f",
  "ClientId": "ebe9a2bf-fd63-44d8-a4d2-e4ff0a919699"
}
```

---

### **7️⃣ Sistema Salva Dados do Pagamento no Banco**

**Tabela:** `landing_payments`

```javascript
{
  lead_id: "uuid-do-lead",
  payment_gateway: "asaas",
  payment_id: "ebe9a2bf-fd63-44d8-a4d2-e4ff0a919699",  // ClientId
  payment_url: "https://sandbox.asaas.com/checkoutSession/...",  // LinkToCheckout
  amount: 149.90,
  currency: "BRL",
  status: "pending",
  payment_method: "PIX",
  due_date: "2025-11-15"
}
```

---

### **8️⃣ Sistema Redireciona DIRETO para Checkout ASAAS**

```javascript
window.location.href = result.paymentUrl;
// Exemplo: https://sandbox.asaas.com/checkoutSession/show/b7c146c3-76ae-4b8d-bf07-7b3c8a0d1b9f
```

**✅ Usuário é levado direto para a página de pagamento do ASAAS**

---

## 🔐 Segurança Antifraude

### **Por que usar `plano_preco_id` do banco?**

❌ **Forma Insegura (antiga):**
```javascript
// Usuário poderia manipular no console do navegador
const amount = 149.90;  // Hackear para 0.01
```

✅ **Forma Segura (atual):**
```javascript
// Frontend envia apenas o ID do plano
plano_preco_id: "uuid-do-plano"

// Backend busca o preço real no banco
// Usuário NÃO pode manipular o valor
```

---

## 📊 Estrutura do Banco de Dados

### **Tabela: `planos_precos`**
```sql
CREATE TABLE planos_precos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  recorrencia VARCHAR(20) DEFAULT 'mensal',
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Exemplo de registro:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Profissional",
  "descricao": "Plano ideal para profissionais",
  "amount": 149.90,
  "recorrencia": "mensal",
  "features": ["100 membros", "Relatórios", "Suporte prioritário"],
  "is_active": true
}
```

---

### **Tabela: `landing_leads`**
```sql
CREATE TABLE landing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20),
  instagram VARCHAR(100),
  cep VARCHAR(10),
  cidade VARCHAR(100),
  bairro VARCHAR(100),
  documento VARCHAR(20),
  tipo_documento VARCHAR(10),
  plano_escolhido VARCHAR(50),
  plano_preco_id UUID REFERENCES planos_precos(id),  -- 🔑 Chave estrangeira
  cor_principal VARCHAR(7),
  cor_secundaria VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Tabela: `landing_payments`**
```sql
CREATE TABLE landing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES landing_leads(id) ON DELETE CASCADE,
  payment_gateway VARCHAR(50),
  payment_id VARCHAR(255),  -- NULLABLE (ClientId do ASAAS)
  payment_url TEXT,         -- LinkToCheckout do ASAAS
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Configuração CORS no N8N

**⚠️ Para o webhook funcionar do navegador:**

```
Webhook Settings → Response Headers:
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## 📝 Logs de Debug

### **Console do Navegador:**
```
💳 Iniciando processamento do pagamento...
📤 Dados coletados do formulário: {...}
💾 Salvando lead no banco de dados...
✅ Lead salvo com ID: uuid-do-lead
🌐 Gerando link de pagamento via N8N...
📤 Payload preparado para N8N (SOMENTE lead_id): { lead_id: "..." }
✅ Dados recebidos do N8N: { LinkToCheckout: "...", ClientId: "..." }
💾 Salvando dados do pagamento no banco...
✅ Pagamento salvo no banco
💳 Redirecionando DIRETAMENTE para checkout ASAAS...
🔗 URL: https://sandbox.asaas.com/checkoutSession/show/...
```

---

## 🎯 Resumo do Fluxo

```
┌──────────────────┐
│  1. Usuário      │
│  escolhe plano   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  2. Preenche     │
│  formulário      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  3. Clica        │
│  "Avançar"       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  4. Salva lead   │
│  no Supabase     │◄──── landing_leads (com plano_preco_id)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  5. Envia        │
│  lead_id → N8N   │──────► { lead_id: "..." }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  6. N8N busca    │
│  dados no banco  │◄──── Busca lead + plano_preco (antifraude)
│  e chama ASAAS   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  7. Retorna      │
│  LinkToCheckout  │──────► { LinkToCheckout, ClientId }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  8. Salva        │
│  payment no      │◄──── landing_payments
│  Supabase        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  9. Redireciona  │
│  DIRETO para     │──────► window.location.href = LinkToCheckout
│  checkout ASAAS  │
└──────────────────┘
```

---

## ✅ Vantagens da Arquitetura Atual

1. **🔐 Segurança Antifraude**: Preço vem do banco, não do frontend
2. **📊 Rastreabilidade**: Todos os dados salvos antes do pagamento
3. **🔄 Recuperação**: Se o pagamento falhar, lead já está salvo
4. **🎯 Experiência Direta**: Usuário vai direto para checkout
5. **💾 Auditoria Completa**: Logs de todos os passos do processo

---

## 🛠️ Troubleshooting

### **❌ Erro CORS**
**Solução:** Configure headers no webhook N8N

### **❌ Link não gerado**
**Verificar:**
1. Webhook N8N está ativo?
2. Lead foi salvo no banco?
3. `plano_preco_id` é válido?

### **❌ Não redireciona**
**Verificar:**
1. `result.paymentUrl` está preenchido?
2. Console do navegador para ver logs

---

## 📚 Arquivos Relacionados

- `public/landing.html` - Página principal
- `docs/TABELA_PLANOS_PRECOS.sql` - Schema do banco
- `docs/FLUXO_PAGAMENTO_LANDING.md` - Fluxo anterior
- `docs/RESOLVER_CORS_N8N.md` - Solução CORS
- `docs/NOVO_FLUXO_PLANOS_BANCO.md` - Sistema antifraude

---

**Última atualização:** 12/10/2025 - Redirecionamento direto para ASAAS implementado ✅

