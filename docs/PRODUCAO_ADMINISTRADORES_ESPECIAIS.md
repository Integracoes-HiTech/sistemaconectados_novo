# 🚀 Documentação de Produção - Administradores Especiais

## 📋 Resumo da Implementação

Esta implementação adiciona dois tipos especiais de administradores ao sistema:

1. **`adminsaude`** - Cadastra membros individuais (sem duplas)
2. **`admin20`** - Cadastra duplas sem Instagram

## 🔧 Scripts SQL para Produção

### 1. **Implementar Campanhas A e B**
```sql
-- Execute: docs/IMPLEMENTAR_CAMPANHAS_A_B.sql
-- Adiciona campo 'campaign' nas tabelas principais
-- Cria usuários para campanha B
-- Implementa RLS para isolamento de dados
```

### 2. **Criar Administradores Especiais**
```sql
-- Execute: docs/CRIAR_ADMINS_ESPECIAIS.sql
-- Cria tabelas members_saude e members_20
-- Cria usuários adminsaude e admin20
-- Configura RLS e views de estatísticas
```

### 3. **Atualizar Tabela user_links**
```sql
-- Execute: docs/ATUALIZAR_USER_LINKS.sql
-- Adiciona coluna link_specific_type
-- Adiciona coluna specific_description
-- Cria views de estatísticas específicas
```

### 4. **Corrigir Políticas RLS**
```sql
-- Execute: docs/CORRIGIR_POLITICAS_RLS.sql
-- Desabilita RLS temporariamente
-- Testa inserção de dados
-- Verifica implementação
```

## 🎯 Funcionalidades Implementadas

### **Admin Saúde (`adminsaude`)**
- **Senha**: `saude123`
- **Funcionalidade**: Cadastra membros individuais
- **Link**: `/cadastro/CODIGO` → Redireciona para `/register-saude?ref=CODIGO`
- **Tabela**: `members_saude`
- **Características**:
  - Não solicita dados de parceiro
  - Instagram obrigatório
  - Cria credenciais automáticas

### **Admin 20 (`admin20`)**
- **Senha**: `admin20123`
- **Funcionalidade**: Cadastra duplas sem Instagram
- **Link**: `/cadastro/CODIGO` → Redireciona para `/register-20?ref=CODIGO`
- **Tabela**: `members_20`
- **Características**:
  - Não solicita Instagram
  - Dados de ambas as pessoas obrigatórios
  - Cria credenciais compartilhadas

## 🔐 Permissões Implementadas

### **Novas Funções no useAuth.ts**
```typescript
isAdminSaude() // Identifica Admin Saúde
isAdmin20() // Identifica Admin 20
canGenerateSaudeLinks() // Permite gerar links de saúde
canGenerate20Links() // Permite gerar links de 20
canGenerateSpecificLinks() // Permite gerar links específicos
```

### **Botões no Dashboard**
- **Admin Saúde**: "Gerar Link Saúde" (verde)
- **Admin 20**: "Gerar Link 20" (azul)
- **Outros Admins**: "Gerar e Copiar Link" (dourado)

## 📊 Estrutura das Tabelas

### **members_saude** (Membros Individuais)
```sql
- id (UUID)
- name (VARCHAR) - Nome do membro
- phone (VARCHAR) - WhatsApp
- instagram (VARCHAR) - Instagram obrigatório
- city (VARCHAR) - Cidade
- sector (VARCHAR) - Setor
- referrer (VARCHAR) - Quem indicou
- ranking_status (VARCHAR) - Verde/Amarelo/Vermelho
- campaign (VARCHAR) - A ou B
- deleted_at (TIMESTAMP) - Soft delete
```

### **members_20** (Duplas sem Instagram)
```sql
- id (UUID)
- name (VARCHAR) - Nome do primeiro membro
- phone (VARCHAR) - WhatsApp do primeiro
- city (VARCHAR) - Cidade do primeiro
- sector (VARCHAR) - Setor do primeiro
- couple_name (VARCHAR) - Nome do segundo membro
- couple_phone (VARCHAR) - WhatsApp do segundo
- couple_city (VARCHAR) - Cidade do segundo
- couple_sector (VARCHAR) - Setor do segundo
- ranking_status (VARCHAR) - Verde/Amarelo/Vermelho
- campaign (VARCHAR) - A ou B
- deleted_at (TIMESTAMP) - Soft delete
```

### **user_links** (Atualizada)
```sql
-- Colunas existentes + novas:
- link_specific_type (VARCHAR) - normal, saude, 20
- specific_description (TEXT) - Descrição específica
```

## 🖥️ Telas de Cadastro

### **PublicRegisterSaude.tsx**
- **Rota**: `/register-saude`
- **Campos**: Nome, WhatsApp, Instagram, Cidade, Setor
- **Validação**: Instagram obrigatório
- **Destino**: Tabela `members_saude`

### **PublicRegister20.tsx**
- **Rota**: `/register-20`
- **Campos**: Dados da primeira e segunda pessoa
- **Validação**: Instagram não obrigatório
- **Destino**: Tabela `members_20`

## 🔧 Hooks Específicos

### **useMembersSaude.ts**
- Gerencia dados da tabela `members_saude`
- Filtra por campanha
- Fornece estatísticas específicas

### **useMembers20.ts**
- Gerencia dados da tabela `members_20`
- Filtra por campanha
- Fornece estatísticas específicas

### **useUserLinksSaude.ts**
- Gerencia links específicos de saúde
- Filtra por `link_specific_type = 'saude'`

### **useUserLinks20.ts**
- Gerencia links específicos de 20
- Filtra por `link_specific_type = '20'`

## 🔄 Sistema de Redirecionamento

