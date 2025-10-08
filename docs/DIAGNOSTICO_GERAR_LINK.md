# 🔍 DIAGNÓSTICO: "Gerar Link" não funciona para Administrador

## 🎯 Problema
Quando um admin com `role: 'Administrador'` tenta gerar link, não funciona.

---

## ✅ Verificações já feitas

### 1. ✅ Hook `useAuth.ts`
```typescript
const isAdmin = () => {
  return user?.role === 'admin' || 
         user?.role === 'Administrador' ||  // ← JÁ ACEITA!
         user?.username === 'wegneycosta' || 
         user?.username === 'felipe' || 
         user?.username === 'adminsaude' || 
         user?.username === 'admin20'
}

const canGenerateLinks = () => {
  return isAdmin() || isMembro() || isConvidado() || isAmigo()
}
```
**✅ CORRETO**: Já aceita `'Administrador'`

---

### 2. ✅ Dashboard (`dashboard.tsx`)
```typescript
{canGenerateLinks() && (
  <Button onClick={generateLink}>
    Gerar e Copiar Link
  </Button>
)}
```
**✅ CORRETO**: Usa a função `canGenerateLinks()`

---

### 3. ✅ Função `generateLink()`
```typescript
const generateLink = async () => {
  if (!user?.id || !user?.full_name) {  // ← VERIFICAÇÃO!
    toast({
      title: "Erro",
      description: "Usuário não encontrado. Faça login novamente.",
      variant: "destructive",
    });
    return;
  }

  const result = await createLink(user.id, user.full_name);
  // ...
}
```
**⚠️ POSSÍVEL PROBLEMA**: Pode não ter `user.id` ou `user.full_name`

---

## 🔍 Possíveis causas

### Causa 1: `user.id` ou `user.full_name` ausentes
O admin recém-criado pode não ter:
- `id` (UUID do auth_users)
- `full_name`

**Solução**: Verificar no console do navegador se `user` tem esses campos.

---

### Causa 2: RLS (Row Level Security) da tabela `user_links`
Pode estar bloqueando a inserção de links para `role: 'Administrador'`.

**Solução**: Verificar políticas RLS:
```sql
-- Ver políticas de RLS
SELECT * FROM pg_policies 
WHERE tablename = 'user_links';

-- Desabilitar RLS temporariamente para testar
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;
```

---

### Causa 3: Erro silencioso na função `createLink()`
A função pode estar falhando mas não mostrando erro.

**Solução**: Adicionar logs no `useUserLinks.ts`:
```typescript
const createLink = async (userId: string, referrerName: string) => {
  try {
    console.log('🔗 createLink chamado:', { userId, referrerName });
    
    const linkId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    console.log('🔗 Inserindo link:', { userId, linkId, referrerName });
    
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
        campaign: userCampaign
      }])
      .select()
      .single();

    console.log('🔗 Resultado:', { data, error });
    
    if (error) {
      console.error('❌ Erro ao criar link:', error);
      throw error;
    }
    
    // ...
  }
}
```

---

## 🚀 Como diagnosticar

### Passo 1: Verificar dados do usuário no console
No navegador, adicione este log temporário no `dashboard.tsx`:

```typescript
useEffect(() => {
  if (user) {
    console.log('👤 Dados do usuário logado:', {
      id: user.id,
      username: user.username,
      role: user.role,
      full_name: user.full_name,
      campaign: user.campaign,
      is_active: user.is_active
    });
  }
}, [user]);
```

Verifique se `id` e `full_name` estão presentes.

---

### Passo 2: Verificar RLS
Execute no Supabase SQL Editor:

```sql
-- Ver políticas de RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_links';
```

---

### Passo 3: Testar com RLS desabilitado
```sql
-- TEMPORÁRIO - APENAS PARA TESTE!
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;
```

Se funcionar, o problema é RLS. Depois reative:
```sql
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Checklist de diagnóstico

- [ ] Verificar `user.id` no console
- [ ] Verificar `user.full_name` no console
- [ ] Verificar políticas RLS de `user_links`
- [ ] Adicionar logs na função `createLink()`
- [ ] Testar com RLS desabilitado
- [ ] Verificar se `system_settings` existe
- [ ] Verificar se `phase_control` existe

---

## 🎯 Solução esperada

Depois de identificar a causa:

1. **Se for RLS**: Ajustar políticas para aceitar `role: 'Administrador'`
2. **Se for `user.id`/`full_name`**: Garantir que sejam criados corretamente
3. **Se for `system_settings`**: Executar script `CRIAR_CONFIGURACOES_NOVA_CAMPANHA.sql`

---

**PRÓXIMO PASSO**: Executar Passo 1 (verificar dados do usuário no console).

