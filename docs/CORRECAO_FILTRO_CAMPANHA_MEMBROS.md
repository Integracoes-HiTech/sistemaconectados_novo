# Correção: Filtro por Campanha - Membros

## Problema Identificado

Os contadores de membros (verdes, amarelos, vermelhos) no dashboard estavam mostrando dados de **todas as campanhas** em vez de apenas da campanha específica do usuário logado.

## Causa do Problema

O hook `useMembers` estava usando a view `v_system_stats` que não filtra por campanha, retornando estatísticas globais de todas as campanhas.

## Solução Implementada

### **1. Modificação do Hook `useMembers`**

**Arquivo**: `src/hooks/useMembers.ts`

**Função**: `fetchMemberStats`

**Antes**:
```typescript
const fetchMemberStats = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('v_system_stats')
      .select('*')
      .single()

    if (error) throw error

    const stats: MemberStats = {
      total_members: data.total_members || 0,
      green_members: data.green_members || 0,
      yellow_members: data.yellow_members || 0,
      red_members: data.red_members || 0,
      // ... outros campos
    }

    setMemberStats(stats)
  } catch (err) {
    // Erro ao carregar estatísticas dos membros
  }
}, [])
```

**Depois**:
```typescript
const fetchMemberStats = useCallback(async () => {
  try {
    // Se não há campanha especificada, usar a view global
    if (!campaign) {
      const { data, error } = await supabase
        .from('v_system_stats')
        .select('*')
        .single()

      if (error) throw error

      const stats: MemberStats = {
        total_members: data.total_members || 0,
        green_members: data.green_members || 0,
        yellow_members: data.yellow_members || 0,
        red_members: data.red_members || 0,
        // ... outros campos
      }

      setMemberStats(stats)
      return
    }

    // Filtrar por campanha específica
    const { data: membersData, error } = await supabase
      .from('members')
      .select('ranking_status, contracts_completed, is_top_1500')
      .eq('campaign', campaign)
      .eq('status', 'Ativo')
      .is('deleted_at', null)

    if (error) throw error

    // Calcular estatísticas da campanha
    const totalMembers = membersData?.length || 0
    const greenMembers = membersData?.filter(m => m.ranking_status === 'Verde').length || 0
    const yellowMembers = membersData?.filter(m => m.ranking_status === 'Amarelo').length || 0
    const redMembers = membersData?.filter(m => m.ranking_status === 'Vermelho').length || 0
    const top1500Members = membersData?.filter(m => m.is_top_1500).length || 0

    const stats: MemberStats = {
      total_members: totalMembers,
      green_members: greenMembers,
      yellow_members: yellowMembers,
      red_members: redMembers,
      top_1500_members: top1500Members,
      current_member_count: totalMembers,
      max_member_limit: 1500,
      can_register_more: totalMembers < 1500
    }

    setMemberStats(stats)
  } catch (err) {
    // Erro ao carregar estatísticas dos membros
  }
}, [campaign])
```

### **2. Lógica de Filtro**

- **Sem campanha**: Usa a view global `v_system_stats` (compatibilidade)
- **Com campanha**: Filtra diretamente na tabela `members` por campanha específica
- **Cálculo local**: Estatísticas calculadas no frontend baseadas nos dados filtrados

## Teste de Validação

### **Script de Teste**: `scripts/teste-filtro-campanha-membros.js`

**Resultados do Teste**:
```
📊 1. Distribuição por campanha:
   Campanha A:
     Total: 4
     Verde: 0
     Amarelo: 0
     Vermelho: 4
   Campanha B:
     Total: 1
     Verde: 0
     Amarelo: 0
     Vermelho: 1

📊 2. Filtro Campanha A:
   Total: 4
   Verde: 0
   Amarelo: 0
   Vermelho: 4
   Top 1500: 0

📊 3. Filtro Campanha B:
   Total: 1
   Verde: 0
   Amarelo: 0
   Vermelho: 1
   Top 1500: 0

📊 4. View Global (v_system_stats):
   Total: 5
   Verde: 0
   Amarelo: 0
   Vermelho: 5
   Top 1500: 0
```

## Resultado

### **Antes da Correção**
- Contadores mostravam dados de **todas as campanhas**
- Usuário da Campanha A via dados da Campanha B
- Usuário da Campanha B via dados da Campanha A
- **Isolamento de campanhas não funcionava**

### **Depois da Correção**
- Contadores mostram apenas dados da **campanha específica**
- Usuário da Campanha A vê apenas dados da Campanha A
- Usuário da Campanha B vê apenas dados da Campanha B
- **Isolamento de campanhas funcionando corretamente**

## Impacto

### **1. Dashboard**
- Cards de "Total de Membros", "Membros Verdes", "Membros Amarelos", "Membros Vermelhos" agora filtram por campanha
- Estatísticas precisas por campanha
- Isolamento de dados garantido

### **2. Experiência do Usuário**
- Administradores veem apenas dados de sua campanha
- Relatórios e estatísticas específicas por campanha
- Interface mais limpa e focada

### **3. Segurança**
- Dados de uma campanha não são visíveis para outra
- Isolamento completo entre campanhas
- Conformidade com requisitos de separação de dados

## Arquivos Modificados

1. **`src/hooks/useMembers.ts`** - Lógica de filtro por campanha
2. **`docs/TESTAR_FILTRO_CAMPANHA_MEMBROS.sql`** - Script SQL de teste
3. **`scripts/teste-filtro-campanha-membros.js`** - Script Node.js de validação

## Conclusão

A correção garante que os contadores de membros no dashboard sejam filtrados corretamente por campanha, mantendo o isolamento de dados entre as campanhas A e B conforme especificado.
