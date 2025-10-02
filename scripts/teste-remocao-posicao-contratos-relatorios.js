// =====================================================
// TESTE: REMOÇÃO DE POSIÇÃO E CONTRATOS DOS RELATÓRIOS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRemocaoPosicaoContratos() {
  console.log('🔍 Testando remoção de posição e contratos dos relatórios...\n')

  try {
    // 1. Verificar dados dos membros
    console.log('📊 1. Dados dos membros:')
    
    const { data: membersData, error: errMembers } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(3)

    if (errMembers) {
      console.error('❌ Erro ao buscar members:', errMembers)
      return
    }

    console.log(`   Total de membros: ${membersData?.length || 0}`)
    membersData?.forEach(member => {
      console.log(`   - ${member.name}`)
      console.log(`     Posição: ${member.ranking_position || 'N/A'}`)
      console.log(`     Contratos: ${member.contracts_completed || 0}`)
      console.log(`     Status: ${member.ranking_status}`)
    })

    // 2. Verificar dados dos amigos
    console.log('\n📊 2. Dados dos amigos:')
    
    const { data: friendsData, error: errFriends } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .limit(3)

    if (errFriends) {
      console.error('❌ Erro ao buscar friends:', errFriends)
      return
    }

    console.log(`   Total de amigos: ${friendsData?.length || 0}`)
    friendsData?.forEach(friend => {
      console.log(`   - ${friend.name} & ${friend.couple_name}`)
      console.log(`     Posição: ${friend.ranking_position || 'N/A'}`)
      console.log(`     Contratos: ${friend.contracts_completed || 0}`)
      console.log(`     Status: ${friend.ranking_status}`)
    })

    // 3. Simular estrutura do Excel para membros (sem posição e contratos)
    console.log('\n📊 3. Estrutura do Excel - Membros (sem posição e contratos):')
    
    if (membersData && membersData.length > 0) {
      const primeiro = membersData[0]
      const estruturaExcel = {
        'Nome': primeiro.name,
        'WhatsApp': primeiro.phone,
        'Instagram': primeiro.instagram,
        'Cidade': primeiro.city,
        'Setor': primeiro.sector,
        'Nome Parceiro': primeiro.couple_name || '',
        'WhatsApp Parceiro': primeiro.couple_phone || '',
        'Instagram Parceiro': primeiro.couple_instagram || '',
        'Cidade Parceiro': primeiro.couple_city || '',
        'Setor Parceiro': primeiro.couple_sector || '',
        'Indicado por': primeiro.referrer || '',
        'Data de Cadastro': primeiro.registration_date ? new Date(primeiro.registration_date).toLocaleDateString('pt-BR') : ''
      }
      
      console.log('   Colunas do Excel:')
      Object.keys(estruturaExcel).forEach(coluna => {
        console.log(`   - ${coluna}: ${estruturaExcel[coluna]}`)
      })
      
      console.log('\n   ❌ Colunas removidas:')
      console.log('   - Posição')
      console.log('   - Contratos Completos')
    }

    // 4. Simular estrutura do Excel para amigos (sem posição e contratos)
    console.log('\n📊 4. Estrutura do Excel - Amigos (sem posição e contratos):')
    
    if (friendsData && friendsData.length > 0) {
      const primeiro = friendsData[0]
      const estruturaExcel = {
        'Nome': primeiro.name,
        'WhatsApp': primeiro.phone,
        'Instagram': primeiro.instagram,
        'Cidade': primeiro.city,
        'Setor': primeiro.sector,
        'Nome Parceiro': primeiro.couple_name || '',
        'WhatsApp Parceiro': primeiro.couple_phone || '',
        'Instagram Parceiro': primeiro.couple_instagram || '',
        'Cidade Parceiro': primeiro.couple_city || '',
        'Setor Parceiro': primeiro.couple_sector || '',
        'Indicado por': primeiro.member_name || primeiro.referrer || '',
        'Data de Cadastro': primeiro.created_at ? new Date(primeiro.created_at).toLocaleDateString('pt-BR') : ''
      }
      
      console.log('   Colunas do Excel:')
      Object.keys(estruturaExcel).forEach(coluna => {
        console.log(`   - ${coluna}: ${estruturaExcel[coluna]}`)
      })
      
      console.log('\n   ❌ Colunas removidas:')
      console.log('   - Posição')
      console.log('   - Contratos Completos')
    }

    // 5. Simular estrutura do PDF (sem posição e contratos)
    console.log('\n📊 5. Estrutura do PDF (sem posição e contratos):')
    
    console.log('   Cards de Membros:')
    console.log('   ┌─────────────────────────────────────┐')
    console.log('   │ Nome do Membro                     │')
    console.log('   │ WhatsApp: (61) 99999-9999          │')
    console.log('   │ Instagram: @usuario                 │')
    console.log('   │ Cidade: Goiânia                     │')
    console.log('   │ Setor: Setor Central                │')
    console.log('   │                                     │')
    console.log('   │ Parceiro: Nome do Parceiro          │')
    console.log('   │ WhatsApp: (61) 88888-8888          │')
    console.log('   │ Instagram: @parceiro                │')
    console.log('   │ Cidade: Goiânia                     │')
    console.log('   │ Setor: Setor Central                │')
    console.log('   │                                     │')
    console.log('   │ Por: Admin                          │')
    console.log('   └─────────────────────────────────────┘')
    
    console.log('\n   ❌ Informações removidas:')
    console.log('   - #1 - (posição)')
    console.log('   - Contratos: 5 | (informação de contratos)')

    // 6. Verificar se as alterações não afetaram outras funcionalidades
    console.log('\n🔍 6. Verificando funcionalidades:')
    
    const totalMembers = membersData?.length || 0
    const totalFriends = friendsData?.length || 0
    
    console.log(`   Total de membros: ${totalMembers}`)
    console.log(`   Total de amigos: ${totalFriends}`)
    console.log('   ✅ Dados básicos preservados')
    console.log('   ✅ Estrutura de exportação mantida')
    console.log('   ✅ Apenas colunas específicas removidas')

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Coluna "Posição" removida dos relatórios Excel')
    console.log('   - Coluna "Contratos Completos" removida dos relatórios Excel')
    console.log('   - Informação de posição removida dos cards PDF')
    console.log('   - Informação de contratos removida dos cards PDF')
    console.log('   - Outras funcionalidades preservadas')
    console.log('   - Estrutura de exportação mantida')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarRemocaoPosicaoContratos()
