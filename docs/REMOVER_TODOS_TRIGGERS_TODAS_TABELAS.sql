-- =====================================================
-- REMOVER TODOS OS TRIGGERS DE TODAS AS TABELAS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Listar TODOS os triggers nas tabelas principais
SELECT 
    event_object_table as tabela,
    trigger_name,
    action_timing as quando,
    event_manipulation as acao
FROM information_schema.triggers 
WHERE event_object_table IN ('members', 'users', 'friends', 'auth_users', 'campaigns', 'user_links')
ORDER BY event_object_table, trigger_name;

-- 2. Remover TODOS os triggers de MEMBERS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'members'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON members CASCADE';
        RAISE NOTICE 'Trigger removido de members: %', r.trigger_name;
    END LOOP;
END $$;

-- 3. Remover TODOS os triggers de USERS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON users CASCADE';
        RAISE NOTICE 'Trigger removido de users: %', r.trigger_name;
    END LOOP;
END $$;

-- 4. Remover TODOS os triggers de FRIENDS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'friends'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON friends CASCADE';
        RAISE NOTICE 'Trigger removido de friends: %', r.trigger_name;
    END LOOP;
END $$;

-- 5. Remover TODOS os triggers de AUTH_USERS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'auth_users'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON auth_users CASCADE';
        RAISE NOTICE 'Trigger removido de auth_users: %', r.trigger_name;
    END LOOP;
END $$;

-- 6. Remover TODOS os triggers de CAMPAIGNS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'campaigns'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON campaigns CASCADE';
        RAISE NOTICE 'Trigger removido de campaigns: %', r.trigger_name;
    END LOOP;
END $$;

-- 7. Remover TODOS os triggers de USER_LINKS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name
        FROM information_schema.triggers 
        WHERE event_object_table = 'user_links'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON user_links CASCADE';
        RAISE NOTICE 'Trigger removido de user_links: %', r.trigger_name;
    END LOOP;
END $$;

-- 8. Verificação FINAL - deve retornar VAZIO
SELECT 
    event_object_table as tabela,
    trigger_name,
    action_timing,
    event_manipulation as acao
FROM information_schema.triggers 
WHERE event_object_table IN ('members', 'users', 'friends', 'auth_users', 'campaigns', 'user_links')
ORDER BY event_object_table, trigger_name;

-- ✅ Se retornar VAZIO = SUCESSO TOTAL!
-- ❌ Se retornar alguma linha = Execute novamente

-- 9. Também remover TODAS as funções relacionadas
DROP FUNCTION IF EXISTS vincular_plano_ao_usuario() CASCADE;
DROP FUNCTION IF EXISTS get_plano_by_lead() CASCADE;
DROP FUNCTION IF EXISTS sync_plano_preco() CASCADE;
DROP FUNCTION IF EXISTS atualizar_plano_preco() CASCADE;
DROP FUNCTION IF EXISTS verificar_plano_preco() CASCADE;

-- Verificar se as funções foram removidas (deve retornar VAZIO)
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%plano%' OR routine_name LIKE '%preco%';

