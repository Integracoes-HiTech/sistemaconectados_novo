import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://zveysullpsdopcwsncai.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZXlzdWxscHNkb3Bjd3NuY2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA0NTIsImV4cCI6MjA3NDc0NjQ1Mn0.n-jGNo4bvVlvu9ULHTxktLqjyEtanLTtiQex6UvPy6Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstruturaCampaigns() {
  try {
    console.log('🔍 Verificando estrutura da tabela campaigns...');
    
    // Verificar estrutura da tabela campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Erro ao buscar campaigns:', error.message);
    } else {
      console.log('📋 Estrutura da tabela campaigns:');
      if (campaigns && campaigns.length > 0) {
        const firstCampaign = campaigns[0];
        console.log('Colunas encontradas:');
        Object.keys(firstCampaign).forEach(key => {
          console.log('  - ' + key + ': ' + typeof firstCampaign[key] + ' = ' + firstCampaign[key]);
        });
      } else {
        console.log('Nenhuma campanha encontrada');
      }
    }
    
    // Verificar se há chave estrangeira
    console.log('\n🔗 Verificando relacionamento com planos_precos...');
    const { data: campaignsWithPlans, error: planError } = await supabase
      .from('campaigns')
      .select(`
        *,
        planos_precos (
          id,
          nome_plano,
          amount
        )
      `)
      .limit(3);
    
    if (planError) {
      console.log('❌ Erro ao buscar relacionamento:', planError.message);
    } else {
      console.log('📊 Campanhas com planos:');
      campaignsWithPlans.forEach(campaign => {
        console.log(`- ${campaign.name}: plano_id=${campaign.plano_id}, nome_plano=${campaign.nome_plano}`);
        if (campaign.planos_precos) {
          console.log(`  Plano relacionado: ${campaign.planos_precos.nome_plano} (R$ ${campaign.planos_precos.amount})`);
        } else {
          console.log('  ❌ Nenhum plano relacionado encontrado');
        }
      });
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

verificarEstruturaCampaigns();
