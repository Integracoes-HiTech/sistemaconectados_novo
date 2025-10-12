# Variáveis de Ambiente para Integração N8N

## Configuração no Frontend (React)

Adicione estas variáveis no seu arquivo `.env` ou `.env.local`:

```env
# N8N Configuration
REACT_APP_N8N_WEBHOOK_URL=https://n8n.admin.hitechdesenvolvimento.com.br/webhook/554ce0ca-4b36-4d56-a2ce-79d874533ca0
REACT_APP_N8N_API_KEY=your-n8n-api-key-here

# ASAAS Configuration (via N8N)
REACT_APP_ASAAS_API_KEY=your-asaas-api-key
REACT_APP_ASAAS_ENVIRONMENT=sandbox

# Sistema
REACT_APP_API_URL=https://your-domain.com/api
```

## Configuração no N8N

### Variáveis de Ambiente N8N
```env
# ASAAS
ASAAS_API_KEY=your-asaas-api-key
ASAAS_ENVIRONMENT=sandbox
ASAAS_WEBHOOK_TOKEN=your-webhook-token

# Sistema CONECTADOS
SYSTEM_WEBHOOK_URL=https://your-domain.com/api/payment/webhook
SYSTEM_API_KEY=your-system-api-key

# Banco de Dados
SUPABASE_URL=https://zveysullpsdopcwsncai.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Workflow N8N

### 1. Webhook de Entrada
- **URL**: `/webhook/payment-generate`
- **Método**: POST
- **Autenticação**: Bearer Token

### 2. Processamento
1. **Validar dados** recebidos
2. **Criar cobrança** no ASAAS
3. **Retornar link** de pagamento
4. **Salvar dados** no banco (opcional)

### 3. Webhook ASAAS
- **URL**: Configurar no ASAAS
- **Eventos**: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, `PAYMENT_OVERDUE`

### 4. Webhook de Saída
- **URL**: `SYSTEM_WEBHOOK_URL`
- **Método**: POST
- **Payload**: Status atualizado do pagamento

## Exemplo de Payload

### Entrada (Sistema → N8N)
```json
{
  "lead_id": "uuid-do-lead",
  "amount": 1250.00,
  "payer_name": "João Silva",
  "payer_email": "joao@email.com",
  "payer_phone": "5562999999999",
  "payer_document": "12345678901",
  "description": "Plano Profissional - CONECTADOS",
  "plan_name": "profissional"
}
```

### Saída (N8N → Sistema)
```json
{
  "success": true,
  "payment_id": "pay_asaas_123456",
  "payment_url": "https://www.asaas.com/c/abc123def456",
  "due_date": "2024-01-15",
  "status": "pending"
}
```

### Webhook (ASAAS → N8N → Sistema)
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_asaas_123456",
    "status": "RECEIVED",
    "value": 1250.00,
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    }
  },
  "lead_id": "uuid-do-lead"
}
```

## Segurança

### Autenticação
- Use **Bearer Tokens** para autenticação
- Configure **CORS** adequadamente
- Valide **origem** das requisições

### Validação
- Verificar **assinatura** dos webhooks
- Validar **dados** de entrada
- Confirmar **status** dos pagamentos

### Monitoramento
- Log de **todas** as requisições
- Alertas para **falhas** de integração
- Monitoramento de **timeout**

## Testes

### Ambiente de Desenvolvimento
```env
REACT_APP_N8N_WEBHOOK_URL=https://dev-n8n.your-domain.com/webhook/payment-generate
REACT_APP_ASAAS_ENVIRONMENT=sandbox
```

### Ambiente de Produção
```env
REACT_APP_N8N_WEBHOOK_URL=https://n8n.your-domain.com/webhook/payment-generate
REACT_APP_ASAAS_ENVIRONMENT=production
```

## Troubleshooting

### Erros Comuns
1. **CORS Error**: Configurar CORS no N8N
2. **Timeout**: Aumentar timeout nas requisições
3. **Auth Error**: Verificar tokens de autenticação
4. **Webhook Error**: Verificar URL e payload

### Logs
- Verificar logs do N8N
- Monitorar console do navegador
- Verificar logs do ASAAS
