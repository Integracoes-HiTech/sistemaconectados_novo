-- =====================================================
-- ATUALIZAR ESTRUTURA DA TABELA SAUDE_PEOPLE
-- =====================================================
-- Este script atualiza a tabela existente para a nova estrutura

-- Remover colunas desnecessárias
ALTER TABLE saude_people DROP COLUMN IF EXISTS leader_city;
ALTER TABLE saude_people DROP COLUMN IF EXISTS leader_sector;
ALTER TABLE saude_people DROP COLUMN IF EXISTS person_city;
ALTER TABLE saude_people DROP COLUMN IF EXISTS created_by;
ALTER TABLE saude_people DROP COLUMN IF EXISTS campaign;

-- Adicionar nova coluna person_cep (se não existir)
ALTER TABLE saude_people ADD COLUMN IF NOT EXISTS person_cep VARCHAR(10);

-- Alterar observation para NOT NULL (após garantir que não há valores NULL)
-- UPDATE saude_people SET observation = '' WHERE observation IS NULL;
-- ALTER TABLE saude_people ALTER COLUMN observation SET NOT NULL;

-- Remover índices antigos (se existirem)
DROP INDEX IF EXISTS idx_saude_people_created_by;
DROP INDEX IF EXISTS idx_saude_people_campaign;

-- Criar novos índices
CREATE INDEX IF NOT EXISTS idx_saude_people_whatsapp ON saude_people(person_whatsapp);
CREATE INDEX IF NOT EXISTS idx_saude_people_leader_whatsapp ON saude_people(leader_whatsapp);

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'saude_people'
ORDER BY ordinal_position;

