// Script para testar cadastro completo de membro
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarCadastroCompleto() {
  console.log('🔍 Testando cadastro completo de membro...\n')

  try {
    // 1. Verificar função can_register_member
    console.log('1. Testando função can_register_member...')
    
    const { data: canRegister, error: canRegisterError } = await supabase
      .rpc('can_register_member')

    if (canRegisterError) {
      console.log('⚠️ Função can_register_member não encontrada')
      console.log('   Execute: docs/CRIAR_FUNCAO_CAN_REGISTER_MEMBER.sql')
    } else {
      console.log('✅ Função can_register_member:', canRegister)
    }

    // 2. Verificar configuração do sistema
    console.log('\n2. Verificando configuração do sistema...')
    
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'max_members')

    if (settingsError) {
      console.log('⚠️ Erro ao buscar configurações:', settingsError.message)
    } else if (!settings || settings.length === 0) {
      console.log('⚠️ Configuração max_members não encontrada')
    } else {
      console.log('✅ Configuração encontrada:', settings[0].setting_value)
    }

    // 3. Verificar contagem atual de membros
    console.log('\n3. Verificando contagem atual de membros...')
    
    const { count: membersCount, error: countError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (countError) {
      console.error('❌ Erro ao contar membros:', countError.message)
    } else {
      console.log('✅ Total de membros ativos:', membersCount)
    }

    // 4. Testar inserção de membro completo
    console.log('\n4. Testando inserção de membro completo...')
    
    const memberData = {
      name: 'Teste Membro Completo',
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
      console.error('   Hint:', memberError.hint)
    } else {
      console.log('✅ Membro inserido com sucesso:', memberInsert.name)
      console.log('   ID:', memberInsert.id)
      console.log('   Campanha:', memberInsert.campaign)
      
      // Limpar teste
      await supabase
        .from('members')
        .delete()
        .eq('id', memberInsert.id)
      console.log('✅ Membro de teste removido')
    }

    // 5. Verificar estrutura da tabela
    console.log('\n5. Verificando estrutura da tabela members...')
    
    const { data: estrutura, error: estruturaError } = await supabase
      .from('members')
      .select('*')
      .limit(1)

    if (estruturaError) {
      console.error('❌ Erro na estrutura:', estruturaError.message)
    } else {
      console.log('✅ Estrutura da tabela members:')
      if (estrutura && estrutura.length > 0) {
        Object.keys(estrutura[0]).forEach(campo => {
          console.log(`   - ${campo}: ${typeof estrutura[0][campo]}`)
        })
      }
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Execute: docs/CRIAR_FUNCAO_CAN_REGISTER_MEMBER.sql')
    console.log('2. Execute: docs/VERIFICAR_RLS_MEMBERS.sql')
    console.log('3. Teste o cadastro no frontend')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarCadastroCompleto()
