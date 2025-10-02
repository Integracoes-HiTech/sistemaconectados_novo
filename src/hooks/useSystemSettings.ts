// hooks/useSystemSettings.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface SystemSettings {
  max_members: number
  contracts_per_member: number
  ranking_green_threshold: number
  ranking_yellow_threshold: number
  paid_contracts_phase_active: boolean
  paid_contracts_start_date: string
  member_links_type: 'members' | 'friends'
  admin_controls_link_type: boolean
}

export interface PhaseControl {
  id: string
  phase_name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  max_limit: number
  current_count: number
  created_at: string
  updated_at: string
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [phases, setPhases] = useState<PhaseControl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      // fetchSettings iniciada
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')

      if (error) {
        // Erro ao buscar configurações
        throw error;
      }
      
      // Configurações carregadas

      const settingsData: SystemSettings = {
        max_members: 1500,
        contracts_per_member: 15,
        ranking_green_threshold: 15,
        ranking_yellow_threshold: 1,
        paid_contracts_phase_active: false,
        paid_contracts_start_date: '2026-07-01',
        member_links_type: 'members',
        admin_controls_link_type: true
      }

      // Converter dados do banco para objeto
      data?.forEach(item => {
        switch (item.setting_key) {
          case 'max_members':
            settingsData.max_members = parseInt(item.setting_value)
            break
          case 'contracts_per_member':
            settingsData.contracts_per_member = parseInt(item.setting_value)
            break
          case 'ranking_green_threshold':
            settingsData.ranking_green_threshold = parseInt(item.setting_value)
            break
          case 'ranking_yellow_threshold':
            settingsData.ranking_yellow_threshold = parseInt(item.setting_value)
            break
          case 'paid_contracts_phase_active':
            settingsData.paid_contracts_phase_active = item.setting_value === 'true'
            break
          case 'paid_contracts_start_date':
            settingsData.paid_contracts_start_date = item.setting_value
            break
          case 'member_links_type':
            settingsData.member_links_type = item.setting_value as 'members' | 'friends'
            break
          case 'admin_controls_link_type':
            settingsData.admin_controls_link_type = item.setting_value === 'true'
            break
        }
      })

