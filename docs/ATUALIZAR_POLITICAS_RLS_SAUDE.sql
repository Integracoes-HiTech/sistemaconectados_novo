-- =====================================================
-- ATUALIZAR POLÍTICAS RLS PARA SAUDE_PEOPLE
-- =====================================================
-- Este script atualiza as políticas de segurança para permitir
-- cadastro público e acesso por admin3/AdminHitech

-- Remover políticas antigas
DROP POLICY IF EXISTS "Saude people are viewable by admin3 and AdminHitech" ON saude_people;
DROP POLICY IF EXISTS "Saude people are modifiable by admin3 and AdminHitech" ON saude_people;

-- =====================================================
-- NOVA POLÍTICA: Permitir INSERT público (cadastro)
-- =====================================================
CREATE POLICY "Allow public insert on saude_people" ON saude_people
    FOR INSERT 
    WITH CHECK (true);

-- =====================================================
-- POLÍTICA: SELECT por admin3 e AdminHitech
-- =====================================================
CREATE POLICY "Saude people are viewable by admin3 and AdminHitech" ON saude_people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

-- =====================================================
-- POLÍTICA: UPDATE/DELETE por admin3 e AdminHitech
-- =====================================================
CREATE POLICY "Saude people are modifiable by admin3 and AdminHitech" ON saude_people
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

CREATE POLICY "Saude people can be deleted by admin3 and AdminHitech" ON saude_people
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

-- =====================================================
-- VERIFICAR POLÍTICAS ATIVAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'saude_people'
ORDER BY policyname;

