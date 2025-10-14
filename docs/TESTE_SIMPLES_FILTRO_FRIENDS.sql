-- =====================================================
-- TESTE SIMPLES DO FILTRO POR CAMPANHA
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar quantos amigos existem por campanha
SELECT 
    campaign,
    COUNT(*) as total_friends
FROM friends 
WHERE deleted_at IS NULL
GROUP BY campaign
ORDER BY campaign;

-- 2. Verificar amigos de uma campanha específica (substitua 'GRATIS' pela campanha que você quer testar)
SELECT 
    id,
    campaign,
    status,
    name,
    couple_name,
    created_at
FROM friends 
WHERE campaign = 'GRATIS'  -- Substitua pela campanha que você quer testar
  AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar se há amigos sem campanha
SELECT 
    COUNT(*) as amigos_sem_campanha
FROM friends 
WHERE campaign IS NULL 
  AND deleted_at IS NULL;