      setSettings(settingsData)
      // Settings atualizados
    } catch (err) {
      // Erro geral no fetchSettings
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPhases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('phase_control')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      setPhases(data || [])
    } catch (err) {
      // Erro ao carregar fases
    }
  }, [])

  const updateSetting = async (key: string, value: string | number | boolean) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: value.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key)

      if (error) throw error

      // Recarregar configurações
      await fetchSettings()

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Problema ao atualizar configuração' 
      }
    }
  }

  const updatePhase = async (phaseName: string, updates: Partial<PhaseControl>) => {
    try {
      const { error } = await supabase
        .from('phase_control')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('phase_name', phaseName)

      if (error) throw error

      // Recarregar fases
      await fetchPhases()

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Não foi possivel atualizar fase' 
      }
    }
  }

  const activatePaidContractsPhase = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Ativar fase de contratos pagos
      const { error: phaseError } = await supabase
        .from('phase_control')
        .update({ 
          is_active: true,
          start_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('phase_name', 'paid_contracts')

      if (phaseError) throw phaseError

      // Atualizar configuração da fase
      const { error: settingError } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: 'true',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'paid_contracts_phase_active')

      if (settingError) throw settingError

      // Alterar automaticamente o tipo de links para 'friends'
      const { error: linksError } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: 'friends',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'member_links_type')

      if (linksError) throw linksError

      // Recarregar dados
      await fetchSettings()
      await fetchPhases()

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao ativar fase de contratos pagos' 
      }
    }
  }

  const updateMemberLinksType = async (linkType: 'members' | 'friends', userCampaign?: string) => {
    try {
      // NOVA VERSÃO DA FUNÇÃO updateMemberLinksType INICIADA
      // updateMemberLinksType chamada
      // Tipo de link recebido
      // Timestamp
      // Versão da função: 2.0 - COM LOGS DETALHADOS
      
      // 1. Verificar configuração atual antes de alterar
      // Verificando configuração atual
      const { data: currentSettings, error: fetchError } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single();

      if (fetchError) {
        // Erro ao buscar configuração atual
        throw fetchError;
      }

      // Configuração atual
      // Nova configuração
      
      // 2. Atualizar configuração do sistema
      // Atualizando configuração do sistema
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: linkType })
        .eq('setting_key', 'member_links_type')

      if (error) {
        // Erro na atualização da configuração
        throw error;
      }

      // Configuração do sistema atualizada

      // Buscar todos os administradores para excluir da atualização
      // Buscando todos os administradores
      const { data: adminUsers, error: adminError } = await supabase
        .from('auth_users')
        .select('id, username, full_name, role')
        .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.felipe,username.eq.admin_b');

      if (adminError) {
        // Erro ao buscar administradores
        throw adminError;
      }

      const adminIds = adminUsers?.map(admin => admin.id) || [];
      // Administradores encontrados

      // 4. Verificar links existentes antes de atualizar (filtrar por campanha se especificada)
      // Verificando links existentes
      let existingLinksQuery = supabase
        .from('user_links')
        .select('id, user_id, link_type, campaign')
        .not('user_id', 'in', `(${adminIds.join(',')})`);

      // Se campanha do usuário foi especificada, filtrar apenas essa campanha
      if (userCampaign) {
        existingLinksQuery = existingLinksQuery.eq('campaign', userCampaign);
      }

      const { data: existingLinks, error: linksFetchError } = await existingLinksQuery;

      if (linksFetchError) {
        // Erro ao buscar links existentes
        throw linksFetchError;
      }

      // Links existentes
      // Links por tipo

      // Se mudando para 'friends', atualizar links existentes
      if (linkType === 'friends') {
        // Atualizando links existentes para friends
        
        let updateQuery = supabase
          .from('user_links')
          .update({ 
            link_type: 'friends',
            updated_at: new Date().toISOString()
          })
          .eq('link_type', 'members')
          .not('user_id', 'in', `(${adminIds.join(',')})`); // Excluir todos os administradores

        // Se campanha do usuário foi especificada, filtrar apenas essa campanha
        if (userCampaign) {
          updateQuery = updateQuery.eq('campaign', userCampaign);
        }

        const { data: updateResult, error: linksError } = await updateQuery
          .select('id, user_id, link_type');

        if (linksError) {
          // Erro ao atualizar links existentes
          throw linksError;
        }

        // Links atualizados para friends
        // Resultado da atualização
      }

      // Se mudando para 'members', atualizar links existentes
      if (linkType === 'members') {
        // Atualizando links existentes para members (exceto admin)
        
        let updateQuery = supabase
          .from('user_links')
          .update({ 
            link_type: 'members',
            updated_at: new Date().toISOString()
          })
          .eq('link_type', 'friends')
          .not('user_id', 'in', `(${adminIds.join(',')})`); // Excluir todos os administradores

        // Se campanha do usuário foi especificada, filtrar apenas essa campanha
        if (userCampaign) {
          updateQuery = updateQuery.eq('campaign', userCampaign);
        }

        const { data: updateResult, error: linksError } = await updateQuery
          .select('id, user_id, link_type');

        if (linksError) {
          // Erro ao atualizar links existentes
          throw linksError;
        }

        // Links atualizados para members
        // Resultado da atualização
      }
      
      // 7. Verificar resultado final
      // Verificando resultado final
      let finalLinksQuery = supabase
        .from('user_links')
        .select('id, user_id, link_type, campaign')
        .not('user_id', 'in', `(${adminIds.join(',')})`);

      // Se campanha do usuário foi especificada, filtrar apenas essa campanha
      if (userCampaign) {
        finalLinksQuery = finalLinksQuery.eq('campaign', userCampaign);
      }

      const { data: finalLinks, error: finalError } = await finalLinksQuery;

      if (finalError) {
        // Erro ao verificar resultado final
      } else {
        // Links finais (exceto admin)
        // Links finais por tipo
      }
      
      // Recarregar configurações
      // Recarregando configurações
      await fetchSettings()
      
      // updateMemberLinksType concluída com sucesso
      return { success: true }
    } catch (err) {
      // Erro geral no updateMemberLinksType
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Não foi possivel atualizar tipo de links' 
      }
    }
  }

  const deactivatePaidContractsPhase = async () => {
    try {
      // Desativar fase de contratos pagos
      const { error: phaseError } = await supabase
        .from('phase_control')
        .update({ 
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('phase_name', 'paid_contracts')

      if (phaseError) throw phaseError

      // Atualizar configuração da fase
      const { error: settingError } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: 'false',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'paid_contracts_phase_active')

      if (settingError) throw settingError

      // Alterar automaticamente o tipo de links para 'members'
      const { error: linksError } = await supabase
        .from('system_settings')
        .update({ 
          setting_value: 'members',
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'member_links_type')

      if (linksError) throw linksError

      // Recarregar dados
      await fetchSettings()
      await fetchPhases()

      return { success: true }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Erro ao desativar fase de contratos pagos' 
      }
    }
  }

  const checkMemberLimit = async () => {
    try {
      const { data, error } = await supabase
        .from('phase_control')
        .select('current_count, max_limit')
        .eq('phase_name', 'members_registration')
        .single()

      if (error) throw error

      return {
        current: data.current_count,
        max: data.max_limit,
        canRegister: data.current_count < data.max_limit,
        percentage: (data.current_count / data.max_limit) * 100
      }
    } catch (err) {
      return {
        current: 0,
        max: 1500,
        canRegister: true,
        percentage: 0
      }
    }
  }

  const getPhaseStatus = (phaseName: string) => {
    const phase = phases.find(p => p.phase_name === phaseName)
    return phase || null
  }

  const isPhaseActive = (phaseName: string) => {
    const phase = getPhaseStatus(phaseName)
    return phase?.is_active || false
  }

  const getPhaseProgress = (phaseName: string) => {
    const phase = getPhaseStatus(phaseName)
    if (!phase) return { current: 0, max: 0, percentage: 0 }
    
    return {
      current: phase.current_count,
      max: phase.max_limit,
      percentage: (phase.current_count / phase.max_limit) * 100
    }
  }

  const shouldShowMemberLimitAlert = () => {
    if (!settings) return false
    
    const membersPhase = getPhaseStatus('members_registration')
    if (!membersPhase) return false
    
    const percentage = (membersPhase.current_count / membersPhase.max_limit) * 100
    
    // Mostrar alerta quando atingir 90% do limite
    return percentage >= 90
  }

  const getMemberLimitStatus = () => {
    if (!settings) return { status: 'unknown', message: '', percentage: 0 }
    
    const membersPhase = getPhaseStatus('members_registration')
    if (!membersPhase) return { status: 'unknown', message: '', percentage: 0 }
    
    const percentage = (membersPhase.current_count / membersPhase.max_limit) * 100
    
    if (percentage > 100) {
      return {
        status: 'exceeded',
        message: 'Limite de Membros Excedido',
        percentage: percentage
      }
    } else if (percentage >= 100) {
      return {
        status: 'reached',
        message: 'Limite de Membros Atingido',
        percentage: percentage
      }
    } else if (percentage >= 90) {
      return {
        status: 'near',
        message: 'Limite de Membros Próximo',
        percentage: percentage
      }
    } else {
      return {
        status: 'ok',
        message: '',
        percentage: percentage
      }
    }
  }

  const canActivatePaidContracts = () => {
    const membersPhase = getPhaseStatus('members_registration')
    if (!membersPhase) return false
    
    // Só permite ativar se atingiu o limite de 1500 membros
    const hasReachedLimit = membersPhase.current_count >= 1500
    const isNotActive = !isPhaseActive('paid_contracts')
    
    return hasReachedLimit && isNotActive
  }

  useEffect(() => {
    fetchSettings()
    fetchPhases()
  }, [fetchSettings, fetchPhases])


  return {
    settings,
    phases,
    loading,
    error,
    updateSetting,
    updatePhase,
    activatePaidContractsPhase,
    deactivatePaidContractsPhase,
    updateMemberLinksType,
    checkMemberLimit,
    getPhaseStatus,
    isPhaseActive,
    getPhaseProgress,
    shouldShowMemberLimitAlert,
    getMemberLimitStatus,
    canActivatePaidContracts,
    refetch: () => {
      fetchSettings()
      fetchPhases()
    }
  }
}
