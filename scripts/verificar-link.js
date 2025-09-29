// Script para verificar se um link de usuário existe no banco de dados
import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase (substitua pelas suas credenciais)
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verificarLink(linkId) {
  try {
    console.log(`🔍 Verificando link: ${linkId}`)
    
    const { data, error } = await supabase
      .from('user_links')
      .select(`
        *,
        user_data:auth_users(*)
      `)
      .eq('link_id', linkId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Link não encontrado no banco de dados')
        return { exists: false, error: 'Link não encontrado' }
      }
      throw error
    }

    console.log('✅ Link encontrado!')
    console.log('📋 Dados do link:')
    console.log(`   - ID: ${data.id}`)
    console.log(`   - Link ID: ${data.link_id}`)
    console.log(`   - Usuário ID: ${data.user_id}`)
    console.log(`   - Referrer: ${data.referrer_name}`)
    console.log(`   - Tipo: ${data.link_type}`)
    console.log(`   - Ativo: ${data.is_active}`)
    console.log(`   - Cliques: ${data.click_count}`)
    console.log(`   - Registros: ${data.registration_count}`)
    console.log(`   - Criado em: ${data.created_at}`)
    
    if (data.user_data) {
      console.log('👤 Dados do usuário:')
      console.log(`   - Nome: ${data.user_data.name}`)
      console.log(`   - Role: ${data.user_data.role}`)
      console.log(`   - Instagram: ${data.user_data.instagram}`)
    }

    return { exists: true, data }
  } catch (error) {
    console.error('❌ Erro ao verificar link:', error.message)
    return { exists: false, error: error.message }
  }
}

// Verificar o link específico do erro
const linkId = 'user-d9a4bd83-1cce-4bb3-9296-6c086be97d27'
verificarLink(linkId)
  .then(result => {
    if (result.exists) {
      console.log('\n🎉 Link válido! O problema é de roteamento no servidor.')
    } else {
      console.log('\n⚠️  Link inválido ou expirado.')
    }
  })
  .catch(error => {
    console.error('Erro fatal:', error)
  })
