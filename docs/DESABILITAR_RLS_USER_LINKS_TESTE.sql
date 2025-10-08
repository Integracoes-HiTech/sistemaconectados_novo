-- =====================================================
-- TESTE RÁPIDO: DESABILITAR RLS DE user_links
-- =====================================================
-- Execute APENAS para testar se o problema é RLS
-- Se funcionar, depois criamos políticas corretas!
-- =====================================================

-- Desabilitar RLS temporariamente
ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute este comando no Supabase SQL Editor
-- 2. Tente criar um link no sistema
-- 3. Se funcionar, o problema ERA o RLS!
-- 4. Volte aqui e me avise para criar políticas corretas
-- 
-- PARA REABILITAR DEPOIS:
-- ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;
-- =====================================================

-- Verificar se foi desabilitado
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_links';
-- Se rowsecurity = false, está desabilitado

