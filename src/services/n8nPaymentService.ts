// src/services/n8nPaymentService.ts

export interface N8nPaymentRequest {
  lead_id: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_phone: string;
  payer_document: string;
  description: string;
  plan_name: string;
}

export interface N8nPaymentResponse {
  success: boolean;
  payment_id?: string;
  payment_url?: string;
  due_date?: string;
  status?: string;
  error?: string;
}

export interface N8nWebhookPayload {
  event: string;
  payment: {
    id: string;
    status: string;
    value: number;
    customer: {
      name: string;
      email: string;
    };
  };
  lead_id: string;
}

// Configurações do N8N
const N8N_CONFIG = {
  webhookUrl: process.env.REACT_APP_N8N_WEBHOOK_URL || '',
  apiKey: process.env.REACT_APP_N8N_API_KEY || '',
  timeout: 30000, // 30 segundos
};

export class N8nPaymentService {
  /**
   * Gera link de pagamento via N8N
   */
  static async generatePaymentLink(paymentRequest: N8nPaymentRequest): Promise<N8nPaymentResponse> {
    try {
      const response = await fetch(N8N_CONFIG.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${N8N_CONFIG.apiKey}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(paymentRequest),
        signal: AbortSignal.timeout(N8N_CONFIG.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro na API do N8N: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        payment_id: data.payment_id,
        payment_url: data.payment_url,
        due_date: data.due_date,
        status: data.status || 'pending',
      };
    } catch (error: any) {
      console.error('Erro ao gerar link de pagamento via N8N:', error);
      
      return {
        success: false,
        error: error.message || 'Erro interno do servidor',
      };
    }
  }

  /**
   * Verifica status de pagamento via N8N
   */
  static async checkPaymentStatus(paymentId: string): Promise<N8nPaymentResponse> {
    try {
      const response = await fetch(`${N8N_CONFIG.webhookUrl}/status/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${N8N_CONFIG.apiKey}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(N8N_CONFIG.timeout),
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        payment_id: data.payment_id,
        status: data.status,
        payment_url: data.payment_url,
      };
    } catch (error: any) {
      console.error('Erro ao verificar status do pagamento:', error);
      
      return {
        success: false,
        error: error.message || 'Erro ao verificar status',
      };
    }
  }

  /**
   * Processa webhook do N8N (chamado pelo backend)
   */
  static async processWebhook(webhookPayload: N8nWebhookPayload): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar payload
      if (!webhookPayload.event || !webhookPayload.payment || !webhookPayload.lead_id) {
        throw new Error('Payload do webhook inválido');
      }

      // Mapear status do ASAAS para status interno
      const statusMap: { [key: string]: string } = {
        'PENDING': 'pending',
        'RECEIVED': 'paid',
        'CONFIRMED': 'paid',
        'OVERDUE': 'expired',
        'CANCELLED': 'cancelled',
      };

      const internalStatus = statusMap[webhookPayload.payment.status] || 'pending';

      // Aqui você integraria com seu backend para atualizar o banco
      // Por enquanto, retornamos sucesso
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('Erro ao processar webhook do N8N:', error);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Valida dados de pagamento antes de enviar para N8N
   */
  static validatePaymentData(paymentRequest: N8nPaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentRequest.lead_id) {
      errors.push('ID do lead é obrigatório');
    }

    if (!paymentRequest.amount || paymentRequest.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!paymentRequest.payer_name || paymentRequest.payer_name.trim().length < 2) {
      errors.push('Nome do pagador é obrigatório');
    }

    if (!paymentRequest.payer_email || !this.isValidEmail(paymentRequest.payer_email)) {
      errors.push('Email válido é obrigatório');
    }

    if (!paymentRequest.payer_phone || paymentRequest.payer_phone.replace(/\D/g, '').length < 10) {
      errors.push('Telefone válido é obrigatório');
    }

    if (!paymentRequest.payer_document || paymentRequest.payer_document.replace(/\D/g, '').length < 11) {
      errors.push('CPF/CNPJ válido é obrigatório');
    }

    if (!paymentRequest.plan_name) {
      errors.push('Nome do plano é obrigatório');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida formato de email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Formata dados para envio ao N8N
   */
  static formatPaymentData(leadData: any, planDetails: any): N8nPaymentRequest {
    return {
      lead_id: leadData.id,
      amount: planDetails.price,
      payer_name: leadData.nome_completo,
      payer_email: leadData.email,
      payer_phone: leadData.whatsapp.replace(/\D/g, ''),
      payer_document: leadData.cpf_cnpj.replace(/\D/g, ''),
      description: `${planDetails.name} - CONECTADOS`,
      plan_name: planDetails.name.toLowerCase(),
    };
  }
}

export default N8nPaymentService;
