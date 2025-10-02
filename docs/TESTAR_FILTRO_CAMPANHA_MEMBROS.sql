-- =====================================================
-- TESTAR FILTRO POR CAMPANHA - MEMBROS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. VERIFICAR DADOS ATUAIS POR CAMPANHA
-- =====================================================

-- Verificar distribuição de membros por campanha
SELECT 
    campaign,
    COUNT(*) as total_members,
    COUNT(CASE WHEN status = 'Ativo' AND deleted_at IS NULL THEN 1 END) as active_members,
    COUNT(CASE WHEN ranking_status = 'Verde' AND status = 'Ativo' AND deleted_at IS NULL THEN 1 END) as green_members,
    COUNT(CASE WHEN ranking_status = 'Amarelo' AND status = 'Ativo' AND deleted_at IS NULL THEN 1 END) as yellow_members,
    COUNT(CASE WHEN ranking_status = 'Vermelho' AND status = 'Ativo' AND deleted_at IS NULL THEN 1 END) as red_members
FROM members
GROUP BY campaign
ORDER BY campaign;

-- =====================================================
-- 2. TESTAR FILTRO POR CAMPANHA A
-- =====================================================

-- Estatísticas da Campanha A
SELECT 
    'Campanha A' as campanha,
    COUNT(*) as total_members,
    COUNT(CASE WHEN ranking_status = 'Verde' THEN 1 END) as green_members,
    COUNT(CASE WHEN ranking_status = 'Amarelo' THEN 1 END) as yellow_members,
    COUNT(CASE WHEN ranking_status = 'Vermelho' THEN 1 END) as red_members,
    COUNT(CASE WHEN is_top_1500 = true THEN 1 END) as top_1500_members
FROM members
WHERE campaign = 'A' 
  AND status = 'Ativo' 
  AND deleted_at IS NULL;

-- =====================================================
-- 3. TESTAR FILTRO POR CAMPANHA B
-- =====================================================

-- Estatísticas da Campanha B
SELECT 
    'Campanha B' as campanha,
    COUNT(*) as total_members,
    COUNT(CASE WHEN ranking_status = 'Verde' THEN 1 END) as green_members,
    COUNT(CASE WHEN ranking_status = 'Amarelo' THEN 1 END) as yellow_members,
    COUNT(CASE WHEN ranking_status = 'Vermelho' THEN 1 END) as red_members,
    COUNT(CASE WHEN is_top_1500 = true THEN 1 END) as top_1500_members
FROM members
WHERE campaign = 'B' 
  AND status = 'Ativo' 
  AND deleted_at IS NULL;

-- =====================================================
-- 4. COMPARAR COM VIEW GLOBAL
-- =====================================================

-- Estatísticas globais (todas as campanhas)
SELECT 
    'Global' as campanha,
    total_members,
    green_members,
    yellow_members,
    red_members,
    top_1500_members
FROM v_system_stats;

-- =====================================================
-- 5. VERIFICAR DADOS DE EXEMPLO
-- =====================================================

-- Listar alguns membros de cada campanha para verificação
SELECT 
    campaign,
    name,
    ranking_status,
    contracts_completed,
    is_top_1500
FROM members
WHERE status = 'Ativo' 
  AND deleted_at IS NULL
ORDER BY campaign, ranking_status, contracts_completed DESC
LIMIT 20;

-- =====================================================
-- RESUMO DO TESTE:
-- =====================================================
-- ✅ Verificar se os dados estão sendo filtrados corretamente por campanha
-- ✅ Comparar estatísticas por campanha vs. globais
-- ✅ Confirmar que o hook useMembers está funcionando com filtro de campanha
-- ✅ Validar que os contadores do dashboard mostram apenas dados da campanha do usuário
