-- Script RÁPIDO para testar limite do plano Gratuito
-- Inserir apenas 5 membros + 5 amigos para teste rápido

-- 1. PRIMEIRO: Verificar qual é o código da campanha Gratuito
SELECT 
    code,
    name,
    nome_plano,
    is_active
FROM campaigns 
WHERE nome_plano ILIKE '%gratuito%'
ORDER BY created_at DESC;

-- 2. INSERIR 5 MEMBROS PARA TESTE RÁPIDO
-- SUBSTITUA 'GRATIS' pelo código correto da campanha Gratuito

INSERT INTO members (
    name,
    phone,
    instagram,
    cep,
    city,
    sector,
    referrer,
    registration_date,
    status,
    couple_name,
    couple_phone,
    couple_instagram,
    couple_cep,
    couple_city,
    couple_sector,
    contracts_completed,
    ranking_status,
    is_top_1500,
    can_be_replaced,
    is_friend,
    campaign,
    created_at,
    updated_at
) VALUES 
('Teste Membro 1', '62999990001', '@teste1', '74000001', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Teste Parceiro 1', '62999990002', '@parceiro1', '74000001', 'Goiânia', 'Centro', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Teste Membro 2', '62999990003', '@teste2', '74000002', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Teste Parceiro 2', '62999990004', '@parceiro2', '74000002', 'Goiânia', 'Setor Sul', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Teste Membro 3', '62999990005', '@teste3', '74000003', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Teste Parceiro 3', '62999990006', '@parceiro3', '74000003', 'Goiânia', 'Setor Norte', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Teste Membro 4', '62999990007', '@teste4', '74000004', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Teste Parceiro 4', '62999990008', '@parceiro4', '74000004', 'Goiânia', 'Setor Leste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Teste Membro 5', '62999990009', '@teste5', '74000005', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Teste Parceiro 5', '62999990010', '@parceiro5', '74000005', 'Goiânia', 'Setor Oeste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW());

-- 3. INSERIR 5 AMIGOS PARA TESTE RÁPIDO
INSERT INTO friends (
    member_id,
    name,
    phone,
    instagram,
    city,
    sector,
    referrer,
    registration_date,
    status,
    couple_name,
    couple_phone,
    couple_instagram,
    couple_city,
    couple_sector,
    contracts_completed,
    ranking_position,
    ranking_status,
    is_top_1500,
    can_be_replaced,
    campaign,
    created_at,
    updated_at
) VALUES 
((SELECT id FROM members WHERE name = 'Teste Membro 1' AND campaign = 'GRATIS' LIMIT 1), 'Teste Amigo 1', '62999990101', '@amigo1', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Teste Amiga 1', '62999990102', '@amiga1', 'Goiânia', 'Centro', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Teste Membro 2' AND campaign = 'GRATIS' LIMIT 1), 'Teste Amigo 2', '62999990103', '@amigo2', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Teste Amiga 2', '62999990104', '@amiga2', 'Goiânia', 'Setor Sul', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Teste Membro 3' AND campaign = 'GRATIS' LIMIT 1), 'Teste Amigo 3', '62999990105', '@amigo3', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Teste Amiga 3', '62999990106', '@amiga3', 'Goiânia', 'Setor Norte', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Teste Membro 4' AND campaign = 'GRATIS' LIMIT 1), 'Teste Amigo 4', '62999990107', '@amigo4', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Teste Amiga 4', '62999990108', '@amiga4', 'Goiânia', 'Setor Leste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Teste Membro 5' AND campaign = 'GRATIS' LIMIT 1), 'Teste Amigo 5', '62999990109', '@amigo5', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Teste Amiga 5', '62999990110', '@amiga5', 'Goiânia', 'Setor Oeste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW());

-- 4. VERIFICAR RESULTADO
SELECT 
    'Membros' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM members 
WHERE campaign = 'GRATIS'

UNION ALL

SELECT 
    'Amigos' as tipo,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'Ativo') as ativos
FROM friends 
WHERE campaign = 'GRATIS';

-- 5. LIMPAR DADOS DE TESTE (quando necessário)
/*
DELETE FROM friends WHERE campaign = 'GRATIS' AND name LIKE 'Teste Amigo%';
DELETE FROM members WHERE campaign = 'GRATIS' AND name LIKE 'Teste Membro%';
*/
