-- =====================================================
-- IMPLEMENTAR SEPARAÇÃO POR CAMPANHAS A E B
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. ADICIONAR CAMPO CAMPAIGN NAS TABELAS PRINCIPAIS
-- =====================================================

-- Adicionar campo campaign na tabela auth_users
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'));

-- Adicionar campo campaign na tabela members
ALTER TABLE members ADD COLUMN IF NOT EXISTS campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'));

-- Adicionar campo campaign na tabela friends
ALTER TABLE friends ADD COLUMN IF NOT EXISTS campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'));

-- Adicionar campo campaign na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'));

-- Adicionar campo campaign na tabela user_links
ALTER TABLE user_links ADD COLUMN IF NOT EXISTS campaign VARCHAR(10) DEFAULT 'A' CHECK (campaign IN ('A', 'B'));

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para filtros por campanha
CREATE INDEX IF NOT EXISTS idx_auth_users_campaign ON auth_users(campaign);
CREATE INDEX IF NOT EXISTS idx_members_campaign ON members(campaign);
CREATE INDEX IF NOT EXISTS idx_friends_campaign ON friends(campaign);
CREATE INDEX IF NOT EXISTS idx_users_campaign ON users(campaign);
CREATE INDEX IF NOT EXISTS idx_user_links_campaign ON user_links(campaign);

-- Índices compostos para filtros combinados
CREATE INDEX IF NOT EXISTS idx_members_campaign_status ON members(campaign, status);
CREATE INDEX IF NOT EXISTS idx_friends_campaign_status ON friends(campaign, status);
CREATE INDEX IF NOT EXISTS idx_users_campaign_status ON users(campaign, status);

-- =====================================================
-- 3. ATUALIZAR DADOS EXISTENTES
-- =====================================================

-- Definir campanha A para todos os dados existentes
UPDATE auth_users SET campaign = 'A' WHERE campaign IS NULL;
UPDATE members SET campaign = 'A' WHERE campaign IS NULL;
UPDATE friends SET campaign = 'A' WHERE campaign IS NULL;
UPDATE users SET campaign = 'A' WHERE campaign IS NULL;
UPDATE user_links SET campaign = 'A' WHERE campaign IS NULL;

-- =====================================================
-- 4. ATUALIZAR USUÁRIOS EXISTENTES PARA CAMPANHA A
-- =====================================================

-- Garantir que usuários existentes tenham campanha A
UPDATE auth_users SET campaign = 'A' WHERE campaign IS NULL OR campaign = '';

-- =====================================================
-- 5. CRIAR USUÁRIOS PARA CAMPANHA B
-- =====================================================

-- Inserir usuários de exemplo para campanha B
INSERT INTO auth_users (username, password, name, role, full_name, campaign, instagram, phone, is_active) VALUES
-- Administrador campanha B
('admin_b', 'admin123', 'Admin Campanha B', 'Administrador', 'Admin Campanha B - Administrador', 'B', 'admin_b', '62911111111', true),

-- Membros campanha B
('joao_b', 'membro123', 'João Silva B', 'Membro', 'João Silva B - Membro', 'B', 'joaosilva_b', '62922222222', true),
('marcos_b', 'membro123', 'Marcos Santos B', 'Membro', 'Marcos Santos B - Membro', 'B', 'marcossantos_b', '62933333333', true),
('ana_b', 'membro123', 'Ana Costa B', 'Membro', 'Ana Costa B - Membro', 'B', 'anacosta_b', '62944444444', true),
('carlos_b', 'membro123', 'Carlos Oliveira B', 'Membro', 'Carlos Oliveira B - Membro', 'B', 'carlosoliveira_b', '62955555555', true),

-- Amigos campanha B
('pedro_b', 'amigo123', 'Pedro Lima B', 'Amigo', 'Pedro Lima B - Amigo', 'B', 'pedrolima_b', '62966666666', true),
('maria_b', 'amigo123', 'Maria Santos B', 'Amigo', 'Maria Santos B - Amigo', 'B', 'mariasantos_b', '62977777777', true);

-- =====================================================
-- 6. CRIAR POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_links ENABLE ROW LEVEL SECURITY;

-- Política para auth_users - usuários só veem sua própria campanha
CREATE POLICY "Users can only see their campaign" ON auth_users
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));

-- Política para members - usuários só veem membros de sua campanha
CREATE POLICY "Users can only see members from their campaign" ON members
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));

-- Política para friends - usuários só veem amigos de sua campanha
CREATE POLICY "Users can only see friends from their campaign" ON friends
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));

-- Política para users - usuários só veem usuários de sua campanha
CREATE POLICY "Users can only see users from their campaign" ON users
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));

-- Política para user_links - usuários só veem links de sua campanha
CREATE POLICY "Users can only see links from their campaign" ON user_links
    FOR ALL USING (campaign = current_setting('app.current_campaign', true));

-- =====================================================
-- 7. CRIAR FUNÇÃO PARA DEFINIR CAMPANHA ATUAL
-- =====================================================

-- Função para definir a campanha atual baseada no usuário logado
CREATE OR REPLACE FUNCTION set_current_campaign()
RETURNS void AS $$
DECLARE
    user_campaign VARCHAR(10);
BEGIN
    -- Buscar campanha do usuário logado
    SELECT campaign INTO user_campaign
    FROM auth_users
    WHERE username = current_setting('request.jwt.claims', true)::json->>'username';
    
    -- Definir campanha atual
    PERFORM set_config('app.current_campaign', user_campaign, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CRIAR TRIGGER PARA DEFINIR CAMPANHA AUTOMATICAMENTE
-- =====================================================

-- Trigger para definir campanha automaticamente ao fazer login
CREATE OR REPLACE FUNCTION trigger_set_campaign()
RETURNS trigger AS $$
BEGIN
    PERFORM set_current_campaign();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. VERIFICAR IMPLEMENTAÇÃO
-- =====================================================

-- Verificar se as colunas foram adicionadas
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links')
    AND column_name = 'campaign'
ORDER BY table_name;

-- Verificar usuários por campanha
SELECT 
    campaign,
    COUNT(*) as total_usuarios
FROM auth_users 
GROUP BY campaign
ORDER BY campaign;

-- Verificar dados por campanha
SELECT 
    'members' as tabela,
    campaign,
    COUNT(*) as total
FROM members 
GROUP BY campaign
UNION ALL
SELECT 
    'friends' as tabela,
    campaign,
    COUNT(*) as total
FROM friends 
GROUP BY campaign
UNION ALL
SELECT 
    'users' as tabela,
    campaign,
    COUNT(*) as total
FROM users 
GROUP BY campaign
ORDER BY tabela, campaign;

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN auth_users.campaign IS 'Campanha do usuário: A ou B';
COMMENT ON COLUMN members.campaign IS 'Campanha do membro: A ou B';
COMMENT ON COLUMN friends.campaign IS 'Campanha do amigo: A ou B';
COMMENT ON COLUMN users.campaign IS 'Campanha do usuário público: A ou B';
COMMENT ON COLUMN user_links.campaign IS 'Campanha do link: A ou B';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- HIERARQUIA DO SISTEMA:
-- Administradores → Membros → Amigos
-- 
-- CAMPANHAS:
-- - Campanha A: Usuários existentes
-- - Campanha B: Novos usuários criados
-- 
-- PRÓXIMOS PASSOS:
-- 1. Executar este script no Supabase
-- 2. Testar login com usuários de cada campanha
-- 3. Verificar isolamento de dados
-- 4. Configurar novos usuários conforme necessário
-- =====================================================
