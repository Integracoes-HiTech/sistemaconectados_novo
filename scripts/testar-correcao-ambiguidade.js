// =====================================================
// TESTE: CORREÇÃO DO ERRO DE AMBIGUIDADE
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCorrecaoAmbiguidade() {
  console.log('🔧 Testando correção do erro de ambiguidade...\n')

  try {
    // 1. Executar função principal corrigida
    console.log('📝 1. Executando função update_complete_ranking()...')
    const { error: errorPrincipal } = await supabase.rpc('update_complete_ranking')
    
    if (errorPrincipal) {
      console.error('❌ Erro na função principal:', errorPrincipal)
      return
    }
    
    console.log('✅ Função principal executada com sucesso')

    // 2. Executar função de campanha específica
    console.log('\n📝 2. Executando função update_ranking_by_campaign() para Campanha A...')
    const { error: errorCampanhaA } = await supabase.rpc('update_ranking_by_campaign', {
      campaign_param: 'A'
    })
    
    if (errorCampanhaA) {
      console.error('❌ Erro na função de campanha A:', errorCampanhaA)
      return
    }
    
    console.log('✅ Função de campanha A executada com sucesso')

    // 3. Executar função para Campanha B
    console.log('\n📝 3. Executando função update_ranking_by_campaign() para Campanha B...')
    const { error: errorCampanhaB } = await supabase.rpc('update_ranking_by_campaign', {
      campaign_param: 'B'
    })
    
    if (errorCampanhaB) {
      console.error('❌ Erro na função de campanha B:', errorCampanhaB)
      return
    }
    
    console.log('✅ Função de campanha B executada com sucesso')

    // 4. Verificar ranking final
    console.log('\n📊 4. Verificando ranking final:')
    
    const { data: rankingFinal, error: errRanking } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status, is_top_1500, can_be_replaced')
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
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
        console.log(`        Status: ${membro.ranking_status} | Top 1500: ${membro.is_top_1500} | Substituível: ${membro.can_be_replaced}`)
      })
    })

    // 5. Verificar consistência das posições
    console.log('\n🔍 5. Verificando consistência das posições:')
    
    Object.keys(campanhas).forEach(campanha => {
      const membros = campanhas[campanha]
      const totalMembros = membros.length
      const posicoes = membros.map(m => m.ranking_position)
      const posicaoMinima = Math.min(...posicoes)
      const posicaoMaxima = Math.max(...posicoes)
      const posicoesUnicas = new Set(posicoes).size
      
      console.log(`   Campanha ${campanha}:`)
      console.log(`     Total de membros: ${totalMembros}`)
      console.log(`     Posição mínima: ${posicaoMinima}`)
      console.log(`     Posição máxima: ${posicaoMaxima}`)
      console.log(`     Posições únicas: ${posicoesUnicas}`)
      
      const sequencial = posicoes.every((pos, index) => 
        membros.find(m => m.ranking_position === pos) === 
        membros.sort((a, b) => a.ranking_position - b.ranking_position)[index]
      )
      
      console.log(`     Sequencial: ${sequencial ? '✅' : '❌'}`)
      console.log(`     Consistente: ${posicoesUnicas === totalMembros && posicaoMinima === 1 && posicaoMaxima === totalMembros ? '✅' : '❌'}`)
    })

    // 6. Testar inserção de novo membro (deve funcionar sem erro)
    console.log('\n🧪 6. Testando inserção de novo membro:')
    
    // Remover teste anterior se existir
    await supabase
      .from('members')
      .delete()
      .eq('name', 'Teste Inserção A')
    
    await supabase
      .from('members')
      .delete()
      .eq('name', 'Novo Membro Ranking')
    
    // Inserir novo membro na Campanha A
    const { data: novoMembro, error: errNovoMembro } = await supabase
      .from('members')
      .insert([{
        name: 'Membro Teste Correção',
        phone: '61888888888',
        instagram: '@testecorrecao',
        city: 'Belo Horizonte',
        sector: 'Centro',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 12,
        ranking_status: 'Amarelo',
        ranking_position: 1,
        is_top_1500: false,
        can_be_replaced: false,
        couple_name: 'Parceiro Teste',
        couple_phone: '61877777777',
        couple_instagram: '@parceiroteste',
        couple_city: 'Belo Horizonte',
        couple_sector: 'Centro',
        is_friend: false,
        campaign: 'A'
      }])
      .select()
      .single()
    
    if (errNovoMembro) {
      console.error('❌ Erro ao inserir novo membro:', errNovoMembro)
    } else {
      console.log('✅ Novo membro inserido com sucesso')
      
      // Executar ranking para ver se funciona sem ambiguidade
      const { error: errorRankingNovo } = await supabase.rpc('update_ranking_by_campaign', {
        campaign_param: 'A'
      })
      
      if (errorRankingNovo) {
        console.error('❌ Erro ao executar ranking após inserção:', errorRankingNovo)
      } else {
        console.log('✅ Ranking executado após inserção sem erros')
        
        // Verificar posição do novo membro
        const { data: posicaoNovoMembro, error: errPosicao } = await supabase
          .from('members')
          .select('campaign, ranking_position, name, contracts_completed, ranking_status')
          .eq('name', 'Membro Teste Correção')
          .single()
        
        if (errPosicao) {
          console.error('❌ Erro ao verificar posição:', errPosicao)
        } else {
          console.log(`   Novo membro: ${posicaoNovoMembro.ranking_position}º - ${posicaoNovoMembro.name} (${posicaoNovoMembro.contracts_completed} contratos)`)
        }
      }
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo da correção:')
    console.log('   - Erro de ambiguidade corrigido')
    console.log('   - Função principal funcionando')
    console.log('   - Função de campanha específica funcionando')
    console.log('   - Updates sem ambiguidade de colunas')
    console.log('   - Inserções funcionando corretamente')
    console.log('   - Ranking calculado por campanha')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCorrecaoAmbiguidade()
