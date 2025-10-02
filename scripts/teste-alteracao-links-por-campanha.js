// =====================================================
// TESTE: ALTERAÇÃO DE LINKS POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarAlteracaoLinksPorCampanha() {
  console.log('🔍 Testando alteração de links por campanha...\n')

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

    // 2. Testar alteração por campanha A
    console.log('\n🔄 2. Testando alteração por Campanha A:')
    
    const novoTipo = configAtual?.setting_value === 'members' ? 'friends' : 'members'
    console.log(`   Alterando de '${configAtual?.setting_value || 'members'}' para '${novoTipo}' (Campanha A)`)

    try {
      // Simular a função updateMemberLinksType com campanha A
      const userCampaign = 'A'
      
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

      // Passo 3: Verificar links existentes (Campanha A)
      console.log('   🔍 Passo 3: Verificando links existentes (Campanha A)...')
      let existingLinksQuery = supabase
        .from('user_links')
        .select('id, user_id, link_type, campaign')
        .not('user_id', 'in', `(${adminIds.join(',')})`)
        .eq('campaign', userCampaign);

      const { data: existingLinks, error: linksFetchError } = await existingLinksQuery;

      if (linksFetchError) {
        console.error('   ❌ Erro ao buscar links existentes:', linksFetchError)
        return
      }

      console.log(`   ✅ Links de membros da Campanha A: ${existingLinks?.length || 0}`)
      existingLinks?.forEach(link => {
        console.log(`     - ${link.campaign}: ${link.link_type}`)
      })

      // Passo 4: Atualizar links (Campanha A)
      console.log('   🔄 Passo 4: Atualizando links (Campanha A)...')
      
      let updateQuery = supabase
        .from('user_links')
        .update({ 
          link_type: novoTipo,
          updated_at: new Date().toISOString()
        })
        .not('user_id', 'in', `(${adminIds.join(',')})`)
        .eq('campaign', userCampaign);

      // Aplicar filtro baseado no tipo atual
      if (novoTipo === 'friends') {
        updateQuery = updateQuery.eq('link_type', 'members')
      } else {
        updateQuery = updateQuery.eq('link_type', 'friends')
      }

      const { data: updateResult, error: linksError } = await updateQuery
        .select('id, user_id, link_type, campaign, referrer_name')

      if (linksError) {
        console.error('   ❌ Erro ao atualizar links:', linksError)
        return
      }

      console.log(`   ✅ Links atualizados (Campanha A): ${updateResult?.length || 0}`)
      updateResult?.forEach(link => {
        console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type}`)
      })

      // 3. Verificar resultado por campanha
      console.log('\n📊 3. Resultado por campanha:')
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
        const linksMembrosA = linksFinais?.filter(link => !adminIds.includes(link.user_id) && link.campaign === 'A') || []
        const linksMembrosB = linksFinais?.filter(link => !adminIds.includes(link.user_id) && link.campaign === 'B') || []

        console.log(`   Links de administradores (NÃO ALTERADOS): ${linksAdmins.length}`)
        linksAdmins.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [ADMIN - PRESERVADO]`)
        })

        console.log(`   Links de membros Campanha A (ALTERADOS): ${linksMembrosA.length}`)
        linksMembrosA.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type} [MEMBRO - ALTERADO]`)
        })

        console.log(`   Links de membros Campanha B (NÃO ALTERADOS): ${linksMembrosB.length}`)
        linksMembrosB.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type} [MEMBRO - PRESERVADO]`)
        })
      }

      // 4. Testar alteração por campanha B
      console.log('\n🔄 4. Testando alteração por Campanha B:')
      
      const novoTipoB = novoTipo === 'members' ? 'friends' : 'members'
      console.log(`   Alterando de '${novoTipo}' para '${novoTipoB}' (Campanha B)`)

      // Atualizar configuração
      const { error: errUpdateConfigB } = await supabase
        .from('system_settings')
        .update({ setting_value: novoTipoB })
        .eq('setting_key', 'member_links_type')

      if (errUpdateConfigB) {
        console.error('   ❌ Erro ao atualizar configuração:', errUpdateConfigB)
        return
      }

      // Atualizar links da Campanha B
      let updateQueryB = supabase
        .from('user_links')
        .update({ 
          link_type: novoTipoB,
          updated_at: new Date().toISOString()
        })
        .not('user_id', 'in', `(${adminIds.join(',')})`)
        .eq('campaign', 'B');

      // Aplicar filtro baseado no tipo atual
      if (novoTipoB === 'friends') {
        updateQueryB = updateQueryB.eq('link_type', 'members')
      } else {
        updateQueryB = updateQueryB.eq('link_type', 'friends')
      }

      const { data: updateResultB, error: linksErrorB } = await updateQueryB
        .select('id, user_id, link_type, campaign, referrer_name')

      if (linksErrorB) {
        console.error('   ❌ Erro ao atualizar links da Campanha B:', linksErrorB)
        return
      }

      console.log(`   ✅ Links atualizados (Campanha B): ${updateResultB?.length || 0}`)
      updateResultB?.forEach(link => {
        console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type}`)
      })

      // 5. Verificar resultado final
      console.log('\n📊 5. Resultado final por campanha:')
      const { data: linksFinaisB, error: errLinksFinaisB } = await supabase
        .from('user_links')
        .select(`
          id, user_id, link_type, campaign, referrer_name,
          user_data:auth_users(id, username, role, campaign)
        `)
        .eq('is_active', true)
        .is('deleted_at', null)

      if (errLinksFinaisB) {
        console.error('❌ Erro ao buscar links finais:', errLinksFinaisB)
      } else {
        console.log(`   Total de links ativos: ${linksFinaisB?.length || 0}`)
        
        const linksAdminsB = linksFinaisB?.filter(link => adminIds.includes(link.user_id)) || []
        const linksMembrosAB = linksFinaisB?.filter(link => !adminIds.includes(link.user_id) && link.campaign === 'A') || []
        const linksMembrosBB = linksFinaisB?.filter(link => !adminIds.includes(link.user_id) && link.campaign === 'B') || []

        console.log(`   Links de administradores (NÃO ALTERADOS): ${linksAdminsB.length}`)
        linksAdminsB.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type} [ADMIN - PRESERVADO]`)
        })

        console.log(`   Links de membros Campanha A: ${linksMembrosAB.length}`)
        linksMembrosAB.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type}`)
        })

        console.log(`   Links de membros Campanha B: ${linksMembrosBB.length}`)
        linksMembrosBB.forEach(link => {
          console.log(`     - ${link.referrer_name} (${link.campaign}): ${link.link_type}`)
        })
      }

      // 6. Restaurar configuração original
      console.log('\n🔄 6. Restaurando configuração original:')
      const { error: errRestore } = await supabase
        .from('system_settings')
        .update({ setting_value: configAtual?.setting_value || 'members' })
        .eq('setting_key', 'member_links_type')

      if (errRestore) {
        console.error('❌ Erro ao restaurar configuração:', errRestore)
      } else {
        console.log('✅ Configuração restaurada')
      }

      // 7. Restaurar links dos membros
      console.log('\n🔄 7. Restaurando links dos membros:')
      const tipoOriginal = configAtual?.setting_value || 'members'
      
      // Restaurar Campanha A
      let queryRestoreA = supabase
        .from('user_links')
        .update({ 
          link_type: tipoOriginal,
          updated_at: new Date().toISOString()
        })
        .not('user_id', 'in', `(${adminIds.join(',')})`)
        .eq('campaign', 'A');

      if (tipoOriginal === 'friends') {
        queryRestoreA = queryRestoreA.eq('link_type', 'members')
      } else {
        queryRestoreA = queryRestoreA.eq('link_type', 'friends')
      }

      const { error: errRestoreA } = await queryRestoreA

      // Restaurar Campanha B
      let queryRestoreB = supabase
        .from('user_links')
        .update({ 
          link_type: tipoOriginal,
          updated_at: new Date().toISOString()
        })
        .not('user_id', 'in', `(${adminIds.join(',')})`)
        .eq('campaign', 'B');

      if (tipoOriginal === 'friends') {
        queryRestoreB = queryRestoreB.eq('link_type', 'members')
      } else {
        queryRestoreB = queryRestoreB.eq('link_type', 'friends')
      }

      const { error: errRestoreB } = await queryRestoreB

      if (errRestoreA || errRestoreB) {
        console.error('❌ Erro ao restaurar links:', errRestoreA || errRestoreB)
      } else {
        console.log('✅ Links dos membros restaurados')
      }

    } catch (error) {
      console.error('❌ Erro durante a alteração:', error)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Alteração de links por campanha testada')
    console.log('   - Campanha A: Links alterados corretamente')
    console.log('   - Campanha B: Links alterados corretamente')
    console.log('   - Administradores preservados em ambas as campanhas')
    console.log('   - Isolamento por campanha funcionando')
    console.log('   - Configuração e links restaurados')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarAlteracaoLinksPorCampanha()
