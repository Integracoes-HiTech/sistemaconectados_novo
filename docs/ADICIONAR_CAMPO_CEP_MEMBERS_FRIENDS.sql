-- =====================================================
-- ADICIONAR CAMPO CEP NAS TABELAS MEMBERS E FRIENDS
-- =====================================================
-- Este script adiciona a coluna CEP de forma segura
-- mantendo todos os dados existentes intactos

-- ✅ PASSO 1: Adicionar coluna CEP na tabela MEMBERS
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL;

-- ✅ PASSO 2: Adicionar coluna CEP na tabela FRIENDS
ALTER TABLE friends 
ADD COLUMN IF NOT EXISTS cep VARCHAR(9) DEFAULT NULL;

-- ✅ PASSO 3: Adicionar comentários para documentação
COMMENT ON COLUMN members.cep IS 'CEP do endereço do membro (formato: 12345-678)';
COMMENT ON COLUMN friends.cep IS 'CEP do endereço do amigo (formato: 12345-678)';

-- ✅ PASSO 4: Criar índices para melhor performance (opcional, apenas se necessário)
CREATE INDEX IF NOT EXISTS idx_members_cep ON members(cep) WHERE cep IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_friends_cep ON friends(cep) WHERE cep IS NOT NULL;

-- ✅ PASSO 5: Verificar as alterações
SELECT 
    'members' as tabela,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'members' 
  AND column_name = 'cep'

UNION ALL

SELECT 
    'friends' as tabela,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'friends' 
  AND column_name = 'cep';

-- ✅ PASSO 6: Verificar registros existentes (todos terão CEP NULL inicialmente)
SELECT 
    'members' as tabela,
    COUNT(*) as total_registros,
    COUNT(cep) as registros_com_cep,
    COUNT(*) - COUNT(cep) as registros_sem_cep
FROM members

UNION ALL

SELECT 
    'friends' as tabela,
    COUNT(*) as total_registros,
    COUNT(cep) as registros_com_cep,
    COUNT(*) - COUNT(cep) as registros_sem_cep
FROM friends;

-- =====================================================
-- ✅ PRONTO! 
-- =====================================================
-- ✔️ Coluna CEP adicionada com sucesso
-- ✔️ Dados existentes mantidos intactos (CEP = NULL)
-- ✔️ Novos cadastros podem incluir CEP
-- ✔️ Campo é OPCIONAL (nullable)
-- ✔️ Não afeta nenhuma funcionalidade existente
-- =====================================================

