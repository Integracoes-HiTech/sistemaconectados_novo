# 🔄 Atualização do Webhook N8N

## 📋 Mudança Realizada

### **Webhook Anterior (Teste):**
```
https://n8n.admin.hitechdesenvolvimento.com.br/webhook-test/554ce0ca-4b36-4d56-a2ce-79d874533ca0
```

### **Webhook Novo (Produção):**
```
https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0
```

---

## 📂 Arquivos Atualizados

### **1. Código Principal:**
- ✅ `public/landing.html` (linha 1519)

### **2. Documentação:**
- ✅ `docs/FLUXO_PAGAMENTO_COMPLETO.md` (linha 74)
- ✅ `docs/FLUXO_PAGAMENTO_LANDING.md` (linha 50)
- ✅ `docs/N8N_ENVIRONMENT_VARIABLES.md`
- ✅ `docs/RESOLVER_CORS_N8N.md`

### **3. Ferramentas de Teste:**
- ✅ `docs/TEST_N8N_ENDPOINT.html` (linhas 65 e 110)

---

## 🔍 O que Mudou?

### **URL:**
- ❌ Removido: `/webhook-test/` (ambiente de teste)
- ✅ Adicionado: `/webhook/` (ambiente de produção)

### **Impacto:**
- O webhook agora aponta para o endpoint de **produção** do N8N
- Todas as referências foram atualizadas consistentemente
- Testes devem ser refeitos com o novo endpoint

---

## 🧪 Como Testar

### **1. Teste Manual no Navegador:**
```javascript
// Abrir console do navegador (F12)
fetch('https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ lead_id: "seu-lead-id-aqui" })
})
.then(res => res.json())
.then(data => console.log('✅ Resposta:', data))
.catch(err => console.error('❌ Erro:', err));
```

### **2. Teste com a Landing Page:**
1. Abrir `http://localhost:8081/landing.html`
2. Escolher um plano
3. Preencher formulário
4. Clicar em "Avançar para Pagamento"
5. Verificar console do navegador para logs

### **3. Teste com Arquivo Dedicado:**
Abrir `docs/TEST_N8N_ENDPOINT.html` no navegador

---

## 📊 Resposta Esperada do Webhook

```json
{
  "LinkToCheckout": "https://sandbox.asaas.com/checkoutSession/show/b7c146c3-76ae-4b8d-bf07-7b3c8a0d1b9f",
  "ClientId": "ebe9a2bf-fd63-44d8-a4d2-e4ff0a919699"
}
```

---

## ⚠️ Configuração CORS Necessária

O webhook N8N **DEVE** ter os seguintes headers configurados:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

**Como configurar no N8N:**
1. Abrir o workflow no N8N
2. Clicar no nó "Webhook"
3. Ir em "Response" → "Options"
4. Adicionar headers:
   - `Access-Control-Allow-Origin` = `*`
   - `Access-Control-Allow-Methods` = `POST, OPTIONS`
   - `Access-Control-Allow-Headers` = `Content-Type`

---

## 🔐 Segurança

### **O que o Webhook Recebe:**
```json
{
  "lead_id": "uuid-do-lead"
}
```

### **O que o Webhook Deve Fazer:**
1. ✅ Buscar dados completos do lead no Supabase usando `lead_id`
2. ✅ Buscar detalhes do plano em `planos_precos` usando `plano_preco_id`
3. ✅ Validar que o plano existe e está ativo
4. ✅ Criar cobrança no ASAAS com dados validados do banco
5. ✅ Retornar `LinkToCheckout` e `ClientId`

### **Por que é Seguro:**
- ❌ Frontend NÃO envia valor/preço (antifraude)
- ✅ Preço vem do banco de dados (fonte confiável)
- ✅ Backend valida todos os dados antes de criar cobrança
- ✅ Lead já está salvo no banco antes do pagamento

---

## 🚨 Troubleshooting

### **Erro: Failed to fetch**
**Causa:** CORS não configurado ou webhook offline  
**Solução:** Verificar headers CORS no N8N

### **Erro: 404 Not Found**
**Causa:** Webhook URL incorreta ou workflow não ativado  
**Solução:** Verificar que o workflow está ativo no N8N

### **Erro: 500 Internal Server Error**
**Causa:** Erro no processamento do N8N  
**Solução:** Verificar logs do workflow no N8N

---

## 📝 Checklist de Validação

- [x] URL atualizada em `public/landing.html`
- [x] Documentação atualizada
- [x] Arquivo de teste atualizado
- [x] CORS configurado no N8N
- [ ] Workflow N8N está ativo
- [ ] Teste realizado com sucesso
- [ ] Redirecionamento para ASAAS funcionando

---

## 📚 Arquivos Relacionados

- `public/landing.html` - Código principal da landing page
- `docs/FLUXO_PAGAMENTO_COMPLETO.md` - Fluxo detalhado
- `docs/TEST_N8N_ENDPOINT.html` - Ferramenta de teste
- `docs/RESOLVER_CORS_N8N.md` - Solução de problemas CORS

---

**Data da Atualização:** 12/10/2025  
**Versão:** 2.0 - Webhook de Produção  
**Status:** ✅ Atualizado e pronto para uso

