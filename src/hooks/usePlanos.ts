// hooks/usePlanos.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Plano {
  id: string
  nome_plano: string
  descricao: string | null
  amount: number
  recorrencia: string
  features: string[]
  is_active: boolean
  max_users: number | null
  order_display: number | null
  created_at: string
  updated_at: string
}

export const usePlanos = () => {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlanos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('planos_precos')
        .select('*')
        .order('order_display', { ascending: true })

      if (fetchError) throw fetchError

      setPlanos(data || [])
    } catch (err) {
      console.error('Erro ao buscar planos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlanos()
  }, [fetchPlanos])

  const togglePlanoStatus = async (planoId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('planos_precos')
        .update({ 
          is_active: newStatus,
          updated_at: now
        })
        .eq('id', planoId);

      if (updateError) {
        throw updateError;
      }

      await fetchPlanos();
      return { success: true, newStatus };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao alternar status' 
      };
    }
  }

  return {
    planos,
    loading,
    error,
    fetchPlanos,
    togglePlanoStatus
  }
}

