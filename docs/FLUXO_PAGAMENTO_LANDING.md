# 🌐 Fluxo de Pagamento - Landing Page

## 📋 Visão Geral

Este documento descreve o fluxo completo de pagamento da landing page, desde o preenchimento do formulário até o redirecionamento para o ASAAS.

## 🔄 Fluxo Passo a Passo

### **1. Usuário preenche o formulário**
```
- Nome completo
- CPF/CNPJ
- WhatsApp
- CEP (com auto-preenchimento de cidade/bairro)
- Email
- Cores (opcional)
```

### **2. Usuário seleciona um plano**
```
- Gratuito (R$ 0)
- Essencial (R$ 650)
- Profissional (R$ 1.250) ⭐ Mais escolhido
- Avançado (R$ 1.500)
```

### **3. Usuário clica "Avançar para Pagamento"**

---

## 🔀 Processamento

### **Se plano for GRATUITO:**

```javascript
1. Salvar lead no banco (landing_leads)
2. Mostrar mensagem de sucesso
3. Fim
```

### **Se plano for PAGO:**

```javascript
1. 💾 SALVAR LEAD NO BANCO
   - Tabela: landing_leads
   - Retorna: lead_id (UUID)
   - Exemplo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

2. 🌐 CHAMAR WEBHOOK N8N
   - URL: https://n8n.admin.hitechdesenvolvimento.com.br/webhook/...
   - Method: POST
   - Body: {
       lead_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  ⬅️ SOMENTE O ID
     }
   
   ⚠️ IMPORTANTE: O webhook recebe SOMENTE o lead_id
   O webhook N8N deve buscar os dados completos na tabela landing_leads usando este ID

3. 📥 RECEBER RESPOSTA DO N8N
   - Espera retornar:
     {
       payment_id: "pay_xxx",
       payment_url: "https://www.asaas.com/...",
       due_date: "2025-10-20",
       status: "pending"
     }

4. 💾 SALVAR PAGAMENTO NO BANCO
   - Tabela: landing_payments
   - Dados: {
       lead_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
       payment_gateway: "asaas",
       payment_id: "pay_xxx",
       payment_url: "https://www.asaas.com/...",
       amount: 1250,
       currency: "BRL",
       status: "pending",
       payment_method: "PIX",
       due_date: "2025-10-20"
     }

5. ✅ MOSTRAR MODAL DE SUCESSO
   - Exibir informações do plano
   - Mostrar botão "💳 Pagar Agora"
   - Botão redireciona para payment_url

6. 🔗 USUÁRIO CLICA "PAGAR AGORA"
   - Abre payment_url em nova aba
   - Usuário paga no ASAAS
```

---

## 🎯 Dados Enviados ao Webhook N8N

### **Payload Simplificado (SOMENTE lead_id):**

```json
{
  "lead_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### **⚠️ O Webhook N8N deve:**

1. **Receber o `lead_id`**
2. **Buscar os dados completos** na tabela `landing_leads`:
   ```sql
   SELECT * FROM landing_leads WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   ```
3. **Criar o pagamento no ASAAS** usando os dados do banco
4. **Retornar o `payment_url`** para a landing page

### **Dados Esperados na Resposta:**

```json
{
  "payment_id": "ID do pagamento no ASAAS",
  "payment_url": "URL para pagamento (obrigatório)",
  "due_date": "Data de vencimento (opcional)",
  "status": "pending (opcional)"
}
```

⚠️ **IMPORTANTE:** O webhook **DEVE** retornar `payment_url`, caso contrário, o usuário verá uma mensagem de erro.

---

## 🔍 Logs de Debug

### **Console do navegador mostrará:**

```
🚀 Iniciando envio do formulário...
📋 Plano selecionado: profissional
📝 Dados coletados do formulário: {...}
🔍 Validando campos obrigatórios...
✅ Todas as validações passaram
💳 Iniciando processamento do pagamento...
💳 Iniciando createPaidPayment...
💾 Salvando lead no banco...
✅ Lead salvo com ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
🌐 Gerando link de pagamento via N8N...
🌐 === INICIANDO CHAMADA N8N ===
📋 Lead Data recebido: {...}
📋 Plan Details recebido: {...}
📤 Payload preparado para N8N: {...}
🔗 URL do webhook: https://n8n.admin...
🔄 Enviando requisição POST...
📡 Resposta recebida!
✅ Link de pagamento gerado: https://www.asaas.com/...
💾 Salvando dados do pagamento no banco...
✅ Pagamento salvo no banco com ID: xxx
✅ createPaidPayment concluído com sucesso!
📊 Resultado do processamento: {...}
✅ Pagamento processado com sucesso
```

---

## 🧪 Como Testar

### **1. Teste isolado do webhook:**
```bash
# Abrir arquivo: test-webhook.html
# Clicar em "🚀 Testar Webhook"
# Verificar se retorna payment_url
```

### **2. Teste completo da landing page:**
```bash
# Abrir arquivo: public/landing.html
# 1. Escolher plano (ex: Profissional)
# 2. Preencher formulário
# 3. Clicar "Avançar para Pagamento"
# 4. Abrir console (F12)
# 5. Ver logs acima
# 6. Verificar se modal aparece com botão "Pagar Agora"
# 7. Clicar no botão e verificar redirecionamento
```

---

## ⚠️ Possíveis Problemas

### **1. Webhook não retorna payment_url**
```
❌ Erro: Link de pagamento não foi gerado
Solução: Verificar resposta do N8N no console
```

### **2. Erro de CORS**
```
❌ Erro: CORS policy blocked
Solução: Configurar CORS no webhook N8N
```

### **3. Erro ao salvar no banco**
```
❌ Erro: RLS policy violation
Solução: Verificar políticas RLS das tabelas
```

### **4. Webhook offline**
```
❌ Erro: Failed to fetch
Solução: Verificar se N8N está rodando
```

---

## 📊 Tabelas do Banco

### **landing_leads:**
```sql
id UUID PRIMARY KEY
nome_completo TEXT
cpf_cnpj TEXT
whatsapp TEXT
cep TEXT
cidade TEXT
bairro TEXT
email TEXT
cor_principal TEXT
cor_secundaria TEXT
plano_escolhido TEXT
created_at TIMESTAMP
```

### **landing_payments:**
```sql
id UUID PRIMARY KEY
lead_id UUID (FK → landing_leads.id)
payment_gateway TEXT (default: 'asaas')
payment_id TEXT
payment_url TEXT
amount NUMERIC
currency TEXT (default: 'BRL')
status TEXT (default: 'pending')
payment_method TEXT
due_date DATE
created_at TIMESTAMP
```

---

## ✅ Checklist de Implementação

- [x] Formulário com validações
- [x] Seleção de plano obrigatória
- [x] Salvar lead no banco PRIMEIRO
- [x] Enviar lead_id para webhook N8N
- [x] Receber payment_url do N8N
- [x] Salvar pagamento no banco
- [x] Exibir modal de sucesso
- [x] Botão "Pagar Agora" com redirecionamento
- [x] Logs de debug completos
- [x] Tratamento de erros
- [x] Mensagens amigáveis ao usuário

---

## 🎯 Próximos Passos

1. **Testar webhook N8N** → `test-webhook.html`
2. **Verificar resposta do N8N** → Deve conter `payment_url`
3. **Testar fluxo completo** → `public/landing.html`
4. **Verificar banco de dados** → Dados salvos corretamente
5. **Testar redirecionamento** → Botão "Pagar Agora" funciona

---

**Data de atualização:** 11/10/2025
**Versão:** 1.0

