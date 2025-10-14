import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function corrigirRelacionamentoCampaigns() {
  try {
    console.log('🔍 Verificando relacionamento entre campaigns e planos_precos...');
    
    // 1. Verificar dados atuais
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (campaignsError) {
      console.log('❌ Erro ao buscar campaigns:', campaignsError.message);
      return;
    }
    
    console.log('📋 Campanhas encontradas:');
    campaigns.forEach(campaign => {
      console.log(`- ${campaign.name} (${campaign.code}): plano_id=${campaign.plano_id}, nome_plano=${campaign.nome_plano}`);
    });
    
    // 2. Verificar planos disponíveis
    const { data: planos, error: planosError } = await supabase
      .from('planos_precos')
      .select('*')
      .eq('is_active', true)
      .order('order_display', { ascending: true });
    
    if (planosError) {
      console.log('❌ Erro ao buscar planos:', planosError.message);
      return;
    }
    
    console.log('\n📊 Planos disponíveis:');
    planos.forEach(plano => {
      console.log(`- ${plano.nome_plano}: id=${plano.id}, amount=${plano.amount}`);
    });
    
    // 3. Verificar inconsistências
    console.log('\n🔍 Verificando inconsistências...');
    let inconsistencias = 0;
    
    for (const campaign of campaigns) {
      if (campaign.plano_id) {
        const planoCorrespondente = planos.find(p => p.id === campaign.plano_id);
        if (planoCorrespondente) {
          if (campaign.nome_plano !== planoCorrespondente.nome_plano) {
            console.log(`❌ Inconsistência em ${campaign.name}:`);
            console.log(`   nome_plano na campaign: "${campaign.nome_plano}"`);
            console.log(`   nome_plano no plano: "${planoCorrespondente.nome_plano}"`);
            inconsistencias++;
          } else {
            console.log(`✅ ${campaign.name}: sincronizado`);
          }
        } else {
          console.log(`❌ ${campaign.name}: plano_id não encontrado em planos_precos`);
          inconsistencias++;
        }
      } else {
        console.log(`❌ ${campaign.name}: plano_id é nulo`);
        inconsistencias++;
      }
    }
    
    if (inconsistencias === 0) {
      console.log('\n✅ Todos os dados estão consistentes!');
    } else {
      console.log(`\n❌ Encontradas ${inconsistencias} inconsistências.`);
      console.log('\n💡 Para corrigir, execute o script SQL: docs/ADICIONAR_FK_PLANO_CAMPAIGNS.sql');
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

corrigirRelacionamentoCampaigns();
