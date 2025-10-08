-- ========================================
-- RLS PARA MAPA - VERSÃO SIMPLIFICADA
-- ========================================
-- Execute este SQL no Supabase SQL Editor

-- Passo 1: Deletar política antiga (se existir)
DROP POLICY IF EXISTS "public_read_members_campanha_b" ON members;

-- Passo 2: Criar nova política
CREATE POLICY "public_read_members_campanha_b"
ON members
FOR SELECT
TO anon
USING (status = 'Ativo' AND campaign = 'B');

-- Passo 3: Verificar se foi criada
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'members' 
  AND policyname = 'public_read_members_campanha_b';

-- ========================================
-- RESULTADO ESPERADO:
-- policyname                          | roles  | cmd
-- public_read_members_campanha_b     | {anon} | SELECT
-- ========================================

