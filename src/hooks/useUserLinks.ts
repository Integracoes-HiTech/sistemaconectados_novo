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

      // VERIFICAR SE O USUÁRIO DONO DO LINK ESTÁ DESATIVADO
      if (data && data.user_data) {
        if (data.user_data.deleted_at) {
          console.warn('❌ Link bloqueado: usuário com soft delete', {
            linkId,
            username: data.user_data.username,
            deleted_at: data.user_data.deleted_at
          });
          throw new Error('Link desativado. O proprietário deste link foi desativado.');
        }
        
        if (!data.user_data.is_active) {
          console.warn('❌ Link bloqueado: usuário inativo', {
            linkId,
            username: data.user_data.username
          });
          throw new Error('Link desativado. O proprietário deste link está inativo.');
        }
      }

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
      // 1. BUSCAR CAMPANHA E PLANO DO USUÁRIO
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('campaign')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      const userCampaign = userData?.campaign || 'A'

      // Buscar informações do plano da campanha
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('nome_plano, plano_id')
        .eq('code', userCampaign)
        .single()

      if (campaignError) {
        console.error('Erro ao buscar plano da campanha:', campaignError)
      }

      const planName = campaignData?.nome_plano || 'Profissional'
      const planNameLower = planName.toLowerCase()
      const isFreePlan = planNameLower.includes('gratuito')
      const isEssentialPlan = planNameLower.includes('essencial')
      const isProfessionalPlan = planNameLower.includes('profissional')
      const isAdvancedPlan = planNameLower.includes('avançado') || planNameLower.includes('avancado')
      const isBLuxoPlan = planNameLower.includes('b luxo') || planNameLower.includes('plano b luxo')
      const isValterPlan = planNameLower.includes('valter')
      const isHitechPlan = planNameLower.includes('hitech')
      const isSaudePlan = planNameLower.includes('saúde') || planNameLower.includes('saude')

      // 2. DEFINIR LIMITES BASEADO NO PLANO
      let maxMembers = 500 // padrão
      let maxFriends = 999999 // ilimitado padrão

      if (isFreePlan) {
        maxMembers = 25
        maxFriends = 25
      } else if (isEssentialPlan) {
        maxMembers = 100
        maxFriends = 100
      } else if (isProfessionalPlan) {
        maxMembers = 250
        maxFriends = 250
      } else if (isValterPlan || isBLuxoPlan) {
        maxMembers = 1500
        maxFriends = 22500
      } else if (isAdvancedPlan || isHitechPlan || isSaudePlan) {
        maxMembers = 999999 // Ilimitado
        maxFriends = 999999 // Ilimitado
      }

      // 3. BUSCAR CONFIGURAÇÃO DO SISTEMA PARA SABER O TIPO DE LINK
      const { data: settingsData, error: settingsError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single()

      const linkType = settingsData?.setting_value || 'members'

      // 4. VERIFICAR LIMITES BASEADO NO TIPO DE LINK
      if (linkType === 'members') {
        // Contar membros ativos da campanha
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id')
          .eq('campaign', userCampaign)
          .eq('status', 'Ativo')
          .is('deleted_at', null)

        if (membersError) throw membersError

        const currentMembers = membersData?.length || 0

        console.log('🔍 Verificação de limite de membros:', {
          currentMembers,
          maxMembers,
          planName,
          canCreate: currentMembers < maxMembers
        })

        if (currentMembers >= maxMembers) {
          return {
            success: false,
            error: 'LIMIT_REACHED',
            limitType: 'members',
            current: currentMembers,
            max: maxMembers,
            planName: planName,
            message: `Limite de membros atingido (${currentMembers}/${maxMembers}). Faça upgrade do seu plano para continuar cadastrando.`
          }
        }
      } else if (linkType === 'friends') {
        // Contar amigos ativos da campanha
        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('id')
          .eq('campaign', userCampaign)
          .eq('status', 'Ativo')
          .is('deleted_at', null)

        if (friendsError) throw friendsError

        const currentFriends = friendsData?.length || 0

        console.log('🔍 Verificação de limite de amigos:', {
          currentFriends,
          maxFriends,
          planName,
          canCreate: currentFriends < maxFriends
        })

        if (currentFriends >= maxFriends) {
          return {
            success: false,
            error: 'LIMIT_REACHED',
            limitType: 'friends',
            current: currentFriends,
            max: maxFriends,
            planName: planName,
            message: `Limite de amigos atingido (${currentFriends}/${maxFriends}). Faça upgrade do seu plano para continuar cadastrando.`
          }
        }
      }

      // 5. VERIFICAR SE JÁ EXISTE UM LINK ATIVO PARA ESTE USUÁRIO
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

      // 6. GERAR LINKID ÚNICO E CRIAR O LINK
      const shortId = userId.substring(0, 8)
      const linkId = `user-${shortId}`
      
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