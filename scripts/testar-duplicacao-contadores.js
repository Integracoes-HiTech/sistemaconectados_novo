// =====================================================
// TESTE: DUPLICAÇÃO DE CONTADORES AO CADASTRAR AMIGO
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarDuplicacaoContadores() {
  console.log('🔍 Testando duplicação de contadores ao cadastrar amigo...\n')

  try {
    // Limpar dados de teste
    console.log('📝 1. Limpando dados de teste anteriores:')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE CONTADOR%')

    await supabase
      .from('friends')
      .delete()
      .like('name', '%TESTE AMIGO%')

    // Criar membro para teste
    console.log('\n📊 2. Criando membro para teste:')
    
    const membroTeste = {
      name: 'TESTE CONTADOR MEMBRO',
      phone: '61911111111',
      instagram: '@teste_contador_membro',
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
      couple_name: 'Parceiro Teste Contador',
      couple_phone: '61811111111',
      couple_instagram: '@parceiro_teste_contador',
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

    // Verificar estado inicial
    console.log('\n📊 3. Estado inicial:')
    const { data: estadoInicial, error: errInicial } = await supabase
      .from('members')
      .select('name, contracts_completed')
      .eq('name', 'TESTE CONTADOR MEMBRO')
      .single()

    if (estadoInicial) {
      console.log(`   ${estadoInicial.name}: ${estadoInicial.contracts_completed} contratos`)
    }

    // Verificar amigos cadastrados inicialmente
    const { data: amigosInicial, error: errAmigosInicial } = await supabase
      .from('friends')
      .select('name, referrer')
      .eq('referrer', 'TESTE CONTADOR MEMBRO')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log(`   Amigos cadastrados inicialmente: ${amigosInicial?.length || 0}`)

    // 4. CADASTRAR AMIGO VIA MODELO DO PUBLICREGISTER.TSX (LINHA 759)
    console.log('\n🎭 4. Cadastrando amigo via PublicRegister (simulação):')
    
    const amigoTeste = {
      name: 'TESTE AMIGO DUPLICAÇÃO',
      phone: '61922222222',
      instagram: '@teste_amigo_duplicacao',
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'TESTE CONTADOR MEMBRO',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      contracts_completed: 0,
      ranking_status: 'Vermelho',
      ranking_position: null,
      is_top_1500: false,
      can_be_replaced: false,
      couple_name: 'Parceiro Amigo Duplicação',
      couple_phone: '61822222222',
      couple_instagram: '@parceiro_amigo_duplicacao',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: true,
      campaign: 'A'
    }

    // Inserir amigo
    const { data: amigoInserido, error: errAmigo } = await supabase
      .from('members')
      .insert([amigoTeste])
      .select('name, referrer, campaign')
      .single()

    if (errAmigo) {
      console.error('❌ Erro ao inserir amigo:', errAmigo.message)
      return
    }

    console.log(`✅ Amigo inserido: ${amigoInserido.name}`)
    console.log(`   Referrer: ${amigoInserido.campaign}`)

    // 5. SIMULAR CHAMADA DA LINHA 759 DO PUBLICREGISTER.TSX
    console.log('\n🔄 5. Executando updateMemberCountersAfterRegistration (PublicRegister.tsx linha 759):')
    
    // Simular função updateMemberCountersAfterRegistration do PublicRegister
    await simularUpdateMemberCountersAfterRegistration('TESTE CONTADOR MEMBRO')

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar resultado após primeira função
    const { data: estadoPosFuncao1, error: errPosFuncao1 } = await supabase
      .from('members')
      .select('name, contracts_completed')
      .eq('name', 'TESTE CONTADOR MEMBRO')
      .single()

    if (estadoPosFuncao1) {
      console.log(`   Após função 1: ${estadoPosFuncao1.contracts_completed} contratos`)
    }

    // 6. SIMULAR CHAMADA DO USEMEMBERS.TS (LINHA 244) OU USEFRIENDS.TS (LINHA 154)
    console.log('\n🔄 6. Executando updateReferrerContracts (useMembers.ts linha 244):')
    
    // Simular função updateReferrerContracts
    await simularUpdateReferrerContracts('TESTE CONTADOR MEMBRO')

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar resultado final
    const { data: estadoFinal, error: errFinal } = await supabase
      .from('members')
      .select('name, contracts_completed')
      .eq('name', 'TESTE CONTADOR MEMBRO')
      .single()

    const { data: amigosFinal, error: errAmigosFinal } = await supabase
      .from('friends')
      .select('name, referrer')
      .eq('referrer', 'TESTE CONTADOR MEMBRO')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log('\n📊 7. Resultado final:')
    console.log(`   Amigos cadastrados: ${amigosFinal?.length || 0}`)
    console.log(`   Contratos contados: ${estadoFinal?.contracts_completed || 0}`)
    
    if (amigosFinal?.length === estadoFinal?.contracts_completed) {
      console.log(`   ✅ CONTADORES CORRETOS! Não há duplicação.`)
    } else {
      console.log(`   ❌ DUPLICAÇÃO DETECTADA!`)
      console.log(`       Amigos: ${amigosFinal?.length}`)
      console.log(`       Contratos: ${estadoFinal?.contracts_completed}`)
      console.log(`       Diferença: ${estadoFinal?.contracts_completed - amigosFinal?.length} a mais`)
    }

    // Verificar logs de contadores
    console.log('\n🔍 8. Logs de onde cada função executou:')
    console.log('   - PublicRegister.tsx:linha 759 → updateMemberCountersAfterRegistration')
    console.log('   - useMembers.ts:linha 244 → updateReferrerContracts') 
    console.log('   - useFriends.ts:linha 154 → updateReferrerContracts')
    console.log('   Resultado: DUAS ou TRÊS funções incrementando o mesmo contador')

    console.log('\n✅ Teste de duplicação concluído!')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Simular função updateMemberCountersAfterRegistration do PublicRegister.tsx
async function simularUpdateMemberCountersAfterRegistration(referrerName) {
  console.log(`   🔧 Executando: updateMemberCountersAfterRegistration`)
  
  // Buscar o membro referrer
  const { data: referrerMembers, error: referrerError } = await supabase
    .from('members')
    .select('id, name, contracts_completed')
    .eq('name', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  const referrerMember = referrerMembers?.[0];

  if (!referrerMember) return;

  // Contar amigos ativos cadastrados por este membro
  const { data: friendsData, error: friendsError } = await supabase
    .from('friends')
    .select('id')
    .eq('referrer', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  const friendsCount = friendsData?.length || 0;

  console.log(`     📊 Amigos encontrados: ${friendsCount}`)
  console.log(`     📊 Contratos atual do referrer: ${referrerMember.contracts_completed}`)

  // Atualizar contracts_completed baseado na CONTAGEM de amigos
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      contracts_completed: friendsCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', referrerMember.id);

  if (!updateError) {
    console.log(`     ✅ PublicRegister atualizou para: ${friendsCount} contratos`)
  }
}

// Simular função updateReferrerContracts do useMembers.ts
async function simularUpdateReferrerContracts(referrerName) {
  console.log(`   🔧 Executando: updateReferrerContracts`)
  
  // Buscar o membro referrer pelo nome
  const { data: referrerMembers, error: referrerError } = await supabase
    .from('members')
    .select('id, name, contracts_completed')
    .eq('name', referrerName)
    .eq('status', 'Ativo')
    .is('deleted_at', null);

  const referrerMember = referrerMembers?.[0];

  if (!referrerMember) return;

  console.log(`     📊 Contratos atual do referrer: ${referrerMember.contracts_completed}`)

  // Incrementar contratos completados (+1)
  const newContractsCount = referrerMember.contracts_completed + 1;
  
  console.log(`     📊 Incrementando para: ${newContractsCount}`)

  // Atualizar contratos do referrer
  const { error: updateError } = await supabase
    .from('members')
    .update({ 
      contracts_completed: newContractsCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', referrerMember.id);

  if (!updateError) {
    console.log(`     ✅ useMembers incrementou para: ${newContractsCount} contratos`)
  }
}

// Executar teste
testarDuplicacaoContadores()
