-- ========================================
-- CONFIGURAR RLS PARA O MAPA
-- ========================================
-- Este SQL permite que o mapa (usando anon key) consiga
-- ler os dados da tabela members para exibir no mapa

-- 1. VERIFICAR políticas RLS atuais da tabela members
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
WHERE tablename = 'members';

-- 2. VERIFICAR se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'members';

-- 3. CRIAR política para permitir leitura pública de membros ativos da campanha B
-- (necessário para o mapa funcionar com anon key)

-- Primeiro, deletar a política se ela já existir
DROP POLICY IF EXISTS "public_read_members_campanha_b" ON members;

-- Agora criar a nova política
CREATE POLICY "public_read_members_campanha_b"
ON members
FOR SELECT
TO anon
USING (
    status = 'Ativo' 
    AND campaign = 'B'
);

-- 4. VERIFICAR se a política foi criada
SELECT 
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'members' 
  AND policyname = 'public_read_members_campanha_b';

-- 5. TESTAR a query que o mapa vai fazer
-- (execute como anon user para testar)
SELECT 
    id, 
    name, 
    couple_name, 
    cep, 
    couple_cep, 
    city, 
    couple_city, 
    status, 
    campaign
FROM members
WHERE campaign = 'B'
  AND status = 'Ativo'
  AND cep IS NOT NULL
LIMIT 5;

-- ========================================
-- VERIFICAÇÕES ADICIONAIS
-- ========================================

-- 6. Quantos membros da campanha B têm CEP?
SELECT 
    COUNT(*) as total_com_cep,
    COUNT(DISTINCT cep) as ceps_unicos
FROM members
WHERE campaign = 'B'
  AND status = 'Ativo'
  AND cep IS NOT NULL;

-- 7. Exemplos de membros que aparecerão no mapa
SELECT 
    name,
    couple_name,
    city,
    cep,
    couple_cep
FROM members
WHERE campaign = 'B'
  AND status = 'Ativo'
  AND cep IS NOT NULL
ORDER BY name
LIMIT 10;

-- ========================================
-- SEGURANÇA - OPCIONAL
-- ========================================

-- Se quiser RESTRINGIR ainda mais (apenas CEPs, sem nomes):
-- Você pode criar uma VIEW e dar acesso apenas à view

/*
CREATE OR REPLACE VIEW members_mapa_publico AS
SELECT 
    id,
    cep,
    couple_cep,
    city,
    couple_city,
    campaign
FROM members
WHERE campaign = 'B'
  AND status = 'Ativo'
  AND cep IS NOT NULL;

-- Dar permissão de leitura na view
GRANT SELECT ON members_mapa_publico TO anon;

-- Então no mapa, buscar de 'members_mapa_publico' ao invés de 'members'
*/

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- Se ainda der erro de RLS, pode ser necessário desabilitar RLS
-- temporariamente para testar:

/*
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
-- ATENÇÃO: Isso expõe TODOS os dados! Use apenas para teste.
-- Lembre-se de habilitar novamente depois:
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
*/

-- ========================================
-- RESUMO
-- ========================================
-- 1. Execute as queries acima para verificar RLS
-- 2. Crie a política "public_read_members_campanha_b"
-- 3. Teste a query que o mapa vai fazer
-- 4. Faça login como admin da Campanha B
-- 5. Acesse o dashboard e veja o mapa
-- ========================================

