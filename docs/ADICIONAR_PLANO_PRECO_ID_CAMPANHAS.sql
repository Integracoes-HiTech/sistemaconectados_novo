-- =====================================================
-- ADICIONAR PLANO_PRECO_ID NAS TABELAS DE CAMPANHAS
-- Sistema CONECTADOS - Vincular Campanhas aos Planos de Preços
-- Criado em: 2025-01-12
-- =====================================================

-- =====================================================
-- 1. ADICIONAR COLUNA PLANO_PRECO_ID NAS TABELAS
-- =====================================================

-- Adicionar plano_preco_id na tabela auth_users
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id) ON DELETE SET NULL;

-- Adicionar plano_preco_id na tabela members
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id) ON DELETE SET NULL;

-- Adicionar plano_preco_id na tabela friends
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id) ON DELETE SET NULL;

-- Adicionar plano_preco_id na tabela users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id) ON DELETE SET NULL;

-- Adicionar plano_preco_id na tabela user_links
ALTER TABLE user_links 
ADD COLUMN IF NOT EXISTS plano_preco_id UUID REFERENCES planos_precos(id) ON DELETE SET NULL;

-- =====================================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para busca rápida por plano_preco_id
CREATE INDEX IF NOT EXISTS idx_auth_users_plano_preco_id ON auth_users(plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_members_plano_preco_id ON members(plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_friends_plano_preco_id ON friends(plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_users_plano_preco_id ON users(plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_user_links_plano_preco_id ON user_links(plano_preco_id);

-- Índices compostos para filtros combinados (campaign + plano_preco_id)
CREATE INDEX IF NOT EXISTS idx_auth_users_campaign_plano ON auth_users(campaign, plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_members_campaign_plano ON members(campaign, plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_friends_campaign_plano ON friends(campaign, plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_users_campaign_plano ON users(campaign, plano_preco_id);
CREATE INDEX IF NOT EXISTS idx_user_links_campaign_plano ON user_links(campaign, plano_preco_id);

-- =====================================================
-- 3. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON COLUMN auth_users.plano_preco_id IS 'ID do plano de preço escolhido pelo lead que originou este usuário';
COMMENT ON COLUMN members.plano_preco_id IS 'ID do plano de preço da campanha deste membro';
COMMENT ON COLUMN friends.plano_preco_id IS 'ID do plano de preço da campanha deste amigo';
COMMENT ON COLUMN users.plano_preco_id IS 'ID do plano de preço da campanha deste usuário público';
COMMENT ON COLUMN user_links.plano_preco_id IS 'ID do plano de preço da campanha deste link';

-- =====================================================
-- 4. CRIAR FUNÇÃO PARA VINCULAR PLANO AO CRIAR USUÁRIO
-- =====================================================

-- Função para vincular automaticamente o plano_preco_id ao criar um novo usuário a partir de um lead
CREATE OR REPLACE FUNCTION vincular_plano_ao_usuario()
RETURNS TRIGGER AS $$
DECLARE
    lead_plano_id UUID;
BEGIN
    -- Tentar vincular por WhatsApp (phone) primeiro
    IF NEW.phone IS NOT NULL THEN
        SELECT plano_preco_id INTO lead_plano_id
        FROM landing_leads
        WHERE whatsapp = NEW.phone
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF lead_plano_id IS NOT NULL THEN
            NEW.plano_preco_id := lead_plano_id;
        END IF;
    END IF;
    
    -- Se não encontrou por phone e tem nome, tentar por nome
    IF NEW.plano_preco_id IS NULL AND NEW.name IS NOT NULL THEN
        SELECT plano_preco_id INTO lead_plano_id
        FROM landing_leads
        WHERE nome_completo ILIKE '%' || NEW.name || '%'
        AND plano_preco_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF lead_plano_id IS NOT NULL THEN
            NEW.plano_preco_id := lead_plano_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CRIAR TRIGGERS PARA VINCULAR AUTOMATICAMENTE
-- =====================================================

-- Trigger para auth_users
DROP TRIGGER IF EXISTS trigger_vincular_plano_auth_users ON auth_users;
CREATE TRIGGER trigger_vincular_plano_auth_users
    BEFORE INSERT ON auth_users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_plano_ao_usuario();

-- Trigger para members
DROP TRIGGER IF EXISTS trigger_vincular_plano_members ON members;
CREATE TRIGGER trigger_vincular_plano_members
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION vincular_plano_ao_usuario();

-- Trigger para friends
DROP TRIGGER IF EXISTS trigger_vincular_plano_friends ON friends;
CREATE TRIGGER trigger_vincular_plano_friends
    BEFORE INSERT ON friends
    FOR EACH ROW
    EXECUTE FUNCTION vincular_plano_ao_usuario();

-- Trigger para users
DROP TRIGGER IF EXISTS trigger_vincular_plano_users ON users;
CREATE TRIGGER trigger_vincular_plano_users
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION vincular_plano_ao_usuario();

-- =====================================================
-- 6. ATUALIZAR REGISTROS EXISTENTES (OPCIONAL)
-- =====================================================

-- Vincular auth_users existentes aos planos pelo WhatsApp
UPDATE auth_users au
SET plano_preco_id = ll.plano_preco_id
FROM landing_leads ll
WHERE au.phone = ll.whatsapp
AND ll.plano_preco_id IS NOT NULL
AND au.plano_preco_id IS NULL;

-- Vincular members existentes aos planos pelo WhatsApp
UPDATE members m
SET plano_preco_id = ll.plano_preco_id
FROM landing_leads ll
WHERE m.phone = ll.whatsapp
AND ll.plano_preco_id IS NOT NULL
AND m.plano_preco_id IS NULL;

-- Vincular friends existentes aos planos pelo WhatsApp
UPDATE friends f
SET plano_preco_id = ll.plano_preco_id
FROM landing_leads ll
WHERE f.phone = ll.whatsapp
AND ll.plano_preco_id IS NOT NULL
AND f.plano_preco_id IS NULL;

-- Vincular users existentes aos planos pelo WhatsApp
UPDATE users u
SET plano_preco_id = ll.plano_preco_id
FROM landing_leads ll
WHERE u.phone = ll.whatsapp
AND ll.plano_preco_id IS NOT NULL
AND u.plano_preco_id IS NULL;

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
    AND column_name = 'plano_preco_id'
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
    AND kcu.column_name = 'plano_preco_id'
ORDER BY tc.table_name;

-- Verificar índices criados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('auth_users', 'members', 'friends', 'users', 'user_links')
    AND indexdef LIKE '%plano_preco_id%'
ORDER BY tablename, indexname;

-- Verificar quantos registros estão vinculados a planos
SELECT 
    'auth_users' as tabela,
    COUNT(*) FILTER (WHERE plano_preco_id IS NOT NULL) as com_plano,
    COUNT(*) FILTER (WHERE plano_preco_id IS NULL) as sem_plano,
    COUNT(*) as total
FROM auth_users
UNION ALL
SELECT 
    'members' as tabela,
    COUNT(*) FILTER (WHERE plano_preco_id IS NOT NULL) as com_plano,
    COUNT(*) FILTER (WHERE plano_preco_id IS NULL) as sem_plano,
    COUNT(*) as total
FROM members
UNION ALL
SELECT 
    'friends' as tabela,
    COUNT(*) FILTER (WHERE plano_preco_id IS NOT NULL) as com_plano,
    COUNT(*) FILTER (WHERE plano_preco_id IS NULL) as sem_plano,
    COUNT(*) as total
FROM friends
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) FILTER (WHERE plano_preco_id IS NOT NULL) as com_plano,
    COUNT(*) FILTER (WHERE plano_preco_id IS NULL) as sem_plano,
    COUNT(*) as total
FROM users
UNION ALL
SELECT 
    'user_links' as tabela,
    COUNT(*) FILTER (WHERE plano_preco_id IS NOT NULL) as com_plano,
    COUNT(*) FILTER (WHERE plano_preco_id IS NULL) as sem_plano,
    COUNT(*) as total
FROM user_links
ORDER BY tabela;

-- =====================================================
-- 8. CONSULTAS ÚTEIS PARA ANÁLISE
-- =====================================================

-- Ver todos os usuários criados com seus planos
SELECT 
    au.username,
    au.name as user_name,
    au.role,
    au.campaign,
    pp.nome_plano,
    pp.amount,
    pp.recorrencia,
    ll.nome_completo as lead_origem,
    ll.email as lead_email,
    au.created_at as user_criado_em
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
LEFT JOIN landing_leads ll ON ll.whatsapp = au.phone
ORDER BY au.created_at DESC;

-- Ver distribuição de usuários por plano
SELECT 
    pp.nome_plano,
    pp.amount,
    COUNT(au.id) as total_usuarios
FROM planos_precos pp
LEFT JOIN auth_users au ON au.plano_preco_id = pp.id
GROUP BY pp.id, pp.nome_plano, pp.amount, pp.order_display
ORDER BY pp.order_display;

-- Ver receita potencial por plano
SELECT 
    pp.nome_plano,
    pp.amount,
    COUNT(au.id) as total_usuarios,
    pp.amount * COUNT(au.id) as receita_mensal_potencial
FROM planos_precos pp
LEFT JOIN auth_users au ON au.plano_preco_id = pp.id
WHERE pp.amount > 0
GROUP BY pp.id, pp.nome_plano, pp.amount, pp.order_display
ORDER BY receita_mensal_potencial DESC;

-- Ver usuários sem plano definido
SELECT 
    au.username,
    au.name,
    au.role,
    au.campaign,
    au.phone,
    au.created_at
FROM auth_users au
WHERE au.plano_preco_id IS NULL
ORDER BY au.created_at DESC;

-- Ver leads que geraram usuários e seus planos
SELECT 
    ll.nome_completo as lead_nome,
    ll.email,
    ll.whatsapp,
    ll.plano_escolhido as plano_texto,
    pp_lead.nome_plano as plano_banco,
    pp_lead.amount,
    au.username,
    au.name as user_name,
    au.role,
    pp_user.nome_plano as plano_vinculado
FROM landing_leads ll
LEFT JOIN planos_precos pp_lead ON ll.plano_preco_id = pp_lead.id
LEFT JOIN auth_users au ON au.phone = ll.whatsapp
LEFT JOIN planos_precos pp_user ON au.plano_preco_id = pp_user.id
WHERE au.id IS NOT NULL
ORDER BY ll.created_at DESC;

-- Ver campanhas por plano
SELECT 
    au.campaign,
    pp.nome_plano,
    COUNT(au.id) as total_usuarios,
    pp.amount,
    pp.amount * COUNT(au.id) as receita_potencial
FROM auth_users au
LEFT JOIN planos_precos pp ON au.plano_preco_id = pp.id
GROUP BY au.campaign, pp.nome_plano, pp.amount, pp.order_display
ORDER BY au.campaign, pp.order_display;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- O QUE FOI IMPLEMENTADO:
-- ✅ Coluna plano_preco_id adicionada em todas as tabelas de campanhas
-- ✅ Chaves estrangeiras para planos_precos configuradas
-- ✅ Índices criados para performance
-- ✅ Função e triggers para vinculação automática por WhatsApp
-- ✅ Atualização de registros existentes
-- ✅ Consultas para verificação e análise de receita
-- 
-- BENEFÍCIOS:
-- 1. Rastreabilidade: saber qual plano cada usuário/campanha possui
-- 2. Análise de receita: calcular receita potencial por plano
-- 3. Segmentação: filtrar usuários por plano contratado
-- 4. Automação: vínculo automático ao criar novos usuários
-- 5. Performance: índices otimizados para consultas
-- 6. Relatórios: gerar relatórios de distribuição de planos
-- 
-- FLUXO COMPLETO:
-- 1. Lead escolhe plano na landing page → landing_leads.plano_preco_id
-- 2. Lead paga → landing_payments (validação do valor pelo plano_preco_id)
-- 3. Sistema cria usuário → auth_users.plano_preco_id (vinculado automaticamente)
-- 4. Usuário usa o sistema com recursos do seu plano
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os resultados das queries de verificação
-- 3. Teste o cadastro de um novo lead com plano
-- 4. Verifique se o usuário é criado com plano_preco_id vinculado
-- 5. Analise a distribuição de usuários por plano
-- 6. Gere relatórios de receita potencial
-- =====================================================

