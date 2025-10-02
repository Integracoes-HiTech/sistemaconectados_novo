-- =====================================================
-- CORRIGIR POLÍTICAS RLS PARA TABELA USER_LINKS
-- =====================================================

-- Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can only see links from their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can see their campaign links and normal links" ON user_links;
DROP POLICY IF EXISTS "Users can insert links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can update links in their campaign" ON user_links;
DROP POLICY IF EXISTS "Users can delete links in their campaign" ON user_links;

-- Criar políticas mais permissivas para administradores
CREATE POLICY "Allow all operations for authenticated users" ON user_links
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_links';

-- Verificar se RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_links';
