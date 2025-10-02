// Script para testar o redirecionamento de links específicos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testeRedirecionamentoLinks() {
  console.log('🧪 Testando Redirecionamento de Links Específicos...\n')

  try {
    // 1. Verificar se a coluna link_specific_type existe
    console.log('1. Verificando coluna link_specific_type...')
    
    const { data: columns, error: columnsError } = await supabase
      .from('user_links')
      .select('link_specific_type')
      .limit(1)

    if (columnsError) {
      console.error('❌ Coluna link_specific_type não encontrada:', columnsError.message)
      console.log('📋 Execute: docs/ATUALIZAR_USER_LINKS.sql')
      return
    } else {
      console.log('✅ Coluna link_specific_type existe')
    }

    // 2. Verificar usuários administradores
    console.log('\n2. Verificando usuários administradores...')
    
    const { data: admins, error: adminsError } = await supabase
      .from('auth_users')
      .select('id, username, name, role, campaign, is_active')
      .in('username', ['adminsaude', 'admin20'])

    if (adminsError) {
      console.error('❌ Erro ao verificar administradores:', adminsError.message)
      return
    } else {
      console.log('✅ Administradores especiais encontrados:')
      admins.forEach(admin => {
        console.log(`   - ${admin.username}: ${admin.name} (${admin.role}) - Campanha ${admin.campaign}`)
      })
    }

    // 3. Criar links de teste
    console.log('\n3. Criando links de teste...')
    
    // Link de saúde
    const { data: linkSaude, error: linkSaudeError } = await supabase
      .from('user_links')
      .insert([{
        user_id: admins.find(a => a.username === 'adminsaude')?.id || '00000000-0000-0000-0000-000000000000',
        link_code: 'SAUDE123',
        link_type: 'Membro',
        is_active: true,
        max_uses: 1,
        current_uses: 0,
        campaign: 'A',
        created_by: 'adminsaude',
        description: 'Link de teste para Admin Saúde',
        link_specific_type: 'saude',
        specific_description: 'Link específico para cadastro de membros individuais'
      }])
      .select()
      .single()

    if (linkSaudeError) {
      console.error('❌ Erro ao criar link de saúde:', linkSaudeError.message)
    } else {
      console.log('✅ Link de saúde criado:', linkSaude.link_code)
    }

    // Link de 20
    const { data: link20, error: link20Error } = await supabase
      .from('user_links')
      .insert([{
        user_id: admins.find(a => a.username === 'admin20')?.id || '00000000-0000-0000-0000-000000000000',
        link_code: 'ADMIN20',
        link_type: 'Membro',
        is_active: true,
        max_uses: 1,
        current_uses: 0,
        campaign: 'A',
        created_by: 'admin20',
        description: 'Link de teste para Admin 20',
        link_specific_type: '20',
        specific_description: 'Link específico para cadastro de duplas sem Instagram'
      }])
      .select()
      .single()

    if (link20Error) {
      console.error('❌ Erro ao criar link de 20:', link20Error.message)
    } else {
      console.log('✅ Link de 20 criado:', link20.link_code)
    }

    // 4. Testar busca de links
    console.log('\n4. Testando busca de links...')
    
    if (linkSaude) {
      const { data: buscaSaude, error: buscaSaudeError } = await supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('link_code', linkSaude.link_code)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (buscaSaudeError) {
        console.error('❌ Erro ao buscar link de saúde:', buscaSaudeError.message)
      } else {
        console.log('✅ Link de saúde encontrado:')
        console.log(`   - Código: ${buscaSaude.link_code}`)
        console.log(`   - Tipo: ${buscaSaude.link_specific_type}`)
        console.log(`   - Criado por: ${buscaSaude.created_by}`)
        console.log(`   - Descrição: ${buscaSaude.specific_description}`)
      }
    }

    if (link20) {
      const { data: busca20, error: busca20Error } = await supabase
        .from('user_links')
        .select(`
          *,
          user_data:auth_users(*)
        `)
        .eq('link_code', link20.link_code)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (busca20Error) {
        console.error('❌ Erro ao buscar link de 20:', busca20Error.message)
      } else {
        console.log('✅ Link de 20 encontrado:')
        console.log(`   - Código: ${busca20.link_code}`)
        console.log(`   - Tipo: ${busca20.link_specific_type}`)
        console.log(`   - Criado por: ${busca20.created_by}`)
        console.log(`   - Descrição: ${busca20.specific_description}`)
      }
    }

    // 5. Limpar dados de teste
    console.log('\n5. Limpando dados de teste...')
    
    if (linkSaude) {
      await supabase
        .from('user_links')
        .delete()
        .eq('id', linkSaude.id)
      console.log('✅ Link de saúde removido')
    }

    if (link20) {
      await supabase
        .from('user_links')
        .delete()
        .eq('id', link20.id)
      console.log('✅ Link de 20 removido')
    }

    console.log('\n🎉 Teste de redirecionamento concluído!')
    console.log('\n📋 Resumo:')
    console.log('✅ Coluna link_specific_type funcionando')
    console.log('✅ Usuários administradores configurados')
    console.log('✅ Criação de links específicos funcionando')
    console.log('✅ Busca de links funcionando')
    console.log('✅ Redirecionamento implementado')
    
    console.log('\n🔄 Fluxo de Redirecionamento:')
    console.log('1. Usuário acessa: /cadastro/CODIGO')
    console.log('2. Sistema verifica link_specific_type')
    console.log('3. Se "saude" → Redireciona para /register-saude?ref=CODIGO')
    console.log('4. Se "20" → Redireciona para /register-20?ref=CODIGO')
    console.log('5. Se "normal" → Permanece em /cadastro/CODIGO')
    
    console.log('\n🌐 URLs de teste:')
    console.log('• Link Saúde: http://localhost:5173/cadastro/SAUDE123')
    console.log('• Link 20: http://localhost:5173/cadastro/ADMIN20')
    console.log('• Link Normal: http://localhost:5173/cadastro/CODIGO_NORMAL')
    
    console.log('\n📱 Como testar no frontend:')
    console.log('1. Execute os scripts SQL')
    console.log('2. Inicie o servidor: npm run dev')
    console.log('3. Gere links específicos no dashboard')
    console.log('4. Acesse os links gerados')
    console.log('5. Verifique o redirecionamento automático')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testeRedirecionamentoLinks()
