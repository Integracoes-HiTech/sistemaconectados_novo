// =====================================================
// CORRIGIR ROLE DO FELIPE
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function corrigirRoleFelipe() {
  console.log('🔧 Corrigindo role do Felipe...\n')

  try {
    // 1. Buscar dados atuais do Felipe
    console.log('📊 1. Dados atuais do Felipe:')
    
    const { data: felipeAtual, error: buscaError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, full_name, campaign')
      .eq('username', 'felipe')
      .single()

    if (buscaError) {
      console.error('❌ Erro ao buscar Felipe:', buscaError.message)
      return
    }

    console.log(`   Username: ${felipeAtual.username}`)
    console.log(`   Name: ${felipeAtual.name}`)
    console.log(`   Role atual: ${felipeAtual.role}`)
    console.log(`   Full Name atual: ${felipeAtual.full_name}`)
    console.log(`   Campaign: ${felipeAtual.campaign}`)

    // 2. Corrigir role para não ser administrativo padrão
    console.log('\n🔧 2. Corrigindo role do Felipe:')
    
    const { error: updateError } = await supabase
      .from('auth_users')
      .update({
        role: 'Felipe',
        full_name: 'Felipe',
        updated_at: new Date().toISOString()
      })
      .eq('username', 'felipe')

    if (updateError) {
      console.error('❌ Erro ao atualizar Felipe:', updateError.message)
      return
    }

    console.log('   ✅ Role atualizado: Felipe')
    console.log('   ✅ Full name atualizado: Felipe')

    // 3. Verificar resultado
    console.log('\n📊 3. Verificando resultado:')
    
    const { data: felipeCorrigido, error: verificacaoError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, full_name, campaign')
      .eq('username', 'felipe')
      .single()

    if (verificacaoError) {
      console.error('❌ Erro na verificação:', verificacaoError.message)
      return
    }

    console.log(`   ✅ Role corrigido: ${felipeCorrigido.role}`)
    console.log(`   ✅ Full name corrigido: ${felipeCorrigido.full_name}`)
    console.log(`   ✅ Username: ${felipeCorrigido.username}`)

    console.log('\n📋 4. Testando lógica do dashboard:')
    
    // Simular a lógica do dashboard
    const simulacaoDashboard = () => {
      const user = felipeCorrigido
      
      if (user.username === 'wegneycosta') {
        return 'VEREADOR'
      } else if (user.username === 'felipe') {
        return 'FELIPE'
      } else if (user.role === 'Membro') {
        return 'MEMBRO'
      } else {
        return 'ADMIN'
      }
    }

    const rotuloExibido = simulacaoDashboard()
    console.log(`   🎯 Rótulo que será exibido: "${rotuloExibido}"`)

    console.log('\n✅ Correção concluída!')
    console.log('\n📝 Resumo:')
    console.log('   - Role atualizado de "Felipe Admin" para "Felipe"')
    console.log('   - Full name atualizado de "Felipe Admin" para "Felipe"')  
    console.log('   - Agora o dashboard mostrará apenas "FELIPE"')
    console.log('   - Pode fazer refresh da página para ver a mudança')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar correção
corrigirRoleFelipe()
