// hooks/useCampaigns.ts
import { useState, useEffect, useCallback } from 'react'
import { supabaseServerless } from '@/lib/supabase'

export interface Campaign {
  id: string
  name: string
  code: string
  primary_color: string      // Cor primária (fundo)
  secondary_color: string    // Cor secundária (botões)
  description?: string | null
  is_active: boolean
  admin_user_id?: string | null
  plano_id?: string | null // ID do plano
  nome_plano?: string // Nome do plano (vem direto da tabela campaigns)
  created_at: string
  updated_at: string
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabaseServerless
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setCampaigns(data || [])
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error: deleteError } = await supabaseServerless
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (deleteError) throw deleteError

      await fetchCampaigns()
      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar campanha:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar campanha' 
      }
    }
  }

  const toggleCampaignStatus = async (campaignCode: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const now = new Date().toISOString();

      // PASSO 1: Buscar a campanha para obter o ID
      const { data: campaignData, error: fetchCampaignError } = await supabaseServerless
        .from('campaigns')
        .select('id')
        .eq('code', campaignCode)
        .single();

      if (fetchCampaignError) {
        throw fetchCampaignError;
      }

      // PASSO 2: Atualizar status da campanha
      const { error: campaignError } = await supabaseServerless
        .from('campaigns')
        .update({ 
          is_active: newStatus,
          updated_at: now
        })
        .eq('code', campaignCode);

      if (campaignError) {
        throw campaignError;
      }

      if (newStatus) {
        // REATIVAR: remover deleted_at de auth_users e user_links
        // Reativar todos os usuários da campanha por campaign_code
        await supabaseServerless
          .from('auth_users')
          .update({ 
            deleted_at: null,
            is_active: true,
            updated_at: now
          })
          .eq('campaign', campaignCode);
        
        // Reativar usuários vinculados por campaign_id
        await supabaseServerless
          .from('auth_users')
          .update({ 
            deleted_at: null,
            is_active: true,
            updated_at: now
          })
          .eq('campaign_id', campaignData.id);

        await supabaseServerless
          .from('user_links')
          .update({ 
            deleted_at: null,
            is_active: true,
            updated_at: now
          })
          .eq('campaign', campaignCode);
      } else {
        // DESATIVAR: soft delete em auth_users e user_links
        // Desativar todos os usuários da campanha por campaign_code
        await supabaseServerless
          .from('auth_users')
          .update({ 
            deleted_at: now,
            is_active: false,
            updated_at: now
          })
          .eq('campaign', campaignCode);
        
        // Desativar usuários vinculados por campaign_id
        await supabaseServerless
          .from('auth_users')
          .update({ 
            deleted_at: now,
            is_active: false,
            updated_at: now
          })
          .eq('campaign_id', campaignData.id);

        await supabaseServerless
          .from('user_links')
          .update({ 
            deleted_at: now,
            is_active: false,
            updated_at: now
          })
          .eq('campaign', campaignCode);
      }

      await fetchCampaigns();
      return { success: true, newStatus };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao alternar status' 
      };
    }
  }

  const getCampaignByCode = useCallback((code: string): Campaign | null => {
    return campaigns.find(c => c.code === code) || null
  }, [campaigns])

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    deleteCampaign,
    toggleCampaignStatus,
    getCampaignByCode
  }
}

