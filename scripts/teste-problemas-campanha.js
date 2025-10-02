// =====================================================
// TESTE: PROBLEMAS DE CAMPANHA - AMIGOS E RANKING
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarProblemasCampanha() {
  console.log('🔍 Testando problemas de campanha - amigos e ranking...\n')

  try {
    // 1. Verificar membros por campanha
    console.log('📊 1. Membros por campanha:')
    
    const { data: membrosA, error: errMembrosA } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errMembrosA) {
      console.error('❌ Erro ao buscar membros da Campanha A:', errMembrosA)
      return
    }

    console.log(`   Campanha A: ${membrosA?.length || 0} membros`)
    membrosA?.forEach(membro => {
      console.log(`   - ${membro.name}: ${membro.contracts_completed} contratos - Posição ${membro.ranking_position} - ${membro.ranking_status}`)
    })

    const { data: membrosB, error: errMembrosB } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errMembrosB) {
      console.error('❌ Erro ao buscar membros da Campanha B:', errMembrosB)
      return
    }

    console.log(`   Campanha B: ${membrosB?.length || 0} membros`)
    membrosB?.forEach(membro => {
      console.log(`   - ${membro.name}: ${membro.contracts_completed} contratos - Posição ${membro.ranking_position} - ${membro.ranking_status}`)
    })

    // 2. Verificar amigos por campanha
    console.log('\n👥 2. Amigos por campanha:')
    
    const { data: amigosA, error: errAmigosA } = await supabase
      .from('friends')
      .select('id, name, couple_name, referrer, campaign')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errAmigosA) {
      console.error('❌ Erro ao buscar amigos da Campanha A:', errAmigosA)
      return
    }

    console.log(`   Campanha A: ${amigosA?.length || 0} amigos`)
    amigosA?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (referrer: ${amigo.referrer})`)
    })

    const { data: amigosB, error: errAmigosB } = await supabase
      .from('friends')
      .select('id, name, couple_name, referrer, campaign')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errAmigosB) {
      console.error('❌ Erro ao buscar amigos da Campanha B:', errAmigosB)
      return
    }

    console.log(`   Campanha B: ${amigosB?.length || 0} amigos`)
    amigosB?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (referrer: ${amigo.referrer})`)
    })

    // 3. Verificar se há amigos da Campanha B aparecendo na Campanha A
    console.log('\n🔍 3. Verificando vazamento de campanhas:')
    
    const { data: todosAmigos, error: errTodosAmigos } = await supabase
      .from('friends')
      .select('id, name, couple_name, referrer, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errTodosAmigos) {
      console.error('❌ Erro ao buscar todos os amigos:', errTodosAmigos)
      return
    }

    console.log(`   Total de amigos: ${todosAmigos?.length || 0}`)
    
    // Verificar se há amigos sem campanha definida
    const amigosSemCampanha = todosAmigos?.filter(amigo => !amigo.campaign) || []
    if (amigosSemCampanha.length > 0) {
      console.log(`   ⚠️ Amigos sem campanha definida: ${amigosSemCampanha.length}`)
      amigosSemCampanha.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (campanha: ${amigo.campaign || 'NULL'})`)
      })
    }

    // 4. Verificar ranking global vs por campanha
    console.log('\n🏆 4. Verificando ranking global vs por campanha:')
    
    const { data: rankingGlobal, error: errRankingGlobal } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errRankingGlobal) {
      console.error('❌ Erro ao buscar ranking global:', errRankingGlobal)
      return
    }

    console.log(`   Ranking global (${rankingGlobal?.length || 0} membros):`)
    rankingGlobal?.forEach((membro, index) => {
      console.log(`   ${index + 1}. ${membro.name} (${membro.campaign}): ${membro.contracts_completed} contratos - Posição ${membro.ranking_position}`)
    })

    // 5. Verificar se a função de ranking está considerando campanhas
    console.log('\n🔄 5. Testando função de ranking:')
    
    // Executar a função de ranking
    const { error: errRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errRanking) {
      console.error('❌ Erro ao executar função de ranking:', errRanking)
    } else {
      console.log('   ✅ Função de ranking executada com sucesso')
    }

    // 6. Verificar ranking após atualização
    console.log('\n📊 6. Ranking após atualização:')
    
    const { data: rankingApos, error: errRankingApos } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, ranking_status, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })

    if (errRankingApos) {
      console.error('❌ Erro ao buscar ranking após atualização:', errRankingApos)
      return
    }

    console.log(`   Ranking por campanha (${rankingApos?.length || 0} membros):`)
    
    let campanhaAtual = ''
    rankingApos?.forEach(membro => {
      if (membro.campaign !== campanhaAtual) {
        campanhaAtual = membro.campaign
        console.log(`   \n   📋 Campanha ${campanhaAtual}:`)
      }
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })

    // 7. Verificar se há problemas de posição duplicada
    console.log('\n🔍 7. Verificando posições duplicadas:')
    
    const posicoesPorCampanha = {}
    rankingApos?.forEach(membro => {
      const key = `${membro.campaign}-${membro.ranking_position}`
      if (posicoesPorCampanha[key]) {
        console.log(`   ⚠️ Posição duplicada: Campanha ${membro.campaign}, Posição ${membro.ranking_position}`)
        console.log(`     - ${posicoesPorCampanha[key].name}`)
        console.log(`     - ${membro.name}`)
      } else {
        posicoesPorCampanha[key] = membro
      }
    })

    // 8. Verificar se há membros com posição NULL
    console.log('\n🔍 8. Verificando membros com posição NULL:')
    
    const { data: membrosSemPosicao, error: errSemPosicao } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .is('ranking_position', null)

    if (errSemPosicao) {
      console.error('❌ Erro ao buscar membros sem posição:', errSemPosicao)
      return
    }

    if (membrosSemPosicao && membrosSemPosicao.length > 0) {
      console.log(`   ⚠️ Membros sem posição de ranking: ${membrosSemPosicao.length}`)
      membrosSemPosicao.forEach(membro => {
        console.log(`     - ${membro.name} (${membro.campaign}): ${membro.contracts_completed} contratos`)
      })
    } else {
      console.log('   ✅ Todos os membros têm posição de ranking')
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Membros por campanha verificados')
    console.log('   - Amigos por campanha verificados')
    console.log('   - Vazamento de campanhas verificado')
    console.log('   - Ranking global vs por campanha verificado')
    console.log('   - Função de ranking testada')
    console.log('   - Posições duplicadas verificadas')
    console.log('   - Membros sem posição verificados')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarProblemasCampanha()
