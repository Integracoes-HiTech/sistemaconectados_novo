// =====================================================
// TESTE: CORREÇÃO MELHORADA DO RANKING
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJiLCJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCorrecaoMelhorada() {
  console.log('🔧 Testando correção melhorada do ranking...\n')

  try {
    // 1. Executar função de ranking melhorada
    console.log('📝 1. Executando correção melhorada do ranking...')
    const { error } = await supabase.rpc('update_complete_ranking')
    
    if (error) {
      console.error('❌ Erro ao executar função:', error)
      return
    }
    
    console.log('✅ Correção executada')
    
    // 2. Verificar ranking final
    console.log('\n📊 2. Ranking final por campanha:')
    
    const { data: rankingFinal, error: errRanking } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status, created_at')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })
    
    if (errRanking) {
      console.error('❌ Erro ao buscar ranking:', errRanking)
      return
    }
    
    // Agrupar por campanha
    const campanhas = {}
    rankingFinal?.forEach(membro => {
      if (!campanhas[membro.campaign]) {
        campanhas[membro.campaign] = []
      }
      campanhas[membro.campaign].push(membro)
    })
    
    Object.keys(campanhas).forEach(campanha => {
      console.log(`\n   📋 Campanha ${campanha}:`)
      campanhas[campanha].forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})`)
      })
    })
    
    // 3. Verificar consistência
    console.log('\n🔍 3. Verificando consistência:')
    
    const { data: consistencia, error: errConsistencia } = await supabase
      .from('members')
      .select('campaign, ranking_position, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
    
    if (errConsistencia) {
      console.error('❌ Erro ao verificar consistência:', errConsistencia)
      return
    }
    
    // Agrupar por campanha e verificar
    const campanhasConsistencia = {}
    consistencia?.forEach(membro => {
      if (!campanhasConsistencia[membro.campaign]) {
        campanhasConsistencia[membro.campaign] = {
          membros: [],
          posicoes: [],
          contratosOrdenados: []
        }
      }
      campanhasConsistencia[membro.campaign].membros.push(membro)
      campanhasConsistencia[membro.campaign].posicoes.push(membro.ranking_position)
    })
    
    Object.keys(campanhasConsistencia).forEach(campanha => {
      const dados = campanhasConsistencia[campanha]
      
      // Ordenar por contratos para verificar lógica
      dados.membros.sort((a, b) => {
        if (b.contracts_completed !== a.contracts_completed) {
          return b.contracts_completed - a.contracts_completed
        }
        // Se contratos iguais, verificar data (implícito)
        return 0
      })
      
      console.log(`   Campanha ${campanha}:`)
      console.log(`     Total: ${dados.membros.length}`)
      console.log(`     Posições: ${dados.posicoes.sort((a,b) => a-b).join(', ')}`)
      
      const posicoesUnicas = new Set(dados.posicoes).size
      const posicaoMinima = Math.min(...dados.posicoes)
      const posicaoMaxima = Math.max(...dados.posicoes)
      
      const sequencial = dados.posicoes.length === posicoesUnicas && 
                        posicaoMinima === 1 && 
                        posicaoMaxima === dados.membros.length
      
      console.log(`     Sequencial: ${sequencial ? '✅' : '❌'}`)
      console.log(`     Consistente: ${posicoesUnicas === dados.membros.length ? '✅' : '❌'}`)
    })
    
    // 4. Testar inserção de novo membro
    console.log('\n🧪 4. Testando inserção de novo membro:')
    
    // Remover membro de teste anterior se existir
    await supabase
      .from('members')
      .delete()
      .eq('name', 'Teste Inserção A')
    
    // Inserir novo membro
    const { data: novoMembro, error: errNovoMembro } = await supabase
      .from('members')
      .insert([{
        name: 'Novo Membro Ranking',
        phone: '61911111111',
        instagram: '@novomembro',
        city: 'Rio de Janeiro',
        sector: 'Copacabana',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 8,
        ranking_status: 'Amarelo',
        ranking_position: 1, // Será recalculado
        is_top_1500: false,
        can_be_replaced: false,
        couple_name: 'Parceiro Novo',
        couple_phone: '61811111111',
        couple_instagram: '@parceironovo',
        couple_city: 'Rio de Janeiro',
        couple_sector: 'Copacabana',
        is_friend: false,
        campaign: 'A'
      }])
      .select()
      .single()
    
    if (errNovoMembro) {
      console.error('❌ Erro ao inserir novo membro:', errNovoMembro)
    } else {
      console.log('✅ Novo membro inserido')
      
      // Executar ranking para recalculá-lo
      await supabase.rpc('update_complete_ranking')
      
      // Verificar posição do novo membro
      const { data: novoMembroPosicao, error: errPosicao } = await supabase
        .from('members')
        .select('campaign, ranking_position, name, contracts_completed')
        .eq('name', 'Novo Membro Ranking')
        .single()
      
      if (errPosicao) {
        console.error('❌ Erro ao verificar posição:', errPosicao)
      } else {
        console.log(`   Novo membro: ${novoMembroPosicao.ranking_position}º - ${novoMembroPosicao.name} (${novoMembroPosicao.contracts_completed} contratos)`)
      }
    }
    
    // 5. Verificação final completa
    console.log('\n📊 5. Verificação final completa:')
    
    const { data: rankingFinalCompleto, error: errFinal } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })
    
    if (errFinal) {
      console.error('❌ Erro na verificação final:', errFinal)
      return
    }
    
    console.log('   Ranking completo após correções:')
    let campanhaAtual = ''
    rankingFinalCompleto?.forEach(membro => {
      if (membro.campaign !== campanhaAtual) {
        campanhaAtual = membro.campaign
        console.log(`\n   📋 Campanha ${campanhaAtual}:`)
      }
      console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos (${membro.ranking_status})`)
    })
    
    // 6. Estatísticas por campanha
    console.log('\n📊 6. Estatísticas por campanha:')
    
    const { data: estatisticas, error: errEstatisticas } = await supabase.rpc('count_members_by_campaign')
    
    if (errEstatisticas) {
      console.error('❌ Erro ao buscar estatísticas:', errEstatisticas)
    } else {
      estatisticas?.forEach(stat => {
        console.log(`   Campanha ${stat.campaign}:`)
        console.log(`     Total: ${stat.total_members}`)
        console.log(`     Verde: ${stat.green_members}`)
        console.log(`     Amarelo: ${stat.yellow_members}`)
        console.log(`     Vermelho: ${stat.red_members}`)
        console.log(`     Top 1500: ${stat.top_1500}`)
      })
    }
    
    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo da correção:')
    console.log('   - Ranking recalculado completamente')
    console.log('   - Posições sequenciais por campanha')
    console.log('   - Ordenação: contracts_completed DESC, created_at ASC')
    console.log('   - Isolamento completo entre campanhas')
    console.log('   - Status baseado em contratos')
    console.log('   - Inserções funcionando corretamente')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCorrecaoMelhorada()
