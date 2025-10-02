// Script para testar exportação de relatórios
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarExportacaoRelatorios() {
  console.log('🔍 Testando exportação de relatórios...\n')

  try {
    // 1. Verificar dados de membros
    console.log('1. Verificando dados de membros...')
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (membersError) {
      console.error('❌ Erro ao buscar membros:', membersError.message)
    } else {
      console.log('✅ Total de membros ativos:', members.length)
    }

    // 2. Verificar dados de amigos
    console.log('\n2. Verificando dados de amigos...')
    
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (friendsError) {
      console.error('❌ Erro ao buscar amigos:', friendsError.message)
    } else {
      console.log('✅ Total de amigos ativos:', friends.length)
    }

    // 3. Simular dados de relatório
    console.log('\n3. Simulando dados de relatório...')
    
    const reportData = {
      usersByLocation: {},
      usersByCity: {},
      sectorsGroupedByCity: {},
      registrationsByDay: [],
      usersByStatus: [],
      recentActivity: []
    }

    // Calcular dados baseados nos membros
    if (members && members.length > 0) {
      // usersByLocation
      members.forEach(member => {
        const location = `${member.city} - ${member.sector}`
        reportData.usersByLocation[location] = (reportData.usersByLocation[location] || 0) + 1
      })

      // usersByCity
      members.forEach(member => {
        reportData.usersByCity[member.city] = (reportData.usersByCity[member.city] || 0) + 1
      })

      // sectorsGroupedByCity
      members.forEach(member => {
        if (!reportData.sectorsGroupedByCity[member.city]) {
          reportData.sectorsGroupedByCity[member.city] = {
            sectors: [],
            count: 0,
            totalSectors: 0
          }
        }
        if (!reportData.sectorsGroupedByCity[member.city].sectors.includes(member.sector)) {
          reportData.sectorsGroupedByCity[member.city].sectors.push(member.sector)
          reportData.sectorsGroupedByCity[member.city].totalSectors++
        }
        reportData.sectorsGroupedByCity[member.city].count++
      })

      // registrationsByDay
      const registrationsByDate = {}
      members.forEach(member => {
        const date = member.registration_date
        registrationsByDate[date] = (registrationsByDate[date] || 0) + 1
      })
      reportData.registrationsByDay = Object.entries(registrationsByDate).map(([date, quantidade]) => ({
        date,
        quantidade
      }))

      // usersByStatus
      const statusCount = {}
      members.forEach(member => {
        statusCount[member.status] = (statusCount[member.status] || 0) + 1
      })
      reportData.usersByStatus = Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
        color: name === 'Ativo' ? '#10B981' : '#EF4444'
      }))

      // recentActivity
      reportData.recentActivity = members
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(member => ({
          id: member.id,
          name: member.name,
          action: 'Cadastrado',
          date: new Date(member.created_at).toLocaleDateString('pt-BR')
        }))
    }

    // 4. Verificar se há dados para exportar
    console.log('\n4. Verificando dados para exportação...')
    
    const hasReportData = (
      Object.keys(reportData.usersByLocation).length > 0 ||
      Object.keys(reportData.usersByCity).length > 0 ||
      Object.keys(reportData.sectorsGroupedByCity).length > 0 ||
      reportData.registrationsByDay.length > 0 ||
      reportData.usersByStatus.length > 0 ||
      reportData.recentActivity.length > 0
    )

    console.log('✅ Dados de relatório disponíveis:', hasReportData)
    console.log('   - usersByLocation:', Object.keys(reportData.usersByLocation).length, 'itens')
    console.log('   - usersByCity:', Object.keys(reportData.usersByCity).length, 'itens')
    console.log('   - sectorsGroupedByCity:', Object.keys(reportData.sectorsGroupedByCity).length, 'itens')
    console.log('   - registrationsByDay:', reportData.registrationsByDay.length, 'itens')
    console.log('   - usersByStatus:', reportData.usersByStatus.length, 'itens')
    console.log('   - recentActivity:', reportData.recentActivity.length, 'itens')

    // 5. Simular memberStats
    console.log('\n5. Simulando memberStats...')
    
    const memberStats = {
      total_members: members ? members.length : 0,
      current_member_count: members ? members.length : 0,
      green_members: members ? members.filter(m => m.ranking_status === 'Verde').length : 0,
      yellow_members: members ? members.filter(m => m.ranking_status === 'Amarelo').length : 0,
      red_members: members ? members.filter(m => m.ranking_status === 'Vermelho').length : 0,
      top_1500_members: members ? members.filter(m => m.is_top_1500).length : 0,
      max_member_limit: 1500,
      can_register_more: members ? members.length < 1500 : true
    }

    console.log('✅ MemberStats:', memberStats)

    // 6. Testar condições de exportação
    console.log('\n6. Testando condições de exportação...')
    
    // Condição 1: Dados não carregados
    if (!memberStats || !reportData) {
      console.log('❌ Dados não carregados - Exportação bloqueada')
    } else {
      console.log('✅ Dados carregados')
    }

    // Condição 2: Dados nos relatórios
    if (!hasReportData) {
      console.log('❌ Nenhum dado nos relatórios - Exportação bloqueada')
    } else {
      console.log('✅ Dados nos relatórios disponíveis')
    }

    // Condição 3: Membros cadastrados
    if (memberStats.total_members === 0 && memberStats.current_member_count === 0) {
      console.log('❌ Nenhum membro cadastrado - Exportação bloqueada')
    } else {
      console.log('✅ Membros cadastrados disponíveis')
    }

    // 7. Resultado final
    console.log('\n7. Resultado final...')
    
    const canExport = (
      memberStats && 
      reportData && 
      hasReportData && 
      (memberStats.total_members > 0 || memberStats.current_member_count > 0)
    )

    if (canExport) {
      console.log('✅ Exportação permitida - Há dados suficientes')
    } else {
      console.log('❌ Exportação bloqueada - Dados insuficientes')
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Resumo:')
    console.log(`- Membros: ${members ? members.length : 0}`)
    console.log(`- Amigos: ${friends ? friends.length : 0}`)
    console.log(`- Dados de relatório: ${hasReportData ? 'Sim' : 'Não'}`)
    console.log(`- Exportação: ${canExport ? 'Permitida' : 'Bloqueada'}`)

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarExportacaoRelatorios()
