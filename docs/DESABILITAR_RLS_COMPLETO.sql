-- =====================================================
-- DESABILITAR RLS COMPLETAMENTE PARA SAUDE_PEOPLE
-- =====================================================
-- Execute este script no Supabase SQL Editor

-- 1. REMOVER TODAS AS POLÍTICAS
DROP POLICY IF EXISTS "saude_public_insert" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_select" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_update" ON saude_people;
DROP POLICY IF EXISTS "saude_admin_delete" ON saude_people;
DROP POLICY IF EXISTS "Allow public insert on saude_people" ON saude_people;
DROP POLICY IF EXISTS "Saude people are viewable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people are modifiable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people can be deleted by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "allow_public_insert" ON saude_people;
DROP POLICY IF EXISTS "allow_admin_select" ON saude_people;
DROP POLICY IF EXISTS "allow_admin_update" ON saude_people;
DROP POLICY IF EXISTS "allow_admin_delete" ON saude_people;

-- 2. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE saude_people DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICAR
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS ATIVADO ❌' 
        ELSE 'RLS DESATIVADO ✅' 
    END as status
FROM pg_tables 
WHERE tablename = 'saude_people';

-- 4. VERIFICAR POLÍTICAS (não deve ter nenhuma)
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'saude_people';

