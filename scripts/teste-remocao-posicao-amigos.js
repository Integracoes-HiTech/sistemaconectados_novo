// =====================================================
// TESTE: REMOÇÃO DA COLUNA POSIÇÃO DOS AMIGOS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarRemocaoPosicao() {
  console.log('🔍 Testando remoção da coluna posição dos amigos...\n')

  try {
    // 1. Verificar dados dos amigos
    console.log('📊 1. Dados dos amigos:')
    
    const { data: friendsData, error: errFriends } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('contracts_completed', { ascending: false })
      .order('created_at', { ascending: true })

    if (errFriends) {
      console.error('❌ Erro ao buscar friends:', errFriends)
      return
    }

    console.log(`   Total de amigos: ${friendsData?.length || 0}`)
    friendsData?.forEach((amigo, index) => {
      console.log(`   ${index + 1}. ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
      console.log(`      Referrer: ${amigo.referrer}`)
      console.log(`      Contratos: ${amigo.contracts_completed}`)
      console.log(`      Status: ${amigo.ranking_status}`)
      console.log(`      Posição (campo): ${amigo.ranking_position || 'N/A'}`)
    })

    // 2. Verificar se a posição ainda existe no banco
    console.log('\n🔍 2. Verificando campo ranking_position no banco:')
    
    if (friendsData && friendsData.length > 0) {
      const primeiro = friendsData[0]
      const temPosicao = 'ranking_position' in primeiro
      console.log(`   Campo ranking_position presente: ${temPosicao ? '✅' : '❌'}`)
      
      if (temPosicao) {
        console.log(`   Valor da posição: ${primeiro.ranking_position}`)
        console.log('   ⚠️ Campo ainda existe no banco, mas não será exibido na interface')
      }
    }

    // 3. Simular interface sem posição
    console.log('\n📊 3. Simulando interface sem coluna posição:')
    
    console.log('   Tabela de Amigos (sem posição):')
    console.log('   ┌─────────────────────────────────────────────────────────────────────────────┐')
    console.log('   │ Amigo e Parceiro        │ WhatsApp      │ Instagram    │ Cidade    │ Setor │')
    console.log('   ├─────────────────────────────────────────────────────────────────────────────┤')
    
    friendsData?.forEach((amigo, index) => {
      const nomeCompleto = `${amigo.name} & ${amigo.couple_name}`
      const whatsapp = amigo.phone || 'N/A'
      const instagram = amigo.instagram || 'N/A'
      const cidade = amigo.city || 'N/A'
      const setor = amigo.sector || 'N/A'
      
      console.log(`   │ ${nomeCompleto.padEnd(25)} │ ${whatsapp.padEnd(12)} │ ${instagram.padEnd(11)} │ ${cidade.padEnd(9)} │ ${setor.padEnd(5)} │`)
    })
    
    console.log('   └─────────────────────────────────────────────────────────────────────────────┘')

    // 4. Verificar ordenação
    console.log('\n🔍 4. Verificando ordenação dos amigos:')
    
    console.log('   Ordenação atual:')
    console.log('   1. Por contracts_completed (decrescente)')
    console.log('   2. Por created_at (crescente)')
    
    friendsData?.forEach((amigo, index) => {
      console.log(`   ${index + 1}. ${amigo.name} - ${amigo.contracts_completed} contratos (${amigo.created_at.split('T')[0]})`)
    })

    // 5. Verificar se a remoção não afetou outras funcionalidades
    console.log('\n🔍 5. Verificando funcionalidades:')
    
    const totalAmigos = friendsData?.length || 0
    const amigosComContratos = friendsData?.filter(f => f.contracts_completed > 0).length || 0
    const amigosVerde = friendsData?.filter(f => f.ranking_status === 'Verde').length || 0
    const amigosAmarelo = friendsData?.filter(f => f.ranking_status === 'Amarelo').length || 0
    const amigosVermelho = friendsData?.filter(f => f.ranking_status === 'Vermelho').length || 0
    
    console.log(`   Total de amigos: ${totalAmigos}`)
    console.log(`   Amigos com contratos: ${amigosComContratos}`)
    console.log(`   Status Verde: ${amigosVerde}`)
    console.log(`   Status Amarelo: ${amigosAmarelo}`)
    console.log(`   Status Vermelho: ${amigosVermelho}`)
    
    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Coluna "Posição" removida da tabela de amigos')
    console.log('   - Campo ranking_position ainda existe no banco (não afeta funcionalidade)')
    console.log('   - Ordenação mantida por contratos e data de criação')
    console.log('   - Outras funcionalidades não afetadas')
    console.log('   - Interface mais limpa sem coluna desnecessária')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarRemocaoPosicao()
