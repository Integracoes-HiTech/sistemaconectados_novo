// Script para testar problemas no sistema
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarProblemas() {
  console.log('🔍 Testando problemas no sistema...\n')

  try {
    // 1. Testar estrutura da tabela user_links
    console.log('1. Testando estrutura da tabela user_links...')
    
    const { data: estrutura, error: estruturaError } = await supabase
      .from('user_links')
      .select('*')
      .limit(1)

    if (estruturaError) {
      console.error('❌ Erro na tabela user_links:', estruturaError.message)
    } else {
      console.log('✅ Tabela user_links acessível')
    }

    // 2. Testar inserção de link
    console.log('\n2. Testando inserção de link...')
    
    const testUserId = '00000000-0000-0000-0000-000000000000'
    const testLinkId = 'TESTE' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data: linkTest, error: linkError } = await supabase
      .from('user_links')
      .insert([{
        user_id: testUserId,
        link_id: testLinkId,
        referrer_name: 'Teste',
        is_active: true,
        click_count: 0,
        registration_count: 0,
        link_type: 'members'
      }])
      .select()
      .single()

    if (linkError) {
      console.error('❌ Erro ao inserir link:', linkError.message)
    } else {
      console.log('✅ Link inserido com sucesso:', linkTest.link_id)
      
      // Limpar teste
      await supabase
        .from('user_links')
        .delete()
        .eq('id', linkTest.id)
      console.log('✅ Link de teste removido')
    }

    // 3. Testar dados de membros
    console.log('\n3. Testando dados de membros...')
    
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('count')
      .limit(1)

    if (membersError) {
      console.error('❌ Erro na tabela members:', membersError.message)
    } else {
      console.log('✅ Tabela members acessível')
    }

    // 4. Testar configurações do sistema
    console.log('\n4. Testando configurações do sistema...')
    
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .eq('setting_key', 'member_links_type')

    if (settingsError) {
      console.error('❌ Erro nas configurações:', settingsError.message)
    } else {
      console.log('✅ Configurações encontradas:', settings.length)
      if (settings.length > 0) {
        console.log('   - member_links_type:', settings[0].setting_value)
      }
    }

    // 5. Testar usuários administradores
    console.log('\n5. Testando usuários administradores...')
    
    const { data: admins, error: adminsError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, is_active')
      .in('role', ['admin', 'Administrador'])
      .eq('is_active', true)

    if (adminsError) {
      console.error('❌ Erro ao buscar administradores:', adminsError.message)
    } else {
      console.log('✅ Administradores encontrados:', admins.length)
      admins.forEach(admin => {
        console.log(`   - ${admin.username}: ${admin.name} (${admin.role})`)
      })
    }

    // 6. Testar contagem de dados para relatórios
    console.log('\n6. Testando dados para relatórios...')
    
    const { count: membersCount, error: membersCountError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (membersCountError) {
      console.error('❌ Erro ao contar membros:', membersCountError.message)
    } else {
      console.log('✅ Total de membros ativos:', membersCount)
    }

    const { count: friendsCount, error: friendsCountError } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (friendsCountError) {
      console.error('❌ Erro ao contar amigos:', friendsCountError.message)
    } else {
      console.log('✅ Total de amigos ativos:', friendsCount)
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Resumo dos problemas:')
    console.log('1. Verificar se a tabela user_links tem as colunas corretas')
    console.log('2. Verificar se os administradores podem gerar links')
    console.log('3. Verificar se há dados para exportar nos relatórios')
    console.log('4. Verificar configurações do sistema')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarProblemas()
