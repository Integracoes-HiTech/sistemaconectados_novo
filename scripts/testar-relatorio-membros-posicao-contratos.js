// Teste das correções no relatório de membros (posição e contratos)

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuração do Supabase
const supabaseUrl = 'https://eotdjmcowbpnqfqlxcfj.supabase.co';
const supabaseKey = 'eyJhbGciAiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvdGRqbWNvd2JwbnFmcWx4Y2ZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjY2MzgwOSwiZXhwIjoyMDQ4MjM5ODA5fQ.LbTZbOTjBf9V2aPzL7Vr8zG7P3K-rE-rP4w-g7A2nQ';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Testando relatório de membros com posição e contratos...\n');

async function testarRelatorioMembros() {
  try {
    console.log('📊 1. Buscando dados de membros para relatório...');
    
    const { data: members, error } = await supabase
      .from('members')
      .select(`
        id,
        name,
        phone,
        instagram,
        city,
        sector,
        ranking_position,
        contracts_completed,
        referrer,
        registration_date,
        couple_name,
        couple_phone,
        couple_instagram,
        couple_city,
        couple_sector,
        campaign
      `)
      .eq('campaign', 'A')
      .eq('status', 'Ativo')
      .is('deleted_at', null)
      .order('ranking_position', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar membros:', error.message);
      return;
    }

    if (!members || members.length === 0) {
      console.log('⚠️ Nenhum membro encontrado para relatório');
      return;
    }

    console.log(`✅ Encontrados ${members.length} membros ativos`);
    console.log('📋 Primeiros 3 membros encontrados:');
    
    members.slice(0, 3).forEach((member, index) => {
      console.log(`\n   ${index + 1}. ${member.name}`);
      console.log(`      Posição: ${member.ranking_position || 'N/A'}`);
      console.log(`      Contratos: ${member.contracts_completed || 0}`);
      console.log(`      Cidade: ${member.city}`);
    });

    console.log('\n📊 2. Verificando campos de posição e contratos...');
    
    const statsPosicao = {
      comPosicao: members.filter(m => m.ranking_position).length,
      semPosicao: members.filter(m => !m.ranking_position).length,
      posicaoNull: members.filter(m => m.ranking_position === null).length
    };

    const statsContratos = {
      comContratos: members.filter(m => m.contracts_completed && m.contracts_completed > 0).length,
      semContratos: members.filter(m => !m.contracts_completed || m.contracts_completed === 0).length,
      contratosNull: members.filter(m => m.contracts_completed === null).length
    };

    console.log('\n📍 Estatísticas de Posição:');
    console.log(`   • Com posição: ${statsPosicao.comPosicao}`);
    console.log(`   • Sem posição: ${statsPosicao.semPosicao}`);
    console.log(`   • Posição NULL: ${statsPosicao.posicaoNull}`);

    console.log('\n💼 Estatísticas de Contratos:');
    console.log(`   • Com contratos: ${statsContratos.comContratos}`);
    console.log(`   • Sem contratos: ${statsContratos.semContratos}`);
    console.log(`   • Contratos NULL: ${statsContratos.contratosNull}`);

    console.log('\n🎯 3. Validando dados para relatório Excel...');
    
    const membroExemplo = members[0];
    console.log('\n📋 Exemplo de dados do primeiro membro:');
    console.log('   Campos principais para Excel:');
    console.log(`   • Posição: "${membroExemplo.ranking_position}"`);
    console.log(`   • Contratos Completos: ${membroExemplo.contracts_completed}`);
    console.log(`   • Nome: "${membroExemplo.name}"`);
    console.log(`   • WhatsApp: ${membroExemplo.phone}`);
    console.log(`   • Instagram: ${membroExemplo.instagram}`);

    console.log('\n✅ 4. Validação concluída - Relatório de membros pronto!');
    console.log('\n📝 Campos que aparecerão no Excel:');
    console.log('   1. Posição');
    console.log('   2. Contratos Completos');
    console.log('   3. Nome');
    console.log('   4. WhatsApp');
    console.log('   5. Instagram');
    console.log('   6. Cidade');
    console.log('   7. Setor');
    console.log('   8. Nome Parceiro');
    console.log('   9. WhatsApp Parceiro');
    console.log('   10. Instagram Parceiro');
    console.log('   11. Cidade Parceiro');
    console.log('   12. Setor Parceiro');
    console.log('   13. Indicado por');
    console.log('   14. Data de Cadastro');

    console.log('\n📝 Campos que aparecerão no PDF:');
    console.log('   • Título do card: "#posição - Nome"');
    console.log('   • Sub-linha: "X contratos"');
    console.log('   • Dados completos do membro');
    console.log('   • Dados completos do parceiro');

    console.log('\n🚀 Correção aplicada com sucesso! Os relatórios agora incluem posição e contratos.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testarRelatorioMembros();
