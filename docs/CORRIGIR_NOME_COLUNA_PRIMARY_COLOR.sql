-- ========================================
-- CORRIGIR NOME DA COLUNA PRIMARY COLOR
-- ========================================
-- O banco criou "primary color" (com espaço) ao invés de "primary_color" (com underscore)
-- Este script corrige isso

-- PASSO 1: Renomear a coluna "primary color" para "primary_color"
ALTER TABLE campaigns 
RENAME COLUMN "primary color" TO primary_color;

-- PASSO 2: Verificar se deu certo
SELECT 
    id,
    name,
    code,
    primary_color,
    secondary_color,
    plano_id,
    nome_plano,
    is_active
FROM campaigns 
ORDER BY created_at DESC;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Coluna renomeada de "primary color" → "primary_color"
-- ✅ Todas as campanhas aparecem com cores corretas

