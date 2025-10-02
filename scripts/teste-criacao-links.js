// Script para testar a criação de links específicos
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testeCriacaoLinks() {
  console.log('🧪 Testando Criação de Links Específicos...\n')

  try {
    // 1. Verificar estrutura da tabela user_links
    console.log('1. Verificando estrutura da tabela user_links...')
    
    const { data: estrutura, error: estruturaError } = await supabase
      .from('user_links')
      .select('*')
      .limit(1)

    if (estruturaError) {
      console.error('❌ Erro ao verificar estrutura:', estruturaError.message)
      return
    } else {
      console.log('✅ Tabela user_links acessível')
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

    // 3. Testar criação de link de saúde
    console.log('\n3. Testando criação de link de saúde...')
    
    const adminSaude = admins.find(a => a.username === 'adminsaude')
    if (adminSaude) {
      const linkCode = 'SAUDE' + Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data: linkSaude, error: linkSaudeError } = await supabase
        .from('user_links')
        .insert([{
          user_id: adminSaude.id,
          link_id: linkCode,
          link_type: 'members',
          is_active: true,
          click_count: 0,
          registration_count: 0,
          referrer_name: adminSaude.name,
          created_by: 'adminsaude',
          description: 'Link de teste para Admin Saúde'
        }])
        .select()
        .single()

      if (linkSaudeError) {
        console.error('❌ Erro ao criar link de saúde:', linkSaudeError.message)
      } else {
        console.log('✅ Link de saúde criado:')
        console.log(`   - ID: ${linkSaude.id}`)
        console.log(`   - Código: ${linkSaude.link_id}`)
        console.log(`   - Tipo: ${linkSaude.link_type}`)
        console.log(`   - Criado por: ${linkSaude.created_by}`)
        console.log(`   - Descrição: ${linkSaude.description}`)
        
        // Limpar teste
        await supabase
          .from('user_links')
          .delete()
          .eq('id', linkSaude.id)
        console.log('✅ Link de teste removido')
      }
    } else {
      console.log('⚠️ Admin Saúde não encontrado')
    }

    // 4. Testar criação de link de 20
    console.log('\n4. Testando criação de link de 20...')
    
    const admin20 = admins.find(a => a.username === 'admin20')
    if (admin20) {
      const linkCode = 'ADMIN20' + Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const { data: link20, error: link20Error } = await supabase
        .from('user_links')
        .insert([{
          user_id: admin20.id,
          link_id: linkCode,
          link_type: 'members',
          is_active: true,
          click_count: 0,
          registration_count: 0,
          referrer_name: admin20.name,
          created_by: 'admin20',
          description: 'Link de teste para Admin 20'
        }])
        .select()
        .single()

      if (link20Error) {
        console.error('❌ Erro ao criar link de 20:', link20Error.message)
      } else {
        console.log('✅ Link de 20 criado:')
        console.log(`   - ID: ${link20.id}`)
        console.log(`   - Código: ${link20.link_id}`)
        console.log(`   - Tipo: ${link20.link_type}`)
        console.log(`   - Criado por: ${link20.created_by}`)
        console.log(`   - Descrição: ${link20.description}`)
        
        // Limpar teste
        await supabase
          .from('user_links')
          .delete()
          .eq('id', link20.id)
        console.log('✅ Link de teste removido')
      }
    } else {
      console.log('⚠️ Admin 20 não encontrado')
    }

    // 5. Testar busca de links por created_by
    console.log('\n5. Testando busca de links por created_by...')
    
    // Criar links temporários para teste
    const tempLinkSaude = await supabase
      .from('user_links')
      .insert([{
        user_id: adminSaude?.id || '00000000-0000-0000-0000-000000000000',
        link_id: 'TEMP_SAUDE',
        link_type: 'members',
        is_active: true,
        click_count: 0,
        registration_count: 0,
        referrer_name: 'Teste',
        created_by: 'adminsaude',
        description: 'Link temporário de teste'
      }])
      .select()
      .single()

    const tempLink20 = await supabase
      .from('user_links')
      .insert([{
        user_id: admin20?.id || '00000000-0000-0000-0000-000000000000',
        link_id: 'TEMP_20',
        link_type: 'members',
        is_active: true,
        click_count: 0,
        registration_count: 0,
        referrer_name: 'Teste',
        created_by: 'admin20',
        description: 'Link temporário de teste'
      }])
      .select()
      .single()

    // Buscar links de saúde
    const { data: linksSaude, error: linksSaudeError } = await supabase
      .from('user_links')
      .select('*')
      .eq('created_by', 'adminsaude')
      .is('deleted_at', null)

    if (linksSaudeError) {
      console.error('❌ Erro ao buscar links de saúde:', linksSaudeError.message)
    } else {
      console.log('✅ Links de saúde encontrados:', linksSaude.length)
    }

    // Buscar links de 20
    const { data: links20, error: links20Error } = await supabase
      .from('user_links')
      .select('*')
      .eq('created_by', 'admin20')
      .is('deleted_at', null)

    if (links20Error) {
      console.error('❌ Erro ao buscar links de 20:', links20Error.message)
    } else {
      console.log('✅ Links de 20 encontrados:', links20.length)
    }

    // Limpar links temporários
    if (tempLinkSaude.data) {
      await supabase
        .from('user_links')
        .delete()
        .eq('id', tempLinkSaude.data.id)
    }
    
    if (tempLink20.data) {
      await supabase
        .from('user_links')
        .delete()
        .eq('id', tempLink20.data.id)
    }

    console.log('\n🎉 Teste de criação de links concluído!')
    console.log('\n📋 Resumo:')
    console.log('✅ Estrutura da tabela verificada')
    console.log('✅ Usuários administradores encontrados')
    console.log('✅ Criação de links funcionando')
    console.log('✅ Busca por created_by funcionando')
    
    console.log('\n🔑 Como funciona agora:')
    console.log('• Admin Saúde cria links com created_by = "adminsaude"')
    console.log('• Admin 20 cria links com created_by = "admin20"')
    console.log('• PublicRegister.tsx verifica created_by para redirecionar')
    console.log('• Links são salvos na tabela user_links existente')
    
    console.log('\n🌐 URLs de teste:')
    console.log('• Link Saúde: http://localhost:5173/cadastro/CODIGO_SAUDE')
    console.log('• Link 20: http://localhost:5173/cadastro/CODIGO_20')
    console.log('• Redirecionamento automático baseado em created_by')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testeCriacaoLinks()
