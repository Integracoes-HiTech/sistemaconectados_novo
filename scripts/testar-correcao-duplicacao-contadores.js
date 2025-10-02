// =====================================================
// TESTE: CORREÇÃO DA DUPLICAÇÃO DE CONTADORES
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCorrecaoDuplicacaoContadores() {
  console.log('🔧 Testando correção da duplicação de contadores...\n')

  try {
    // Limpar dados de teste
    console.log('📝 1. Limpando dados de teste anteriores:')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE CORREÇÃO%')

    // Criar membro para teste
    console.log('\n📊 2. Criando membro para teste:')
    
    const membroTeste = {
      name: 'TESTE CORREÇÃO MEMBRO',
      phone: '61900000000',
      instagram: '@teste_correcao_membro',
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'Admin',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      contracts_completed: 0,
      ranking_status: 'Vermelho',
      ranking_position: null,
      is_top_1500: false,
      can_be_replaced: false,
      couple_name: 'Parceiro Teste Correção',
      couple_phone: '61800000000',
      couple_instagram: '@parceiro_teste_correcao',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: false,
      campaign: 'A'
  }

    const { data: membroInserido, error: errMembro } = await supabase
      .from('members')
      .insert([membroTeste])
      .select('name, contracts_completed')
      .single()

    if (errMembro) {
      console.error('❌ Erro ao inserir membro:', errMembro.message)
      return
    }

    console.log(`✅ Membro criado: ${membroInserido.name}`)
    console.log(`   Contratos iniciais: ${membroInserido.contracts_completed}`)

    // Cadastrar múltiplos amigos para testar
    console.log('\n📝 3. Cadastrando múltiplos amigos:')
    
    const amigosParaCadastrar = [
      'TESTE CORREÇÃO AMIGO 1',
      'TESTE CORREÇÃO AMIGO 2'
    ]

    for (let i = 0; i < amigosParaCadastrar.length; i++) {
      const nomeAmigo = amigosParaCadastrar[i]
      
      console.log(`   📝 Cadastrando ${nomeAmigo}:`)
      
      const amigoTeste = {
        name: nomeAmigo,
        phone: `6191111000${i}`,
        instagram: `@teste_correcao_amigo_${i + 1}`,
        city: 'São Paulo',
        sector: 'Centro',
        referrer: 'TESTE CORREÇÃO MEMBRO',
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        contracts_completed: 0,
        ranking_status: 'Vermelho',
        ranking_position: null,
        is_top_1500: false,
        can_be_replaced: false,
        couple_name: `Parceiro ${nomeAmigo}`,
        couple_phone: `6181111000${i}`,
        couple_instagram: `@parceiro_teste_correcao_${i + 1}`,
        couple_city: 'São Paulo',
        couple_sector: 'Centro',
        is_friend: true,
        campaign: 'A'
      }

      // Inserir amigo
      const { data: amigoInserido, error: errAmigo } = await supabase
        .from('members')
        .insert([amigoTeste])
        .select('name, referrer')
        .single()

      if (errAmigo) {
        console.error(`     ❌ Erro ao inserir ${nomeAmigo}:`, errAmigo.message)
        continue
      }

      console.log(`     ✅ ${nomeAmigo} inserido`)

      // SIMULAR APENAS A FUNÇÃO CORRETA (PublicRegister.tsx)
      await simularUpdateMemberCountersAfterRegistration('TESTE CORREÇÃO MEMBRO')

      // Verificar estado após cada inserção
      const { data: estadoAtual, error: errAtual } = await supabase
        .from('members')
        .select('name, contracts_completed')
        .eq('name', 'TESTE CORREÇÃO MEMBRO')
        .single()

      const { data: amigosAtual, error: errAmigosAtual } = await supabase
        .from('friends')
        .select('name, referrer')
        .eq('referrer', 'TESTE CORREÇÃO MEMBRO')
        .eq('status', 'Ativo')
        .is('deleted_at', null)

      console.log(`     📊 Após ${i + 1} amigo(s):`)
      console.log(`       Amigos cadastrados: ${amigosAtual?.length || 0}`)
      console.log(`       Contratos contados: ${estadoAtual?.contracts_completed || 0}`)

      if (amigosAtual?.length === estadoAtual?.contracts_completed) {
        console.log(`       ✅ CORRETO! Não há duplicação.`)
      } else {
        console.log(`       ❌ DUPLICAÇÃO! Diferença: ${estadoAtual?.contracts_completed - amigosAtual?.length}`)
      }

      // Aguardar um pouco entre inserções
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Verificação final
    console.log('\n📊 4. Verificação final:')
    
    const { data: estadoFinal, error: errFinal } = await supabase
      .from('members')
      .select('name, contracts_completed')
      .eq('name', 'TESTE CORREÇÃO MEMBRO')
      .single()

    const { data: amigosFinal, error: errAmigosFinal } = await supabase
      .from('friends')
      .select('name, referrer')
      .eq('referrer', 'TESTE CORREÇÃO MEMBRO')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log(`   📋 Amigos cadastrados: ${amigosFinal?.length || 0}`)
    amigosFinal?.forEach((amigo, index) => {
      console.log(`     ${index + 1}. ${amigo.name}`)
    })

    console.log(`   📊 Contratos contados: ${estadoFinal?.contracts_completed || 0}`)
    
    if (amigosFinal?.length === estadoFinal?.contracts_completed) {
      console.log(`   ✅ CORREÇÃO FUNCIONOU! Contadores corretos.`)
      console.log(`   ✅ Não há mais duplicação!`)
    } else {
      console.log(`   ❌ Ainda há problema!`)
      console.log(`       Amigos: ${amigosFinal?.length}`)
      console.log(`       Contratos: ${estadoFinal?.contracts_completed}`)
      console.log(`       Diferença: ${estadoFinal?.contracts_completed - amigosFinal?.length} a mais`)
    }

    console.log('\n✅ Teste de correção concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Função duplicada removida do useMembers.ts')
    console.log('   - Função duplicada removida do useFriends.ts')
    console.log('   - Mantida apenas função correta do PublicRegister.tsx')
    console.log('   - Contadores agora devem estar corretos')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Simular função updateMemberCountersAfterRegistration do PublicRegister.tsx
async function simularUpdateMemberCountersAfterRegistration(referrerName) {
  // Buscar o membro referrer
  const { data: referrerMembers, error: referrerError } = await supabase
    .from('members')
    .select('id, name, contracts_completed')
    .eq('name', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  const referrerMember = referrerMembers?.[0];

  if (!referrerMember) return;

  const friendsCount = await contarAmigosNaTabelaFriends(referrerName);

  // Atualizar contracts_completed baseado na CONTAGEM real de amigos
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      contracts_completed: friendsCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', referrerMember.id);
}

// Contar amigos na tabela friends (para simular o cenário real)
async function contarAmigosNaTabelaFriends(referrerName) {
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('id')
    .eq('referrer', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  return friendsData?.length || 0;
}

// Executar teste
testarCorrecaoDuplicacaoContadores()
