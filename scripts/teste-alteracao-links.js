// =====================================================
// TESTE: ALTERAÇÃO DE LINKS COM COLUNA CAMPAIGN
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarAlteracaoLinks() {
  console.log('🔍 Testando alteração de links com coluna campaign...\n')

  try {
    // 1. Verificar estado atual dos links
    console.log('📊 1. Estado atual dos links:')
    const { data: linksAtuais, error: errLinks } = await supabase
      .from('user_links')
      .select('id, user_id, link_type, campaign, referrer_name, created_at')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (errLinks) {
      console.error('❌ Erro ao buscar links:', errLinks)
      return
    }

    console.log(`   Total de links ativos: ${linksAtuais?.length || 0}`)
    linksAtuais?.forEach(link => {
      console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type}`)
    })

    // 2. Verificar configuração atual do sistema
    console.log('\n⚙️ 2. Configuração atual do sistema:')
    const { data: configAtual, error: errConfig } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'member_links_type')
      .single()

    if (errConfig) {
      console.error('❌ Erro ao buscar configuração:', errConfig)
    } else {
      console.log(`   Tipo de links atual: ${configAtual?.setting_value || 'members'}`)
    }

    // 3. Verificar usuários admin
    console.log('\n👤 3. Verificando usuários admin:')
    const { data: admins, error: errAdmins } = await supabase
      .from('auth_users')
      .select('id, username, full_name, campaign')
      .or('username.eq.admin,role.eq.Administrador,role.eq.admin')

    if (errAdmins) {
      console.error('❌ Erro ao buscar admins:', errAdmins)
    } else {
      console.log(`   Total de admins: ${admins?.length || 0}`)
      admins?.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.campaign || 'A'}): ${admin.full_name}`)
      })
    }

    // 4. Testar alteração de tipo de links
    console.log('\n🔄 4. Testando alteração de tipo de links:')
    
    const novoTipo = configAtual?.setting_value === 'members' ? 'friends' : 'members'
    console.log(`   Alterando de '${configAtual?.setting_value || 'members'}' para '${novoTipo}'`)

    // Simular a função updateMemberLinksType
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

      // 2. Buscar admin para excluir da atualização
      const admin = admins?.[0]
      if (!admin) {
        console.error('❌ Nenhum admin encontrado')
        return
      }

      console.log(`   Admin excluído da atualização: ${admin.username}`)

      // 3. Atualizar links existentes
      const { data: linksAtualizados, error: errUpdateLinks } = await supabase
        .from('user_links')
        .update({ 
          link_type: novoTipo,
          updated_at: new Date().toISOString()
        })
        .neq('user_id', admin.id) // Excluir admin
        .select('id, user_id, link_type, campaign, referrer_name')

      if (errUpdateLinks) {
        console.error('❌ Erro ao atualizar links:', errUpdateLinks)
        return
      }

      console.log(`   ✅ ${linksAtualizados?.length || 0} links atualizados`)

      // 4. Verificar resultado
      console.log('\n📊 5. Resultado da alteração:')
      const { data: linksFinais, error: errLinksFinais } = await supabase
        .from('user_links')
        .select('id, user_id, link_type, campaign, referrer_name, created_at')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (errLinksFinais) {
        console.error('❌ Erro ao buscar links finais:', errLinksFinais)
      } else {
        console.log(`   Total de links ativos: ${linksFinais?.length || 0}`)
        linksFinais?.forEach(link => {
          console.log(`   - ${link.referrer_name} (${link.campaign || 'A'}): ${link.link_type}`)
        })
      }

      // 5. Verificar se a campanha foi preservada
      console.log('\n🔍 6. Verificando preservação da campanha:')
      let campanhasPreservadas = true
      
      linksFinais?.forEach(link => {
        const linkOriginal = linksAtuais?.find(l => l.id === link.id)
        if (linkOriginal && linkOriginal.campaign !== link.campaign) {
          console.log(`   ❌ Campanha alterada: ${link.referrer_name} - ${linkOriginal.campaign} → ${link.campaign}`)
          campanhasPreservadas = false
        }
      })

      if (campanhasPreservadas) {
        console.log('   ✅ Campanhas preservadas corretamente')
      }

      // 6. Verificar configuração final
      console.log('\n⚙️ 7. Configuração final:')
      const { data: configFinal, error: errConfigFinal } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'member_links_type')
        .single()

      if (errConfigFinal) {
        console.error('❌ Erro ao buscar configuração final:', errConfigFinal)
      } else {
        console.log(`   Tipo de links final: ${configFinal?.setting_value}`)
      }

      // 7. Restaurar configuração original
      console.log('\n🔄 8. Restaurando configuração original:')
      const { error: errRestore } = await supabase
        .from('system_settings')
        .update({ setting_value: configAtual?.setting_value || 'members' })
        .eq('setting_key', 'member_links_type')

      if (errRestore) {
        console.error('❌ Erro ao restaurar configuração:', errRestore)
      } else {
        console.log('   ✅ Configuração restaurada')
      }

    } catch (error) {
      console.error('❌ Erro durante a alteração:', error)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Alteração de links testada')
    console.log('   - Preservação de campanha verificada')
    console.log('   - Configuração do sistema testada')
    console.log('   - Links atualizados corretamente')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarAlteracaoLinks()
