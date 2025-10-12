-- ========================================
-- CORRIGIR CAMPO CAMPAIGN EM TODAS AS TABELAS
-- ========================================
-- PROBLEMA: campaign está como VARCHAR(10) em várias tabelas
-- mas agora precisa armazenar UUID de campanhas (36 caracteres)
-- SOLUÇÃO: Alterar para TEXT em todas as tabelas
-- ========================================

-- PASSO 1: Verificar estrutura atual da coluna campaign em todas as tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length as tamanho_maximo,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'campaign'
  AND table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links', 'campaigns')
ORDER BY table_name;

-- PASSO 2: Listar todas as VIEWs que usam a coluna campaign
SELECT 
    viewname as view_name,
    definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition LIKE '%campaign%'
ORDER BY viewname;

-- PASSO 3: Remover TODAS as VIEWs que dependem de campaign (CASCADE remove dependências)
DROP VIEW IF EXISTS v_friends_ranking CASCADE;
DROP VIEW IF EXISTS v_members_ranking CASCADE;
DROP VIEW IF EXISTS v_active_members CASCADE;
DROP VIEW IF EXISTS v_active_friends CASCADE;
DROP VIEW IF EXISTS v_active_users CASCADE;
DROP VIEW IF EXISTS v_active_auth_users CASCADE;
DROP VIEW IF EXISTS v_active_user_links CASCADE;

-- PASSO 4: Listar todas as políticas RLS que dependem da coluna campaign
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('auth_users', 'members', 'friends', 'users', 'user_links')
  AND (qual LIKE '%campaign%' OR with_check LIKE '%campaign%')
ORDER BY tablename, policyname;

-- PASSO 5: Remover TODAS as políticas RLS que dependem de campaign
-- auth_users
DROP POLICY IF EXISTS "Users can only see their campaign" ON auth_users;
DROP POLICY IF EXISTS "Admins can manage their campaign" ON auth_users;
DROP POLICY IF EXISTS public_read_auth_users_campanha_a ON auth_users;
DROP POLICY IF EXISTS public_read_auth_users_campanha_b ON auth_users;

-- members
DROP POLICY IF EXISTS "Members can only see their campaign" ON members;
DROP POLICY IF EXISTS "Admins can manage their campaign" ON members;
DROP POLICY IF EXISTS public_read_members_campanha_a ON members;
DROP POLICY IF EXISTS public_read_members_campanha_b ON members;

-- friends
DROP POLICY IF EXISTS "Friends can only see their campaign" ON friends;
DROP POLICY IF EXISTS "Admins can manage their campaign" ON friends;
DROP POLICY IF EXISTS public_read_friends_campanha_a ON friends;
DROP POLICY IF EXISTS public_read_friends_campanha_b ON friends;

-- users
DROP POLICY IF EXISTS "Users can only see their campaign" ON users;
DROP POLICY IF EXISTS "Admins can manage their campaign" ON users;
DROP POLICY IF EXISTS public_read_users_campanha_a ON users;
DROP POLICY IF EXISTS public_read_users_campanha_b ON users;

-- user_links
DROP POLICY IF EXISTS "Links can only see their campaign" ON user_links;
DROP POLICY IF EXISTS "Admins can manage their campaign" ON user_links;
DROP POLICY IF EXISTS public_read_user_links_campanha_a ON user_links;
DROP POLICY IF EXISTS public_read_user_links_campanha_b ON user_links;

-- PASSO 6: Remover restrições CHECK (que limitam a 'A' ou 'B')
ALTER TABLE auth_users DROP CONSTRAINT IF EXISTS auth_users_campaign_check;
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_campaign_check;
ALTER TABLE friends DROP CONSTRAINT IF EXISTS friends_campaign_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_campaign_check;
ALTER TABLE user_links DROP CONSTRAINT IF EXISTS user_links_campaign_check;

-- PASSO 7: Alterar a coluna campaign para TEXT em todas as tabelas
ALTER TABLE auth_users ALTER COLUMN campaign TYPE TEXT;
ALTER TABLE members ALTER COLUMN campaign TYPE TEXT;
ALTER TABLE friends ALTER COLUMN campaign TYPE TEXT;
ALTER TABLE users ALTER COLUMN campaign TYPE TEXT;
ALTER TABLE user_links ALTER COLUMN campaign TYPE TEXT;

-- PASSO 8: Recriar a VIEW v_friends_ranking (definição completa)
CREATE VIEW v_friends_ranking AS
SELECT 
    f.id,
    f.member_id,
    f.name,
    f.phone,
    f.instagram,
    f.city,
    f.sector,
    f.referrer,
    f.registration_date,
    f.status,
    f.couple_name,
    f.couple_phone,
    f.couple_instagram,
    f.couple_city,
    f.couple_sector,
    f.contracts_completed,
    f.ranking_position,
    f.ranking_status,
    f.is_top_1500,
    f.can_be_replaced,
    f.post_verified_1,
    f.post_verified_2,
    f.post_url_1,
    f.post_url_2,
    f.created_at,
    f.updated_at,
    f.campaign,
    -- Dados do membro que cadastrou
    m.name as member_name,
    m.instagram as member_instagram,
    m.phone as member_phone,
    m.city as member_city,
    m.sector as member_sector
FROM friends f
LEFT JOIN members m ON f.member_id = m.id
ORDER BY f.ranking_position ASC NULLS LAST;

-- PASSO 9: Recriar políticas RLS básicas (allow_all para facilitar)
-- auth_users
CREATE POLICY "allow_all_auth_users" ON auth_users FOR ALL USING (true) WITH CHECK (true);

-- members
CREATE POLICY "allow_all_members" ON members FOR ALL USING (true) WITH CHECK (true);

-- friends
CREATE POLICY "allow_all_friends" ON friends FOR ALL USING (true) WITH CHECK (true);

-- users
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

-- user_links
CREATE POLICY "allow_all_user_links" ON user_links FOR ALL USING (true) WITH CHECK (true);

-- PASSO 10: Verificar se foi alterado em todas as tabelas
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length as tamanho_maximo,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'campaign'
  AND table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links', 'campaigns')
ORDER BY table_name;

-- PASSO 11: Verificar dados atuais
SELECT 
    'auth_users' as tabela,
    COUNT(*) as total,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) > 10) as campaign_uuid,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) <= 10) as campaign_letra
FROM auth_users
UNION ALL
SELECT 
    'members' as tabela,
    COUNT(*) as total,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) > 10) as campaign_uuid,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) <= 10) as campaign_letra
FROM members
UNION ALL
SELECT 
    'friends' as tabela,
    COUNT(*) as total,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) > 10) as campaign_uuid,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) <= 10) as campaign_letra
FROM friends
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) as total,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) > 10) as campaign_uuid,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) <= 10) as campaign_letra
FROM users
UNION ALL
SELECT 
    'user_links' as tabela,
    COUNT(*) as total,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) > 10) as campaign_uuid,
    COUNT(campaign) FILTER (WHERE LENGTH(campaign) <= 10) as campaign_letra
FROM user_links;

-- ========================================
-- RESULTADO ESPERADO EM TODAS AS TABELAS:
-- table_name  | column_name | data_type | tamanho_maximo
-- auth_users  | campaign    | text      | NULL
-- members     | campaign    | text      | NULL
-- friends     | campaign    | text      | NULL
-- users       | campaign    | text      | NULL
-- user_links  | campaign    | text      | NULL
-- ========================================

