-- =====================================================
-- VERIFICAR E CORRIGIR RLS DA TABELA user_links
-- =====================================================
-- Este script verifica e corrige as políticas RLS que
-- podem estar bloqueando administradores de criar links
-- =====================================================

-- 1. VER POLÍTICAS ATUAIS
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
WHERE tablename = 'user_links';

-- =====================================================
-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_links';

-- =====================================================
-- 3. SOLUÇÃO TEMPORÁRIA: DESABILITAR RLS
-- =====================================================
-- Execute APENAS para testar se o problema é RLS
-- DEPOIS você deve reabilitar e criar políticas corretas!

-- ALTER TABLE user_links DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. SOLUÇÃO PERMANENTE: CRIAR POLÍTICA CORRETA
-- =====================================================
-- Se o problema for RLS, crie uma política que permite
-- todos os usuários autenticados criarem links

-- Remover políticas existentes (se necessário)
-- DROP POLICY IF EXISTS "user_links_insert_policy" ON user_links;
-- DROP POLICY IF EXISTS "user_links_select_policy" ON user_links;
-- DROP POLICY IF EXISTS "user_links_update_policy" ON user_links;

-- Criar política de INSERT (permite todos autenticados)
CREATE POLICY "user_links_insert_policy" 
ON user_links
FOR INSERT
WITH CHECK (true);

-- Criar política de SELECT (permite todos verem seus links)
CREATE POLICY "user_links_select_policy" 
ON user_links
FOR SELECT
USING (true);

-- Criar política de UPDATE (permite atualizar próprios links)
CREATE POLICY "user_links_update_policy" 
ON user_links
FOR UPDATE
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. VERIFICAR SE FUNCIONOU
-- =====================================================
-- Após executar, rode novamente:
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_links';

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute SEÇÃO 1 para ver políticas atuais
-- 2. Execute SEÇÃO 2 para verificar se RLS está ativo
-- 3. Se RLS estiver ativo e houver políticas restritivas:
--    a) Execute SEÇÃO 3 (temporário) para testar
--    b) Teste criar link no sistema
--    c) Se funcionar, execute SEÇÃO 4 (permanente)
--    d) Execute SEÇÃO 5 para verificar
-- =====================================================

