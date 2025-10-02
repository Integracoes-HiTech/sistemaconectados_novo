// Script para testar cadastro de membro
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarCadastroMembro() {
  console.log('🔍 Testando cadastro de membro...\n')

  try {
    // 1. Verificar estrutura da tabela members
    console.log('1. Verificando estrutura da tabela members...')
    
    const { data: estrutura, error: estruturaError } = await supabase
      .from('members')
      .select('*')
      .limit(1)

    if (estruturaError) {
      console.error('❌ Erro na tabela members:', estruturaError.message)
    } else {
      console.log('✅ Tabela members acessível')
    }

    // 2. Verificar função can_register_member
    console.log('\n2. Testando função can_register_member...')
    
    const { data: canRegister, error: canRegisterError } = await supabase
      .rpc('can_register_member')

    if (canRegisterError) {
      console.error('❌ Erro na função can_register_member:', canRegisterError.message)
    } else {
      console.log('✅ Função can_register_member:', canRegister)
    }

    // 3. Verificar RLS na tabela members
    console.log('\n3. Verificando RLS na tabela members...')
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'members' })
      .single()

    if (rlsError) {
      console.log('ℹ️ Não foi possível verificar RLS automaticamente')
    } else {
      console.log('✅ Status RLS members:', rlsStatus ? 'Ativo' : 'Desabilitado')
    }

    // 4. Testar inserção de membro
    console.log('\n4. Testando inserção de membro...')
    
    const memberData = {
      name: 'Teste Membro',
      phone: '62999999999',
      instagram: '@testemembro',
      city: 'Goiânia',
      sector: 'Setor Central',
      referrer: 'Admin',
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      campaign: 'A',
      couple_name: 'Teste Cônjuge',
      couple_phone: '62988888888',
      couple_instagram: '@testeconjuge',
      couple_city: 'Goiânia',
      couple_sector: 'Setor Central',
      contracts_completed: 0,
      ranking_status: 'Vermelho',
      is_top_1500: false,
      can_be_replaced: false,
      is_friend: false
    }
    
    const { data: memberInsert, error: memberError } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single()

    if (memberError) {
      console.error('❌ Erro ao inserir membro:', memberError.message)
      console.error('   Código:', memberError.code)
      console.error('   Detalhes:', memberError.details)
    } else {
      console.log('✅ Membro inserido com sucesso:', memberInsert.name)
      
      // Limpar teste
      await supabase
        .from('members')
        .delete()
        .eq('id', memberInsert.id)
      console.log('✅ Membro de teste removido')
    }

    // 5. Verificar campos obrigatórios
    console.log('\n5. Verificando campos obrigatórios...')
    
    const camposObrigatorios = [
      'name', 'phone', 'city', 'sector', 'referrer', 
      'registration_date', 'status', 'campaign',
      'couple_name', 'couple_phone', 'couple_city', 'couple_sector'
    ]
    
    console.log('Campos obrigatórios:', camposObrigatorios.join(', '))

    console.log('\n🎉 Teste concluído!')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarCadastroMembro()
