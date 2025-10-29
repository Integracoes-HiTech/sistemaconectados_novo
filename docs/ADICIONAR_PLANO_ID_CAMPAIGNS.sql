-- =====================================================
-- ADICIONAR PLANO_ID NA TABELA CAMPAIGNS COM FOREIGN KEY
-- Sistema CONECTADOS
-- =====================================================

-- IMPORTANTE: Se a coluna plano_id já existe como TEXT, ela será convertida para UUID
-- Valores inválidos serão convertidos para NULL

-- 1. Remover constraint antiga se existir
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS fk_campaigns_plano_id;

-- 2. Limpar valores inválidos na coluna plano_id (se for TEXT, eles serão removidos)
UPDATE campaigns 
SET plano_id = NULL
WHERE plano_id IS NOT NULL;

-- 3. Converter tipo da coluna plano_id de TEXT para UUID
-- Se a coluna não existir, será criada como UUID
-- ATENÇÃO: Execute este comando apenas se plano_id for TEXT
ALTER TABLE campaigns ALTER COLUMN plano_id TYPE UUID USING NULL;

-- Se o comando acima der erro dizendo que a coluna não existe, execute:
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS plano_id UUID;

-- 4. Verificar se já existem dados de plano para migrar (baseado em nome_plano)
-- Se a tabela campaigns já tem nome_plano, vamos associar pelo nome
UPDATE campaigns c
SET plano_id = pp.id
FROM planos_precos pp
WHERE LOWER(TRIM(c.nome_plano)) = LOWER(TRIM(pp.nome_plano))
AND c.plano_id IS NULL
AND c.nome_plano IS NOT NULL;

-- 3. Adicionar constraint de foreign key
-- Primeiro, remover constraint antiga se existir (para evitar erro)
ALTER TABLE campaigns
DROP CONSTRAINT IF EXISTS fk_campaigns_plano_id;

-- Adicionar a constraint
ALTER TABLE campaigns
ADD CONSTRAINT fk_campaigns_plano_id
FOREIGN KEY (plano_id)
REFERENCES planos_precos(id)
ON DELETE SET NULL;

-- 4. Adicionar índice para melhorar performance nas queries
CREATE INDEX IF NOT EXISTS idx_campaigns_plano_id ON campaigns(plano_id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar quantos registros foram migrados
SELECT 
    COUNT(*) as total_campaigns,
    COUNT(plano_id) as campaigns_with_plano_id,
    COUNT(CASE WHEN plano_id IS NULL AND nome_plano IS NOT NULL THEN 1 END) as campaigns_sem_migrar
FROM campaigns;

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('plano_id', 'nome_plano')
ORDER BY ordinal_position;

-- Verificar resultado da migração por plano
SELECT 
    c.nome_plano AS nome_plano_campaign,
    pp.nome_plano AS nome_plano_tabela,
    COUNT(*) AS total_campaigns,
    COUNT(CASE WHEN c.plano_id IS NOT NULL THEN 1 END) AS com_plano_id,
    COUNT(CASE WHEN c.plano_id IS NULL THEN 1 END) AS sem_plano_id
FROM campaigns c
LEFT JOIN planos_precos pp ON LOWER(TRIM(c.nome_plano)) = LOWER(TRIM(pp.nome_plano))
GROUP BY c.nome_plano, pp.nome_plano
ORDER BY c.nome_plano;

-- Verificar constraint de foreign key
SELECT
    tc.constraint_name,
    tc.table_name AS foreign_table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table_name,
    ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'campaigns'
AND kcu.column_name = 'plano_id';

-- Listar campanhas que não foram migradas (plano não encontrado)
SELECT 
    id,
    name,
    code,
    nome_plano AS nome_plano_campaign,
    plano_id
FROM campaigns
WHERE nome_plano IS NOT NULL 
AND plano_id IS NULL
ORDER BY nome_plano;

