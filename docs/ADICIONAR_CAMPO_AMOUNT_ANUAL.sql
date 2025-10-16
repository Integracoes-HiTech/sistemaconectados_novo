-- =====================================================
-- ADICIONAR CAMPO AMOUNT_ANUAL NA TABELA PLANOS_PRECOS
-- Sistema CONECTADOS
-- =====================================================

-- Adicionar coluna amount_anual na tabela planos_precos
ALTER TABLE planos_precos 
ADD COLUMN IF NOT EXISTS amount_anual DECIMAL(10,2) DEFAULT NULL;

-- Comentário da coluna
COMMENT ON COLUMN planos_precos.amount_anual IS 'Valor anual do plano para opções de pagamento anual';

-- Atualizar planos existentes com valores anuais
UPDATE planos_precos 
SET amount_anual = CASE 
    WHEN nome_plano ILIKE '%avançado%' OR nome_plano ILIKE '%avancado%' THEN 17000.00
    WHEN nome_plano ILIKE '%profissional%' THEN 8500.00   -- 850 * 10 meses (desconto de 2 meses)
    WHEN nome_plano ILIKE '%essencial%' THEN 6500.00      -- 650 * 10 meses (desconto de 2 meses)
    ELSE NULL
END
WHERE amount_anual IS NULL;

-- Verificar estrutura atualizada
SELECT 
    id,
    nome_plano,
    amount as amount_mensal,
    amount_anual,
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
-- - amount_anual (DECIMAL) - valor anual (NOVO)
-- - recorrencia (TEXT)
-- - features (JSONB)
-- - is_active (BOOLEAN)
-- - max_users (INTEGER)
-- - order_display (INTEGER)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- =====================================================
