// Script para testar RLS corrigido
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarRLSCorrigido() {
  console.log('🔍 Testando RLS corrigido...\n')

  try {
    // 1. Buscar usuário válido
    console.log('1. Buscando usuário válido...')
    
    const { data: usuarios, error: usuariosError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, is_active')
      .eq('is_active', true)
      .in('role', ['admin', 'Administrador'])
      .limit(1)

    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError.message)
      return
    }

    if (!usuarios || usuarios.length === 0) {
      console.error('❌ Nenhum usuário administrador encontrado')
      return
    }

    const usuario = usuarios[0]
    console.log('✅ Usuário encontrado:', usuario.username, '-', usuario.name)

    // 2. Testar inserção de link
    console.log('\n2. Testando inserção de link...')
    
    const testLinkId = 'TESTE_RLS_' + Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const { data: linkTest, error: linkError } = await supabase
      .from('user_links')
      .insert([{
        user_id: usuario.id,
        link_id: testLinkId,
        referrer_name: 'Teste RLS',
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
      
      // 3. Limpar teste
      console.log('\n3. Limpando teste...')
      
      const { error: deleteError } = await supabase
        .from('user_links')
        .delete()
        .eq('id', linkTest.id)

      if (deleteError) {
        console.error('❌ Erro ao remover teste:', deleteError.message)
      } else {
        console.log('✅ Link de teste removido')
      }
    }

    // 4. Verificar RLS
    console.log('\n4. Verificando status do RLS...')
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'user_links' })
      .single()

    if (rlsError) {
      console.log('ℹ️ Não foi possível verificar RLS automaticamente')
      console.log('   Execute: SELECT rowsecurity FROM pg_tables WHERE tablename = \'user_links\';')
    } else {
      console.log('✅ Status RLS:', rlsStatus ? 'Ativo' : 'Desabilitado')
    }

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Próximos passos:')
    console.log('1. Execute: docs/CORRIGIR_RLS_FINAL_CORRIGIDO.sql')
    console.log('2. Execute: docs/INSERIR_DADOS_TESTE_FINAL.sql')
    console.log('3. Teste o sistema no frontend')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarRLSCorrigido()
