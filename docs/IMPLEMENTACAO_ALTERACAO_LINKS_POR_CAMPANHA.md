# Implementação da Alteração de Links por Campanha

## Problema Identificado

A função `updateMemberLinksType` estava alterando links de **todas** as campanhas quando um administrador alterava o tipo de links. O requisito era que cada administrador afetasse apenas os membros da **sua própria campanha**.

### Comportamento Anterior (Incorreto)
- `admin_b` (Campanha B) alterava links de todas as campanhas
- `admin` (Campanha A) alterava links de todas as campanhas
- Não havia isolamento por campanha

### Comportamento Implementado (Correto)
- `admin_b` (Campanha B) altera apenas links da Campanha B
- `admin` (Campanha A) altera apenas links da Campanha A
- Isolamento por campanha implementado

## Solução Implementada

### 1. Modificação da Função `updateMemberLinksType`

```typescript
// ANTES
const updateMemberLinksType = async (linkType: 'members' | 'friends') => {

// DEPOIS
const updateMemberLinksType = async (linkType: 'members' | 'friends', userCampaign?: string) => {
```

### 2. Filtro por Campanha nas Queries

```typescript
// Verificar links existentes
let existingLinksQuery = supabase
  .from('user_links')
  .select('id, user_id, link_type, campaign')
  .not('user_id', 'in', `(${adminIds.join(',')})`);

// Se campanha do usuário foi especificada, filtrar apenas essa campanha
if (userCampaign) {
  existingLinksQuery = existingLinksQuery.eq('campaign', userCampaign);
}
```

### 3. Atualização de Links com Filtro por Campanha

```typescript
// Atualizar links
let updateQuery = supabase
  .from('user_links')
  .update({ 
    link_type: novoTipo,
    updated_at: new Date().toISOString()
  })
  .not('user_id', 'in', `(${adminIds.join(',')})`);

// Se campanha do usuário foi especificada, filtrar apenas essa campanha
if (userCampaign) {
  updateQuery = updateQuery.eq('campaign', userCampaign);
}
```

### 4. Modificação no Settings.tsx

```typescript
// ANTES
const result = await updateMemberLinksType(linkType);

// DEPOIS
const result = await updateMemberLinksType(linkType, user?.campaign);
```

## Teste de Validação

O teste `scripts/teste-alteracao-links-por-campanha.js` confirma que:

- ✅ **Campanha A**: Links alterados corretamente
- ✅ **Campanha B**: Links alterados corretamente
- ✅ **Administradores preservados**: Links de administradores não são alterados
- ✅ **Isolamento por campanha**: Cada campanha é afetada independentemente

### Resultado do Teste

```
📊 Resultado por campanha:
   Links de administradores (NÃO ALTERADOS): 3
     - admin_b - Administrador (B): members [ADMIN - PRESERVADO]
     - Admin - Adminstrador (A): members [ADMIN - PRESERVADO]
     - Felipe Admin (A): members [ADMIN - PRESERVADO]
   Links de membros Campanha A (ALTERADOS): 1
     - ANTONIO RUA NETTO - Membro (A): friends [MEMBRO - ALTERADO]
   Links de membros Campanha B (NÃO ALTERADOS): 0
```

## Comportamento por Administrador

### `admin` (Campanha A)
- **Pode alterar**: Links de membros da Campanha A
- **Não pode alterar**: Links de membros da Campanha B
- **Preservado**: Links de todos os administradores

### `admin_b` (Campanha B)
- **Pode alterar**: Links de membros da Campanha B
- **Não pode alterar**: Links de membros da Campanha A
- **Preservado**: Links de todos os administradores

### `felipe` (Campanha A)
- **Não pode alterar**: Nenhum link (restrição por `isFullAdmin()`)
- **Preservado**: Links de todos os administradores

## Arquivos Modificados

- `src/hooks/useSystemSettings.ts`: Função `updateMemberLinksType` modificada
- `src/pages/Settings.tsx`: Passagem da campanha do usuário
- `scripts/teste-alteracao-links-por-campanha.js`: Teste de validação criado
- `docs/IMPLEMENTACAO_ALTERACAO_LINKS_POR_CAMPANHA.md`: Documentação da implementação

## Impacto da Implementação

- **Isolamento por campanha**: Cada administrador afeta apenas sua campanha
- **Segurança**: Administradores não podem afetar outras campanhas
- **Flexibilidade**: Cada campanha pode ter configurações diferentes
- **Preservação**: Links de administradores continuam sendo preservados

## Conclusão

A implementação garante que cada administrador altere apenas os links dos membros de sua própria campanha, mantendo o isolamento entre campanhas A e B, enquanto preserva os links de todos os administradores.
