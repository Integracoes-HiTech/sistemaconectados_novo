# 📍 CEP - Apenas para Cadastro (NÃO exibir nas tabelas)

## 🎯 Objetivo

O campo CEP serve **APENAS** para facilitar o cadastro:
- ✅ Usuário digita o CEP
- ✅ Sistema busca automaticamente Cidade e Setor via ViaCEP
- ✅ CEP é salvo no banco (para referência futura)
- ❌ CEP **NÃO é exibido** nas tabelas do dashboard

---

## ✅ Onde o CEP é USADO

### 1. **Formulário de Cadastro** (`PublicRegister.tsx`)
```
┌─────────────────────────────────────┐
│  📝 Cadastro de Membro              │
├─────────────────────────────────────┤
│  Nome: João Silva                   │
│  WhatsApp: (62) 99999-9999          │
│  Instagram: @joaosilva              │
│  CEP: 74000-000 ← APARECE AQUI      │
│  Cidade: Goiânia (auto)             │
│  Setor: Centro (auto)               │
├─────────────────────────────────────┤
│  📝 Dados do Parceiro               │
├─────────────────────────────────────┤
│  Nome: Maria Silva                  │
│  WhatsApp: (62) 98888-8888          │
│  Instagram: @mariasilva             │
│  CEP: 74000-000 ← APARECE AQUI      │
│  Cidade: Goiânia (auto)             │
│  Setor: Centro (auto)               │
└─────────────────────────────────────┘
```

---

## ❌ Onde o CEP NÃO é exibido

### 1. **Dashboard - Tabela de Membros**
```
┌────────────────────────────────────────────────────────────────┐
│  Posição │ Membro      │ WhatsApp   │ Instagram │ Cidade  │... │
├────────────────────────────────────────────────────────────────┤
│  1       │ João Silva  │ 6299999999 │ @joao     │ Goiânia │    │
│  2       │ Maria José  │ 6298888888 │ @maria    │ Goiânia │    │
└────────────────────────────────────────────────────────────────┘
        ↑ CEP NÃO APARECE AQUI (só nome, telefone, etc)
```

### 2. **Dashboard - Tabela de Amigos**
```
┌────────────────────────────────────────────────────────────────┐
│  Amigo      │ WhatsApp   │ Instagram │ Cidade  │ Indicado por │
├────────────────────────────────────────────────────────────────┤
│  Pedro Lima │ 6297777777 │ @pedro    │ Goiânia │ João Silva   │
│  Ana Costa  │ 6296666666 │ @ana      │ Goiânia │ Maria José   │
└────────────────────────────────────────────────────────────────┘
        ↑ CEP NÃO APARECE AQUI TAMBÉM
```

### 3. **Exportações (Excel/PDF)**
- ❌ CEP **NÃO** será incluído nas exportações
- ✅ Apenas: Nome, WhatsApp, Instagram, Cidade, Setor, etc.

---

## 🔄 Fluxo Completo

### Passo 1: Usuário preenche CEP
```typescript
// Usuário digita: 74000-000
<Input 
  placeholder="CEP (opcional)" 
  value={formData.cep}
  onBlur={handleCepBlur} // ← Busca cidade/setor automaticamente
/>
```

### Passo 2: Sistema busca dados via ViaCEP
```typescript
const handleCepBlur = async () => {
  const cepData = await buscarCep(formData.cep);
  // Preenche automaticamente:
  setFormData({
    ...formData,
    city: cepData.cidade,    // Ex: "Goiânia"
    sector: cepData.bairro   // Ex: "Centro"
  });
};
```

### Passo 3: CEP é salvo no banco
```typescript
const memberData = {
  name: "João Silva",
  phone: "62999999999",
  instagram: "@joaosilva",
  cep: "74000000", // ← Salvo (somente números)
  city: "Goiânia",
  sector: "Centro",
  // ... outros campos
  couple_cep: "74000000", // ← CEP do parceiro também
};

await addMember(memberData); // ← Salva no banco
```

