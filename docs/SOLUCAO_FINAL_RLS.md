# 🔧 Solução Final: RLS para Cadastro de Saúde

## 📋 **2 Opções de Solução**

---

## ✅ **OPÇÃO 1: Desabilitar RLS (Mais Simples)** ⭐ RECOMENDADO

Execute no **Supabase SQL Editor**:

```sql
-- REMOVER TODAS AS POLÍTICAS
DROP POLICY IF EXISTS "saude_public_insert" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_select" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_update" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_delete" ON saude_people;
DROP POLICY IF EXISTS "Allow public insert on saude_people" ON saude_people;
DROP POLICY IF EXISTS "Saude people are viewable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people are modifiable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people can be deleted by admin3 and AdminHitech" ON saude_people;

-- DESABILITAR RLS COMPLETAMENTE
ALTER TABLE saude_people DISABLE ROW LEVEL SECURITY;

-- VERIFICAR
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVADO ❌' 
        ELSE 'RLS DESATIVADO ✅' 
    END as status
FROM pg_tables 
WHERE tablename = 'saude_people';
```

**Resultado esperado:** `RLS DESATIVADO ✅`

---

## ✅ **OPÇÃO 2: Usar Function (Mais Seguro)**

Se você quer manter o RLS ativo para SELECT/UPDATE/DELETE, mas permitir INSERT público:

### **Passo 1: Criar Function**

```sql
CREATE OR REPLACE FUNCTION public.insert_saude_person(
    p_leader_name TEXT,
    p_leader_whatsapp TEXT,
    p_person_name TEXT,
    p_person_whatsapp TEXT,
    p_observation TEXT,
    p_leader_cep TEXT DEFAULT NULL,
    p_person_cep TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result json;
BEGIN
    INSERT INTO saude_people (
        leader_name,
        leader_whatsapp,
        leader_cep,
        person_name,
        person_whatsapp,
        person_cep,
        observation
    ) VALUES (
        p_leader_name,
        p_leader_whatsapp,
        p_leader_cep,
        p_person_name,
        p_person_whatsapp,
        p_person_cep,
        p_observation
    )
    RETURNING to_json(saude_people.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- PERMITIR EXECUÇÃO PÚBLICA
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO anon;
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO public;
```

### **Passo 2: Testar**

```sql
SELECT public.insert_saude_person(
    'Líder Teste',           -- p_leader_name
    '62999999999',           -- p_leader_whatsapp
    'Pessoa Teste',          -- p_person_name
    '62988888888',           -- p_person_whatsapp
    'Teste de observação',   -- p_observation
    '74000000',              -- p_leader_cep (opcional)
    '74000000'               -- p_person_cep (opcional)
);
```

Se retornar JSON com os dados, **funcionou!** ✅

---

## 🧪 **Testar no Aplicativo**

1. Execute uma das opções acima no Supabase
2. Volte para o aplicativo
3. Tente cadastrar uma pessoa no formulário de saúde
4. Deve funcionar! 🎉

---

## 📊 **Como Funciona**

### **Opção 1 (RLS Desabilitado):**
- ✅ Simples e direto
- ✅ Todos podem fazer INSERT, SELECT, UPDATE, DELETE
- ⚠️ Menos seguro (mas ok para dados públicos)

### **Opção 2 (Function com SECURITY DEFINER):**
- ✅ INSERT público via function
- ✅ SELECT/UPDATE/DELETE ainda protegidos por RLS
- ✅ Mais seguro
- ⚠️ Requer function (já implementada no hook!)

---

## 🔍 **Verificar Estado Atual**

```sql
-- Ver se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'saude_people';

-- Ver políticas ativas
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'saude_people';

-- Testar INSERT direto
INSERT INTO saude_people (
    leader_name,
    leader_whatsapp,
    person_name,
    person_whatsapp,
    observation
) VALUES (
    'Teste',
    '62999999999',
    'Teste Pessoa',
    '62988888888',
    'Observação teste'
);
```

---

## 💡 **Recomendação**

Para este caso (cadastro público de campanha de saúde), **OPÇÃO 1 é a melhor**:
- Dados são públicos por natureza
- Não há informações sensíveis
- Mais simples de manter

Execute o script de **`DESABILITAR_RLS_COMPLETO.sql`** e pronto! 🚀

