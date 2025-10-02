-- =====================================================
-- DROP DAS TABELAS members_saude E members_20
-- =====================================================

-- Remover views dependentes primeiro
DROP VIEW IF EXISTS v_members_saude_stats CASCADE;
DROP VIEW IF EXISTS v_members_20_stats CASCADE;

-- Remover políticas RLS se existirem
DROP POLICY IF EXISTS "Users can only see members from their campaign" ON members_saude;
DROP POLICY IF EXISTS "Users can insert members in their campaign" ON members_saude;
DROP POLICY IF EXISTS "Users can update members in their campaign" ON members_saude;
DROP POLICY IF EXISTS "Users can delete members in their campaign" ON members_saude;

DROP POLICY IF EXISTS "Users can only see members from their campaign" ON members_20;
DROP POLICY IF EXISTS "Users can insert members in their campaign" ON members_20;
DROP POLICY IF EXISTS "Users can update members in their campaign" ON members_20;
DROP POLICY IF EXISTS "Users can delete members in their campaign" ON members_20;

-- Desabilitar RLS se estiver habilitado
ALTER TABLE IF EXISTS members_saude DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS members_20 DISABLE ROW LEVEL SECURITY;

-- Remover as tabelas
DROP TABLE IF EXISTS members_saude CASCADE;
DROP TABLE IF EXISTS members_20 CASCADE;

-- Verificar se as tabelas foram removidas
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('members_saude', 'members_20');

-- Se não retornar nenhuma linha, as tabelas foram removidas com sucesso
