// hooks/useStats.ts
import { useState, useEffect } from 'react'
import { supabase, Stats } from '@/lib/supabase'

export const useStats = (referrer?: string, campaign?: string) => {
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
  }, [referrer, campaign])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query base para usuários
      let query = supabase.from('users').select('*')
      
      if (referrer) {
        query = query.eq('referrer', referrer)
      }
      
      if (campaign) {
        query = query.eq('campaign', campaign)
      }

      const { data: users, error } = await query

      if (error) throw error

      // Calcular estatísticas
      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(user => user.status === 'Ativo').length || 0
      
      // Usuários dos últimos 7 dias
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentRegistrations = users?.filter(user => {
        const regDate = new Date(user.registration_date)
        return regDate >= sevenDaysAgo
      }).length || 0

      // Usuários cadastrados hoje
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0] // Formato YYYY-MM-DD
      
      const todayRegistrations = users?.filter(user => {
        return user.registration_date === todayStr
      }).length || 0

      // Taxa de engajamento (usuários ativos / total)
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
