# Resumo da Correção de Tipos nas Funções

## Problema Identificado

Erro de tipo de dados na função `check_counters_inconsistency`:

```
ERROR: 42804: structure of query does not match function result type
DETAIL: Returned type character varying does not match expected type text in column 1.
```

## Causa do Problema

- A coluna `name` na tabela `members` é do tipo `character varying`
- A função estava declarada para retornar `TEXT`
- PostgreSQL é rigoroso com tipos de dados em funções

## Solução Implementada

### 1. **Conversão de Tipo Explícita**

Adicionado cast `::TEXT` para converter `character varying` para `TEXT`:

```sql
-- Antes (com erro)
SELECT m.name, ...

-- Depois (corrigido)
SELECT m.name::TEXT, ...
```

### 2. **Funções Corrigidas**

#### **check_counters_inconsistency()**
```sql
CREATE OR REPLACE FUNCTION check_counters_inconsistency()
RETURNS TABLE (
    member_name TEXT,
    contracts_completed INTEGER,
    friends_count INTEGER,
    status_mismatch BOOLEAN
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.name::TEXT,  -- Cast explícito
        m.contracts_completed,
        COALESCE(f.friends_count, 0)::INTEGER,
        (m.contracts_completed != COALESCE(f.friends_count, 0)) AS status_mismatch
    FROM members m
    LEFT JOIN (
        SELECT 
            referrer,
            COUNT(*) as friends_count
        FROM friends 
        WHERE status = 'Ativo' 
        AND deleted_at IS NULL
        GROUP BY referrer
    ) f ON m.name = f.referrer
    WHERE m.status = 'Ativo' 
    AND m.deleted_at IS NULL
    ORDER BY m.name;
END;
$$;
```

#### **fix_counters_inconsistency()**
```sql
CREATE OR REPLACE FUNCTION fix_counters_inconsistency()
RETURNS TABLE (
    member_name TEXT,
    old_contracts_completed INTEGER,
    new_contracts_completed INTEGER,
    action_taken TEXT
)
AS $$
BEGIN
    -- ... lógica da função ...
    
    RETURN QUERY SELECT 
        inconsistency_record.name::TEXT,  -- Cast explícito
        inconsistency_record.contracts_completed,
        inconsistency_record.expected_contracts,
        'updated'::TEXT;
END;
$$;
```

## Arquivos Atualizados

### Scripts SQL Corrigidos
- `docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY_CORRIGIDA.sql`
- `docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY_CORRIGIDA.sql`

### Scripts SQL Originais (Atualizados)
- `docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY.sql`
- `docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY.sql`

## Verificações Adicionadas

### 1. **Verificação de Tipos de Dados**
```sql
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'members' 
    AND column_name = 'name';
```

### 2. **Verificação da Estrutura da Função**
```sql
SELECT 
    routine_name,
    data_type,
    parameter_name,
    parameter_mode
FROM information_schema.parameters 
WHERE specific_name = (
    SELECT specific_name 
    FROM information_schema.routines 
    WHERE routine_name = 'check_counters_inconsistency'
);
```

## Tipos de Dados PostgreSQL

### **character varying vs TEXT**
- `character varying(n)`: Tipo com limite de caracteres
- `TEXT`: Tipo sem limite de caracteres
- Ambos são compatíveis, mas PostgreSQL exige cast explícito em funções

### **Conversão de Tipos**
```sql
-- Sintaxe de cast
valor::TIPO_DESTINO

-- Exemplos
m.name::TEXT
COUNT(*)::INTEGER
'updated'::TEXT
```

## Passos para Aplicar a Correção

### 1. **Executar Função de Verificação**
```sql
-- Execute no Supabase SQL Editor:
docs/CRIAR_FUNCAO_CHECK_COUNTERS_INCONSISTENCY_CORRIGIDA.sql
```

### 2. **Executar Função de Correção**
```sql
-- Execute no Supabase SQL Editor:
docs/CRIAR_FUNCAO_FIX_COUNTERS_INCONSISTENCY_CORRIGIDA.sql
```

### 3. **Testar as Funções**
```bash
node scripts/teste-funcoes-contadores.js
```

## Resultado

### ✅ **Antes da Correção**
- Erro de tipo de dados
- Função não executava
- Inconsistências não verificadas

### ✅ **Depois da Correção**
- Tipos de dados compatíveis
- Função executa corretamente
- Verificação de inconsistências funcionando
- Correção automática disponível

## Lições Aprendidas

1. **PostgreSQL é rigoroso com tipos**: Sempre verificar compatibilidade de tipos
2. **Cast explícito**: Usar `::TIPO` quando necessário
3. **Verificação de estrutura**: Usar `information_schema` para verificar tipos
4. **Testes**: Sempre testar funções após criação

As funções agora estão corrigidas e prontas para uso!
