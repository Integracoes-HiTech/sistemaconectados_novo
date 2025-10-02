# Sistema de Cores por Campanha

## Implementação

### **Campanha A (admin, felipe)**
- **Cor Principal**: Azul (`blue-600`)
- **Cor de Destaque**: Dourado (`institutional-gold`)
- **Cor de Fundo**: Azul institucional (`institutional-blue`)

### **Campanha B (admin_b)**
- **Cor Principal**: Azul (`blue-600`)
- **Cor de Destaque**: Dourado (`institutional-gold`)
- **Cor de Fundo**: Azul institucional (`institutional-blue`)

## Elementos Alterados

### **1. Fundo da Página**
```typescript
// Campanha A
<div className="min-h-screen bg-institutional-blue">

// Campanha B
<div className="min-h-screen bg-institutional-blue">
```

### **2. Header**
```typescript
// Campanha A
<header className="bg-white shadow-md border-b-2 border-institutional-gold">

// Campanha B
<header className="bg-white shadow-md border-b-2 border-institutional-gold">
```

### **3. Texto de Boas-vindas**
```typescript
// Campanha A
<span className="text-institutional-blue font-medium">Bem-vindo, {user?.name}</span>

// Campanha B
<span className="text-institutional-blue font-medium">Bem-vindo, {user?.name}</span>
```

### **4. Botão de Logout**
```typescript
// Campanha A
<Button className="border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10">

// Campanha B
<Button className="border-institutional-gold text-institutional-gold hover:bg-institutional-gold/10">
```

### **5. Título Principal**
```typescript
// Campanha A
<h1 className="text-2xl font-bold text-institutional-blue">

// Campanha B
<h1 className="text-2xl font-bold text-institutional-blue">
```

### **6. Badge de Administrador**
```typescript
// Campanha A
<span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">

// Campanha B
<span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
```

### **7. Botão Gerar Link**
```typescript
// Campanha A
<Button className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue">

// Campanha B
<Button className="bg-institutional-gold hover:bg-institutional-gold/90 text-institutional-blue">
```

### **8. Cards de Resumo**
```typescript
// Campanha A
<Card className="border-l-4 border-l-institutional-gold">
  <p className="text-2xl font-bold text-institutional-blue">
  <div className="bg-institutional-light">
    <Users className="w-6 h-6 text-institutional-blue" />

// Campanha B
<Card className="border-l-4 border-l-institutional-gold">
  <p className="text-2xl font-bold text-institutional-blue">
  <div className="bg-institutional-light">
    <Users className="w-6 h-6 text-institutional-blue" />
```

### **9. Card de Configurações**
```typescript
// Campanha A
<Card className="border-l-4 border-l-blue-500">
  <CardTitle className="text-institutional-blue">
  <div className="bg-blue-50 border-blue-200">
    <h4 className="text-blue-800">
    <p className="text-blue-700">
    <Button className="bg-blue-600 hover:bg-blue-700">

// Campanha B
<Card className="border-l-4 border-l-blue-500">
  <CardTitle className="text-institutional-blue">
  <div className="bg-blue-50 border-blue-200">
    <h4 className="text-blue-800">
    <p className="text-blue-700">
    <Button className="bg-blue-600 hover:bg-blue-700">
```

### **10. Estado de Loading**
```typescript
// Campanha A
<div className="min-h-screen bg-institutional-blue">
  <div className="border-2 border-institutional-gold border-t-transparent">

// Campanha B
<div className="min-h-screen bg-institutional-blue">
  <div className="border-2 border-institutional-gold border-t-transparent">
```

## Função de Tema

### **getCampaignTheme()**
```typescript
const getCampaignTheme = () => {
  if (user?.campaign === 'B') {
    return {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryLight: 'bg-blue-50',
      primaryBorder: 'border-blue-200',
      primaryText: 'text-blue-800',
      primaryAccent: 'bg-blue-100',
      primaryButton: 'bg-blue-600 hover:bg-blue-700',
      primaryCard: 'border-l-blue-500',
      primaryBadge: 'bg-blue-100 text-blue-800',
      primaryIcon: 'text-blue-600',
      primaryGradient: 'from-blue-500 to-blue-600',
      primaryShadow: 'shadow-blue-200'
    };
  } else {
    // Campanha A (padrão)
    return {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      primaryLight: 'bg-blue-50',
      primaryBorder: 'border-blue-200',
      primaryText: 'text-blue-800',
      primaryAccent: 'bg-blue-100',
      primaryButton: 'bg-blue-600 hover:bg-blue-700',
      primaryCard: 'border-l-blue-500',
      primaryBadge: 'bg-blue-100 text-blue-800',
      primaryIcon: 'text-blue-600',
      primaryGradient: 'from-blue-500 to-blue-600',
      primaryShadow: 'shadow-blue-200'
    };
  }
};
```

## Cores Utilizadas

### **Campanha A e B (Azul)**
- `bg-institutional-blue` - Fundo principal
- `text-institutional-blue` - Texto principal
- `border-institutional-gold` - Bordas e destaques
- `bg-institutional-gold` - Botões principais
- `text-institutional-gold` - Texto de botões
- `bg-institutional-light` - Fundos claros


## Benefícios

### **1. Identificação Visual**
- Usuários sabem imediatamente em qual campanha estão
- Interface unificada para ambas as campanhas
- Interface mais intuitiva

### **2. Consistência**
- Todas as cores seguem o mesmo padrão
- Elementos relacionados têm cores similares
- Interface unificada entre campanhas
- Hierarquia visual clara

### **3. Profissionalismo**
- Interface mais polida
- Identidade visual unificada
- Experiência de usuário melhorada

## Implementação Técnica

### **Condicional por Campanha**
```typescript
// Padrão usado em todo o dashboard
className={`${user?.campaign === 'B' ? 'cor-campanha-b' : 'cor-campanha-a'}`}
```

### **Tema Centralizado**
```typescript
const theme = getCampaignTheme();
// Usar theme.primary, theme.primaryHover, etc.
```

## Resultado

### **Campanha A e B**
- Interface azul e dourada
- Visual institucional
- Cores unificadas

O sistema agora possui **identidade visual unificada** para ambas as campanhas, mantendo consistência e melhorando a experiência do usuário.
