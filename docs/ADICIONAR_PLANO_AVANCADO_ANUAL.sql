-- =====================================================
-- ADICIONAR PLANO AVANÇADO ANUAL
-- Sistema CONECTADOS
-- =====================================================

-- Adicionar plano Avançado Anual na tabela planos_precos
INSERT INTO planos_precos (
    nome_plano,
    descricao,
    amount,
    recorrencia,
    features,
    max_users,
    order_display,
    is_active
) VALUES (
    'Avançado Anual',
    'Plano Avançado com desconto anual - Mais escolhido para grandes equipes',
    1400.00,
    'anual',
    '["Cadastros ilimitados", "Painel completo", "Mapa interativo", "Relatórios avançados", "Exportação Excel/PDF", "Backup diário", "Suporte prioritário", "Desconto anual"]'::jsonb,
    999999,
    4,
    true
);

-- Verificar se foi inserido corretamente
SELECT 
    id,
    nome_plano,
    amount,
    recorrencia,
    max_users,
    order_display,
    is_active
FROM planos_precos 
WHERE nome_plano = 'Avançado Anual';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Novo plano inserido:
-- - Nome: Avançado Anual
-- - Valor: R$ 1.400,00
-- - Recorrência: anual
-- - Limite: 999999 usuários (ilimitado)
-- - Ordem: 4 (após o Avançado mensal)
-- - Status: ativo
-- =====================================================
