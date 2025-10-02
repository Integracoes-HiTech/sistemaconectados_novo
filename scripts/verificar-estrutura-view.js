// =====================================================
// VERIFICAR ESTRUTURA DA VIEW v_friends_ranking
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarEstruturaView() {
  console.log('🔍 Verificando estrutura da view v_friends_ranking...\n')

  try {
    // 1. Verificar dados da view
    console.log('📊 1. Dados da view v_friends_ranking:')
    
    const { data: viewData, error: errView } = await supabase
      .from('v_friends_ranking')
      .select('*')
      .limit(1)

    if (errView) {
      console.error('❌ Erro ao buscar v_friends_ranking:', errView)
      return
    }

    if (viewData && viewData.length > 0) {
      const primeiro = viewData[0]
      console.log('   Colunas disponíveis na view:')
      Object.keys(primeiro).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof primeiro[coluna]} = ${primeiro[coluna]}`)
      })
    } else {
      console.log('   Nenhum dado encontrado na view')
    }

    // 2. Verificar dados da tabela friends
    console.log('\n📊 2. Dados da tabela friends:')
    
    const { data: friendsData, error: errFriends } = await supabase
      .from('friends')
      .select('*')
      .limit(1)

    if (errFriends) {
      console.error('❌ Erro ao buscar friends:', errFriends)
      return
    }

    if (friendsData && friendsData.length > 0) {
      const primeiro = friendsData[0]
      console.log('   Colunas disponíveis na tabela friends:')
      Object.keys(primeiro).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof primeiro[coluna]} = ${primeiro[coluna]}`)
      })
    } else {
      console.log('   Nenhum dado encontrado na tabela friends')
    }

    // 3. Verificar dados da tabela members
    console.log('\n📊 3. Dados da tabela members:')
    
    const { data: membersData, error: errMembers } = await supabase
      .from('members')
      .select('*')
      .limit(1)

    if (errMembers) {
      console.error('❌ Erro ao buscar members:', errMembers)
      return
    }

    if (membersData && membersData.length > 0) {
      const primeiro = membersData[0]
      console.log('   Colunas disponíveis na tabela members:')
      Object.keys(primeiro).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof primeiro[coluna]} = ${primeiro[coluna]}`)
      })
    } else {
      console.log('   Nenhum dado encontrado na tabela members')
    }

    // 4. Verificar se a view precisa ser recriada
    console.log('\n🔍 4. Análise do problema:')
    console.log('   - A view v_friends_ranking não tem a coluna "campaign"')
    console.log('   - Isso impede o filtro por campanha no hook useFriendsRanking')
    console.log('   - A view precisa ser recriada incluindo a coluna campaign')
    console.log('   - A campanha deve ser herdada do membro referrer')

    console.log('\n✅ Verificação concluída!')
    console.log('\n📝 Próximos passos:')
    console.log('   1. Recriar a view v_friends_ranking incluindo a coluna campaign')
    console.log('   2. A campanha deve ser herdada do membro referrer')
    console.log('   3. Testar o filtro por campanha no dashboard')

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
  }
}

// Executar verificação
verificarEstruturaView()
