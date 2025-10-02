# Herança de Campanha por Link

## Implementação

### **Objetivo**
Quando um membro é cadastrado através de um link, a campanha deve ser herdada do link que foi usado para o cadastro, garantindo que todos os dados relacionados (members, friends, auth_users, users) tenham a mesma campanha.

### **Fluxo de Herança**

#### **1. Criação do Link**
```typescript
// useUserLinks.ts - createUserLink()
const createUserLink = async (userId: string, linkId: string, referrerName: string, expiresAt?: string) => {
  // Buscar campanha do usuário que está criando o link
  const { data: userData } = await supabase
    .from('auth_users')
    .select('campaign')
    .eq('id', userId)
    .single()

  const userCampaign = userData?.campaign || 'A'
  
  // Criar link com campanha do usuário
  const { data, error } = await supabase
    .from('user_links')
    .insert([{
      user_id: userId,
      link_id: linkId,
      referrer_name: referrerName,
      expires_at: expiresAt,
      is_active: true,
      click_count: 0,
      registration_count: 0,
      link_type: linkType,
      campaign: userCampaign // ← Campanha herdada do usuário
    }])
}
```

#### **2. Cadastro de Membro**
```typescript
// PublicRegister.tsx - handleSubmit()
const memberData = {
  name: formData.name.trim(),
  phone: formData.phone,
  instagram: formData.instagram.trim(),
  city: formData.city.trim(),
  sector: formData.sector.trim(),
  referrer: formData.referrer,
  registration_date: new Date().toISOString().split('T')[0],
  status: 'Ativo' as const,
  campaign: linkData?.campaign || referrerData?.campaign || 'A', // ← Prioridade: link > referrer > padrão
  // Dados do parceiro
  couple_name: formData.couple_name.trim(),
  couple_phone: formData.couple_phone,
  couple_instagram: formData.couple_instagram.trim(),
  couple_city: formData.couple_city.trim(),
  couple_sector: formData.couple_sector.trim()
};
```

#### **3. Cadastro de Amigo**
```typescript
// PublicRegister.tsx - handleSubmit()
const friendData = {
  name: formData.name.trim(),
  phone: formData.phone,
  instagram: formData.instagram.trim(),
  city: formData.city.trim(),
  sector: formData.sector.trim(),
  referrer: formData.referrer,
  registration_date: new Date().toISOString().split('T')[0],
  status: 'Ativo' as const,
  campaign: linkData?.campaign || referrerData?.campaign || 'A', // ← Prioridade: link > referrer > padrão
  // Dados do parceiro
  couple_name: formData.couple_name.trim(),
  couple_phone: formData.couple_phone,
  couple_instagram: formData.couple_instagram.trim(),
  couple_city: formData.couple_city.trim(),
  couple_sector: formData.couple_sector.trim(),
  // Campos obrigatórios para tabela friends
  member_id: '',
  deleted_at: null
};
```

#### **4. Criação de Auth User**
```typescript
// useCredentials.ts - createAuthUser()
const authUserData = {
  username: credentials.username,
  password: credentials.password,
  name: userData.name,
  role: userRole,
  full_name: fullName,
  display_name: userData.display_name || null,
  instagram: userData.instagram,
  phone: userData.phone,
  is_active: false,
  campaign: userData.campaign || 'A' // ← Campanha herdada
}
```

#### **5. Cadastro na Tabela Users**
```typescript
// PublicRegister.tsx - handleSubmit()
const userData = {
  name: formData.name.trim(),
  phone: formData.phone,
  instagram: formData.instagram.trim(),
  city: formData.city.trim(),
  sector: formData.sector.trim(),
  referrer: formData.referrer,
  registration_date: new Date().toISOString().split('T')[0],
  status: 'Ativo' as const,
  campaign: linkData?.campaign || referrerData?.campaign || 'A' // ← Prioridade: link > referrer > padrão
};
```

### **Prioridade de Herança**

#### **Ordem de Prioridade**
1. **`linkData?.campaign`** - Campanha do link usado
2. **`referrerData?.campaign`** - Campanha do referrer
3. **`'A'`** - Campanha padrão

