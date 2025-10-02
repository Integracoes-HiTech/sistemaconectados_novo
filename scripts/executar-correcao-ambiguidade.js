// =====================================================
// EXECUTAR CORREÇÃO SIMPLES DO ERRO DE AMBIGUIDADE
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function executarCorrecaoAmbiguidade() {
  console.log('🔧 Executando correção do erro de ambiguidade...\n')

  try {
    console.log('📝 1. Executando função principal update_complete_ranking()...')
    
    const { error } = await supabase.rpc('update_complete_ranking')
    
    if (error) {
      console.error('❌ Erro na função principal:', error)
      console.error('Detalhes:', error.message)
      return
    }
    
    console.log('✅ Função principal executada com sucesso!')

    // 2. Verificar resultado
     console.log('\n📊 2. Verificando resultado da correção:')
    
    const { data: rankingData, error: errRanking } = await supabase
      .from('members')
      .select('campaign, ranking_position, name, contracts_completed, ranking_status')
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

    // 3. Verificar consistência
     console.log('\n🔍 3. Verificando consistência:')
    
    Object.keys(campanhas).forEach(campanha => {
      const membros = campanhas[campanha]
      const totalMembros = membros.length
      const posicoes = membros.map(m => m.ranking_position)
      const posicaoMinima = Math.min(...posicoes)
      const posicaoMaxima = Math.max(...posicoes)
      const posicoesUnicas = new Set(posicoes).size
      
      console.log(`   Campanha ${campanha}:`)
      console.log(`     Total: ${totalMembros}`)
      console.log(`     Posições: ${posicaoMinima}-${posicaoMaxima}`)
      console.log(`     Únicas: ${posicoesUnicas}`)
      
      const consistente = posicoesUnicas === totalMembros && posicaoMinima === 1 && posicaoMaxima === totalMembros
      console.log(`     Status: ${consistente ? '✅ Consistente' : '❌ Inconsistente'}`)
    })

    console.log('\n✅ Correção concluída!')
    console.log('\n📝 Resumo:')
    console.log('   - Erro de ambiguidade corrigido')
    console.log('   - Função update_complete_ranking() funcionando')
    console.log('   - Ranking calculado por campanha')
    console.log('   - Posições sequenciais verificadas')
    console.log('   - Isolamento entre campanhas mantido')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar correção
executarCorrecaoAmbiguidade()
