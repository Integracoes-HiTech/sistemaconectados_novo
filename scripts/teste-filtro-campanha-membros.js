// =====================================================
// TESTE: FILTRO POR CAMPANHA - MEMBROS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarFiltroCampanha() {
  console.log('🔍 Testando filtro por campanha - Membros...\n')

  try {
    // 1. Verificar distribuição por campanha
    console.log('📊 1. Distribuição por campanha:')
    const { data: distribuicao, error: errDist } = await supabase
      .from('members')
      .select('campaign, ranking_status, status, deleted_at')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errDist) {
      console.error('❌ Erro ao buscar distribuição:', errDist)
      return
    }

    const campanhas = {}
    distribuicao?.forEach(member => {
      const camp = member.campaign || 'A'
      if (!campanhas[camp]) {
        campanhas[camp] = {
          total: 0,
          verde: 0,
          amarelo: 0,
          vermelho: 0
        }
      }
      campanhas[camp].total++
      if (member.ranking_status === 'Verde') campanhas[camp].verde++
      if (member.ranking_status === 'Amarelo') campanhas[camp].amarelo++
      if (member.ranking_status === 'Vermelho') campanhas[camp].vermelho++
    })

    Object.entries(campanhas).forEach(([campanha, stats]) => {
      console.log(`   Campanha ${campanha}:`)
      console.log(`     Total: ${stats.total}`)
      console.log(`     Verde: ${stats.verde}`)
      console.log(`     Amarelo: ${stats.amarelo}`)
      console.log(`     Vermelho: ${stats.vermelho}`)
    })

    // 2. Testar filtro Campanha A
    console.log('\n📊 2. Filtro Campanha A:')
    const { data: campanhaA, error: errA } = await supabase
      .from('members')
      .select('ranking_status, contracts_completed, is_top_1500')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errA) {
      console.error('❌ Erro ao buscar Campanha A:', errA)
    } else {
      const totalA = campanhaA?.length || 0
      const verdeA = campanhaA?.filter(m => m.ranking_status === 'Verde').length || 0
      const amareloA = campanhaA?.filter(m => m.ranking_status === 'Amarelo').length || 0
      const vermelhoA = campanhaA?.filter(m => m.ranking_status === 'Vermelho').length || 0
      const top1500A = campanhaA?.filter(m => m.is_top_1500).length || 0

      console.log(`   Total: ${totalA}`)
      console.log(`   Verde: ${verdeA}`)
      console.log(`   Amarelo: ${amareloA}`)
      console.log(`   Vermelho: ${vermelhoA}`)
      console.log(`   Top 1500: ${top1500A}`)
    }

    // 3. Testar filtro Campanha B
    console.log('\n📊 3. Filtro Campanha B:')
    const { data: campanhaB, error: errB } = await supabase
      .from('members')
      .select('ranking_status, contracts_completed, is_top_1500')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errB) {
      console.error('❌ Erro ao buscar Campanha B:', errB)
    } else {
      const totalB = campanhaB?.length || 0
      const verdeB = campanhaB?.filter(m => m.ranking_status === 'Verde').length || 0
      const amareloB = campanhaB?.filter(m => m.ranking_status === 'Amarelo').length || 0
      const vermelhoB = campanhaB?.filter(m => m.ranking_status === 'Vermelho').length || 0
      const top1500B = campanhaB?.filter(m => m.is_top_1500).length || 0

      console.log(`   Total: ${totalB}`)
      console.log(`   Verde: ${verdeB}`)
      console.log(`   Amarelo: ${amareloB}`)
      console.log(`   Vermelho: ${vermelhoB}`)
      console.log(`   Top 1500: ${top1500B}`)
    }

    // 4. Comparar com view global
    console.log('\n📊 4. View Global (v_system_stats):')
    const { data: global, error: errGlobal } = await supabase
      .from('v_system_stats')
      .select('*')
      .single()

    if (errGlobal) {
      console.error('❌ Erro ao buscar view global:', errGlobal)
    } else {
      console.log(`   Total: ${global.total_members}`)
      console.log(`   Verde: ${global.green_members}`)
      console.log(`   Amarelo: ${global.yellow_members}`)
      console.log(`   Vermelho: ${global.red_members}`)
      console.log(`   Top 1500: ${global.top_1500_members}`)
    }

    // 5. Verificar alguns membros de exemplo
    console.log('\n📋 5. Exemplos de membros por campanha:')
    const { data: exemplos, error: errExemplos } = await supabase
      .from('members')
      .select('campaign, name, ranking_status, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('campaign')
      .order('contracts_completed', { ascending: false })
      .limit(10)

    if (errExemplos) {
      console.error('❌ Erro ao buscar exemplos:', errExemplos)
    } else {
      exemplos?.forEach(member => {
        console.log(`   ${member.campaign || 'A'}: ${member.name} - ${member.ranking_status} (${member.contracts_completed} contratos)`)
      })
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Verificar se os dados estão sendo filtrados corretamente por campanha')
    console.log('   - Comparar estatísticas por campanha vs. globais')
    console.log('   - Confirmar que o hook useMembers está funcionando com filtro de campanha')
    console.log('   - Validar que os contadores do dashboard mostram apenas dados da campanha do usuário')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarFiltroCampanha()
