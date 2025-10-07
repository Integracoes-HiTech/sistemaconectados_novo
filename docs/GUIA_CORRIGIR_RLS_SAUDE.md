# 🔧 Guia: Corrigir RLS para Cadastro Público de Saúde

## 📋 Problema
O erro `new row violates row-level security policy for table "saude_people"` ocorre porque o RLS está bloqueando INSERT público.

## ✅ Solução (Passo a Passo)

### **Passo 1: Acessar o Supabase SQL Editor**
1. Abra o dashboard do Supabase
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New Query**

### **Passo 2: Executar o Script de Correção**

**Copie e cole este código no SQL Editor:**

```sql
-- REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Allow public insert on saude_people" ON saude_people;
DROP POLICY IF EXISTS "Saude people are viewable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people are modifiable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people can be deleted by admin3 and AdminHitech" ON saude_people;

-- CRIAR POLÍTICA PARA PERMITIR INSERT PÚBLICO
CREATE POLICY "saude_public_insert" 
ON saude_people 
FOR INSERT 
TO anon, public, authenticated
WITH CHECK (true);

-- CRIAR POLÍTICA PARA SELECT (admin3/AdminHitech)
CREATE POLICY "saude_admin_select" 
ON saude_people 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND (role = 'admin3' OR role = 'AdminHitech')
    )
);

-- CRIAR POLÍTICA PARA UPDATE (admin3/AdminHitech)
CREATE POLICY "saude_admin_update" 
ON saude_people 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND (role = 'admin3' OR role = 'AdminHitech')
    )
);

-- CRIAR POLÍTICA PARA DELETE (admin3/AdminHitech)
CREATE POLICY "saude_admin_delete" 
ON saude_people 
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth_users 
        WHERE id = auth.uid() 
        AND (role = 'admin3' OR role = 'AdminHitech')
    )
);
```

### **Passo 3: Executar**
1. Clique em **Run** (ou pressione Ctrl+Enter)
2. Aguarde a mensagem de sucesso

### **Passo 4: Verificar**
Execute este comando para verificar se as políticas foram criadas:

```sql
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'saude_people';
```

Você deve ver 4 políticas:
- ✅ `saude_public_insert` (INSERT para anon, public, authenticated)
- ✅ `saude_admin_select` (SELECT para authenticated)
- ✅ `saude_admin_update` (UPDATE para authenticated)
- ✅ `saude_admin_delete` (DELETE para authenticated)

### **Passo 5: Testar**
1. Volte para o aplicativo
2. Tente cadastrar uma pessoa no formulário de saúde
3. O cadastro deve funcionar! 🎉

---

## 🆘 Se Ainda Não Funcionar

### **Opção 1: Verificar se a tabela existe**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'saude_people';
```

### **Opção 2: Verificar se RLS está habilitado**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'saude_people';
```

### **Opção 3: Desabilitar RLS temporariamente (APENAS PARA TESTE)**
```sql
ALTER TABLE saude_people DISABLE ROW LEVEL SECURITY;
```
⚠️ **ATENÇÃO:** Isso remove toda a segurança! Use apenas para testar!

Para reabilitar depois:
```sql
ALTER TABLE saude_people ENABLE ROW LEVEL SECURITY;
```

---

## 📞 Suporte
Se o problema persistir, verifique:
1. Se a tabela `saude_people` existe
2. Se o RLS está habilitado
3. Se há outras políticas conflitantes
4. Se o Supabase está configurado corretamente

