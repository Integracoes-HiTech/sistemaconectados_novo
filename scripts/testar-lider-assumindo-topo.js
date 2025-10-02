// =====================================================
// TESTE ESPECÍFICO: MEMBRO LÍDER ASSUMINDO TOPO DA TABELA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarLiderAssumindoTopo() {
  console.log('🏆 Testando cenário específico: novo líder assumindo o topo...\n')

  try {
    // Limpar dados específicos de teste
    console.log('📝 1. Limpando dados específicos de teste...')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE LÍDER%')

    // Executar ranking para organizar tudo primeiro
    await supabase.rpc('update_complete_ranking')

    // Verificar estado inicial da Campanha A
    console.log('\n📊 2. Estado inicial da Campanha A (para comparação):')
    
    const { data: estadoInicialA, error: errInicialA } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errInicialA) {
      console.error('❌ Erro ao buscar estado inicial Campanha A:', errInicialA)
      return
    }

    console.log(`   📋 Campanha A (${estadoInicialA.length} membros):`)
    estadoInicialA?.forEach(membro => {
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})`)
    })

    // 3. INSERIR NOVO LÍDER QUE DEVE ASSUMIR O TOPO
    console.log('\n🚀 3. Inserindo novo líder (deve assumir 1º lugar):')
    
    const novoLider = {
      name: 'TESTE LÍDER SUPREMO A',
      phone: '61999999999',
      instagram: '@teste_lider_a',
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'Admin',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      contracts_completed: 100, // Muitíssimos contratos - deve ser #1 absoluto
      ranking_status: 'Verde',
      ranking_position: null, // Sistema automático vai definir
      is_top_1500: true,
      can_be_replaced: false,
      couple_name: 'Parceiro Supremo A',
      couple_phone: '61899999999',
      couple_instagram: '@parceiro_supremo_a',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: false,
      campaign: 'A'
    }

    const { data: liderInserido, error: errLider } = await supabase
      .from('members')
      .insert([novoLider])
      .select('name, contracts_completed, ranking_position, campaign, created_at')
      .single()

    if (errLider) {
      console.error('❌ Erro ao inserir novo líder:', errLider.message)
      return
    }

    console.log(`   ✅ Novo líder inserido: ${liderInserido.name}`)
    console.log(`     Contratos: ${liderInserido.contracts_completed}`)
    console.log(`     Posição imediata: ${liderInserido.ranking_position || 'NULL (ainda não calculada)'}`)
    console.log(`     Campanha: ${liderInserido.campaign}")
    console.log(`     Criado em: ${liderInserido.created_at}`)

    // Aguardar trigger executar automaticamente
    console.log('\n⏱️ Aguardando trigger automático executar (5 segundos)...')
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Verificar se o trigger funcionou automaticamente
    console.log('\n🔍 4. Verificando se trigger automático funcionou:')
    
    const { data: verificacaoTrigger, error: errTrigger } = await supabase
      .from('members')
      .select('name, contracts_completed, ranking_position, ranking_status')
      .eq('name', 'TESTE LÍDER SUPREMO A')
      .single()

    if (errTrigger) {
      console.error('❌ Erro ao verificar líder após trigger:', errTrigger)
    } else {
      console.log(`   📍 Status após trigger:`)
      console.log(`     Posição: ${verificacaoTrigger.ranking_position}º`)
      console.log(`     Status: ${verificacaoTrigger.ranking_status}`)
      
      if (verificacaoTrigger.ranking_position === 1) {
        console.log(`     ✅ LÍDER AUTOMATICAMENTE EM 1º LUGAR!`)
      } else {
        console.log(`     ❌ LÍDER NÃO ESTÁ EM 1º LUGAR! Posição: ${verificacaoTrigger.ranking_position}º`)
      }
    }

    // 5. EXECUTAR RANKING MANUAL PARA GARANTIR (como faz o frontend depois)
    console.log('\n🔄 5. Executando ranking manual (como frontend após inserção):')
    
    const { error: errorRankingManual } = await supabase.rpc('update_complete_ranking')
    
    if (errorRankingManual) {
      console.error('❌ Erro ao executar ranking manual:', errorRankingManual.message)
    } else {
      console.log('✅ Ranking manual executado')
    }

    // Aguardar processamento final
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 6. VERIFICAÇÃO FINAL - RANKING COMPLETO DA CAMPANHA A
    console.log('\n📊 6. Verificação final - ranking completo da Campanha A:')
    
    const { data: rankingFinalA, error: errFinalA } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status, created_at')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errFinalA) {
      console.error('❌ Erro ao buscar ranking final:', errFinalA)
      return
    }

    console.log(`   📋 Campanha A FINAL (${rankingFinalA.length} membros):`)
    rankingFinalA?.forEach((membro, index) => {
      const marcadorNovo = membro.name === 'TESTE LÍDER SUPREMO A' ? ' 🏆 NOVO LÍDER' : ''
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})${marcadorNovo}`)
    })

    // 7. ANÁLISE DETALHADA
    console.log('\n🎯 7. Análise detalhada:')
    
    const novoLiderFinal = rankingFinalA?.find(m => m.name === 'TESTE LÍDER SUPREMO A')
    
    if (novoLiderFinal) {
      console.log(`   🏆 ANÁLISE DO NOVO LÍDER:`)
      console.log(`     Nome: ${novoLiderFinal.name}`)
      console.log(`     Contratos: ${novoLiderFinal.contracts_completed}`)
      console.log(`     Posição atual: ${novoLiderFinal.ranking_position}º`)
      console.log(`     Status: ${novoLiderFinal.ranking_status}`)
      console.log(`     Criado em: ${novoLiderFinal.created_at}`)
      
      // Verificar se realmente tem mais contratos que todos
      const temMaisContratos = rankingFinalA?.every(m => m === novoLiderFinal || m.contracts_completed <= novoLiderFinal.contracts_completed) || false
      
      if (temMaisContratos && novoLiderFinal.ranking_position === 1) {
        console.log(`     ✅ POSICIONAMENTO PERFEITO!`)
        console.log(`     ✅ Tem mais contratos que todos os outros`)
        console.log(`         Está exatamente em 1º lugar`)
      } else {
        console.log(`     ❌ PROBLEMA DE POSICIONAMENTO!`)
        
        if (!temMaisContratos) {
          console.log(`         ❌ Não tem mais contratos que todos os outros`)
        }
        
        if (novoLiderFinal.ranking_position !== 1) {
          console.log(`         ❌ Não está em 1º lugar (atual: ${novoLiderFinal.ranking_position}º)`)
        }
      }
    } else {
      console.log(`   ❌ NOVO LÍDER NÃO ENCONTRADO!`)
    }

    // 8. VERIFICAR INTEGRIDADE GERAL
    console.log('\n🔍 8. Verificando integridade geral:')
    
    const posicoes = rankingFinalA?.map(m => m.ranking_position) || []
    const posicaoMinima = Math.min(...posicoes)
    const posicaoMaxima = Math.max(...posicoes)
    const posicoesUnicas = new Set(posicoes).size
    const totalMembros = rankingFinalA?.length || 0

    console.log(`   📊 Estatísticas da Campanha A:`)
    console.log(`     Total: ${totalMembros}`)
    console.log(`     Posições: ${posicaoMinima} a ${posicaoMaxima}`)
    console.log(`     Sequential: ${posicaoMinima === 1 && posicaoMaxima === totalMembros ? '✅' : '❌'}`)
    console.log(`     Únicas: ${posicoesUnicas === totalMembros ? '✅' : '❌'}`)
    console.log(`     Sem duplicatas: ${posicoesUnicas === totalMembros ? '✅' : '❌'}`)

    // Verificar ordenação
    let ordenacaoIdeal = true
    for (let i = 0; i < rankingFinalA.length - 1; i++) {
      const atual = rankingFinalA[i]
      const proximo = rankingFinalA[i + 1]
      
      if (atual.contracts_completed < proximo.contracts_completed) {
        ordenacaoIdeal = false
        console.log(`     ❌ Ordenação quebrada: ${atual.name} (${atual.contracts_completed}) depois de ${proximo.name} (${proximo.contracts_completed})`)
      }
    }
    
    if (ordenacaoIdeal) {
      console.log(`     ✅ Ordenação por contratos está perfeita`)
    }

    console.log('\n✅ Teste do líder assumindo topo concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Novo líder inserido com contratos supremos')
    console.log('   - Trigger automático verificado')
    console.log('   - Ranking manual executado')
    console.log('   - Posição do líder verificada')
    console.log('   - Integridade geral verificada')
    console.log('   - Ordenação por contratos verificada')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarLiderAssumindoTopo()
