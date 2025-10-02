// =====================================================
// TESTE: CADASTRO PELO FRONTEND E EXIBIÇÃO DE POSIÇÕES
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCadastroFrontendRanking() {
  console.log('🎭 Testando cadastro pelo frontend e exibição de posições...\n')

  try {
    // Limpar dados de teste anteriores
    console.log('📝 1. Limpando dados de teste anteriores...')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE FRONTEND%')

    // Verificar estado inicial
    console.log('\n📊 2. Estado inicial antes do teste:')
    
    const { data: estadoInicial, error: errInicial } = await supabase
      .from('members')
      .select('campaign, name, ranking_position, contracts_completed')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errInicial) {
      console.error('❌ Erro ao buscar estado inicial:', errInicial)
      return
    }

    console.log(`   📋 Campanha A (${estadoInicial.length} membros):`)
    estadoInicial?.forEach(membro => {
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
    })

    // 3. SIMULAR CADASTRO PELO FRONTEND (como usaria o sistema real)
    console.log('\n🎭 3. Simulando cadastro pelo frontend:')

    // Cadastrar membro com muitos contratos (deve assumir topo da Campanha A)
    const novoMembroFrontend = {
      name: 'LÍDER TESTE FRONTEND A1',
      phone: '61911111111',
      instagram: '@lider_frontend_a1',
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'Admin',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      contracts_completed: 35, // Muitos contratos - deve ser líder da Campanha A
      ranking_status: 'Verde',
      ranking_position: null, // Será definido pelo sistema automático
      is_top_1500: true,
      can_be_replaced: false,
      couple_name: 'Parceiro Frontend A1',
      couple_phone: '61811111111',
      couple_instagram: '@parceiro_frontend_a1',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: false,
      campaign: 'A'
    }

    console.log('   📝 Cadastrando membro na Campanha A...')
    
    const { data: membroInserido, error: errInsertion } = await supabase
      .from('members')
      .insert([novoMembroFrontend])
      .select('name, contracts_completed, ranking_position, campaign')
      .single()

    if (errInsertion) {
      console.error('❌ Erro ao inserir membro:', errInsertion.message)
      return
    }

    console.log(`   ✅ Membro inserido: ${membroInserido.name}`)
    console.log(`     Contratos: ${membroInserido.contracts_completed}`)
    console.log(`     Posição inicial: ${membroInserido.ranking_position}`)

    // Aguardar trigger automático executar
    console.log('\n⏱️ Aguardando trigger automático executar (3 segundos)...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 4. EXECUTAR FUNÇÃO DE RANKING AUTOMÁTICA (como faria o frontend)
    console.log('\n🔄 4. Executando função de ranking automática (como frontend)...')
    
    const { error: errorRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errorRanking) {
      console.error('❌ Erro ao executar ranking:', errorRanking.message)
    } else {
      console.log('✅ Ranking executado com sucesso')
    }

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 5. VERIFICAR RESULTADO FINAL (como apareceria no dashboard)
    console.log('\n📊 5. Verificando resultado final (como no dashboard):')
    
    const { data: resultadoFinal, error: errFinal } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errFinal) {
      console.error('❌ Erro ao buscar resultado final:', errFinal)
      return
    }

    console.log(`   📋 Campanha A (${resultadoFinal.length} membros):`)
    resultadoFinal?.forEach(membro => {
      const marcadorNovo = membro.name === 'LÍDER TESTE FRONTEND A1' ? ' 🆕' : ''
      const posicaoText = membro.ranking_position ? `${membro.ranking_position}º` : 'N/A'
      console.log(`     ${posicaoText} - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})${marcadorNovo}`)
    })

    // 6. ANÁLISE ESPECÍFICA DO NOVO MEMBRO
    console.log('\n🎯 6. Análise específica do novo membro:')
    
    const novoMembroFinal = resultadoFinal?.find(m => m.name === 'LÍDER TESTE FRONTEND A1')
    
    if (novoMembroFinal) {
      console.log(`   📍 Novo membro encontrado:`)
      console.log(`     Nome: ${novoMembroFinal.name}`)
      console.log(`     Contratos: ${novoMembroFinal.contracts_completed}`)
      console.log(`     Posição: ${novoMembroFinal.ranking_position}º`)
      console.log(`     Status: ${novoMembroFinal.ranking_status}`)
      console.log(`     Campanha: ${novoMembroFinal.campaign}`)
      
      // Verificar se está na posição correta
      const posicaoEsperada = resultadoFinal
        ?.filter(m => m.contracts_completed > novoMembroFinal.management_completed)
        ?.length + 1 || 1
      
      console.log(`     Posição esperada: ${posicaoEsperada}º`)
      
      if (novoMembroFinal.ranking_position === posicaoEsperada) {
        console.log(`     ✅ Posição CORRETA!`)
      } else {
        console.log(`     ❌ Posição INCORRETA! Esperado: ${posicaoEsperada}º, Atual: ${novoMembroFinal.ranking_position}º`)
      }
    } else {
      console.log(`   ❌ Novo membro não encontrado na consulta final!`)
    }

    // 7. VERIFICAR INTEGRIDADE GERAL
    console.log('\n🔍 7. Verificando integridade geral das posições:')
    
    const posicoes = resultadoFinal?.map(m => m.ranking_position) || []
    const posicaoMinima = Math.min(...posicoes)
    const posicaoMaxima = Math.max(...posicoes)
    const posicoesUnicas = new Set(posicoes).size
    const totalMembros = resultadoFinal?.length || 0

    console.log(`   📊 Estatísticas:`)
    console.log(`     Total de membros: ${totalMembros}`)
    console.log(`     Posições: ${posicaoMinima} a ${posicaoMaxima}`)
    console.log(`     Posições únicas: ${posicoesUnicas}`)
    console.log(`     Sequential: ${posicoesUnicas === totalMembros && posicaoMinima === 1 && posicaoMaxima === totalMembros ? '✅' : '❌'}`)

    // Verificar se ordenação por contratos está correta
    let ordenacaoCorreta = true
    for (let i = 0; i < resultadoFinal.length - 1; i++) {
      const atual = resultadoFinal[i]
      const proximo = resultadoFinal[i + 1]
      
      if (atual.ranking_position < proximo.ranking_position && atual.contracts_completed < proximo.contracts_completed) {
        ordenacaoCorreta = false
        break
      }
    }

    console.log(`     Ordenação por contratos: ${ordenacaoCorreta ? '✅' : '❌'}`)

    // Verificar isolamento de campanha
    console.log('\n🔍 8. Verificando isolamento da Campanha B:')
    
    const { data: campanhaB, error: errCampanhaB } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (!errCampanhaB) {
      console.log(`   📋 Campanha B (${campanhaB.length} membros):`)
      campanhaB?.forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
      })

      const posicoesB = campanhaB?.map(m => m.ranking_position) || []
      const consistenteB = posicoesB.length === 0 || (Math.min(...posicoesB) === 1 && Math.max(...posicoesB) === posicoesB.length && new Set(posicoesB).size === posicoesB.length)
      
      console.log(`     Consistente: ${consistenteB ? '✅' : '❌'}`)
    }

    console.log('\n✅ Teste do frontend concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Cadastro pelo frontend simulado')
    console.log('   - Sistema automático de triggers testado')
    console.log('   - Função de ranking RPC testada')
    console.log('   - Posições verificadas no dashboard')
    console.log('   - Integridade geral verificada')
    console.log('   - Isolamento de campanhas verificado')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCadastroFrontendRanking()
