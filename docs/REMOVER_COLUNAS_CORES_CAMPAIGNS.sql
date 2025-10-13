-- =====================================================
-- REMOVER COLUNAS DE CORES DESNECESSÁRIAS DA TABELA CAMPAIGNS
-- Sistema CONECTADOS
-- =====================================================

-- Remove as colunas primary_color e accent_color da tabela campaigns
-- Mantém apenas secondary_color e background_color

-- 1. Remover coluna primary_color (se existir)
ALTER TABLE campaigns 
DROP COLUMN IF EXISTS primary_color;

-- 2. Remover coluna accent_color (se existir)
ALTER TABLE campaigns 
DROP COLUMN IF EXISTS accent_color;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Tabela campaigns agora tem apenas:
-- - id
-- - name
-- - code
-- - secondary_color (mantida)
-- - background_color (mantida)
-- - is_active
-- - plano_id
-- - nome_plano
-- - created_at
-- - updated_at
-- =====================================================

-- Verificar estrutura da tabela após as mudanças
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

