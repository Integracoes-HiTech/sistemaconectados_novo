-- ========================================
-- RLS para tabela CAMPAIGNS
-- Permite AdminHitech criar/editar campanhas
-- ========================================

-- 1) Habilitar RLS na tabela campaigns (se não estiver habilitado)
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- 2) REMOVER políticas antigas se existirem
DROP POLICY IF EXISTS "adminhitech_insert_campaigns" ON campaigns;
DROP POLICY IF EXISTS "adminhitech_update_campaigns" ON campaigns;
DROP POLICY IF EXISTS "adminhitech_select_campaigns" ON campaigns;
DROP POLICY IF EXISTS "public_select_campaigns" ON campaigns;

-- 3) CRIAR política para INSERIR campanhas (apenas AdminHitech)
CREATE POLICY "adminhitech_insert_campaigns" ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (
        auth_users.role = 'AdminHitech' 
        OR auth_users.username = 'adminhitech'
      )
    )
  );

-- 4) CRIAR política para ATUALIZAR campanhas (apenas AdminHitech)
CREATE POLICY "adminhitech_update_campaigns" ON campaigns
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (
        auth_users.role = 'AdminHitech' 
        OR auth_users.username = 'adminhitech'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth_users
      WHERE auth_users.id = auth.uid()
      AND (
        auth_users.role = 'AdminHitech' 
        OR auth_users.username = 'adminhitech'
      )
    )
  );

-- 5) CRIAR política para VISUALIZAR campanhas (todos autenticados)
CREATE POLICY "adminhitech_select_campaigns" ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

-- 6) CRIAR política para VISUALIZAR campanhas (público - para login)
CREATE POLICY "public_select_campaigns" ON campaigns
  FOR SELECT
  TO anon
  USING (is_active = true);

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Listar políticas da tabela campaigns
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'campaigns';

