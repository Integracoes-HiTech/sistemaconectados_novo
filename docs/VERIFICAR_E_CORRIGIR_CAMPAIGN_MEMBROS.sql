-- ========================================
-- VERIFICAR E CORRIGIR CAMPO CAMPAIGN DOS MEMBROS
-- ========================================
-- PROBLEMA: Membros inseridos com campaign = 'B' (texto)
-- mas pode ser que o mapa ou sistema espere UUID da campanha
-- ========================================

-- PASSO 1: Verificar estrutura da tabela campaigns
SELECT * FROM campaigns ORDER BY code;

-- PASSO 2: Verificar qual tipo de dados está na coluna campaign da tabela members
SELECT 
    campaign,
    COUNT(*) as total,
    MIN(created_at) as primeiro_cadastro,
    MAX(created_at) as ultimo_cadastro
FROM members
GROUP BY campaign
ORDER BY total DESC;

-- PASSO 3: Verificar membros da campanha B inseridos hoje
SELECT 
    id,
    name,
    city,
    cep,
    campaign,
    LENGTH(campaign) as tamanho_campaign,
    status,
    created_at
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- PASSO 4: Verificar se existem membros com campaign como UUID
SELECT 
    id,
    name,
    city,
    campaign,
    LENGTH(campaign) as tamanho_campaign,
    created_at
FROM members
WHERE LENGTH(campaign) > 10  -- UUIDs têm 36 caracteres
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- ANÁLISE: O que o mapa espera?
-- ========================================
-- O mapa.html filtra por: .eq('campaign', 'B')
-- Isso significa que o mapa busca membros onde campaign = 'B' (texto)
-- Então está CORRETO!
-- ========================================

-- PASSO 5: Verificar se os membros têm CEP (obrigatório para aparecer no mapa)
SELECT 
    COUNT(*) as total_membros_campanha_b,
    COUNT(*) FILTER (WHERE cep IS NOT NULL OR couple_cep IS NOT NULL) as com_cep,
    COUNT(*) FILTER (WHERE cep IS NULL AND couple_cep IS NULL) as sem_cep,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos,
    COUNT(*) FILTER (WHERE status != 'Ativo') as inativos
FROM members
WHERE campaign = 'B';

-- PASSO 6: Listar membros que NÃO aparecerão no mapa (sem CEP ou inativos)
SELECT 
    id,
    name,
    city,
    cep,
    couple_cep,
    status,
    CASE 
        WHEN status != 'Ativo' THEN 'Status não é Ativo'
        WHEN cep IS NULL AND couple_cep IS NULL THEN 'Sem CEP'
        ELSE 'OK'
    END as motivo_nao_aparece
FROM members
WHERE campaign = 'B'
  AND (status != 'Ativo' OR (cep IS NULL AND couple_cep IS NULL));

-- PASSO 7: Verificar membros que DEVEM aparecer no mapa
SELECT 
    id,
    name,
    city,
    cep,
    couple_cep,
    status,
    campaign,
    created_at
FROM members
WHERE campaign = 'B'
  AND status = 'Ativo'
  AND (cep IS NOT NULL OR couple_cep IS NOT NULL)
ORDER BY city, name;

-- ========================================
-- DIAGNÓSTICO COMPLETO
-- ========================================
-- Se os membros não aparecem no mapa, verifique:
-- 1. ✓ campaign = 'B' (correto)
-- 2. ✓ status = 'Ativo' (correto)
-- 3. ✓ CEP não é nulo (verificar)
-- 4. ? Políticas RLS da tabela members (pode estar bloqueando)
-- ========================================

-- PASSO 8: Verificar políticas RLS na tabela members
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;

-- ========================================
-- SOLUÇÃO: Se o problema for RLS
-- ========================================
-- Se as políticas RLS estiverem bloqueando acesso anônimo,
-- você pode criar uma política que permita leitura pública
-- dos membros da campanha B:
--
-- CREATE POLICY "public_read_members_campaign_b" ON members
-- FOR SELECT
-- USING (campaign = 'B' AND status = 'Ativo');
-- ========================================

