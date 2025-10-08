// hooks/useCampaigns.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Campaign {
  id: string
  name: string
  code: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  description: string | null
  is_active: boolean
  admin_user_id: string | null
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

      const { data, error: fetchError } = await supabase
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
      const { error: deleteError } = await supabase
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

      // PASSO 1: Atualizar status da campanha
      const { error: campaignError } = await supabase
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
        
        // Reativar auth_users
        await supabase
          .from('auth_users')
          .update({ 
            deleted_at: null,
            is_active: true,
            updated_at: now
          })
          .eq('campaign', campaignCode)
          .not('deleted_at', 'is', null);

        // Reativar user_links
        await supabase
          .from('user_links')
          .update({ 
            deleted_at: null,
            is_active: true,
            updated_at: now
          })
          .eq('campaign', campaignCode)
          .not('deleted_at', 'is', null);
      } else {
        // DESATIVAR: soft delete em auth_users e user_links
        
        // Soft delete em auth_users
        await supabase
          .from('auth_users')
          .update({ 
            deleted_at: now,
            is_active: false,
            updated_at: now
          })
          .eq('campaign', campaignCode)
          .is('deleted_at', null);

        // Soft delete em user_links
        await supabase
          .from('user_links')
          .update({ 
            deleted_at: now,
            is_active: false,
            updated_at: now
          })
          .eq('campaign', campaignCode)
          .is('deleted_at', null);
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

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    deleteCampaign,
    toggleCampaignStatus
  }
}

