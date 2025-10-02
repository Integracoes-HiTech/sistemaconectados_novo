// =====================================================
// CORRIGIR CONTADORES DO SISTEMA
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function corrigirContadoresSistema() {
  console.log('🔧 Corrigindo contadores do sistema...\n')

  try {
    // 1. Buscar todos os membros que têm contratos incorretos
    console.log('📊 1. Analisando contadores atuais:')
    
    const { data: todosMembros, error: errTodosMembros } = await supabase
      .from('members')
      .select('id, name, contracts_completed, campaign')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('is_friend', false) // Apenas membros, não amigos

    if (errTodosMembros) {
      console.error('❌ Erro ao buscar membros:', errTodosMembros.message)
      return
    }

    console.log(`   Total de membros encontrados: ${todosMembros.length}`)

    // 2. Para cada membro, contar seus amigos reais e corrigir contratos
    let membrosCorrigidos = 0
    let inconsistências = 0

    for (const membro of todosMembros) {
      console.log(`\n📝 Verificando ${membro.name} (${membro.campaign}):`)
      
      // Contar amigos reais deste membro
      const { data: amigosDoMembro, error: errAmigos } = await supabase
        .from('members')
        .select('id')
        .eq('referrer', membro.name)
        .eq('is_friend', true)
        .eq('status', 'Ativo')
        .is('deleted_at', null)

      if (errAmigos) {
        console.error(`   ❌ Erro ao contar amigos: ${errAmigos.message}`)
        continue
      }

      const amigosContados = amigosDoMembro?.length || 0
      const contratosAtuais = membro.contracts_completed

      console.log(`   Contratos registrados: ${contratosAtuais}`)
      console.log(`   Amigos encontrados: ${amigosContados}`)

      if (contratosAtuais !== amigosContados) {
        inconsistências++
        console.log(`   ⚠️ INCONSISTÊNCIA! Diferença: ${contratosAtuais - amigosContados}`)

        // Corrigir contratos
        const { error: updateError } = await supabase
          .from('members')
          .update({
            contracts_completed: amigosContados,
            updated_at: new Date().toISOString()
          })
          .eq('id', membro.id)

        if (updateError) {
          console.error(`   ❌ Erro ao corrigir: ${updateError.message}`)
        } else {
          membrosCorrigidos++
          console.log(`   ✅ Contratos corrigidos para: ${amigosContados}`)
        }
      } else {
        console.log(`   ✅ Contadores consistentes`)
      }
    }

    // 3. Atualizar status e ranking após correções
    console.log('\n🔄 3. Atualizando status e ranking geral:')
    
    const { error: rankingError } = await supabase.rpc('update_complete_ranking')
    
    if (rankingError) {
      console.error('❌ Erro ao atualizar ranking:', rankingError.message)
    } else {
      console.log('✅ Ranking atualizado com sucesso')
    }

    // 4. Verificação final
    console.log('\n📊 4. Verificação final:')
    
    const { data: membrosFinais, error: errFinais } = await supabase
      .from('members')
      .select('id, name, contracts_completed')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .eq('is_friend', false)

    let inconsistenciasFinais = 0
    
    for (const membro of membrosFinais || []) {
      const { data: amigosFinais, error: errAmigosFinais } = await supabase
        .from('members')
        .select('id')
        .eq('referrer', membro.name)
        .eq('is_friend', true)
        .eq('status', 'Ativo')
        .is('deleted_at', null)

      const amigosCountFinais = amigosFinais?.length || 0
      
      if (membro.contracts_completed !== amigosCountFinais) {
        inconsistenciasFinais++
        console.log(`   ❌ ${membro.name}: Contratos=${membro.contracts_completed}, Amigos=${amigosCountFinais}`)
      }
    }

    // 5. Resumo da correção
    console.log('\n✅ Correção de contadores concluída!')
    console.log('\n📊 Resumo:')
    console.log(`   Membros analisados: ${todosMembros.length}`)
    console.log(`   Inconsistências encontradas: ${inconsistências}`)
    console.log(`   Membros corrigidos: ${membrosCorrigidos}`)
    console.log(`   Inconsistências restantes: ${inconsistenciasFinais}`)
    
    if (inconsistenciasFinais === 0) {
      console.log('\n🎉 Todos os contadores estão consistentes!')
    } else {
      console.log('\n⚠️ Aindа existem inconsistências que precisam ser investigadas')
    }

  } catch (error) {
    console.error('❌ Erro geral na correção:', error)
  }
}

// Executar correção
corrigirContadoresSistema()
