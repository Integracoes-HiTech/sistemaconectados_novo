-- Script para LIMPAR dados de teste do plano Gratuito
-- IMPORTANTE: Substitua 'GRATIS' pelo código correto da sua campanha Gratuito

-- 1. VERIFICAR QUANTOS REGISTROS SERÃO DELETADOS
SELECT 
    'Membros a deletar' as tipo,
    COUNT(*) as total
FROM members 
WHERE campaign = 'GRATIS' 
AND (
    name LIKE 'Membro %' 
    OR name LIKE 'Teste Membro%'
)

UNION ALL

SELECT 
    'Amigos a deletar' as tipo,
    COUNT(*) as total
FROM friends 
WHERE campaign = 'GRATIS'
AND (
    name LIKE 'Amigo %' 
    OR name LIKE 'Teste Amigo%'
    OR name LIKE 'Amiga %'
    OR name LIKE 'Teste Amiga%'
);

-- 2. VER OS NOMES DOS MEMBROS QUE SERÃO DELETADOS
SELECT 
    id,
    name,
    couple_name,
    phone,
    created_at
FROM members 
WHERE campaign = 'GRATIS'
AND (
    name LIKE 'Membro %' 
    OR name LIKE 'Teste Membro%'
)
ORDER BY created_at DESC;

-- 3. VER OS NOMES DOS AMIGOS QUE SERÃO DELETADOS
SELECT 
    id,
    name,
    couple_name,
    phone,
    created_at
FROM friends 
WHERE campaign = 'GRATIS'
AND (
    name LIKE 'Amigo %' 
    OR name LIKE 'Teste Amigo%'
    OR name LIKE 'Amiga %'
    OR name LIKE 'Teste Amiga%'
)
ORDER BY created_at DESC;

-- 4. DELETAR OS AMIGOS PRIMEIRO (por causa da foreign key com members)
DELETE FROM friends 
WHERE campaign = 'GRATIS'
AND (
    name LIKE 'Amigo %' 
    OR name LIKE 'Teste Amigo%'
    OR name LIKE 'Amiga %'
    OR name LIKE 'Teste Amiga%'
);

-- 5. DELETAR OS MEMBROS
DELETE FROM members 
WHERE campaign = 'GRATIS'
AND (
    name LIKE 'Membro %' 
    OR name LIKE 'Teste Membro%'
);

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    'Membros restantes' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM members 
WHERE campaign = 'GRATIS'

UNION ALL

SELECT 
    'Amigos restantes' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM friends 
WHERE campaign = 'GRATIS';

