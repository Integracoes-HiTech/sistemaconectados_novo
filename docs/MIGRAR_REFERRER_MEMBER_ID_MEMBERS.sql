-- =====================================================
-- MIGRAR REFERRER_MEMBER_ID BASEADO NO NOME DO REFERRER
-- Atualiza referrer_member_id na tabela members baseado no campo referrer (nome)
-- =====================================================
-- IMPORTANTE: Execute primeiro o script ADICIONAR_REFERRER_MEMBER_ID_MEMBERS.sql

-- Função auxiliar para normalizar nome (remover sufixos)
CREATE OR REPLACE FUNCTION normalize_referrer_name(full_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remover sufixos como "- Membro", "- Amigo", "- Administrador", etc.
    RETURN TRIM(REGEXP_REPLACE(full_name, '\s*-\s*(Membro|Amigo|Administrador|Admin|AdminHitech).*$', '', 'i'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verificar quantos registros precisam ser migrados
SELECT 
    COUNT(*) as total_members,
    COUNT(CASE WHEN referrer_member_id IS NULL AND referrer IS NOT NULL AND referrer != '' THEN 1 END) as members_para_migrar,
    COUNT(CASE WHEN referrer_member_id IS NOT NULL THEN 1 END) as members_ja_migrados
FROM members
WHERE deleted_at IS NULL;

-- Primeiro tentar match exato
UPDATE members m1
SET referrer_member_id = m2.id
FROM members m2
WHERE m1.referrer = m2.name
AND m1.referrer_member_id IS NULL
AND m1.referrer IS NOT NULL
AND m1.referrer != ''
AND m2.deleted_at IS NULL
AND m2.id != m1.id;

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

-- Tentar match case-insensitive se ainda não encontrou
UPDATE members m1
SET referrer_member_id = m2.id
FROM members m2
WHERE m1.referrer_member_id IS NULL
AND m1.referrer IS NOT NULL
AND m1.referrer != ''
AND LOWER(normalize_referrer_name(m1.referrer)) = LOWER(normalize_referrer_name(m2.name))
AND m2.deleted_at IS NULL
AND m2.id != m1.id; -- Evitar auto-referência

-- Verificar resultado da migração
SELECT 
    COUNT(*) as total_members,
    COUNT(referrer_member_id) as members_with_referrer_id,
    COUNT(CASE WHEN referrer_member_id IS NULL AND referrer IS NOT NULL AND referrer != '' THEN 1 END) as members_sem_referrer_id
FROM members
WHERE deleted_at IS NULL;

-- Mostrar alguns exemplos de membros e seus referrers
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

