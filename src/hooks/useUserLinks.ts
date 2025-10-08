// hooks/useUserLinks.ts
import { useState, useEffect } from 'react'
import { supabase, AuthUser } from '@/lib/supabase'

export interface UserLink {
  id: string
  link_id: string
  user_id: string
  referrer_name: string
  is_active: boolean
  click_count: number
  registration_count: number
  link_type: 'members' | 'friends'
  created_at: string
  expires_at?: string
  updated_at: string
  deleted_at?: string | null
  user_data?: AuthUser
  created_by?: string
  campaign?: string
}

export const useUserLinks = (userId?: string, campaign?: string) => {
  const [userLinks, setUserLinks] = useState<UserLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserLinks()
  }, [userId, campaign])

  const fetchUserLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      // Se userId for fornecido, filtrar por usuário
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      // Se campaign for fornecida, filtrar por campanha
      if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data, error } = await query

      if (error) throw error

      setUserLinks(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar links')
    } finally {
      setLoading(false)
    }
  }

  const getUserByLinkId = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('link_id', linkId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (error) throw error

      // Se o link não tem link_type definido, corrigir baseado na configuração atual
      if (data && !data.link_type) {
        // Link sem link_type encontrado, corrigindo
        
        // Buscar configuração atual do sistema
        const { data: settingsData, error: settingsError } = await supabase
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'member_links_type')
          .single()

        const linkType = settingsData?.setting_value || 'members'
        
        // Atualizar o link com o tipo correto
        const { error: updateError } = await supabase
          .from('user_links')
          .update({ link_type: linkType })
          .eq('id', data.id)

        if (updateError) {
          // Erro ao corrigir link_type
        } else {
          // Link_type corrigido
          data.link_type = linkType;
        }
      }

      return { success: true, data }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Link não encontrado' 
      }
    }
  }

  const createUserLink = async (userId: string, linkId: string, referrerName: string, expiresAt?: string) => {
    try {
      console.log('🔗 createUserLink chamado:', { userId, linkId, referrerName, expiresAt });
      
      // Buscar configuração do sistema para definir o tipo de link
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single()

      if (settingsError) {
        console.error('⚠️ Erro ao buscar configuração de tipo de links:', settingsError);
      }

      // Usar o tipo de link configurado no sistema (default: 'members')
      const linkType = settingsData?.setting_value || 'members'
      console.log('🔗 Tipo de link definido:', linkType);
      
      // Buscar campanha do usuário que está criando o link
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('campaign')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('⚠️ Erro ao buscar campanha do usuário:', userError);
      }

      const userCampaign = userData?.campaign || 'A'
      console.log('🔗 Campanha do usuário:', userCampaign);
      
      console.log('🔗 Inserindo link no banco:', {
        user_id: userId,
        link_id: linkId,
        referrer_name: referrerName,
        expires_at: expiresAt,
        is_active: true,
        click_count: 0,
        registration_count: 0,
        link_type: linkType,
        campaign: userCampaign
      });

      const { data, error } = await supabase
        .from('user_links')
        .insert([{
          user_id: userId,
          link_id: linkId,
          referrer_name: referrerName,
          expires_at: expiresAt,
          is_active: true,
          click_count: 0,
          registration_count: 0,
          link_type: linkType,
          campaign: userCampaign
        }])
        .select()

      console.log('🔗 Resultado da inserção:', { data, error });

      if (error) {
        console.error('❌ Erro ao inserir link:', error);
        throw error;
      }

      if (data) {
        setUserLinks(prev => [data[0], ...prev])
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  const deactivateUserLink = async (linkId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_links')
        .update({ is_active: false })
        .eq('link_id', linkId)
        .select()

      if (error) throw error

      if (data) {
        setUserLinks(prev => prev.map(link => 
          link.link_id === linkId ? { ...link, is_active: false } : link
        ))
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao desativar link' 
      }
    }
  }

  // Função para incrementar contador de cliques
  const incrementClickCount = async (linkId: string) => {
    try {
      // Incrementando contador de cliques para link
      
      // Buscar dados atuais do link
      const { data: currentData, error: fetchError } = await supabase
        .from('user_links')
        .select('click_count, user_id, referrer_name, link_type')
        .eq('link_id', linkId)
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError

      // Incrementar contador de cliques
      const { data, error } = await supabase
        .from('user_links')
        .update({ 
          click_count: (currentData?.click_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('link_id', linkId)
        .eq('is_active', true)
        .select()

      if (error) throw error

      if (data) {
        // Atualizar estado local
        setUserLinks(prev => prev.map(link => 
          link.link_id === linkId ? { ...link, click_count: link.click_count + 1 } : link
        ))

        // Log do tipo de link
        if (currentData?.link_type === 'friends') {
          // Link de amigos acessado
        }
      }

      return { success: true, data: data?.[0] }
    } catch (err) {
      // Erro ao incrementar contador de cliques
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao incrementar contador de cliques' 
      }
    }
  }


  // Função para criar link único por usuário
  const createLink = async (userId: string, referrerName: string, expiresAt?: string) => {
    try {
      // Verificar se já existe um link ativo para este usuário
      const { data: existingLinks, error: fetchError } = await supabase
        .from('user_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('deleted_at', null)

      if (fetchError) throw fetchError

      if (existingLinks && existingLinks.length > 0) {
        // Se já existe, retornar o link existente
        const existingLink = existingLinks[0]
        return { 
          success: true, 
          data: existingLink,
          message: 'Link já existe para este usuário'
        }
      }

      // Gerar linkId único baseado no userId
      const linkId = `user-${userId}`
      
      return await createUserLink(userId, linkId, referrerName, expiresAt)
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  // Função para soft delete de user link
  const softDeleteUserLink = async (linkId: string) => {
    try {
      // Executando soft delete do link
      
      const { data, error } = await supabase
        .rpc('soft_delete_user_link', { link_id_param: linkId })

      if (error) {
        // Erro no soft delete do link
        throw error;
      }

      // Soft delete do link executado com sucesso

      // Recarregar dados após exclusão
      await fetchUserLinks();

      return { success: true, data };
    } catch (err) {
      // Erro geral no softDeleteUserLink
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao excluir link' 
      };
    }
  }



  return {
    userLinks,
    loading,
    error,
    fetchUserLinks,
    getUserByLinkId,
    createUserLink,
    createLink,
    deactivateUserLink,
    incrementClickCount,
    softDeleteUserLink
  }
}