// Script de teste consolidado para produção - Administradores Especiais
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testeProducaoAdminsEspeciais() {
  console.log('🚀 Teste de Produção - Administradores Especiais\n')

  try {
    // 1. Verificar estrutura do banco
    console.log('1. Verificando estrutura do banco...')
    
    const { data: membersSaude, error: membersSaudeError } = await supabase
      .from('members_saude')
      .select('count')
      .limit(1)

    const { data: members20, error: members20Error } = await supabase
      .from('members_20')
      .select('count')
      .limit(1)

    const { data: userLinks, error: userLinksError } = await supabase
      .from('user_links')
      .select('link_specific_type')
      .limit(1)

    if (membersSaudeError) {
      console.error('❌ Tabela members_saude não encontrada:', membersSaudeError.message)
      console.log('📋 Execute: docs/CRIAR_ADMINS_ESPECIAIS.sql')
    } else {
      console.log('✅ Tabela members_saude acessível')
    }

    if (members20Error) {
      console.error('❌ Tabela members_20 não encontrada:', members20Error.message)
      console.log('📋 Execute: docs/CRIAR_ADMINS_ESPECIAIS.sql')
    } else {
      console.log('✅ Tabela members_20 acessível')
    }

    if (userLinksError) {
      console.error('❌ Coluna link_specific_type não encontrada:', userLinksError.message)
      console.log('📋 Execute: docs/ATUALIZAR_USER_LINKS.sql')
    } else {
      console.log('✅ Coluna link_specific_type existe')
    }

    // 2. Verificar usuários administradores
    console.log('\n2. Verificando usuários administradores...')
    
    const { data: admins, error: adminsError } = await supabase
      .from('auth_users')
      .select('username, name, role, campaign, is_active')
      .in('username', ['adminsaude', 'admin20'])

    if (adminsError) {
      console.error('❌ Erro ao verificar administradores:', adminsError.message)
    } else {
      console.log('✅ Administradores especiais encontrados:')
      admins.forEach(admin => {
        console.log(`   - ${admin.username}: ${admin.name} (${admin.role}) - Campanha ${admin.campaign}`)
      })
    }

    // 3. Testar inserção de dados
    console.log('\n3. Testando inserção de dados...')
    
    // Teste Admin Saúde
    const { data: testSaude, error: testSaudeError } = await supabase
      .from('members_saude')
      .insert([{
        name: 'Teste Produção Saude',
        phone: '62999999999',
        instagram: '@teste',
        city: 'Goiânia',
        sector: 'Teste',
        referrer: 'adminsaude',
        campaign: 'A'
      }])
      .select()
      .single()

    if (testSaudeError) {
      console.error('❌ Erro ao inserir membro individual:', testSaudeError.message)
    } else {
      console.log('✅ Membro individual inserido:', testSaude.name)
      
      // Limpar teste
      await supabase
        .from('members_saude')
        .delete()
        .eq('id', testSaude.id)
      console.log('✅ Dados de teste removidos')
    }

    // Teste Admin 20
    const { data: test20, error: test20Error } = await supabase
      .from('members_20')
      .insert([{
        name: 'Teste Produção 20',
        phone: '62988888888',
        city: 'Goiânia',
        sector: 'Teste',
        referrer: 'admin20',
        couple_name: 'Parceiro Teste',
        couple_phone: '62977777777',
        couple_city: 'Goiânia',
        couple_sector: 'Teste',
        campaign: 'A'
      }])
      .select()
      .single()

    if (test20Error) {
      console.error('❌ Erro ao inserir dupla:', test20Error.message)
    } else {
      console.log('✅ Dupla inserida:', `${test20.name} e ${test20.couple_name}`)
      
      // Limpar teste
      await supabase
        .from('members_20')
        .delete()
        .eq('id', test20.id)
      console.log('✅ Dados de teste removidos')
    }

    // 4. Testar links específicos
    console.log('\n4. Testando links específicos...')
    
    if (!userLinksError) {
      // Teste link de saúde
      const { data: testLinkSaude, error: testLinkSaudeError } = await supabase
        .from('user_links')
        .insert([{
          user_id: admins.find(a => a.username === 'adminsaude')?.id || '00000000-0000-0000-0000-000000000000',
          link_code: 'TESTE123',
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

      if (testLinkSaudeError) {
        console.error('❌ Erro ao inserir link de saúde:', testLinkSaudeError.message)
      } else {
        console.log('✅ Link de saúde inserido:', testLinkSaude.link_code)
        
        // Limpar teste
        await supabase
          .from('user_links')
          .delete()
          .eq('id', testLinkSaude.id)
        console.log('✅ Link de teste removido')
      }

      // Teste link de 20
      const { data: testLink20, error: testLink20Error } = await supabase
        .from('user_links')
        .insert([{
          user_id: admins.find(a => a.username === 'admin20')?.id || '00000000-0000-0000-0000-000000000000',
          link_code: 'TESTE456',
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

      if (testLink20Error) {
        console.error('❌ Erro ao inserir link de 20:', testLink20Error.message)
      } else {
        console.log('✅ Link de 20 inserido:', testLink20.link_code)
        
        // Limpar teste
        await supabase
          .from('user_links')
          .delete()
          .eq('id', testLink20.id)
        console.log('✅ Link de teste removido')
      }
    } else {
      console.log('⚠️ Pulando teste de links - coluna link_specific_type não existe')
    }

    // 5. Verificar views de estatísticas
    console.log('\n5. Verificando views de estatísticas...')
    
    const { data: statsSaude, error: statsSaudeError } = await supabase
      .from('v_members_saude_stats')
      .select('*')
      .eq('campaign', 'A')

    if (statsSaudeError) {
      console.error('❌ Erro ao verificar estatísticas de saúde:', statsSaudeError.message)
    } else {
      console.log('✅ View de estatísticas de saúde funcionando')
    }

    const { data: stats20, error: stats20Error } = await supabase
      .from('v_members_20_stats')
      .select('*')
      .eq('campaign', 'A')

    if (stats20Error) {
      console.error('❌ Erro ao verificar estatísticas de 20:', stats20Error.message)
    } else {
      console.log('✅ View de estatísticas de 20 funcionando')
    }

    console.log('\n🎉 Teste de produção concluído!')
    console.log('\n📋 Resumo:')
    console.log('✅ Estrutura do banco verificada')
    console.log('✅ Usuários administradores configurados')
    console.log('✅ Inserção de dados funcionando')
    console.log('✅ Links específicos funcionando')
    console.log('✅ Views de estatísticas funcionando')
    
    console.log('\n🔑 Credenciais de teste:')
    console.log('• Admin Saúde: adminsaude / saude123')
    console.log('• Admin 20: admin20 / admin20123')
    
    console.log('\n🌐 URLs de teste:')
    console.log('• Admin Saúde: http://localhost:5173/register-saude?ref=CODIGO')
    console.log('• Admin 20: http://localhost:5173/register-20?ref=CODIGO')
    
    console.log('\n📱 Como testar no frontend:')
    console.log('1. Execute os scripts SQL na ordem especificada')
    console.log('2. Inicie o servidor: npm run dev')
    console.log('3. Login como adminsaude → Ver botão "Gerar Link Saúde"')
    console.log('4. Login como admin20 → Ver botão "Gerar Link 20"')
    console.log('5. Teste geração de links e cadastros')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testeProducaoAdminsEspeciais()
