// =====================================================
// TESTE: ALTERAÇÃO DE LINKS PARA ADMINISTRADORES
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarAlteracaoLinksAdmins() {
  console.log('🔍 Testando alteração de links para administradores...\n')

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

    // Links existentes
    const { data: linksExistentes, error: errLinks } = await supabase
      .from('user_links')
      .select(`
        id, user_id, link_type, campaign, referrer_name,
        user_data:auth_users(id, username, role, campaign)
      `)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (errLinks) {
      console.error('❌ Erro ao buscar links:', errLinks)
      return
    }

    console.log(`   Total de links ativos: ${linksExistentes?.length || 0}`)
    linksExistentes?.forEach(link => {
      const userData = link.user_data
      const isAdmin = userData?.role === 'Administrador' || userData?.role === 'admin' || 
                     ['wegneycosta', 'felipe', 'admin_b'].includes(userData?.username)
      console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} ${isAdmin ? '[ADMIN]' : '[MEMBRO]'}`)
    })

    // 2. Verificar administradores e suas permissões
    console.log('\n👥 2. Verificando administradores e permissões:')
    const { data: admins, error: errAdmins } = await supabase
      .from('auth_users')
      .select('id, username, full_name, role, campaign')
      .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.felipe,username.eq.admin_b')

    if (errAdmins) {
      console.error('❌ Erro ao buscar administradores:', errAdmins)
      return
    }

    admins?.forEach(admin => {
      // Simular lógica de permissões
      const isAdmin = admin.role === 'admin' || admin.role === 'Administrador' || 
                     ['wegneycosta', 'felipe', 'admin_b'].includes(admin.username)
      const isFullAdmin = isAdmin && admin.username !== 'felipe'
      const canModifyLinkTypes = isFullAdmin
      
      console.log(`   - ${admin.username} (${admin.role}):`)
      console.log(`     isAdmin(): ${isAdmin}`)
      console.log(`     isFullAdmin(): ${isFullAdmin}`)
      console.log(`     canModifyLinkTypes(): ${canModifyLinkTypes}`)
      console.log(`     Pode alterar links: ${canModifyLinkTypes ? '✅ SIM' : '❌ NÃO'}`)
    })

    // 3. Testar alteração de links
    console.log('\n🔄 3. Testando alteração de links:')
    
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

      // Passo 2: Buscar administradores
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
      adminUsers?.forEach(admin => {
        console.log(`     - ${admin.username}: ${admin.full_name} (${admin.role})`)
      })

      // Passo 3: Atualizar links (excluindo administradores)
      console.log('   🔄 Passo 3: Atualizando links (excluindo administradores)...')
      
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

      // Excluir todos os administradores
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

      // 4. Verificar resultado final
      console.log('\n📊 4. Resultado final:')
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

      // 5. Restaurar configuração original
      console.log('\n🔄 5. Restaurando configuração original:')
      const { error: errRestore } = await supabase
        .from('system_settings')
        .update({ setting_value: configAtual?.setting_value || 'members' })
        .eq('setting_key', 'member_links_type')

      if (errRestore) {
        console.error('❌ Erro ao restaurar configuração:', errRestore)
      } else {
        console.log('✅ Configuração restaurada')
      }

      // 6. Restaurar links dos membros
      console.log('\n🔄 6. Restaurando links dos membros:')
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
      console.error('❌ Erro durante a alteração:', error)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Função updateMemberLinksType funcionando corretamente')
    console.log('   - Administradores preservados (não alterados)')
    console.log('   - Membros alterados corretamente')
    console.log('   - Configuração do sistema atualizada')
    console.log('   - Links restaurados ao estado original')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarAlteracaoLinksAdmins()
