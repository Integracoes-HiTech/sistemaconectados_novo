# Fluxo de Cadastro dos Administradores

## Estrutura dos Administradores

### **Campanha A**
- **admin** - Administrador principal
- **felipe** - Administrador (com restrições)

### **Campanha B**
- **admin_b** - Administrador da campanha B

## Fluxo de Cadastro

### **1. Administrador Gera Link**
```typescript
// No dashboard, administrador clica em "Gerar Link"
const { createLink } = useUserLinks(userIdFilter, user?.campaign);

// Link é criado com:
// - user_id: ID do administrador
// - campaign: Campanha do administrador (A ou B)
// - link_type: 'members' ou 'friends' (baseado na configuração)
```

### **2. Link Redireciona para Cadastro**
```typescript
// URL: /cadastro/:linkId
// PublicRegister.tsx identifica o tipo de link
const isFriendRegistration = linkData?.link_type === 'friends';
```

### **3. Cadastro Baseado no link_type**

#### **Se link_type = 'members'**
```typescript
// CADASTRO DE MEMBRO (NORMAL)
const memberData = {
  name: formData.name.trim(),
  phone: formData.phone,
  instagram: formData.instagram.trim(),
  city: formData.city.trim(),
  sector: formData.sector.trim(),
  referrer: formData.referrer,
  registration_date: new Date().toISOString().split('T')[0],
  status: 'Ativo' as const,
  campaign: referrerData?.campaign || 'A', // Campanha do administrador
  // Dados do parceiro (obrigatório)
  couple_name: formData.couple_name.trim(),
  couple_phone: formData.couple_phone,
  couple_instagram: formData.couple_instagram.trim(),
  couple_city: formData.couple_city.trim(),
  couple_sector: formData.couple_sector.trim()
};

// Salva na tabela members
const memberResult = await addMember(memberData);

// Também salva na tabela users (compatibilidade)
const userResult = await addUser(userData);
```

#### **Se link_type = 'friends'**
```typescript
// CADASTRO DE AMIGO (ESPECIAL)
const friendData = {
  name: formData.name.trim(),
  phone: formData.phone,
  instagram: formData.instagram.trim(),
  city: formData.city.trim(),
  sector: formData.sector.trim(),
  referrer: formData.referrer,
  registration_date: new Date().toISOString().split('T')[0],
  status: 'Ativo' as const,
  campaign: referrerData?.campaign || 'A', // Campanha do administrador
  // Dados do parceiro (obrigatório)
  couple_name: formData.couple_name.trim(),
  couple_phone: formData.couple_phone,
  couple_instagram: formData.couple_instagram.trim(),
  couple_city: formData.couple_city.trim(),
  couple_sector: formData.couple_sector.trim(),
  // Campos obrigatórios para tabela friends
  member_id: '', // Será preenchido pelo hook
  deleted_at: null
};

// Salva na tabela friends
const friendResult = await addFriend(friendData);
```

## Configuração do Tipo de Link

### **No Dashboard**
```typescript
// Administrador pode ver o tipo atual
{settings?.member_links_type === 'members' 
  ? 'Novos Membros (duplas)'
  : 'Amigos'
}

// Botão para gerenciar configurações
<Button onClick={() => navigate('/settings')}>
  Gerenciar Configurações
</Button>
```

### **Na Página de Configurações**
```typescript
// Administrador pode alterar o tipo
<Button onClick={() => handleUpdateLinkType('members')}>
  Novos Membros
</Button>

<Button onClick={() => handleUpdateLinkType('friends')}>
  Amigos
</Button>
```

## Isolamento por Campanha

### **Campanha A (admin, felipe)**
- Links gerados com `campaign: 'A'`
- Cadastros salvos com `campaign: 'A'`
- Dados isolados da campanha B

### **Campanha B (admin_b)**
- Links gerados com `campaign: 'B'`
- Cadastros salvos com `campaign: 'B'`
- Dados isolados da campanha A

## Validações

### **Limite de Membros**
```typescript
// Apenas para cadastro de membros (não amigos)
if (!isFriendRegistration) {
  const limitCheck = await checkMemberLimit();
  if (!limitCheck.canRegister) {
    // Bloquear cadastro
  }
}
```

### **Campos Obrigatórios**
- Nome, telefone, Instagram
- CEP, cidade, setor
- Dados do parceiro (obrigatório)
- Referrer (administrador que gerou o link)

## Fluxo Completo

### **1. Administrador Acessa Dashboard**
```typescript
// Login com credenciais
// Dashboard carrega dados da campanha específica
// Botão "Gerar Link" disponível
```

### **2. Gera Link de Cadastro**
```typescript
// Clica em "Gerar Link"
// Link é criado com campanha e tipo corretos
// Link é exibido para compartilhamento
```

### **3. Pessoa Acessa Link**
```typescript
// Acessa /cadastro/:linkId
// Sistema identifica tipo de link
// Formulário é exibido
```

### **4. Preenche Formulário**
```typescript
// Dados pessoais + dados do parceiro
// Validações são aplicadas
// CEP é buscado automaticamente
```

### **5. Submete Cadastro**
```typescript
// Sistema verifica tipo de link
// Se 'members': salva em members + users
// Se 'friends': salva em friends
// Campanha é herdada do administrador
```

### **6. Confirmação**
```typescript
// Sucesso: "Membro/Amigo cadastrado com sucesso!"
// Contadores do administrador são atualizados
// Credenciais são geradas (se aplicável)
```

## Restrições por Administrador

### **admin (Campanha A)**
- Pode alterar tipo de link
- Pode deletar membros/amigos
- Acesso completo ao sistema

### **felipe (Campanha A)**
- **NÃO** pode alterar tipo de link
- **NÃO** pode deletar membros/amigos
- Demais funcionalidades disponíveis

### **admin_b (Campanha B)**
- Pode alterar tipo de link
- Pode deletar membros/amigos
- Acesso apenas aos dados da campanha B

## Tabelas Utilizadas

### **user_links**
- Armazena links gerados
- Campo `campaign` para isolamento
- Campo `link_type` para tipo de cadastro

### **members**
- Membros cadastrados
- Campo `campaign` para isolamento
- Dados da dupla obrigatórios

### **friends**
- Amigos cadastrados
- Campo `campaign` para isolamento
- Dados da dupla obrigatórios

### **users**
- Compatibilidade (para membros)
- Campo `campaign` para isolamento

## Resumo

O fluxo é **idêntico para todos os administradores**:
1. **Gerar link** → 2. **Compartilhar** → 3. **Cadastro** → 4. **Salvar** → 5. **Confirmar**

A única diferença é o **isolamento por campanha** e as **restrições específicas** do felipe (não pode alterar tipo de link nem deletar).
