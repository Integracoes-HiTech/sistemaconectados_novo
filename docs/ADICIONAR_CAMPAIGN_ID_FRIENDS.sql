-- =====================================================
-- ADICIONAR CAMPAIGN_ID NA TABELA FRIENDS
-- Sistema CONECTADOS
-- =====================================================

-- 1. Adicionar coluna campaign_id (UUID, nullable inicialmente)
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 2. Migrar dados existentes: atualizar campaign_id baseado no campo campaign (texto)
-- Atualizar usando o código da campanha
UPDATE friends f
SET campaign_id = c.id
FROM campaigns c
WHERE f.campaign = c.code
AND f.campaign_id IS NULL;

-- 3. Adicionar constraint de foreign key
ALTER TABLE friends
ADD CONSTRAINT fk_friends_campaign_id
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE SET NULL;

-- 4. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_friends_campaign_id ON friends(campaign_id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as total_friends,
    COUNT(campaign_id) as friends_with_campaign_id,
    COUNT(CASE WHEN campaign_id IS NULL AND campaign IS NOT NULL THEN 1 END) as friends_sem_migrar
FROM friends;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'friends'
AND column_name IN ('campaign_id', 'campaign')
ORDER BY ordinal_position;

-- Verificar resultado da migração por campanha
SELECT 
    f.campaign AS codigo_campanha,
    c.name AS nome_campanha,
    COUNT(*) AS total_friends,
    COUNT(CASE WHEN f.campaign_id IS NOT NULL THEN 1 END) AS com_campaign_id,
    COUNT(CASE WHEN f.campaign_id IS NULL THEN 1 END) AS sem_campaign_id
FROM friends f
LEFT JOIN campaigns c ON f.campaign = c.code
GROUP BY f.campaign, c.name
ORDER BY f.campaign;

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
AND tc.table_name = 'friends'
AND kcu.column_name = 'campaign_id';

-- Listar friends que não foram migrados (campanha não encontrada)
SELECT 
    id,
    name,
    campaign AS codigo_campanha,
    campaign_id
FROM friends
WHERE campaign IS NOT NULL 
AND campaign_id IS NULL
ORDER BY campaign;

