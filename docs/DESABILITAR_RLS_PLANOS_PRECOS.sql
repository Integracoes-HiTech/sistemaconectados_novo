-- ========================================
-- DESABILITAR RLS NA TABELA PLANOS_PRECOS
-- ========================================
-- Permite que AdminHitech possa criar/editar planos sem restrições

-- 1. Desabilitar RLS temporariamente (ou criar política permissiva)
ALTER TABLE planos_precos DISABLE ROW LEVEL SECURITY;

-- OU se preferir manter RLS ativo, criar política permissiva:
-- DROP POLICY IF EXISTS "allow_all_planos" ON planos_precos;
-- CREATE POLICY "allow_all_planos" ON planos_precos FOR ALL USING (true) WITH CHECK (true);

-- 2. Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'planos_precos';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ RLS desabilitado ou política permissiva criada
-- ✅ AdminHitech pode criar/editar planos

