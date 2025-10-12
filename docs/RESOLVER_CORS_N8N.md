# 🚨 Resolver Erro de CORS - Webhook N8N

## ❌ Erro Atual:

```
Access to fetch at 'https://n8n.admin.hitechdesenvolvimento.com.br/webhook-test/...' 
from origin 'http://localhost:8081' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## 🎯 O que é CORS?

**CORS (Cross-Origin Resource Sharing)** é uma segurança do navegador que bloqueia requisições de um domínio para outro.

- **Origem da landing page:** `http://localhost:8081`
- **Destino do webhook:** `https://n8n.admin.hitechdesenvolvimento.com.br`
- **Problema:** O webhook não está configurado para aceitar requisições do navegador

---

## ✅ Soluções:

### **Solução 1: Configurar CORS no Webhook N8N (RECOMENDADO)**

1. **Acesse o N8N:** `https://n8n.admin.hitechdesenvolvimento.com.br`
2. **Abra o workflow** que contém o webhook
3. **No nó Webhook**, adicione nos **Response Headers**:
   ```json
   {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type, X-Requested-With"
   }
   ```
4. **Salve e ative** o workflow

---

### **Solução 2: Adicionar Nó "Respond to Webhook" com CORS**

Se o webhook não tem resposta configurada:

1. **Adicione um nó "Respond to Webhook"** no final do workflow
2. **Configure os headers:**
   - `Access-Control-Allow-Origin`: `*`
   - `Access-Control-Allow-Methods`: `POST, OPTIONS`
   - `Access-Control-Allow-Headers`: `Content-Type, X-Requested-With`
3. **Retorne os dados** necessários:
   ```json
   {
     "payment_id": "{{$json.payment_id}}",
     "payment_url": "{{$json.payment_url}}",
     "due_date": "{{$json.due_date}}",
     "status": "pending"
   }
   ```

---

### **Solução 3: Configurar CORS no Nginx (N8N Server)**

Se você tem acesso ao servidor N8N, adicione no Nginx:

```nginx
location /webhook-test/ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, X-Requested-With' always;
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
    
    proxy_pass http://localhost:5678;
}
```

---

### **Solução 4: Usar Proxy Local (Temporário para Testes)**

Enquanto configura o CORS, você pode usar um proxy:

1. **Instale o CORS Proxy:**
   ```bash
   npm install -g local-cors-proxy
   ```

2. **Execute:**
   ```bash
   lcp --proxyUrl https://n8n.admin.hitechdesenvolvimento.com.br
   ```

3. **Altere a URL na landing page:**
   ```javascript
   const N8N_WEBHOOK_URL = 'http://localhost:8010/proxy/webhook-test/554ce0ca-4b36-4d56-a2ce-79d874533ca0';
   ```

---

## 🧪 Como Testar:

### **1. Teste direto no navegador:**

Abra o **DevTools Console** e execute:

```javascript
fetch('https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lead_id: 'test-123'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Sucesso:', d))
.catch(e => console.error('❌ Erro:', e));
```

**Se funcionar:** ✅ CORS configurado corretamente
**Se der erro:** ❌ CORS ainda bloqueado

---

### **2. Teste com cURL (Bypassa CORS):**

```bash
curl -X POST https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0 \
  -H "Content-Type: application/json" \
  -d '{"lead_id":"test-123"}'
```

**Se funcionar:** ✅ Webhook funcionando (problema é só CORS)
**Se não funcionar:** ❌ Webhook com problema

---

### **3. Teste com Postman/Insomnia:**

- **URL:** `https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "lead_id": "test-123"
  }
  ```

---

## 📋 Checklist de Configuração N8N:

- [ ] Workflow do webhook está **ativo**
- [ ] Webhook está **configurado corretamente**
- [ ] Headers CORS adicionados no **Response**
- [ ] Webhook responde com **JSON válido**
- [ ] Campos obrigatórios presentes: `payment_url`, `payment_id`
- [ ] Teste com cURL funciona
- [ ] Teste no navegador funciona

---

## 🎯 Exemplo de Workflow N8N Completo:

```
1. [Webhook] Receber lead_id
   ↓
2. [Supabase] Buscar dados do lead
   ↓
3. [ASAAS] Criar pagamento
   ↓
4. [Respond to Webhook] Retornar payment_url
   - Headers CORS configurados
   - Body: { payment_id, payment_url, due_date, status }
```

---

## 🔧 Exemplo de Resposta do Webhook:

```json
{
  "payment_id": "pay_abc123",
  "payment_url": "https://www.asaas.com/b/abc123",
  "due_date": "2025-10-20",
  "status": "pending"
}
```

**Headers da resposta:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-Requested-With
Content-Type: application/json
```

---

## ⚠️ IMPORTANTE:

### **Por que o erro só acontece no navegador?**

- **No navegador:** CORS é verificado (segurança)
- **No cURL/Postman:** CORS não é verificado (ferramentas de desenvolvimento)
- **No test-webhook.html:** CORS é verificado (roda no navegador)

### **Por que funcionou em outros lugares?**

Se o webhook funciona em outras ferramentas, o problema é **exclusivamente CORS**.

---

## 📞 Próximos Passos:

1. **Configurar CORS no N8N** (Solução 1 ou 2)
2. **Testar no navegador** (Console ou test-webhook.html)
3. **Testar na landing page** (Avançar para Pagamento)
4. **Confirmar funcionamento** (Deve redirecionar para ASAAS)

---

**Após configurar o CORS no N8N, a landing page funcionará perfeitamente!** ✅

**Data:** 11/10/2025

