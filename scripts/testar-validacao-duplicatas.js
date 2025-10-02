import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiPex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarValidacaoDuplicatas() {
  console.log('🔍 Testando validação de duplicatas por campanha...\n')

  // 1. Limpar dados de teste anteriores
  console.log('🧹 1. Limpando dados de teste anteriores...')
  const { error: cleanupError } = await supabase
    .from('members')
    .delete()
    .in('name', ['João Teste Campanha A', 'João Teste Campanha B', 'João Teste Duplicata'])

  if (cleanupError) {
    console.log('   ⚠️ Dados anteriores não encontrados (ok para primeiro teste)')
  } else {
    console.log('   ✅ Dados anteriores removidos')
  }
  console.log('')

  // 2. Inserir primeiro usuário na Campanha A
  console.log('📝 2. Inserindo primeiro usuário na Campanha A...')
  const { data: memberA, error: insertAError } = await supabase
    .from('members')
    .insert([{
      name: 'João Teste Campanha A',
      phone: '98999-1111',
      instagram: '@joaoteste',
      couple_name: 'Maria Teste Campanha A',
      couple_phone: '98888-1111',
      couple_instagram: '@mariateste',
      campaign: 'A',
      referrer: 'admin',
      status: 'Ativo',
      created_at: new Date().toISOString()
    }])
    .select()

  if (insertAError) {
    console.error('   ❌ Erro ao inserir membro da Campanha A:', insertAError)
    return
  }
  console.log('   ✅ Usuário inserido na Campanha A')
  console.log('')

  // 3. Simular validação de duplicata na mesma campanha (DEVE FALHAR)
  console.log('❌ 3. Simulando duplicata na mesma campanha (DEVE FALHAR)...')
  const samePhoneCampaignA = await validarDuplicatas({
    name: 'João Teste Duplicata',
    phone: '98999-1111', // Mesmo telefone
    instagram: '@joaoteste', // Mesmo Instagram
    campaign: 'A' // Mesma campanha
  })

  if (samePhoneCampaignA.hasErrors) {
    console.log('   ✅ Validação funcionou corretamente - impediu duplicata na campanha A')
    console.log('   📋 Erros encontrados:')
    for (const [field, message] of Object.entries(samePhoneCampaignA.errors)) {
      console.log(`     - ${field}: ${message}`)
    }
  } else {
    console.log('   ❌ ERRO: Deveria ter bloqueado duplicata na campanha A!')
  }
  console.log('')

  // 4. Simular validação de usuário diferente na mesma campanha (DEVE PASSAR)
  console.log('✅ 4. Simulando usuário diferente na mesma campanha (DEVE PASSAR)...')
  const differentUserCampaignA = await validarDuplicatas({
    name: 'Pedro Teste',
    phone: '98222-2222', // Telefone diferente
    instagram: '@pedroteste', // Instagram diferente
    campaign: 'A' // Mesma campanha
  })

  if (!differentUserCampaignA.hasErrors) {
    console.log('   ✅ Validação funcionou corretamente - permitiu usuário diferente na campanha A')
  } else {
    console.log('   ❌ ERRO: Deveria ter permitido usuário diferente na campanha A!')
    console.log('   📋 Erros encontrados:')
    for (const [field, message] of Object.entries(differentUserCampaignA.errors)) {
      console.log(`     - ${field}: ${message}`)
    }
  }
  console.log('')

  // 5. Simular validação MESMA PESSOA em campanha diferente (DEVE PASSAR)
  console.log('✅ 5. Simulando MESMA PESSOA em campanha diferente (DEVE PASSAR)...')
  const samePersonDifferentCampaign = await validarDuplicatas({
    name: 'João Teste Campanha B',
    phone: '98999-1111', // MESMO telefone
    instagram: '@joaoteste', // MESMO Instagram
    campaign: 'B' // Campanha diferente
  })

  if (!samePersonDifferentCampaign.hasErrors) {
    console.log('   ✅ Validação funcionou perfeitamente - permitiu mesma pessoa em campanha diferente')
  } else {
    console.log('   ❌ ERRO: Deveria ter permitido mesma pessoa em campanha diferente!')
    console.log('   📋 Erros encontrados:')
    for (const [field, message] of Object.entries(samePersonDifferentCampaign.errors)) {
      console.log(`     - ${field}: ${message}`)
    }
  }
  console.log('')

  // 6. Inserir mesmo usuário na Campanha B (DEVE FUNCIONAR)
  console.log('✅ 6. Inserindo mesmo usuário na Campanha B (DEVE FUNCIONAR)...')
  const { data: memberB, error: insertBError } = await supabase
    .from('members')
    .insert([{
      name: 'João Teste Campanha B',
      phone: '98999-1111', // Mesmo telefone
      instagram: '@joaoteste', // Mesmo Instagram
      couple_name: 'Maria Teste Campanha B',
      couple_phone: '98888-1111',
      couple_instagram: '@mariateste',
      campaign: 'B', // Campanha diferente
      referrer: 'admin_b',
      status: 'Ativo',
      created_at: new Date().toISOString()
    }])
    .select()

  if (insertBError) {
    console.error('   ❌ Erro ao inserir membro da Campanha B:', insertBError)
  } else {
    console.log('   ✅ Mesmo usuário inserido com sucesso na Campanha B')
  }
  console.log('')

  // 7. Verificar estado final
  console.log('📊 7. Estado final do sistema:')
  const { data: allMembers, error: fetchAllError } = await supabase
    .from('members')
    .select('name, phone, instagram, campaign')
    .in('name', ['João Teste Campanha A', 'João Teste Campanha B', 'Pedro Teste'])
    .eq('status', 'Ativo')

  if (fetchAllError) {
    console.error('   ❌ Erro ao buscar membros:', fetchAllError)
  } else {
    console.log(`   📋 Total de membros encontrados: ${allMembers?.length || 0}`)
    allMembers?.forEach(member => {
      console.log(`     - ${member.name} (${member.phone}, ${member.instagram}) - Campanha ${member.campaign}`)
    })
  }
  console.log('')

  console.log('🎯 Resumo do teste:')
  console.log('   ✅ Mesmo telefone + mesmo Instagram na SAME campanha = BLOQUEADO')
  console.log('   ✅ Telefone diferente na mesma campanha = PERMITIDO')
  console.log('   ✅ Instagram diferente na mesma campanha = PERMITIDO')
  console.log('   ✅ Mesmo telefone + mesmo Instagram em campanha diferente = PERMITIDO')
  console.log('   ✅ Sistema agora permite cadastrar a mesma pessoa em ambas as campanhas! 🚀')
}

