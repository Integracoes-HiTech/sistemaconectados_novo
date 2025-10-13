-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA PLANOS_PRECOS
-- ========================================
-- Para identificar problemas de estrutura que podem causar erro 400

-- 1. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'planos_precos'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'planos_precos';

-- 3. Verificar se RLS está ativo
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE tablename = 'planos_precos';

-- 4. Verificar dados existentes
SELECT 
    id,
    nome_plano,
    amount,
    recorrencia,
    features,
    max_users,
    order_display,
    is_active,
    created_at
FROM planos_precos 
ORDER BY created_at DESC 
LIMIT 5;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Estrutura da tabela correta
-- ✅ Políticas RLS adequadas
-- ✅ Dados existentes válidos