### **Fluxo de Links**
1. **Admin Saúde** gera link → `/cadastro/CODIGO`
2. **Admin 20** gera link → `/cadastro/CODIGO`
3. **Usuário acessa** → `/cadastro/CODIGO`
4. **Sistema verifica** `link_specific_type`:
   - Se `'saude'` → Redireciona para `/register-saude?ref=CODIGO`
   - Se `'20'` → Redireciona para `/register-20?ref=CODIGO`
   - Se `'normal'` → Permanece em `/cadastro/CODIGO`

### **Implementação**
- **PublicRegister.tsx**: Detecta tipo de link e redireciona
- **PublicRegisterSaude.tsx**: Recebe `ref` e busca dados do link
- **PublicRegister20.tsx**: Recebe `ref` e busca dados do link
- **useUserLinks.ts**: Interface atualizada com `link_specific_type`

## 📈 Views de Estatísticas

### **v_members_saude_stats**
- Estatísticas de membros individuais
- Filtro por campanha

### **v_members_20_stats**
- Estatísticas de duplas
- Filtro por campanha

### **v_user_links_saude_stats**
- Estatísticas de links de saúde
- Por usuário e campanha

### **v_user_links_20_stats**
- Estatísticas de links de 20
- Por usuário e campanha

## 🧪 Scripts de Teste

### **testar-admins-especiais.js**
- Testa estrutura do banco
- Verifica usuários administradores
- Testa inserção de dados
- Verifica views de estatísticas

### **teste-redirecionamento-links.js**
- Testa sistema de redirecionamento
- Verifica coluna link_specific_type
- Testa criação e busca de links específicos
- Valida fluxo completo de redirecionamento

## 🚀 Passos para Deploy

### 1. **Executar Scripts SQL**
```bash
# No Supabase SQL Editor, execute na ordem:
1. docs/IMPLEMENTAR_CAMPANHAS_A_B.sql
2. docs/CRIAR_ADMINS_ESPECIAIS.sql
3. docs/ATUALIZAR_USER_LINKS.sql
4. docs/CORRIGIR_POLITICAS_RLS.sql
```

### 2. **Verificar Implementação**
```bash
# Execute os scripts de teste
node scripts/teste-producao-admins-especiais.js
node scripts/teste-redirecionamento-links.js
```

### 3. **Testar Frontend**
```bash
# Iniciar servidor
npm run dev

# Testar login
# adminsaude / saude123
# admin20 / admin20123
```

### 4. **Validar Funcionalidades**
- ✅ Geração de links específicos
- ✅ Redirecionamento correto
- ✅ Cadastro nas tabelas corretas
- ✅ Criação de credenciais
- ✅ Controle de permissões

## 🔍 URLs de Teste

### **Admin Saúde**
- **Login**: `adminsaude` / `saude123`
- **Link gerado**: `http://localhost:5173/cadastro/CODIGO`
- **Redirecionamento**: `/register-saude?ref=CODIGO`
- **Botão**: "Gerar Link Saúde" (verde)

### **Admin 20**
- **Login**: `admin20` / `admin20123`
- **Link gerado**: `http://localhost:5173/cadastro/CODIGO`
- **Redirecionamento**: `/register-20?ref=CODIGO`
- **Botão**: "Gerar Link 20" (azul)

## 📝 Arquivos Modificados

### **Frontend**
- `src/App.tsx` - Rotas adicionadas
- `src/pages/dashboard.tsx` - Botões e permissões
- `src/hooks/useAuth.ts` - Permissões específicas
- `src/pages/PublicRegisterSaude.tsx` - Tela de cadastro individual
- `src/pages/PublicRegister20.tsx` - Tela de cadastro de dupla
- `src/hooks/useMembersSaude.ts` - Hook para membros individuais
- `src/hooks/useMembers20.ts` - Hook para duplas
- `src/hooks/useUserLinksSaude.ts` - Hook para links de saúde
- `src/hooks/useUserLinks20.ts` - Hook para links de 20

### **Documentação**
- `docs/PRODUCAO_ADMINISTRADORES_ESPECIAIS.md` - Esta documentação
- `docs/IMPLEMENTAR_CAMPANHAS_A_B.sql` - Script de campanhas
- `docs/CRIAR_ADMINS_ESPECIAIS.sql` - Script de administradores
- `docs/ATUALIZAR_USER_LINKS.sql` - Script de links
- `docs/CORRIGIR_POLITICAS_RLS.sql` - Script de RLS

### **Scripts de Teste**
- `scripts/teste-producao-admins-especiais.js` - Teste consolidado
- `scripts/teste-redirecionamento-links.js` - Teste de redirecionamento

## ⚠️ Observações Importantes

1. **Ordem de Execução**: Execute os scripts SQL na ordem especificada
2. **Backup**: Faça backup do banco antes de executar os scripts
3. **Testes**: Execute os scripts de teste após cada implementação
4. **Permissões**: Verifique se as permissões estão funcionando corretamente
5. **RLS**: As políticas RLS podem precisar de ajustes específicos

## 🎉 Status Final

### ✅ **Implementado**
- Estrutura do banco de dados
- Usuários administradores especiais
- Telas de cadastro específicas
- Hooks para gerenciamento
- Permissões granulares
- Botões condicionais no dashboard
- Views de estatísticas
- Scripts de teste

### 🔄 **Próximos Passos**
1. Executar scripts SQL em produção
2. Testar funcionalidades completas
3. Validar permissões e acessos
4. Monitorar performance
5. Documentar uso para usuários finais

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte esta documentação
- Execute os scripts de teste
- Verifique os logs do Supabase
- Teste as funcionalidades passo a passo
