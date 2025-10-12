-- ========================================
-- ALTERAR link_id de UUID para TEXT
-- ========================================
-- PROBLEMA: VIEW active_links depende da coluna link_id
-- SOLUÇÃO: Remover VIEW → Alterar coluna → Recriar VIEW
-- ========================================
-- EXECUTE ESTE SCRIPT COMPLETO NO SUPABASE SQL EDITOR
-- ========================================

-- PASSO 1: Listar TODAS as VIEWs que dependem da coluna link_id
SELECT 
    viewname as view_name,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND (viewname LIKE '%link%' OR definition LIKE '%link_id%')
ORDER BY viewname;

-- PASSO 2: Remover TODAS as VIEWs relacionadas a user_links (CASCADE remove dependências)
DROP VIEW IF EXISTS active_links CASCADE;
DROP VIEW IF EXISTS v_active_user_links CASCADE;
DROP VIEW IF EXISTS expired_links CASCADE;
DROP VIEW IF EXISTS links_usage_summary CASCADE;

-- PASSO 3: Alterar a coluna link_id de UUID para TEXT
ALTER TABLE user_links 
ALTER COLUMN link_id TYPE TEXT;

-- PASSO 4: Recriar a VIEW active_links (definição original)
CREATE VIEW active_links AS
SELECT 
    ul.id,
    ul.link_id,
    ul.user_id,
    au.username,
    au.name,
    ul.referrer_name,
    ul.click_count,
    ul.registration_count,
    ul.created_at,
    ul.expires_at
FROM user_links ul
JOIN auth_users au ON ul.user_id = au.id
WHERE ul.is_active = true;

-- PASSO 5: Recriar a VIEW v_active_user_links (definição original)
CREATE OR REPLACE VIEW v_active_user_links AS
SELECT 
    link_id,
    user_id,
    is_active,
    click_count,
    created_at,
    updated_at
FROM user_links 
WHERE deleted_at IS NULL;

-- PASSO 6: Verificar se as VIEWs foram recriadas corretamente
SELECT * FROM active_links LIMIT 3;
SELECT * FROM v_active_user_links LIMIT 3;

-- PASSO 7: Verificar se a coluna foi alterada
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_links'
  AND column_name = 'link_id';

-- ========================================
-- RESULTADO ESPERADO:
-- column_name | data_type | character_maximum_length
-- link_id     | text      | NULL
-- ========================================

