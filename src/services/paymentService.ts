// src/services/paymentService.ts
import { PaymentData } from '../hooks/useLandingPage';

// Configurações do ASAAS
const ASAAS_CONFIG = {
  apiKey: process.env.REACT_APP_ASAAS_API_KEY || '',
  baseUrl: 'https://www.asaas.com/api/v3',
  webhookToken: process.env.REACT_APP_ASAAS_WEBHOOK_TOKEN || ''
};

export interface PaymentRequest {
  leadId: string;
  amount: number;
  description: string;
  payerEmail: string;
  payerName: string;
  payerPhone: string;
  payerDocument: string;
  planName: string;
  paymentMethod: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  barcode?: string;
  error?: string;
}

export class PaymentService {
  // Criar cobrança no ASAAS
  static async createPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const customerData = {
        name: paymentRequest.payerName,
        email: paymentRequest.payerEmail,
        phone: paymentRequest.payerPhone.replace(/\D/g, ''),
        cpfCnpj: paymentRequest.payerDocument.replace(/\D/g, ''),
        externalReference: paymentRequest.leadId
      };

      // Primeiro, criar ou buscar cliente
      const customer = await this.createOrGetCustomer(customerData);

      // Criar cobrança
      const paymentData = {
        customer: customer.id,
        billingType: paymentRequest.paymentMethod,
        value: paymentRequest.amount,
        dueDate: this.getDueDate(paymentRequest.paymentMethod),
        description: paymentRequest.description,
        externalReference: paymentRequest.leadId,
        callback: {
          successUrl: `${window.location.origin}/payment/success`,
          autoRedirect: true
        },
        webhook: `${process.env.REACT_APP_API_URL}/api/payment/webhook`,
        metadata: {
          lead_id: paymentRequest.leadId,
          plan_name: paymentRequest.planName
        }
      };

      const response = await fetch(`${ASAAS_CONFIG.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API do ASAAS: ${errorData.errors?.[0]?.description || response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        paymentId: data.id,
        checkoutUrl: data.invoiceUrl,
        qrCode: data.pixTransaction?.qrCode,
        barcode: data.bankSlipUrl
      };
    } catch (error: any) {
      console.error('Erro ao criar cobrança ASAAS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criar ou buscar cliente no ASAAS
  private static async createOrGetCustomer(customerData: any): Promise<any> {
    try {
      // Primeiro, tentar buscar cliente existente
      const searchResponse = await fetch(`${ASAAS_CONFIG.baseUrl}/customers?cpfCnpj=${customerData.cpfCnpj}`, {
        method: 'GET',
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && searchData.data.length > 0) {
          return searchData.data[0];
        }
      }

      // Se não encontrou, criar novo cliente
      const createResponse = await fetch(`${ASAAS_CONFIG.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(`Erro ao criar cliente: ${errorData.errors?.[0]?.description}`);
      }

      return await createResponse.json();
    } catch (error: any) {
      console.error('Erro ao criar/buscar cliente:', error);
      throw error;
    }
  }

  // Obter data de vencimento baseada no método de pagamento
  private static getDueDate(paymentMethod: string): string {
    const today = new Date();
    
    switch (paymentMethod) {
      case 'PIX':
        return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 dia
      case 'BOLETO':
        return new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 dias
      case 'CREDIT_CARD':
        return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 1 dia
      default:
        return new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  }

  // Verificar status do pagamento
  static async checkPaymentStatus(paymentId: string): Promise<{ status: string; data?: any }> {
    try {
      const response = await fetch(`${ASAAS_CONFIG.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'access_token': ASAAS_CONFIG.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar pagamento: ${response.status}`);
      }

      const data = await response.json();

      return {
        status: data.status,
        data: data
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error);
      return {
        status: 'error'
      };
    }
  }

  // Processar webhook do ASAAS
  static async processWebhook(webhookData: any): Promise<boolean> {
    try {
      const { event, payment } = webhookData;

      // Verificar token do webhook
      if (webhookData.token !== ASAAS_CONFIG.webhookToken) {
        console.error('Token do webhook inválido');
        return false;
      }

      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        // Pagamento confirmado - atualizar status no banco
        // A função create_admin_after_payment() será executada automaticamente
        return true;
      }

      if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
        // Pagamento vencido ou cancelado
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Erro ao processar webhook:', error);
      return false;
    }
  }

  // Gerar cobrança PIX
  static async generatePixPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return await this.createPayment({
      ...paymentRequest,
      paymentMethod: 'PIX'
    });
  }

  // Gerar boleto
  static async generateBoletoPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return await this.createPayment({
      ...paymentRequest,
      paymentMethod: 'BOLETO'
    });
  }

  // Gerar cobrança para cartão de crédito
  static async generateCreditCardPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    return await this.createPayment({
      ...paymentRequest,
      paymentMethod: 'CREDIT_CARD'
    });
  }

  // Obter métodos de pagamento disponíveis
  static getAvailablePaymentMethods(): Array<{id: string, name: string, icon: string}> {
    return [
      { id: 'PIX', name: 'PIX', icon: '💳' },
      { id: 'BOLETO', name: 'Boleto Bancário', icon: '📄' },
      { id: 'CREDIT_CARD', name: 'Cartão de Crédito', icon: '💳' }
    ];
  }
}

// Função auxiliar para formatar valores monetários
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função auxiliar para validar CPF/CNPJ
export const validateDocument = (document: string): boolean => {
  const cleanDoc = document.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    // Validação CPF
    return validateCPF(cleanDoc);
  } else if (cleanDoc.length === 14) {
    // Validação CNPJ
    return validateCNPJ(cleanDoc);
  }
  
  return false;
};

const validateCPF = (cpf: string): boolean => {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (parseInt(cpf[9]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  
  return parseInt(cpf[10]) === digit;
};

const validateCNPJ = (cnpj: string): boolean => {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj[12]) !== digit) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return parseInt(cnpj[13]) === digit;
};
