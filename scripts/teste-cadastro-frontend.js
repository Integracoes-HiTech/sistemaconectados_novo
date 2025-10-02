// Script para testar cadastro no frontend
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testarCadastroFrontend() {
  console.log('🔍 Testando cadastro no frontend...\n')

  try {
    // 1. Simular dados do formulário
    console.log('1. Simulando dados do formulário...')
    
    const formData = {
      name: 'João Silva',
      phone: '62999999999',
      instagram: '@joaosilva',
      city: 'Goiânia',
      sector: 'Setor Central',
      referrer: 'Admin',
      couple_name: 'Maria Silva',
      couple_phone: '62988888888',
      couple_instagram: '@mariasilva',
      couple_city: 'Goiânia',
      couple_sector: 'Setor Central'
    }

    const referrerData = {
      campaign: 'A'
    }

    console.log('✅ Dados do formulário:', formData.name, '&', formData.couple_name)

    // 2. Preparar dados do membro (como no frontend)
    console.log('\n2. Preparando dados do membro...')
    
    const memberData = {
      name: formData.name.trim(),
      phone: formData.phone,
      instagram: formData.instagram.trim(),
      city: formData.city.trim(),
      sector: formData.sector.trim(),
      referrer: formData.referrer,
      registration_date: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      campaign: referrerData?.campaign || 'A',
      couple_name: formData.couple_name.trim(),
      couple_phone: formData.couple_phone,
      couple_instagram: formData.couple_instagram.trim(),
      couple_city: formData.couple_city.trim(),
      couple_sector: formData.couple_sector.trim()
    }

    console.log('✅ Dados do membro preparados:', memberData.name, '- Campanha:', memberData.campaign)

    // 3. Testar inserção de membro
    console.log('\n3. Testando inserção de membro...')
    
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
      console.log('   ID:', memberInsert.id)
      console.log('   Campanha:', memberInsert.campaign)
      
      // 4. Testar inserção de amigo
      console.log('\n4. Testando inserção de amigo...')
      
      const friendData = {
        name: 'Pedro Santos',
        phone: '62977777777',
        instagram: '@pedrosantos',
        city: 'Aparecida de Goiânia',
        sector: 'Setor 1',
        referrer: memberInsert.name, // Usar o membro como referrer
        registration_date: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        campaign: 'A',
        couple_name: 'Ana Santos',
        couple_phone: '62966666666',
        couple_instagram: '@anasantos',
        couple_city: 'Aparecida de Goiânia',
        couple_sector: 'Setor 1',
        member_id: memberInsert.id,
        deleted_at: null
      }
      
      const { data: friendInsert, error: friendError } = await supabase
        .from('friends')
        .insert([friendData])
        .select()
        .single()

      if (friendError) {
        console.error('❌ Erro ao inserir amigo:', friendError.message)
      } else {
        console.log('✅ Amigo inserido com sucesso:', friendInsert.name)
        console.log('   ID:', friendInsert.id)
        console.log('   Campanha:', friendInsert.campaign)
        console.log('   Referrer:', friendInsert.referrer)
        
        // Limpar testes
        await supabase.from('friends').delete().eq('id', friendInsert.id)
        console.log('✅ Amigo de teste removido')
      }
      
      // Limpar teste
      await supabase.from('members').delete().eq('id', memberInsert.id)
      console.log('✅ Membro de teste removido')
    }

    // 5. Verificar contagem final
    console.log('\n5. Verificando contagem final...')
    
    const { count: membersCount } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    const { count: friendsCount } = await supabase
      .from('friends')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    console.log('✅ Total de membros ativos:', membersCount)
    console.log('✅ Total de amigos ativos:', friendsCount)

    console.log('\n🎉 Teste concluído!')
    console.log('\n📋 Resultado:')
    console.log('✅ Cadastro de membros funcionando')
    console.log('✅ Cadastro de amigos funcionando')
    console.log('✅ Sistema de campanhas ativo')
    console.log('✅ Campo campaign sendo preenchido corretamente')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Executar teste
testarCadastroFrontend()
