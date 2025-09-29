// Script para testar se o link existe no banco e diagnosticar o problema no Hostinger
import { createClient } from '@supabase/supabase-js'

// Substitua pelas suas credenciais do Supabase
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnosticarLink(linkId) {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO LINK')
  console.log('================================')
  console.log(`Link ID: ${linkId}`)
  console.log(`URL completa: https://conectadosdigital.com.br/cadastro/${linkId}`)
  console.log('')

  try {
    // 1. Verificar se o link existe
    console.log('1️⃣ Verificando se o link existe no banco...')
    const { data: linkData, error: linkError } = await supabase
      .from('user_links')
      .select(`
        *,
        user_data:auth_users(*)
      `)
      .eq('link_id', linkId)
      .single()

    if (linkError) {
      if (linkError.code === 'PGRST116') {
        console.log('❌ Link NÃO encontrado no banco de dados')
        console.log('   Isso explica o erro 404!')
        return
      }
      throw linkError
    }

    console.log('✅ Link encontrado no banco!')
    console.log('')

    // 2. Verificar status do link
    console.log('2️⃣ Verificando status do link...')
    console.log(`   - ID: ${linkData.id}`)
    console.log(`   - Ativo: ${linkData.is_active ? '✅ Sim' : '❌ Não'}`)
    console.log(`   - Deletado: ${linkData.deleted_at ? '❌ Sim' : '✅ Não'}`)
    console.log(`   - Tipo: ${linkData.link_type}`)
    console.log(`   - Cliques: ${linkData.click_count}`)
    console.log(`   - Registros: ${linkData.registration_count}`)
    console.log('')

    // 3. Verificar dados do usuário
    console.log('3️⃣ Verificando dados do usuário referrer...')
    if (linkData.user_data) {
      console.log(`   - Nome: ${linkData.user_data.name}`)
      console.log(`   - Role: ${linkData.user_data.role}`)
      console.log(`   - Ativo: ${linkData.user_data.is_active ? '✅ Sim' : '❌ Não'}`)
      console.log(`   - Instagram: ${linkData.user_data.instagram}`)
    } else {
      console.log('❌ Dados do usuário não encontrados')
    }
    console.log('')

    // 4. Verificar se o link está válido para uso
    console.log('4️⃣ Verificando se o link está válido...')
    const isValid = linkData.is_active && !linkData.deleted_at
    if (isValid) {
      console.log('✅ Link está válido e pode ser usado')
    } else {
      console.log('❌ Link está inválido:')
      if (!linkData.is_active) console.log('   - Link está inativo')
      if (linkData.deleted_at) console.log('   - Link foi deletado')
    }
    console.log('')

    // 5. Diagnóstico do problema
    console.log('5️⃣ DIAGNÓSTICO DO PROBLEMA 404:')
    if (isValid) {
      console.log('✅ O link existe e está válido no banco')
      console.log('❌ O problema é de roteamento no servidor Hostinger')
      console.log('')
      console.log('🔧 SOLUÇÕES POSSÍVEIS:')
      console.log('   1. Verificar se o arquivo .htaccess está na raiz do site')
      console.log('   2. Verificar se o mod_rewrite está habilitado no Hostinger')
      console.log('   3. Verificar se o arquivo index.html existe na raiz')
      console.log('   4. Testar com uma URL mais simples primeiro')
      console.log('')
      console.log('🧪 TESTE MANUAL:')
      console.log('   Acesse: https://conectadosdigital.com.br/')
      console.log('   Se funcionar, o problema é específico do roteamento SPA')
    } else {
      console.log('❌ O link não está válido no banco')
      console.log('   Isso pode causar o erro 404')
    }

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message)
  }
}

// Testar o link específico
const linkId = 'user-d9a4bd83-1cce-4bb3-9296-6c086be97d27'
diagnosticarLink(linkId)
