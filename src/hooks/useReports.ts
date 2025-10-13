// hooks/useReports.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Member {
  id: string
  name: string
  city: string
  sector: string
  status: string
  registration_date: string
  created_at: string
  referrer?: string
  // Campos específicos da tabela members
  couple_name?: string
  couple_phone?: string
  couple_instagram?: string
  couple_city?: string
  couple_sector?: string
  contracts_completed?: number
  ranking_position?: number
  ranking_status?: string
  is_friend?: boolean
  deleted_at?: string | null
}

export interface ReportData {
  usersByLocation: Record<string, number>
  registrationsByDay: Array<{ date: string; quantidade: number }>
  usersByStatus: Array<{ name: string; value: number; color: string }>
  recentActivity: Array<{
    id: string
    name: string
    action: string
    date: string
  }>
  sectorsByCity: Record<string, number>
  sectorsGroupedByCity: Record<string, { sectors: string[]; count: number; totalSectors: number }>
  usersByCity: Record<string, number>
}

export const useReports = (referrer?: string, campaign?: string) => {
  const [reportData, setReportData] = useState<ReportData>({
    usersByLocation: {},
    registrationsByDay: [],
    usersByStatus: [],
    recentActivity: [],
    sectorsByCity: {},
    sectorsGroupedByCity: {},
    usersByCity: {}
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para membros (tabela principal atual)
      let query = supabase.from('members').select('*').is('deleted_at', null)
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data: members, error } = await query

      if (error) throw error

      // Calcular dados para relatórios usando membros
      const usersByLocation = calculateUsersByLocation(members || [])
      const registrationsByDay = calculateRegistrationsByDay(members || [])
      const usersByStatus = calculateUsersByStatus(members || [])
      const recentActivity = calculateRecentActivity(members || [])
      const sectorsByCity = calculateSectorsByCity(members || [])
      const sectorsGroupedByCity = calculateSectorsGroupedByCity(members || [])
      const usersByCity = calculateUsersByCity(members || [])

      setReportData({
        usersByLocation,
        registrationsByDay,
        usersByStatus,
        recentActivity,
        sectorsByCity,
        sectorsGroupedByCity,
        usersByCity
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados dos relatórios')
    } finally {
      setLoading(false)
    }
  }, [referrer, campaign])

  useEffect(() => {
    // Limpar estado anterior antes de buscar novos dados
    setReportData({
      usersByLocation: {},
      registrationsByDay: [],
      usersByStatus: [],
      recentActivity: [],
      sectorsByCity: {},
      sectorsGroupedByCity: {},
      usersByCity: {}
    })
    setError(null)
    fetchReportData()
  }, [fetchReportData])


  const calculateUsersByLocation = (members: Member[]) => {
    return members.reduce((acc, member) => {
      const location = `${member.city} - ${member.sector}`
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const calculateSectorsByCity = (members: Member[]) => {
    const sectorsByCity = members.reduce((acc, member) => {
      if (!acc[member.city]) {
        acc[member.city] = new Set()
      }
      acc[member.city].add(member.sector)
      return acc
    }, {} as Record<string, Set<string>>)

    // Converter Sets para números
    const result: Record<string, number> = {}
    for (const city in sectorsByCity) {
      result[city] = sectorsByCity[city].size
    }
    return result
  }

  // Nova função para agrupar setores por cidade com nomes dos setores
  const calculateSectorsGroupedByCity = (members: Member[]) => {
    const sectorsByCity = members.reduce((acc, member) => {
      if (!acc[member.city]) {
        acc[member.city] = {
          sectors: new Set(),
          count: 0
        }
      }
      acc[member.city].sectors.add(member.sector)
      acc[member.city].count += 1
      return acc
    }, {} as Record<string, { sectors: Set<string>; count: number }>)

    // Converter para formato final
    const result: Record<string, { sectors: string[]; count: number; totalSectors: number }> = {}
    for (const city in sectorsByCity) {
      result[city] = {
        sectors: Array.from(sectorsByCity[city].sectors).sort(),
        count: sectorsByCity[city].count,
        totalSectors: sectorsByCity[city].sectors.size
      }
    }
    return result
  }

  const calculateUsersByCity = (members: Member[]) => {
    return members.reduce((acc, member) => {
      acc[member.city] = (acc[member.city] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const calculateRegistrationsByDay = (members: Member[]) => {
    const registrationsByDay = []
    
    // Últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Verificar tanto registration_date quanto created_at
      const quantidade = members.filter(member => {
        const memberDate = member.registration_date || member.created_at
        if (!memberDate) return false
        
        // Extrair apenas a parte da data (YYYY-MM-DD)
        const memberDateStr = memberDate.split('T')[0]
        return memberDateStr === dateStr
      }).length
      
      registrationsByDay.push({
        date: dateStr, // Manter formato ISO para exportação
        quantidade
      })
    }
    
    return registrationsByDay
  }

  const calculateUsersByStatus = (members: Member[]) => {
    const activeMembers = members.filter(member => member.status === 'Ativo').length
    const inactiveMembers = members.filter(member => member.status === 'Inativo').length
    
    return [
      { name: "Ativos no Sistema", value: activeMembers, color: "#10B981" },
      { name: "Inativos no Sistema", value: inactiveMembers, color: "#EF4444" }
    ]
  }

  const calculateRecentActivity = (members: Member[]) => {
    return members
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(member => ({
        id: member.id,
        name: member.name,
        action: 'Cadastro realizado',
        date: new Date(member.created_at).toLocaleDateString('pt-BR')
      }))
  }

  return {
    reportData,
    loading,
    error,
    refetch: fetchReportData,
    fetchReportData
  }
}