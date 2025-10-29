// hooks/useUsers.ts
import { useState, useEffect } from 'react'
import { supabaseServerless, User } from '@/lib/supabase'

export const useUsers = (referrer?: string, campaign?: string, campaignId?: string | null) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Limpar estado anterior antes de buscar novos dados
    setUsers([])
    setError(null)
    setLoading(true)
    
    // Adicionar delay para evitar race conditions
    const timeoutId = setTimeout(() => {
      fetchUsers()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [referrer, campaign, campaignId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Validar referrer antes de fazer a query
      if (referrer && typeof referrer !== 'string') {
        // Referrer inválido
        setUsers([])
        setLoading(false)
        return
      }

      let query = supabaseServerless
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      // Usar campaign_id se disponível (relacional), caso contrário usar campaign (texto) para compatibilidade
      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      } else if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data, error } = await query

      if (error) throw error

      // Validar dados recebidos
      const validUsers = (data || []).filter(user => {
        if (!user.id || !user.name) {
          // Usuário com dados inválidos encontrado
          return false
        }
        return true
      })

      // Usuários válidos carregados
      setUsers(validUsers)
    } catch (err) {
      // Erro ao carregar usuários
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabaseServerless
        .from('users')
        .insert([userData])
        .select()

      if (error) throw error

      if (data && Array.isArray(data) && data.length > 0) {
        setUsers(prev => [data[0], ...prev])
        return { success: true, data: data[0] }
      } else {
        return { 
          success: false, 
          error: 'Dados não retornados pela API' 
        }
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar usuário' 
      }
    }
  }

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const { data, error } = await supabaseServerless
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error

      if (data) {
        setUsers(prev => prev.map(user => 
          user.id === id ? { ...user, ...data[0] } : user
        ))
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Problema ao atualizar usuário' 
      }
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabaseServerless
        .from('users')
        .delete()
        .eq('id', id)

      if (error) throw error

      setUsers(prev => prev.filter(user => user.id !== id))
      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao deletar usuário' 
      }
    }
  }

  const checkUserExists = async (instagram: string, phone: string) => {
    try {
      // Normalizar telefone para comparação (remover formatação)
      const normalizedPhone = phone.replace(/\D/g, '');
      
      // Verificar se já existe usuário com este Instagram ou telefone
      const { data, error } = await supabaseServerless
        .from('users')
        .select('id, name, instagram, phone')

      if (error) throw error

      // Verificar manualmente para comparar telefones normalizados
      const existingUser = data?.find(user => {
        const userInstagramMatch = user.instagram === instagram;
        const userPhoneMatch = user.phone?.replace(/\D/g, '') === normalizedPhone;
        return userInstagramMatch || userPhoneMatch;
      });

      if (existingUser) {
        const conflictType = existingUser.instagram === instagram ? 'Instagram' : 'telefone'
        const conflictValue = existingUser.instagram === instagram ? instagram : phone
        
        return {
          exists: true,
          user: existingUser,
          conflictType,
          conflictValue,
          message: `Usuário já cadastrado com este ${conflictType}: ${conflictValue}`
        }
      }

      return { exists: false }
    } catch (err) {
      return { 
        exists: false,
        error: err instanceof Error ? err.message : 'Erro ao verificar usuário existente' 
      }
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    checkUserExists
  }
}
