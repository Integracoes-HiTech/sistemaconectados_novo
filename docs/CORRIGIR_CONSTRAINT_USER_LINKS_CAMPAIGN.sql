-- =====================================================
-- CORRIGIR CONSTRAINT DE CAMPANHA NA TABELA user_links
-- =====================================================
-- ERRO: "new row for relation "user_links" violates 
--        check constraint "user_links_campaign_check"
-- 
-- CAUSA: A constraint só aceita 'A' ou 'B', mas a 
--        campanha criada é 'C' (ou outra)
-- =====================================================

-- SOLUÇÃO 1: REMOVER A CONSTRAINT (RECOMENDADO)
-- Permite qualquer valor de campanha
ALTER TABLE user_links 
DROP CONSTRAINT IF EXISTS user_links_campaign_check;

-- =====================================================
-- SOLUÇÃO 2: ATUALIZAR A CONSTRAINT (ALTERNATIVA)
-- =====================================================
-- Se preferir manter a constraint, atualize para aceitar
-- todas as campanhas existentes

-- Primeiro, remover a constraint antiga
-- ALTER TABLE user_links 
-- DROP CONSTRAINT IF EXISTS user_links_campaign_check;

-- Depois, criar nova constraint que aceita qualquer campanha
-- (ou liste todas as campanhas que existem)
-- ALTER TABLE user_links
-- ADD CONSTRAINT user_links_campaign_check 
-- CHECK (campaign IS NOT NULL AND length(campaign) > 0);

-- OU liste todas as campanhas específicas:
-- ALTER TABLE user_links
-- ADD CONSTRAINT user_links_campaign_check 
-- CHECK (campaign IN ('A', 'B', 'C', 'saude', 'SAUDE'));

-- =====================================================
-- VERIFICAR SE FOI REMOVIDA
-- =====================================================
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'user_links'::regclass 
  AND conname LIKE '%campaign%';

-- Se não retornar nada, a constraint foi removida ✅

-- =====================================================
-- INSTRUÇÕES:
-- =====================================================
-- 1. Execute a SOLUÇÃO 1 (remover constraint)
-- 2. Verifique com a última query
-- 3. Tente criar o link novamente
-- 4. Deve funcionar! ✅
-- =====================================================

