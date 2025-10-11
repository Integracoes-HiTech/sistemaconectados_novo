# Integração N8N + ASAAS para Sistema de Pagamentos

## Visão Geral
Este documento descreve como o sistema CONECTADOS se integra com o n8n para processar pagamentos via ASAAS.

## Fluxo de Pagamento

### 1. Usuário preenche formulário na Landing Page
- Dados são salvos na tabela `landing_leads`
- Registro de pagamento é criado na tabela `landing_payments` com status `pending`

### 2. Sistema envia dados para N8N
- POST para endpoint do n8n com dados do lead
- N8N processa e envia para ASAAS
- ASAAS retorna link de pagamento

### 3. N8N retorna link de pagamento
- Sistema recebe link do ASAAS
- Atualiza `landing_payments` com `payment_url`
- Exibe modal com link para o usuário

### 4. Webhook do ASAAS (via N8N)
- N8N recebe notificações do ASAAS
- N8N envia webhook para o sistema
- Sistema atualiza status do pagamento
- Cria admin automaticamente se confirmado

## Estrutura de Dados

### Tabela `landing_payments`
```sql
CREATE TABLE landing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES landing_leads(id) ON DELETE CASCADE,
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'asaas',
    payment_id VARCHAR(255), -- ID do pagamento no ASAAS
    payment_url TEXT, -- Link de pagamento retornado pelo ASAAS
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, expired
    payment_method VARCHAR(50),
    installments INTEGER DEFAULT 1,
    due_date DATE,
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Endpoints Necessários

### 1. Endpoint para receber dados do N8N
```
POST /api/payment/generate
```

**Request Body:**
```json
{
  "lead_id": "uuid",
  "amount": 1250.00,
  "payer_name": "João Silva",
  "payer_email": "joao@email.com",
  "payer_phone": "5562999999999",
  "payer_document": "12345678901",
  "description": "Plano Profissional - CONECTADOS",
  "plan_name": "profissional"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": "pay_asaas_123",
  "payment_url": "https://www.asaas.com/c/abc123",
  "due_date": "2024-01-15",
  "status": "pending"
}
```

### 2. Webhook para receber status do N8N
```
POST /api/payment/webhook
```

**Request Body:**
```json
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_asaas_123",
    "status": "RECEIVED",
    "value": 1250.00,
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    }
  },
  "lead_id": "uuid"
}
```

## Configuração N8N

### Workflow N8N
1. **Webhook Trigger** - Recebe dados do sistema
2. **ASAAS Node** - Cria cobrança no ASAAS
3. **HTTP Request** - Retorna link para o sistema
4. **Webhook ASAAS** - Recebe notificações
5. **HTTP Request** - Envia status para o sistema

### Variáveis de Ambiente N8N
```
ASAAS_API_KEY=your_asaas_api_key
ASAAS_ENVIRONMENT=sandbox|production
SYSTEM_WEBHOOK_URL=https://your-domain.com/api/payment/webhook
```

## Status de Pagamento

### Status no Sistema
- `pending` - Aguardando pagamento
- `paid` - Pago e confirmado
- `cancelled` - Cancelado
- `expired` - Expirado

### Status ASAAS
- `PENDING` - Aguardando pagamento
- `RECEIVED` - Recebido
- `CONFIRMED` - Confirmado
- `OVERDUE` - Vencido
- `CANCELLED` - Cancelado

## Segurança

### Autenticação
- Token JWT para comunicação com N8N
- Verificação de assinatura no webhook
- Validação de origem das requisições

### Validações
- Verificar se lead existe
- Validar dados do pagamento
- Confirmar valores e moeda
- Verificar status do pagamento

## Monitoramento

### Logs
- Registrar todas as requisições
- Log de erros de integração
- Monitoramento de status

### Alertas
- Pagamentos não processados
- Falhas de webhook
- Timeouts de comunicação

## Testes

### Ambiente de Desenvolvimento
- Usar ASAAS Sandbox
- N8N em modo desenvolvimento
- Dados de teste

### Ambiente de Produção
- ASAAS Production
- N8N em produção
- Monitoramento ativo
