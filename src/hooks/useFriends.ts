import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Friend {
  id: string
  member_id: string
  // Mesma estrutura de membros
  name: string
  phone: string
  instagram: string
  city: string
  sector: string
  referrer: string
  registration_date: string
  status: 'Ativo' | 'Inativo'
  // Dados da segunda pessoa (obrigatório - regra da dupla)
  couple_name: string
  couple_phone: string
  couple_instagram: string
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

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('friends')
        .select('*')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })

      if (fetchError) throw fetchError

      setFriends(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar amigos')
    } finally {
      setLoading(false)
    }
  }, [])

  const addFriend = async (friendData: Omit<Friend, 'id' | 'created_at' | 'updated_at' | 'contracts_completed' | 'ranking_position' | 'ranking_status' | 'is_top_1500' | 'can_be_replaced' | 'post_verified_1' | 'post_verified_2' | 'post_url_1' | 'post_url_2'>) => {
    try {
      // Hook useFriends - Dados recebidos
      
      // Buscar o ID do membro que está cadastrando o amigo
      // Buscando membro referrer
      
      // Primeiro tentar busca exata
      const { data: membersData, error: memberError } = await supabase
        .from('members')
        .select('id, name')
        .eq('name', friendData.referrer)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      // Resultado da busca exata

      if (memberError) {
        // Erro ao buscar membro
        throw new Error(`Erro ao buscar membro referrer: ${memberError.message}`);
      }

      let memberData = membersData?.[0]; // Pegar o primeiro resultado

      if (!memberData) {
        // Tentar buscar com ILIKE para case-insensitive
        // Tentando busca case-insensitive
        const { data: membersDataCaseInsensitive, error: memberErrorCaseInsensitive } = await supabase
          .from('members')
          .select('id, name')
          .ilike('name', friendData.referrer)
          .eq('status', 'Ativo')
          .is('deleted_at', null);

        // Resultado da busca case-insensitive

        if (memberErrorCaseInsensitive) {
          throw new Error(`Erro ao buscar membro referrer: ${memberErrorCaseInsensitive.message}`);
        }

        memberData = membersDataCaseInsensitive?.[0]; // Pegar o primeiro resultado

        if (!memberData) {
          throw new Error(`Membro referrer "${friendData.referrer}" não encontrado na tabela members`);
        }
      }

      // Membro referrer encontrado

      const insertData = {
        ...friendData,
        member_id: memberData.id,
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

      const { data, error } = await supabase
        .from('friends')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        // Erro na inserção
        throw error;
      }

      // Amigo inserido com sucesso

      // Atualizar contratos do membro referrer
      await updateReferrerContracts(friendData.referrer);

      // Recarregar dados
      await fetchFriends()

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
      const { data: referrerMembers, error: referrerError } = await supabase
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

      // Incrementar contratos completados
      const newContractsCount = referrerMember.contracts_completed + 1;
      
      // Incrementando contratos do referrer

      // Atualizar contratos do referrer
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          contracts_completed: newContractsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerMember.id);

      if (updateError) {
        // Erro ao atualizar contratos do referrer
        return;
      }

      // Contratos do referrer atualizados com sucesso
      
      // Atualizar ranking após mudança nos contratos
      await updateRanking();
      
    } catch (err) {
      // Erro ao atualizar contratos do referrer
    }
  }

  const updateRanking = async () => {
    try {
      // Atualizando ranking dos membros
      
      // Atualizar ranking dos membros
      const { error: membersError } = await supabase.rpc('update_complete_ranking')
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
      // Atualizando ranking dos amigos
      
      // Atualizar ranking_position dos amigos baseado em contracts_completed
      const { error } = await supabase.rpc('update_friends_ranking')
      if (error) {
        // Erro ao atualizar ranking dos amigos
        // Tentar atualização manual se a função RPC falhar
        await updateFriendsRankingManually();
      } else {
        // Ranking dos amigos atualizado via RPC
      }
    } catch (err) {
      // Erro ao atualizar ranking dos amigos
    }
  }

  const updateFriendsRankingManually = async () => {
    try {
      // Atualizando ranking dos amigos manualmente
      
      // Atualizar ranking_position dos amigos baseado em contracts_completed
      const { error } = await supabase
        .from('friends')
        .update({ 
          ranking_position: null, // Será recalculado
          updated_at: new Date().toISOString()
        })
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (error) {
        // Erro ao limpar ranking dos amigos
        return;
      }

      // Recalcular ranking_position
      const { data: friendsData, error: fetchError } = await supabase
        .from('friends')
        .select('id, contracts_completed, created_at')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        // Erro ao buscar amigos para ranking
        return;
      }

      // Atualizar ranking_position
      for (let i = 0; i < friendsData.length; i++) {
        const friend = friendsData[i];
        const { error: updateError } = await supabase
          .from('friends')
          .update({ 
            ranking_position: i + 1,
            ranking_status: friend.contracts_completed >= 15 ? 'Verde' : 
                          friend.contracts_completed >= 1 ? 'Amarelo' : 'Vermelho',
            is_top_1500: i < 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', friend.id);

        if (updateError) {
          // Erro ao atualizar ranking do amigo
        }
      }

      // Ranking dos amigos atualizado manualmente
    } catch (err) {
      // Erro na atualização manual do ranking
    }
  }

  const softDeleteFriend = async (friendId: string) => {
    try {
      // Executando soft delete do amigo
      
      // Buscar dados do amigo antes de deletar
      const { data: friendData, error: fetchError } = await supabase
        .from('friends')
        .select('referrer')
        .eq('id', friendId)
        .single();

      if (fetchError) {
        // Erro ao buscar dados do amigo
        throw fetchError;
      }

      // Atualizar apenas o campo deleted_at
      const { data, error } = await supabase
        .from('friends')
        .update({ 
          deleted_at: new Date().toISOString()
        })
        .eq('id', friendId)
        .select()
        .single()

      if (error) {
        // Erro no soft delete
        throw error;
      }

      // Soft delete executado com sucesso

      // Atualizar contadores do membro referrer
      if (friendData?.referrer) {
        // Atualizando contadores após exclusão do amigo
        await updateMemberCountersAfterDelete(friendData.referrer);
      }

      // Recarregar dados após exclusão
      await fetchFriends();

      return { success: true, data };
    } catch (err) {
      // Erro geral no softDeleteFriend
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao excluir amigo' 
      };
    }
  }

  // Função para atualizar contadores do membro após exclusão de amigo
  const updateMemberCountersAfterDelete = async (referrerName: string) => {
    try {
      // Atualizando contadores após exclusão
      
      // Buscar o membro referrer
      const { data: referrerMembers, error: referrerError } = await supabase
        .from('members')
        .select('id, name, contracts_completed')
        .eq('name', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      const referrerMember = referrerMembers?.[0];

      if (referrerError) {
        // Erro ao buscar referrer
        return;
      }

      if (!referrerMember) {
        // Referrer não encontrado
        return;
      }

      // Contar amigos ativos cadastrados por este membro
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('id')
        .eq('referrer', referrerName)
        .eq('status', 'Ativo')
        .is('deleted_at', null);

      if (friendsError) {
        // Erro ao contar amigos
        return;
      }

      const friendsCount = friendsData?.length || 0;
      const currentContracts = referrerMember.contracts_completed;

      // Contratos atuais e amigos ativos

      // Atualizar contracts_completed
      // Atualizando contratos após exclusão
      
      const { error: updateError } = await supabase
        .from('members')
        .update({ 
          contracts_completed: friendsCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrerMember.id);

      if (updateError) {
        // Erro ao atualizar contratos do membro
        return;
      }

      // Atualizar ranking e status
      await updateMemberRankingAndStatus(referrerMember.id, friendsCount);
      
      // Contadores do membro atualizados após exclusão

    } catch (err) {
      // Erro ao atualizar contadores após exclusão
    }
  }

  // Função para atualizar ranking e status do membro
  const updateMemberRankingAndStatus = async (memberId: string, contractsCount: number) => {
    try {
      // Atualizando ranking e status do membro
      
      // Calcular status baseado no número de contratos
      let rankingStatus = 'Vermelho';
      if (contractsCount >= 15) {
        rankingStatus = 'Verde';
      } else if (contractsCount >= 1) {
        rankingStatus = 'Amarelo';
      }

      // Atualizar status do membro
      const { error: statusError } = await supabase
        .from('members')
        .update({ 
          ranking_status: rankingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (statusError) {
        // Erro ao atualizar status do membro
      }

      // Atualizar ranking de todos os membros
      await updateAllMembersRanking();

    } catch (err) {
      // Erro ao atualizar ranking e status
    }
  }

  // Função para atualizar ranking de todos os membros
  const updateAllMembersRanking = async () => {
    try {
      // Atualizando ranking de todos os membros
      
      // Buscar todos os membros ordenados por contratos
      const { data: membersData, error: fetchError } = await supabase
        .from('members')
        .select('id, contracts_completed, created_at')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        // Erro ao buscar membros para ranking
        return;
      }

      // Atualizar ranking_position de cada membro
      for (let i = 0; i < membersData.length; i++) {
        const member = membersData[i];
        const { error: updateError } = await supabase
          .from('members')
          .update({ 
            ranking_position: i + 1,
            is_top_1500: i < 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id);

        if (updateError) {
          // Erro ao atualizar ranking do membro
        }
      }

      // Ranking de todos os membros atualizado

    } catch (err) {
      // Erro ao atualizar ranking geral
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
    updateRanking,
    softDeleteFriend,
    refetch: fetchFriends
  }
}