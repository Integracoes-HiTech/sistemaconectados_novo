-- Script RÁPIDO para remover membros e amigos de teste
-- Execute cada bloco separadamente conforme necessário

-- ================================================
-- OPÇÃO 1: Remover por padrão de nome
-- ================================================

-- 1.1. DELETAR AMIGOS (executar PRIMEIRO por causa da foreign key)
DELETE FROM friends 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND (
    name LIKE 'Amigo %' 
    OR name LIKE 'Amiga %'
    OR name LIKE 'Teste Amigo%'
    OR name LIKE 'Teste Amiga%'
    OR name LIKE '%Amigo1%'
    OR name LIKE '%Amigo2%'
);

-- 1.2. DELETAR MEMBROS (executar DEPOIS dos amigos)
DELETE FROM members 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND (
    name LIKE 'Membro %' 
    OR name LIKE 'Teste Membro%'
    OR name LIKE 'João Silva'
    OR name LIKE 'Pedro Santos'
    OR name LIKE 'Carlos Oliveira'
);

-- ================================================
-- OPÇÃO 2: Remover TODOS os dados de HOJE
-- ================================================

-- 2.1. DELETAR AMIGOS DE HOJE
DELETE FROM friends 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND DATE(created_at) = CURRENT_DATE;

-- 2.2. DELETAR MEMBROS DE HOJE
DELETE FROM members 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND DATE(created_at) = CURRENT_DATE;

-- ================================================
-- OPÇÃO 3: Remover por telefone de teste
-- ================================================

-- 3.1. DELETAR AMIGOS POR TELEFONE
DELETE FROM friends 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND (
    phone LIKE '62999990%'  -- Telefones de teste
    OR phone LIKE '62999991%'
);

-- 3.2. DELETAR MEMBROS POR TELEFONE
DELETE FROM members 
WHERE campaign = 'GRATIS'  -- Substitua pelo código da sua campanha
AND (
    phone LIKE '62999990%'  -- Telefones de teste
    OR phone LIKE '62999991%'
);

-- ================================================
-- VERIFICAR RESULTADO
-- ================================================

SELECT 
    'Membros' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM members 
WHERE campaign = 'GRATIS'

UNION ALL

SELECT 
    'Amigos' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM friends 
WHERE campaign = 'GRATIS';

-- ================================================
-- DELETAR TODOS (CUIDADO!)
-- ================================================

-- USE APENAS SE QUISER LIMPAR COMPLETAMENTE A CAMPANHA DE TESTE

/*
-- DESCOMENTAR APENAS SE TIVER CERTEZA:

DELETE FROM friends WHERE campaign = 'GRATIS';
DELETE FROM members WHERE campaign = 'GRATIS';
*/

