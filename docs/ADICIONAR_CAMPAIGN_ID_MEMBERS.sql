-- =====================================================
-- ADICIONAR CAMPAIGN_ID E CAMPO DE REFERÊNCIA NA TABELA MEMBERS
-- Sistema CONECTADOS
-- =====================================================

-- 1. Adicionar coluna campaign_id (UUID, nullable inicialmente)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 2. Adicionar coluna reference (TEXT, nullable)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS reference TEXT;

-- 3. Migrar dados existentes: atualizar campaign_id baseado no campo campaign (texto)
-- Primeiro, atualizar usando o código da campanha
UPDATE members m
SET campaign_id = c.id
FROM campaigns c
WHERE m.campaign = c.code
AND m.campaign_id IS NULL;

-- 4. Adicionar constraint de foreign key
ALTER TABLE members
ADD CONSTRAINT fk_members_campaign_id
FOREIGN KEY (campaign_id)
REFERENCES campaigns(id)
ON DELETE SET NULL;

-- 5. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_members_campaign_id ON members(campaign_id);

-- 6. Adicionar índice para o campo reference (se precisar buscar por referência)
CREATE INDEX IF NOT EXISTS idx_members_reference ON members(reference);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as total_members,
    COUNT(campaign_id) as members_with_campaign_id,
    COUNT(reference) as members_with_reference
FROM members;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN ('campaign_id', 'reference', 'campaign')
ORDER BY ordinal_position;

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
AND tc.table_name = 'members'
AND kcu.column_name = 'campaign_id';