#### **Implementação**
```typescript
campaign: linkData?.campaign || referrerData?.campaign || 'A'
```

### **Tabelas Afetadas**

#### **1. user_links**
- Campo: `campaign`
- Herança: Do usuário que cria o link
- Fonte: `auth_users.campaign`

#### **2. members**
- Campo: `campaign`
- Herança: Do link usado no cadastro
- Fonte: `user_links.campaign`

#### **3. friends**
- Campo: `campaign`
- Herança: Do link usado no cadastro
- Fonte: `user_links.campaign`

#### **4. auth_users**
- Campo: `campaign`
- Herança: Do link usado no cadastro
- Fonte: `user_links.campaign`

#### **5. users**
- Campo: `campaign`
- Herança: Do link usado no cadastro
- Fonte: `user_links.campaign`

### **Exemplo Prático**

#### **Cenário: Admin da Campanha B cria link**
```typescript
// 1. Admin B (campaign: 'B') cria link
const link = await createUserLink(adminB.id, 'link123', 'Admin B')
// Resultado: link.campaign = 'B'

// 2. Usuário acessa link e se cadastra
const memberData = {
  name: 'João Silva',
  // ... outros campos
  campaign: linkData?.campaign || 'A' // = 'B'
}

// 3. Todos os registros terão campaign = 'B'
// - members.campaign = 'B'
// - friends.campaign = 'B' (se for amigo)
// - auth_users.campaign = 'B'
// - users.campaign = 'B'
```

#### **Cenário: Admin da Campanha A cria link**
```typescript
// 1. Admin A (campaign: 'A') cria link
const link = await createUserLink(adminA.id, 'link456', 'Admin A')
// Resultado: link.campaign = 'A'

// 2. Usuário acessa link e se cadastra
const memberData = {
  name: 'Maria Santos',
  // ... outros campos
  campaign: linkData?.campaign || 'A' // = 'A'
}

// 3. Todos os registros terão campaign = 'A'
// - members.campaign = 'A'
// - friends.campaign = 'A' (se for amigo)
// - auth_users.campaign = 'A'
// - users.campaign = 'A'
```

### **Benefícios**

#### **1. Isolamento Completo**
- Dados de campanhas diferentes nunca se misturam
- Cada campanha mantém sua própria base de dados
- Isolamento total entre campanhas A e B

#### **2. Herança Automática**
- Não é necessário definir campanha manualmente
- Sistema herda automaticamente do link
- Reduz erros de configuração

#### **3. Consistência de Dados**
- Todos os registros relacionados têm a mesma campanha
- Dados sempre consistentes
- Facilita relatórios e análises

#### **4. Flexibilidade**
- Fallback para campanha do referrer
- Fallback para campanha padrão
- Sistema robusto e confiável

### **Implementação Técnica**

#### **Interface UserLink Atualizada**
```typescript
export interface UserLink {
  id: string
  link_id: string
  user_id: string
  referrer_name: string
  is_active: boolean
  click_count: number
  registration_count: number
  link_type: 'members' | 'friends'
  created_at: string
  expires_at?: string
  updated_at: string
  deleted_at?: string | null
  user_data?: AuthUser
  created_by?: string
  campaign?: string // ← Novo campo
}
```

#### **Hook useCredentials Atualizado**
```typescript
const createAuthUser = async (
  userData: { 
    name: string; 
    instagram: string; 
    phone: string; 
    referrer?: string; 
    display_name?: string; 
    campaign?: string // ← Novo parâmetro
  }, 
  credentials: Credentials
) => {
  const authUserData = {
    // ... outros campos
    campaign: userData.campaign || 'A' // ← Campanha herdada
  }
}
```

### **Resultado**

#### **Antes da Implementação**
- Campanha definida manualmente ou por padrão
- Risco de mistura de dados entre campanhas
- Inconsistência entre tabelas

#### **Depois da Implementação**
- Campanha herdada automaticamente do link
- Isolamento total entre campanhas
- Consistência garantida em todas as tabelas
- Sistema robusto e confiável

O sistema agora garante que **todos os dados relacionados** (members, friends, auth_users, users) tenham a **mesma campanha** do link usado no cadastro, mantendo o **isolamento completo** entre campanhas A e B.
