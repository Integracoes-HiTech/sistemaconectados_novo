// =====================================================
// RECRIAR VIEW v_friends_ranking COM COLUNA CAMPAIGN
// =====================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function recriarView() {
  console.log('🔧 Recriando view v_friends_ranking com coluna campaign...\n')
  
  try {
    // 1. Dropar a view existente
    console.log('📝 1. Dropar view existente...')
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: 'DROP VIEW IF EXISTS v_friends_ranking;' 
    })
    
    if (dropError) {
      console.error('❌ Erro ao dropar view:', dropError)
    } else {
      console.log('✅ View existente removida')
    }
    
    // 2. Recriar a view com coluna campaign
    console.log('\n📝 2. Recriar view com coluna campaign...')
    const createViewSQL = `
      CREATE VIEW v_friends_ranking AS
      SELECT 
          f.id,
          f.member_id,
          f.name,
          f.phone,
          f.instagram,
          f.city,
          f.sector,
          f.referrer,
          f.registration_date,
          f.status,
          f.couple_name,
          f.couple_phone,
          f.couple_instagram,
          f.couple_city,
          f.couple_sector,
          f.contracts_completed,
          f.ranking_position,
          f.ranking_status,
          f.is_top_1500,
          f.can_be_replaced,
          f.post_verified_1,
          f.post_verified_2,
          f.post_url_1,
          f.post_url_2,
          f.created_at,
          f.updated_at,
          f.campaign,
          -- Dados do membro que cadastrou
          m.name as member_name,
          m.instagram as member_instagram,
          m.phone as member_phone,
          m.city as member_city,
          m.sector as member_sector
      FROM friends f
      LEFT JOIN members m ON f.member_id = m.id
      WHERE f.status = 'Ativo' 
        AND f.deleted_at IS NULL
        AND m.status = 'Ativo' 
        AND m.deleted_at IS NULL;
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createViewSQL 
    })
    
    if (createError) {
      console.error('❌ Erro ao criar view:', createError)
      return
    } else {
      console.log('✅ View recriada com sucesso')
    }
    
    // 3. Testar a view
    console.log('\n📊 3. Testando view recriada...')
    const { data: viewData, error: errView } = await supabase
      .from('v_friends_ranking')
      .select('name, couple_name, referrer, campaign, member_name')
      .limit(5)
    
    if (errView) {
      console.error('❌ Erro ao testar view:', errView)
      return
    }
    
    console.log(`   Total de amigos na view: ${viewData?.length || 0}`)
    viewData?.forEach(amigo => {
      console.log(`   - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign}): referrer ${amigo.referrer}`)
    })
    
    // 4. Testar filtro por campanha
    console.log('\n🔍 4. Testando filtro por campanha...')
    
    const { data: campanhaA, error: errA } = await supabase
      .from('v_friends_ranking')
      .select('name, couple_name, campaign')
      .eq('campaign', 'A')
    
    const { data: campanhaB, error: errB } = await supabase
      .from('v_friends_ranking')
      .select('name, couple_name, campaign')
      .eq('campaign', 'B')
    
    if (errA) {
      console.error('❌ Erro ao filtrar Campanha A:', errA)
    } else {
      console.log(`   Campanha A: ${campanhaA?.length || 0} amigos`)
      campanhaA?.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
      })
    }
    
    if (errB) {
      console.error('❌ Erro ao filtrar Campanha B:', errB)
    } else {
      console.log(`   Campanha B: ${campanhaB?.length || 0} amigos`)
      campanhaB?.forEach(amigo => {
        console.log(`     - ${amigo.name} & ${amigo.couple_name} (${amigo.campaign})`)
      })
    }
    
    // 5. Verificar estrutura da view
    console.log('\n🔍 5. Verificando estrutura da view...')
    const { data: estrutura, error: errEstrutura } = await supabase
      .from('v_friends_ranking')
      .select('*')
      .limit(1)
    
    if (errEstrutura) {
      console.error('❌ Erro ao verificar estrutura:', errEstrutura)
    } else if (estrutura && estrutura.length > 0) {
      const primeiro = estrutura[0]
      const temCampaign = 'campaign' in primeiro
      console.log(`   Coluna 'campaign' presente: ${temCampaign ? '✅' : '❌'}`)
      
      if (temCampaign) {
        console.log(`   Valor da campanha: ${primeiro.campaign}`)
      }
    }
    
    console.log('\n✅ Recriação da view concluída!')
    console.log('\n📝 Resumo:')
    console.log('   - View v_friends_ranking recriada')
    console.log('   - Coluna campaign adicionada')
    console.log('   - Filtro por campanha testado')
    console.log('   - Estrutura da view verificada')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar recriação
recriarView()
