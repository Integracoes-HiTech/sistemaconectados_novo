const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando correção da validação de duplicatas...');

// Caminho do arquivo
const arquivoPath = path.join(__dirname, 'src/pages/PublicRegister.tsx');

try {
  // Ler o arquivo
  let conteudo = fs.readFileSync(arquivoPath, 'utf8');
  console.log('📖 Arquivo lido com sucesso');

  // Verificar se ainda tem o filtro por campanha
  if (conteudo.includes('FILTRAR POR CAMPANHA')) {
    console.log('❌ Problema encontrado: ainda está filtrando por campanha');
    
    // Substituir o problema
    const linhaProblema = `      // Combinar dados de membros e amigos - FILTRAR POR CAMPANHA 
      const currentCampaign = linkData?.campaign || referrerData?.campaign || 'A';
      const allUsers = [...(membersData || []), ...(friendsData || [])]
        .filter(user => user.campaign === currentCampaign);`;
    
    const correcao = `      // Combinar dados de membros e amigos - VERIFICAR TODAS AS CAMPANHAS
      const allUsers = [...(membersData || []), ...(friendsData || [])];`;
    
    conteudo = conteudo.replace(linhaProblema, correcao);
    
    // Escrever o arquivo corrigido
    fs.writeFileSync(arquivoPath, conteudo, 'utf8');
    
    console.log('✅ Correção aplicada com sucesso!');
    console.log('📝 Arquivo atualizado: src/pages/PublicRegister.tsx');
    console.log('');
    console.log('🎯 Agora teste novamente:');
    console.log('   - Cadastre João na Campanha A');
    console.log('   - Tente cadastrar João na Campanha B');
    console.log('   - Deve ser BLOQUEADO!');
    
  } else {
    console.log('✅ Arquivo já está correto!');
  }
  
} catch (error) {
  console.error('❌ Erro ao corrigir arquivo:', error.message);
  console.log('');
  console.log('🔧 CORREÇÃO MANUAL:');
  console.log('📄 Abra: src/pages/PublicRegister.tsx');
  console.log('🔍 Encontre (linha 457): // Combinar dados de membros e amigos - FILTRAR POR CAMPANHA');
  console.log('✏️ Substitua por: // Combinar dados de membros e amigos - VERIFICAR TODAS AS CAMPANHAS');
  console.log('🗑️ Remova: const currentCampaign = linkData?.campaign || referrerData?.campaign || "A";');
  console.log('🗑️ Remova: .filter(user => user.campaign === currentCampaign);');
}
