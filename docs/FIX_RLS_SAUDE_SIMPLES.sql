-- =====================================================
-- CORRIGIR RLS PARA PERMITIR CADASTRO PÚBLICO
-- =====================================================
-- Execute este script no SQL Editor do Supabase

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Allow public insert on saude_people" ON saude_people;
DROP POLICY IF EXISTS "Saude people are viewable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people are modifiable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people can be deleted by admin3 and AdminHitech" ON saude_people;

-- 2. CRIAR POLÍTICA PARA PERMITIR INSERT PÚBLICO (SEM AUTENTICAÇÃO)
CREATE POLICY "allow_public_insert" 
ON saude_people 
FOR INSERT 
TO public
WITH CHECK (true);

-- 3. CRIAR POLÍTICA PARA SELECT (somente admin3 e AdminHitech)
CREATE POLICY "allow_admin_select" 
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

-- 4. CRIAR POLÍTICA PARA UPDATE (somente admin3 e AdminHitech)
CREATE POLICY "allow_admin_update" 
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

-- 5. CRIAR POLÍTICA PARA DELETE (somente admin3 e AdminHitech)
CREATE POLICY "allow_admin_delete" 
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

-- 6. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'saude_people';

