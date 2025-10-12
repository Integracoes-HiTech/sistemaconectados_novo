-- =====================================================
-- REMOVER TODOS OS TRIGGERS DA TABELA MEMBERS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Listar TODOS os triggers da tabela members
SELECT 
    trigger_name,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'members';

-- 2. Remover TODOS os triggers da tabela members
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
        RAISE NOTICE 'Trigger removido: %', r.trigger_name;
    END LOOP;
END $$;

-- 3. Verificar se todos foram removidos (deve retornar VAZIO)
SELECT 
    trigger_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'members';

-- Se retornar VAZIO = SUCESSO! ✅
-- Se retornar alguma linha = FALHA! Execute novamente

