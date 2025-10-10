// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se há usuário logado no localStorage com validação
    const loggedUser = localStorage.getItem('loggedUser')
    if (loggedUser) {
      try {
        const userData = JSON.parse(loggedUser)
        
        // Validar estrutura dos dados
        if (!userData.id || !userData.username || !userData.role) {
          console.warn('🚨 Dados de usuário inválidos no localStorage, removendo...')
          localStorage.removeItem('loggedUser')
          setUser(null)
        } else {
          // Validar se o usuário ainda existe no banco (apenas se não acabou de fazer login)
          if (!justLoggedIn) {
            validateUserSession(userData)
          } else {
            setJustLoggedIn(false)
          }
        }
      } catch (error) {
        console.warn('🚨 Erro ao parsear dados do localStorage, removendo...', error)
        localStorage.removeItem('loggedUser')
        setUser(null)
      }
    }
    setLoading(false)
  }, [justLoggedIn])

  // Função para validar se a sessão ainda é válida
  const validateUserSession = async (userData: AuthUser) => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, username, role, is_active, display_name, campaign, deleted_at')
        .eq('id', userData.id)
        .eq('username', userData.username)
        .single()

      if (error || !data || !data.is_active || data.deleted_at) {
        console.warn('🚨 Sessão inválida ou usuário desativado, fazendo logout...')
        if (data?.deleted_at) {
          console.warn('❌ Usuário com soft delete (deleted_at preenchido)')
        }
        localStorage.removeItem('loggedUser')
        setUser(null)
        return
      }

      // Atualizar dados do usuário se necessário
      if (data.role !== userData.role || data.display_name !== userData.display_name) {
        console.log('🔄 Dados atualizados, sincronizando...')
        const updatedUser = { 
          ...userData, 
          role: data.role,
          display_name: data.display_name
        }
        setUser(updatedUser)
        localStorage.setItem('loggedUser', JSON.stringify(updatedUser))
      } else {
        setUser(userData)
      }
    } catch (error) {
      console.warn('🚨 Erro ao validar sessão, fazendo logout...', error)
      localStorage.removeItem('loggedUser')
      setUser(null)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)

      // Normalizar username (remover @ e converter para minúsculo)
      const normalizedUsername = username.replace('@', '').toLowerCase()

      // Buscar usuário na tabela auth_users por username
      const { data, error } = await supabase
        .from('auth_users')
        .select('*')
        .eq('username', normalizedUsername)
        .eq('password', password) // Em produção, usar hash da senha
        .single()

      if (error) throw error

      if (data) {
        // VERIFICAR SE USUÁRIO FOI DESATIVADO (SOFT DELETE)
        if (data.deleted_at) {
          console.warn('❌ Tentativa de login de usuário desativado:', normalizedUsername);
          toast({
            title: "Acesso bloqueado",
            description: "Sua conta foi desativada. Entre em contato com o administrador.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Usuário desativado" };
        }

        // VERIFICAR SE USUÁRIO ESTÁ INATIVO
        if (!data.is_active) {
          console.warn('❌ Tentativa de login de usuário inativo:', normalizedUsername);
          toast({
            title: "Acesso bloqueado",
            description: "Sua conta está inativa. Entre em contato com o administrador.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Usuário inativo" };
        }
        // Ativar usuário após login bem-sucedido
        await supabase
          .from('auth_users')
          .update({ 
            is_active: true,
            last_login: new Date().toISOString()
          })
          .eq('id', data.id)

        // Atualizar status do usuário na tabela users para "Ativo"
        await supabase
          .from('users')
          .update({ 
            status: 'Ativo',
            updated_at: new Date().toISOString()
          })
          .eq('instagram', data.instagram)

        const userData: AuthUser = {
          id: data.id,
          username: data.username,
          name: data.name,
          role: data.role,
          full_name: data.full_name,
          display_name: data.display_name,
          campaign: data.campaign,
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        setJustLoggedIn(true) // Marcar que acabou de fazer login
        setUser(userData)
        localStorage.setItem('loggedUser', JSON.stringify(userData))
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${data.display_name || data.name}!`,
        })

        // Definir loading como false DEPOIS de retornar, para garantir que o navigate aconteça primeiro
        setTimeout(() => setLoading(false), 100)

        return { success: true, user: userData }
      } else {
        throw new Error('Usuário ou senha incorretos')
      }
    } catch (err) {
      let errorMessage = 'Usuário não foi encontrado'
      
      if (err instanceof Error) {
        if (err.message.includes('Usuário ou senha incorretos')) {
          errorMessage = 'Usuário não foi encontrado ou senha incorreta'
        } else if (err.message.includes('no rows')) {
          errorMessage = 'Usuário não foi encontrado no sistema'
        } else {
          errorMessage = err.message
        }
      }
      
      toast({
        title: "Não foi possível fazer login",
        description: errorMessage,
        variant: "destructive",
      })
      setLoading(false) // Definir loading como false em caso de erro
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('loggedUser')
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    })
  }

  const isAuthenticated = () => {
    return user !== null
  }

  const isUsuario = () => {
    return user?.role === 'Usuário'
  }

  const isAdmin = () => {
    return user?.role === 'admin' || user?.role === 'Administrador' || user?.username === 'wegneycosta' || user?.username === 'felipe' || user?.username === 'adminsaude' || user?.username === 'admin20'
  }

  const isAdmin3 = () => {
    return user?.role === 'admin3'
  }

  const isAdminHitech = () => {
    return user?.role === 'AdminHitech' || user?.username === 'AdminHitech'
  }

  const isFelipeAdmin = () => {
    return user?.username === 'felipe'
  }


  const isFullAdmin = () => {
    return isAdmin() && user?.username !== 'felipe'
  }

  const isMembro = () => {
    return user?.role === 'Membro' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta' || user?.username === 'felipe'
  }

  const isAmigo = () => {
    return user?.role === 'Amigo' || user?.role === 'Membro' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta' || user?.username === 'felipe'
  }

  const isConvidado = () => {
    return user?.role === 'Convidado' || user?.role === 'admin' || user?.role === 'Administrador' || user?.role === 'Convidado' || user?.username === 'wegneycosta' || user?.username === 'felipe'
  }

  const canViewAllUsers = () => {
    return isAdmin()
  }

  const canViewOwnUsers = () => {
    return isAdmin() || isConvidado() || isMembro() || isAmigo()
  }

  const canViewStats = () => {
    return isAdmin() || isMembro() || isConvidado()
  }

  const canGenerateLinks = () => {
    return isAdmin() || isMembro() || isConvidado() || isAmigo()
  }

  const canDeleteUsers = () => {
    // Permitir exclusão para administradores completos (excluir felipe)
    return isFullAdmin()
  }

  const canModifyLinkTypes = () => {
    return isFullAdmin()
  }

  const canExportReports = () => {
    return isAdmin() || isMembro() || isConvidado()
  }


  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isAdmin3,
    isAdminHitech,
    isFelipeAdmin,
    isFullAdmin,
    isMembro,
    isAmigo,
    isConvidado,
    canViewAllUsers,
    canViewOwnUsers,
    canViewStats,
    canGenerateLinks,
    canDeleteUsers,
    canModifyLinkTypes,
    canExportReports
  }
}