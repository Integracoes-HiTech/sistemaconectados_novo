-- Script para adicionar chave estrangeira entre campaigns e planos_precos
-- e corrigir o relacionamento

-- 1. Verificar se a coluna plano_id existe e tem dados válidos
SELECT 
    c.id,
    c.name,
    c.plano_id,
    c.nome_plano,
    pp.id as plano_preco_id,
    pp.nome_plano as plano_nome_correto,
    pp.amount
FROM campaigns c
LEFT JOIN planos_precos pp ON c.plano_id = pp.id
ORDER BY c.created_at DESC;

-- 2. Adicionar chave estrangeira (se não existir)
-- Primeiro, verificar se já existe
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'campaigns'
    AND kcu.column_name = 'plano_id';

-- 3. Se não existir, adicionar a chave estrangeira
-- ALTER TABLE campaigns 
-- ADD CONSTRAINT fk_campaigns_plano_id 
-- FOREIGN KEY (plano_id) REFERENCES planos_precos(id);

-- 4. Atualizar dados inconsistentes (se necessário)
-- UPDATE campaigns 
-- SET nome_plano = pp.nome_plano
-- FROM planos_precos pp
-- WHERE campaigns.plano_id = pp.id 
-- AND campaigns.nome_plano != pp.nome_plano;

-- 5. Verificar resultado final
SELECT 
    c.id,
    c.name,
    c.plano_id,
    c.nome_plano,
    pp.nome_plano as plano_nome_correto,
    pp.amount,
    CASE 
        WHEN c.nome_plano = pp.nome_plano THEN '✅ Sincronizado'
        ELSE '❌ Inconsistente'
    END as status
FROM campaigns c
LEFT JOIN planos_precos pp ON c.plano_id = pp.id
ORDER BY c.created_at DESC;
