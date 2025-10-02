// =====================================================
// TESTE: PROBLEMA DO TRIGGER DE RANKING
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarTriggerRanking() {
  console.log('🔍 Testando problema do trigger de ranking...\n')

  try {
    // 1. Limpar dados de teste anteriores
    console.log('📝 1. Limpando dados de teste anteriores...')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE RANKING%')

    // Executar ranking para organizar tudo primeiro
    await supabase.rpc('update_complete_ranking')

    // 2. Verificar ranking inicial
    console.log('\n📊 2. Verificando ranking inicial por campanha:')
    
    const { data: rankingInicial, error: errInicial } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })

    if (errInicial) {
      console.error('❌ Erro ao buscar ranking inicial:', errInicial)
      return
    }

    // Agrupar por campanha
    const campanhasInicial = {}
    rankingInicial?.forEach(membro => {
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

    // 3. Inserir novo membro com muitos contratos (deve assumir o topo da Campanha A)
    console.log('\n🧪 3. Inserindo novo membro com 25 contratos (deve assumir TOPO):')
    
    const { data: novoMembroTopo, error: errNovoTopo } = await supabase
      .from('members')
      .insert([{
        name: 'NOVO LÍDER Campanha A',
        phone: '61999999999',
        instagram: '@novo_lider_a',
        city: 'Brasília',
        sector: 'Lago Sul',
        referrer: 'Admin',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 25, // Muitos contratos - deve ser o número 1
        ranking_status: 'Verde',
        ranking_position: 1,
        is_top_1500: true,
        can_be_replaced: false,
        couple_name: 'Parceiro Líder',
        couple_phone: '61888888888',
        couple_instagram: '@parceiro_lider',
        couple_city: 'Brasília',
        couple_sector: 'Lago Sul',
        is_friend: false,
        campaign: 'A'
      }])
      .select()
      .single()

    if (errNovoTopo) {
      console.error('❌ Erro ao inserir novo líder:', errNovoTopo)
      return
    }

    console.log('✅ Novo líder inserido com sucesso')
    console.log(`   Nome: ${novoMembroTopo.name}`)
    console.log(`   Contratos: ${novoMembroTopo.contracts_completed}`)
    console.log(`   Campanha: ${novoMembroTopo.campaign}`)

    // Aguardar trigger executar
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. Verificar ranking após inserção (VERIFICAR SE O TRIGGER FUNCIONOU)
    console.log('\n🔍 4. Verificando ranking APÓS inserir líder (trigger deveria ter funcionado):')
    
    const { data: rankingAposLider, error: errAposLider } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })

    if (errAposLider) {
      console.error('❌ Erro ao buscar ranking após líder:', errAposLider)
      return
    }

    // Verificar se há problemas
    const problemasEncontrados = []
    
    rankingAposLider?.forEach(membro => {
      if (membro.name === 'NOVO LÍDER Campanha A') {
        console.log(`\n   🏆 VERIFICAÇÃO DO NOVO LÍDER:`)
        console.log(`     Posição atual: ${membro.ranking_position}º`)
        console.log(`     Contratos: ${membro.contracts_completed}`)
        
        if (membro.ranking_position !== 1) {
          problemasEncontrados.push(`❌ Novo líder não está em 1º lugar da Campanha A`)
        } else {
          console.log(`     ✅ Está em 1º lugar da Campanha A`)
        }
      }
    })

    // Verificar consistência geral
    const campanhasAposLider = {}
    rankingAposLider?.forEach(membro => {
      if (!campanhasAposLider[membro.campaign]) {
        campanhasAposLider[membro.campaign] = []
      }
      campanhasAposLider[membro.campaign].push(membro)
    })

    console.log('\n   📊 Ranking completo após inserção:')
    Object.keys(campanhasAposLider).forEach(campanha => {
      console.log(`\n   📋 Campanha ${campanha}:`)
      campanhasAposLider[campanha].forEach(membro => {
        console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos`)
      })

      // Verificar consistência desta campanha
      const membrosCampanha = campanhasAposLider[campanha]
      const posicoes = membrosCampanha.map(m => m.ranking_position)
      const posicaoMinima = Math.min(...posicoes)
      const posicaoMaxima = Math.max(...posicoes)
      const posicoesUnicas = new Set(posicoes).size

      if (posicoesUnicas !== membrosCampanha.length || posicaoMinima !== 1 || posicaoMaxima !== membrosCampanha.length) {
        problemasEncontrados.push(`❌ Campanha ${campanha} com posições inconsistentes: ${posicoes.join(', ')}`)
      } else {
        console.log(`     ✅ Posições consistentes`)
      }
    })

    // 5. Executar função manualmente se o trigger falhou
    if (problemasEncontrados.length > 0) {
      console.log('\n🔄 5. Trigger pode ter falhado - executando ranking manualmente:')
      
      const { error: errorManual } = await supabase.rpc('update_complete_ranking')
      
      if (errorManual) {
        console.error('❌ Erro ao executar ranking manual:', errorManual)
      } else {
        console.log('✅ Ranking manual executado')

        // Verificar novamente
        const { data: rankingManual, error: errManual } = await supabase
          .from('members')
          .select('campaign, ranking_position, name, contracts_completed')
          .eq('status', 'Ativo')
          .is('deleted_at', null)
          .eq('campaign', 'A')
          .order('ranking_position')

        if (errManual) {
          console.error('❌ Erro ao verificar após ranking manual:', errManual)
        } else {
          console.log('\n   📊 Campanha A após ranking manual:')
          rankingManual?.forEach(membro => {
            const marcadorLider = membro.name === 'NOVO LÍDER Campanha A' ? ' 🏆' : ''
            console.log(`     ${membro.ranking_position}º - ${membro.name}: ${membro.contracts_completed} contratos${marcadorLider}`)
          })
        }
      }
    }

    // 6. Resumo dos problemas encontrados
    console.log('\n📋 6. Resumo dos problemas encontrados:')
    
    if (problemasEncontrados.length === 0) {
      console.log('   ✅ Nenhum problema detectado')
    } else {
      problemasEncontrados.forEach(problema => {
        console.log('   ' + problema)
      })
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Observações:')
    console.log('   - Teste de inserção de líder executado')
    console.log('   - Trigger automático verificado')
    console.log('   - Ranking manual executado se necessário')
    console.log('   - Posições verificadas por campanha')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarTriggerRanking()
