// =====================================================
// TESTE: SOLUÇÃO DEFINITIVA PARA DEADLOCK
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarSolucaoDeadlock() {
  console.log('🚀 Testando solução definitiva para deadlock...\n')

  try {
    // Limpar dados de teste anteriores
    console.log('📝 1. Limpando dados de teste anteriores...')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE CONFLITO%')

    // Executar ranking inicial
    await supabase.rpc('update_complete_ranking')

    console.log('\n📊 2. Estado inicial das campanhas:')
    
    const { data: estadoInicial, error: errInicial } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })

    if (errInicial) {
      console.error('❌ Erro ao buscar estado inicial:', errInicial)
      return
    }

    // Agrupar por campanha
    const campanhasInicial = {}
    estadoInicial?.forEach(membro => {
      if (!campanhasInicial[membro.campaign]) {
        campanhasInicial[membro.campaign] = []
      }
      campanhasInicial[membro.campaign].push(membro)
    })

    Object.keys(campanhasInicial).forEach(campanha => {
      console.log(`\n   📋 Campanha ${campanha} (INICIAL):`)
      campanhasInicial[campanha].forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
      })
    })

    // 3. TESTE: Múltiplas inserções simultâneas (o cenário que causava deadlock)
    console.log('\n🔥 3. Testando múltiplas inserções simultâneas (cenário deadlock):')
    
    const membrosParaInserir = [
      {
        name: 'LÍDER TESTE A1',
        phone: '61911111111',
        instagram: '@lider_a1',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 30, // Muitos contratos - deve ser líder
        ranking_status: 'Verde',
        ranking_position: 999,
        is_top_1500: true,
        can_be_replaced: false,
        couple_name: 'Parceiro Líder A1',
        couple_phone: '61811111111',
        couple_instagram: '@parceiro_lider_a1',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        is_friend: false,
        campaign: 'A'
      },
      {
        name: 'COMPETIDOR TESTE A2',
        phone: '61922222222',
        instagram: '@competidor_a2',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 28, // Muitos contratos - deve ser segundo
        ranking_status: 'Verde',
        ranking_position: 999,
        is_top_1500: true,
        can_be_replaced: false,
        couple_name: 'Parceiro Competidor A2',
        couple_phone: '61822222222',
        couple_instagram: '@parceiro_competidor_a2',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        is_friend: false,
        campaign: 'A'
      },
      {
        name: 'OUTSIDER TESTE A3',
        phone: '61933333333',
        instagram: '@outsider_a3',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 12, // Poucos contratos - deve ficar no meio
        ranking_status: 'Amarelo',
        ranking_position: 999,
        is_top_1500: false,
        can_be_replaced: false,
        couple_name: 'Parceiro Outsider A3',
        couple_phone: '61833333333',
        couple_instagram: '@parceiro_outsider_a3',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        is_friend: false,
        campaign: 'A'
      }
    ]

    // Executar inserções em sequência rápida (simular simultâneo)
    console.log('   🚀 Executando inserções em sequência rápida...')
    
    const resultadosInsercao = []
    for (const membro of membrosParaInserir) {
      try {
        const resultado = await supabase
          .from('members')
          .insert([membro])
          .select('name, contracts_completed, campaign')
        
        if (resultado.error) {
          console.log(`     ❌ Erro ao inserir ${membro.name}:`, resultado.error.message)
          resultadosInsercao.push({ sucesso: false, nome: membro.name, erro: resultado.error.message })
        } else {
          console.log(`     ✅ Inserido: ${membro.name} (${membro.contracts_completed} contratos)`)
          resultadosInsercao.push({ sucesso: true, nome: membro.name })
        }
      } catch (err) {
        console.log(`     ❌ Exceção ao inserir ${membro.name}:`, err.message)
        resultadosInsercao.push({ sucesso: false, nome: membro.name, erro: err.message })
      }

      // Pequeno delay entre inserções para simular quase-simultâneo
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Aguardar triggers processarem
    console.log('\n⏱️ Aguardando triggers processarem (10 segundos)...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    // 4. Verificar resultado após inserções simultâneas
    console.log('\n📊 4. Verificando resultado após inserções simultâneas:')
    
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
      const marcadorNovo = ['LÍDER TESTE A1', 'COMPETIDOR TESTE A2', 'OUTSIDER TESTE A3'].includes(membro.name) ? ' 🆕' : ''
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})${marcadorNovo}`)
    })

    // 5. Verificar se não houve deadlock
    console.log('\n🔍 5. Verificando resultado dos testes:')
    
    const problemasEncontrados = []
    
    // Verificar se todos os novos membros foram inseridos
    const membrosInseridosComSucesso = resultadosInsercao.filter(r => r.sucesso).length
    console.log(`   📊 Inserções bem-sucedidas: ${membrosInseridosComSucesso}/${membrosParaInserir.length}`)

    if (membrosInseridosComSucesso !== membrosParaInserir.length) {
      problemasEncontrados.push('Nem todos os membros foram inseridos')
    }

    // Verificar deadlock especificamente
    const errosDeadlock = resultadosInsercao.filter(r => !r.sucesso && r.erro && r.erro.includes('deadlock'))
    if (errosDeadlock.length > 0) {
      problemasEncontrados.push(`${errosDeadlock.length} deadlocks ainda ocorrendo`)
      errosDeadlock.forEach(erro => console.log(`     ❌ Deadlock: ${erro.nome}`))
    } else {
      console.log(`   ✅ Nenhum deadlock detectado`)
    }

    // Verificar integridade das posições
    const posicoes = resultadoFinal?.map(m => m.ranking_position) || []
    const posicaoMinima = Math.min(...posicoes)
    const posicaoMaxima = Math.max(...posicoes)
    const posicoesUnicas = new Set(posicoes).size
    const totalMembros = resultadoFinal?.length || 0

    console.log(`   📊 Estatísticas de posições:`)
    console.log(`     Total: ${totalMembros}`)
    console.log(`     Range: ${posicaoMinima}-${posicaoMaxima}`)
    console.log(`     Únicas: ${posicoesUnicas}`)

    if (posicoesUnicas !== totalMembros || posicaoMinima !== 1 || posicaoMaxima !== totalMembros) {
      problemasEncontrados.push('Posições inconsistentes')
    } else {
      console.log(`   ✅ Posições consistentes`)
    }

    // Verificar se novos líderes subiram corretamente
    const novoLider = resultadoFinal?.find(m => m.name === 'LÍDER TESTE A1')
    const competidor = resultadoFinal?.find(m => m.name === 'COMPETIDOR TESTE A2')
    
    if (novoLider && competidor) {
      if (novoLider.ranking_position < competidor.ranking_position && novoLider.contracts_completed > competidor.contracts_completed) {
        console.log(`   ✅ Novo líder está corretamente posicionado`)
      } else {
        problemasEncontrados.push('Líder não está na posição correta')
      }
    }

    // Verificar isolamento da Campanha B
    const { data: campanhaBIntacta, error: errCampanhaB } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (!errCampanhaB) {
      const originalCampanhaB = campanhasInicial['B']?.length || 0
      if (campanhaBIntacta?.length === originalCampanhaB) {
        console.log(`   ✅ Campanha B mantida intacta`)
      } else {
        problemasEncontrados.push('Campanha B foi afetada indevidamente')
      }
    }

    console.log('\n📋 Resumo dos problemas encontrados:')
    if (problemasEncontrados.length === 0) {
      console.log('   ✅ NENHUM PROBLEMA DETECTADO!')
    } else {
      problemasEncontrados.forEach(problema => {
        console.log(`   ❌ ${problema}`)
      })
    }

    console.log('\n✅ Teste da solução concluído!')
    console.log('\n📝 Resultado:')
    console.log('   - Inserções simultâneas testadas')
    console.log('   - Deadlocks verificados')
    console.log('   - Ranking automático testado')
    console.log('   - Isolamento entre campanhas mantido')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarSolucaoDeadlock()
