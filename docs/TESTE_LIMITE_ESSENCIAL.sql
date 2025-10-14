-- ========================================
-- SCRIPT PARA TESTAR LIMITE DO PLANO ESSENCIAL
-- ========================================
-- Insere 100 membros (50 duplas) e 100 amigos (50 duplas)
-- Para testar o limite de 200 registros do plano Essencial
-- ========================================

-- 1. BUSCAR INFORMAÇÕES DA CAMPANHA ESSENCIAL
SELECT 
    code as campanha_code,
    nome_plano,
    plano_id
FROM campaigns 
WHERE LOWER(nome_plano) LIKE '%essencial%'
LIMIT 1;

-- ⚠️ IMPORTANTE: Anote o 'code' da campanha acima e substitua 'CODIGO_CAMPANHA_AQUI' abaixo

-- 2. CRIAR USUÁRIO ADMINISTRADOR DE TESTE (se não existir)
DO $$
DECLARE
    v_user_id TEXT;
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR pelo código da campanha
BEGIN
    -- Verificar se já existe
    SELECT id INTO v_user_id FROM auth_users WHERE username = 'admin_essencial_teste';
    
    IF v_user_id IS NULL THEN
        -- Criar usuário admin de teste
        INSERT INTO auth_users (
            id,
            username,
            password_hash,
            full_name,
            email,
            phone,
            role,
            campaign,
            is_active,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            'admin_essencial_teste',
            '$2a$10$xGHNKSLQhqPZXqN8vJqY0.rqP0pqPZXqN8vJqY0rqP0pqPZXqN8vJq', -- senha: teste123
            'Admin Essencial Teste',
            'admin_essencial@teste.com',
            '62999999999',
            'Administrador',
            v_campaign_code,
            true,
            NOW()
        ) RETURNING id INTO v_user_id;
        
        RAISE NOTICE '✅ Usuário admin_essencial_teste criado com sucesso!';
    ELSE
        RAISE NOTICE '✅ Usuário admin_essencial_teste já existe!';
    END IF;
END $$;

-- 3. INSERIR 100 MEMBROS (50 DUPLAS)
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR pelo código da campanha
    v_admin_id TEXT;
    v_member_id TEXT;
    v_couple_id TEXT;
    i INT;
