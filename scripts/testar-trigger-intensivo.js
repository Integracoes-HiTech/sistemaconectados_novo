// =====================================================
// TESTE INTENSIVO DE TRIGGERS E RANKING
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarTriggerIntensivo() {
  console.log('🔥 Teste intensivo de triggers e ranking...\n')

  try {
    // Executar um grande volume de mudanças para detectar problemas
    console.log('📝 1. Executando múltiplas operações simultâneas:')
    
    // Operação 1: Incrementar contratos de vários membros da Campanha A
    console.log('   🔄 Incrementando contratos de múltiplos membros...')
    
    const { data: membrosParaAtualizar, error: errBuscarMembros } = await supabase
      .from('members')
      .select('name, id, contracts_completed, ranking_position')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .neq('name', 'NOVO LÍDER Campanha A')
      .limit(3)

    if (errBuscarMembros || !membrosParaAtualizar || membrosParaAtualizar.length === 0) {
      console.log('   ⚠️ Não há membros suficientes para teste ou erro:', errBuscarMembros?.message)
      return
    }

    console.log(`   📊 Encontrados ${membrosParaAtualizar.length} membros para atualizar`)

    // Executar múltiplas atualizações quase simultâneas
    const promissesAtualizacao = []
    
    membrosParaAtualizar.forEach((membro, index) => {
      promissesAtualizacao.push(
        supabase
          .from('members')
          .update({ 
            contracts_completed: membro.contracts_completed + (index + 1) * 5, // Incrementos diferentes
            updated_at: new Date().toISOString()
          })
          .eq('id', membro.id)
          .select('name, contracts_completed, ranking_position, campaign')
      )
    })

    // Executar todas as atualizações "simultaneamente"
    const resultados = await Promise.all(promissesAtualizacao)

    console.log('   📊 Resultados das atualizações:')
    resultados.forEach((resultado, index) => {
      if (resultado.error) {
        console.log(`     ❌ Erro ao atualizar membro ${index + 1}:`, resultado.error.message)
      } else {
        const data = resultado.data?.[0]
        if (data) {
          console.log(`     ✅ ${data.name}: ${data.contracts_completed} contratos`)
        }
      }
    })

    // Aguardar um tempo para os triggers executarem
    console.log('\n⏱️ Aguardando triggers executarem...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Verificar resultado após todas as atualizações
    console.log('\n📊 2. Verificando ranking após múltiplas atualizações:')
    
    const { data: rankingAposAtualizacoes, error: errRankingAtualizado } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errRankingAtualizado) {
      console.error('❌ Erro ao buscar ranking atualizado:', errRankingAtualizado)
      return
    }

    rankingAposAtualizacoes?.forEach(membro => {
      console.log(`   ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})`)
    })

    // Verificar problemas específicos
    console.log('\n🔍 3. Verificando problemas específicos:')
    
    const posicoes = rankingAposAtualizacoes?.map(m => m.ranking_position) || []
    const posicaoMinima = Math.min(...posicoes)
    const posicaoMaxima = Math.max(...posicoes)
    const posicoesUnicas = new Set(posicoes).size
    const totalMembros = rankingAposAtualizacoes?.length || 0

    // Verificar sequência
    let problemasSequencia = []
    for (let i = 1; i <= totalMembros; i++) {
      const membroNaPosicao = rankingAposAtualizacoes?.find(m => m.ranking_position === i)
      if (!membroNaPosicao) {
        problemasSequencia.push(`Posição ${i} vazia`)
      }
      
      // Verificar se há mais de um membro na mesma posição
      const membrosNaPosicao = rankingAposAtualizacoes?.filter(m => m.ranking_position === i) || []
      if (membrosNaPosicao.length > 1) {
        problemasSequencia.push(`Posição ${i} tem ${membrosNaPosicao.length} membros`)
      }
    }

    // Verificar ordenação por contratos
    let problemasOrdenacao = []
    for (let i = 0; i < rankingAposAtualizacoes.length - 1; i++) {
      const atual = rankingAposAtualizacoes[i]
      const proximo = rankingAposAtualizacoes[i + 1]
      
      if (atual.ranking_position < proximo.ranking_position && atual.contracts_completed < proximo.contracts_completed) {
        problemasOrdenacao.push(`${atual.name} (${atual.contracts_completed}) vem antes de ${proximo.name} (${proximo.contracts_completed})`)
      }
    }

    console.log(`   📊 Estatísticas:`)
    console.log(`     Total de membros: ${totalMembros}`)
    console.log(`     Posições: ${posicaoMinima} a ${posicaoMaxima}`)
    console.log(`     Posições únicas: ${posicoesUnicas}`)

    if (problemasSequencia.length > 0) {
      console.log(`   ❌ Problemas de sequência:`)
      problemasSequencia.forEach(problema => console.log(`     - ${problema}`))
    } else {
      console.log(`   ✅ Sequência perfeita`)
    }

    if (problemasOrdenacao.length > 0) {
      console.log(`   ❌ Problemas de ordenação:`)
      problemasOrdenacao.forEach(problema => console.log(`     - ${problema}`))
    } else {
      console.log(`   ✅ Ordenação correta`)
    }

    // Verificar se Campanha B foi afetada
    console.log('\n🔍 4. Verificando isolamento da Campanha B:')
    
    const { data: rankingCampanhaB, error: errCampanhaB } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (errCampanhaB) {
      console.error('❌ Erro ao verificar Campanha B:', errCampanhaB)
    } else {
      console.log(`   📋 Campanha B (${rankingCampanhaB.length} membros):`)
      rankingCampanhaB?.forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
      })

      const posicoesB = rankingCampanhaB?.map(m => m.ranking_position) || []
      const posicoesUnicasB = new Set(posicoesB).size
      const totalB = rankingCampanhaB?.length || 0

      if (posicoesUnicasB !== totalB || Math.min(...posicoesB) !== 1 || Math.max(...posicoesB) !== totalB) {
        console.log(`   ❌ Campanha B foi afetada indevidamente!`)
      } else {
        console.log(`   ✅ Campanha B mantida intacta`)
      }
    }

    // Executar ranking manual se houver problemas
    if (problemasSequencia.length > 0 || problemasOrdenacao.length > 0) {
      console.log('\n🔄 5. Problemas detectados - executando ranking manual:')
      
      const { error: errorManual } = await supabase.rpc('update_complete_ranking')
      
      if (errorManual) {
        console.error('❌ Erro ao executar ranking manual:', errorManual)
      } else {
        console.log('✅ Ranking manual executado')

        // Verificar resultado após correção
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
          console.log('\n   📊 Campanha A após correção:')
          rankingCorrigido?.forEach(membro => {
            console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
          })
        }
      }
    }

    console.log('\n✅ Teste intensivo concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Múltiplas atualizações executadas')
    console.log('   - Triggers testados sob pressão')
    console.log('   - Sequência de posições verificada')
    console.log('   - Ordenação por contratos verificada')
    console.log('   - Isolamento entre campanhas verificado')

  } catch (error) {
    console.error('❌ Erro geral no teste intensivo:', error)
  }
}

// Executar teste
testarTriggerIntensivo()
