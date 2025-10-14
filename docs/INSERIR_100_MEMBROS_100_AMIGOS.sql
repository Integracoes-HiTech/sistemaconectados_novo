-- ========================================
-- INSERIR 100 MEMBROS E 100 AMIGOS PARA TESTE
-- ========================================
-- Apenas nas tabelas members e friends
-- Total: 200 cadastros (limite do plano Essencial)
-- ========================================

-- ⚠️ CONFIGURAÇÃO: Substitua os valores abaixo
-- Código da campanha onde inserir os dados
-- Admin ID que será o referrer dos cadastros

-- 1. INSERIR 100 MEMBROS (50 DUPLAS)
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR
    v_admin_id TEXT := 'ID_DO_ADMIN_AQUI'; -- ⚠️ SUBSTITUIR
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
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
            gen_random_uuid()::TEXT,
            'Teste Membro ' || i || 'A',
            'teste_membro_' || i || 'a@teste.com',
            '6299' || LPAD(i::TEXT, 7, '0') || '1',
            '@teste_membro_' || i || 'a',
            '74000-000',
            'Goiânia',
            'Setor Central',
            'Teste Membro ' || i || 'B',
            '6299' || LPAD(i::TEXT, 7, '0') || '2',
            '@teste_membro_' || i || 'b',
            '74000-000',
            'Goiânia',
            'Setor Central',
            v_campaign_code,
            v_admin_id,
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ 100 membros (50 duplas) inseridos!';
END $$;

-- 2. INSERIR 100 AMIGOS (50 DUPLAS)
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR
    v_admin_id TEXT := 'ID_DO_ADMIN_AQUI'; -- ⚠️ SUBSTITUIR
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
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
            gen_random_uuid()::TEXT,
            'Teste Amigo ' || i || 'A',
            'teste_amigo_' || i || 'a@teste.com',
            '6298' || LPAD(i::TEXT, 7, '0') || '1',
            '@teste_amigo_' || i || 'a',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            'Teste Amigo ' || i || 'B',
            '6298' || LPAD(i::TEXT, 7, '0') || '2',
            '@teste_amigo_' || i || 'b',
            '74100-000',
            'Goiânia',
            'Setor Oeste',
            v_campaign_code,
            v_admin_id,
            NOW()
        );
    END LOOP;
    
    RAISE NOTICE '✅ 100 amigos (50 duplas) inseridos!';
END $$;

-- 3. VERIFICAR TOTAIS
SELECT 
    (SELECT COUNT(*) FROM members WHERE campaign = 'CODIGO_CAMPANHA_AQUI' AND name LIKE 'Teste Membro%') as total_membros,
    (SELECT COUNT(*) FROM friends WHERE campaign = 'CODIGO_CAMPANHA_AQUI' AND name LIKE 'Teste Amigo%') as total_amigos,
    (SELECT COUNT(*) FROM members WHERE campaign = 'CODIGO_CAMPANHA_AQUI' AND name LIKE 'Teste Membro%') +
    (SELECT COUNT(*) FROM friends WHERE campaign = 'CODIGO_CAMPANHA_AQUI' AND name LIKE 'Teste Amigo%') as total_cadastros;

-- ========================================
-- LIMPAR DADOS DE TESTE
-- ========================================

/*
DO $$
DECLARE
    v_campaign_code TEXT := 'CODIGO_CAMPANHA_AQUI'; -- ⚠️ SUBSTITUIR
    v_deleted_count INT;
BEGIN
    -- Deletar friends
    DELETE FROM friends 
    WHERE campaign = v_campaign_code 
      AND name LIKE 'Teste Amigo%';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ % amigos deletados', v_deleted_count;
    
    -- Deletar members
    DELETE FROM members 
    WHERE campaign = v_campaign_code 
      AND name LIKE 'Teste Membro%';
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ % membros deletados', v_deleted_count;
    
    RAISE NOTICE '🎉 Limpeza concluída!';
END $$;
*/
