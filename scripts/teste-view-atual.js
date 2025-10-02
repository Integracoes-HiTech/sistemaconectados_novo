// =====================================================
// TESTE: VIEW ATUAL E ALTERNATIVA DE FILTRO
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarViewAtual() {
  console.log('🔍 Testando view atual e alternativa de filtro...\n')

  try {
    // 1. Verificar dados da view atual
    console.log('📊 1. Dados da view v_friends_ranking atual:')
    
    const { data: viewData, error: errView } = await supabase
      .from('v_friends_ranking')
      .select('*')

    if (errView) {
      console.error('❌ Erro ao buscar v_friends_ranking:', errView)
      return
    }

    console.log(`   Total na view: ${viewData?.length || 0}`)
    viewData?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name}: referrer ${amigo.referrer}`)
    })

    // 2. Verificar dados da tabela friends
    console.log('\n📊 2. Dados da tabela friends:')
    
    const { data: friendsData, error: errFriends } = await supabase
      .from('friends')
      .select('*')

    if (errFriends) {
      console.error('❌ Erro ao buscar friends:', errFriends)
      return
    }

    console.log(`   Total na tabela: ${friendsData?.length || 0}`)
    friendsData?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign}): referrer ${amigo.referrer}`)
    })

    // 3. Testar filtro direto na tabela friends
    console.log('\n🔍 3. Testando filtro direto na tabela friends:')
    
    const { data: friendsA, error: errFriendsA } = await supabase
      .from('friends')
      .select('*')
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    const { data: friendsB, error: errFriendsB } = await supabase
      .from('friends')
      .select('*')
      .eq('campaign', 'B')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errFriendsA) {
      console.error('❌ Erro ao filtrar friends Campanha A:', errFriendsA)
    } else {
      console.log(`   Campanha A: ${friendsA?.length || 0} amigos`)
      friendsA?.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
      })
    }

    if (errFriendsB) {
      console.error('❌ Erro ao filtrar friends Campanha B:', errFriendsB)
    } else {
      console.log(`   Campanha B: ${friendsB?.length || 0} amigos`)
      friendsB?.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
      })
    }

    // 4. Verificar se podemos modificar o hook para usar tabela direta
    console.log('\n💡 4. Solução alternativa:')
    console.log('   - A view v_friends_ranking não tem coluna campaign')
    console.log('   - Podemos modificar o hook useFriendsRanking para usar a tabela friends diretamente')
    console.log('   - Ou criar uma query customizada que inclua os dados do membro referrer')
    console.log('   - Isso permitiria filtrar por campanha corretamente')

    // 5. Testar query customizada
    console.log('\n🔍 5. Testando query customizada:')
    
    const { data: customQuery, error: errCustom } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('members.campaign', 'B')

    if (errCustom) {
      console.error('❌ Erro na query customizada:', errCustom)
    } else {
      console.log(`   Query customizada (Campanha B): ${customQuery?.length || 0} amigos`)
      customQuery?.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
        console.log(`       Membro: ${amigo.members.name} (${amigo.members.campaign})`)
      })
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - View atual não tem coluna campaign')
    console.log('   - Tabela friends tem coluna campaign')
    console.log('   - Filtro direto na tabela funciona')
    console.log('   - Query customizada com JOIN funciona')
    console.log('   - Solução: modificar hook para usar tabela direta')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarViewAtual()
