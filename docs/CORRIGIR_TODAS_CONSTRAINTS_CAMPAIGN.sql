-- =====================================================
-- CORRIGIR CONSTRAINTS DE CAMPANHA EM TODAS AS TABELAS
-- =====================================================
-- PROBLEMA: Constraints só aceitam 'A' ou 'B', mas 
--           novas campanhas têm outros códigos ('C', 'SAUDE', etc)
-- =====================================================

-- 1. VERIFICAR CONSTRAINTS EXISTENTES
-- =====================================================
SELECT 
  t.relname AS table_name,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname LIKE '%campaign%'
  AND t.relname IN ('auth_users', 'members', 'friends', 'user_links', 'users')
ORDER BY t.relname;

-- =====================================================
-- 2. REMOVER CONSTRAINTS RESTRITIVAS
-- =====================================================

-- Tabela: auth_users
ALTER TABLE auth_users 
DROP CONSTRAINT IF EXISTS auth_users_campaign_check;

-- Tabela: members
ALTER TABLE members 
DROP CONSTRAINT IF EXISTS members_campaign_check;

-- Tabela: friends
ALTER TABLE friends 
DROP CONSTRAINT IF EXISTS friends_campaign_check;

-- Tabela: user_links (já removida antes, mas garantindo)
ALTER TABLE user_links 
DROP CONSTRAINT IF EXISTS user_links_campaign_check;

-- Tabela: users
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_campaign_check;

-- =====================================================
-- 3. CRIAR CONSTRAINTS GENÉRICAS (OPCIONAL)
-- =====================================================
-- Se quiser manter alguma validação, crie constraints
-- genéricas que aceitam qualquer valor não-nulo

-- auth_users
ALTER TABLE auth_users
ADD CONSTRAINT auth_users_campaign_check 
CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- members
ALTER TABLE members
ADD CONSTRAINT members_campaign_check 
CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- friends
ALTER TABLE friends
ADD CONSTRAINT friends_campaign_check 
CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- user_links
ALTER TABLE user_links
ADD CONSTRAINT user_links_campaign_check 
CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- users
ALTER TABLE users
ADD CONSTRAINT users_campaign_check 
CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- =====================================================
-- 4. VERIFICAR SE FUNCIONOU
-- =====================================================
SELECT 
  t.relname AS table_name,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE c.conname LIKE '%campaign%'
  AND t.relname IN ('auth_users', 'members', 'friends', 'user_links', 'users')
ORDER BY t.relname;

-- Deve mostrar as novas constraints genéricas ✅

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute SEÇÃO 1 para ver as constraints atuais
-- 2. Execute SEÇÃO 2 para remover constraints restritivas
-- 3. Execute SEÇÃO 3 para criar constraints genéricas
-- 4. Execute SEÇÃO 4 para verificar
-- 5. Teste criar usuário com a nova campanha
-- =====================================================

-- =====================================================
-- ALTERNATIVA RÁPIDA (SEM VALIDAÇÃO)
-- =====================================================
-- Se preferir REMOVER completamente sem criar novas:
-- 
-- ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_campaign_check;
-- ALTER TABLE members DROP CONSTRAINT IF EXISTS members_campaign_check;
-- ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_campaign_check;
-- ALTER TABLE user_links DROP CONSTRAINT IF EXISTS user_links_campaign_check;
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_campaign_check;
-- 
-- (Não cria novas constraints, aceita qualquer valor)
-- =====================================================