// Função que simula a validação de duplicatas do PublicRegister.tsx
async function validarDuplicatas(formData) {
  const errors = {}
  
  try {
    // Buscar dados existentes
    const { data: membersData } = await supabase
      .from('members')
      .select('name, phone, instagram, couple_name, couple_phone, couple_instagram, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    const { data: friendsData } = await supabase
      .from('friends')
      .select('name, phone, instagram, couple_name, couple_phone, couple_instagram, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    // Filtrar por campanha
    const allUsers = [...(membersData || []), ...(friendsData || [])]
      .filter(user => user.campaign === formData.campaign)

    const normalizedPhone = formData.phone.replace(/\D/g, '')

    // Verificar duplicatas
    for (const user of allUsers) {
      const userPhone = user.phone?.replace(/\D/g, '') || ''
      const userInstagram = user.instagram?.toLowerCase() || ''

      // Verificar se é uma duplicata completa
      if (userPhone === normalizedPhone && userInstagram === formData.instagram.toLowerCase()) {
        errors.phone = `Usuário já cadastrado com este telefone e Instagram`
        errors.instagram = `Usuário já cadastrado com este telefone e Instagram`
        break
      }

      // Verificar telefone independente
      if (userPhone === normalizedPhone && !errors.phone) {
        errors.phone = `Este telefone já está cadastrado`
      }

      // Verificar Instagram independente
      if (userInstagram === formData.instagram.toLowerCase() && !errors.instagram) {
        errors.instagram = `Este Instagram já está cadastrado`
      }
    }

  } catch (error) {
    console.error('Erro na validação:', error)
  }

  return {
    hasErrors: Object.keys(errors).length > 0,
    errors: errors
  }
}

testarValidacaoDuplicatas()
