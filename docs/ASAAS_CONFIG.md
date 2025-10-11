# Configuração ASAAS - Landing Page
# Adicione estas variáveis ao seu arquivo .env

# ASAAS API Configuration
REACT_APP_ASAAS_API_KEY=your_asaas_api_key_here
REACT_APP_ASAAS_WEBHOOK_TOKEN=your_webhook_token_here

# API URL para webhooks
REACT_APP_API_URL=https://your-domain.com

# Exemplo de configuração:
# REACT_APP_ASAAS_API_KEY=$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2UwMzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwNzI2NDM6OiRhYWNoXzE4YjE3NDRlLWE4MzEtNDY1YS04YjQ0LWM5ZGY5ZGY5ZGY5ZGY=
# REACT_APP_ASAAS_WEBHOOK_TOKEN=your_secure_webhook_token_123456
# REACT_APP_API_URL=https://conectadosdigital.com.br

# Como obter as chaves do ASAAS:
# 1. Acesse https://www.asaas.com/
# 2. Faça login na sua conta
# 3. Vá em "Integrações" > "API"
# 4. Copie sua chave de API
# 5. Configure o webhook token para segurança

# Status de pagamento do ASAAS:
# - pending: Aguardando pagamento
# - received: Pagamento recebido (PIX/Boleto)
# - confirmed: Pagamento confirmado
# - overdue: Pagamento vencido
# - cancelled: Pagamento cancelado

# Métodos de pagamento suportados:
# - PIX: Pagamento instantâneo
# - BOLETO: Boleto bancário
# - CREDIT_CARD: Cartão de crédito
