// =====================================================
// EXECUTAR CORREÇÃO DO RANKING POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executarCorrecao() {
  console.log('🔧 Executando correção do ranking por campanha...\n')
  
  try {
    // 1. Executar a função de ranking corrigida
    console.log('📝 1. Executando função de ranking corrigida...')
    const { error } = await supabase.rpc('update_complete_ranking')
    
    if (error) {
      console.error('❌ Erro ao executar função de ranking:', error)
      return
    }
    
    console.log('✅ Função de ranking executada com sucesso')
    
    // 2. Verificar resultado por campanha
    console.log('\n📊 2. Verificando resultado por campanha:')
    const { data: resultado, error: errResultado } = await supabase
      .from('members')
      .select('campaign, name, contracts_completed, ranking_position, ranking_status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })
    
    if (errResultado) {
      console.error('❌ Erro ao verificar resultado:', errResultado)
      return
    }
    
    let campanhaAtual = ''
    resultado?.forEach(membro => {
      if (membro.campaign !== campanhaAtual) {
        campanhaAtual = membro.campaign
        console.log(`\n   📋 Campanha ${campanhaAtual}:`)
      }
      console.log(`     ${membro.ranking_position}. ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    })
    
    // 3. Verificar se cada campanha tem posições sequenciais
    console.log('\n🔍 3. Verificando posições sequenciais por campanha:')
    const { data: posicoes, error: errPosicoes } = await supabase
      .from('members')
      .select('campaign, ranking_position')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign', { ascending: true })
      .order('ranking_position', { ascending: true })
    
    if (errPosicoes) {
      console.error('❌ Erro ao verificar posições:', errPosicoes)
      return
    }
    
    const campanhas = {}
    posicoes?.forEach(membro => {
      if (!campanhas[membro.campaign]) {
        campanhas[membro.campaign] = []
      }
      campanhas[membro.campaign].push(membro.ranking_position)
    })
    
    Object.keys(campanhas).forEach(campanha => {
      const posicoes = campanhas[campanha]
      const sequencial = posicoes.every((pos, index) => pos === index + 1)
      console.log(`   Campanha ${campanha}: ${posicoes.join(', ')} ${sequencial ? '✅' : '❌'}`)
    })
    
    // 4. Verificar se há posições duplicadas
    console.log('\n🔍 4. Verificando posições duplicadas:')
    const { data: duplicadas, error: errDuplicadas } = await supabase
      .from('members')
      .select('campaign, ranking_position')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
    
    if (errDuplicadas) {
      console.error('❌ Erro ao verificar duplicadas:', errDuplicadas)
      return
    }
    
    const posicoesPorCampanha = {}
    duplicadas?.forEach(membro => {
      const key = `${membro.campaign}-${membro.ranking_position}`
      if (posicoesPorCampanha[key]) {
        console.log(`   ⚠️ Posição duplicada: Campanha ${membro.campaign}, Posição ${membro.ranking_position}`)
      } else {
        posicoesPorCampanha[key] = true
      }
    })
    
    if (Object.keys(posicoesPorCampanha).length === duplicadas?.length) {
      console.log('   ✅ Nenhuma posição duplicada encontrada')
    }
    
    console.log('\n✅ Correção concluída!')
    console.log('\n📝 Resumo:')
    console.log('   - Função de ranking por campanha executada')
    console.log('   - Posições sequenciais verificadas')
    console.log('   - Posições duplicadas verificadas')
    console.log('   - Ranking agora é calculado por campanha')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar correção
executarCorrecao()
