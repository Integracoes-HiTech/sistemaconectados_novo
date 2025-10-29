-- =====================================================
-- MIGRAR LINK_ID BASEADO EM REFERRER_NAME
-- Atualiza link_id na tabela user_links baseado no referrer_name
-- =====================================================

-- Função auxiliar para gerar link_id baseado em referrer_name
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

-- Atualizar link_id baseado em referrer_name para registros que têm link_id no formato "user-{uuid}"
UPDATE user_links
SET link_id = generate_link_id_from_referrer_name(referrer_name)
WHERE link_id LIKE 'user-%'
AND referrer_name IS NOT NULL
AND referrer_name != '';

-- Garantir unicidade do link_id (caso haja conflitos, adicionar sufixo)
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

-- Verificar resultado
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

