// Script para testar função get_user_stats
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarFuncaoUserStats() {
  console.log('🔍 Testando função get_user_stats...\n')

  try {
    // 1. Verificar se a função existe
    console.log('1. Verificando se a função existe...')
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('get_user_stats', { user_id_param: '00000000-0000-0000-0000-000000000000' })

    if (functionsError) {
      console.error('❌ Função get_user_stats não encontrada:', functionsError.message)
      console.log('   Execute: docs/CRIAR_FUNCAO_GET_USER_STATS.sql')
      return
    } else {
      console.log('✅ Função get_user_stats encontrada')
    }

    // 2. Buscar usuários existentes
    console.log('\n2. Buscando usuários existentes...')
    
    const { data: users, error: usersError } = await supabase
      .from('auth_users')
      .select('id, username, name, full_name, is_active')
      .eq('is_active', true)
      .limit(5)

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message)
    } else {
      console.log('✅ Usuários encontrados:', users.length)
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} - ${user.name} (${user.full_name})`)
      })
    }

    // 3. Testar função com usuários reais
    console.log('\n3. Testando função com usuários reais...')
    
    if (users && users.length > 0) {
      for (const user of users) {
        console.log(`\n   Testando com usuário: ${user.username}`)
        
        const { data: stats, error: statsError } = await supabase
          .rpc('get_user_stats', { user_id_param: user.id })

        if (statsError) {
          console.error(`   ❌ Erro ao executar função:`, statsError.message)
        } else {
          console.log(`   ✅ Estatísticas obtidas:`)
          console.log(`      - Total users: ${stats.total_users}`)
          console.log(`      - Active users: ${stats.active_users}`)
          console.log(`      - Recent registrations: ${stats.recent_registrations}`)
          console.log(`      - Engagement rate: ${stats.engagement_rate}%`)
        }
      }
    }

    // 4. Verificar dados nas tabelas
    console.log('\n4. Verificando dados nas tabelas...')
    
    // Contar auth_users
    const { count: authUsersCount } = await supabase
      .from('auth_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log('   Total de auth_users ativos:', authUsersCount)

    // Contar users
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    console.log('   Total de users:', usersCount)

    // Contar users ativos
    const { count: activeUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')

    console.log('   Total de users ativos:', activeUsersCount)

    // 5. Verificar registros recentes
    console.log('\n5. Verificando registros recentes...')
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const { count: recentUsersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('registration_date', sevenDaysAgoStr)

    console.log(`   Registros dos últimos 7 dias: ${recentUsersCount}`)

    // 6. Testar com UUID inválido
    console.log('\n6. Testando com UUID inválido...')
    
    const { data: invalidStats, error: invalidError } = await supabase
      .rpc('get_user_stats', { user_id_param: '00000000-0000-0000-0000-000000000000' })

    if (invalidError) {
      console.error('   ❌ Erro com UUID inválido:', invalidError.message)
    } else {
      console.log('   ✅ Função executada com UUID inválido (retornou zeros):')
      console.log(`      - Total users: ${invalidStats.total_users}`)
      console.log(`      - Active users: ${invalidStats.active_users}`)
      console.log(`      - Recent registrations: ${invalidStats.recent_registrations}`)
      console.log(`      - Engagement rate: ${invalidStats.engagement_rate}%`)
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Execute: docs/CRIAR_FUNCAO_GET_USER_STATS.sql')
    console.log('2. Teste a função no frontend')
    console.log('3. Integre com o dashboard')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarFuncaoUserStats()
