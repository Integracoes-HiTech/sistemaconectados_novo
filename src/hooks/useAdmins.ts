// hooks/useAdmins.ts
import { useState, useEffect, useCallback } from 'react'
import { supabaseServerless } from '@/lib/supabase'

export interface AdminUser {
  id: string
  username: string
  name: string
  role: string
  campaign: string
  full_name: string
  display_name: string
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useAdmins = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar apenas usuários com role "Administrador" exatamente
      const { data, error: fetchError } = await supabaseServerless
        .from('auth_users')
        .select('*')
        .eq('role', 'Administrador')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      // Garantir que data é um array
      const adminsArray = Array.isArray(data) ? data : (data ? [data] : [])
      
      // Para AdminHitech, mostrar TODOS os admins (ativos, inativos e também com deleted_at)
      // A visualização na tabela já mostra com risco quando deleted_at existe
      setAdmins(adminsArray)
    } catch (err) {
      console.error('Erro ao buscar admins:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const deleteAdmin = async (adminId: string) => {
    try {
      // Soft delete - preencher deleted_at
      const deletedAt = new Date().toISOString()
      const { error: deleteError } = await supabaseServerless
        .from('auth_users')
        .update({ deleted_at: deletedAt })
        .eq('id', adminId)
        .select()

      if (deleteError) throw deleteError

      await fetchAdmins()
      return { success: true }
    } catch (err) {
      console.error('Erro ao deletar admin:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar admin' 
      }
    }
  }

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabaseServerless
        .from('auth_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)
        .select()

      if (updateError) throw updateError

      await fetchAdmins()
      return { success: true }
    } catch (err) {
      console.error('Erro ao atualizar status do admin:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao atualizar status' 
      }
    }
  }

  return {
    admins,
    loading,
    error,
    fetchAdmins,
    deleteAdmin,
    toggleAdminStatus
  }
}

