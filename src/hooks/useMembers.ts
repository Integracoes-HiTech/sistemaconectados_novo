// hooks/useMembers.ts
import { useState, useEffect, useCallback } from 'react'
import { supabaseServerless } from '@/lib/supabase'

export interface Member {
  id: string
  name: string
  phone: string
  instagram: string
  cep?: string | null // ← Adicionar campo CEP (opcional)
  city: string
  sector: string
  referrer: string
  quemindicou?: string | null // ← Campo para quem indicou (nome da coluna no banco)
  telefonequemindicou?: string | null // ← Telefone de quem indicou (nome da coluna no banco)
  registration_date: string
  status: 'Ativo' | 'Inativo'
  // Dados da segunda pessoa (obrigatório - regra da dupla)
  couple_name: string
  couple_phone: string
  couple_instagram: string
  couple_cep?: string | null // ← Adicionar CEP do parceiro (opcional)
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
  campaign: string
  campaign_id?: string | null // ← ID da campanha (adicionado)
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
  members_with_referrer_name: number
}

export interface SystemSettings {
  max_members: number
  contracts_per_member: number
  ranking_green_threshold: number
  ranking_yellow_threshold: number
  paid_contracts_phase_active: boolean
  paid_contracts_start_date: string
}

export const useMembers = (referrer?: string, campaign?: string, maxMembers: number = 1500, campaignId?: string | null) => {
  const [members, setMembers] = useState<Member[]>([])
  const [memberStats, setMemberStats] = useState<MemberStats>({
    total_members: 0,
    green_members: 0,
    yellow_members: 0,
    red_members: 0,
    top_1500_members: 0,
    current_member_count: 0,
    max_member_limit: maxMembers,
    can_register_more: true,
    members_with_referrer_name: 0
  })
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para membros - filtrar apenas os não excluídos
      let query = supabaseServerless.from('members').select('*')
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      // Usar campaign_id se disponível (relacional), caso contrário usar campaign (texto) para compatibilidade
      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      } else if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data: membersData, error: membersError } = await query
      if (membersError) throw membersError

      // Garantir que data é um array
      const membersDataArray = Array.isArray(membersData) ? membersData : (membersData ? [membersData] : [])
      
      // Filtrar membros não excluídos no frontend
      let activeMembers = membersDataArray.filter((member: any) => !member.deleted_at)
      
      // Se houver referrer, filtrar também por comparação de nome simples
      if (referrer) {
        const extractSimpleName = (fullName: string): string => {
          const cleanName = fullName.replace(/\s*-\s*(Membro|Amigo|Administrador|Admin).*$/i, '').trim();
          return cleanName;
        };
        
        const simpleReferrerName = extractSimpleName(referrer);
        
        activeMembers = activeMembers.filter((member: any) => {
          const simpleMemberReferrer = extractSimpleName(member.referrer);
          return simpleMemberReferrer === simpleReferrerName || member.referrer === referrer;
        });
      }
      
      setMembers(activeMembers)
      
      // Recarregar estatísticas após carregar membros
      await fetchMemberStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }, [referrer, campaign, campaignId])

  const fetchMemberStats = useCallback(async () => {
    try {
      // Se não há campanha especificada (nem campaign nem campaignId), usar a view global
      if (!campaign && !campaignId) {
        return;
      }

      // Filtrar por campanha específica
      let query = supabaseServerless
        .from('members')
        .select('ranking_status, contracts_completed, is_top_1500, status, deleted_at, quemindicou, telefonequemindicou')
      
      // Usar campaign_id se disponível (relacional), caso contrário usar campaign (texto) para compatibilidade
      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      } else if (campaign) {
        query = query.eq('campaign', campaign)
      }
      
      const { data: membersData, error } = await query

      if (error) throw error

      // Garantir que data é um array
      const membersDataArray = Array.isArray(membersData) ? membersData : (membersData ? [membersData] : [])
      
      // Se não há dados, retornar estatísticas padrão
      if (membersDataArray.length === 0) {
        const defaultStats: MemberStats = {
          total_members: 0,
          green_members: 0,
          yellow_members: 0,
          red_members: 0,
          top_1500_members: 0,
          current_member_count: 0,
          max_member_limit: maxMembers,
          can_register_more: true,
          members_with_referrer_name: 0
        };
        setMemberStats(defaultStats);
        return;
      }

      // Filtrar membros ativos e não excluídos no frontend
      const activeMembers = membersDataArray.filter((member: any) => 
        !member.deleted_at && member.status === 'Ativo'
      )

      // Calcular estatísticas da campanha
      const totalMembers = activeMembers.length
      const greenMembers = activeMembers.filter(m => m.ranking_status === 'Verde').length
      const yellowMembers = activeMembers.filter(m => m.ranking_status === 'Amarelo').length
      const redMembers = activeMembers.filter(m => m.ranking_status === 'Vermelho').length
      const top1500Members = activeMembers.filter(m => m.is_top_1500).length
      // Contar membros COM indicação (pelo menos um dos campos quemindicou ou telefonequemindicou preenchido)
      const membersWithReferrer = activeMembers.filter((m: any) => 
        (m.quemindicou && typeof m.quemindicou === 'string' && m.quemindicou.trim() !== '') || 
        (m.telefonequemindicou && typeof m.telefonequemindicou === 'string' && m.telefonequemindicou.trim() !== '')
      ).length
      // Membros SEM indicação = Total - Membros COM indicação
      const membersWithoutReferrer = totalMembers - membersWithReferrer

      const stats: MemberStats = {
        total_members: totalMembers,
        green_members: greenMembers,
        yellow_members: yellowMembers,
        red_members: redMembers,
        top_1500_members: top1500Members,
        current_member_count: totalMembers,
        max_member_limit: maxMembers,
        can_register_more: totalMembers < maxMembers,
        members_with_referrer_name: membersWithReferrer
      }

      setMemberStats(stats)
    } catch (err) {
      // Em caso de erro, definir estatísticas padrão
      const defaultStats: MemberStats = {
        total_members: 0,
        green_members: 0,
        yellow_members: 0,
        red_members: 0,
        top_1500_members: 0,
        current_member_count: 0,
        max_member_limit: maxMembers,
        can_register_more: true,
        members_with_referrer_name: 0
      };
      
      setMemberStats(defaultStats);
    }
  }, [campaign, campaignId, maxMembers])

  const fetchSystemSettings = useCallback(async () => {
    try {
      const { data, error } = await supabaseServerless
        .from('system_settings')
        .select('setting_key, setting_value')

      if (error) throw error

      const settings: SystemSettings = {
        max_members: maxMembers,
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
      console.log('📝 Hook useMembers - Dados recebidos:', memberData);
      
      // Preparar dados para inserção - garantir que todos os campos obrigatórios estão presentes
      const insertData: Record<string, unknown> = {
        ...memberData,
        contracts_completed: 0,
        ranking_status: 'Vermelho',
        is_top_1500: false,
        can_be_replaced: false,
        is_friend: memberData.is_friend || false
      };
      
      // Lista de campos válidos na tabela members (campos que realmente existem)
      const validFields = [
        'name', 'phone', 'instagram', 'cep', 'city', 'sector', 
        'referrer', 'quemindicou', 'telefonequemindicou', 'registration_date', 'status', 'campaign', 'campaign_id',
        'couple_name', 'couple_phone', 'couple_instagram', 'couple_cep', 
        'couple_city', 'couple_sector',
        'contracts_completed', 'ranking_status', 'is_top_1500', 
        'can_be_replaced', 'is_friend', 'deleted_at'
      ];
      
      // Mapear campos do código para nomes do banco de dados
      if ('referrer_name' in insertData) {
        insertData.quemindicou = insertData.referrer_name;
        delete insertData.referrer_name;
      }
      if ('referrer_phone' in insertData) {
        insertData.telefonequemindicou = insertData.referrer_phone;
        delete insertData.referrer_phone;
      }
      
      // Remover campos que não existem na tabela e campos undefined
      const removedFields: string[] = [];
      Object.keys(insertData).forEach(key => {
        if (insertData[key] === undefined || !validFields.includes(key)) {
          removedFields.push(key);
          delete insertData[key];
        }
      });
      
      if (removedFields.length > 0) {
        console.log('🔍 Campos removidos (não existem na tabela):', removedFields);
      }
      
      console.log('📝 Dados para inserção no banco:', insertData);

      const { data, error } = await supabaseServerless
        .from('members')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao inserir membro no banco:', error);
        console.error('   Tipo do erro:', typeof error);
        console.error('   Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('   Mensagem:', error.message);
        
        // Tentar acessar propriedades adicionais do erro
        if (error && typeof error === 'object') {
          const errorObj = error as unknown as Record<string, unknown>;
          Object.keys(errorObj).forEach(key => {
            console.error(`   ${key}:`, errorObj[key]);
          });
        }
        
        // Mensagem de erro mais descritiva
        let errorMessage = 'Erro ao salvar membro no banco de dados.';
        if (error.message) {
          errorMessage += ` ${error.message}`;
        }
        
        // Se o erro for uma string, adicionar diretamente
        if (typeof error === 'string') {
          errorMessage = error;
        }
        
        throw new Error(errorMessage);
      }

      console.log('✅ Membro inserido com sucesso:', data && typeof data === 'object' && 'name' in data ? (data as { name: string }).name : 'Membro');

      // NÃO atualizar contratos aqui - será feito pelo PublicRegister.tsx
      // (Evita duplicação devido a múltiplas funções incrementando)

      // Atualizar ranking após adicionar membro
      await updateRanking()
      
      // Recarregar estatísticas para atualizar contadores
      await fetchMemberStats()

      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro geral no addMember:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro desconhecido ao adicionar membro' 
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
      console.warn('Função updateReferrerContracts removida para evitar duplicação');
    }
  }

  const updateRanking = async () => {
    try {
      const { error } = await supabaseServerless.rpc('update_complete_ranking')
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
      
      // Buscar dados do membro antes de excluir
      const { data: memberData, error: memberError } = await supabaseServerless
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


      // 1. Soft delete do membro
      const { error: deleteError } = await supabaseServerless
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


      // 2. NÃO excluir amigos relacionados - excluir apenas o membro

      // 3. Buscar auth_users correspondente e excluir links
      const { data: authUsers, error: authSearchError } = await supabaseServerless
        .from('auth_users')
        .select('id')
        .eq('name', memberData.name)
        .eq('role', 'Membro')
        .limit(1);

      if (authUsers && authUsers.length > 0) {
        const authUserId = authUsers[0].id;
        
        // 3.1. Excluir user_links fisicamente
        const { error: linksDeleteError } = await supabaseServerless
          .from('user_links')
          .delete()
          .eq('user_id', authUserId);

        if (linksDeleteError) {
          console.error('❌ Erro ao excluir user_links:', linksDeleteError);
        } else {
        }

        // 3.2. Excluir auth_users fisicamente  
        const { error: authDeleteError } = await supabaseServerless
          .from('auth_users')
          .delete()
          .eq('id', authUserId);

        if (authDeleteError) {
          console.error('❌ Erro ao excluir auth_users:', authDeleteError);
        } else {
        }
      } else {
      }

      // 4. Atualizar ranking após exclusões
      await updateRanking();

      // 5. Recarregar dados após exclusão
      await fetchMembers();
      await fetchMemberStats();

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
