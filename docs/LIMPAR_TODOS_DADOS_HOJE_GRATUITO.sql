-- Script para LIMPAR TODOS os dados cadastrados HOJE no plano Gratuito
-- IMPORTANTE: Substitua 'GRATIS' pelo código correto da sua campanha Gratuito

-- 1. VERIFICAR DADOS DE HOJE
SELECT 
    'Membros de hoje' as tipo,
    COUNT(*) as total
FROM members 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT 
    'Amigos de hoje' as tipo,
    COUNT(*) as total
FROM friends 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE;

-- 2. VER DETALHES DOS MEMBROS CADASTRADOS HOJE
SELECT 
    id,
    name,
    couple_name,
    phone,
    created_at
FROM members 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 3. VER DETALHES DOS AMIGOS CADASTRADOS HOJE
SELECT 
    id,
    name,
    couple_name,
    phone,
    created_at
FROM friends 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- 4. DELETAR AMIGOS CADASTRADOS HOJE
DELETE FROM friends 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE;

-- 5. DELETAR MEMBROS CADASTRADOS HOJE
DELETE FROM members 
WHERE campaign = 'GRATIS'
AND DATE(created_at) = CURRENT_DATE;

-- 6. VERIFICAR RESULTADO
SELECT 
    'Membros após limpeza' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM members 
WHERE campaign = 'GRATIS'

UNION ALL

SELECT 
    'Amigos após limpeza' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM friends 
WHERE campaign = 'GRATIS';

