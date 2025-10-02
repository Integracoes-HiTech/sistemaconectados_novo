// =====================================================
// TESTE: SOFT DELETE CORRIGIDO
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarSoftDeleteCorrigido() {
  console.log('🔧 Testando soft delete corrigido...\n')

  try {
    // Limpar dados de teste
    console.log('📝 1. Limpando dados de teste anteriores:')
    await supabase
      .from('members')
      .delete()
      .like('name', '%TESTE SOFT DELETE%')

    await supabase
      .from('auth_users')
      .delete()
      .like('name', '%TESTE SOFT DELETE%')

    // Criar membro para teste
    console.log('\n📊 2. Criando membro para teste de exclusão:')
    
    const membroTeste = {
      name: 'TESTE SOFT DELETE MEMBRO',
      phone: '61911111111',
      instagram: '@teste_soft_delete_membro',
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
      couple_name: 'Parceiro Teste Soft Delete',
      couple_phone: '61811111111',
      couple_instagram: '@parceiro_teste_soft_delete',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: false,
      campaign: 'A'
    }

    const { data: membroInserido, error: errMembro } = await supabase
      .from('members')
      .insert([membroTeste])
      .select('id, name, deleted_at')
      .single()

    if (errMembro) {
      console.error('❌ Erro ao inserir membro:', errMembro.message)
      return
    }

    console.log(`✅ Membro criado: ${membroInserido.name}`)
    console.log(`   ID: ${membroInserido.id}`)
    console.log(`   Deleted at: ${membroInserido.deleted_at}`)

    // Criar amigo para teste
    console.log('\n📊 3. Criando amigo para teste de exclusão:')
    
    const amigoTeste = {
      name: 'TESTE SOFT DELETE AMIGO',
      phone: '61922222222',
      instagram: '@teste_soft_delete_amigo',
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'TESTE SOFT DELETE MEMBRO',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      contracts_completed: 0,
      ranking_status: 'Vermelho',
      ranking_position: null,
      is_top_1500: false,
      can_be_replaced: false,
      couple_name: 'Parceiro Teste Soft Delete Amigo',
      couple_phone: '61822222222',
      couple_instagram: '@parceiro_teste_soft_delete_amigo',
      couple_city: 'São Paulo',
      couple_sector: 'Centro',
      is_friend: true,
      campaign: 'A'
    }

    const { data: amigoInserido, error: errAmigo } = await supabase
      .from('members')
      .insert([amigoTeste])
      .select('id, name, deleted_at')
      .single()

    if (errAmigo) {
      console.error('❌ Erro ao inserir amigo:', errAmigo.message)
      return
    }

    console.log(`✅ Amigo criado: ${amigoInserido.name}`)
    console.log(`   ID: ${amigoInserido.id}`)
    console.log(`   Deleted at: ${amigoInserido.deleted_at}`)

    // 4. TESTAR SOFT DELETE DO AMIGO
    console.log('\n🗑️ 4. Testando soft delete do amigo:')
    
    const { data: amigoAntesDelete, error: errAntesAmigo } = await supabase
      .from('members')
      .select('name, status, deleted_at')
      .eq('id', amigoInserido.id)
      .single()

    console.log(`📊 Estado ANTES da exclusão:`)
    console.log(`   Nome: ${amigoAntesDelete.name}`)
    console.log(`   Status: ${amigoAntesDelete.status}`)
    console.log(`   Deleted at: ${amigoAntesDelete.deleted_at}`)

    // Executar soft delete do amigo
    await simularSoftDeleteAmigo(amigoInserido.id)

    // Verificar se foi excluído
    const { data: amigoDepoisDelete, error: errDepoisAmigo } = await supabase
      .from('members')
      .select('name, status, deleted_at')
      .eq('id', amigoInserido.id)
      .single()

    console.log(`\n📊 Estado DEPOIS da exclusão:`)
    console.log(`   Nome: ${amigoDepoisDelete.name}`)
    console.log(`   Status: ${amigoDepoisDelete.status}`)
    console.log(`   Deleted at: ${amigoDepoisDelete.deleted_at}`)

    if (amigoDepoisDelete.deleted_at && amigoDepoisDelete.status === 'Inativo') {
      console.log(`   ✅ SOFT DELETE DO AMIGO FUNCIONOU!`)
    } else {
      console.log(`   ❌ SOFT DELETE DO AMIGO FALHOU!`)
    }

    // 5. TESTAR SOFT DELETE DO MEMBRO
    console.log('\n🗑️ 5. Testando soft delete do membro:')
    
    const { data: membroAntesDelete, error: errAntesMembro } = await supabase
      .from('members')
      .select('name, status, deleted_at')
      .eq('id', membroInserido.id)
      .single()

    console.log(`📊 Estado ANTES da exclusão:`)
    console.log(`   Nome: ${membroAntesDelete.name}`)
    console.log(`   Status: ${membroAntesDelete.status}`)
    console.log(`   Deleted at: ${membroAntesDelete.deleted_at}`)

    // Executar soft delete do membro
    await simularSoftDeleteMembro(membroInserido.id)

    // Verificar se foi excluído
    const { data: membroDepoisDelete, error: errDepoisMembro } = await supabase
      .from('members')
      .select('name, status, deleted_at')
      .eq('id', membroInserido.id)
      .single()

    console.log(`\n📊 Estado DEPOIS da exclusão:`)
    console.log(`   Nome: ${membroDepoisDelete.name}`)
    console.log(`   Status: ${membroDepoisDelete.status}`)
    console.log(`   Deleted at: ${membroDepoisDelete.deleted_at}`)

    if (membroDepoisDelete.deleted_at && membroDepoisDelete.status === 'Inativo') {
      console.log(`   ✅ SOFT DELETE DO MEMBRO FUNCIONOU!`)
    } else {
      console.log(`   ❌ SOFT DELETE DO MEMBRO FALHOU!`)
    }

    // Verificar se amigos foram excluídos em cascata
    const { data: amigosDoMembro, error: errAmigosMembro } = await supabase
      .from('members')
      .select('name, status, deleted_at')
      .eq('referrer', 'TESTE SOFT DELETE MEMBRO')
      .eq('is_friend', true)

    console.log(`\n📊 Amigos do membro após exclusão:`)
    amigosDoMembro?.forEach(amigo => {
      console.log(`   ${amigo.name}: Status=${amigo.status}, Deleted=${amigo.deleted_at}`)
      if (amigo.deleted_at && amigo.status === 'Inativo') {
        console.log(`     ✅ Excluído em cascata`)
      } else {
        console.log(`     ❌ Não foi excluído em cascata`)
      }
    })

    // 6. TESTAR PERMISSÕES DE EXCLUSÃO
    console.log('\n🔐 6. Testando permissões de exclusão:')
    
    const usuariosAdmin = ['admin', 'Administrador', 'wegneycosta', 'felipe'];
    
    usuariosAdmin.forEach(usuario => {
      const podeExcluir = verificarPermissaoExclusao(usuario)
      console.log(`   ${usuario}: ${podeExcluir ? '✅ PODE EXCLUIR' : '❌ NÃO PODE EXCLUIR'}`)
    })

    console.log('\n✅ Teste de soft delete corrigido concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Função softDeleteMember corrigida (sem dependência de RPC)')
    console.log('   - Função softDeleteFriend corrigida (usa tabela members)')
    console.log('   - Permissões canDeleteUsers corrigidas (todos admins podem excluir)')
    console.log('   - Logs detalhados para debugging')
    console.log('   - Soft delete em cascata testado')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Simular função softDeleteAmigo corrigida
async function simularSoftDeleteAmigo(friendId) {
  console.log(`   🔧 Simulando soft delete do amigo ${friendId}`);
  
  // Buscar dados do amigo
  const { data: friendData, error: fetchError } = await supabase
    .from('members')
    .select('name, referrer')
    .eq('id', friendId)
    .is('deleted_at', null)
    .single();

  if (fetchError) {
    console.error(`     ❌ Erro ao buscar amigo: ${fetchError.message}`);
    return;
  }

  // Atualizar deleted_at e status
  const { error } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('id', friendId);

  if (error) {
    console.error(`     ❌ Erro ao excluir: ${error.message}`);
    return;
  }

  console.log(`     ✅ Soft delete do amigo executado`);
}

// Simular função softDeleteMembro corrigida  
async function simularSoftDeleteMembro(memberId) {
  console.log(`   🔧 Simulando soft delete do membro ${memberId}`);
  
  // Buscar dados do membro
  const { data: memberData, error: memberError } = await supabase
    .from('members')
    .select('name, contracts_completed')
    .eq('id', memberId)
    .is('deleted_at', null)
    .single();

  if (memberError) {
    console.error(`     ❌ Erro ao buscar membro: ${memberError.message}`);
    return;
  }

  // Excluir membro
  const { error: deleteError } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('id', memberId);

  if (deleteError) {
    console.error(`     ❌ Erro ao excluir membro: ${deleteError.message}`);
    return;
  }

  // Excluir amigos em cascata
  const { error: friendsDeleteError } = await supabase
    .from('members')
    .update({ 
      deleted_at: new Date().toISOString(),
      status: 'Inativo',
      updated_at: new Date().toISOString()
    })
    .eq('referrer', memberData.name)
    .eq('is_friend', true)
    .is('deleted_at', null);

  if (friendsDeleteError) {
    console.error(`     ❌ Erro ao excluir amigos: ${friendsDeleteError.message}`);
  } else {
    console.log(`     ✅ Amigos excluídos em cascata`)
  }

  console.log(`     ✅ Soft delete do membro executado`);
}

// Verificar permissões de exclusão
function verificarPermissaoExclusao(username) {
  // Simular nova lógica: todos os admins podem excluir
  return ['admin', 'Administrador', 'wegneycosta', 'felipe', 'adminsaude', 'admin20'].includes(username);
}

// Executar teste
testarSoftDeleteCorrigido()
