# Resumo da Função get_user_stats

## Função Criada

### **get_user_stats(user_id_param UUID)**

Função para obter estatísticas de um usuário específico baseadas nos dados da tabela `users`.

#### Estrutura de Retorno:
```sql
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    recent_registrations BIGINT,
    engagement_rate DECIMAL
)
```

#### Lógica:
- **total_users**: Conta todos os usuários onde `auth_users.full_name = users.referrer`
- **active_users**: Conta usuários com status 'Ativo'
- **recent_registrations**: Conta registros dos últimos 7 dias
- **engagement_rate**: Percentual de usuários ativos (arredondado para 1 casa decimal)

#### Parâmetros:
- `user_id_param UUID`: ID do usuário em `auth_users` para buscar estatísticas

## Arquivos Criados

### Scripts SQL
- `docs/CRIAR_FUNCAO_GET_USER_STATS.sql` - Versão original
- `docs/CRIAR_FUNCAO_GET_USER_STATS_CORRIGIDA.sql` - Versão corrigida

### Scripts de Teste
- `scripts/teste-funcao-user-stats.js` - Teste da função

## Funcionalidades

### ✅ **Estatísticas de Usuário**
- Total de usuários indicados pelo referrer
- Usuários ativos
- Registros recentes (7 dias)
- Taxa de engajamento

### ✅ **Cálculos Automáticos**
- Percentual de engajamento calculado automaticamente
- Tratamento de divisão por zero
- Arredondamento para 1 casa decimal

### ✅ **Filtros Inteligentes**
- Filtro por ID do usuário
- Filtro por status 'Ativo'
- Filtro por data (últimos 7 dias)

## Estrutura das Tabelas

### Tabela `auth_users`
- `id`: UUID do usuário
- `full_name`: Nome completo (usado como referrer)

### Tabela `users`
- `id`: ID do usuário
- `status`: Status do usuário ('Ativo', 'Inativo')
- `registration_date`: Data de registro
- `referrer`: Nome do referrer (deve coincidir com `auth_users.full_name`)

## Exemplo de Uso

### 1. **Executar Função**
```sql
-- Execute no Supabase SQL Editor:
docs/CRIAR_FUNCAO_GET_USER_STATS_CORRIGIDA.sql
```

### 2. **Usar a Função**
```sql
-- Obter estatísticas de um usuário específico
SELECT * FROM get_user_stats('uuid-do-usuario'::UUID);
```

### 3. **Resultado Esperado**
```
total_users | active_users | recent_registrations | engagement_rate
------------|--------------|---------------------|----------------
     15     |      12      |          3          |     80.0
```

## Casos de Uso

### 1. **Dashboard de Usuário**
- Mostrar estatísticas pessoais
- Indicar performance como referrer
- Acompanhar crescimento

### 2. **Relatórios de Performance**
- Comparar usuários
- Identificar top performers
- Análise de engajamento

### 3. **Métricas de Negócio**
- Taxa de conversão
- Crescimento semanal
- Efetividade de indicações

## Benefícios

1. **📊 Métricas Personalizadas**: Estatísticas específicas por usuário
2. **⚡ Performance**: Consulta otimizada com JOIN
3. **🎯 Precisão**: Cálculos automáticos e consistentes
4. **📈 Análise**: Dados para tomada de decisão
5. **🔄 Atualização**: Dados sempre atualizados

## Fórmulas Utilizadas

### **Engagement Rate**
```sql
CASE 
    WHEN COUNT(u.id) > 0 THEN 
        ROUND((COUNT(CASE WHEN u.status = 'Ativo' THEN 1 END)::DECIMAL / COUNT(u.id)) * 100, 1)
    ELSE 0 
END
```

### **Recent Registrations**
```sql
COUNT(CASE WHEN u.registration_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END)
```

## Tratamento de Erros

### **Divisão por Zero**
- Verifica se `COUNT(u.id) > 0` antes de calcular percentual
- Retorna 0 se não há usuários

### **UUID Inválido**
- Retorna zeros para todos os campos
- Não gera erro

### **Dados Inconsistentes**
- LEFT JOIN garante que sempre retorna resultado
- Campos NULL são tratados como 0

## Integração no Frontend

### **Hook Personalizado**
```typescript
const useUserStats = (userId: string) => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .rpc('get_user_stats', { user_id_param: userId });
      setStats(data);
    };
    
    fetchStats();
  }, [userId]);
  
  return stats;
};
```

### **Componente de Exibição**
```typescript
const UserStatsCard = ({ userId }) => {
  const stats = useUserStats(userId);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas Estatísticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total de Usuários</p>
            <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
            <p className="text-2xl font-bold">{stats?.active_users || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Registros Recentes</p>
            <p className="text-2xl font-bold">{stats?.recent_registrations || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Taxa de Engajamento</p>
            <p className="text-2xl font-bold">{stats?.engagement_rate || 0}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

A função está pronta para uso e pode ser integrada no dashboard para mostrar estatísticas personalizadas por usuário.
