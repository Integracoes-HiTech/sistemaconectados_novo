-- =====================================================
-- VERIFICAR DADOS DO SISTEMA PARA RELATÓRIOS
-- =====================================================

-- 1. Verificar contagem de membros
SELECT 
    'Membros Ativos' as tipo,
    COUNT(*) as total
FROM members 
WHERE status = 'Ativo' 
    AND deleted_at IS NULL

UNION ALL

-- 2. Verificar contagem de amigos
SELECT 
    'Amigos Ativos' as tipo,
    COUNT(*) as total
FROM friends 
WHERE status = 'Ativo' 
    AND deleted_at IS NULL

UNION ALL

-- 3. Verificar contagem de usuários
SELECT 
    'Usuários Ativos' as tipo,
    COUNT(*) as total
FROM auth_users 
WHERE is_active = true

UNION ALL

-- 4. Verificar contagem de links
SELECT 
    'Links Ativos' as tipo,
    COUNT(*) as total
FROM user_links 
WHERE is_active = true 
    AND deleted_at IS NULL;

-- 5. Verificar dados de exemplo
SELECT 'Membros' as tabela, COUNT(*) as total FROM members
UNION ALL
SELECT 'Friends' as tabela, COUNT(*) as total FROM friends
UNION ALL
SELECT 'Auth Users' as tabela, COUNT(*) as total FROM auth_users
UNION ALL
SELECT 'User Links' as tabela, COUNT(*) as total FROM user_links;

-- 6. Verificar se há dados de exemplo para inserir
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM members) = 0 THEN 'INSERIR DADOS DE EXEMPLO'
        ELSE 'DADOS EXISTEM'
    END as status_membros,
    CASE 
        WHEN (SELECT COUNT(*) FROM friends) = 0 THEN 'INSERIR DADOS DE EXEMPLO'
        ELSE 'DADOS EXISTEM'
    END as status_amigos;
