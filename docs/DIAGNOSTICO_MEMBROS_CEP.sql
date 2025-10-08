-- ========================================
-- DIAGNÓSTICO - POR QUE NÃO HÁ MEMBROS COM CEP?
-- ========================================

-- 1. VERIFICAR se existem membros na campanha B
SELECT 
    COUNT(*) as total_membros_campanha_b,
    COUNT(*) FILTER (WHERE status = 'Ativo') as total_ativos,
    COUNT(*) FILTER (WHERE status != 'Ativo') as total_inativos
FROM members
WHERE campaign = 'B';

-- 2. VERIFICAR se existem membros com CEP (em qualquer campanha)
SELECT 
    campaign,
    COUNT(*) as total_membros,
    COUNT(*) FILTER (WHERE cep IS NOT NULL AND cep != '') as com_cep,
    COUNT(*) FILTER (WHERE couple_cep IS NOT NULL AND couple_cep != '') as com_couple_cep,
    COUNT(*) FILTER (WHERE (cep IS NOT NULL AND cep != '') OR (couple_cep IS NOT NULL AND couple_cep != '')) as com_qualquer_cep
FROM members
GROUP BY campaign
ORDER BY campaign;

-- 3. VER exemplos de membros da campanha B (primeiros 10)
SELECT 
    id,
    name,
    couple_name,
    campaign,
    status,
    cep,
    couple_cep,
    city,
    couple_city,
    created_at
FROM members
WHERE campaign = 'B'
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR se o problema é o valor NULL vs string vazia
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE cep IS NULL) as cep_null,
    COUNT(*) FILTER (WHERE cep = '') as cep_vazio,
    COUNT(*) FILTER (WHERE cep IS NOT NULL AND cep != '') as cep_preenchido,
    COUNT(*) FILTER (WHERE couple_cep IS NULL) as couple_cep_null,
    COUNT(*) FILTER (WHERE couple_cep = '') as couple_cep_vazio,
    COUNT(*) FILTER (WHERE couple_cep IS NOT NULL AND couple_cep != '') as couple_cep_preenchido
FROM members
WHERE campaign = 'B' AND status = 'Ativo';

-- 5. VERIFICAR todas as campanhas que existem
SELECT DISTINCT campaign, COUNT(*) as total
FROM members
GROUP BY campaign
ORDER BY campaign;

-- 6. VERIFICAR se há membros em OUTRAS campanhas com CEP
SELECT 
    campaign,
    name,
    cep,
    couple_cep,
    status
FROM members
WHERE (cep IS NOT NULL AND cep != '') 
   OR (couple_cep IS NOT NULL AND couple_cep != '')
ORDER BY campaign, created_at DESC
LIMIT 20;

-- ========================================
-- POSSÍVEIS SOLUÇÕES
-- ========================================

-- SOLUÇÃO 1: Se os membros estão na campanha 'A' em vez de 'B'
-- Você pode:
-- a) Mudar a query do mapa para buscar campanha 'A'
-- b) Atualizar os membros para campanha 'B'

-- SOLUÇÃO 2: Se os CEPs estão vazios (string vazia ao invés de NULL)
-- A query do mapa precisa ser atualizada para aceitar:
-- WHERE cep IS NOT NULL AND cep != ''

-- SOLUÇÃO 3: Se não há nenhum membro cadastrado ainda
-- Cadastre alguns membros com CEP através do sistema

-- ========================================
-- QUERIES ÚTEIS PARA CORREÇÃO
-- ========================================

-- Se quiser ver TODOS os membros (qualquer campanha) com CEP:
/*
SELECT 
    campaign,
    name,
    couple_name,
    cep,
    couple_cep,
    city
FROM members
WHERE status = 'Ativo'
  AND ((cep IS NOT NULL AND cep != '') OR (couple_cep IS NOT NULL AND couple_cep != ''))
ORDER BY campaign, name
LIMIT 50;
*/

-- Se quiser atualizar membros da campanha A para B (CUIDADO!):
/*
UPDATE members 
SET campaign = 'B' 
WHERE campaign = 'A';
*/

-- Se quiser criar um membro de teste com CEP:
/*
INSERT INTO members (
    name, 
    couple_name, 
    campaign, 
    status, 
    cep, 
    city,
    created_at
) VALUES (
    'Teste Mapa',
    'Teste Casal',
    'B',
    'Ativo',
    '01310-100',
    'São Paulo',
    NOW()
);
*/

