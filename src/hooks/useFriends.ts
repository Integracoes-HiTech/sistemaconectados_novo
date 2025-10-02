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

export const useFriends = (referrer?: string, campaign?: string) => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('friends')
        .select('*')
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      if (campaign) {
        query = query.eq('campaign', campaign)
      }
      
      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setFriends(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar amigos')
    } finally {
      setLoading(false)
    }
  }, [referrer, campaign])

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

      // NÃO atualizar contratos aqui - será feito pelo PublicRegister.tsx
      // (Evita duplicação devido a múltiplas funções incrementando)

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

      // REMOVIDO: Incremento manual de contratos (duplicação corrigida)
      // O contracts_completed deve ser atualizado apenas pela função updateMemberCountersAfterRegistration()
      // no PublicRegister.tsx que conta os amigos reais ativos
      
      console.log('✅ Amigo adicionado sem incremento manual de contratos');
      
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
      console.log(`🔧 Iniciando soft delete do amigo ${friendId}`);
      
      // Buscar dados do amigo antes de deletar
      const { data: friendData, error: fetchError } = await supabase
        .from('members')  // Corrigido: usar tabela members, não friends
        .select('name, referrer')
        .eq('id', friendId)
        .is('deleted_at', null) // Só selecionar se não estiver excluído
        .single();

      if (fetchError) {
        console.error('❌ Erro ao buscar dados do amigo:', fetchError);
        throw new Error(`Amigo não encontrado: ${fetchError.message}`);
      }

      if (!friendData) {
        throw new Error('Amigo já foi excluído ou não existe');
      }

      console.log(`📝 Excluindo amigo: ${friendData.name}`);

      // Atualizar campo deleted_at e status
      const { error } = await supabase
        .from('members')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'Inativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', friendId);

      if (error) {
        console.error('❌ Erro no soft delete:', error);
        throw new Error(`Erro ao excluir amigo: ${error.message}`);
      }

      console.log('✅ Amigo excluído com sucesso');

      // Atualizar contadores do membro referrer
      if (friendData?.referrer) {
        console.log(`🔄 Atualizando contadores do referrer: ${friendData.referrer}`);
        await updateMemberCountersAfterDelete(friendData.referrer);
      }

      // Excluir entrada em auth_users se existir
      const { error: authDeleteError } = await supabase
        .from('auth_users')
        .delete()
        .eq('name', friendData.name);

      if (authDeleteError) {
        console.error('❌ Erro ao excluir auth_users:', authDeleteError);
        // Não falhar aqui, auth_users pode não existir
      } else {
        console.log('✅ Usuário excluído de auth_users');
      }

      // Recarregar dados após exclusão
      await fetchFriends();

      console.log('✅ Soft delete de amigo concluído');
      return { success: true };
    } catch (err) {
      console.error('❌ Erro no soft delete de amigo:', err);
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
      await updateRankingAutomatically();

    } catch (err) {
      // Erro ao atualizar ranking e status
    }
  }

  // Função para atualizar ranking usando sistema automático do banco
  const updateRankingAutomatically = async () => {
    try {
      // Usar função RPC do banco que já tem sistema automático por campanha
      const { error } = await supabase.rpc('update_complete_ranking');
      
      if (error) {
        console.warn('Erro ao executar ranking automático:', error);
      }
    } catch (err) {
      console.warn('Erro ao executar ranking automático:', err);
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