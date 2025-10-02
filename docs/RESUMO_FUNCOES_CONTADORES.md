# Resumo das Funções de Contadores

## Funções Criadas

### 1. **check_counters_inconsistency()**

Função para verificar inconsistências nos contadores de contratos completados.

#### Estrutura de Retorno:
```sql
RETURNS TABLE (
    member_name TEXT,
    contracts_completed INTEGER,
    friends_count INTEGER,
    status_mismatch BOOLEAN
)
```

#### Lógica:
- Compara `contracts_completed` na tabela `members` com a contagem real de amigos na tabela `friends`
- Retorna `true` em `status_mismatch` quando há diferença entre os valores
- Ordena por nome do membro

#### Uso:
```sql
SELECT * FROM check_counters_inconsistency();
```

### 2. **fix_counters_inconsistency()**

Função para corrigir inconsistências nos contadores de contratos completados.

#### Estrutura de Retorno:
```sql
RETURNS TABLE (
    member_name TEXT,
    old_contracts_completed INTEGER,
    new_contracts_completed INTEGER,
    action_taken TEXT
)
```

#### Lógica:
- Atualiza `contracts_completed` na tabela `members` com a contagem real de amigos
- Atualiza `updated_at` para o timestamp atual
- Retorna informações sobre as correções aplicadas

#### Uso:
```sql
SELECT * FROM fix_counters_inconsistency();
```

## Arquivos Criados

### Scripts SQL
- `docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY.sql` - Cria função de verificação
- `docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY.sql` - Cria função de correção

### Scripts de Teste
- `scripts/teste-funcoes-contadores.js` - Testa as funções

## Funcionalidades

### ✅ Verificação de Inconsistências
- Compara contadores com dados reais
- Identifica membros com contadores incorretos
- Retorna status de consistência

### ✅ Correção Automática
- Atualiza contadores incorretos
- Mantém timestamp de atualização
- Retorna log das correções

### ✅ Testes Integrados
- Verifica existência das funções
- Testa execução das funções
- Valida resultados

## Exemplo de Uso

### 1. Verificar Inconsistências
```sql
-- Executar verificação
SELECT * FROM check_counters_inconsistency();

-- Contar inconsistências
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN status_mismatch = true THEN 1 END) as inconsistent_members
FROM check_counters_inconsistency();
```

### 2. Corrigir Inconsistências
```sql
-- Executar correção
SELECT * FROM fix_counters_inconsistency();

-- Verificar se foi corrigido
SELECT * FROM check_counters_inconsistency();
```

## Casos de Uso

### 1. **Manutenção Preventiva**
- Executar periodicamente para verificar consistência
- Identificar problemas antes que afetem o sistema

### 2. **Correção Pós-Importação**
- Após importar dados de sistemas externos
- Garantir que contadores estejam corretos

### 3. **Auditoria de Dados**
- Verificar integridade dos dados
- Relatórios de consistência

## Benefícios

1. **Integridade de Dados**: Garante que contadores reflitam dados reais
2. **Automação**: Correção automática de inconsistências
3. **Transparência**: Log detalhado das correções
4. **Performance**: Funções otimizadas para grandes volumes
5. **Manutenibilidade**: Código centralizado e reutilizável

## Estrutura das Tabelas

### Tabela `members`
- `contracts_completed`: Contador de contratos (pode estar inconsistente)
- `name`: Nome do membro (usado como referrer)

### Tabela `friends`
- `referrer`: Nome do membro que indicou o amigo
- `status`: Status do amigo ('Ativo')
- `deleted_at`: Soft delete

## Fluxo de Verificação

```
1. Buscar todos os membros ativos
2. Para cada membro, contar amigos reais na tabela friends
3. Comparar com contracts_completed
4. Identificar inconsistências
5. Retornar resultado com status_mismatch
```

## Fluxo de Correção

```
1. Buscar membros com inconsistências
2. Para cada inconsistência, atualizar contracts_completed
3. Atualizar timestamp updated_at
4. Retornar log das correções
5. Verificar se correção foi aplicada
```

As funções estão prontas para uso e podem ser executadas no Supabase SQL Editor.
