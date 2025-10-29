-- =====================================================
-- ADICIONAR CAMPAIGN_ID NA TABELA PEOPLE COM FOREIGN KEY
-- Sistema CONECTADOS
-- =====================================================

-- 1. Adicionar coluna campaign_id (UUID, nullable inicialmente)
ALTER TABLE people 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 2. Migrar dados existentes: atualizar campaign_id baseado no campo campaign (texto)
-- Primeiro, atualizar usando o código da campanha
UPDATE people p
SET campaign_id = c.id
FROM campaigns c
WHERE p.campaign = c.code
AND p.campaign_id IS NULL
AND p.campaign IS NOT NULL;

-- 3. Adicionar constraint de foreign key
ALTER TABLE people
ADD CONSTRAINT fk_people_campaign_id
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE SET NULL;

-- 4. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_people_campaign_id ON people(campaign_id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as total_people,
    COUNT(campaign_id) as people_with_campaign_id,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as people_sem_migrar
FROM people;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'people'
AND column_name IN ('campaign_id', 'campaign')
ORDER BY ordinal_position;

-- Verificar resultado da migração por campanha
SELECT 
    p.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_people,
    COUNT(CASE WHEN p.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN p.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM people p
LEFT JOIN campaigns c ON p.campaign = c.code
GROUP BY p.campaign, c.name
ORDER BY p.campaign;

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
AND tc.table_name = 'people'
AND kcu.column_name = 'campaign_id';

-- Listar pessoas que não foram migradas (campanha não encontrada)
SELECT 
    id,
    lider_nome_completo,
    pessoa_nome_completo,
    campaign AS codigo_campanha,
    campaign_id
FROM people
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

-- Verificar se todas as campanhas no campo campaign existem na tabela campaigns
SELECT DISTINCT 
    p.campaign AS codigo_campanha_people,
    CASE 
        WHEN c.id IS NOT NULL THEN 'Campanha encontrada'
        ELSE 'Campanha NÃO encontrada na tabela campaigns'
    END AS status
FROM people p
LEFT JOIN campaigns c ON p.campaign = c.code
WHERE p.campaign IS NOT NULL
ORDER BY p.campaign;

