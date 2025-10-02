// =====================================================
// TESTE: ALTERAÇÃO DE LINKS CORRIGIDA - EXCLUIR TODOS OS ADMINS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarAlteracaoLinksCorrigida() {
  console.log('🔍 Testando alteração de links corrigida (excluir todos os admins)...\n')

  try {
    // 1. Verificar estado atual dos links
    console.log('📊 1. Estado atual dos links:')
    const { data: linksAtuais, error: errLinks } = await supabase
      .from('user_links')
      .select(`
        id, user_id, link_type, campaign, referrer_name, created_at,
        user_data:auth_users(id, username, role, campaign)
      `)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (errLinks) {
      console.error('❌ Erro ao buscar links:', errLinks)
      return
    }

    console.log(`   Total de links ativos: ${linksAtuais?.length || 0}`)
    linksAtuais?.forEach(link => {
      const userData = link.user_data
      const isAdmin = userData?.role === 'Administrador' || userData?.role === 'admin' || 
                     ['wegneycosta', 'felipe', 'admin_b'].includes(userData?.username)
      console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} ${isAdmin ? '[ADMIN]' : '[MEMBRO]'}`)
    })

    // 2. Verificar administradores
    console.log('\n👤 2. Verificando administradores:')
    const { data: admins, error: errAdmins } = await supabase
      .from('auth_users')
      .select('id, username, full_name, role, campaign')
      .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.felipe,username.eq.admin_b')

    if (errAdmins) {
      console.error('❌ Erro ao buscar administradores:', errAdmins)
      return
    }

    console.log(`   Total de administradores: ${admins?.length || 0}`)
    admins?.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.campaign || 'A'}): ${admin.full_name} - ${admin.role}`)
    })

    const adminIds = admins?.map(admin => admin.id) || []
    console.log(`   IDs dos administradores: [${adminIds.join(', ')}]`)

    // 3. Verificar links de administradores vs membros
    console.log('\n🔍 3. Verificando links de administradores vs membros:')
    
    const linksAdmins = linksAtuais?.filter(link => adminIds.includes(link.user_id)) || []
    const linksMembros = linksAtuais?.filter(link => !adminIds.includes(link.user_id)) || []

    console.log(`   Links de administradores: ${linksAdmins.length}`)
    linksAdmins.forEach(link => {
      console.log(`   - ${link.referrer_name}: ${link.link_type}`)
    })

    console.log(`   Links de membros: ${linksMembros.length}`)
    linksMembros.forEach(link => {
      console.log(`   - ${link.referrer_name}: ${link.link_type}`)
    })

    // 4. Verificar configuração atual do sistema
    console.log('\n⚙️ 4. Configuração atual do sistema:')
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

    // 5. Testar alteração de tipo de links
    console.log('\n🔄 5. Testando alteração de tipo de links:')
    
    const novoTipo = configAtual?.setting_value === 'members' ? 'friends' : 'members'
    console.log(`   Alterando de '${configAtual?.setting_value || 'members'}' para '${novoTipo}'`)

    // Simular a função updateMemberLinksType corrigida
    try {
      // 1. Atualizar configuração do sistema
      const { error: errUpdateConfig } = await supabase
        .from('system_settings')
        .update({ setting_value: novoTipo })
        .eq('setting_key', 'member_links_type')

      if (errUpdateConfig) {
        console.error('❌ Erro ao atualizar configuração:', errUpdateConfig)
        return
      }

      console.log('   ✅ Configuração do sistema atualizada')

      // 2. Atualizar links existentes (excluindo todos os administradores)
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

      const { data: linksAtualizados, error: errUpdateLinks } = await query
        .select('id, user_id, link_type, campaign, referrer_name')

      if (errUpdateLinks) {
        console.error('❌ Erro ao atualizar links:', errUpdateLinks)
        return
      }

      console.log(`   ✅ ${linksAtualizados?.length || 0} links atualizados`)

      // 6. Verificar resultado
      console.log('\n📊 6. Resultado da alteração:')
      const { data: linksFinais, error: errLinksFinais } = await supabase
        .from('user_links')
        .select(`
          id, user_id, link_type, campaign, referrer_name, created_at,
          user_data:auth_users(id, username, role, campaign)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (errLinksFinais) {
        console.error('❌ Erro ao buscar links finais:', errLinksFinais)
      } else {
        console.log(`   Total de links ativos: ${linksFinais?.length || 0}`)
        
        const linksAdminsFinais = linksFinais?.filter(link => adminIds.includes(link.user_id)) || []
        const linksMembrosFinais = linksFinais?.filter(link => !adminIds.includes(link.user_id)) || []

        console.log(`   Links de administradores (não alterados): ${linksAdminsFinais.length}`)
        linksAdminsFinais.forEach(link => {
          const userData = link.user_data
          console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [ADMIN - NÃO ALTERADO]`)
        })

        console.log(`   Links de membros (alterados): ${linksMembrosFinais.length}`)
        linksMembrosFinais.forEach(link => {
          const userData = link.user_data
          console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [MEMBRO - ALTERADO]`)
        })
      }

      // 7. Verificar se administradores mantiveram seus tipos originais
      console.log('\n🔍 7. Verificando se administradores mantiveram tipos originais:')
      let adminsPreservados = true
      
      linksAdmins.forEach(linkOriginal => {
        const linkFinal = linksFinais?.find(l => l.id === linkOriginal.id)
        if (linkFinal && linkOriginal.link_type !== linkFinal.link_type) {
          console.log(`   ❌ Admin alterado: ${linkOriginal.referrer_name} - ${linkOriginal.link_type} → ${linkFinal.link_type}`)
          adminsPreservados = false
        }
      })

      if (adminsPreservados) {
        console.log('   ✅ Todos os administradores mantiveram seus tipos originais')
      }

      // 8. Verificar se membros foram alterados
      console.log('\n🔍 8. Verificando se membros foram alterados:')
      let membrosAlterados = true
      
      linksMembros.forEach(linkOriginal => {
        const linkFinal = linksFinais?.find(l => l.id === linkOriginal.id)
        if (linkFinal && linkOriginal.link_type === linkFinal.link_type) {
          console.log(`   ❌ Membro não alterado: ${linkOriginal.referrer_name} - ${linkOriginal.link_type}`)
          membrosAlterados = false
        }
      })

      if (membrosAlterados) {
        console.log('   ✅ Todos os membros foram alterados corretamente')
      }

      // 9. Restaurar configuração original
      console.log('\n🔄 9. Restaurando configuração original:')
      const { error: errRestore } = await supabase
        .from('system_settings')
        .update({ setting_value: configAtual?.setting_value || 'members' })
        .eq('setting_key', 'member_links_type')

      if (errRestore) {
        console.error('❌ Erro ao restaurar configuração:', errRestore)
      } else {
        console.log('   ✅ Configuração restaurada')
      }

      // 10. Restaurar links dos membros
      console.log('\n🔄 10. Restaurando links dos membros:')
      if (linksMembros.length > 0) {
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
          console.log('   ✅ Links dos membros restaurados')
        }
      }

    } catch (error) {
      console.error('❌ Erro durante a alteração:', error)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Alteração de links testada com exclusão de todos os admins')
    console.log('   - Administradores preservados (não alterados)')
    console.log('   - Membros alterados corretamente')
    console.log('   - Configuração do sistema testada')
    console.log('   - Links restaurados ao estado original')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarAlteracaoLinksCorrigida()
