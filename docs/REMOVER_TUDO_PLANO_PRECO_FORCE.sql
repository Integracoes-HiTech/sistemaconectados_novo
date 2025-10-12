-- =====================================================
-- REMOVER FORÇADAMENTE TUDO RELACIONADO A PLANO_PRECO_ID
-- Execute este script COMPLETO no Supabase SQL Editor
-- ATENÇÃO: Este script força a remoção mesmo com dependências
-- =====================================================

-- PASSO 1: Desabilitar temporariamente verificações de chave estrangeira
SET session_replication_role = 'replica';

-- PASSO 2: Remover TODOS os triggers (mesmo que não existam)
DO $$ 
BEGIN
    -- Auth Users
    DROP TRIGGER IF EXISTS trigger_vincular_plano_auth_users ON auth_users CASCADE;
    
    -- Members
    DROP TRIGGER IF EXISTS trigger_vincular_plano_members ON members CASCADE;
    
    -- Friends
    DROP TRIGGER IF EXISTS trigger_vincular_plano_friends ON friends CASCADE;
    
    -- Users
    DROP TRIGGER IF EXISTS trigger_vincular_plano_users ON users CASCADE;
    
    -- User Links
    DROP TRIGGER IF EXISTS trigger_vincular_plano_user_links ON user_links CASCADE;
    
    -- Campaigns
    DROP TRIGGER IF EXISTS trigger_vincular_plano_campaigns ON campaigns CASCADE;
    
    RAISE NOTICE 'Triggers removidos com sucesso';
END $$;

-- PASSO 3: Remover TODAS as funções relacionadas
DO $$
BEGIN
    DROP FUNCTION IF EXISTS vincular_plano_ao_usuario() CASCADE;
    DROP FUNCTION IF EXISTS get_plano_by_lead() CASCADE;
    DROP FUNCTION IF EXISTS sync_plano_preco() CASCADE;
    
    RAISE NOTICE 'Funções removidas com sucesso';
END $$;

-- PASSO 4: Remover TODOS os índices
DO $$
BEGIN
    DROP INDEX IF EXISTS idx_auth_users_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_members_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_friends_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_users_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_user_links_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_campaigns_plano_preco_id CASCADE;
    DROP INDEX IF EXISTS idx_auth_users_campaign_plano CASCADE;
    DROP INDEX IF EXISTS idx_members_campaign_plano CASCADE;
    DROP INDEX IF EXISTS idx_friends_campaign_plano CASCADE;
    DROP INDEX IF EXISTS idx_users_campaign_plano CASCADE;
    DROP INDEX IF EXISTS idx_user_links_campaign_plano CASCADE;
    DROP INDEX IF EXISTS idx_campaigns_code_plano CASCADE;
    
    RAISE NOTICE 'Índices removidos com sucesso';
END $$;

-- PASSO 5: Remover as colunas plano_preco_id de TODAS as tabelas
DO $$
BEGIN
    -- Auth Users
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_users' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE auth_users DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de auth_users';
    END IF;
    
    -- Members
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'members' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE members DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de members';
    END IF;
    
    -- Friends
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'friends' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE friends DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de friends';
    END IF;
    
    -- Users
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE users DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de users';
    END IF;
    
    -- User Links
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_links' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE user_links DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de user_links';
    END IF;
    
    -- Campaigns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'plano_preco_id'
    ) THEN
        ALTER TABLE campaigns DROP COLUMN plano_preco_id CASCADE;
        RAISE NOTICE 'Coluna plano_preco_id removida de campaigns';
    END IF;
END $$;

-- PASSO 6: Reabilitar verificações de chave estrangeira
SET session_replication_role = 'origin';

-- PASSO 7: Verificação final - NÃO deve retornar NENHUMA linha
SELECT 'TRIGGERS:' as tipo, trigger_name as nome, event_object_table as tabela
FROM information_schema.triggers 
WHERE trigger_name LIKE '%plano%'
UNION ALL
SELECT 'FUNÇÕES:', routine_name, routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%plano%'
UNION ALL
SELECT 'ÍNDICES:', indexname, tablename
FROM pg_indexes
WHERE indexname LIKE '%plano%'
UNION ALL
SELECT 'COLUNAS:', column_name, table_name
FROM information_schema.columns 
WHERE column_name = 'plano_preco_id';

-- Se retornar VAZIO = SUCESSO! ✅
-- Se retornar alguma linha = FALHA! ❌

