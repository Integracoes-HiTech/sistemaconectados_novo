// =====================================================
// TESTE: RANKING DE MEMBROS E ATUALIZAÇÃO DE CONTRATOS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRankingMembros() {
  console.log('🔍 Testando sistema de ranking de membros...\n')

  try {
    // 1. Verificar estado atual dos membros
    console.log('📊 1. Estado atual dos membros:')
    const { data: membros, error: errMembros } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, is_top_1500, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('contracts_completed', { ascending: false })

    if (errMembros) {
      console.error('❌ Erro ao buscar membros:', errMembros)
      return
    }

    console.log(`   Total de membros ativos: ${membros?.length || 0}`)
    membros?.forEach((membro, index) => {
      console.log(`   ${index + 1}. ${membro.name} (${membro.campaign || 'A'}) - ${membro.contracts_completed} contratos - ${membro.ranking_status} - Posição: ${membro.ranking_position}`)
    })

    // 2. Verificar estado atual dos amigos
    console.log('\n📊 2. Estado atual dos amigos:')
    const { data: amigos, error: errAmigos } = await supabase
      .from('friends')
      .select('id, name, referrer, contracts_completed, ranking_status, ranking_position, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('contracts_completed', { ascending: false })

    if (errAmigos) {
      console.error('❌ Erro ao buscar amigos:', errAmigos)
    } else {
      console.log(`   Total de amigos ativos: ${amigos?.length || 0}`)
      amigos?.forEach((amigo, index) => {
        console.log(`   ${index + 1}. ${amigo.name} (${amigo.campaign || 'A'}) - Referrer: ${amigo.referrer} - ${amigo.contracts_completed} contratos - ${amigo.ranking_status}`)
      })
    }

    // 3. Testar função de ranking
    console.log('\n🔄 3. Testando função update_complete_ranking:')
    const { error: errRanking } = await supabase.rpc('update_complete_ranking')
    
    if (errRanking) {
      console.error('❌ Erro ao executar update_complete_ranking:', errRanking)
    } else {
      console.log('✅ Função update_complete_ranking executada com sucesso')
    }

    // 4. Verificar estado após atualização do ranking
    console.log('\n📊 4. Estado após atualização do ranking:')
    const { data: membrosAtualizados, error: errMembrosAtualizados } = await supabase
      .from('members')
      .select('id, name, contracts_completed, ranking_status, ranking_position, is_top_1500, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true })

    if (errMembrosAtualizados) {
      console.error('❌ Erro ao buscar membros atualizados:', errMembrosAtualizados)
    } else {
      console.log(`   Total de membros ativos: ${membrosAtualizados?.length || 0}`)
      membrosAtualizados?.forEach((membro, index) => {
        console.log(`   ${membro.ranking_position}. ${membro.name} (${membro.campaign || 'A'}) - ${membro.contracts_completed} contratos - ${membro.ranking_status} - Top 1500: ${membro.is_top_1500 ? 'Sim' : 'Não'}`)
      })
    }

    // 5. Verificar distribuição por status
    console.log('\n📊 5. Distribuição por status de ranking:')
    const verde = membrosAtualizados?.filter(m => m.ranking_status === 'Verde').length || 0
    const amarelo = membrosAtualizados?.filter(m => m.ranking_status === 'Amarelo').length || 0
    const vermelho = membrosAtualizados?.filter(m => m.ranking_status === 'Vermelho').length || 0
    const top1500 = membrosAtualizados?.filter(m => m.is_top_1500).length || 0

    console.log(`   Verde (15+ contratos): ${verde}`)
    console.log(`   Amarelo (1-14 contratos): ${amarelo}`)
    console.log(`   Vermelho (0 contratos): ${vermelho}`)
    console.log(`   Top 1500: ${top1500}`)

    // 6. Verificar se há inconsistências
    console.log('\n🔍 6. Verificando inconsistências:')
    const inconsistências = []
    
    membrosAtualizados?.forEach(membro => {
      // Verificar se o status está correto baseado nos contratos
      let statusEsperado = 'Vermelho'
      if (membro.contracts_completed >= 15) statusEsperado = 'Verde'
      else if (membro.contracts_completed >= 1) statusEsperado = 'Amarelo'
      
      if (membro.ranking_status !== statusEsperado) {
        inconsistências.push(`${membro.name}: tem ${membro.contracts_completed} contratos mas status é ${membro.ranking_status} (deveria ser ${statusEsperado})`)
      }
      
      // Verificar se está no top 1500 corretamente
      const deveriaEstarTop1500 = membro.ranking_position <= 1500
      if (membro.is_top_1500 !== deveriaEstarTop1500) {
        inconsistências.push(`${membro.name}: posição ${membro.ranking_position} mas is_top_1500 é ${membro.is_top_1500} (deveria ser ${deveriaEstarTop1500})`)
      }
    })

    if (inconsistências.length === 0) {
      console.log('✅ Nenhuma inconsistência encontrada!')
    } else {
      console.log('❌ Inconsistências encontradas:')
      inconsistências.forEach(inc => console.log(`   - ${inc}`))
    }

    // 7. Testar cadastro de amigo (simulação)
    console.log('\n🧪 7. Testando simulação de cadastro de amigo:')
    
    // Encontrar um membro para testar
    const membroTeste = membrosAtualizados?.[0]
    if (membroTeste) {
      console.log(`   Membro de teste: ${membroTeste.name} (${membroTeste.contracts_completed} contratos)`)
      
      // Simular incremento de contratos
      const novosContratos = membroTeste.contracts_completed + 1
      console.log(`   Simulando incremento para ${novosContratos} contratos`)
      
      // Atualizar contratos
      const { error: errUpdate } = await supabase
        .from('members')
        .update({ 
          contracts_completed: novosContratos,
          updated_at: new Date().toISOString()
        })
        .eq('id', membroTeste.id)

      if (errUpdate) {
        console.error('❌ Erro ao atualizar contratos:', errUpdate)
      } else {
        console.log('✅ Contratos atualizados com sucesso')
        
        // Executar ranking novamente
        const { error: errRanking2 } = await supabase.rpc('update_complete_ranking')
        if (errRanking2) {
          console.error('❌ Erro ao executar ranking:', errRanking2)
        } else {
          console.log('✅ Ranking atualizado após incremento')
          
          // Verificar resultado
          const { data: membroAtualizado, error: errMembroAtualizado } = await supabase
            .from('members')
            .select('name, contracts_completed, ranking_status, ranking_position')
            .eq('id', membroTeste.id)
            .single()

          if (errMembroAtualizado) {
            console.error('❌ Erro ao buscar membro atualizado:', errMembroAtualizado)
          } else {
            console.log(`   Resultado: ${membroAtualizado.name} - ${membroAtualizado.contracts_completed} contratos - ${membroAtualizado.ranking_status} - Posição: ${membroAtualizado.ranking_position}`)
          }
        }
      }
    } else {
      console.log('❌ Nenhum membro encontrado para teste')
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Verificar se o ranking está funcionando corretamente')
    console.log('   - Validar atualização de status baseado em contratos')
    console.log('   - Confirmar posições de ranking')
    console.log('   - Testar incremento de contratos')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarRankingMembros()
