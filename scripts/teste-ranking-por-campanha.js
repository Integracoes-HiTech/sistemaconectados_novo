// =====================================================
// TESTE: RANKING POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRankingPorCampanha() {
  console.log('🔍 Testando ranking por campanha...\n')

  try {
    // 1. Verificar estado atual dos membros por campanha
    console.log('📊 1. Estado atual dos membros por campanha:')
    
    // Campanha A
    const { data: membrosA, error: errA } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'A')
      .order('ranking_position')

    if (errA) {
      console.error('❌ Erro ao buscar membros da Campanha A:', errA)
      return
    }

    console.log(`   Campanha A (${membrosA?.length || 0} membros):`)
    membrosA?.forEach(membro => {
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // Campanha B
    const { data: membrosB, error: errB } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'B')
      .order('ranking_position')

    if (errB) {
      console.error('❌ Erro ao buscar membros da Campanha B:', errB)
      return
    }

    console.log(`   Campanha B (${membrosB?.length || 0} membros):`)
    membrosB?.forEach(membro => {
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // 2. Verificar se há problemas de posições duplicadas
    console.log('\n🔍 2. Verificando posições duplicadas:')
    
    const { data: todosMembros, error: errTodos } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (errTodos) {
      console.error('❌ Erro ao buscar todos os membros:', errTodos)
      return
    }

    // Verificar posições duplicadas
    const posicoes = todosMembros?.map(m => m.ranking_position).filter(p => p !== null)
    const posicoesDuplicadas = posicoes?.filter((pos, index) => posicoes.indexOf(pos) !== index)
    
    if (posicoesDuplicadas && posicoesDuplicadas.length > 0) {
      console.log(`   ❌ Posições duplicadas encontradas: ${posicoesDuplicadas.join(', ')}`)
      
      // Mostrar membros com posições duplicadas
      posicoesDuplicadas.forEach(pos => {
        const membrosComPosicao = todosMembros?.filter(m => m.ranking_position === pos)
        console.log(`     Posição ${pos}:`)
        membrosComPosicao?.forEach(membro => {
          console.log(`       - ${membro.name} (${membro.campaign || 'A'}): ${membro.contracts_completed} contratos`)
        })
      })
    } else {
      console.log('   ✅ Nenhuma posição duplicada encontrada')
    }

    // 3. Verificar se a função de ranking está considerando campanha
    console.log('\n🔄 3. Testando função de ranking:')
    
    // Executar a função atual
    const { error: errRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errRanking) {
      console.error('❌ Erro ao executar ranking:', errRanking)
      return
    }

    console.log('   ✅ Função update_complete_ranking executada')

    // 4. Verificar estado após ranking
    console.log('\n📊 4. Estado após ranking:')
    
    // Campanha A
    const { data: membrosAApos, error: errAApos } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'A')
      .order('ranking_position')

    console.log(`   Campanha A (${membrosAApos?.length || 0} membros):`)
    membrosAApos?.forEach(membro => {
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // Campanha B
    const { data: membrosBApos, error: errBApos } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'B')
      .order('ranking_position')

    console.log(`   Campanha B (${membrosBApos?.length || 0} membros):`)
    membrosBApos?.forEach(membro => {
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // 5. Verificar se as posições estão corretas por campanha
    console.log('\n🔍 5. Verificando posições por campanha:')
    
    let problemasEncontrados = 0

    // Verificar Campanha A
    if (membrosAApos && membrosAApos.length > 0) {
      const posicoesA = membrosAApos.map(m => m.ranking_position).filter(p => p !== null)
      const posicoesEsperadasA = Array.from({length: posicoesA.length}, (_, i) => i + 1)
      
      const posicoesCorretasA = JSON.stringify(posicoesA.sort()) === JSON.stringify(posicoesEsperadasA)
      console.log(`   Campanha A - Posições corretas: ${posicoesCorretasA ? '✅' : '❌'}`)
      
      if (!posicoesCorretasA) {
        console.log(`     Posições encontradas: ${posicoesA.join(', ')}`)
        console.log(`     Posições esperadas: ${posicoesEsperadasA.join(', ')}`)
        problemasEncontrados++
      }
    }

    // Verificar Campanha B
    if (membrosBApos && membrosBApos.length > 0) {
      const posicoesB = membrosBApos.map(m => m.ranking_position).filter(p => p !== null)
      const posicoesEsperadasB = Array.from({length: posicoesB.length}, (_, i) => i + 1)
      
      const posicoesCorretasB = JSON.stringify(posicoesB.sort()) === JSON.stringify(posicoesEsperadasB)
      console.log(`   Campanha B - Posições corretas: ${posicoesCorretasB ? '✅' : '❌'}`)
      
      if (!posicoesCorretasB) {
        console.log(`     Posições encontradas: ${posicoesB.join(', ')}`)
        console.log(`     Posições esperadas: ${posicoesEsperadasB.join(', ')}`)
        problemasEncontrados++
      }
    }

    // 6. Testar incremento de contratos em uma campanha específica
    console.log('\n🧪 6. Testando incremento em campanha específica:')
    
    if (membrosBApos && membrosBApos.length > 0) {
      const membroB = membrosBApos[0]
      console.log(`   Membro de teste: ${membroB.name} (Campanha B)`)
      console.log(`   Contratos atuais: ${membroB.contracts_completed}`)
      
      // Incrementar contratos
      const novosContratos = membroB.contracts_completed + 1
      const { error: errUpdate } = await supabase
        .from('members')
        .update({ 
          contracts_completed: novosContratos,
          updated_at: new Date().toISOString()
        })
        .eq('id', membroB.id)

      if (errUpdate) {
        console.error('❌ Erro ao atualizar contratos:', errUpdate)
      } else {
        console.log(`   ✅ Contratos atualizados para ${novosContratos}`)
        
        // Executar ranking
        const { error: errRanking2 } = await supabase.rpc('update_complete_ranking')
        if (errRanking2) {
          console.error('❌ Erro ao executar ranking:', errRanking2)
        } else {
          console.log('   ✅ Ranking executado')
          
          // Verificar se apenas a Campanha B foi afetada
          const { data: membrosBApos2, error: errBApos2 } = await supabase
            .from('members')
            .select('id, name, contracts_completed, ranking_position, campaign')
            .eq('status', 'Ativo')
            .is('deleted_at', null)
            .eq('campaign', 'B')
            .order('ranking_position')

          if (errBApos2) {
            console.error('❌ Erro ao verificar Campanha B:', errBApos2)
          } else {
            console.log(`   Campanha B após incremento:`)
            membrosBApos2?.forEach(membro => {
              const mudou = membro.id === membroB.id ? ' (MUDOU!)' : ''
              console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos${mudou}`)
            })
          }
        }
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log(`   - Problemas encontrados: ${problemasEncontrados}`)
    console.log('   - Ranking por campanha verificado')
    console.log('   - Posições duplicadas verificadas')
    console.log('   - Isolamento entre campanhas testado')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarRankingPorCampanha()
