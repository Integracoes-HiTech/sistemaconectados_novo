// =====================================================
// TESTE: PROBLEMA ESPECÍFICO COM ALTERAÇÃO DE LINKS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarProblemaLinks() {
  console.log('🔍 Testando problema específico com alteração de links...\n')

  try {
    // 1. Verificar estrutura da tabela user_links
    console.log('📊 1. Verificando estrutura da tabela user_links:')
    
    // Buscar um link para ver a estrutura
    const { data: linkExemplo, error: errLink } = await supabase
      .from('user_links')
      .select('*')
      .limit(1)
      .single()

    if (errLink) {
      console.error('❌ Erro ao buscar link exemplo:', errLink)
    } else if (linkExemplo) {
      console.log('   Colunas encontradas na tabela user_links:')
      Object.keys(linkExemplo).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof linkExemplo[coluna]} = ${linkExemplo[coluna]}`)
      })
    } else {
      console.log('   Nenhum link encontrado na tabela')
    }

    // 2. Verificar se há links com campanha NULL
    console.log('\n🔍 2. Verificando links com campanha NULL:')
    const { data: linksNull, error: errNull } = await supabase
      .from('user_links')
      .select('id, referrer_name, campaign, link_type')
      .is('campaign', null)

    if (errNull) {
      console.error('❌ Erro ao buscar links com campanha NULL:', errNull)
    } else {
      console.log(`   Links com campanha NULL: ${linksNull?.length || 0}`)
      linksNull?.forEach(link => {
        console.log(`   - ${link.referrer_name}: ${link.link_type} (campanha: ${link.campaign})`)
      })
    }

    // 3. Verificar se há links com campanha vazia
    console.log('\n🔍 3. Verificando links com campanha vazia:')
    const { data: linksVazios, error: errVazios } = await supabase
      .from('user_links')
      .select('id, referrer_name, campaign, link_type')
      .eq('campaign', '')

    if (errVazios) {
      console.error('❌ Erro ao buscar links com campanha vazia:', errVazios)
    } else {
      console.log(`   Links com campanha vazia: ${linksVazios?.length || 0}`)
      linksVazios?.forEach(link => {
        console.log(`   - ${link.referrer_name}: ${link.link_type} (campanha: "${link.campaign}")`)
      })
    }

    // 4. Verificar todos os links e suas campanhas
    console.log('\n📊 4. Todos os links e suas campanhas:')
    const { data: todosLinks, error: errTodos } = await supabase
      .from('user_links')
      .select('id, referrer_name, campaign, link_type, is_active, deleted_at')
      .order('created_at', { ascending: false })

    if (errTodos) {
      console.error('❌ Erro ao buscar todos os links:', errTodos)
    } else {
      console.log(`   Total de links: ${todosLinks?.length || 0}`)
      todosLinks?.forEach(link => {
        const status = link.is_active ? 'Ativo' : 'Inativo'
        const deletado = link.deleted_at ? ' (Deletado)' : ''
        console.log(`   - ${link.referrer_name}: ${link.link_type} - Campanha: ${link.campaign || 'NULL'} - ${status}${deletado}`)
      })
    }

    // 5. Testar criação de link com campanha
    console.log('\n🧪 5. Testando criação de link com campanha:')
    
    // Buscar um usuário para testar
    const { data: usuarioTeste, error: errUsuario } = await supabase
      .from('auth_users')
      .select('id, username, campaign')
      .limit(1)
      .single()

    if (errUsuario) {
      console.error('❌ Erro ao buscar usuário para teste:', errUsuario)
    } else if (usuarioTeste) {
      console.log(`   Usuário de teste: ${usuarioTeste.username} (${usuarioTeste.campaign || 'A'})`)
      
      // Tentar criar um link
      const linkId = `teste-${Date.now()}`
      const { data: linkCriado, error: errCriar } = await supabase
        .from('user_links')
        .insert([{
          user_id: usuarioTeste.id,
          link_id: linkId,
          referrer_name: `Teste ${usuarioTeste.username}`,
          is_active: true,
          click_count: 0,
          registration_count: 0,
          link_type: 'members',
          campaign: usuarioTeste.campaign || 'A'
        }])
        .select()
        .single()

      if (errCriar) {
        console.error('❌ Erro ao criar link:', errCriar)
      } else {
        console.log('   ✅ Link criado com sucesso!')
        console.log(`   - ID: ${linkCriado.id}`)
        console.log(`   - Link ID: ${linkCriado.link_id}`)
        console.log(`   - Campanha: ${linkCriado.campaign}`)
        console.log(`   - Tipo: ${linkCriado.link_type}`)
        
        // Remover link de teste
        const { error: errDelete } = await supabase
          .from('user_links')
          .delete()
          .eq('id', linkCriado.id)

        if (errDelete) {
          console.error('❌ Erro ao remover link de teste:', errDelete)
        } else {
          console.log('   ✅ Link de teste removido')
        }
      }
    }

    // 6. Verificar se há problemas de constraint
    console.log('\n🔍 6. Verificando possíveis problemas de constraint:')
    
    // Tentar atualizar um link existente
    if (todosLinks && todosLinks.length > 0) {
      const linkParaTeste = todosLinks[0]
      console.log(`   Testando atualização do link: ${linkParaTeste.referrer_name}`)
      
      const { error: errUpdate } = await supabase
        .from('user_links')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', linkParaTeste.id)

      if (errUpdate) {
        console.error('❌ Erro ao atualizar link:', errUpdate)
      } else {
        console.log('   ✅ Link atualizado com sucesso')
      }
    }

    // 7. Verificar se há problemas de RLS
    console.log('\n🔍 7. Verificando possíveis problemas de RLS:')
    
    // Tentar buscar links com diferentes filtros
    const { data: linksFiltrados, error: errFiltrados } = await supabase
      .from('user_links')
      .select('*')
      .eq('campaign', 'A')

    if (errFiltrados) {
      console.error('❌ Erro ao filtrar por campanha A:', errFiltrados)
    } else {
      console.log(`   Links da Campanha A: ${linksFiltrados?.length || 0}`)
    }

    const { data: linksFiltradosB, error: errFiltradosB } = await supabase
      .from('user_links')
      .select('*')
      .eq('campaign', 'B')

    if (errFiltradosB) {
      console.error('❌ Erro ao filtrar por campanha B:', errFiltradosB)
    } else {
      console.log(`   Links da Campanha B: ${linksFiltradosB?.length || 0}`)
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Estrutura da tabela verificada')
    console.log('   - Links com campanha NULL/vazia verificados')
    console.log('   - Criação de link testada')
    console.log('   - Atualização de link testada')
    console.log('   - Filtros por campanha testados')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarProblemaLinks()
