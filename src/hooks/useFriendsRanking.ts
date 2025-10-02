import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface FriendRanking {
  id: string;
  member_id: string;
  // Dados do amigo (mesma estrutura de membros)
  name: string;
  phone: string;
  instagram: string;
  city: string;
  sector: string;
  referrer: string;
  registration_date: string;
  status: string;
  couple_name: string;
  couple_phone: string;
  couple_instagram: string;
  couple_city: string;
  couple_sector: string;
  contracts_completed: number; // Quantos usuários este amigo cadastrou
  ranking_position: number;
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho';
  is_top_1500: boolean;
  can_be_replaced: boolean;
  post_verified_1: boolean;
  post_verified_2: boolean;
  post_url_1: string | null;
  post_url_2: string | null;
  created_at: string;
  updated_at: string;
  // Dados do membro que cadastrou
  member_name: string;
  member_instagram: string;
  member_phone: string;
  member_city: string;
  member_sector: string;
}

export const useFriendsRanking = (campaign?: string) => {
  const [friends, setFriends] = useState<FriendRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendsRanking = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscando ranking dos amigos diretamente da tabela friends
      // com JOIN para obter dados do membro referrer
      let query = supabase
        .from('friends')
        .select(`
          *,
          members!inner(name, instagram, phone, city, sector, campaign)
        `)
        .eq('status', 'Ativo')
        .is('deleted_at', null)
        .order('contracts_completed', { ascending: false })
        .order('created_at', { ascending: true });
      
      if (campaign) {
        query = query.eq('campaign', campaign);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        // Erro ao buscar ranking dos amigos
        setError(`Erro ao buscar dados: ${fetchError.message}`);
        return;
      }

      // Transformar dados para incluir informações do membro referrer
      const transformedData = (data || []).map(friend => ({
        ...friend,
        member_name: friend.members?.name || '',
        member_instagram: friend.members?.instagram || '',
        member_phone: friend.members?.phone || '',
        member_city: friend.members?.city || '',
        member_sector: friend.members?.sector || ''
      }));

      // Ranking dos amigos carregado
      setFriends(transformedData);
    } catch (err) {
      // Erro geral ao buscar ranking dos amigos
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const addFriendReferral = async (friendId: string, referralData: {
    name: string;
    phone: string;
    instagram: string;
    city: string;
    sector: string;
    instagram_post?: string;
    hashtag?: string;
  }) => {
    try {
      // Adicionando referência de amigo

      const { data, error } = await supabase
        .from('friend_referrals')
        .insert([{
          friend_id: friendId,
          referred_user_name: referralData.name,
          referred_user_phone: referralData.phone,
          referred_user_instagram: referralData.instagram,
          referred_user_city: referralData.city,
          referred_user_sector: referralData.sector,
          instagram_post: referralData.instagram_post,
          hashtag: referralData.hashtag,
          post_verified: false
        }])
        .select();

      if (error) {
        // Erro ao adicionar referência
        throw new Error(`Erro ao adicionar referência: ${error.message}`);
      }

      // Referência adicionada com sucesso
      
      // Atualizar contador de usuários cadastrados no amigo
      await updateUsersCadastradosCount(friendId);
      
      // Recarrega o ranking após adicionar uma nova referência
      await fetchFriendsRanking();
      
      return data;
    } catch (err) {
      // Erro geral ao adicionar referência
      throw err;
    }
  };

  const getFriendsByMember = async (memberId: string) => {
    try {
      // Buscando amigos do membro

      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          members!inner(name, instagram, phone, city, sector)
        `)
        .eq('member_id', memberId)
        .eq('status', 'Ativo')
        .order('created_at', { ascending: false });

      if (error) {
        // Erro ao buscar amigos do membro
        throw new Error(`Erro ao buscar amigos: ${error.message}`);
      }

      // Amigos do membro carregados
      return data || [];
    } catch (err) {
      // Erro geral ao buscar amigos do membro
      throw err;
    }
  };

  const getFriendReferrals = async (friendId: string) => {
    try {
      // Buscando referências do amigo

      const { data, error } = await supabase
        .from('friend_referrals')
        .select('*')
        .eq('friend_id', friendId)
        .order('created_at', { ascending: false });

      if (error) {
        // Erro ao buscar referências do amigo
        throw new Error(`Erro ao buscar referências: ${error.message}`);
      }

      // Referências do amigo carregadas
      return data || [];
    } catch (err) {
      // Erro geral ao buscar referências do amigo
      throw err;
    }
  };

  const verifyInstagramPost = async (referralId: string, verified: boolean) => {
    try {
      // Verificando post do Instagram

      const { data, error } = await supabase
        .from('friend_referrals')
        .update({ post_verified: verified })
        .eq('id', referralId)
        .select();

      if (error) {
        // Erro ao verificar post
        throw new Error(`Erro ao verificar post: ${error.message}`);
      }

      // Post verificado com sucesso
      
      // Recarrega o ranking após verificar o post
      await fetchFriendsRanking();
      
      return data;
    } catch (err) {
      // Erro geral ao verificar post
      throw err;
    }
  };

  const updateUsersCadastradosCount = async (friendId: string) => {
    try {
      // Atualizando contador de usuários cadastrados

      // Contar referências ativas para este amigo
      const { count, error: countError } = await supabase
        .from('friend_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', friendId)
        .eq('referral_status', 'Ativo');

      if (countError) {
        // Erro ao contar referências
        return;
      }

      // Atualizar contador na tabela friends
      const { error: updateError } = await supabase
        .from('friends')
        .update({ 
          contracts_completed: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', friendId);

      if (updateError) {
        // Erro ao atualizar contador
        return;
      }

      // Contador atualizado
    } catch (err) {
      // Erro geral ao atualizar contador
    }
  };

  const getFriendsStats = () => {
    const total = friends.length;
    const verde = friends.filter(f => f.ranking_status === 'Verde').length;
    const amarelo = friends.filter(f => f.ranking_status === 'Amarelo').length;
    const vermelho = friends.filter(f => f.ranking_status === 'Vermelho').length;

    return {
      total,
      verde,
      amarelo,
      vermelho
    };
  };

  useEffect(() => {
    fetchFriendsRanking();
  }, [campaign]);

  // Função para excluir amigo (soft delete)
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
      await fetchFriendsRanking();

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

      // Atualizar ranking geral
      await updateRankingAutomatically();

    } catch (err) {
      // Erro ao atualizar ranking e status
    }
  }

  // Função para atualizar ranking de todos os membros
  const updateAllMembersRanking = async () => {
    try {
      // Atualizando ranking de todos os membros
      
      // Usar função RPC do banco que já tem sistema automático por campanha
      const { error } = await supabase.rpc('update_complete_ranking');
      
      if (error) {
        console.warn('Erro ao executar ranking automático:', error);
      }

    } catch (err) {
      // Erro ao atualizar ranking geral
    }
  }

  return {
    friends,
    loading,
    error,
    fetchFriendsRanking,
    addFriendReferral,
    getFriendsByMember,
    getFriendReferrals,
    verifyInstagramPost,
    getFriendsStats,
    softDeleteFriend
  };
};
