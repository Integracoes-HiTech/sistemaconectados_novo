// Script para testar funções de contadores
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarFuncoesContadores() {
  console.log('🔍 Testando funções de contadores...\n')

  try {
    // 1. Testar função check_counters_inconsistency
    console.log('1. Testando função check_counters_inconsistency...')
    
    const { data: inconsistencies, error: checkError } = await supabase
      .rpc('check_counters_inconsistency')

    if (checkError) {
      console.error('❌ Erro ao verificar inconsistências:', checkError.message)
      console.log('   Execute: docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY.sql')
    } else {
      console.log('✅ Função check_counters_inconsistency executada com sucesso')
      console.log('   Total de membros verificados:', inconsistencies.length)
      
      const inconsistentMembers = inconsistencies.filter(inc => inc.status_mismatch)
      console.log('   Total de inconsistências:', inconsistentMembers.length)
      
      if (inconsistentMembers.length > 0) {
        console.log('\n   Inconsistências encontradas:')
        inconsistentMembers.forEach((inc, index) => {
          console.log(`   ${index + 1}. ${inc.member_name}`)
          console.log(`      Contratos completados: ${inc.contracts_completed}`)
          console.log(`      Amigos reais: ${inc.friends_count}`)
          console.log(`      Status: ${inc.status_mismatch ? 'Inconsistente' : 'Consistente'}`)
        })
      } else {
        console.log('   ✅ Nenhuma inconsistência encontrada')
      }
    }

    // 2. Testar função fix_counters_inconsistency
    console.log('\n2. Testando função fix_counters_inconsistency...')
    
    const { data: fixes, error: fixError } = await supabase
      .rpc('fix_counters_inconsistency')

    if (fixError) {
      console.error('❌ Erro ao corrigir inconsistências:', fixError.message)
      console.log('   Execute: docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY.sql')
    } else {
      console.log('✅ Função fix_counters_inconsistency executada com sucesso')
      console.log('   Total de correções:', fixes.length)
      
      if (fixes.length > 0) {
        console.log('\n   Correções aplicadas:')
        fixes.forEach((fix, index) => {
          console.log(`   ${index + 1}. ${fix.member_name}`)
          console.log(`      Antes: ${fix.old_contracts_completed} contratos`)
          console.log(`      Depois: ${fix.new_contracts_completed} contratos`)
          console.log(`      Ação: ${fix.action_taken}`)
        })
      } else {
        console.log('   ✅ Nenhuma correção necessária')
      }
    }

    // 3. Verificar dados atuais
    console.log('\n3. Verificando dados atuais...')
    
    // Contar user_links
    const { count: linksCount } = await supabase
      .from('user_links')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null)

    console.log('   Total de links ativos:', linksCount)

    // Contar members
    const { count: membersCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log('   Total de membros ativos:', membersCount)

    // Contar friends
    const { count: friendsCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log('   Total de amigos ativos:', friendsCount)

    // 4. Verificar contadores específicos
    console.log('\n4. Verificando contadores específicos...')
    
    // Verificar click_count em user_links
    const { data: linksData } = await supabase
      .from('user_links')
      .select('link_id, click_count, registration_count')
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(5)

    if (linksData && linksData.length > 0) {
      console.log('   Exemplos de user_links:')
      linksData.forEach(link => {
        console.log(`   - ${link.link_id}: ${link.click_count} cliques, ${link.registration_count} registros`)
      })
    }

    // Verificar contracts_completed em members
    const { data: membersData } = await supabase
      .from('members')
      .select('name, contracts_completed, ranking_position, ranking_status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(5)

    if (membersData && membersData.length > 0) {
      console.log('   Exemplos de members:')
      membersData.forEach(member => {
        console.log(`   - ${member.name}: ${member.contracts_completed} contratos, posição ${member.ranking_position}, status ${member.ranking_status}`)
      })
    }

    // 5. Verificar se as funções existem
    console.log('\n5. Verificando se as funções existem...')
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('check_counters_inconsistency')

    if (functionsError) {
      console.log('❌ Função check_counters_inconsistency não encontrada')
      console.log('   Execute: docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY.sql')
    } else {
      console.log('✅ Função check_counters_inconsistency encontrada')
    }

    const { data: fixFunctions, error: fixFunctionsError } = await supabase
      .rpc('fix_counters_inconsistency')

    if (fixFunctionsError) {
      console.log('❌ Função fix_counters_inconsistency não encontrada')
      console.log('   Execute: docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY.sql')
    } else {
      console.log('✅ Função fix_counters_inconsistency encontrada')
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Execute: docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY.sql')
    console.log('2. Execute: docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY.sql')
    console.log('3. Teste as funções no frontend')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarFuncoesContadores()
