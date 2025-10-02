// =====================================================
// TESTE: PERMISSÕES DO FELIPE PARA ALTERAR LINKS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarPermissoesFelipe() {
  console.log('🔍 Testando permissões do Felipe para alterar links...\n')

  try {
    // 1. Verificar usuário Felipe
    console.log('👤 1. Verificando usuário Felipe:')
    const { data: felipe, error: errFelipe } = await supabase
      .from('auth_users')
      .select('id, username, full_name, role, campaign')
      .eq('username', 'felipe')
      .single()

    if (errFelipe) {
      console.error('❌ Erro ao buscar Felipe:', errFelipe)
      return
    }

    if (!felipe) {
      console.error('❌ Usuário Felipe não encontrado')
      return
    }

    console.log('   Felipe encontrado:')
    console.log(`   - ID: ${felipe.id}`)
    console.log(`   - Username: ${felipe.username}`)
    console.log(`   - Full Name: ${felipe.full_name}`)
    console.log(`   - Role: ${felipe.role}`)
    console.log(`   - Campaign: ${felipe.campaign || 'A'}`)

    // 2. Simular lógica de permissões
    console.log('\n🔐 2. Simulando lógica de permissões:')
    
    // isAdmin()
    const isAdmin = felipe.role === 'admin' || felipe.role === 'Administrador' || 
                   felipe.username === 'wegneycosta' || felipe.username === 'felipe'
    console.log(`   isAdmin(): ${isAdmin}`)

    // isFelipeAdmin()
    const isFelipeAdmin = felipe.username === 'felipe'
    console.log(`   isFelipeAdmin(): ${isFelipeAdmin}`)

    // isFullAdmin() - AQUI ESTÁ O PROBLEMA
    const isFullAdmin = isAdmin && felipe.username !== 'felipe'
    console.log(`   isFullAdmin(): ${isFullAdmin} ← PROBLEMA: Felipe é excluído!`)

    // canModifyLinkTypes()
    const canModifyLinkTypes = isFullAdmin
    console.log(`   canModifyLinkTypes(): ${canModifyLinkTypes} ← Felipe NÃO pode alterar links!`)

    // 3. Verificar outros administradores
    console.log('\n👥 3. Verificando outros administradores:')
    const { data: outrosAdmins, error: errOutros } = await supabase
      .from('auth_users')
      .select('id, username, full_name, role, campaign')
      .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.admin_b')

    if (errOutros) {
      console.error('❌ Erro ao buscar outros administradores:', errOutros)
      return
    }

    outrosAdmins?.forEach(admin => {
      const adminIsAdmin = admin.role === 'admin' || admin.role === 'Administrador' || 
                          admin.username === 'wegneycosta' || admin.username === 'felipe'
      const adminIsFullAdmin = adminIsAdmin && admin.username !== 'felipe'
      const adminCanModify = adminIsFullAdmin
      
      console.log(`   - ${admin.username} (${admin.role}):`)
      console.log(`     isAdmin(): ${adminIsAdmin}`)
      console.log(`     isFullAdmin(): ${adminIsFullAdmin}`)
      console.log(`     canModifyLinkTypes(): ${adminCanModify}`)
    })

    // 4. Verificar links do Felipe
    console.log('\n🔗 4. Verificando links do Felipe:')
    const { data: linksFelipe, error: errLinksFelipe } = await supabase
      .from('user_links')
      .select('id, link_id, link_type, campaign, referrer_name, is_active')
      .eq('user_id', felipe.id)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (errLinksFelipe) {
      console.error('❌ Erro ao buscar links do Felipe:', errLinksFelipe)
      return
    }

    console.log(`   Links do Felipe: ${linksFelipe?.length || 0}`)
    linksFelipe?.forEach(link => {
      console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type}`)
    })

    // 5. Testar se Felipe pode alterar links (simulação)
    console.log('\n🧪 5. Teste de alteração de links pelo Felipe:')
    
    if (!canModifyLinkTypes) {
      console.log('   ❌ Felipe NÃO pode alterar tipos de links')
      console.log('   📝 Motivo: isFullAdmin() retorna false porque exclui Felipe')
      console.log('   💡 Solução: Ajustar lógica de permissões para incluir Felipe')
    } else {
      console.log('   ✅ Felipe pode alterar tipos de links')
    }

    // 6. Proposta de correção
    console.log('\n🔧 6. Proposta de correção:')
    console.log('   Opção 1: Permitir que Felipe altere links')
    console.log('     - Modificar isFullAdmin() para incluir Felipe')
    console.log('     - Ou criar função específica para alteração de links')
    
    console.log('\n   Opção 2: Manter restrição atual')
    console.log('     - Felipe não pode alterar tipos de links')
    console.log('     - Apenas outros administradores podem alterar')

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Felipe é administrador mas não é "Full Admin"')
    console.log('   - isFullAdmin() exclui Felipe intencionalmente')
    console.log('   - canModifyLinkTypes() depende de isFullAdmin()')
    console.log('   - Felipe NÃO pode alterar tipos de links atualmente')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarPermissoesFelipe()
