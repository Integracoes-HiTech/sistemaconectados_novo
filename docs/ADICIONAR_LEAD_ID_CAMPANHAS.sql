-- =====================================================
-- ADICIONAR LEAD_ID COMO CHAVE ESTRANGEIRA NAS TABELAS DE CAMPANHAS
-- Sistema CONECTADOS - Vincular Campanhas aos Leads da Landing Page
-- Criado em: 2025-01-12
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA LEAD_ID NAS TABELAS
-- =====================================================

-- Adicionar lead_id na tabela auth_users
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES landing_leads(id) ON DELETE SET NULL;

-- Adicionar lead_id na tabela members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES landing_leads(id) ON DELETE SET NULL;

-- Adicionar lead_id na tabela friends
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES landing_leads(id) ON DELETE SET NULL;

-- Adicionar lead_id na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES landing_leads(id) ON DELETE SET NULL;

-- Adicionar lead_id na tabela user_links
ALTER TABLE user_links 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES landing_leads(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para busca rápida por lead_id
CREATE INDEX IF NOT EXISTS idx_auth_users_lead_id ON auth_users(lead_id);
CREATE INDEX IF NOT EXISTS idx_members_lead_id ON members(lead_id);
CREATE INDEX IF NOT EXISTS idx_friends_lead_id ON friends(lead_id);
CREATE INDEX IF NOT EXISTS idx_users_lead_id ON users(lead_id);
CREATE INDEX IF NOT EXISTS idx_user_links_lead_id ON user_links(lead_id);

-- Índices compostos para filtros combinados (campaign + lead_id)
CREATE INDEX IF NOT EXISTS idx_auth_users_campaign_lead ON auth_users(campaign, lead_id);
CREATE INDEX IF NOT EXISTS idx_members_campaign_lead ON members(campaign, lead_id);
CREATE INDEX IF NOT EXISTS idx_friends_campaign_lead ON friends(campaign, lead_id);
CREATE INDEX IF NOT EXISTS idx_users_campaign_lead ON users(campaign, lead_id);
CREATE INDEX IF NOT EXISTS idx_user_links_campaign_lead ON user_links(campaign, lead_id);

-- =====================================================
-- 3. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN auth_users.lead_id IS 'ID do lead da landing page que originou este usuário';
COMMENT ON COLUMN members.lead_id IS 'ID do lead da landing page que originou este membro';
COMMENT ON COLUMN friends.lead_id IS 'ID do lead da landing page que originou este amigo';
COMMENT ON COLUMN users.lead_id IS 'ID do lead da landing page que originou este usuário público';
COMMENT ON COLUMN user_links.lead_id IS 'ID do lead da landing page que originou este link';

-- =====================================================
-- 4. CRIAR FUNÇÃO PARA VINCULAR LEAD AO CRIAR USUÁRIO
-- =====================================================

-- Função para vincular automaticamente o lead_id ao criar um novo usuário a partir de um lead
CREATE OR REPLACE FUNCTION vincular_lead_ao_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Tentar vincular por WhatsApp (phone) primeiro
    IF NEW.phone IS NOT NULL THEN
        SELECT id INTO NEW.lead_id
        FROM landing_leads
        WHERE whatsapp = NEW.phone
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    -- Se não encontrou por phone e tem instagram, tentar por nome
    IF NEW.lead_id IS NULL AND NEW.name IS NOT NULL THEN
        SELECT id INTO NEW.lead_id
        FROM landing_leads
        WHERE nome_completo ILIKE '%' || NEW.name || '%'
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CRIAR TRIGGERS PARA VINCULAR AUTOMATICAMENTE
-- =====================================================

-- Trigger para auth_users
DROP TRIGGER IF EXISTS trigger_vincular_lead_auth_users ON auth_users;
CREATE TRIGGER trigger_vincular_lead_auth_users
    BEFORE INSERT ON auth_users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_lead_ao_usuario();

-- Trigger para members
DROP TRIGGER IF EXISTS trigger_vincular_lead_members ON members;
CREATE TRIGGER trigger_vincular_lead_members
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION vincular_lead_ao_usuario();

-- Trigger para friends
DROP TRIGGER IF EXISTS trigger_vincular_lead_friends ON friends;
CREATE TRIGGER trigger_vincular_lead_friends
    BEFORE INSERT ON friends
    FOR EACH ROW
    EXECUTE FUNCTION vincular_lead_ao_usuario();

-- Trigger para users
DROP TRIGGER IF EXISTS trigger_vincular_lead_users ON users;
CREATE TRIGGER trigger_vincular_lead_users
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_lead_ao_usuario();

-- =====================================================
-- 6. ATUALIZAR REGISTROS EXISTENTES (OPCIONAL)
-- =====================================================

-- Vincular auth_users existentes aos leads pelo WhatsApp (phone)
UPDATE auth_users au
SET lead_id = ll.id
FROM landing_leads ll
WHERE au.phone = ll.whatsapp
AND au.lead_id IS NULL;

-- Vincular members existentes aos leads pelo WhatsApp (phone)
UPDATE members m
SET lead_id = ll.id
FROM landing_leads ll
WHERE m.phone = ll.whatsapp
AND m.lead_id IS NULL;

-- Vincular friends existentes aos leads pelo WhatsApp (phone)
UPDATE friends f
SET lead_id = ll.id
FROM landing_leads ll
WHERE f.phone = ll.whatsapp
AND f.lead_id IS NULL;

-- Vincular users existentes aos leads pelo WhatsApp (phone)
UPDATE users u
SET lead_id = ll.id
FROM landing_leads ll
WHERE u.phone = ll.whatsapp
AND u.lead_id IS NULL;

-- =====================================================
-- 7. VERIFICAR IMPLEMENTAÇÃO
-- =====================================================

-- Verificar se as colunas foram adicionadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('auth_users', 'members', 'friends', 'users', 'user_links')
    AND column_name = 'lead_id'
ORDER BY table_name;

-- Verificar chaves estrangeiras criadas
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'lead_id'
ORDER BY tc.table_name;

-- Verificar índices criados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('auth_users', 'members', 'friends', 'users', 'user_links')
    AND indexdef LIKE '%lead_id%'
ORDER BY tablename, indexname;

-- Verificar quantos registros estão vinculados a leads
SELECT 
    'auth_users' as tabela,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_lead,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as sem_lead,
    COUNT(*) as total
FROM auth_users
UNION ALL
SELECT 
    'members' as tabela,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_lead,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as sem_lead,
    COUNT(*) as total
FROM members
UNION ALL
SELECT 
    'friends' as tabela,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_lead,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as sem_lead,
    COUNT(*) as total
FROM friends
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_lead,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as sem_lead,
    COUNT(*) as total
FROM users
UNION ALL
SELECT 
    'user_links' as tabela,
    COUNT(*) FILTER (WHERE lead_id IS NOT NULL) as com_lead,
    COUNT(*) FILTER (WHERE lead_id IS NULL) as sem_lead,
    COUNT(*) as total
FROM user_links
ORDER BY tabela;

-- =====================================================
-- 8. CONSULTAS ÚTEIS PARA ANÁLISE
-- =====================================================

-- Ver todos os usuários criados a partir de leads
SELECT 
    ll.nome_completo as lead_nome,
    ll.email as lead_email,
    ll.plano_escolhido,
    ll.status as lead_status,
    au.username,
    au.name as user_name,
    au.role,
    au.campaign,
    au.created_at as user_criado_em,
    ll.created_at as lead_criado_em
FROM auth_users au
INNER JOIN landing_leads ll ON au.lead_id = ll.id
ORDER BY ll.created_at DESC;

-- Ver leads que ainda não geraram usuários
SELECT 
    ll.nome_completo,
    ll.email,
    ll.whatsapp,
    ll.plano_escolhido,
    ll.status,
    ll.created_at
FROM landing_leads ll
WHERE NOT EXISTS (
    SELECT 1 FROM auth_users au WHERE au.lead_id = ll.id
)
ORDER BY ll.created_at DESC;

-- Ver estatísticas de conversão (leads → usuários)
SELECT 
    COUNT(DISTINCT ll.id) as total_leads,
    COUNT(DISTINCT au.id) as total_usuarios,
    ROUND(
        (COUNT(DISTINCT au.id)::NUMERIC / NULLIF(COUNT(DISTINCT ll.id), 0)) * 100,
        2
    ) as taxa_conversao_percent
FROM landing_leads ll
LEFT JOIN auth_users au ON au.lead_id = ll.id;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- O QUE FOI IMPLEMENTADO:
-- ✅ Coluna lead_id adicionada em todas as tabelas de campanhas
-- ✅ Chaves estrangeiras para landing_leads configuradas
-- ✅ Índices criados para performance
-- ✅ Função e triggers para vinculação automática
-- ✅ Atualização de registros existentes
-- ✅ Consultas para verificação e análise
-- 
-- BENEFÍCIOS:
-- 1. Rastreabilidade completa: de lead → usuário → ações
-- 2. Análise de conversão: quais leads se tornaram usuários ativos
-- 3. Integração com landing page: dados unificados
-- 4. Automação: vínculo automático ao criar novos usuários
-- 5. Performance: índices otimizados para consultas
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os resultados das queries de verificação
-- 3. Teste o cadastro de um novo lead na landing page
-- 4. Verifique se o usuário é criado com lead_id vinculado
-- 5. Analise as estatísticas de conversão
-- =====================================================

