import { useState, useEffect, useCallback } from 'react'
import { supabaseServerless } from '@/lib/supabase'

export interface Friend {
  id: string
  member_id: string
  // Mesma estrutura de membros
  name: string
  phone: string
  instagram: string
  cep?: string | null // ← Adicionar campo CEP (opcional)
  city: string
  sector: string
  referrer: string
  registration_date: string
  status: 'Ativo' | 'Inativo'
  // Dados da segunda pessoa (obrigatório - regra da dupla)
  couple_name: string
  couple_phone: string
  couple_instagram: string
  couple_cep?: string | null // ← Adicionar CEP do parceiro (opcional)
  couple_city: string
  couple_sector: string
  // Campos específicos do sistema de amigos (mesma lógica de membros)
  contracts_completed: number
  ranking_position: number | null
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho'
  is_top_1500: boolean
  can_be_replaced: boolean
  // Campos de verificação de posts (específicos de amigos)
  post_verified_1: boolean
  post_verified_2: boolean
  post_url_1: string | null
  post_url_2: string | null
  // Campo para soft delete
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useFriends = (referrer?: string, campaign?: string) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabaseServerless.from('friends').select('*')
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data: friendsData, error: friendsError } = await query

      if (friendsError) throw friendsError

      // Garantir que data é um array
      const friendsDataArray = Array.isArray(friendsData) ? friendsData : (friendsData ? [friendsData] : [])
      
      // Filtrar amigos não deletados no frontend
      const activeFriends = friendsDataArray.filter((friend: any) => !friend.deleted_at)

      setFriends(activeFriends)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar amigos')
    } finally {
      setLoading(false)
    }
  }, [referrer, campaign])

  const addFriend = async (friendData: Omit<Friend, 'id' | 'created_at' | 'updated_at' | 'contracts_completed' | 'ranking_position' | 'ranking_status' | 'is_top_1500' | 'can_be_replaced' | 'post_verified_1' | 'post_verified_2' | 'post_url_1' | 'post_url_2'>) => {
    try {
      let finalMemberId = friendData.member_id;
      
      // Se member_id já estiver preenchido, usar diretamente
      if (finalMemberId && finalMemberId.trim() !== '') {
        console.log('✅ Usando member_id fornecido:', finalMemberId);
      } else {
        // Buscar pelo nome apenas se member_id não foi fornecido
        console.log('🔍 Member_id não fornecido, buscando pelo nome do referrer...');
        
        // O full_name vem como "João Silva - Membro", extrair apenas "João Silva"
        const extractMemberName = (fullName: string): string => {
          // Remove qualquer sufixo após " - " (Membro, Dupla, Amigo, etc)
          return fullName.split(' - ')[0].trim();
        };

        const memberName = extractMemberName(friendData.referrer);
        
        // Buscar o membro pelo nome
        const { data: membersData, error: memberError } = await supabaseServerless
          .from('members')
          .select('id, name, deleted_at, status')
          .eq('name', memberName)
          .eq('status', 'Ativo');

        if (memberError) {
          throw new Error(`Erro ao buscar membro referrer: ${memberError.message}`);
        }

        // Garantir que data é um array
        const membersDataArray = Array.isArray(membersData) ? membersData : (membersData ? [membersData] : [])
        
        // Filtrar membros não deletados no frontend
        const activeMembersFirst = membersDataArray.filter(member => !member.deleted_at);
        let memberData = activeMembersFirst?.[0];

        if (!memberData) {
          // Tentar buscar com ILIKE para case-insensitive usando o nome
          const { data: membersDataCaseInsensitive, error: memberErrorCaseInsensitive } = await supabaseServerless
            .from('members')
            .select('id, name, deleted_at, status')
            .ilike('name', `%${memberName}%`)
            .eq('status', 'Ativo');

          if (memberErrorCaseInsensitive) {
            throw new Error(`Erro ao buscar membro referrer: ${memberErrorCaseInsensitive.message}`);
          }

          // Garantir que data é um array
          const membersDataCaseInsensitiveArray = Array.isArray(membersDataCaseInsensitive) ? membersDataCaseInsensitive : (membersDataCaseInsensitive ? [membersDataCaseInsensitive] : [])
          
          // Filtrar membros não deletados no frontend
          const activeMembers = membersDataCaseInsensitiveArray.filter(member => !member.deleted_at);
          memberData = activeMembers?.[0];

          if (!memberData) {
            throw new Error(`Membro referrer "${friendData.referrer}" não encontrado na tabela members`);
          }
        }

        finalMemberId = memberData.id;
        console.log('✅ Membro referrer encontrado pelo nome:', finalMemberId);
      }

      const insertData = {
        ...friendData,
        member_id: finalMemberId,
        contracts_completed: 0,
        ranking_status: 'Vermelho' as const,
        is_top_1500: false,
        can_be_replaced: false,
        post_verified_1: false,
        post_verified_2: false,
        post_url_1: null,
        post_url_2: null
      };
      
      // Dados para inserção

      const { data, error } = await supabaseServerless
        .from('friends')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        // Erro na inserção
        throw error;
      }

      if (data) {
        // Amigo cadastrado com sucesso
        console.log('✅ Amigo cadastrado:', data);
        
        // Recarregar lista de amigos
        await fetchFriends();
      }

      return { success: true, data }
    } catch (err) {
      // Erro geral no addFriend
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar amigo' 
      }
    }
  }

  const updateReferrerContracts = async (referrerName: string) => {
    try {
      // Atualizando contratos do referrer
      
      // Buscar o membro referrer pelo nome
      const { data: referrerMembers, error: referrerError } = await supabaseServerless
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const referrerMember = referrerMembers?.[0]; // Pegar o primeiro resultado

      if (referrerError) {
        // Erro ao buscar referrer
        return;
      }

      if (!referrerMember) {
        // Referrer não encontrado
        return;
      }

      // REMOVIDO: Incremento manual de contratos (duplicação corrigida)
      // O contracts_completed deve ser atualizado apenas pela função updateMemberCountersAfterRegistration()
      // no PublicRegister.tsx que conta os amigos reais ativos
      
      
    } catch (err) {
      // Erro ao atualizar contratos do referrer
    }
  }

  const updateRanking = async () => {
    try {
      // Atualizando ranking dos membros
      
      // Atualizar ranking dos membros
      const { error: membersError } = await supabaseServerless.rpc('update_complete_ranking')
      if (membersError) {
        // Erro ao atualizar ranking dos membros
        // Continuar mesmo se falhar
      } else {
        // Ranking dos membros atualizado
      }

      // Atualizar ranking dos amigos
      await updateFriendsRanking()

      // Recarregar dados após atualizar ranking
      await fetchFriends()
    } catch (err) {
      // Erro ao atualizar ranking
    }
  }

  const updateFriendsRanking = async () => {
    try {
      // Implementação futura para ranking de amigos
    } catch (err) {
      // Erro ao atualizar ranking de amigos
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [fetchFriends])

  return {
    friends,
    loading,
    error,
    addFriend,
    fetchFriends,
    updateReferrerContracts,
    updateRanking
  }
}