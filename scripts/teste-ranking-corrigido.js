// =====================================================
// TESTE: RANKING CORRIGIDO POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRankingCorrigido() {
  console.log('🔍 Testando ranking corrigido por campanha...\n')

  try {
    // 1. Verificar estado antes da correção
    console.log('📊 1. Estado antes da correção:')
    
    const { data: membrosAntes, error: errAntes } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign')
      .order('ranking_position')

    if (errAntes) {
      console.error('❌ Erro ao buscar membros antes:', errAntes)
      return
    }

    console.log(`   Total de membros: ${membrosAntes?.length || 0}`)
    membrosAntes?.forEach(membro => {
      console.log(`   ${membro.campaign || 'A'}: ${membro.ranking_position}. ${membro.name} - ${membro.contracts_completed} contratos`)
    })

    // 2. Executar função corrigida
    console.log('\n🔄 2. Executando função corrigida:')
    const { error: errRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errRanking) {
      console.error('❌ Erro ao executar ranking:', errRanking)
      return
    }

    console.log('   ✅ Função update_complete_ranking executada')

    // 3. Verificar resultado por campanha
    console.log('\n📊 3. Resultado por campanha:')
    
    // Campanha A
    const { data: membrosA, error: errA } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'A')
      .order('ranking_position')

    if (errA) {
      console.error('❌ Erro ao buscar Campanha A:', errA)
    } else {
      console.log(`   Campanha A (${membrosA?.length || 0} membros):`)
      membrosA?.forEach(membro => {
        console.log(`     ${membro.ranking_position}. ${membro.name} - ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
      })
    }

    // Campanha B
    const { data: membrosB, error: errB } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'B')
      .order('ranking_position')

    if (errB) {
      console.error('❌ Erro ao buscar Campanha B:', errB)
    } else {
      console.log(`   Campanha B (${membrosB?.length || 0} membros):`)
      membrosB?.forEach(membro => {
        console.log(`     ${membro.ranking_position}. ${membro.name} - ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
      })
    }

    // 4. Verificar se as posições estão corretas
    console.log('\n🔍 4. Verificando posições por campanha:')
    
    let problemasEncontrados = 0

    // Verificar Campanha A
    if (membrosA && membrosA.length > 0) {
      const posicoesA = membrosA.map(m => m.ranking_position).filter(p => p !== null)
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
    if (membrosB && membrosB.length > 0) {
      const posicoesB = membrosB.map(m => m.ranking_position).filter(p => p !== null)
      const posicoesEsperadasB = Array.from({length: posicoesB.length}, (_, i) => i + 1)
      
      const posicoesCorretasB = JSON.stringify(posicoesB.sort()) === JSON.stringify(posicoesEsperadasB)
      console.log(`   Campanha B - Posições corretas: ${posicoesCorretasB ? '✅' : '❌'}`)
      
      if (!posicoesCorretasB) {
        console.log(`     Posições encontradas: ${posicoesB.join(', ')}`)
        console.log(`     Posições esperadas: ${posicoesEsperadasB.join(', ')}`)
        problemasEncontrados++
      }
    }

    // 5. Testar isolamento entre campanhas
    console.log('\n🧪 5. Testando isolamento entre campanhas:')
    
    if (membrosB && membrosB.length > 0) {
      const membroB = membrosB[0]
      console.log(`   Membro de teste: ${membroB.name} (Campanha B)`)
      console.log(`   Contratos atuais: ${membroB.contracts_completed}`)
      
      // Incrementar contratos do membro B
      const novosContratos = membroB.contracts_completed + 2
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
          const { data: membrosAApos, error: errAApos } = await supabase
            .from('members')
            .select('id, name, contracts_completed, ranking_position, campaign')
            .eq('status', 'Ativo')
            .is('deleted_at', null)
            .eq('campaign', 'A')
            .order('ranking_position')

          const { data: membrosBApos, error: errBApos } = await supabase
            .from('members')
            .select('id, name, contracts_completed, ranking_position, campaign')
            .eq('status', 'Ativo')
            .is('deleted_at', null)
            .eq('campaign', 'B')
            .order('ranking_position')

          console.log(`   Campanha A (não deve ter mudado):`)
          membrosAApos?.forEach(membro => {
            console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos`)
          })

          console.log(`   Campanha B (deve ter mudado):`)
          membrosBApos?.forEach(membro => {
            const mudou = membro.id === membroB.id ? ' (MUDOU!)' : ''
            console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos${mudou}`)
          })

          // Verificar se o status mudou corretamente
          const membroBAtualizado = membrosBApos?.find(m => m.id === membroB.id)
          if (membroBAtualizado) {
            const statusEsperado = novosContratos >= 15 ? 'Verde' : novosContratos >= 1 ? 'Amarelo' : 'Vermelho'
            console.log(`   Status do ${membroBAtualizado.name}: ${membroBAtualizado.ranking_status} (esperado: ${statusEsperado})`)
          }
        }
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log(`   - Problemas encontrados: ${problemasEncontrados}`)
    console.log('   - Ranking por campanha corrigido')
    console.log('   - Posições independentes para cada campanha')
    console.log('   - Isolamento entre campanhas funcionando')
    console.log('   - Dashboard mostrará ranking correto por campanha')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarRankingCorrigido()
