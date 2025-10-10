-- ================================================
-- ATUALIZAÇÃO DA TABELA saude_people
-- Renomear campos e adicionar nova estrutura
-- ================================================

-- 1. Renomear colunas existentes para nova nomenclatura
ALTER TABLE saude_people 
  RENAME COLUMN leader_name TO lider_nome_completo;

ALTER TABLE saude_people 
  RENAME COLUMN leader_whatsapp TO lider_whatsapp;

ALTER TABLE saude_people 
  RENAME COLUMN person_name TO pessoa_nome_completo;

ALTER TABLE saude_people 
  RENAME COLUMN person_whatsapp TO pessoa_whatsapp;

ALTER TABLE saude_people 
  RENAME COLUMN person_cep TO cep;

ALTER TABLE saude_people 
  RENAME COLUMN observation TO observacoes;

-- 2. Adicionar coluna cidade (preenchida automaticamente pelo CEP)
ALTER TABLE saude_people 
  ADD COLUMN IF NOT EXISTS cidade VARCHAR(255);

-- 3. Adicionar comentários nas colunas para documentação
COMMENT ON COLUMN saude_people.lider_nome_completo IS 'Nome completo do líder';
COMMENT ON COLUMN saude_people.lider_whatsapp IS 'WhatsApp do líder';
COMMENT ON COLUMN saude_people.pessoa_nome_completo IS 'Nome completo da pessoa';
COMMENT ON COLUMN saude_people.pessoa_whatsapp IS 'WhatsApp da pessoa';
COMMENT ON COLUMN saude_people.cep IS 'CEP da pessoa (para preenchimento automático de cidade)';
COMMENT ON COLUMN saude_people.cidade IS 'Cidade preenchida automaticamente pelo CEP';
COMMENT ON COLUMN saude_people.observacoes IS 'Observações sobre a pessoa';

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_saude_people_cidade ON saude_people(cidade);
CREATE INDEX IF NOT EXISTS idx_saude_people_cep ON saude_people(cep);

-- 5. Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'saude_people'
ORDER BY ordinal_position;

-- ================================================
-- ESTRUTURA FINAL ESPERADA:
-- ================================================
-- id (uuid, PK)
-- lider_nome_completo (varchar)
-- lider_whatsapp (varchar)
-- pessoa_nome_completo (varchar)
-- pessoa_whatsapp (varchar)
-- cep (varchar)
-- cidade (varchar) - NOVO
-- observacoes (text, NOT NULL)
-- created_at (timestamp)
-- deleted_at (timestamp)
-- ================================================

