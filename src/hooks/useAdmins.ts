// hooks/useAdmins.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

      // Buscar todos os usuários com roles administrativos:
      // Admin, Administrador, admin3, AdminHitech, Felipe Admin, etc.
      const { data, error: fetchError } = await supabase
        .from('auth_users')
        .select('*')
        .or('role.eq.Admin,role.eq.Administrador,role.eq.admin3,role.eq.AdminHitech,role.ilike.%admin%,role.ilike.%felipe%')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setAdmins(data || [])
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
      const { error: deleteError } = await supabase
        .from('auth_users')
        .delete()
        .eq('id', adminId)

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
      const { error: updateError } = await supabase
        .from('auth_users')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

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

