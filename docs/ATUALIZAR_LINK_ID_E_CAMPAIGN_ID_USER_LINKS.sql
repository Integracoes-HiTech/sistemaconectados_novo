-- =====================================================
-- ATUALIZAR LINK_ID BASEADO EM REFERRER_NAME E ADICIONAR CAMPAIGN_ID
-- Sistema CONECTADOS
-- =====================================================

-- 1. Adicionar coluna campaign_id (UUID, nullable inicialmente)
ALTER TABLE user_links 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 2. Migrar dados existentes: atualizar campaign_id baseado no campo campaign (texto/código)
-- Primeiro, atualizar usando o código da campanha
UPDATE user_links ul
SET campaign_id = c.id
FROM campaigns c
WHERE ul.campaign = c.code
AND ul.campaign_id IS NULL
AND ul.campaign IS NOT NULL;

-- 3. Adicionar constraint de foreign key
ALTER TABLE user_links
ADD CONSTRAINT fk_user_links_campaign_id
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE SET NULL;

-- 4. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_user_links_campaign_id ON user_links(campaign_id);

-- 5. Função auxiliar para gerar link_id baseado em referrer_name
-- Remove espaços, caracteres especiais, acentos e converte para minúsculo
CREATE OR REPLACE FUNCTION generate_link_id_from_referrer_name(referrer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    clean_name TEXT;
BEGIN
    -- Converter para minúsculo
    clean_name := LOWER(referrer_name);
    
    -- Remover acentos (simplificado)
    clean_name := TRANSLATE(clean_name, 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC');
    
    -- Remover espaços e caracteres especiais, manter apenas letras, números e hífen
    clean_name := regexp_replace(clean_name, '[^a-z0-9-]', '', 'g');
    
    -- Remover hífens consecutivos
    clean_name := regexp_replace(clean_name, '-+', '-', 'g');
    
    -- Remover hífen no início e fim
    clean_name := trim(both '-' from clean_name);
    
    -- Adicionar prefixo "link-" para evitar conflitos
    clean_name := 'link-' || clean_name;
    
    -- Limitar tamanho (link_id pode ter limite)
    IF LENGTH(clean_name) > 100 THEN
        clean_name := LEFT(clean_name, 100);
    END IF;
    
    RETURN clean_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Atualizar link_id baseado em referrer_name para registros que têm link_id no formato "user-{uuid}"
-- Gerar novo link_id baseado no referrer_name
UPDATE user_links
SET link_id = generate_link_id_from_referrer_name(referrer_name)
WHERE link_id LIKE 'user-%'
AND referrer_name IS NOT NULL
AND referrer_name != '';

-- 7. Garantir unicidade do link_id (caso haja conflitos, adicionar sufixo)
-- Primeiro, identificar duplicatas
DO $$
DECLARE
    rec RECORD;
    new_link_id TEXT;
    counter INTEGER;
BEGIN
    FOR rec IN 
        SELECT id, link_id, referrer_name
        FROM user_links
        WHERE link_id IN (
            SELECT link_id
            FROM user_links
            GROUP BY link_id
            HAVING COUNT(*) > 1
        )
    LOOP
        counter := 0;
        
        -- Tentar adicionar sufixo numérico até encontrar um link_id único
        LOOP
            new_link_id := rec.link_id || CASE WHEN counter > 0 THEN '-' || counter::TEXT ELSE '' END;
            
            -- Verificar se o link_id já existe (excluindo o registro atual)
            IF NOT EXISTS (
                SELECT 1 FROM user_links 
                WHERE link_id = new_link_id 
                AND id != rec.id
            ) THEN
                -- Atualizar com novo link_id único
                UPDATE user_links
                SET link_id = new_link_id
                WHERE id = rec.id;
                EXIT; -- Sair do loop quando encontrar link_id único
            END IF;
            
            counter := counter + 1;
            
            -- Limite de segurança para evitar loop infinito
            IF counter > 1000 THEN
                RAISE NOTICE 'Não foi possível gerar link_id único para registro %', rec.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados (campaign_id)
SELECT 
    COUNT(*) as total_user_links,
    COUNT(campaign_id) as user_links_with_campaign_id,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as user_links_sem_migrar
FROM user_links;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_links'
AND column_name IN ('campaign_id', 'campaign', 'link_id', 'referrer_name')
ORDER BY ordinal_position;

-- Verificar resultado da migração por campanha
SELECT 
    ul.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_user_links,
    COUNT(CASE WHEN ul.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN ul.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM user_links ul
LEFT JOIN campaigns c ON ul.campaign = c.code
GROUP BY ul.campaign, c.name
ORDER BY ul.campaign;

-- Verificar constraint de foreign key
SELECT
    tc.constraint_name,
    tc.table_name AS foreign_table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_links'
AND kcu.column_name = 'campaign_id';

-- Verificar link_id atualizados
SELECT 
    id,
    user_id,
    link_id,
    referrer_name,
    campaign,
    campaign_id,
    is_active,
    created_at
FROM user_links
ORDER BY updated_at DESC
LIMIT 20;

-- Verificar se há link_id duplicados (não deve haver)
SELECT 
    link_id,
    COUNT(*) as ocorrencias
FROM user_links
GROUP BY link_id
HAVING COUNT(*) > 1
ORDER BY ocorrencias DESC;

-- Listar user_links que não foram migrados (campanha não encontrada)
SELECT 
    id,
    user_id,
    link_id,
    referrer_name,
    campaign AS codigo_campanha,
    campaign_id
FROM user_links
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    ul.campaign AS codigo_campanha_user_links,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM user_links ul
LEFT JOIN campaigns c ON ul.campaign = c.code
WHERE ul.campaign IS NOT NULL
ORDER BY ul.campaign;

-- Limpar função auxiliar (opcional - pode manter se quiser usar no futuro)
-- DROP FUNCTION IF EXISTS generate_link_id_from_referrer_name(TEXT);

