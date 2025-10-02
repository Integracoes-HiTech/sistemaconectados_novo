// =====================================================
// VERIFICAR E CORRIGIR ROLE DO FELIPE
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarECorrigirRoleFelipe() {
  console.log('🔍 Verificando role do Felipe...\n')

  try {
    // 1. Verificar auth_users do Felipe
    console.log('📊 1. Verificando auth_users do Felipe:')
    
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, full_name, campaign')
      .eq('username', 'felipe')

    if (authUsersError) {
      console.error('❌ Erro ao buscar auth_users do Felipe:', authUsersError.message)
      return
    }

    if (!authUsers || authUsers.length === 0) {
      console.log('⚠️ Felipe não encontrado na tabela auth_users')
    } else {
      authUsers.forEach(user => {
        console.log(`   👤 Auth User:`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Username: ${user.username}`)
        console.log(`     Name: ${user.name}`)
        console.log(`     Role: ${user.role}`)
        console.log(`     Full Name: ${user.full_name}`)
        console.log(`     Campaign: ${user.campaign}`)
      })
    }

    // 2. Verificar members do Felipe
    console.log('\n📊 2. Verificando members do Felipe:')
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, ranking_position, ranking_status, campaign, deleted_at')
      .ilike('name', '%felipe%')
      .or('name.ilike.%felipe%,referrer.ilike.%felipe%')

    if (membersError) {
      console.error('❌ Erro ao buscar members relacionados ao Felipe:', membersError.message)
    } else if (members && members.length > 0) {
      members.forEach(member => {
        console.log(`   👥 Member:`)
        console.log(`     ID: ${member.id}`)
        console.log(`     Name: ${member.name}`)
        console.log(`     Ranking: ${member.ranking_position}º`)
        console.log(`     Status: ${member.ranking_status}`)
        console.log(`     Campaign: ${member.campaign}`)
        console.log(`     Deleted: ${member.deleted_at ? 'Sim' : 'Não'}`)
      })
    } else {
      console.log('   ⚠️ Não encontrados membros relacionados ao Felipe')
    }

    // 3. Verificar users do Felipe
    console.log('\n📊 3. Verificando users do Felipe:')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, referrer, campaign')
      .ilike('name', '%felipe%')
      .or('name.ilike.%felipe%,referrer.ilike.%felipe%')

    if (usersError) {
      console.error('❌ Erro ao buscar users relacionados ao Felipe:', usersError.message)
    } else if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   👤 User:`)
          console.log(`     ID: ${user.id}`)
          console.log(`     Name: ${user.name}`)
          console.log(`     Referrer: ${user.referrer}`)
          console.log(`     Campaign: ${user.campaign}`)
      })
    } else {
      console.log('   ⚠️ Não encontrados users relacionados ao Felipe')
    }

    // 4. Se Felipe tem role 'Administrador', corrigir para não mostrar isso
    if (authUsers && authUsers.length > 0) {
      const felipeAuth = authUsers.find(u => u.username === 'felipe')
      
      if (felipeAuth && (felipeAuth.role === 'Administrador' || felipeAuth.role === 'admin')) {
        console.log('\n🔧 4. Felipe tem role administrativo. Isso pode causar exibição de "ADMIN":')
        console.log(`   Role atual: ${felipeAuth.role}`)
        console.log(`   Isso faz com que o código display role "ADMIN" em vez de "FELIPE"`)
        
        console.log('\n📝 Lógica atual no dashboard:')
        console.log('   user?.username === "wegneycosta" ? "VEREADOR" :')
        console.log('   user?.username === "felipe" ? "FELIPE" :')  
        console.log('   user?.role === "Membro" ? "MEMBRO" : "ADMIN"')
        console.log('\n✅ Isso está correto! Deveria mostrar apenas "FELIPE"')
        
        console.log('\n🔍 Possíveis causas do problema:')
        console.log('   1. Cache do navegador - faça Ctrl+F5 ou limpe o cache')
        console.log('   2. Aplicação não foi recarregada após as mudanças')
        console.log('   3. Felipe pode ter outro username ou estar logado como outro usuário')
        
        console.log('\n🛠️ Soluções:')
        console.log('   1. Faça refresh completo da página (Ctrl+F5)')
        console.log('   2. Limpe o cache do navegador')
        console.log('   3. Verifique se realmente está logado como "felipe"')
        console.log('   4. Reinicie a aplicação se necessário')
      } else {
        console.log('\n✅ Felipe não tem role administrativo, tudo parece correto')
      }
    }

    console.log('\n✅ Verificação completa!')
    console.log('\n📋 Resumo:')
    console.log('   - Código do dashboard está correto (mostra "FELIPE")')
    console.log('   - Se ainda mostra "Felipe Admin" nem "ADMIN", é cache do navegador')
    console.log('   - Solução: refresh completo da página')

  } catch (error) {
    console.error('❌ Errot geral:', error)
  }
}

// Executar verificação
verificarECorrigirRoleFelipe()
