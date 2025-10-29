// hooks/useUserLinks.ts
import { useState, useEffect } from 'react'
import { supabaseServerless, AuthUser } from '@/lib/supabase'

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
  campaign_id?: string | null // ← Adicionar campaign_id (obrigatório agora)
}

export const useUserLinks = (userId?: string, campaign?: string, campaignId?: string | null) => {
  const [userLinks, setUserLinks] = useState<UserLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserLinks()
  }, [userId, campaign, campaignId])

  const fetchUserLinks = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabaseServerless
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // Se userId for fornecido, filtrar por usuário
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      // Usar campaign_id se disponível (relacional), caso contrário usar campaign (texto) para compatibilidade
      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      } else if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data, error } = await query

      if (error) throw error

      // Filtrar links não excluídos no frontend
      const activeLinks = (data || []).filter(link => !link.deleted_at)
      setUserLinks(activeLinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar links')
    } finally {
      setLoading(false)
    }
  }

  const getUserByLinkId = async (linkId: string) => {
    try {
      const { data, error } = await supabaseServerless
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('link_id', linkId)
        .single()

      // Melhor tratamento de erro - diferenciar "não encontrado" de outros erros
      if (error) {
        const errorMessage = error.message || '';
        // Se é erro de "não encontrado", retornar erro específico
        if (errorMessage.includes('No rows') || errorMessage.includes('no rows') || errorMessage.includes('not found')) {
          throw new Error('Link não encontrado');
        }
        // Outros erros, relançar
        throw error;
      }

      // Se não retornou dados, link não encontrado
      if (!data) {
        throw new Error('Link não encontrado');
      }

      // Verificar se o link está desativado ou deletado (ANTES de verificar o usuário)
      if (data.deleted_at) {
        console.warn('❌ Link bloqueado: link com soft delete', {
          linkId,
          deleted_at: data.deleted_at
        });
        throw new Error('Link desativado. Este link foi desativado.');
      }

      if (data.is_active === false) {
        console.warn('❌ Link bloqueado: link inativo', {
          linkId,
          is_active: data.is_active
        });
        throw new Error('Link desativado. Este link está inativo.');
      }

      // VERIFICAR SE O USUÁRIO DONO DO LINK ESTÁ DESATIVADO
      // Mas só se realmente existir user_data (usuário pode não existir ainda em alguns casos raros)
      if (data && data.user_data) {
        if (data.user_data.deleted_at) {
          console.warn('❌ Link bloqueado: usuário com soft delete', {
            linkId,
            username: data.user_data.username,
            deleted_at: data.user_data.deleted_at
          });
          throw new Error('Link desativado. O proprietário deste link foi desativado.');
        }
        
        // Verificar is_active apenas se o campo existir e for explicitamente false
        // Links recém-criados podem não ter is_active definido ainda (undefined = permitir)
        if (data.user_data.is_active === false) {
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
        const { data: settingsData, error: settingsError } = await supabaseServerless
          .from('system_settings')
          .select('setting_value')
          .eq('setting_key', 'member_links_type')
          .single()

        const linkType = settingsData?.setting_value || 'members'
        
        // Atualizar o link com o tipo correto
        const { error: updateError } = await supabaseServerless
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
      
      // Buscar configuração do sistema para definir o tipo de link
      const { data: settingsData, error: settingsError } = await supabaseServerless
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single()

      if (settingsError) {
        console.error('⚠️ Erro ao buscar configuração de tipo de links:', settingsError);
      }

      // Usar o tipo de link configurado no sistema (default: 'members')
      const linkType = settingsData?.setting_value || 'members'
      
      // Buscar campanha do usuário que está criando o link
      const { data: userData, error: userError } = await supabaseServerless
        .from('auth_users')
        .select('campaign')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('⚠️ Erro ao buscar campanha do usuário:', userError);
      }

      const userCampaign = userData?.campaign || 'A'
      
      const linkData = {
          user_id: userId,
          link_id: linkId,
          referrer_name: referrerName,
          expires_at: expiresAt,
          is_active: true,
          click_count: 0,
          registration_count: 0,
        link_type: linkType,
        campaign: userCampaign
      };

      const { data, error } = await supabaseServerless
        .from('user_links')
        .insert([linkData])
        .select()

      if (error) {
        throw error;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setUserLinks(prev => [data[0], ...prev])
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
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  const deactivateUserLink = async (linkId: string) => {
    try {
      const { data, error } = await supabaseServerless
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
      const { data: currentData, error: fetchError } = await supabaseServerless
        .from('user_links')
        .select('click_count, user_id, referrer_name, link_type')
        .eq('link_id', linkId)
        .eq('is_active', true)
        .single()

      if (fetchError) throw fetchError

      // Incrementar contador de cliques
      const { data, error } = await supabaseServerless
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
      const { data: userData, error: userError } = await supabaseServerless
        .from('auth_users')
        .select('campaign')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      const userCampaign = userData?.campaign || 'A'

      // Buscar informações do plano da campanha
      const { data: campaignData, error: campaignError } = await supabaseServerless
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
      // Plano A e Plano B (que era Plano B Luxo) - mesmas features
      const isPlanA = planNameLower.includes('plano a') || planNameLower === 'a'
      const isPlanB = planNameLower.includes('plano b') || planNameLower.includes('b luxo') || planNameLower.includes('plano b luxo')
      const isPlanAOrB = isPlanA || isPlanB
      const isHitechPlan = planNameLower.includes('hitech')
      const isSaudePlan = planNameLower.includes('pessoas')

      // 2. DEFINIR LIMITES BASEADO NO PLANO
      let maxMembers = 500 // padrão
      let maxFriends = 999999 // ilimitado padrão

      if (isFreePlan) {
        maxMembers = 25
        maxFriends = 25
      } else if (isEssentialPlan) {
        maxMembers = 1000
        maxFriends = 1000
      } else if (isProfessionalPlan) {
        maxMembers = 2500
        maxFriends = 2500
      } else if (isPlanAOrB) {
        // Plano A e Plano B: 1500 membros, 22500 amigos
        maxMembers = 1500
        maxFriends = 22500
      } else if (isAdvancedPlan || isHitechPlan || isSaudePlan) {
        maxMembers = 999999 // Ilimitado
        maxFriends = 999999 // Ilimitado
      }

      // 3. BUSCAR CONFIGURAÇÃO DO SISTEMA PARA SABER O TIPO DE LINK
      const { data: settingsData, error: settingsError } = await supabaseServerless
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single()

      const linkType = settingsData?.setting_value || 'members'

      // 4. VERIFICAR LIMITES BASEADO NO TIPO DE LINK
      if (linkType === 'members') {
        // Contar membros ativos da campanha
        const { data: membersData, error: membersError } = await supabaseServerless
          .from('members')
          .select('id')
          .eq('campaign', userCampaign)
          .eq('status', 'Ativo')

        if (membersError) throw membersError

        // Garantir que data é um array
        const membersDataArray = Array.isArray(membersData) ? membersData : (membersData ? [membersData] : []);
        
        // Filtrar membros não excluídos no frontend
        const activeMembers = membersDataArray.filter(member => !member.deleted_at)
        const currentMembers = activeMembers.length

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
        const { data: friendsData, error: friendsError } = await supabaseServerless
          .from('friends')
          .select('id')
          .eq('campaign', userCampaign)
          .eq('status', 'Ativo')

        if (friendsError) throw friendsError

        // Garantir que data é um array
        const friendsDataArray = Array.isArray(friendsData) ? friendsData : (friendsData ? [friendsData] : []);
        
        // Filtrar amigos não excluídos no frontend
        const activeFriends = friendsDataArray.filter(friend => !friend.deleted_at)
        const currentFriends = activeFriends.length

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
      const { data: existingLinks, error: fetchError } = await supabaseServerless
        .from('user_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (fetchError) throw fetchError

      // Filtrar links não excluídos no frontend
      const activeLinks = Array.isArray(existingLinks) 
        ? existingLinks.filter(link => !link.deleted_at)
        : existingLinks && !existingLinks.deleted_at 
          ? [existingLinks] 
          : []

      if (activeLinks && activeLinks.length > 0) {
        // Se já existe, retornar o link existente
        const existingLink = activeLinks[0]
        return { 
          success: true, 
          data: existingLink,
          message: 'Link já existe para este usuário'
        }
      }
      
      // 6. GERAR LINKID ÚNICO E CRIAR O LINK
      const linkId = `user-${userId}`
      
      return await createUserLink(userId, linkId, referrerName, expiresAt)
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao criar link' 
      }
    }
  }

  // Função para soft delete de user link (sem RPC)
  const softDeleteUserLink = async (linkId: string) => {
    try {
      // Soft delete direto na tabela user_links
      const { data, error } = await supabaseServerless
        .from('user_links')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('link_id', linkId)
        .select()

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Link não encontrado ou já foi excluído');
      }

      // Recarregar dados após exclusão
      await fetchUserLinks();

      return { success: true, data: data[0] };
    } catch (err) {
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