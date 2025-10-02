// hooks/useMembers.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Member {
  id: string
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
  // Campos específicos do sistema de membros
  contracts_completed: number
  ranking_position: number | null
  ranking_status: 'Verde' | 'Amarelo' | 'Vermelho'
  is_top_1500: boolean
  can_be_replaced: boolean
  // Campo para distinguir membros de amigos
  is_friend?: boolean
  // Campo para soft delete
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface MemberStats {
  total_members: number
  green_members: number
  yellow_members: number
  red_members: number
  top_1500_members: number
  current_member_count: number
  max_member_limit: number
  can_register_more: boolean
}

export interface SystemSettings {
  max_members: number
  contracts_per_member: number
  ranking_green_threshold: number
  ranking_yellow_threshold: number
  paid_contracts_phase_active: boolean
  paid_contracts_start_date: string
}

export const useMembers = (referrer?: string, campaign?: string) => {
  const [members, setMembers] = useState<Member[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para membros - filtrar apenas os não excluídos
      let query = supabase.from('members').select('*').is('deleted_at', null)
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data: membersData, error: membersError } = await query
      if (membersError) throw membersError

      setMembers(membersData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [referrer, campaign])

  const fetchMemberStats = useCallback(async () => {
    try {
      // Se não há campanha especificada, usar a view global
      if (!campaign) {
        const { data, error } = await supabase
          .from('v_system_stats')
          .select('*')
          .single()

        if (error) throw error

        const stats: MemberStats = {
          total_members: data.total_members || 0,
          green_members: data.green_members || 0,
          yellow_members: data.yellow_members || 0,
          red_members: data.red_members || 0,
          top_1500_members: data.top_1500_members || 0,
          current_member_count: data.current_member_count || 0,
          max_member_limit: data.max_member_limit || 1500,
          can_register_more: (data.current_member_count || 0) < (data.max_member_limit || 1500)
        }

        setMemberStats(stats)
        return
      }

      // Filtrar por campanha específica
      const { data: membersData, error } = await supabase
        .from('members')
        .select('ranking_status, contracts_completed, is_top_1500')
        .eq('campaign', campaign)
        .eq('status', 'Ativo')
        .is('deleted_at', null)

      if (error) throw error

      // Calcular estatísticas da campanha
      const totalMembers = membersData?.length || 0
      const greenMembers = membersData?.filter(m => m.ranking_status === 'Verde').length || 0
      const yellowMembers = membersData?.filter(m => m.ranking_status === 'Amarelo').length || 0
      const redMembers = membersData?.filter(m => m.ranking_status === 'Vermelho').length || 0
      const top1500Members = membersData?.filter(m => m.is_top_1500).length || 0

      const stats: MemberStats = {
        total_members: totalMembers,
        green_members: greenMembers,
        yellow_members: yellowMembers,
        red_members: redMembers,
        top_1500_members: top1500Members,
        current_member_count: totalMembers,
        max_member_limit: 1500,
        can_register_more: totalMembers < 1500
      }

      setMemberStats(stats)
    } catch (err) {
      // Erro ao carregar estatísticas dos membros
    }
  }, [campaign])

  const fetchSystemSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')

      if (error) throw error

      const settings: SystemSettings = {
        max_members: 1500,
        contracts_per_member: 15,
        ranking_green_threshold: 15,
        ranking_yellow_threshold: 1,
        paid_contracts_phase_active: false,
        paid_contracts_start_date: '2025-07-01'
      }

      // Converter dados do banco para objeto
      data?.forEach(item => {
        switch (item.setting_key) {
          case 'max_members':
            settings.max_members = parseInt(item.setting_value)
            break
          case 'contracts_per_member':
            settings.contracts_per_member = parseInt(item.setting_value)
            break
          case 'ranking_green_threshold':
            settings.ranking_green_threshold = parseInt(item.setting_value)
            break
          case 'ranking_yellow_threshold':
            settings.ranking_yellow_threshold = parseInt(item.setting_value)
            break
          case 'paid_contracts_phase_active':
            settings.paid_contracts_phase_active = item.setting_value === 'true'
            break
          case 'paid_contracts_start_date':
            settings.paid_contracts_start_date = item.setting_value
            break
        }
      })

      setSystemSettings(settings)
    } catch (err) {
      // Erro ao carregar configurações do sistema
    }
  }, [])

  const addMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'contracts_completed' | 'ranking_position' | 'ranking_status' | 'is_top_1500' | 'can_be_replaced'>) => {
    try {
      // Hook useMembers - Dados recebidos
      
      // Verificar se pode cadastrar mais membros
      try {
        const { data: canRegister, error: canRegisterError } = await supabase
          .rpc('can_register_member')

        if (canRegisterError) {
          console.warn('Função can_register_member não encontrada, continuando...')
        } else if (!canRegister) {
          throw new Error('Limite de 1.500 membros atingido. Não é possível cadastrar novos membros.')
        }
      } catch (rpcError) {
        console.warn('Erro ao verificar limite de membros, continuando...', rpcError)
      }

      // Inserindo membro no banco
      const insertData = {
        ...memberData,
        contracts_completed: 0,
        ranking_status: 'Vermelho',
        is_top_1500: false,
        can_be_replaced: false,
        is_friend: memberData.is_friend || false
      };
      
      // Dados para inserção

      const { data, error } = await supabase
        .from('members')
        .insert([insertData])
        .select()
        .single()

      // Resultado da inserção

      if (error) {
        // Erro na inserção
        // Detalhes do erro
        throw error;
      }

      // Membro inserido com sucesso

      // NÃO atualizar contratos aqui - será feito pelo PublicRegister.tsx
      // (Evita duplicação devido a múltiplas funções incrementando)

      // Atualizar ranking após adicionar membro
      await updateRanking()
      
      // Recarregar estatísticas para atualizar contadores
      await fetchMemberStats()

      return { success: true, data }
    } catch (err) {
      // Erro geral no addMember
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao adicionar membro' 
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
      
      console.log('✅ Membro adicionado sem incremento manual de contratos');
      
    } catch (err) {
      console.warn('Função updateReferrerContracts removida para evitar duplicação');
    }
  }

  const updateRanking = async () => {
    try {
      const { error } = await supabase.rpc('update_complete_ranking')
      if (error) throw error

      // Recarregar dados após atualizar ranking
      await fetchMembers()
      await fetchMemberStats()
    } catch (err) {
      // Erro ao atualizar ranking
    }
  }

  const getRankingStatusColor = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    switch (status) {
      case 'Verde':
        return 'text-green-600 bg-green-100'
      case 'Amarelo':
        return 'text-yellow-600 bg-yellow-100'
      case 'Vermelho':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getRankingStatusIcon = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    switch (status) {
      case 'Verde':
        return '🟢'
      case 'Amarelo':
        return '🟡'
      case 'Vermelho':
        return '🔴'
      default:
        return '⚪'
    }
  }

  const canReplaceMember = (member: Member) => {
    return member.ranking_status === 'Vermelho' && !member.is_top_1500
  }

  const getMembersByStatus = (status: 'Verde' | 'Amarelo' | 'Vermelho') => {
    return members.filter(member => member.ranking_status === status)
  }

  const getTopMembers = (limit: number = 10) => {
    return members
      .filter(member => member.status === 'Ativo')
      .sort((a, b) => (a.ranking_position || 999) - (b.ranking_position || 999))
      .slice(0, limit)
  }

  const getReplaceableMembers = () => {
    return members.filter(member => canReplaceMember(member))
  }

  const getMemberRole = (member: Member) => {
    switch (member.ranking_status) {
      case 'Verde':
        return 'Coordenador'
      case 'Amarelo':
        return 'Membro Ativo'
      case 'Vermelho':
        return 'Membro'
      default:
        return 'Membro'
    }
  }

  // Função para soft delete (exclusão lógica) sem dependência de RPC
  const softDeleteMember = async (memberId: string) => {
    try {
      console.log(`🔧 Iniciando soft delete do membro ${memberId} (SEM cascata)`);
      
      // Buscar dados do membro antes de excluir
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('name, contracts_completed')
        .eq('id', memberId)
        .is('deleted_at', null) // Só selecionar se não estiver já excluído
        .single();

      if (memberError) {
        console.error('❌ Erro ao buscar membro:', memberError);
        throw new Error(`Membro não encontrado: ${memberError.message}`);
      }

      if (!memberData) {
        throw new Error('Membro já foi excluído ou não existe');
      }

      console.log(`📝 Excluindo membro: ${memberData.name}`);

      // 1. Soft delete do membro
      const { error: deleteError } = await supabase
        .from('members')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'Inativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (deleteError) {
        console.error('❌ Erro ao atualizar membro:', deleteError);
        throw new Error(`Erro ao excluir membro: ${deleteError.message}`);
      }

      console.log('✅ Membro excluído na tabela members');

      // 2. NÃO excluir amigos relacionados - excluir apenas o membro
      console.log('⚠️ Exclusão de membro SEM cascata - ');

      // 3. Buscar auth_users correspondente e excluir links
      const { data: authUsers, error: authSearchError } = await supabase
        .from('auth_users')
        .select('id')
        .eq('name', memberData.name)
        .eq('role', 'Membro')
        .limit(1);

      if (authUsers && authUsers.length > 0) {
        const authUserId = authUsers[0].id;
        
        // 3.1. Excluir user_links fisicamente
        const { error: linksDeleteError } = await supabase
          .from('user_links')
          .delete()
          .eq('user_id', authUserId);

        if (linksDeleteError) {
          console.error('❌ Erro ao excluir user_links:', linksDeleteError);
        } else {
          console.log('✅ Links excluídos fisicamente');
        }

        // 3.2. Excluir auth_users fisicamente  
        const { error: authDeleteError } = await supabase
          .from('auth_users')
          .delete()
          .eq('id', authUserId);

        if (authDeleteError) {
          console.error('❌ Erro ao excluir auth_users:', authDeleteError);
        } else {
          console.log('✅ Usuário excluído de auth_users');
        }
      } else {
        console.log('⚠️ Nenhum auth_users encontrado para excluir');
      }

      // 4. Atualizar ranking após exclusões
      await updateRanking();

      // 5. Recarregar dados após exclusão
      await fetchMembers();
      await fetchMemberStats();

      console.log('✅ Soft delete concluído com sucesso');
      return { success: true };

    } catch (err) {
      console.error('❌ Erro no soft delete:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao excluir membro' 
      };
    }
  }



  useEffect(() => {
    fetchMembers()
    fetchMemberStats()
    fetchSystemSettings()
  }, [fetchMembers, fetchMemberStats, fetchSystemSettings])

  return {
    members,
    memberStats,
    systemSettings,
    loading,
    error,
    addMember,
    updateRanking,
    getRankingStatusColor,
    getRankingStatusIcon,
    canReplaceMember,
    getMembersByStatus,
    getTopMembers,
    getReplaceableMembers,
    getMemberRole,
    softDeleteMember,
    refetch: fetchMembers
  }
}
