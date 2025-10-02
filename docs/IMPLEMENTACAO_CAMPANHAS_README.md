# 🎯 Sistema de Campanhas A e B - Documentação Completa

## 📋 Visão Geral

Este sistema permite separar os dados em duas campanhas distintas (A e B), onde usuários de uma campanha não podem visualizar dados da outra campanha.

## 🏗️ Arquitetura

### Tabelas Modificadas

Todas as tabelas principais foram atualizadas com o campo `campaign`:

- `auth_users` - Usuários do sistema
- `members` - Membros cadastrados
- `friends` - Amigos cadastrados
- `users` - Usuários públicos
- `user_links` - Links de cadastro

### Campo Campaign

```sql
campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'))
```

- **Valores possíveis**: 'A' ou 'B'
- **Default**: 'A'
- **Constraint**: Apenas valores 'A' ou 'B' são aceitos

## 🔧 Implementação

### 1. Banco de Dados

Execute o script `IMPLEMENTAR_CAMPANHAS_A_B.sql`:

```bash
# No SQL Editor do Supabase
psql -f docs/IMPLEMENTAR_CAMPANHAS_A_B.sql
```

### 2. Interface TypeScript

#### AuthUser atualizado:

```typescript
export interface AuthUser {
  id: string
  username: string
  name: string
  role: string
  full_name: string
  display_name?: string
  campaign?: string  // ← NOVO
  created_at: string
  updated_at: string
}
```

### 3. Hooks Atualizados

#### useAuth:

```typescript
// Login agora retorna campanha
const { data, error } = await supabase
  .from('auth_users')
  .select('*, campaign')  // ← Incluir campaign
  .eq('username', username)
  .eq('password', password)
  .single()

// Toast mostra campanha
toast({
  title: "Login realizado com sucesso!",
  description: `Bem-vindo, ${data.name}! (Campanha ${data.campaign})`,
})
```

#### useMembers:

```typescript
// Aceita parâmetro campaign
export const useMembers = (referrer?: string, campaign?: string) => {
  // Filtrar por campanha
  if (campaign) {
    query = query.eq('campaign', campaign)
  }
}
```

#### useFriends:

```typescript
// Aceita parâmetro campaign
export const useFriends = (referrer?: string, campaign?: string) => {
  // Filtrar por campanha
  if (campaign) {
    query = query.eq('campaign', campaign)
  }
}
```

### 4. Dashboard Atualizado

```typescript
// Passar campanha do usuário para os hooks
const { members } = useMembers(referrerFilter, user?.campaign);
const { friends } = useFriends(referrerFilter, user?.campaign);
```

## 👥 Usuários de Exemplo

### Hierarquia do Sistema:

```
Administradores → Membros → Amigos
```

### Campanha A (Existentes):

- **admin** / admin123 - Administrador
- **wegneycosta** / vereador - Vereador (Administrador)
- **felipe** / felipe123 - Admin Felipe
- Outros usuários...

### Campanha B (Novos):

- **admin_b** / admin123 - Administrador Campanha B
- **joao_b** / membro123 - Membro Campanha B
- **marcos_b** / membro123 - Membro Campanha B
- **ana_b** / membro123 - Membro Campanha B
- **carlos_b** / membro123 - Membro Campanha B
- **pedro_b** / amigo123 - Amigo Campanha B
- **maria_b** / amigo123 - Amigo Campanha B

## 🔐 Segurança (RLS)

Row Level Security (RLS) implementado:

```sql
-- Usuários só veem dados de sua campanha
CREATE POLICY "Users can only see their campaign" ON members
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));
```

## 🧪 Testando

### 1. Login Campanha A:

```typescript
// Login como admin (campanha A)
username: admin
password: admin123

// Deve ver apenas dados da campanha A
```

### 2. Login Campanha B:

```typescript
// Login como admin_b (campanha B)
username: admin_b
password: admin123

// Deve ver apenas dados da campanha B
```

### 3. Verificar Isolamento:

```sql
-- Verificar usuários por campanha
SELECT campaign, COUNT(*) as total
FROM auth_users 
GROUP BY campaign;

-- Verificar membros por campanha
SELECT campaign, COUNT(*) as total
FROM members 
GROUP BY campaign;
```

## 📊 Queries Úteis

### Ver todos os dados de uma campanha:

```sql
-- Campanha A
SELECT * FROM members WHERE campaign = 'A';
SELECT * FROM friends WHERE campaign = 'A';
SELECT * FROM users WHERE campaign = 'A';

-- Campanha B
SELECT * FROM members WHERE campaign = 'B';
SELECT * FROM friends WHERE campaign = 'B';
SELECT * FROM users WHERE campaign = 'B';
```

### Migrar dados entre campanhas:

```sql
-- Mover membro específico para campanha B
UPDATE members 
SET campaign = 'B' 
WHERE id = 'UUID_AQUI';

-- Mover todos os dados de um referrer para campanha B
UPDATE members 
SET campaign = 'B' 
WHERE referrer LIKE '%Nome do Referrer%';
```

## 🚨 Troubleshooting

### Problema: Usuário vê dados de ambas as campanhas

**Solução:**
1. Verificar se o campo `campaign` está definido no `auth_users`
2. Verificar se os hooks estão passando `user?.campaign` corretamente
3. Limpar localStorage e fazer login novamente

### Problema: Erro ao criar novo membro/amigo

**Solução:**
1. Garantir que o campo `campaign` é incluído ao criar registro
2. Usar campanha do usuário logado: `campaign: user?.campaign`

### Problema: RLS bloqueando acesso

**Solução:**
1. Verificar políticas RLS no Supabase
2. Desabilitar RLS temporariamente para debug:
```sql
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
```

## 📝 Próximos Passos

1. ✅ Adicionar campo `campaign` nas tabelas
2. ✅ Atualizar hooks para filtrar por campanha
3. ✅ Atualizar dashboard para passar campanha
4. ✅ Criar usuários de teste para campanha B
5. ⏳ Atualizar formulários de cadastro para incluir campanha
6. ⏳ Criar interface de administração para gerenciar campanhas
7. ⏳ Implementar relatórios separados por campanha
8. ⏳ Adicionar seletor de campanha para admins globais

## 💡 Melhorias Futuras

- Interface para alternar entre campanhas (admins globais)
- Relatórios comparativos entre campanhas
- Dashboard agregado de todas as campanhas
- Migração em massa de dados entre campanhas
- Audit log de mudanças de campanha

## 📧 Suporte

Para dúvidas ou problemas, consulte:
- Script SQL: `docs/IMPLEMENTAR_CAMPANHAS_A_B.sql`
- Código atualizado: `src/hooks/useAuth.ts`, `src/hooks/useMembers.ts`, `src/hooks/useFriends.ts`
- Dashboard: `src/pages/dashboard.tsx`
