// hooks/useStats.ts
import { useState, useEffect } from 'react'
import { supabaseServerless, Stats } from '@/lib/supabase'

export const useStats = (referrer?: string, campaign?: string, campaignId?: string | null) => {
  const [stats, setStats] = useState<Stats>({
    total_users: 0,
    active_users: 0,
    recent_registrations: 0,
    engagement_rate: 0,
    today_registrations: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Limpar estado anterior antes de buscar novos dados
    setStats({
      total_users: 0,
      active_users: 0,
      recent_registrations: 0,
      engagement_rate: 0,
      today_registrations: 0
    })
    setError(null)
    fetchStats()
  }, [referrer, campaign, campaignId])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para membros (tabela principal)
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

      const { data: members, error } = await query

      if (error) throw error

      // Filtrar apenas membros não excluídos e ativos
      const activeMembers = (members || []).filter((member: any) => 
        !member.deleted_at && member.status === 'Ativo'
      )

      // Calcular estatísticas
      const totalUsers = activeMembers.length || 0
      const activeUsers = activeMembers.length || 0
      
      // Membros dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentRegistrations = activeMembers.filter((member: any) => {
        const regDate = new Date(member.registration_date || member.created_at)
        return regDate >= sevenDaysAgo
      }).length || 0

      // Membros cadastrados hoje
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // Formato YYYY-MM-DD
      
      const todayRegistrations = activeMembers.filter((member: any) => {
        const regDate = new Date(member.registration_date || member.created_at)
        return regDate.toISOString().split('T')[0] === todayStr
      }).length || 0

      // Taxa de engajamento (membros ativos / total)
      const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

      setStats({
        total_users: totalUsers,
        active_users: activeUsers,
        recent_registrations: recentRegistrations,
        engagement_rate: Number(engagementRate.toFixed(1)),
        today_registrations: todayRegistrations
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    fetchStats
  }
}
