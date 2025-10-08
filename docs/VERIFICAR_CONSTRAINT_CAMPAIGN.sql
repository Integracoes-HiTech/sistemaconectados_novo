-- ========================================
-- VERIFICAR E CORRIGIR CONSTRAINT DO CAMPO CAMPAIGN
-- ========================================

-- 1) Verificar constraints atuais na tabela auth_users
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'auth_users'::regclass
AND contype = 'c';  -- c = check constraint

-- 2) REMOVER constraint antiga (se existir)
ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_campaign_check;

-- 3) CRIAR nova constraint SEM limitação de valores
-- Permite qualquer código de campanha (A, B, SAUDE, MKTD, etc.)
ALTER TABLE auth_users 
  ADD CONSTRAINT auth_users_campaign_check 
  CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- OU simplesmente remover a constraint completamente:
-- ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_campaign_check;

-- 4) VERIFICAR se foi aplicado
SELECT conname, contype, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'auth_users'::regclass
AND contype = 'c';

