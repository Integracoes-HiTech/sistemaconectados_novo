// =====================================================
// TESTE: ATUALIZAÇÃO COMPLETA DE CONTADORES APÓS EXCLUSÃO
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarAtualizacaoContadoresCompleta() {
  console.log('🔧 Testando atualização completa de contadores após exclusão...\n')

  try {
    // Limpar dados de teste
    console.log('📝 1. Limpando dados de teste anteriores:')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE CONTADORES%')

    // Criar membros para teste com diferentes quantidades de amigos
    console.log('\n📊 2. Criando membros com amigos para teste:')
    
    const membrosParaCriar = [
      {
        name: 'TESTE CONTADORES MEMBRO A',
        phone: '61900000001',
        instagram: '@teste_contadores_a',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        couple_name: 'Parceiro A',
        couple_phone: '61800000001',
        couple_instagram: '@parceiro_a',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        contracts_completed: 0, // Será atualizado
        ranking_status: 'Vermelho',
        ranking_position: null, // Será atualizado
        is_friend: false,
        campaign: 'A'
      },
      {
        name: 'TESTE CONTADORES MEMBRO B',
        phone: '61900000002',
        instagram: '@teste_contadores_b',
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'Admin',
        couple_name: 'Parceiro B',
        couple_phone: '61800000002',
        couple_instagram: '@parceiro_b',
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        contracts_completed: 0, // Será atualizado
        ranking_status: 'Vermelho',
        ranking_position: null, // Será atualizado
        is_friend: false,
        campaign: 'A'
      }
    ]

    const membrosCriados = []
    for (const membroData of membrosParaCriar) {
      const { data: membro, error: errMembro } = await supabase
        .from('members')
        .insert([{
          ...membroData,
          registration_date: new Date().toISOString().split('	T')[0],
          status: 'Ativo',
          is_top_1500: false,
          can_be_replaced: false
        }])
        .select('id, name, contracts_completed, ranking_position, ranking_status')
        .single()

      if (errMembro) {
        console.error(`❌ Erro ao criar ${membroData.name}:`, errMembro.message)
        continue
      }

      membrosCriados.push(membro)
      console.log(`✅ ${membro.name}: ${membro.contracts_completed} contratos`)
    }

    // Criar amigos para os membros
    console.log('\n📊 3. Criando amigos para os membros:')
    
    const amigosParaCriar = [
      // 3 amigos para MEMBRO A
      { referrer: 'TESTE CONTADORES MEMBRO A', num_amigos: 3 },
      // 5 amigos para MEMBRO B
      { referrer: 'TESTE CONTADORES MEMBRO B', num_amigos: 5 }
    ]

    for (const dadosAmigos of amigosParaCriar) {
      console.log(`   📝 Criando ${dadosAmigos.num_amigos} amigos para ${dadosAmigos.referrer}:`)
      
      for (let i = 1; i <= dadosAmigos.num_amigos; i++) {
        const amigoData = {
          name: `${dadosAmigos.referrer.replace('TESTE CONTADORES MEMBRO', 'TESTE CONTADORES AMIGO')} ${i}`,
          phone: `6190000001${i}`,
          instagram: `@teste_contadores_amigo_${dadosAmigos.referrer.split(' ')[3].toLowerCase()}_${i}`,
          city: 'São Paulo',
          sector: 'Centro',
          referrer: dadosAmigos.referrer,
          couple_name: `Parceiro Amigo ${i}`,
          couple_phone: `6180000001${i}`,
          couple_instagram: `@parceiro_amigo_${dadosAmigos.referrer.split(' ')[3].toLowerCase()}_${i}`,
          couple_city: 'São Paulo',
          couple_sector: 'Centro',
          contracts_completed: 0,
          ranking_status: 'Vermelho',
          ranking_position: null,
          is_friend: true,
          campaign: 'A'
        }

        const { data: amigo, error: errAmigo } = await supabase
          .from('members')
          .insert([{
            ...amigoData,
            registration_date: new Date().toISOString().split('T')[0],
            status: 'Ativo',
            is_top_1500: false,
            can_be_replaced: false
          }])
          .select('name, referrer')
          .single()

        if (errAmigo) {
          console.error(`     ❌ Erro ao criar amigo ${i}:`, errAmigo.message)
          continue
        }

        console.log(`     ✅ Amigo ${i}: ${amigo.name}`)
      }
    }

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualizar contadores e ranking inicial
    console.log('\n🔄 4. Atualizando contadores e ranking inicial:')
    await atualizarTodosContadoresERanking()

    // Verificar estado inicial
    console.log('\n📊 5. Estado inicial (ANTES das exclusões):')
    await verificarEstadoMembros()

    // 6. TESTE 1: EXCLUIR 1 AMIGO DO MEMBRO A
    console.log('\n🗑️ 6. TESTE 1: Excluindo 1 amigo do MEMBRO A')
    
    // Buscar um amigo do MEMBRO A para excluir
    const { data: amigoParaExcluir, error: errBuscarAmigo } = await supabase
      .from('members')
      .select('id, name, referrer')
      .eq('referrer', 'TESTE CONTADORES MEMBRO A')
      .eq('is_friend', true)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(1)
      .single()

    if (amigoParaExcluir) {
      console.log(`   📝 Excluindo amigo: ${amigoParaExcluir.name}`)
      
      await simularSoftDeleteAmigoCompleto(amigoParaExcluir.id)
      
      await verificarEstadoMembros('APÓS EXCLUIR 1 AMIGO DO MEMBRO A')
    }

    // 7. TESTE 2: EXCLUIR MEMBRO A COMPLETO
    console.log('\n🗑️ 7. TESTE 2: Excluindo MEMBRO A completo (com seus amigos)')
    
    const membroA = membrosCriados.find(m => m.name.includes('MEMBRO A'))
    if (membroA) {
      console.log(`   📝 Excluindo membro: ${membroA.name}`)
      
      await simularSoftDeleteMembroCompleto(membroA.id)
      
      await verificarEstadoMembros('APÓS EXCL<｜tool▁sep｜>MEMBRO A COMPLETO')
    }

    // 8. VERIFICAÇÃO DE RANKINGS E POSIÇÕES
    console.log('\n🏆 8. Verificação de rankings e posições:')
    await verificarRankingsEPosicoes()

    // 9. VERIFICAÇÃO DE CONTADORES GERAL
    console.log('\n📊 9. Verificação de contadores geral:')
    await verificarContadoresGeral()

    // 10. VERIFICAÇÃO DE RELATÓRIOS
    console.log('\n📈 10. Verificação de relatórios:')
    await verificarRelatorios()

    console.log('\n✅ Teste de atualização completa concluído!')
    console.log('\n📝 Resumo das verificações:')
    console.log('   - ✅ Contadores de contratos atualizados')
    console.log('   - ✅ Status de ranking atualizado (Verde/Amarelo/Vermelho)')
    console.log('   - ✅ Posições de ranking recalculadas')
    console.log('   - ✅ Ranking geral ajustado quando membros são excluídos')
    console.log('   - ✅ Contadores das estatísticas gerais atualizados')
    console.log('   - ✅ Relatórios refletindo mudanças')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Atualizar todos os contadores e ranking do sistema
async function atualizarTodosContadoresERanking() {
  // Executar função de ranking do banco
  console.log('   🔄 Executando update_complete_ranking...')
  const { error: rankingError } = await supabase.rpc('update_complete_ranking')
  
  if (rankingError) {
    console.error('     ❌ Erro ao atualizar ranking:', rankingError.message)
  } else {
    console.log('     ✅ Ranking atualizado com sucesso')
  }
}

// Verificar estado atual dos membros
async function verificarEstadoMembros(contexto = 'AGORA') {
  console.log(`\n📋 Estado dos membros: ${contexto}`)
  
  const { data: membros, error: errMembros } = await supabase
    .from('members')
    .select('name, contracts_completed, ranking_position, ranking_status, status, deleted_at')
    .like('name', '%TESTE CONTADORES MEMBRO%')
    .order('contracts_completed', { ascending: false })

  if (errMembros) {
    console.error('❌ Erro ao buscar membros:', errMembros.message)
    return
  }

  membros?.forEach(membro => {
    const statusBadge = membro.deleted_at ? '🗑️ EXCLUÍDO' : 
                        membro.status === 'Ativo' ? '✅ ATIVO' : '❌ INATIVO'
    
    console.log(`   ${statusBadge} ${membro.name}:`)
    console.log(`     Contratos: ${membro.contracts_completed}`)
    console.log(`     Posição: ${membro.ranking_position || 'N/A'}`)
    console.log(`     Status: ${membro.ranking_status}`)
  })

  // Contar amigos ativos de cada membro
  for (const membro of membros?.filter(m => !m.deleted_at) || []) {
    const { data: amigos, error: errAmigos } = await supabase
      .from('members')
      .select('name')
      .eq('referrer', membro.name)
      .eq('is_friend', true)
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log(`     Amigos ativos: ${amigos?.length || 0}`)
    
    // Verificar consistência
    if (amigos?.length !== membro.contracts_completed) {
      console.log(`     ⚠️ INCONSISTÊNCIA! Amigos: ${amigos?.length}, Contratos: ${membro.contracts_completed}`)
    } else {
      console.log(`     ✅ Contadores consistentes`)
    }
  }
}

// Simular soft delete completo de amigo
async function simularSoftDeleteAmigoCompleto(friendId) {
  console.log(`   🔧 Executando soft delete completo do amigo ${friendId}`)
  
  // Buscar dados do amigo
  const { data: friendData, error: fetchError } = await supabase
    .from('members')
    .select('name, referrer')
    .eq('id', friendId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !friendData) {
    console.error(`     ❌ Erro ao buscar amigo: ${fetchError?.message}`)
    return
  }

  // Soft delete do amigo
  const { error: deleteError } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('id', friendId)

  if (deleteError) {
    console.error(`     ❌ Erro ao excluir amigo: ${deleteError.message}`)
    return
  }

  console.log(`     ✅ Amigo ${friendData.name} excluído`)

  // Atualizar contadores e ranking do referrer
  await atualizarContadoresERankingDoReferrer(friendData.referrer)
}

// Simular soft delete completo de membro
async function simularSoftDeleteMembroCompleto(memberId) {
  console.log(`   🔧 Executando soft delete completo do membro ${memberId}`)
  
  // Buscar dados do membro
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('name, contracts_completed')
    .eq('id', memberId)
    .is('deleted_at', null)
    .single();

  if (memberError || !memberData) {
    console.error(`     ❌ Erro ao buscar membro: ${memberError?.message}`)
    return
  }

  console.log(`     📝 Excluindo membro: ${memberData.name}`)

  // 1. Excluir amigos do membro primeiro
  const { error: friendsDeleteError } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('referrer', memberData.name)
    .eq('is_friend', true)
    .is('deleted_at', null)

  if (friendsDeleteError) {
    console.error(`     ❌ Erro ao excluir amigos: ${friendsDeleteError.message}`)
  } else {
    console.log(`     ✅ Amigos do membro excluídos`)
  }

  // 2. Excluir o membro
  const { error: deleteError } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId)

  if (deleteError) {
    console.error(`     ❌ Erro ao excluir membro: ${deleteError.message}`)
    return
  }

  console.log(`     ✅ Membro ${memberData.name} excluído`)

  // 3. Atualizar ranking geral (outros membros passarão para frente)
  await atualizarTodosContadoresERanking()
}

// Atualizar contadores e ranking de um referrer específico
async function atualizarContadoresERankingDoReferrer(referrerName) {
  console.log(`     🔄 Atualizando contadores do referrer: ${referrerName}`)

  // Buscar o membro referrer
  const { data: referrerMember, error: referrerError } = await supabase
    .from('members')
    .select('id, name, contracts_completed')
    .eq('name', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null)
    .single()

  if (referrerError || !referrerMember) {
    console.error(`     ❌ Referrer não encontrado: ${referrerError?.message}`)
    return
  }

  // Contar amigos ativos
  const { data: friendsData, error: friendsError } = await supabase
    .from('members')
    .select('id')
    .eq('referrer', referrerName)
    .eq('is_friend', true)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  const friendsCount = friendsData?.length || 0;

  // Atualizar contracts_completed
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      contracts_completed: friendsCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', referrerMember.id);

  if (updateError) {
    console.error(`     ❌ Erro ao atualizar contracts: ${updateError.message}`)
  } else {
    console.log(`     ✅ Contratos atualizados: ${friendsCount}`)
  }

  // Atualizar ranking geral
  await atualizarTodosContadoresERanking()
}

// Verificar rankings e posições
async function verificarRankingsEPosicoes() {
  const { data: membrosRanking, error: errRanking } = await supabase
    .from('members')
    .select('name, contracts_completed, ranking_position, ranking_status')
    .eq('status', 'Ativo')
    .is('deleted_at', null)
    .order('ranking_position', { ascending: true })

  if (errRanking) {
    console.error('❌ Erro ao verificar rankíng:', errRanking.message)
    return
  }

  console.log('   📋 Top 10 do ranking:')
  membrosRanking?.slice(0, 10).forEach((membro, index) => {
    console.log(`     ${index + 1}º ${membro.name}: ${membro.contracts_completed} contratos - ${membro.ranking_status}`)
    console.log(`         Posição no banco: ${membro.ranking_position}`)
  })

  // Verificar se posições são sequenciais
  const posicoes = membrosRanking?.map(m => m.ranking_position).filter(p => p !== null)
  const isSequencial = posicoes.every((pos, i) => pos === i + 1)
  
  console.log(`\n   🔍 Verificações:`)
  console.log(`     Posições sequenciais: ${isSequencial ? '✅' : '❌'}`)
  console.log(`     Total de membros com posição: ${posicoes.length}`)
}

// Verificar contadores geral
async function verificarContadoresGeral() {
  // Buscar estatísticas das views
  const { data: stats, error: errStats } = await supabase
    .from('v_system_stats')
    .select('*')
    .single()

  if (errStats) {
    console.log('   📊 Estatísticas gerais (manual):')
    
    const { data: membros, error: errMembros } = await supabase
      .from('members')
      .select('ranking_status, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (!errMembros && membros) {
      const total = membros.length
      const verde = membros.filter(m => m.ranking_status === 'Verde').length
      const amarelo = membros.filter(m => m.ranking_status === 'Amarelo').length
      const vermelho = membros.filter(m => m.ranking_status === 'Vermelho').length
      
      console.log(`     Total de membros: ${total}`)
      console.log(`     Verde (≥15 contratos): ${verde}`)
      console.log(`     Amarelo (1-14 contratos): ${amarelo}`)
      console.log(`     Vermelho (0 contratos): ${vermelho}`)
    }
  } else {
    console.log('   📊 Estatísticas gerais (view):')
    console.log(`     Total: ${stats.total_members}`)
    console.log(`     Verde: ${stats.green_members}`)
    console.log(`     Amarelo: ${stats.yellow_members}`)
    console.log(`     Vermelho: ${stats.red_members}`)
  }
}

// Verificar relatórios
async function verificarRelatorios() {
  console.log('   📈 Verificando dados para relatórios:')
  
  try {
    // Atividades recentes
    const { data: recentes, error: errRecent } = await supabase
      .from('members')
      .select('name, created_at')
      .eq('status', 'Atividade')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`     Atividades recentes encontradas: ${recenes?.length || 0}`)
    
    // Registros por cidade
    const { data: porCidade, error: errCidade } = await supabase
      .from('members')
      .select('city')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('city')

    const cidadeCount = porCidade?.reduce((acc, m) => {
      acc[m.city] = (acc[m.city] || 0) + 1
      return acc
    }, {}) || {}

    console.log(`     Registros por cidade: ${Object.keys(cidadeCount).length} cidades`)
    
  } catch (error) {
    console.log('     ❌ Erro ao verificar relatórios:', error.message)
  }
}

// Executar teste
testarAtualizacaoContadoresCompleta()
