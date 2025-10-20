# 📋 Sistema de Planos - Vencimento e Upgrade

## 🎯 Visão Geral

Este documento descreve o sistema de **vencimento** e **upgrade** dos planos Essencial, Profissional e Avançado.

---

## 📅 Regras de Vencimento

### **🔄 Planos Essencial e Profissional**
- **Período de aviso**: **30 dias** após a criação da campanha
- **Tipo de mensagem**: **Upgrade** para planos superiores
- **Localização**: Card de aviso no dashboard (similar ao "Plano Gratuito Ativo")

### **⏰ Plano Avançado**
- **Período de aviso**: **7 dias** antes do vencimento
- **Tipo de mensagem**: **Renovação** do plano atual
- **Localização**: Card de aviso no dashboard

---

## 🎨 Interface de Avisos

### **📱 Card de Aviso - Upgrade (Essencial/Profissional)**
```javascript
// Aparece 30 dias após criação da campanha
{
  title: "Upgrade Disponível",
  message: "Seu plano atual permite upgrade para recursos mais avançados",
  type: "upgrade",
  color: "orange", // Laranja como o plano gratuito
  action: "Ver Planos Superiores"
}
```

### **📱 Card de Aviso - Renovação (Avançado)**
```javascript
// Aparece 7 dias antes do vencimento
{
  title: "Renovação Necessária",
  message: "Seu plano Avançado vence em X dias",
  type: "renewal",
  color: "red", // Vermelho para urgência
  action: "Renovar Plano"
}
```

---

## 🗄️ Estrutura de Dados

### **📊 Tabela `campaigns`**
```sql
-- Adicionar coluna de data de criação
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Adicionar coluna de data de vencimento (para plano Avançado)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL;
```

### **📊 Tabela `planos_precos`**
```sql
-- Já existe: amount_anual, desconto
-- Usar para cálculos de upgrade e renovação
```

---

## 🔧 Implementação

### **1. Função de Verificação de Vencimento**
```javascript
const checkPlanExpiration = (campaign, planName) => {
  const now = new Date();
  const campaignCreated = new Date(campaign.created_at);
  const daysSinceCreation = Math.floor((now - campaignCreated) / (1000 * 60 * 60 * 24));
  
  // Essencial e Profissional: 30 dias
  if (planName.includes('Essencial') || planName.includes('Profissional')) {
    if (daysSinceCreation >= 30) {
      return {
        showUpgrade: true,
        daysSinceCreation,
        message: "Upgrade disponível há " + (daysSinceCreation - 30) + " dias"
      };
    }
  }
  
  // Avançado: 7 dias antes do vencimento
  if (planName.includes('Avançado') && campaign.expires_at) {
    const expiresAt = new Date(campaign.expires_at);
    const daysUntilExpiry = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return {
        showRenewal: true,
        daysUntilExpiry,
        message: "Plano vence em " + daysUntilExpiry + " dias"
      };
    }
  }
  
  return { showUpgrade: false, showRenewal: false };
};
```

### **2. Componente de Aviso**
```jsx
// Card de aviso no dashboard
{showUpgrade && (
  <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-orange-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-orange-800">Upgrade Disponível</h3>
            <p className="text-sm text-orange-700">
              Seu plano atual permite upgrade para recursos mais avançados
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => window.open('https://conectadosdigital.com.br/comece-agora.html#planos', '_blank')}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          Ver Planos Superiores
        </Button>
      </div>
    </CardContent>
  </Card>
)}

{showRenewal && (
  <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-red-800">Renovação Necessária</h3>
            <p className="text-sm text-red-700">
              Seu plano Avançado vence em {daysUntilExpiry} dias
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => window.open('https://conectadosdigital.com.br/comece-agora.html#planos', '_blank')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Renovar Plano
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 📊 Consultas SQL

### **1. Verificar Campanhas que Precisam de Upgrade**
```sql
-- Campanhas Essencial/Profissional com mais de 30 dias
SELECT 
    c.id,
    c.name as campaign_name,
    c.created_at,
    pp.nome_plano,
    pp.amount,
    EXTRACT(DAY FROM (NOW() - c.created_at)) as dias_desde_criacao
FROM campaigns c
JOIN auth_users au ON au.campaign = c.code
JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE (pp.nome_plano ILIKE '%essencial%' OR pp.nome_plano ILIKE '%profissional%')
AND c.created_at <= NOW() - INTERVAL '30 days'
ORDER BY dias_desde_criacao DESC;
```

### **2. Verificar Campanhas que Precisam de Renovação**
```sql
-- Campanhas Avançado próximas do vencimento
SELECT 
    c.id,
    c.name as campaign_name,
    c.expires_at,
    pp.nome_plano,
    pp.amount,
    EXTRACT(DAY FROM (c.expires_at - NOW())) as dias_ate_vencimento
