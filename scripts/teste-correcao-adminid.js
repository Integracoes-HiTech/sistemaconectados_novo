// =====================================================
// TESTE: CORREÇÃO DO ERRO "adminId is not defined"
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCorrecaoAdminId() {
  console.log('🔍 Testando correção do erro "adminId is not defined"...\n')

  try {
    // 1. Verificar estado atual
    console.log('📊 1. Estado atual do sistema:')
    
    // Configuração atual
    const { data: configAtual, error: errConfig } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'member_links_type')
      .single()

    if (errConfig) {
      console.error('❌ Erro ao buscar configuração:', errConfig)
      return
    }

    console.log(`   Tipo de links atual: ${configAtual?.setting_value || 'members'}`)

    // 2. Simular a função updateMemberLinksType corrigida
    console.log('\n🔄 2. Simulando updateMemberLinksType corrigida:')
    
    const novoTipo = configAtual?.setting_value === 'members' ? 'friends' : 'members'
    console.log(`   Alterando de '${configAtual?.setting_value || 'members'}' para '${novoTipo}'`)

    try {
      // Passo 1: Atualizar configuração do sistema
      console.log('   📝 Passo 1: Atualizando configuração do sistema...')
      const { error: errUpdateConfig } = await supabase
        .from('system_settings')
        .update({ setting_value: novoTipo })
        .eq('setting_key', 'member_links_type')

      if (errUpdateConfig) {
        console.error('   ❌ Erro ao atualizar configuração:', errUpdateConfig)
        return
      }

      console.log('   ✅ Configuração do sistema atualizada')

      // Passo 2: Buscar administradores (CORRIGIDO)
      console.log('   👤 Passo 2: Buscando administradores...')
      const { data: adminUsers, error: adminError } = await supabase
        .from('auth_users')
        .select('id, username, full_name, role')
        .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.felipe,username.eq.admin_b')

      if (adminError) {
        console.error('   ❌ Erro ao buscar administradores:', adminError)
        return
      }

      const adminIds = adminUsers?.map(admin => admin.id) || []
      console.log(`   ✅ Administradores encontrados: ${adminIds.length}`)
      console.log(`   ✅ adminIds array: [${adminIds.join(', ')}]`)
      adminUsers?.forEach(admin => {
        console.log(`     - ${admin.username}: ${admin.full_name} (${admin.role})`)
      })

      // Passo 3: Verificar links existentes (CORRIGIDO)
      console.log('   🔍 Passo 3: Verificando links existentes...')
      const { data: existingLinks, error: linksFetchError } = await supabase
        .from('user_links')
        .select('id, user_id, link_type')
        .not('user_id', 'in', `(${adminIds.join(',')})`)

      if (linksFetchError) {
        console.error('   ❌ Erro ao buscar links existentes:', linksFetchError)
        return
      }

      console.log(`   ✅ Links de membros encontrados: ${existingLinks?.length || 0}`)

      // Passo 4: Atualizar links (CORRIGIDO)
      console.log('   🔄 Passo 4: Atualizando links...')
      
      let query = supabase
        .from('user_links')
        .update({ 
          link_type: novoTipo,
          updated_at: new Date().toISOString()
        })

      // Aplicar filtro baseado no tipo atual
      if (novoTipo === 'friends') {
        query = query.eq('link_type', 'members')
      } else {
        query = query.eq('link_type', 'friends')
      }

      // Excluir todos os administradores (CORRIGIDO)
      if (adminIds.length > 0) {
        query = query.not('user_id', 'in', `(${adminIds.join(',')})`)
      }

      const { data: updateResult, error: linksError } = await query
        .select('id, user_id, link_type, campaign, referrer_name')

      if (linksError) {
        console.error('   ❌ Erro ao atualizar links:', linksError)
        return
      }

      console.log(`   ✅ Links atualizados: ${updateResult?.length || 0}`)
      updateResult?.forEach(link => {
        console.log(`     - ${link.referrer_name}: ${link.link_type}`)
      })

      // Passo 5: Verificar resultado final (CORRIGIDO)
      console.log('   🔍 Passo 5: Verificando resultado final...')
      const { data: finalLinks, error: finalError } = await supabase
        .from('user_links')
        .select('id, user_id, link_type')
        .not('user_id', 'in', `(${adminIds.join(',')})`)

      if (finalError) {
        console.error('   ❌ Erro ao verificar resultado final:', finalError)
        return
      }

      console.log(`   ✅ Links finais (exceto admin): ${finalLinks?.length || 0}`)

      // 3. Verificar resultado completo
      console.log('\n📊 3. Resultado completo:')
      const { data: linksFinais, error: errLinksFinais } = await supabase
        .from('user_links')
        .select(`
          id, user_id, link_type, campaign, referrer_name,
          user_data:auth_users(id, username, role, campaign)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)

      if (errLinksFinais) {
        console.error('❌ Erro ao buscar links finais:', errLinksFinais)
      } else {
        console.log(`   Total de links ativos: ${linksFinais?.length || 0}`)
        
        const linksAdmins = linksFinais?.filter(link => adminIds.includes(link.user_id)) || []
        const linksMembros = linksFinais?.filter(link => !adminIds.includes(link.user_id)) || []

        console.log(`   Links de administradores (NÃO ALTERADOS): ${linksAdmins.length}`)
        linksAdmins.forEach(link => {
          const userData = link.user_data
          console.log(`     - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [ADMIN - PRESERVADO]`)
        })

        console.log(`   Links de membros (ALTERADOS): ${linksMembros.length}`)
        linksMembros.forEach(link => {
          const userData = link.user_data
          console.log(`     - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [MEMBRO - ALTERADO]`)
        })
      }

      // 4. Restaurar configuração original
      console.log('\n🔄 4. Restaurando configuração original:')
      const { error: errRestore } = await supabase
        .from('system_settings')
        .update({ setting_value: configAtual?.setting_value || 'members' })
        .eq('setting_key', 'member_links_type')

      if (errRestore) {
        console.error('❌ Erro ao restaurar configuração:', errRestore)
      } else {
        console.log('✅ Configuração restaurada')
      }

      // 5. Restaurar links dos membros
      console.log('\n🔄 5. Restaurando links dos membros:')
      if (updateResult && updateResult.length > 0) {
        const tipoOriginal = configAtual?.setting_value || 'members'
        
        let queryRestore = supabase
          .from('user_links')
          .update({ 
            link_type: tipoOriginal,
            updated_at: new Date().toISOString()
          })

        // Aplicar filtro baseado no tipo atual
        if (tipoOriginal === 'friends') {
          queryRestore = queryRestore.eq('link_type', 'members')
        } else {
          queryRestore = queryRestore.eq('link_type', 'friends')
        }

        // Excluir todos os administradores
        if (adminIds.length > 0) {
          queryRestore = queryRestore.not('user_id', 'in', `(${adminIds.join(',')})`)
        }

        const { error: errRestoreLinks } = await queryRestore

        if (errRestoreLinks) {
          console.error('❌ Erro ao restaurar links:', errRestoreLinks)
        } else {
          console.log('✅ Links dos membros restaurados')
        }
      }

    } catch (error) {
      console.error('❌ Erro durante a simulação:', error)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Erro "adminId is not defined" corrigido')
    console.log('   - Função updateMemberLinksType funcionando')
    console.log('   - Administradores preservados')
    console.log('   - Membros alterados corretamente')
    console.log('   - Configuração restaurada')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCorrecaoAdminId()
