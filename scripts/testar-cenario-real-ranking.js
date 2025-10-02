// =====================================================
// TESTE: CENÁRIO REAL DE PROBLEMA DE RANKING
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCenarioRealRanking() {
  console.log('🔍 Testando cenário real de problema de ranking...\n')

  try {
    // Atualizar contrato de um membro existente (simular quando amigo se registra)
    console.log('📝 1. Simulando incremento de contratos de membro existente...')
    
    // Buscar um membro da Campanha A com poucos contratos
    const { data: membroAtual, error: errMembroAtual } = await supabase
      .from('members')
      .select('name, contracts_completed, ranking_position, campaign')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .neq('name', 'NOVO LÍDER Campanha A') // Não mexer no líder
      .order('contracts_completed')
      .limit(1)
      .single()

    if (errMembroAtual || !membroAtual) {
      console.error('❌ Erro ao buscar membro ou não encontrado:', errMembroAtual)
      return
    }

    console.log(`   Membro encontrado: ${membroAtual.name}`)
    console.log(`   Contratos atuais: ${membroAtual.contracts_completed}`)
    console.log(`   Posição atual: ${membroAtual.ranking_position}º`)
    console.log(`   Campanha: ${membroAtual.campaign}`)

    // Incrementar contratos deste membro para simular registro de amigo
    const novosContratos = membroAtual.contracts_completed + 1
    
    const { data: membroAtualizado, error: errAtualizado } = await supabase
      .from('members')
      .update({ 
        contracts_completed: novosContratos,
        updated_at: new Date().toISOString()
      })
      .eq('name', membroAtual.name)
      .select('name, contracts_completed, ranking_position, campaign')
      .single()

    if (errAtualizado) {
      console.error('❌ Erro ao atualizar contratos:', errAtualizado)
      return
    }

    console.log(`   ✅ Contratos atualizados: ${membroAtualizado.contracts_completed}`)
    console.log(`   ✅ Nova posição: ${membroAtualizado.ranking_position}º`)

    // 2. Verificar ranking da Campanha A após atualização
    console.log('\n📊 2. Verificando ranking da Campanha A (após trigger):')
    
    const { data: rankingCampanhaA, error: errRankingA } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errRankingA) {
      console.error('❌ Erro ao buscar ranking Campanha A:', errRankingA)
      return
    }

    rankingCampanhaA?.forEach(membro => {
      const marcadorAtualizado = membro.name === membroAtualizado.name ? ' 🔥' : ''
      console.log(`   ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos${marcadorAtualizado}`)
    })

    // 3. Verificar se há posições duplicadas OU sequência quebrada
    console.log('\n🔍 3. Verificando integridade das posições:')
    
    const posicoes = rankingCampanhaA?.map(m => m.ranking_position) || []
    const posicaoMinima = Math.min(...posicoes)
    const posicaoMaxima = Math.max(...posicoes)
    const posicoesUnicas = new Set(posicoes).size
    const totalMembros = rankingCampanhaA?.length || 0

    console.log(`   Total de membros: ${totalMembros}`)
    console.log(`   Posições encontradas: ${posicoes.join(', ')}`)
    console.log(`   Posição mínima: ${posicaoMinima}`)
    console.log(`   Posição máxima: ${posicaoMaxima}`)
    console.log(`   Posições únicas: ${posicoesUnicas}`)

    // Verificar sequência
    let sequenciaQuebrada = []
    for (let i = 1; i <= totalMembros; i++) {
      if (!posicoes.includes(i)) {
        sequenciaQuebrada.push(i)
      }
    }

    if (sequenciaQuebrada.length > 0) {
      console.log(`   ❌ Sequência quebrada: posições ${sequenciaQuebrada.join(', ')} faltando`)
    } else {
      console.log(`   ✅ Sequência completa`)
    }

    // Verificar duplicatas
    const duplicatas = []
    const ocorrencias = {}
    posicoes.forEach(pos => {
      ocorrencias[pos] = (ocorrencias[pos] || 0) + 1
      if (ocorrencias[pos] > 1 && !duplicatas.includes(pos)) {
        duplicatas.push(pos)
      }
    })

    if (duplicatas.length > 0) {
      console.log(`   ❌ Posições duplicadas: ${duplicatas.join(', ')}`)
    } else {
      console.log(`   ✅ Nenhuma posição duplicada`)
    }

    // Verificar se o ranking está ordenado corretamente por contratos
    console.log('\n📈 4. Verificando ordenação por contratos:')
    
    let ordenacaoCorreta = true
    for (let i = 0; i < rankingCampanhaA.length - 1; i++) {
      const atual = rankingCampanhaA[i]
      const proximo = rankingCampanhaA[i + 1]
      
      if (atual.contracts_completed < proximo.contracts_completed) {
        console.log(`   ❌ Ordenação incorreta: ${atual.name} (${atual.contracts_completed}) vem antes de ${proximo.name} (${proximo.contracts_completed})`)
        ordenacaoCorreta = false
      }
    }
    
    if (ordenacaoCorreta) {
      console.log(`   ✅ Ordenação por contratos está correta`)
    }

    // 5. Verificar se Campanha B foi afetada (NÃO DEVERIA)
    console.log('\n🔍 5. Verificando se Campanha B foi afetada (NÃO DEVERIA):')
    
    const { data: rankingBeforeB, error: errAntesB } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (errAntesB) {
      console.error('❌ Erro ao buscar ranking Campanha B:', errAntesB)
      return
    }

    console.log(`   📋 Campanha B (antes):`)
    rankingBeforeB?.forEach(membro => {
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
    })

    const posicoesB = rankingBeforeB?.map(m => m.ranking_position) || []
    const posicaoMinimaB = Math.min(...posicoesB)
    const posicaoMaximaB = Math.max(...posicoesB)
    const posicoesUnicasB = new Set(posicoesB).size
    const totalMembrosB = rankingBeforeB?.length || 0

    if (posicoesUnicasB !== totalMembrosB || posicaoMinimaB !== 1 || posicaoMaximaB !== totalMembrosB) {
      console.log(`   ❌ Campanha B foi afetada indevidamente!`)
    } else {
      console.log(`   ✅ Campanha B mantida intacta`)
    }

    // 6. Executar ranking manual se necessário
    if (sequenciaQuebrada.length > 0 || duplicatas.length > 0 || !ordenacaoCorreta) {
      console.log('\n🔄 6. Problemas detectados - executando ranking manual:')
      
      const { error: errorManual } = await supabase.rpc('update_complete_ranking')
      
      if (errorManual) {
        console.error('❌ Erro ao executar ranking manual:', errorManual)
      } else {
        console.log('✅ Ranking manual executado')

        // Verificar novamente
        const { data: rankingCorrigido, error: errCorrigido } = await supabase
          .from('members')
          .select('campaign, ranking_position, name, contracts_completed')
          .eq('campaign', 'A')
          .eq('status', 'Ativo')
          .is('deleted_at', null)
          .order('ranking_position')

        if (errCorrigido) {
          console.error('❌ Erro ao verificar ranking corrigido:', errCorrigido)
        } else {
          console.log('\n   📊 Campanha A após correção manual:')
          rankingCorrigido?.forEach(membro => {
            const marcadorAtualizado = membro.name === membroAtualizado.name ? ' 🔥' : ''
            console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos${marcadorAtualizado}`)
          })
        }
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Cenário real de incremento de contratos testado')
    console.log('   - Verificação de sequência de posições')
    console.log('   - Verificação de duplicatas')
    console.log('   - Verificação de ordenação por contratos')
    console.log('   - Verificação de isolamento entre campanhas')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCenarioRealRanking()
