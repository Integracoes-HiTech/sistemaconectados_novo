# Como Configurar CORS no n8n

## Problema
O n8n está bloqueando requisições do navegador devido à política CORS.

## Soluções

### 1. Configurar CORS no Webhook do n8n (Recomendado)

1. Acesse o n8n: https://n8n.admin.hitechdesenvolvimento.com.br/
2. Abra o workflow que contém o webhook
3. Clique no nó do webhook
4. Nas configurações, adicione os headers CORS:

```json
{
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
}
```

### 2. Usar Proxy no Backend (Alternativa)

Criar um endpoint no backend que faça a chamada para o n8n:

```javascript
// Exemplo de proxy
app.post('/api/n8n-proxy', async (req, res) => {
  try {
    const response = await fetch('https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Desabilitar CORS Temporariamente (Desenvolvimento)

Para testar localmente, execute o Chrome com CORS desabilitado:

```bash
# Windows
chrome.exe --user-data-dir=/tmp/chrome_dev_test --disable-web-security --disable-features=VizDisplayCompositor

# Mac
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security --disable-features=VizDisplayCompositor
```

## Recomendação
Use a **Solução 1** (configurar CORS no n8n) para produção.
