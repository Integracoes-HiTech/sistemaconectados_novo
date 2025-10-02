// =====================================================
// TESTE: VIEW v_friends_ranking E FILTRO POR CAMPANHA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarViewFriendsRanking() {
  console.log('🔍 Testando view v_friends_ranking e filtro por campanha...\n')

  try {
    // 1. Verificar dados da tabela friends
    console.log('📊 1. Dados da tabela friends:')
    
    const { data: friendsData, error: errFriends } = await supabase
      .from('friends')
      .select('id, name, couple_name, referrer, campaign, status')
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (errFriends) {
      console.error('❌ Erro ao buscar friends:', errFriends)
      return
    }

    console.log(`   Total de amigos: ${friendsData?.length || 0}`)
    friendsData?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign || 'NULL'}): referrer ${amigo.referrer}`)
    })

    // 2. Verificar dados da view v_friends_ranking
    console.log('\n📊 2. Dados da view v_friends_ranking:')
    
    const { data: viewData, error: errView } = await supabase
      .from('v_friends_ranking')
      .select('*')

    if (errView) {
      console.error('❌ Erro ao buscar v_friends_ranking:', errView)
      return
    }

    console.log(`   Total na view: ${viewData?.length || 0}`)
    viewData?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign || 'NULL'}): referrer ${amigo.referrer}`)
    })

    // 3. Verificar filtro por campanha A
    console.log('\n🔍 3. Filtro por Campanha A:')
    
    const { data: viewA, error: errViewA } = await supabase
      .from('v_friends_ranking')
      .select('*')
      .eq('campaign', 'A')

    if (errViewA) {
      console.error('❌ Erro ao buscar v_friends_ranking (Campanha A):', errViewA)
      return
    }

    console.log(`   Amigos da Campanha A: ${viewA?.length || 0}`)
    viewA?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign}): referrer ${amigo.referrer}`)
    })

    // 4. Verificar filtro por campanha B
    console.log('\n🔍 4. Filtro por Campanha B:')
    
    const { data: viewB, error: errViewB } = await supabase
      .from('v_friends_ranking')
      .select('*')
      .eq('campaign', 'B')

    if (errViewB) {
      console.error('❌ Erro ao buscar v_friends_ranking (Campanha B):', errViewB)
      return
    }

    console.log(`   Amigos da Campanha B: ${viewB?.length || 0}`)
    viewB?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign}): referrer ${amigo.referrer}`)
    })

    // 5. Verificar se há amigos sem campanha
    console.log('\n🔍 5. Amigos sem campanha definida:')
    
    const { data: viewNull, error: errViewNull } = await supabase
      .from('v_friends_ranking')
      .select('*')
      .is('campaign', null)

    if (errViewNull) {
      console.error('❌ Erro ao buscar v_friends_ranking (sem campanha):', errViewNull)
      return
    }

    console.log(`   Amigos sem campanha: ${viewNull?.length || 0}`)
    viewNull?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign}): referrer ${amigo.referrer}`)
    })

    // 6. Verificar estrutura da view
    console.log('\n🔍 6. Estrutura da view v_friends_ranking:')
    
    if (viewData && viewData.length > 0) {
      const primeiro = viewData[0]
      console.log('   Colunas disponíveis:')
      Object.keys(primeiro).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof primeiro[coluna]} = ${primeiro[coluna]}`)
      })
    }

    // 7. Verificar se a view está herdando campanha do membro referrer
    console.log('\n🔍 7. Verificando herança de campanha do referrer:')
    
    const { data: viewComReferrer, error: errViewComReferrer } = await supabase
      .from('v_friends_ranking')
      .select('name, couple_name, referrer, campaign, member_name, member_city, member_sector')
      .limit(5)

    if (errViewComReferrer) {
      console.error('❌ Erro ao buscar dados com referrer:', errViewComReferrer)
      return
    }

    console.log(`   Amigos com dados do referrer: ${viewComReferrer?.length || 0}`)
    viewComReferrer?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name}`)
      console.log(`     Referrer: ${amigo.referrer}`)
      console.log(`     Campanha do amigo: ${amigo.campaign || 'NULL'}`)
      console.log(`     Dados do membro: ${amigo.member_name} (${amigo.member_city})`)
    })

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Dados da tabela friends verificados')
    console.log('   - Dados da view v_friends_ranking verificados')
    console.log('   - Filtro por campanha testado')
    console.log('   - Amigos sem campanha verificados')
    console.log('   - Estrutura da view verificada')
    console.log('   - Herança de campanha do referrer verificada')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarViewFriendsRanking()
