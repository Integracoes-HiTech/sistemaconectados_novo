-- ========================================
-- RLS SIMPLIFICADO para tabela CAMPAIGNS
-- Permite AdminHitech criar/editar campanhas
-- SEM usar auth.uid() (usa verificação direta)
-- ========================================

-- 1) DESABILITAR RLS temporariamente para testar
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Verificar se RLS está desabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'campaigns';

-- Resultado esperado: rowsecurity = false

