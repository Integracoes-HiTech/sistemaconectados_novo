-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA FRIENDS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- 1. Verificar estrutura EXATA da tabela friends
SELECT 
    column_name as coluna,
    data_type as tipo,
    character_maximum_length as tamanho_maximo,
    is_nullable as permite_null,
    column_default as valor_padrao
FROM information_schema.columns 
WHERE table_name = 'friends'
ORDER BY ordinal_position;

-- 2. Verificar se existe o campo campaign na tabela friends
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'friends' 
  AND column_name = 'campaign';

-- 3. Verificar se existe o campo status na tabela friends
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'friends' 
  AND column_name = 'status';

-- 4. Verificar dados atuais na tabela friends (primeiros 5 registros)
SELECT 
    id,
    campaign,
    status,
    name,
    couple_name,
    couple_phone,
    couple_instagram,
    created_at
FROM friends 
LIMIT 5;

-- 5. Verificar quantos registros existem por campanha
SELECT 
    campaign,
    COUNT(*) as total_friends
FROM friends 
GROUP BY campaign
ORDER BY campaign;

-- 6. Verificar se há registros com status diferente de 'Ativo'
SELECT 
    status,
    COUNT(*) as total
FROM friends 
GROUP BY status
ORDER BY status;
