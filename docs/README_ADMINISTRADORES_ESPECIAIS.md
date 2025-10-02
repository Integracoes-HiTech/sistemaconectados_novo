# 🚀 Administradores Especiais - Sistema Conectados

## 📋 Visão Geral

Esta implementação adiciona dois tipos especiais de administradores ao sistema:

1. **`adminsaude`** - Cadastra membros individuais (sem duplas)
2. **`admin20`** - Cadastra duplas sem Instagram

## 🔧 Instalação

### 1. **Executar Scripts SQL**
Execute os scripts na ordem especificada no Supabase SQL Editor:

```sql
-- 1. Implementar campanhas A e B
docs/IMPLEMENTAR_CAMPANHAS_A_B.sql

-- 2. Criar administradores especiais
docs/CRIAR_ADMINS_ESPECIAIS.sql

-- 3. Atualizar tabela user_links
docs/ATUALIZAR_USER_LINKS.sql

-- 4. Corrigir políticas RLS
docs/CORRIGIR_POLITICAS_RLS.sql
```

### 2. **Verificar Implementação**
```bash
node scripts/teste-producao-admins-especiais.js
```

### 3. **Testar Frontend**
```bash
npm run dev
```

## 🎯 Funcionalidades

### **Admin Saúde (`adminsaude`)**
- **Senha**: `saude123`
- **Link**: `/cadastro/CODIGO` → Redireciona para `/register-saude?ref=CODIGO`
- **Tabela**: `members_saude`
- **Características**:
  - Cadastra membros individuais
  - Instagram obrigatório
  - Não solicita dados de parceiro

### **Admin 20 (`admin20`)**
- **Senha**: `admin20123`
- **Link**: `/cadastro/CODIGO` → Redireciona para `/register-20?ref=CODIGO`
- **Tabela**: `members_20`
- **Características**:
  - Cadastra duplas
  - Instagram não obrigatório
  - Dados de ambas as pessoas obrigatórios

## 🔐 Permissões

### **Botões no Dashboard**
- **Admin Saúde**: "Gerar Link Saúde" (verde)
- **Admin 20**: "Gerar Link 20" (azul)
- **Outros Admins**: "Gerar e Copiar Link" (dourado)

### **Controle de Acesso**
- Cada tipo de admin só pode gerar seu tipo específico de link
- Links direcionam para telas específicas
- Dados são salvos em tabelas específicas

## 📊 Estrutura

### **Tabelas Criadas**
- `members_saude` - Membros individuais
- `members_20` - Duplas sem Instagram
- `user_links` - Atualizada com `link_specific_type`

### **Views de Estatísticas**
- `v_members_saude_stats` - Estatísticas de saúde
- `v_members_20_stats` - Estatísticas de 20
- `v_user_links_saude_stats` - Links de saúde
- `v_user_links_20_stats` - Links de 20

## 🧪 Testes

### **Scripts de Teste**
```bash
node scripts/teste-producao-admins-especiais.js
node scripts/teste-redirecionamento-links.js
```

### **Cenários de Teste**
1. Login como `adminsaude` → Ver botão verde
2. Login como `admin20` → Ver botão azul
3. Gerar links específicos
4. Testar redirecionamento automático
5. Testar cadastros nas telas específicas
6. Verificar dados nas tabelas corretas

## 📁 Arquivos

### **Documentação**
- `docs/PRODUCAO_ADMINISTRADORES_ESPECIAIS.md` - Documentação completa
- `README_ADMINISTRADORES_ESPECIAIS.md` - Este arquivo

### **Scripts SQL**
- `docs/IMPLEMENTAR_CAMPANHAS_A_B.sql` - Campanhas
- `docs/CRIAR_ADMINS_ESPECIAIS.sql` - Administradores
- `docs/ATUALIZAR_USER_LINKS.sql` - Links
- `docs/CORRIGIR_POLITICAS_RLS.sql` - RLS

### **Scripts de Teste**
- `scripts/teste-producao-admins-especiais.js` - Teste consolidado
- `scripts/teste-redirecionamento-links.js` - Teste de redirecionamento

### **Frontend**
- `src/pages/PublicRegisterSaude.tsx` - Tela de cadastro individual
- `src/pages/PublicRegister20.tsx` - Tela de cadastro de dupla
- `src/hooks/useMembersSaude.ts` - Hook para membros individuais
- `src/hooks/useMembers20.ts` - Hook para duplas
- `src/hooks/useUserLinksSaude.ts` - Hook para links de saúde
- `src/hooks/useUserLinks20.ts` - Hook para links de 20
- `src/hooks/useAuth.ts` - Permissões atualizadas
- `src/pages/dashboard.tsx` - Botões e permissões
- `src/App.tsx` - Rotas adicionadas

## 🚀 Deploy

### **Pré-requisitos**
- Supabase configurado
- Banco de dados acessível
- Frontend funcionando

### **Passos**
1. Execute os scripts SQL na ordem
2. Execute o script de teste
3. Teste o frontend
4. Valide as funcionalidades

## ⚠️ Observações

1. **Ordem**: Execute os scripts SQL na ordem especificada
2. **Backup**: Faça backup antes de executar
3. **Testes**: Execute os testes após cada implementação
4. **Permissões**: Verifique se estão funcionando
5. **RLS**: Políticas podem precisar de ajustes

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação em `docs/`
- Execute o script de teste
- Verifique os logs do Supabase
- Teste as funcionalidades passo a passo

## 🎉 Status

### ✅ **Implementado**
- Estrutura do banco
- Usuários administradores
- Telas de cadastro
- Hooks específicos
- Permissões granulares
- Botões condicionais
- Views de estatísticas
- Scripts de teste

### 🔄 **Próximos Passos**
1. Deploy em produção
2. Testes completos
3. Validação de permissões
4. Monitoramento
5. Documentação para usuários
