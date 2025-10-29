// hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabaseServerless, AuthUser } from '@/lib/supabase'
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
      // Tentar buscar com campaign_id, mas se falhar, buscar sem ele (compatibilidade)
      let sessionData: (AuthUser & { is_active: boolean; deleted_at: string | null; campaign_id?: string | null }) | null = null
      let error: Error | null = null
      
      try {
        const result = await supabaseServerless
          .from('auth_users')
          .select('id, username, role, is_active, name, campaign, campaign_id, deleted_at')
          .eq('id', userData.id)
          .eq('username', userData.username)
          .single()
        
        error = result.error
        sessionData = result.data as typeof sessionData
      } catch (err) {
        // Se falhar, tentar buscar sem campaign_id (caso a coluna não exista ainda)
        try {
          const result = await supabaseServerless
            .from('auth_users')
            .select('id, username, role, is_active, name, campaign, deleted_at')
            .eq('id', userData.id)
            .eq('username', userData.username)
            .single()
          
          error = result.error
          sessionData = result.data as typeof sessionData
        } catch (fallbackErr) {
          error = fallbackErr as Error
        }
      }
      
      if (error || !sessionData || !sessionData.is_active || sessionData.deleted_at) {
        console.warn('🚨 Sessão inválida ou usuário desativado, fazendo logout...')
        if (sessionData?.deleted_at) {
          console.warn('❌ Usuário com soft delete (deleted_at preenchido)')
        }
        localStorage.removeItem('loggedUser')
        setUser(null)
        return
      }

      // Buscar plano_id da campanha se tiver campaign_id
      let planoId: string | null = null;
      const campaignId = sessionData.campaign_id || userData.campaign_id;
      if (campaignId) {
        try {
          const { data: campaignData } = await supabaseServerless
            .from('campaigns')
            .select('plano_id')
            .eq('id', campaignId)
            .single();
          
          planoId = campaignData?.plano_id || null;
        } catch (err) {
          // Se falhar ao buscar plano_id, continuar sem ele
        }
      }

      // Atualizar dados do usuário se necessário
      const updatedUser: AuthUser = { 
        ...userData,
        role: sessionData.role,
        name: sessionData.name || userData.name,
        campaign: sessionData.campaign || userData.campaign,
        campaign_id: campaignId || userData.campaign_id,
        plano_id: planoId || userData.plano_id
      }

      // Verificar se houve mudanças significativas
      if (sessionData.role !== userData.role || 
          (sessionData.name || userData.name) !== userData.name ||
          updatedUser.campaign_id !== userData.campaign_id ||
          updatedUser.plano_id !== userData.plano_id) {
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

      // Buscar usuário na tabela auth_users por username (incluindo campaign_id)
      const { data, error } = await supabaseServerless
        .from('auth_users')
        .select('*, campaign_id')
        .eq('username', normalizedUsername)
        .eq('password', password) // Em produção, usar hash da senha
        .single()

      // PRIMEIRO: Verificar se houve erro (usuário não encontrado ou senha incorreta)
      if (error) {
        // Verificar se é erro de "não encontrado" (usuário ou senha incorretos)
        const errorMessage = error.message || '';
        if (errorMessage.includes('no rows') || errorMessage.includes('not found') || errorMessage.includes('No rows')) {
          toast({
            title: "Usuário ou senha incorretos",
            description: "Verifique suas credenciais e tente novamente.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Usuário ou senha incorretos" };
        }
        // Se for outro tipo de erro, lançar novamente para tratamento genérico
        throw error;
      }

      // SEGUNDO: Verificar se os dados foram retornados
      if (!data) {
        toast({
          title: "Usuário ou senha incorretos",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
        setLoading(false);
        return { success: false, error: "Usuário ou senha incorretos" };
      }

      // TERCEIRO: Agora sim, verificar status do usuário
      const userData = data as AuthUser & { is_active: boolean; deleted_at: string | null; instagram: string }
      
      // VERIFICAR SE USUÁRIO FOI DESATIVADO (SOFT DELETE)
      if (userData.deleted_at) {
          console.warn('❌ Tentativa de login de usuário desativado:', normalizedUsername);
          toast({
            title: "Acesso bloqueado",
            description: "Sua conta foi desativada. Entre em contato com o administrador.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Usuário desativado" };
        }

        // VERIFICAR SE É MEMBRO - MEMBROS NÃO TÊM ACESSO AO SISTEMA
        if (userData.role === 'Membro') {
          console.warn('❌ Tentativa de login de membro (acesso bloqueado):', normalizedUsername);
          toast({
            title: "Acesso bloqueado",
            description: "Membros não têm acesso ao sistema. Use seu link de cadastro para cadastrar novas pessoas.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Membros não têm acesso ao sistema" };
        }

        // VERIFICAR SE USUÁRIO ESTÁ INATIVO
        if (!userData.is_active) {
          console.warn('❌ Tentativa de login de usuário inativo:', normalizedUsername);
          toast({
            title: "Acesso bloqueado",
            description: "Dados inválidos.",
            variant: "destructive",
          });
          setLoading(false);
          return { success: false, error: "Usuário inativo" };
        }
        // Ativar usuário após login bem-sucedido
        await supabaseServerless
          .from('auth_users')
          .update({ 
            is_active: true,
            last_login: new Date().toISOString()
          })
          .eq('id', userData.id)

        // Removido: Tabela users não existe mais, usar apenas auth_users

        // Buscar campaign_id se não estiver no userData
        let campaignId = (userData as any).campaign_id || null;
        let planoId: string | null = null;

        // Se tiver campaign_id, buscar plano_id da campanha
        if (campaignId) {
          try {
            const { data: campaignData } = await supabaseServerless
              .from('campaigns')
              .select('plano_id')
              .eq('id', campaignId)
              .single();
            
            planoId = campaignData?.plano_id || null;
          } catch (err) {
            // Se falhar ao buscar plano_id, continuar sem ele
          }
        } else if (userData.campaign) {
          // Se não tiver campaign_id mas tiver campaign (código), buscar campaign_id e plano_id
          try {
            const { data: campaignData } = await supabaseServerless
              .from('campaigns')
              .select('id, plano_id')
              .eq('code', userData.campaign)
              .single()
            
            if (campaignData?.id) {
              campaignId = campaignData.id;
              planoId = campaignData.plano_id || null;
            }
          } catch (err) {
            // Se falhar ao buscar, continuar sem campaign_id e plano_id
          }
        }

        const userToSave: AuthUser = {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          role: userData.role,
          full_name: userData.full_name,
          campaign: userData.campaign,
          campaign_id: campaignId,
          plano_id: planoId,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }

        setJustLoggedIn(true) // Marcar que acabou de fazer login
        setUser(userToSave)
        localStorage.setItem('loggedUser', JSON.stringify(userToSave))
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${userData.name}!`,
        })

        // Definir loading como false DEPOIS de retornar, para garantir que o navigate aconteça primeiro
        setTimeout(() => setLoading(false), 100)

        return { success: true, user: userToSave }
    } catch (err) {
      // Este catch só deve capturar erros inesperados, não erros de autenticação
      // (que já foram tratados acima - usuário não encontrado/senha incorreta)
      let errorMessage = 'Erro ao realizar login'
      
      if (err instanceof Error) {
        errorMessage = err.message || 'Erro desconhecido ao realizar login'
      }
      
      toast({
        title: "Erro ao realizar login",
        description: errorMessage,
        variant: "destructive",
      })
      setLoading(false)
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

  const isAdmin9 = () => {
    return user?.role === 'admin9' || user?.username === 'admin9'
  }

  const isAdminHitech = () => {
    return user?.role === 'AdminHitech' || user?.username === 'AdminHitech'
  }

  const isFelipeAdmin = () => {
    return user?.username === 'felipe'
  }

  // Verificar se é Felipe da campanha A (tem permissões completas)
  const isFelipeCampaignA = () => {
    return user?.username === 'felipe' && (user?.campaign === 'A' || user?.campaign_id)
  }

  const isFullAdmin = () => {
    // Felipe NÃO é FullAdmin (nem da campanha A)
    return isAdmin() && user?.username !== 'felipe'
  }

  const isMembro = () => {
    return user?.role === 'Membro'
  }

  const isAmigo = () => {
    return user?.role === 'Amigo'
  }

  const isConvidado = () => {
    return user?.role === 'Convidado'
  }

  const canViewAllUsers = () => {
    return isAdmin()
  }

  const canViewOwnUsers = () => {
    return isAdmin() || isConvidado() || isAmigo()
  }

  const canViewStats = () => {
    return isAdmin() || isConvidado()
  }

  const canGenerateLinks = () => {
    // Felipe NÃO pode gerar links
    if (user?.username?.toLowerCase() === 'felipe') return false
    return isAdmin() || isConvidado() || isAmigo()
  }

  const canDeleteUsers = () => {
    // Permitir exclusão para administradores completos
    // Admin9 NÃO pode excluir
    // Felipe NÃO pode excluir
    return isFullAdmin() && !isAdmin9() && user?.username?.toLowerCase() !== 'felipe'
  }

  const canModifyLinkTypes = () => {
    // Felipe NÃO pode modificar tipos de links
    return isFullAdmin() && user?.username?.toLowerCase() !== 'felipe'
  }

  const canExportReports = () => {
    return isAdmin() || isConvidado()
  }


  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isAdmin3,
    isAdmin9,
    isAdminHitech,
    isFelipeAdmin,
    isFelipeCampaignA,
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