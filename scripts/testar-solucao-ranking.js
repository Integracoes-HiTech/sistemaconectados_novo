// =====================================================
// TESTE: SOLUÇÃO DEFINITIVA DE RANKING POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarSolucaoRanking() {
  console.log('🔍 Testando solução definitiva de ranking por campanha...\n')

  try {
    // 1. Executar a função de ranking corrigida
    console.log('📝 1. Executando função de ranking corrigida...')
    const { error } = await supabase.rpc('update_complete_ranking')
    
    if (error) {
      console.error('❌ Erro ao executar função de ranking:', error)
      return
    }
    
    console.log('✅ Função de ranking executada com sucesso')
    
    // 2. Verificar ranking por campanha
    console.log('\n📊 2. Verificando ranking por campanha:')
    
    const { data: rankingData, error: errRanking } = await supabase
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
    rankingData?.forEach(membro => {
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
    
    // 3. Verificar consistência das posições
    console.log('\n🔍 3. Verificando consistência das posições:')
    
    Object.keys(campanhas).forEach(campanha => {
      const membros = campanhas[campanha]
      const totalMembros = membros.length
      const posicoes = membros.map(m => m.ranking_position)
      const posicaoMaxima = Math.max(...posicoes)
      const posicoesUnicas = new Set(posicoes).size
      
      console.log(`   Campanha ${campanha}:`)
      console.log(`     Total de membros: ${totalMembros}`)
      console.log(`     Posição máxima: ${posicaoMaxima}`)
      console.log(`     Posições únicas: ${posicoesUnicas}`)
      console.log(`     Consistência: ${totalMembros === posicoesUnicas ? '✅' : '❌'}`)
    })
    
    // 4. Verificar desempate por data
    console.log('\n🔍 4. Verificando desempate por data:')
    
    Object.keys(campanhas).forEach(campanha => {
      const membros = campanhas[campanha]
      
      // Agrupar por quantidade de contratos
      const contratosPorQuantidade = {}
      membros.forEach(membro => {
        if (!contratosPorQuantidade[membro.contracts_completed]) {
          contratosPorQuantidade[membro.contracts_completed] = []
        }
        contratosPorQuantidade[membro.contracts_completed].push(membro)
      })
      
      console.log(`   Campanha ${campanha}:`)
      Object.keys(contratosPorQuantidade).forEach(contratos => {
        const membrosComMesmoContratos = contratosPorQuantidade[contratos]
        if (membrosComMesmoContratos.length > 1) {
          console.log(`     ${contratos} contratos (${membrosComMesmoContratos.length} membros):`)
          membrosComMesmoContratos.forEach(membro => {
            console.log(`       ${membro.ranking_position}º - ${membro.name} (${new Date(membro.created_at).toLocaleDateString('pt-BR')})`)
          })
        }
      })
    })
    
    // 5. Testar inserção de novo membro
    console.log('\n🧪 5. Testando inserção de novo membro:')
    
    // Inserir membro na Campanha A
    const { data: novoMembroA, error: errMembroA } = await supabase
      .from('members')
      .insert([{
        name: 'Teste Inserção A',
        phone: '61999999999',
        instagram: '@testeinserta',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 5,
        ranking_status: 'Amarelo',
        ranking_position: 999,
        is_top_1500: false,
        can_be_replaced: false,
        couple_name: 'Parceiro A',
        couple_phone: '61888888888',
        couple_instagram: '@parceiroa',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        is_friend: false,
        campaign: 'A'
      }])
      .select()
      .single()
    
    if (errMembroA) {
      console.error('❌ Erro ao inserir membro A:', errMembroA)
    } else {
      console.log('✅ Membro inserido na Campanha A')
    }
    
    // Aguardar trigger executar e verificar resultado
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const { data: rankingAposInsercao, error: errAposInsercao } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'A')
      .order('ranking_position')
    
    if (errAposInsercao) {
      console.error('❌ Erro ao verificar ranking após inserção:', errAposInsercao)
    } else {
      console.log('   Campanha A após inserção:')
      rankingAposInsercao?.forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
      })
    }
    
    // 6. Verificar isolamento entre campanhas
    console.log('\n🔍 6. Verificando isolamento entre campanhas:')
    
    const { data: rankingGeral, error: errGeral } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign')
      .order('ranking_position')
    
    if (errGeral) {
      console.error('❌ Erro ao verificar ranking geral:', errGeral)
    } else {
      console.log('   Ranking completo verificando isolamento:')
      rankingGeral?.forEach(membro => {
        console.log(`     Campanha ${membro.campaign}: ${membro.ranking_position}º - ${membro.name} (${membro.contracts_completed} contratos)`)
      })
      
      // Verificar se não há sobreposição de posições entre campanhas
      const posicoesPorCampanha = {}
      rankingGeral?.forEach(membro => {
        if (!posicoesPorCampanha[membro.campaign]) {
          posicoesPorCampanha[membro.campaign] = []
        }
        posicoesPorCampanha[membro.campaign].push(membro.ranking_position)
      })
      
      console.log('\n   Verificação de isolamento:')
      Object.keys(posicoesPorCampanha).forEach(campanha => {
        const posicoes = posicoesPorCampanha[campanha]
        const sequencial = posicoes.every((pos, index) => pos === index + 1)
        console.log(`     Campanha ${campanha}: ${posicoes.join(', ')} ${sequencial ? '✅ Sequencial' : '❌ Não sequencial'}`)
      })
    }
    
    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo da solução:')
    console.log('   - Função update_complete_ranking() corrigida')
    console.log('   - Ranking calculado por campanha (PARTITION BY campaign)')
    console.log('   - Ordenação: contracts_completed DESC, created_at ASC')
    console.log('   - Trigger automático para inserções/atualizações')
    console.log('   - Isolamento completo entre Campanhas A e B')
    console.log('   - Posições sequenciais (1, 2, 3, 4...) por campanha')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarSolucaoRanking()
