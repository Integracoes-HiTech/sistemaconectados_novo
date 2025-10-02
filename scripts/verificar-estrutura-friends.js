// =====================================================
// VERIFICAR ESTRUTURA DA TABELA FRIENDS
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarEstruturaFriends() {
  console.log('🔍 Verificando estrutura da tabela friends...\n')

  try {
    // 1. Buscar um amigo existente para ver a estrutura
    console.log('📊 1. Estrutura da tabela friends:')
    const { data: amigos, error: errAmigos } = await supabase
      .from('friends')
      .select('*')
      .limit(1)

    if (errAmigos) {
      console.error('❌ Erro ao buscar amigos:', errAmigos)
      return
    }

    if (amigos && amigos.length > 0) {
      console.log('   Colunas encontradas:')
      Object.keys(amigos[0]).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof amigos[0][coluna]}`)
      })
    } else {
      console.log('   Nenhum amigo encontrado na tabela')
    }

    // 2. Tentar inserir um amigo com estrutura mínima
    console.log('\n🧪 2. Testando inserção com estrutura mínima:')
    const amigoData = {
      name: `Amigo Teste ${Date.now()}`,
      couple_name: `Cônjuge Teste ${Date.now()}`,
      phone: '11999999999',
      couple_phone: '11888888888',
      instagram: `@amigoteste${Date.now()}`,
      couple_instagram: `@conjugeteste${Date.now()}`,
      city: 'São Paulo',
      sector: 'Centro',
      referrer: 'Teste Membro',
      campaign: 'A',
      status: 'Ativo'
    }

    const { data: amigoCriado, error: errCriar } = await supabase
      .from('friends')
      .insert([amigoData])
      .select()
      .single()

    if (errCriar) {
      console.error('❌ Erro ao criar amigo:', errCriar)
    } else {
      console.log('✅ Amigo criado com sucesso!')
      console.log('   Estrutura do amigo criado:')
      Object.keys(amigoCriado).forEach(coluna => {
        console.log(`   - ${coluna}: ${amigoCriado[coluna]}`)
      })

      // Limpar amigo de teste
      const { error: errDelete } = await supabase
        .from('friends')
        .delete()
        .eq('id', amigoCriado.id)

      if (errDelete) {
        console.error('❌ Erro ao remover amigo de teste:', errDelete)
      } else {
        console.log('✅ Amigo de teste removido')
      }
    }

    // 3. Verificar estrutura da tabela members para comparação
    console.log('\n📊 3. Estrutura da tabela members:')
    const { data: membros, error: errMembros } = await supabase
      .from('members')
      .select('*')
      .limit(1)

    if (errMembros) {
      console.error('❌ Erro ao buscar membros:', errMembros)
    } else if (membros && membros.length > 0) {
      console.log('   Colunas encontradas:')
      Object.keys(membros[0]).forEach(coluna => {
        console.log(`   - ${coluna}: ${typeof membros[0][coluna]}`)
      })
    }

    console.log('\n✅ Verificação concluída!')

  } catch (error) {
    console.error('❌ Erro geral na verificação:', error)
  }
}

// Executar verificação
verificarEstruturaFriends()
