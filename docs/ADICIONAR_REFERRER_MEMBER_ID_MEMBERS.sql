-- =====================================================
-- ADICIONAR REFERRER_MEMBER_ID NA TABELA MEMBERS (FOREIGN KEY AUTO-REFERENCIAL)
-- Sistema CONECTADOS
-- =====================================================
-- Este script adiciona uma foreign key que referencia o próprio membro que é o referrer
-- baseado no campo referrer (nome) já existente

-- 1. Adicionar coluna referrer_member_id (UUID, nullable inicialmente)
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS referrer_member_id UUID;

-- 2. Função auxiliar para normalizar nome (remover sufixos como "- Membro", "- Amigo", etc.)
CREATE OR REPLACE FUNCTION normalize_referrer_name(full_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remover sufixos como "- Membro", "- Amigo", "- Administrador", etc.
    RETURN TRIM(REGEXP_REPLACE(full_name, '\s*-\s*(Membro|Amigo|Administrador|Admin|AdminHitech).*$', '', 'i'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Migrar dados existentes: encontrar o ID do membro referrer baseado no nome
-- Primeiro tentar match exato
UPDATE members m1
SET referrer_member_id = m2.id
FROM members m2
WHERE m1.referrer = m2.name
AND m1.referrer_member_id IS NULL
AND m1.referrer IS NOT NULL
AND m1.referrer != ''
AND m2.deleted_at IS NULL;

-- Depois tentar match normalizado (sem sufixos)
UPDATE members m1
SET referrer_member_id = m2.id
FROM members m2
WHERE m1.referrer_member_id IS NULL
AND m1.referrer IS NOT NULL
AND m1.referrer != ''
AND normalize_referrer_name(m1.referrer) = normalize_referrer_name(m2.name)
AND m2.deleted_at IS NULL
AND m2.id != m1.id; -- Evitar auto-referência

-- 4. Tentar match case-insensitive se ainda não encontrou
UPDATE members m1
SET referrer_member_id = m2.id
FROM members m2
WHERE m1.referrer_member_id IS NULL
AND m1.referrer IS NOT NULL
AND m1.referrer != ''
AND LOWER(normalize_referrer_name(m1.referrer)) = LOWER(normalize_referrer_name(m2.name))
AND m2.deleted_at IS NULL
AND m2.id != m1.id; -- Evitar auto-referência

-- 5. Adicionar constraint de foreign key auto-referencial
ALTER TABLE members
ADD CONSTRAINT fk_members_referrer_member_id
FOREIGN KEY (referrer_member_id)
REFERENCES members(id)
ON DELETE SET NULL;

-- 6. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_members_referrer_member_id ON members(referrer_member_id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as total_members,
    COUNT(referrer_member_id) as members_with_referrer_id,
    COUNT(CASE WHEN referrer_member_id IS NULL AND referrer IS NOT NULL AND referrer != '' THEN 1 END) as members_sem_referrer_id,
    COUNT(CASE WHEN referrer IS NULL OR referrer = '' THEN 1 END) as members_sem_referrer
FROM members
WHERE deleted_at IS NULL;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'members'
AND column_name IN ('referrer_member_id', 'referrer')
ORDER BY ordinal_position;

-- Verificar resultado da migração: mostrar alguns exemplos
SELECT 
    m1.id,
    m1.name as membro_nome,
    m1.referrer as referrer_nome_original,
    m1.referrer_member_id,
    m2.name as referrer_encontrado
FROM members m1
LEFT JOIN members m2 ON m1.referrer_member_id = m2.id
WHERE m1.deleted_at IS NULL
ORDER BY m1.created_at DESC
LIMIT 20;

-- Verificar membros que não conseguiram encontrar o referrer
SELECT 
    id,
    name as membro_nome,
    referrer as referrer_nome_original,
    normalize_referrer_name(referrer) as referrer_normalizado
FROM members
WHERE referrer IS NOT NULL 
AND referrer != ''
AND referrer_member_id IS NULL
AND deleted_at IS NULL
ORDER BY referrer;

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
AND kcu.column_name = 'referrer_member_id';

-- Estatísticas de referrers
SELECT 
    m2.name as referrer_nome,
    COUNT(*) as total_membros_indicados
FROM members m1
JOIN members m2 ON m1.referrer_member_id = m2.id
WHERE m1.deleted_at IS NULL
AND m2.deleted_at IS NULL
GROUP BY m2.id, m2.name
ORDER BY total_membros_indicados DESC
LIMIT 20;

-- Verificar se há referrers que não existem na tabela members
SELECT DISTINCT
    m1.referrer as referrer_nao_encontrado,
    COUNT(*) as total_ocorrencias
FROM members m1
WHERE m1.referrer IS NOT NULL
AND m1.referrer != ''
AND m1.referrer_member_id IS NULL
AND m1.deleted_at IS NULL
GROUP BY m1.referrer
ORDER BY total_ocorrencias DESC;

