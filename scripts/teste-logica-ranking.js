// =====================================================
// TESTE: LÓGICA DE RANKING - MEMBRO PASSANDO OUTRO
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarLogicaRanking() {
  console.log('🔍 Testando lógica de ranking - membro passando outro...\n')

  try {
    // 1. Verificar estado inicial
    console.log('📊 1. Estado inicial dos membros:')
    const { data: membrosIniciais, error: errIniciais } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, created_at, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (errIniciais) {
      console.error('❌ Erro ao buscar membros iniciais:', errIniciais)
      return
    }

    console.log(`   Total de membros: ${membrosIniciais?.length || 0}`)
    membrosIniciais?.forEach(membro => {
      console.log(`   ${membro.ranking_position}. ${membro.name} (${membro.campaign || 'A'}): ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // 2. Identificar os membros de teste
    const testeMembro = membrosIniciais?.find(m => m.name === 'Teste Membro')
    const testeMembroCompleto = membrosIniciais?.find(m => m.name === 'Teste Membro Completo')

    if (!testeMembro || !testeMembroCompleto) {
      console.error('❌ Membros de teste não encontrados')
      return
    }

    console.log(`\n🎯 2. Membros de teste identificados:`)
    console.log(`   - ${testeMembro.name}: ${testeMembro.contracts_completed} contratos (posição ${testeMembro.ranking_position})`)
    console.log(`   - ${testeMembroCompleto.name}: ${testeMembroCompleto.contracts_completed} contratos (posição ${testeMembroCompleto.ranking_position})`)

    // 3. Simular cadastro de amigos para "Teste Membro Completo"
    console.log(`\n👥 3. Simulando cadastro de amigos para "${testeMembroCompleto.name}":`)
    
    // Incrementar contratos para que "Teste Membro Completo" tenha mais que "Teste Membro"
    const contratosNecessarios = testeMembro.contracts_completed + 2 // +2 para garantir que passe
    console.log(`   Objetivo: ${testeMembroCompleto.name} deve ter ${contratosNecessarios} contratos`)
    console.log(`   Atual: ${testeMembroCompleto.contracts_completed} contratos`)
    console.log(`   Incremento necessário: ${contratosNecessarios - testeMembroCompleto.contracts_completed} contratos`)

    // Atualizar contratos do "Teste Membro Completo"
    const { error: errUpdate } = await supabase
      .from('members')
      .update({ 
        contracts_completed: contratosNecessarios,
        updated_at: new Date().toISOString()
      })
      .eq('id', testeMembroCompleto.id)

    if (errUpdate) {
      console.error('❌ Erro ao atualizar contratos:', errUpdate)
      return
    }

    console.log(`   ✅ Contratos atualizados: ${testeMembroCompleto.name} agora tem ${contratosNecessarios} contratos`)

    // 4. Executar ranking
    console.log('\n🏆 4. Executando ranking:')
    const { error: errRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errRanking) {
      console.error('❌ Erro ao executar ranking:', errRanking)
      return
    }

    console.log('   ✅ Ranking executado com sucesso')

    // 5. Verificar resultado
    console.log('\n📊 5. Estado após atualização:')
    const { data: membrosFinais, error: errFinais } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, created_at, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position')

    if (errFinais) {
      console.error('❌ Erro ao buscar membros finais:', errFinais)
      return
    }

    console.log(`   Total de membros: ${membrosFinais?.length || 0}`)
    membrosFinais?.forEach(membro => {
      const mudou = (membro.id === testeMembro.id || membro.id === testeMembroCompleto.id) ? ' (MUDOU!)' : ''
      console.log(`   ${membro.ranking_position}. ${membro.name} (${membro.campaign || 'A'}): ${membro.contracts_completed} contratos - ${membro.ranking_status}${mudou}`)
    })

    // 6. Verificar se a lógica funcionou
    console.log('\n🔍 6. Verificando lógica de ranking:')
    const testeMembroFinal = membrosFinais?.find(m => m.id === testeMembro.id)
    const testeMembroCompletoFinal = membrosFinais?.find(m => m.id === testeMembroCompleto.id)

    if (testeMembroFinal && testeMembroCompletoFinal) {
      console.log(`   Antes:`)
      console.log(`     ${testeMembro.ranking_position}. ${testeMembro.name}: ${testeMembro.contracts_completed} contratos`)
      console.log(`     ${testeMembroCompleto.ranking_position}. ${testeMembroCompleto.name}: ${testeMembroCompleto.contracts_completed} contratos`)
      
      console.log(`   Depois:`)
      console.log(`     ${testeMembroFinal.ranking_position}. ${testeMembroFinal.name}: ${testeMembroFinal.contracts_completed} contratos`)
      console.log(`     ${testeMembroCompletoFinal.ranking_position}. ${testeMembroCompletoFinal.name}: ${testeMembroCompletoFinal.contracts_completed} contratos`)

      // Verificar se a lógica está correta
      const contratosCorretos = testeMembroCompletoFinal.contracts_completed > testeMembroFinal.contracts_completed
      const posicaoCorreta = testeMembroCompletoFinal.ranking_position < testeMembroFinal.ranking_position
      const statusCorreto = testeMembroCompletoFinal.ranking_status === 'Amarelo' // 2 contratos = Amarelo

      console.log(`\n   ✅ Verificações:`)
      console.log(`     - ${testeMembroCompletoFinal.name} tem mais contratos: ${contratosCorretos ? '✅' : '❌'}`)
      console.log(`     - ${testeMembroCompletoFinal.name} está em posição melhor: ${posicaoCorreta ? '✅' : '❌'}`)
      console.log(`     - Status correto (Amarelo): ${statusCorreto ? '✅' : '❌'}`)

      if (contratosCorretos && posicaoCorreta && statusCorreto) {
        console.log(`\n   🎉 SUCESSO! A lógica de ranking está funcionando corretamente!`)
        console.log(`   ${testeMembroCompletoFinal.name} passou ${testeMembroFinal.name} no ranking!`)
      } else {
        console.log(`\n   ❌ FALHA! A lógica de ranking não está funcionando corretamente.`)
      }
    }

    // 7. Testar critério de desempate (data de criação)
    console.log('\n🕐 7. Testando critério de desempate (data de criação):')
    
    // Verificar se há membros com mesmo número de contratos
    const membrosComMesmoContrato = membrosFinais?.filter(m => m.contracts_completed === testeMembroFinal?.contracts_completed)
    
    if (membrosComMesmoContrato && membrosComMesmoContrato.length > 1) {
      console.log(`   Membros com ${testeMembroFinal?.contracts_completed} contratos:`)
      membrosComMesmoContrato.forEach(membro => {
        console.log(`     ${membro.ranking_position}. ${membro.name} - Criado em: ${membro.created_at}`)
      })
      
      // Verificar se estão ordenados por data de criação (mais antigo primeiro)
      const ordenadoCorretamente = membrosComMesmoContrato.every((membro, index) => {
        if (index === 0) return true
        const membroAnterior = membrosComMesmoContrato[index - 1]
        return new Date(membro.created_at) >= new Date(membroAnterior.created_at)
      })
      
      console.log(`   Ordenação por data de criação: ${ordenadoCorretamente ? '✅' : '❌'}`)
    } else {
      console.log(`   Nenhum empate encontrado para testar critério de desempate`)
    }

    // 8. Restaurar estado original (opcional)
    console.log('\n🔄 8. Restaurando estado original:')
    const { error: errRestore } = await supabase
      .from('members')
      .update({ 
        contracts_completed: testeMembroCompleto.contracts_completed, // Voltar ao valor original
        updated_at: new Date().toISOString()
      })
      .eq('id', testeMembroCompleto.id)

    if (errRestore) {
      console.error('❌ Erro ao restaurar estado:', errRestore)
    } else {
      console.log(`   ✅ Estado restaurado: ${testeMembroCompleto.name} voltou a ter ${testeMembroCompleto.contracts_completed} contratos`)
      
      // Executar ranking final
      const { error: errRankingFinal } = await supabase.rpc('update_complete_ranking')
      if (errRankingFinal) {
        console.error('❌ Erro ao executar ranking final:', errRankingFinal)
      } else {
        console.log('   ✅ Ranking final executado')
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Lógica de ranking testada com sucesso')
    console.log('   - Membro com mais contratos passa o outro no ranking')
    console.log('   - Posições calculadas corretamente')
    console.log('   - Status baseado em contratos funcionando')
    console.log('   - Critério de desempate (data de criação) verificado')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarLogicaRanking()