### Passo 4: Dashboard exibe APENAS cidade/setor
```typescript
// No dashboard, NÃO mostramos o CEP:
<td>{member.name}</td>
<td>{member.phone}</td>
<td>{member.instagram}</td>
<td>{member.city}</td>     // ← Mostra cidade
<td>{member.sector}</td>   // ← Mostra setor
// ❌ NÃO tem coluna para CEP
```

---

## 📊 Estrutura do Banco

### Tabela `members` e `friends`
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  instagram VARCHAR(50) NOT NULL,
  cep VARCHAR(9),              -- ← Salvo aqui (NÃO exibido)
  city VARCHAR(100) NOT NULL,  -- ← Exibido no dashboard
  sector VARCHAR(100) NOT NULL,-- ← Exibido no dashboard
  -- ... outros campos ...
  couple_name VARCHAR(100) NOT NULL,
  couple_phone VARCHAR(15) NOT NULL,
  couple_instagram VARCHAR(50) NOT NULL,
  couple_cep VARCHAR(9),       -- ← CEP do parceiro (NÃO exibido)
  couple_city VARCHAR(100) NOT NULL,
  couple_sector VARCHAR(100) NOT NULL
);
```

**Resumo:**
- `cep` e `couple_cep` → Salvos no banco, **NÃO exibidos**
- `city`, `sector`, `couple_city`, `couple_sector` → **Exibidos** no dashboard

---

## ✅ Benefícios

1. **Facilita o cadastro**: Usuário só digita CEP, cidade/setor preenchem automaticamente
2. **Dados salvos**: CEP fica registrado para referência futura (se necessário)
3. **Interface limpa**: Dashboard não fica poluído com CEPs
4. **Performance**: Menos colunas = tabelas mais rápidas

---

## 🎯 Checklist Final

### ✅ Implementado:
- [x] Campo CEP no formulário de cadastro (pessoa 1)
- [x] Campo CEP no formulário de cadastro (pessoa 2/parceiro)
- [x] Busca automática via ViaCEP
- [x] Salvamento do CEP no banco (`members.cep` e `members.couple_cep`)
- [x] Salvamento do CEP no banco (`friends.cep` e `friends.couple_cep`)
- [x] Interface TypeScript atualizada

### ❌ NÃO Implementado (propositalmente):
- [ ] Exibir CEP na tabela de membros ← **NÃO FAZER**
- [ ] Exibir CEP na tabela de amigos ← **NÃO FAZER**
- [ ] Incluir CEP nas exportações ← **NÃO FAZER**

---

## 📝 Exemplo Real

### Cadastro:
```
Pessoa 1:
  Nome: João Silva
  CEP: 74000-000 → busca → Cidade: Goiânia, Setor: Centro

Pessoa 2 (Parceiro):
  Nome: Maria Silva
  CEP: 74123-456 → busca → Cidade: Goiânia, Setor: Setor Sul
```

### Salvo no banco:
```json
{
  "name": "João Silva",
  "cep": "74000000",        // ← Salvo (não exibido)
  "city": "Goiânia",        // ← Exibido
  "sector": "Centro",       // ← Exibido
  "couple_name": "Maria Silva",
  "couple_cep": "74123456", // ← Salvo (não exibido)
  "couple_city": "Goiânia", // ← Exibido
  "couple_sector": "Setor Sul" // ← Exibido
}
```

### Exibido no dashboard:
```
┌────────────────────────────────────────────────────┐
│ João Silva e Maria Silva                           │
│ WhatsApp: 62999999999                              │
│ Cidade: Goiânia                                    │
│ Setor: Centro                                      │
└────────────────────────────────────────────────────┘
     ↑ CEP NÃO aparece aqui
```

---

✅ **PRONTO!** CEP é usado APENAS para facilitar o cadastro.

