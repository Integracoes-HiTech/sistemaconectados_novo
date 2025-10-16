-- =====================================================
-- ADICIONAR CAMPO DESCONTO NA TABELA PLANOS_PRECOS
-- Sistema CONECTADOS
-- =====================================================

-- Adicionar coluna desconto na tabela planos_precos
ALTER TABLE planos_precos 
ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT NULL;

-- Comentário da coluna
COMMENT ON COLUMN planos_precos.desconto IS 'Valor do desconto aplicado no plano (para cálculo de economia)';

-- Atualizar planos existentes com valores de desconto
UPDATE planos_precos 
SET desconto = CASE 
    WHEN nome_plano ILIKE '%avançado%' OR nome_plano ILIKE '%avancado%' THEN 1000.00
    WHEN nome_plano ILIKE '%profissional%' THEN 200.00   -- 850 - 650 = 200
    WHEN nome_plano ILIKE '%essencial%' THEN 200.00      -- 650 - 450 = 200
    ELSE NULL
END
WHERE desconto IS NULL;

-- Verificar estrutura atualizada
SELECT 
    id,
    nome_plano,
    amount as amount_mensal,
    amount_anual,
    desconto,
    recorrencia,
    max_users,
    is_active
FROM planos_precos 
ORDER BY order_display;

-- =====================================================
-- ESTRUTURA FINAL ESPERADA
-- =====================================================
-- Colunas da tabela planos_precos:
-- - id (UUID)
-- - nome_plano (TEXT)
-- - descricao (TEXT)
-- - amount (DECIMAL) - valor mensal
-- - amount_anual (DECIMAL) - valor anual
-- - desconto (DECIMAL) - valor do desconto (NOVO)
-- - recorrencia (TEXT)
-- - features (JSONB)
-- - is_active (BOOLEAN)
-- - max_users (INTEGER)
-- - order_display (INTEGER)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- =====================================================
