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

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    deleteCampaign
  }
}

