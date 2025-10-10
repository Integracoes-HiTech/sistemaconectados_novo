# 🎨 Sistema de Cores por Campanha - Documentação Completa

## 📋 Visão Geral

O sistema possui 4 cores principais que vêm do banco de dados (tabela `campaigns`) para cada campanha:

### 1. **PRIMARY_COLOR** (Cor Primária)
- **Uso:** Títulos principais, headers, elementos de destaque
- **Onde:** Título do dashboard, nome da campanha, cabeçalhos
- **Contraste:** Sempre sobre fundo branco ou claro
- **Exemplo:** `#3B82F6` (azul)

### 2. **SECONDARY_COLOR** (Cor Secundária)
- **Uso:** Subtítulos, descrições, elementos secundários
- **Onde:** Descrição do dashboard, cards internos, textos complementares
- **Contraste:** Sobre fundo branco ou com transparência leve
- **Exemplo:** `#1E40AF` (azul escuro)

### 3. **ACCENT_COLOR** (Cor de Destaque/Ação)
- **Uso:** Botões principais, ícones de ação, CTAs (Call-to-Action)
- **Onde:** Botão "Finalizar Cadastro", "Confirmar e Entrar", ícones importantes
- **Contraste:** Texto SEMPRE calculado automaticamente (branco ou preto)
- **Exemplo:** `#D4AF37` (dourado)

### 4. **BACKGROUND_COLOR** (Cor de Fundo)
- **Uso:** Fundo da página inteira, telas de loading, backgrounds principais
- **Onde:** Background da tela de login, sucesso, cadastro, loading screens
- **Contraste:** Texto SEMPRE calculado automaticamente para máximo contraste
- **Exemplo:** `#14446C` (azul institucional escuro)

---

## ⚙️ Sistema Automático de Contraste

### Arquivo: `src/lib/colorUtils.ts`

Este arquivo contém funções que **garantem que o texto sempre seja visível**, independente da cor de fundo escolhida.

### Funções Principais:

#### 1. `getTextColor(backgroundColor: string): string`
Retorna a melhor cor de texto (branco `#FFFFFF` ou preto `#000000`) para um dado fundo.

**Critério:** Contraste mínimo de 4.5:1 (WCAG AA - Padrão de Acessibilidade Web)

**Exemplo:**
```typescript
const bgColor = '#14446C'; // Azul escuro
const textColor = getTextColor(bgColor); // Retorna '#FFFFFF' (branco)

const bgColorLight = '#E0F2FE'; // Azul claro
const textColor2 = getTextColor(bgColorLight); // Retorna '#000000' (preto)
```

#### 2. `getTitleTextColor(backgroundColor: string): string`
Para títulos importantes, usa critério mais rigoroso (contraste 7:1 - WCAG AAA).

#### 3. `getOverlayColors(baseColor: string)`
Retorna um objeto com variações de cores para overlays:

```typescript
{
  text: '#FFFFFF',           // Texto principal (100% opacidade)
  textSecondary: '#FFFFFFCC', // Texto secundário (80% opacidade)
  textTertiary: '#FFFFFF99',  // Texto terciário (60% opacidade)
  bgLight: '#14446C1A',       // Background 10% opacidade
  bgMedium: '#14446C26',      // Background 15% opacidade
  border: '#14446C66'         // Border 40% opacidade
}
```

---

## 🛠️ Como Usar no Código

### Exemplo Completo:

```typescript
import { getTextColor, getOverlayColors } from '@/lib/colorUtils';
import { useCampaigns } from '@/hooks/useCampaigns';

export default function MeuComponente() {
  const { getCampaignByCode } = useCampaigns();
  
  // Buscar cores da campanha
  const campaignCode = 'A'; // ou 'B', 'SAUDE', etc
  const campaign = getCampaignByCode(campaignCode);
  
  const bgColor = campaign?.background_color || '#14446C';
  const accentColor = campaign?.accent_color || '#D4AF37';
  
  // Calcular automaticamente a cor do texto
  const textColor = getTextColor(bgColor);
  const overlayColors = getOverlayColors(bgColor);
  
  return (
    <div style={{ backgroundColor: bgColor }}>
      {/* Texto sempre visível */}
      <h1 style={{ color: textColor }}>
        Título sempre legível!
      </h1>
      
      {/* Card com overlay */}
      <div style={{ backgroundColor: overlayColors.bgMedium }}>
        <p style={{ color: overlayColors.text }}>
          Texto em card com fundo transparente
        </p>
      </div>
      
      {/* Botão com cor de destaque */}
      <button 
        style={{ 
          backgroundColor: accentColor,
          color: getTextColor(accentColor) // Texto do botão sempre legível
        }}
      >
        Clique Aqui
      </button>
    </div>
  );
}
```

---

## 📊 Regras de Contraste (WCAG)

### Níveis de Conformidade:

