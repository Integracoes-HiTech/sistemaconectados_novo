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
    
    // Substituir linha por linha
    const linhas = conteudo.split('\n');
    let linhaCorrigir = -1;
    
    // Encontrar a linha problemática
    for (let i = 0; i < linhas.length; i++) {
      if (linhas[i].includes('FILTRAR POR CAMPANHA')) {
        console.log(`🎯 Encontrou problema na linha ${i + 1}`);
        
        // Substituir as 4 linhas problemáticas
        linhas[i] = '      // Combinar dados de membros e amigos - VERIFICAR TODAS AS CAMPANHAS';
        linhas[i + 1] = '';
        linhas[i + 2] = '      const allUsers = [...(membersData || []), ...(friendsData || [])];';
        linhas[i + 3] = '';
        
        console.log('✏️ Linhas corrigidas!');
        break;
      }
    }
    
    // Reescrever o arquivo
    const conteudoCorrigido = linhas.join('\n');
    fs.writeFileSync(arquivoPath, conteudoCorrigido, 'utf8');
    
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
  console.log('🔍 Encontre: // Combinar dados de membros e amigos - FILTRAR POR CAMPANHA');
  console.log('✏️ Substitua por: // Combinar dados de membros e amigos - VERIFICAR TODAS AS CAMPANHAS');
  console.log('🗑️ Remova as linhas do currentCampaign e filter');
}
