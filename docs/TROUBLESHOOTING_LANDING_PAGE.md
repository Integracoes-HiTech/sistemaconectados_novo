# 🔧 Troubleshooting - Landing Page

## Problemas Comuns e Soluções

### 🚫 **"Não consigo salvar no banco"**

#### **Possíveis Causas:**

### 1. **Problema de RLS (Row Level Security)**
**Sintoma:** Erro "new row violates row-level security policy"
**Solução:** Execute o script RLS
```sql
-- Execute no Supabase SQL Editor:
-- docs/RLS_SECURE_LANDING.sql
```

### 2. **Tabelas não existem**
**Sintoma:** Erro "relation does not exist"
**Solução:** Crie as tabelas
```sql
-- Execute no Supabase SQL Editor:
-- docs/LANDING_PAGE_SYSTEM_FIXED.sql
```

### 3. **Colunas faltando**
**Sintoma:** Erro "column does not exist"
**Solução:** Adicione as colunas
```sql
-- Execute no Supabase SQL Editor:
-- docs/ADD_PAYMENT_URL_COLUMN.sql
```

### 4. **Problema de CORS**
**Sintoma:** Erro de CORS no console
**Solução:** Verificar configurações do Supabase

### 5. **Chaves de API incorretas**
**Sintoma:** Erro 401/403
**Solução:** Verificar SUPABASE_URL e SUPABASE_ANON_KEY

## 🧪 **Como Diagnosticar:**

### **1. Use a página de debug:**
- Abra `docs/DEBUG_LANDING_PAGE.html` no navegador
- Execute os testes de conexão
- Verifique os logs de erro

### **2. Verifique o console do navegador:**
- F12 → Console
- Procure por erros em vermelho
- Copie e cole os erros aqui

### **3. Execute o teste SQL:**
```sql
-- Execute no Supabase SQL Editor:
-- docs/TEST_DATABASE_CONNECTION.sql
```

## 🔍 **Checklist de Verificação:**

### **✅ Configuração do Banco:**
- [ ] Tabelas `landing_leads`, `landing_payments`, `landing_campaigns` existem
- [ ] Coluna `payment_url` existe na tabela `landing_payments`
- [ ] RLS está configurado corretamente
- [ ] Trigger `create_admin_after_payment` existe

### **✅ Configuração do Frontend:**
- [ ] `SUPABASE_URL` está correto
- [ ] `SUPABASE_ANON_KEY` está correto
- [ ] Não há erros de JavaScript no console
- [ ] Formulário tem todos os campos obrigatórios

### **✅ Validações:**
- [ ] CPF/CNPJ está sendo validado
- [ ] Telefone está sendo validado
- [ ] Email está sendo validado
- [ ] Plano está sendo selecionado

## 🚨 **Erros Específicos:**

### **"new row violates row-level security policy"**
```sql
-- Solução:
ALTER TABLE landing_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE landing_payments DISABLE ROW LEVEL SECURITY;
```

### **"relation 'landing_leads' does not exist"**
```sql
-- Solução: Execute o script completo
-- docs/LANDING_PAGE_SYSTEM_FIXED.sql
```

### **"column 'payment_url' does not exist"**
```sql
-- Solução:
ALTER TABLE landing_payments 
ADD COLUMN IF NOT EXISTS payment_url TEXT;
```

### **"trigger already exists"**
```sql
-- Solução:
DROP TRIGGER IF EXISTS trigger_create_admin_after_payment ON landing_payments;
-- Depois execute o script completo
```

## 📞 **Como Reportar Problemas:**

### **1. Cole aqui:**
- Mensagem de erro completa
- Screenshot do console (F12)
- URL da landing page
- Dados que estava tentando salvar

### **2. Execute e cole o resultado:**
```sql
-- Execute no Supabase SQL Editor e cole aqui:
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('landing_leads', 'landing_payments')
ORDER BY table_name, ordinal_position;
```

## 🔧 **Scripts de Correção Rápida:**

### **Correção Completa (Execute tudo):**
```sql
-- 1. Remover RLS temporariamente
ALTER TABLE landing_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE landing_payments DISABLE ROW LEVEL SECURITY;

-- 2. Adicionar colunas se não existirem
ALTER TABLE landing_payments 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- 3. Verificar se funcionou
SELECT 'Teste OK' as status;
```

### **Verificação Final:**
```sql
-- Verificar estrutura das tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('landing_leads', 'landing_payments')
ORDER BY table_name, ordinal_position;
```
