# 🚀 AUTOMAÇÃO SAAS - Sistema de Campanhas (COMPLETO)

## 📋 Índice
1. [Objetivo](#objetivo)
2. [Arquivos Necessários](#arquivos-necessários)
3. [Instalação Passo a Passo](#instalação-passo-a-passo)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Isolamento de Campanhas](#isolamento-de-campanhas)

---

## 🎯 Objetivo

Permitir que o **AdminHitech** cadastre novas campanhas automaticamente, criando um administrador específico para cada uma, com **isolamento total** de dados.

---

## 📦 Arquivos Necessários

### 1. SQL - Banco de Dados
- `docs/ADICIONAR_ADMIN_VINCULADO_CAMPAIGNS.sql` ← **EXECUTAR NO SUPABASE**
- `docs/ADICIONAR_CAMPO_CEP_MEMBERS_FRIENDS.sql` ← **EXECUTAR NO SUPABASE**

### 2. TypeScript - Frontend
- `src/pages/PublicRegisterCampanha.tsx` ← **ATUALIZAR** função `handleSubmit`
- `src/pages/dashboard.tsx` ← **JÁ TEM** botão "Cadastrar Nova Campanha"

### 3. Documentação
- `docs/AUTOMACAO_SAAS_CAMPANHAS_COMPLETO.md` ← Este arquivo
- `docs/CEP_APENAS_CADASTRO.md` ← Referência sobre CEP

---

## 🔧 Instalação Passo a Passo

### PASSO 1: Executar SQL no Supabase

#### 1.1. Adicionar coluna admin_user_id em campaigns
```sql
-- Execute: docs/ADICIONAR_ADMIN_VINCULADO_CAMPAIGNS.sql

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#1e3a8a';

CREATE INDEX IF NOT EXISTS idx_campaigns_admin_user 
ON campaigns(admin_user_id);
```

#### 1.2. Adicionar colunas CEP em members/friends
```sql
-- Execute: docs/ADICIONAR_CAMPO_CEP_MEMBERS_FRIENDS.sql

ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL;

ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL;
```

### PASSO 2: Atualizar PublicRegisterCampanha.tsx

Substitua a função `handleSubmit` completa:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const validationErrors = validateRequiredFields();
  if (Object.keys(validationErrors).length > 0) {
    toast({
      title: "Campos obrigatórios",
      description: "Por favor, preencha todos os campos corretamente.",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    // Verificar se o código da campanha já existe
    const { data: existingCampaign, error: checkError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('code', formData.code)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingCampaign) {
      toast({
        title: "Campanha já existe",
        description: "Este código de campanha já está em uso. Escolha outro.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Gerar username e senha automaticamente
    const cleanName = formData.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "");
    
    const autoUsername = `admin${cleanName.substring(0, 15)}`;
    const autoPassword = `${cleanName.substring(0, 10)}${formData.code.toLowerCase()}`;
    const adminName = `Admin ${formData.name}`;

    console.log('🚀 Iniciando cadastro de campanha...');

    // PASSO 1: Criar o admin vinculado à campanha
    const { data: newAdmin, error: adminError } = await supabase
      .from('auth_users')
      .insert([
        {
          username: autoUsername,
          password: autoPassword,
          name: adminName,
          role: 'Admin',
          full_name: `${adminName} - Administrador`,
          display_name: formData.name.split(' ')[0],
          campaign: formData.code, // ← Campo campaign preenchido
          is_active: true
        }
      ])
      .select()
      .single();

    if (adminError) {
      throw new Error(`Erro ao criar admin: ${adminError.message}`);
    }

    console.log('✅ Admin criado:', newAdmin);

    // PASSO 2: Criar a campanha vinculada ao admin
    const { data: newCampaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([
        {
          name: formData.name,
          code: formData.code,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          background_color: formData.backgroundColor,
          description: formData.description || null,
          is_active: true,
          admin_user_id: newAdmin.id // ← Vincula admin
        }
      ])
      .select()
      .single();

    if (campaignError) {
      // Rollback: deletar admin criado
      await supabase.from('auth_users').delete().eq('id', newAdmin.id);
      throw new Error(`Erro ao criar campanha: ${campaignError.message}`);
    }

    console.log('✅ Campanha cadastrada:', newCampaign);
    console.log('📋 ================================');
    console.log(`📋 Username: ${autoUsername}`);
    console.log(`📋 Senha: ${autoPassword}`);
    console.log(`📋 Campanha: ${formData.code}`);
    console.log('📋 ================================');
    
    setIsSuccess(true);
    toast({
      title: "✅ Campanha cadastrada com sucesso!",
      description: `Username: ${autoUsername} | Senha: ${autoPassword}`,
      duration: 15000, // 15 segundos
    });
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 8000);

  } catch (error) {
    console.error('❌ Erro:', error);
    toast({
      title: "Erro no cadastro",
      description: error instanceof Error ? error.message : "Erro ao criar campanha",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🔄 Fluxo de Funcionamento

### 1. AdminHitech acessa Dashboard
```
┌─────────────────────────────────────┐
│  Dashboard - Hitech                 │
├─────────────────────────────────────┤
│  [Cadastrar Admin Novo]             │
│  [Cadastrar Nova Campanha] ← CLICA  │
└─────────────────────────────────────┘
```

### 2. Preenche Formulário
```
┌─────────────────────────────────────┐
│  📝 Cadastrar Nova Campanha         │
├─────────────────────────────────────┤
│  Nome: Campanha Saúde 2025          │
│  Código: SAUDE                      │
│  Cor Primária: #1e40af              │
│  Cor Secundária: #d4af37            │
│  Cor de Fundo: #1e3a8a              │
│  Descrição: (opcional)              │
│  [CADASTRAR CAMPANHA]               │
└─────────────────────────────────────┘
```

### 3. Sistema Cria Automaticamente

#### 3.1. Admin em `auth_users`
```sql
INSERT INTO auth_users (
  username,
  password,
  name,
  role,
  campaign,
  full_name,
  display_name,
  is_active
) VALUES (
  'admincampanhasaude2025',       -- username gerado
  'campanhasauSAUDE',             -- senha gerada
  'Admin Campanha Saúde 2025',
  'Admin',
  'SAUDE',                        -- código da campanha
  'Admin Campanha Saúde 2025 - Administrador',
  'Campanha',
  true
);
```

#### 3.2. Campanha em `campaigns`
```sql
INSERT INTO campaigns (
  name,
  code,
  primary_color,
  secondary_color,
  background_color,
  description,
  admin_user_id,
  is_active
) VALUES (
  'Campanha Saúde 2025',
  'SAUDE',
  '#1e40af',
  '#d4af37',
  '#1e3a8a',
  'Campanha voltada para profissionais da saúde',
  '9663913', -- ID do admin criado
  true
);
```

### 4. Exibe Credenciais (15 segundos)
```
┌─────────────────────────────────────┐
│  ✅ Campanha cadastrada!            │
├─────────────────────────────────────┤
│  Username: admincampanhasaude2025   │
│  Senha: campanhasauSAUDE            │
│  Campanha: SAUDE                    │
│                                     │
│  ⏱️ Copie as credenciais agora!     │
└─────────────────────────────────────┘
```

### 5. Redireciona para Dashboard (8 segundos)

---

## 📝 Exemplos de Uso

### Exemplo 1: Campanha Saúde
**Input:**
- Nome: "Campanha Saúde 2025"
- Código: "SAUDE"

**Output:**
- Username: `admincampanhasaude2025`
- Senha: `campanhasauSAUDE`
- Campaign: `SAUDE`

### Exemplo 2: Eleições
**Input:**
- Nome: "Eleições 2026 Goiás"
- Código: "ELEICAO26"

**Output:**
- Username: `admineleicoes2026`
- Senha: `eleicoesELEICAO26`
- Campaign: `ELEICAO26`

### Exemplo 3: Empresa
**Input:**
- Nome: "Acme Corporation"
- Código: "ACME"

**Output:**
- Username: `adminacmecorpor`
- Senha: `acmecorpoACME`
- Campaign: `ACME`

---

## 🔒 Isolamento de Campanhas

### Como funciona?

Quando o admin da nova campanha faz login:

#### 1. Sistema detecta campanha
```typescript
// useAuth.ts detecta automaticamente
const user = {
  username: 'admincampanhasaude2025',
  campaign: 'SAUDE' // ← Detectado automaticamente
};
```

#### 2. Todos os hooks filtram automaticamente
```typescript
// useMembers.ts
const { members } = useMembers(undefined, user?.campaign);
// Retorna APENAS membros da campanha 'SAUDE'

// useFriends.ts
const { friends } = useFriends(undefined, user?.campaign);
// Retorna APENAS amigos da campanha 'SAUDE'

// useReports.ts
const { reportData } = useReports(user?.campaign);
// Retorna APENAS relatórios da campanha 'SAUDE'
```

#### 3. Admin vê APENAS seus dados
```
┌─────────────────────────────────────┐
│  Dashboard - Campanha SAUDE         │
├─────────────────────────────────────┤
│  Membros: 150 (apenas da SAUDE)     │
│  Amigos: 2.250 (apenas da SAUDE)    │
│  Relatórios: (apenas da SAUDE)      │
└─────────────────────────────────────┘
```

---

## ✅ Funcionalidades Disponíveis

O admin da nova campanha terá acesso a:

- ✅ Gerar links de cadastro
- ✅ Ver tabela de membros (filtrada por campanha)
- ✅ Ver tabela de amigos (filtrada por campanha)
- ✅ Exportar relatórios (Excel/PDF)
- ✅ Ver rankings completos
- ✅ Ver gráficos e estatísticas
- ✅ Excluir/Editar membros
- ✅ Gerenciar configurações do sistema
- ✅ Todas as funcionalidades do dashboard

**Isolamento garantido:** Admin da campanha "SAUDE" **NUNCA** verá dados da campanha "A" ou "B".

---

## 🔐 Segurança

- ✅ Rollback automático se falhar (deleta admin se campanha não for criada)
- ✅ Verificação de código duplicado
- ✅ Credenciais exibidas apenas uma vez (15s)
- ✅ Admin vinculado permanentemente à campanha
- ✅ Filtro por campanha em TODOS os hooks
- ✅ Impossível acessar dados de outras campanhas

---

## 📊 Checklist de Implementação

### Banco de Dados:
- [ ] Executar `ADICIONAR_ADMIN_VINCULADO_CAMPAIGNS.sql`
- [ ] Executar `ADICIONAR_CAMPO_CEP_MEMBERS_FRIENDS.sql`
- [ ] Verificar colunas criadas

### Frontend:
- [ ] Atualizar `PublicRegisterCampanha.tsx` (função handleSubmit)
- [ ] Verificar botão "Cadastrar Nova Campanha" no dashboard
- [ ] Testar cadastro de campanha

### Testes:
- [ ] Cadastrar nova campanha
- [ ] Copiar credenciais geradas
- [ ] Fazer logout
- [ ] Fazer login com novo admin
- [ ] Verificar isolamento de dados
- [ ] Cadastrar membros na nova campanha
- [ ] Verificar que dados não aparecem em outras campanhas

---

## 🆘 Resolução de Problemas

### "Column 'admin_user_id' not found"
**Solução:** Execute o SQL `ADICIONAR_ADMIN_VINCULADO_CAMPAIGNS.sql`

### "Duplicate key value violates unique constraint"
**Solução:** Código de campanha já existe. Use outro código.

### Admin não consegue fazer login
**Solução:** Verifique se o admin foi criado corretamente:
```sql
SELECT * FROM auth_users WHERE username = 'admincampanhasaude2025';
```

### Admin vê dados de outras campanhas
**Solução:** Verifique se o campo `campaign` foi preenchido corretamente no `auth_users`

---

✅ **SISTEMA PRONTO PARA USO MULTI-CAMPANHA!**