| Nível | Contraste Mínimo | Uso |
|-------|------------------|-----|
| **AA** (Normal) | 4.5:1 | Texto normal, parágrafos |
| **AA** (Grande) | 3:1 | Títulos grandes (18pt+) |
| **AAA** | 7:1 | Texto importante, acessibilidade máxima |

### O que o sistema garante:
- ✅ Texto normal: **sempre** 4.5:1 ou mais
- ✅ Títulos: preferência por 7:1 quando possível
- ✅ Botões: contraste calculado automaticamente
- ✅ Overlays: transparências que mantêm legibilidade

---

## 🎯 Onde as Cores são Usadas

### Tela de Sucesso (`PublicRegister.tsx`)
```typescript
// Fundo da página
<div style={{ backgroundColor: bgColor }}>

// Cards internos com overlay
<div style={{ backgroundColor: overlayColors.bgMedium }}>

// Ícone de sucesso
<UserPlus style={{ color: accentColor }} />

// Botão principal
<Button style={{ 
  backgroundColor: accentColor,
  color: getTextColor(accentColor) 
}}>
```

### Dashboard (`dashboard.tsx`)
```typescript
// Cores buscadas do banco para cada campanha
const fetchCampaignColors = async () => {
  const { data } = await supabase
    .from('campaigns')
    .select('background_color, primary_color, secondary_color, accent_color')
    .eq('code', user.campaign)
    .single();
    
  // Aplicar cores dinamicamente
}
```

### Tela de Loading (`App.tsx`)
```typescript
// PageLoader detecta cor do body automaticamente
const PageLoader = () => {
  const [bgColor, setBgColor] = useState('#14446C');
  
  useEffect(() => {
    const bodyColor = window.getComputedStyle(document.body).backgroundColor;
    setBgColor(bodyColor || '#14446C');
  }, []);
  
  return (
    <div style={{ backgroundColor: bgColor }}>
      <div style={{ color: getTextColor(bgColor) }}>
        Carregando...
      </div>
    </div>
  );
};
```

---

## 🔧 Configuração no Banco de Dados

### Tabela: `campaigns`

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE,
  
  -- CORES DO SISTEMA
  primary_color VARCHAR(7) DEFAULT '#3B82F6',      -- Títulos, headers
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',    -- Subtítulos
  accent_color VARCHAR(7) DEFAULT '#D4AF37',       -- Botões, CTAs
  background_color VARCHAR(7) DEFAULT '#14446C',   -- Fundo das páginas
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Exemplos de Configuração:

#### Campanha A (Azul Institucional)
```sql
UPDATE campaigns SET
  primary_color = '#3B82F6',
  secondary_color = '#1E40AF',
  accent_color = '#D4AF37',
  background_color = '#14446C'
WHERE code = 'A';
```

#### Campanha B (Azul Claro)
```sql
UPDATE campaigns SET
  primary_color = '#60A5FA',
  secondary_color = '#3B82F6',
  accent_color = '#D4AF37',
  background_color = '#1E40AF'
WHERE code = 'B';
```

#### Campanha Saúde (Verde)
```sql
UPDATE campaigns SET
  primary_color = '#10B981',
  secondary_color = '#059669',
  accent_color = '#D4AF37',
  background_color = '#047857'
WHERE code = 'SAUDE';
```

---

## ✅ Checklist de Implementação

Ao criar uma nova tela ou componente que usa cores de campanha:

- [ ] Importar `useCampaigns` hook
- [ ] Buscar cores da campanha pelo código
- [ ] Importar `getTextColor` e `getOverlayColors` de `@/lib/colorUtils`
- [ ] Aplicar `background_color` no fundo principal
- [ ] Aplicar `accent_color` em botões e CTAs
- [ ] Usar `getTextColor()` para calcular cor do texto automaticamente
- [ ] Usar `overlayColors` para cards e overlays
- [ ] Testar com diferentes campanhas (A, B, SAUDE)
- [ ] Verificar contraste em modo claro e escuro (DevTools)

---

## 🐛 Troubleshooting

### Problema: Texto invisível
**Causa:** Cor do texto igual à cor do fundo
**Solução:** Use `getTextColor(bgColor)` ao invés de definir cor manualmente

### Problema: Botão ilegível
**Causa:** `color` definido manualmente no botão
**Solução:** 
```typescript
<Button style={{ 
  backgroundColor: accentColor,
  color: getTextColor(accentColor) // <- SEMPRE calcular
}} />
```

### Problema: Cores não atualizando
**Causa:** Cache do `useMemo` ou `useEffect`
**Solução:** Verificar dependências do `useMemo`:
```typescript
const colors = useMemo(() => {
  // ...
}, [linkData?.campaign, referrerData?.campaign, getCampaignByCode]);
//   ^^^^^^^^^^^^^ Certifique-se que as dependências estão corretas
```

---

## 📚 Referências

- [WCAG 2.1 - Contraste](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [MDN - Color Contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast)

---

**Última atualização:** 2025-10-10
**Autor:** Sistema Conectados - Equipe de Desenvolvimento