BEGIN
    -- Buscar ID do admin
    SELECT id INTO v_admin_id FROM auth_users WHERE username = 'admin_essencial_teste';
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado! Execute o passo 2 primeiro.';
    END IF;
    
    -- Inserir 50 duplas de membros (100 membros no total)
    FOR i IN 1..50 LOOP
        -- Membro 1 da dupla
        INSERT INTO auth_users (
            id,
            username,
            password_hash,
            full_name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            role,
            campaign,
            referrer_id,
            is_active,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            'membro_ess_' || i || 'a',
            '$2a$10$xGHNKSLQhqPZXqN8vJqY0.rqP0pqPZXqN8vJqY0rqP0pqPZXqN8vJq',
            'Membro Essencial ' || i || 'A',
            'membro_ess_' || i || 'a@teste.com',
            '6299' || LPAD(i::TEXT, 7, '0') || '1',
            '@membro_ess_' || i || 'a',
            '74000-000',
            'Goiânia',
            'Setor Central',
            'Membro',
            v_campaign_code,
            v_admin_id,
            true,
            NOW()
        ) RETURNING id INTO v_member_id;
        
        -- Membro 2 da dupla (parceiro)
        INSERT INTO auth_users (
            id,
            username,
            password_hash,
            full_name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            role,
            campaign,
            referrer_id,
            couple_id,
            is_active,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            'membro_ess_' || i || 'b',
            '$2a$10$xGHNKSLQhqPZXqN8vJqY0.rqP0pqPZXqN8vJqY0rqP0pqPZXqN8vJq',
            'Membro Essencial ' || i || 'B',
            'membro_ess_' || i || 'b@teste.com',
            '6299' || LPAD(i::TEXT, 7, '0') || '2',
            '@membro_ess_' || i || 'b',
            '74000-000',
            'Goiânia',
            'Setor Central',
            'Membro',
            v_campaign_code,
            v_admin_id,
            v_member_id, -- Vincular ao parceiro
            true,
            NOW()
        ) RETURNING id INTO v_couple_id;
        
        -- Atualizar couple_id do primeiro membro
        UPDATE auth_users SET couple_id = v_couple_id WHERE id = v_member_id;
        
        -- Inserir na tabela members
        INSERT INTO members (
            user_id,
            name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            couple_name,
            couple_phone,
            couple_instagram,
            couple_cep,
            couple_city,
            couple_sector,
            campaign,
            referrer_id,
            created_at
        ) VALUES (
            v_member_id,
            'Membro Essencial ' || i || 'A',
            'membro_ess_' || i || 'a@teste.com',
            '6299' || LPAD(i::TEXT, 7, '0') || '1',
            '@membro_ess_' || i || 'a',
            '74000-000',
            'Goiânia',
            'Setor Central',
            'Membro Essencial ' || i || 'B',
            '6299' || LPAD(i::TEXT, 7, '0') || '2',
            '@membro_ess_' || i || 'b',
            '74000-000',
            'Goiânia',
            'Setor Central',
            v_campaign_code,
            v_admin_id,
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ 100 membros (50 duplas) inseridos com sucesso!';
END $$;

-- 4. INSERIR 100 AMIGOS (50 DUPLAS)
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR pelo código da campanha
    v_admin_id TEXT;
    v_friend_id TEXT;
    v_couple_friend_id TEXT;
    i INT;
BEGIN
    -- Buscar ID do admin
    SELECT id INTO v_admin_id FROM auth_users WHERE username = 'admin_essencial_teste';
    
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado! Execute o passo 2 primeiro.';
    END IF;
    
    -- Inserir 50 duplas de amigos (100 amigos no total)
    FOR i IN 1..50 LOOP
        -- Amigo 1 da dupla
        INSERT INTO auth_users (
            id,
            username,
            password_hash,
            full_name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            role,
            campaign,
            referrer_id,
            is_active,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            'amigo_ess_' || i || 'a',
            '$2a$10$xGHNKSLQhqPZXqN8vJqY0.rqP0pqPZXqN8vJqY0rqP0pqPZXqN8vJq',
            'Amigo Essencial ' || i || 'A',
            'amigo_ess_' || i || 'a@teste.com',
            '6298' || LPAD(i::TEXT, 7, '0') || '1',
            '@amigo_ess_' || i || 'a',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            'Amigo',
            v_campaign_code,
            v_admin_id,
            true,
            NOW()
        ) RETURNING id INTO v_friend_id;
        
        -- Amigo 2 da dupla (parceiro)
        INSERT INTO auth_users (
            id,
            username,
            password_hash,
            full_name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            role,
            campaign,
            referrer_id,
            couple_id,
            is_active,
            created_at
        ) VALUES (
            gen_random_uuid()::TEXT,
            'amigo_ess_' || i || 'b',
            '$2a$10$xGHNKSLQhqPZXqN8vJqY0.rqP0pqPZXqN8vJqY0rqP0pqPZXqN8vJq',
            'Amigo Essencial ' || i || 'B',
            'amigo_ess_' || i || 'b@teste.com',
            '6298' || LPAD(i::TEXT, 7, '0') || '2',
            '@amigo_ess_' || i || 'b',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            'Amigo',
            v_campaign_code,
            v_admin_id,
            v_friend_id, -- Vincular ao parceiro
            true,
            NOW()
        ) RETURNING id INTO v_couple_friend_id;
        
        -- Atualizar couple_id do primeiro amigo
        UPDATE auth_users SET couple_id = v_couple_friend_id WHERE id = v_friend_id;
        
        -- Inserir na tabela friends
        INSERT INTO friends (
            user_id,
            name,
            email,
            phone,
            instagram,
            cep,
            city,
            sector,
            couple_name,
            couple_phone,
            couple_instagram,
            couple_cep,
            couple_city,
            couple_sector,
            campaign,
            referrer_id,
            created_at
        ) VALUES (
            v_friend_id,
            'Amigo Essencial ' || i || 'A',
            'amigo_ess_' || i || 'a@teste.com',
            '6298' || LPAD(i::TEXT, 7, '0') || '1',
            '@amigo_ess_' || i || 'a',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            'Amigo Essencial ' || i || 'B',
            '6298' || LPAD(i::TEXT, 7, '0') || '2',
            '@amigo_ess_' || i || 'b',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            v_campaign_code,
            v_admin_id,
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ 100 amigos (50 duplas) inseridos com sucesso!';
END $$;

-- 5. VERIFICAR TOTAIS
SELECT 
    '📊 RESUMO DOS DADOS INSERIDOS' as info;

SELECT 
    'CODIGO_CAMPANHA_AQUI' as campanha, -- ⚠️ SUBSTITUIR
    COUNT(*) FILTER (WHERE role = 'Membro') as total_membros,
    COUNT(*) FILTER (WHERE role = 'Amigo') as total_amigos,
    COUNT(*) FILTER (WHERE role IN ('Membro', 'Amigo')) as total_cadastros
FROM auth_users
WHERE campaign = 'CODIGO_CAMPANHA_AQUI' -- ⚠️ SUBSTITUIR
  AND username LIKE '%_ess_%';

-- 6. VERIFICAR LIMITE DO PLANO
SELECT 
    c.code as campanha,
    c.nome_plano,
    COUNT(DISTINCT au.id) as total_usuarios,
    CASE 
        WHEN LOWER(c.nome_plano) LIKE '%essencial%' THEN 200
        ELSE 0
    END as limite_plano,
    CASE 
        WHEN COUNT(DISTINCT au.id) >= 200 THEN '🔴 LIMITE ATINGIDO'
        WHEN COUNT(DISTINCT au.id) >= 180 THEN '🟡 PRÓXIMO DO LIMITE'
        ELSE '🟢 DENTRO DO LIMITE'
    END as status
FROM campaigns c
LEFT JOIN auth_users au ON au.campaign = c.code AND au.username LIKE '%_ess_%'
WHERE c.code = 'CODIGO_CAMPANHA_AQUI' -- ⚠️ SUBSTITUIR
GROUP BY c.code, c.nome_plano;

-- ========================================
-- SCRIPT PARA LIMPAR OS DADOS DE TESTE
-- ========================================
-- Execute este script DEPOIS de testar para remover os dados

/*
-- LIMPAR DADOS DE TESTE
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR
    v_deleted_count INT;
BEGIN
    -- Deletar da tabela friends
    DELETE FROM friends 
    WHERE campaign = v_campaign_code 
      AND (name LIKE 'Amigo Essencial%' OR user_id IN (
          SELECT id FROM auth_users WHERE username LIKE 'amigo_ess_%'
      ));
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ % registros deletados da tabela friends', v_deleted_count;
    
    -- Deletar da tabela members
    DELETE FROM members 
    WHERE campaign = v_campaign_code 
      AND (name LIKE 'Membro Essencial%' OR user_id IN (
          SELECT id FROM auth_users WHERE username LIKE 'membro_ess_%'
      ));
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ % registros deletados da tabela members', v_deleted_count;
    
    -- Deletar da tabela auth_users (membros e amigos)
    DELETE FROM auth_users 
    WHERE campaign = v_campaign_code 
      AND (username LIKE 'membro_ess_%' OR username LIKE 'amigo_ess_%');
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ % usuários deletados (membros + amigos)', v_deleted_count;
    
    -- Deletar admin de teste
    DELETE FROM auth_users WHERE username = 'admin_essencial_teste';
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Admin de teste deletado: %', v_deleted_count;
    
    RAISE NOTICE '🎉 Limpeza concluída!';
END $$;
*/