FROM campaigns c
JOIN auth_users au ON au.campaign = c.code
JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE pp.nome_plano ILIKE '%avançado%'
AND c.expires_at IS NOT NULL
AND c.expires_at <= NOW() + INTERVAL '7 days'
ORDER BY dias_ate_vencimento ASC;
```

### **3. Relatório de Vencimentos**
```sql
-- Relatório completo de vencimentos
SELECT 
    pp.nome_plano,
    COUNT(CASE 
        WHEN pp.nome_plano ILIKE '%essencial%' OR pp.nome_plano ILIKE '%profissional%'
        THEN CASE WHEN c.created_at <= NOW() - INTERVAL '30 days' THEN 1 END
        WHEN pp.nome_plano ILIKE '%avançado%'
        THEN CASE WHEN c.expires_at <= NOW() + INTERVAL '7 days' THEN 1 END
    END) as campanhas_para_aviso,
    COUNT(*) as total_campanhas
FROM campaigns c
JOIN auth_users au ON au.campaign = c.code
JOIN planos_precos pp ON au.plano_preco_id = pp.id
WHERE pp.amount > 0
GROUP BY pp.nome_plano
ORDER BY campanhas_para_aviso DESC;
```

---

## 🎯 Casos de Uso

### **1. Dashboard - Verificação Automática**
```javascript
// No dashboard, verificar automaticamente
useEffect(() => {
  if (user && campaign && planFeatures.planName) {
    const expirationInfo = checkPlanExpiration(campaign, planFeatures.planName);
    
    if (expirationInfo.showUpgrade) {
      setShowUpgradeCard(true);
      setUpgradeMessage(expirationInfo.message);
    }
    
    if (expirationInfo.showRenewal) {
      setShowRenewalCard(true);
      setRenewalMessage(expirationInfo.message);
    }
  }
}, [user, campaign, planFeatures]);
```

### **2. Notificação por Email**
```javascript
// Enviar email de aviso (opcional)
const sendExpirationEmail = async (campaign, planName, type) => {
  if (type === 'upgrade') {
    await emailService.sendUpgradeReminder(campaign.admin_email, planName);
  } else if (type === 'renewal') {
    await emailService.sendRenewalReminder(campaign.admin_email, planName);
  }
};
```

### **3. Webhook de Pagamento**
```javascript
// Atualizar data de vencimento após pagamento
const updateExpirationDate = async (campaignId, planName) => {
  if (planName.includes('Avançado')) {
    const newExpirationDate = new Date();
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 1); // +1 mês
    
    await supabase
      .from('campaigns')
      .update({ expires_at: newExpirationDate.toISOString() })
      .eq('id', campaignId);
  }
};
```

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| 🎯 **Upgrade Proativo** | Avisa usuários sobre planos superiores |
| ⏰ **Renovação Preventiva** | Evita perda de serviço por vencimento |
| 💰 **Aumento de Receita** | Incentiva upgrades e renovações |
| 📊 **Controle de Vencimentos** | Relatórios de campanhas próximas do vencimento |
| 🔔 **Notificações Visuais** | Cards de aviso no dashboard |
| 📧 **Comunicação Direta** | Emails de lembrete (opcional) |

---

## 🚀 Como Implementar

### **Passo 1: Adicionar Colunas**
```sql
-- Executar no Supabase SQL Editor
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT NULL;
```

### **Passo 2: Atualizar Dashboard**
```javascript
// Adicionar verificação de vencimento no dashboard
const checkPlanExpiration = (campaign, planName) => {
  // Implementar lógica de verificação
};
```

### **Passo 3: Adicionar Cards de Aviso**
```jsx
// Adicionar cards de aviso no dashboard
{showUpgrade && <UpgradeCard />}
{showRenewal && <RenewalCard />}
```

### **Passo 4: Testar**
```javascript
// Testar com diferentes cenários
- Campanha Essencial com 30+ dias
- Campanha Profissional com 30+ dias  
- Campanha Avançado com 7 dias para vencer
```

---

## 📝 Notas Importantes

1. ⚠️ **Data de Criação**: Usar `campaigns.created_at` para calcular 30 dias
2. 📅 **Data de Vencimento**: Usar `campaigns.expires_at` para plano Avançado
3. 🎨 **Design Consistente**: Usar mesmo estilo do card "Plano Gratuito Ativo"
4. 🔗 **Links Externos**: Redirecionar para landing page com #planos
5. 📊 **Relatórios**: Gerar relatórios de campanhas próximas do vencimento
6. 🔔 **Frequência**: Verificar a cada carregamento do dashboard

---

## ✅ Checklist de Implementação

- [ ] Adicionar colunas `created_at` e `expires_at` na tabela `campaigns`
- [ ] Implementar função `checkPlanExpiration()`
- [ ] Criar componente `UpgradeCard`
- [ ] Criar componente `RenewalCard`
- [ ] Adicionar verificação no dashboard
- [ ] Testar com campanhas Essencial (30+ dias)
- [ ] Testar com campanhas Profissional (30+ dias)
- [ ] Testar com campanhas Avançado (7 dias para vencer)
- [ ] Implementar relatórios SQL
- [ ] Configurar emails de lembrete (opcional)
- [ ] Atualizar webhook de pagamento para definir `expires_at`

---

**Sistema de vencimento e upgrade implementado! 🎉**

Agora os usuários receberão avisos proativos sobre upgrades e renovações! 📅💰
