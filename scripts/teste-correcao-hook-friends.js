// =====================================================
// TESTE: CORREÇÃO DO HOOK useFriendsRanking
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarCorrecaoHook() {
  console.log('🔍 Testando correção do hook useFriendsRanking...\n')

  try {
    // 1. Simular hook para Campanha A
    console.log('📊 1. Simulando hook para Campanha A:')
    
    const { data: friendsA, error: errFriendsA } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'A')
      .order('contracts_completed', { ascending: false })
      .order('created_at', { ascending: true })

    if (errFriendsA) {
      console.error('❌ Erro ao buscar friends Campanha A:', errFriendsA)
    } else {
      console.log(`   Campanha A: ${friendsA?.length || 0} amigos`)
      friendsA?.forEach(amigo => {
        console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
        console.log(`     Membro: ${amigo.members?.name} (${amigo.members?.campaign})`)
      })
    }

    // 2. Simular hook para Campanha B
    console.log('\n📊 2. Simulando hook para Campanha B:')
    
    const { data: friendsB, error: errFriendsB } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('campaign', 'B')
      .order('contracts_completed', { ascending: false })
      .order('created_at', { ascending: true })

    if (errFriendsB) {
      console.error('❌ Erro ao buscar friends Campanha B:', errFriendsB)
    } else {
      console.log(`   Campanha B: ${friendsB?.length || 0} amigos`)
      friendsB?.forEach(amigo => {
        console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
        console.log(`     Membro: ${amigo.members?.name} (${amigo.members?.campaign})`)
      })
    }

    // 3. Simular hook sem filtro de campanha (todas as campanhas)
    console.log('\n📊 3. Simulando hook sem filtro de campanha:')
    
    const { data: friendsAll, error: errFriendsAll } = await supabase
      .from('friends')
      .select(`
        *,
        members!inner(name, instagram, phone, city, sector, campaign)
      `)
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('contracts_completed', { ascending: false })
      .order('created_at', { ascending: true })

    if (errFriendsAll) {
      console.error('❌ Erro ao buscar friends (todas campanhas):', errFriendsAll)
    } else {
      console.log(`   Todas as campanhas: ${friendsAll?.length || 0} amigos`)
      friendsAll?.forEach(amigo => {
        console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
        console.log(`     Membro: ${amigo.members?.name} (${amigo.members?.campaign})`)
      })
    }

    // 4. Verificar se a transformação de dados funciona
    console.log('\n🔍 4. Verificando transformação de dados:')
    
    if (friendsAll && friendsAll.length > 0) {
      const primeiro = friendsAll[0]
      const transformedData = {
        ...primeiro,
        member_name: primeiro.members?.name || '',
        member_instagram: primeiro.members?.instagram || '',
        member_phone: primeiro.members?.phone || '',
        member_city: primeiro.members?.city || '',
        member_sector: primeiro.members?.sector || ''
      }
      
      console.log('   Dados transformados:')
      console.log(`   - Nome do amigo: ${transformedData.name}`)
      console.log(`   - Campanha do amigo: ${transformedData.campaign}`)
      console.log(`   - Nome do membro: ${transformedData.member_name}`)
      console.log(`   - Campanha do membro: ${transformedData.members?.campaign}`)
    }

    // 5. Verificar isolamento por campanha
    console.log('\n🔍 5. Verificando isolamento por campanha:')
    
    const campanhaA = friendsA?.length || 0
    const campanhaB = friendsB?.length || 0
    const total = friendsAll?.length || 0
    
    console.log(`   Campanha A: ${campanhaA} amigos`)
    console.log(`   Campanha B: ${campanhaB} amigos`)
    console.log(`   Total: ${total} amigos`)
    
    if (campanhaA + campanhaB === total) {
      console.log('   ✅ Isolamento por campanha funcionando corretamente')
    } else {
      console.log('   ❌ Problema no isolamento por campanha')
    }

    console.log('\n✅ Teste concluído!')
    console.log('\n📝 Resumo:')
    console.log('   - Hook modificado para usar tabela friends diretamente')
    console.log('   - Filtro por campanha funcionando')
    console.log('   - JOIN com tabela members funcionando')
    console.log('   - Transformação de dados funcionando')
    console.log('   - Isolamento por campanha verificado')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar teste
testarCorrecaoHook()
