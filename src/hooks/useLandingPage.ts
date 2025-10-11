// src/hooks/useLandingPage.ts
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export interface LandingLead {
  id?: string;
  nome_completo: string;
  cpf_cnpj: string;
  whatsapp: string;
  cep?: string;
  cidade?: string;
  bairro?: string;
  email: string;
  cor_principal?: string;
  cor_secundaria?: string;
  plano_escolhido: 'gratuito' | 'essencial' | 'profissional' | 'avancado';
  status?: 'pendente' | 'pago' | 'cancelado' | 'expirado';
  payment_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentData {
  id?: string;
  lead_id: string;
  payment_gateway: 'asaas' | 'pagseguro' | 'stripe';
  payment_id: string;
  transaction_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'received' | 'confirmed' | 'overdue' | 'cancelled';
  payment_method?: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  installments?: number;
  due_date?: string;
  gateway_response?: any;
  created_at?: string;
  updated_at?: string;
}

export interface PlanDetails {
  price: number;
  max_users: number;
  features: {
    cadastros: number;
    painel_completo: boolean;
    mapa_interativo: boolean;
    relatorios: boolean;
    backup: boolean;
    suporte: boolean;
    personalizacao: boolean;
    exportacao: boolean;
    suporte_prioritario?: boolean;
    suporte_24h?: boolean;
  };
}

export const useLandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Salvar lead na landing page
  const saveLead = async (leadData: LandingLead): Promise<{ success: boolean; leadId?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('landing_leads')
        .insert([{
          nome_completo: leadData.nome_completo,
          cpf_cnpj: leadData.cpf_cnpj,
          whatsapp: leadData.whatsapp,
          cep: leadData.cep,
          cidade: leadData.cidade,
          bairro: leadData.bairro,
          email: leadData.email,
          cor_principal: leadData.cor_principal || '#14446C',
          cor_secundaria: leadData.cor_secundaria || '#CFBA7F',
          plano_escolhido: leadData.plano_escolhido,
          status: 'pendente'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, leadId: data.id };
    } catch (err: any) {
      console.error('Erro ao salvar lead:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Obter detalhes do plano
  const getPlanDetails = async (planName: string): Promise<PlanDetails | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_plan_details', { plan_name: planName });

      if (error) {
        throw error;
      }

      return data[0] || null;
    } catch (err: any) {
      console.error('Erro ao obter detalhes do plano:', err);
      setError(err.message);
      return null;
    }
  };

  // Salvar dados de pagamento
  const savePayment = async (paymentData: PaymentData): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('landing_payments')
        .insert([{
          lead_id: paymentData.lead_id,
          payment_gateway: paymentData.payment_gateway,
          payment_id: paymentData.payment_id,
          transaction_id: paymentData.transaction_id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: paymentData.status,
          payment_method: paymentData.payment_method,
          installments: paymentData.installments,
          due_date: paymentData.due_date,
          gateway_response: paymentData.gateway_response
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, paymentId: data.id };
    } catch (err: any) {
      console.error('Erro ao salvar pagamento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status do pagamento
  const updatePaymentStatus = async (paymentId: string, status: string, gatewayResponse?: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('landing_payments')
        .update({
          status,
          gateway_response: gatewayResponse,
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', paymentId);

      if (error) {
        throw error;
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar status do pagamento:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verificar status do lead
  const checkLeadStatus = async (leadId: string): Promise<LandingLead | null> => {
    try {
      const { data, error } = await supabase
        .from('landing_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Erro ao verificar status do lead:', err);
      setError(err.message);
      return null;
    }
  };

  // Obter campanha criada
  const getCreatedCampaign = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('landing_campaigns')
        .select(`
          *,
          auth_users!landing_campaigns_admin_user_id_fkey (
            username,
            password,
            name,
            instagram,
            phone
          )
        `)
        .eq('lead_id', leadId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Erro ao obter campanha criada:', err);
      setError(err.message);
      return null;
    }
  };

  return {
    loading,
    error,
    saveLead,
    getPlanDetails,
    savePayment,
    updatePaymentStatus,
    checkLeadStatus,
    getCreatedCampaign
  };
};
