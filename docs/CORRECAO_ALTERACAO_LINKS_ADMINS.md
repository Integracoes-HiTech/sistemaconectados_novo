# Correção da Alteração de Links - Excluir Todos os Administradores

## Problema Identificado

A função `updateMemberLinksType` no hook `useSystemSettings.ts` estava excluindo apenas **um** administrador específico da alteração de `link_type`, quando deveria excluir **todos** os administradores.

### Comportamento Anterior (Incorreto)
- Buscava apenas um administrador específico
- Excluía apenas esse administrador da alteração
- Outros administradores eram afetados pela mudança de `link_type`

### Comportamento Corrigido (Correto)
- Busca **todos** os administradores do sistema
- Exclui **todos** os administradores da alteração
- Apenas **membros** são afetados pela mudança de `link_type`

## Solução Implementada

### 1. Identificação de Administradores

```typescript
// Buscar todos os administradores para excluir da atualização
const { data: adminUsers, error: adminError } = await supabase
  .from('auth_users')
  .select('id, username, full_name, role')
  .or('role.eq.Administrador,role.eq.admin,username.eq.wegneycosta,username.eq.felipe,username.eq.admin_b');

const adminIds = adminUsers?.map(admin => admin.id) || [];
```

### 2. Exclusão de Todos os Administradores

```typescript
// Excluir todos os administradores da alteração
.not('user_id', 'in', `(${adminIds.join(',')})`)
```

### 3. Aplicação nas Queries de Atualização

```typescript
// Para alterar para 'friends'
const { data: updateResult, error: linksError } = await supabase
  .from('user_links')
  .update({ 
    link_type: 'friends',
    updated_at: new Date().toISOString()
  })
  .eq('link_type', 'members')
  .not('user_id', 'in', `(${adminIds.join(',')})`) // Excluir todos os administradores
  .select('id, user_id, link_type');

// Para alterar para 'members'
const { data: updateResult, error: linksError } = await supabase
  .from('user_links')
  .update({ 
    link_type: 'members',
    updated_at: new Date().toISOString()
  })
  .eq('link_type', 'friends')
  .not('user_id', 'in', `(${adminIds.join(',')})`) // Excluir todos os administradores
  .select('id, user_id, link_type');
```

## Critérios de Identificação de Administradores

Um usuário é considerado administrador se:

1. **Role**: `'Administrador'` ou `'admin'`
2. **Username específico**: `'wegneycosta'`, `'felipe'`, `'admin_b'`

## Teste de Validação

O teste `scripts/teste-alteracao-links-corrigida.js` verifica:

1. ✅ **Administradores preservados**: Links de administradores não são alterados
2. ✅ **Membros alterados**: Links de membros são alterados conforme a configuração
3. ✅ **Campanhas preservadas**: A coluna `campaign` é mantida
4. ✅ **Configuração do sistema**: `system_settings` é atualizada corretamente

## Resultado do Teste

```
📊 Estado atual dos links:
   - admin_b - Administrador (B): members [ADMIN]
   - ANTONIO RUA NETTO - Membro (A): members [MEMBRO]
   - Admin - Adminstrador (A): members [ADMIN]

👤 Administradores encontrados: 3
   - admin_b (B): Administrador
   - felipe (A): Felipe Admin
   - admin (A): Administrador

🔄 Teste de alteração:
   ✅ Administradores preservados (não alterados)
   ✅ Membros alterados corretamente
   ✅ Configuração do sistema atualizada
```

## Arquivos Modificados

- `src/hooks/useSystemSettings.ts`: Função `updateMemberLinksType` corrigida
- `scripts/teste-alteracao-links-corrigida.js`: Teste de validação criado
- `docs/CORRECAO_ALTERACAO_LINKS_ADMINS.md`: Documentação da correção

## Impacto da Correção

- **Administradores**: Seus links não são mais afetados pela alteração global de `link_type`
- **Membros**: Continuam sendo afetados pela alteração global de `link_type`
- **Campanhas**: Isolamento por campanha é preservado
- **Sistema**: Funcionamento mais previsível e correto

## Conclusão

A correção garante que apenas **membros** sejam afetados pela alteração global de `link_type`, enquanto **todos os administradores** mantêm seus tipos de link originais, independentemente da campanha (A ou B).
