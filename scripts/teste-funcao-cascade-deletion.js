// Script para testar função check_member_cascade_deletion
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarFuncaoCascadeDeletion() {
  console.log('🔍 Testando função check_member_cascade_deletion...\n')

  try {
    // 1. Verificar se a função existe
    console.log('1. Verificando se a função existe...')
    
    const { data: functions, error: functionsError } = await supabase
      .rpc('check_member_cascade_deletion', { member_id: '00000000-0000-0000-0000-000000000000' })

    if (functionsError) {
      console.error('❌ Função check_member_cascade_deletion não encontrada:', functionsError.message)
      console.log('   Execute: docs/CRIAR_FUNCAO_CHECK_MEMBER_CASCADE_DELETION.sql')
      return
    } else {
      console.log('✅ Função check_member_cascade_deletion encontrada')
    }

    // 2. Buscar membros existentes
    console.log('\n2. Buscando membros existentes...')
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, status, deleted_at')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(5)

    if (membersError) {
      console.error('❌ Erro ao buscar membros:', membersError.message)
    } else {
      console.log('✅ Membros encontrados:', members.length)
      members.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} (${member.id})`)
      })
    }

    // 3. Testar função com membros reais
    console.log('\n3. Testando função com membros reais...')
    
    if (members && members.length > 0) {
      for (const member of members) {
        console.log(`\n   Testando com membro: ${member.name}`)
        
        const { data: cascadeData, error: cascadeError } = await supabase
          .rpc('check_member_cascade_deletion', { member_id: member.id })

        if (cascadeError) {
          console.error(`   ❌ Erro ao executar função:`, cascadeError.message)
        } else {
          console.log(`   ✅ Dados de cascata obtidos:`)
          console.log(`      - Member name: ${cascadeData.member_name}`)
          console.log(`      - Current contracts: ${cascadeData.current_contracts}`)
          console.log(`      - Actual friends: ${cascadeData.actual_friends}`)
          console.log(`      - Status mismatch: ${cascadeData.status_mismatch}`)
        }
      }
    }

    // 4. Verificar dados nas tabelas
    console.log('\n4. Verificando dados nas tabelas...')
    
    // Contar members
    const { count: membersCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    console.log('   Total de members:', membersCount)

    // Contar auth_users
    const { count: authUsersCount } = await supabase
      .from('auth_users')
      .select('*', { count: 'exact', head: true })

    console.log('   Total de auth_users:', authUsersCount)

    // Contar user_links
    const { count: userLinksCount } = await supabase
      .from('user_links')
      .select('*', { count: 'exact', head: true })

    console.log('   Total de user_links:', userLinksCount)

    // 5. Verificar relacionamentos
    console.log('\n5. Verificando relacionamentos...')
    
    // Verificar membros com auth_users correspondentes
    const { data: membersWithAuth, error: membersWithAuthError } = await supabase
      .from('members')
      .select(`
        id,
        name,
        auth_users!inner(id, name, role)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(3)

    if (membersWithAuthError) {
      console.log('   ⚠️ Erro ao verificar relacionamentos:', membersWithAuthError.message)
    } else {
      console.log('   Membros com auth_users correspondentes:', membersWithAuth.length)
      membersWithAuth.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} -> ${member.auth_users.name} (${member.auth_users.role})`)
      })
    }

    // 6. Testar com UUID inválido
    console.log('\n6. Testando com UUID inválido...')
    
    const { data: invalidData, error: invalidError } = await supabase
      .rpc('check_member_cascade_deletion', { member_id: '00000000-0000-0000-0000-000000000000' })

    if (invalidError) {
      console.error('   ❌ Erro com UUID inválido:', invalidError.message)
    } else {
      console.log('   ✅ Função executada com UUID inválido:')
      console.log(`      - Member name: ${invalidData.member_name || 'null'}`)
      console.log(`      - Current contracts: ${invalidData.current_contracts || 'null'}`)
      console.log(`      - Actual friends: ${invalidData.actual_friends || 'null'}`)
      console.log(`      - Status mismatch: ${invalidData.status_mismatch || 'null'}`)
    }

    // 7. Verificar membros deletados
    console.log('\n7. Verificando membros deletados...')
    
    const { data: deletedMembers, error: deletedError } = await supabase
      .from('members')
      .select('id, name, deleted_at')
      .not('deleted_at', 'is', null)
      .limit(3)

    if (deletedError) {
      console.log('   ⚠️ Erro ao buscar membros deletados:', deletedError.message)
    } else {
      console.log('   Membros deletados encontrados:', deletedMembers.length)
      deletedMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} (deletado em: ${member.deleted_at})`)
      })
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Execute: docs/CRIAR_FUNCAO_CHECK_MEMBER_CASCADE_DELETION.sql')
    console.log('2. Teste a função no frontend')
    console.log('3. Integre com o sistema de exclusão')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarFuncaoCascadeDeletion()
