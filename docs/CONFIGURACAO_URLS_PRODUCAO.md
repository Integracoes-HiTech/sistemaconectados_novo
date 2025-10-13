# Configuração de URLs de Produção

## URLs Corretas (sem .html)

### Landing Page
- **URL Correta**: `https://conectadosdigital.com.br/comece-agora`
- **URL Incorreta**: `https://conectadosdigital.com.br/comece-agora.html`

### Página de Sucesso
- **URL Correta**: `https://conectadosdigital.com.br/success`
- **URL Incorreta**: `https://conectadosdigital.com.br/success.html`

## Configuração do Vercel

O arquivo `vercel.json` está configurado corretamente com:

### Redirects (301 - Permanente)
```json
{
  "redirects": [
    {
      "source": "/comece-agora.html",
      "destination": "/comece-agora",
      "permanent": true
    },
    {
      "source": "/success.html", 
      "destination": "/success",
      "permanent": true
    },
    {
      "source": "/landing.html",
      "destination": "/comece-agora",
      "permanent": true
    },
    {
      "source": "/sucesso.html",
      "destination": "/success", 
      "permanent": true
    }
  ]
}
```

### Rewrites (Interno)
```json
{
  "rewrites": [
    {
      "source": "/comece-agora",
      "destination": "/comece-agora.html"
    },
    {
      "source": "/success",
      "destination": "/success.html"
    }
  ]
}
```

## Configuração do N8N/ASAAS

### URLs de Retorno Configuradas
- **Sucesso**: `https://conectadosdigital.com.br/success`
- **Cancelamento**: `https://conectadosdigital.com.br/comece-agora`

### Verificação Necessária
1. Acessar o painel do N8N: `https://n8n.admin.hitechdesenvolvimento.com.br/`
2. Verificar o workflow do webhook: `554ce0ca-4b36-4d56-a2ce-79d874533ca0`
3. Confirmar se as URLs de retorno estão configuradas corretamente no ASAAS
4. Verificar se não há URLs hardcoded com `.html` no workflow

## Teste Local vs Produção

### Local
- `http://localhost:8080/comece-agora` → Funciona via rewrite
- `http://localhost:8080/success` → Funciona via rewrite

### Produção
- `https://conectadosdigital.com.br/comece-agora` → Deve funcionar
- `https://conectadosdigital.com.br/success` → Deve funcionar

## Solução de Problemas

Se ainda aparecer `.html` na produção:

1. **Limpar cache do navegador**
2. **Verificar configuração do N8N/ASAAS**
3. **Confirmar deploy do Vercel**
4. **Testar URLs diretamente**

## Comandos de Teste

```bash
# Testar redirect
curl -I https://conectadosdigital.com.br/comece-agora.html
# Deve retornar 301 para /comece-agora

# Testar rewrite
curl -I https://conectadosdigital.com.br/comece-agora
# Deve retornar 200 com conteúdo HTML
```
