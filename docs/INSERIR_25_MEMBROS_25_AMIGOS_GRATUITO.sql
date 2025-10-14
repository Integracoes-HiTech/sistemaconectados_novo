-- Script para inserir EXATAMENTE 25 membros + 25 amigos no plano Gratuito
-- Total: 50 usuários (limite do plano Gratuito)

-- IMPORTANTE: Substitua 'GRATIS' pelo código correto da sua campanha Gratuito

-- 1. INSERIR 25 MEMBROS
INSERT INTO members (
    name, phone, instagram, cep, city, sector, referrer, registration_date, status,
    couple_name, couple_phone, couple_instagram, couple_cep, couple_city, couple_sector,
    contracts_completed, ranking_status, is_top_1500, can_be_replaced, is_friend, campaign,
    created_at, updated_at
) VALUES 
('Membro 01', '62999990001', '@membro01', '74000001', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 01', '62999990002', '@parceiro01', '74000001', 'Goiânia', 'Centro', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 02', '62999990003', '@membro02', '74000002', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 02', '62999990004', '@parceiro02', '74000002', 'Goiânia', 'Setor Sul', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 03', '62999990005', '@membro03', '74000003', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 03', '62999990006', '@parceiro03', '74000003', 'Goiânia', 'Setor Norte', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 04', '62999990007', '@membro04', '74000004', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 04', '62999990008', '@parceiro04', '74000004', 'Goiânia', 'Setor Leste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 05', '62999990009', '@membro05', '74000005', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 05', '62999990010', '@parceiro05', '74000005', 'Goiânia', 'Setor Oeste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 06', '62999990011', '@membro06', '74000006', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 06', '62999990012', '@parceiro06', '74000006', 'Goiânia', 'Setor Coimbra', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 07', '62999990013', '@membro07', '74000007', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 07', '62999990014', '@parceiro07', '74000007', 'Goiânia', 'Setor Bueno', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 08', '62999990015', '@membro08', '74000008', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 08', '62999990016', '@parceiro08', '74000008', 'Goiânia', 'Setor Marista', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 09', '62999990017', '@membro09', '74000009', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 09', '62999990018', '@parceiro09', '74000009', 'Goiânia', 'Setor Aeroporto', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 10', '62999990019', '@membro10', '74000010', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 10', '62999990020', '@parceiro10', '74000010', 'Goiânia', 'Setor Jardim América', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 11', '62999990021', '@membro11', '74000011', 'Goiânia', 'Setor Vila Nova', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 11', '62999990022', '@parceiro11', '74000011', 'Goiânia', 'Setor Vila Nova', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 12', '62999990023', '@membro12', '74000012', 'Goiânia', 'Setor Campinas', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 12', '62999990024', '@parceiro12', '74000012', 'Goiânia', 'Setor Campinas', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 13', '62999990025', '@membro13', '74000013', 'Goiânia', 'Setor Pedro Ludovico', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 13', '62999990026', '@parceiro13', '74000013', 'Goiânia', 'Setor Pedro Ludovico', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 14', '62999990027', '@membro14', '74000014', 'Goiânia', 'Setor Finsocial', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 14', '62999990028', '@parceiro14', '74000014', 'Goiânia', 'Setor Finsocial', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 15', '62999990029', '@membro15', '74000015', 'Goiânia', 'Setor Universitário', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 15', '62999990030', '@parceiro15', '74000015', 'Goiânia', 'Setor Universitário', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 16', '62999990031', '@membro16', '74000016', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 16', '62999990032', '@parceiro16', '74000016', 'Goiânia', 'Setor Oeste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 17', '62999990033', '@membro17', '74000017', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 17', '62999990034', '@parceiro17', '74000017', 'Goiânia', 'Setor Sul', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 18', '62999990035', '@membro18', '74000018', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 18', '62999990036', '@parceiro18', '74000018', 'Goiânia', 'Setor Norte', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 19', '62999990037', '@membro19', '74000019', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 19', '62999990038', '@parceiro19', '74000019', 'Goiânia', 'Setor Leste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 20', '62999990039', '@membro20', '74000020', 'Goiânia', 'Setor Centro', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 20', '62999990040', '@parceiro20', '74000020', 'Goiânia', 'Setor Centro', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 21', '62999990041', '@membro21', '74000021', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 21', '62999990042', '@parceiro21', '74000021', 'Goiânia', 'Setor Coimbra', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 22', '62999990043', '@membro22', '74000022', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 22', '62999990044', '@parceiro22', '74000022', 'Goiânia', 'Setor Bueno', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 23', '62999990045', '@membro23', '74000023', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 23', '62999990046', '@parceiro23', '74000023', 'Goiânia', 'Setor Marista', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 24', '62999990047', '@membro24', '74000024', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 24', '62999990048', '@parceiro24', '74000024', 'Goiânia', 'Setor Aeroporto', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Membro 25', '62999990049', '@membro25', '74000025', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Parceiro 25', '62999990050', '@parceiro25', '74000025', 'Goiânia', 'Setor Jardim América', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW());

-- 2. INSERIR 25 AMIGOS
INSERT INTO friends (
    member_id, name, phone, instagram, city, sector, referrer, registration_date, status,
    couple_name, couple_phone, couple_instagram, couple_city, couple_sector,
    contracts_completed, ranking_position, ranking_status, is_top_1500, can_be_replaced, campaign,
    created_at, updated_at
) VALUES 
((SELECT id FROM members WHERE name = 'Membro 01' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 01', '62999990101', '@amigo01', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Amiga 01', '62999990102', '@amiga01', 'Goiânia', 'Centro', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 02' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 02', '62999990103', '@amigo02', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Amiga 02', '62999990104', '@amiga02', 'Goiânia', 'Setor Sul', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 03' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 03', '62999990105', '@amigo03', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Amiga 03', '62999990106', '@amiga03', 'Goiânia', 'Setor Norte', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 04' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 04', '62999990107', '@amigo04', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Amiga 04', '62999990108', '@amiga04', 'Goiânia', 'Setor Leste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 05' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 05', '62999990109', '@amigo05', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Amiga 05', '62999990110', '@amiga05', 'Goiânia', 'Setor Oeste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 06' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 06', '62999990111', '@amigo06', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Amiga 06', '62999990112', '@amiga06', 'Goiânia', 'Setor Coimbra', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 07' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 07', '62999990113', '@amigo07', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Amiga 07', '62999990114', '@amiga07', 'Goiânia', 'Setor Bueno', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 08' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 08', '62999990115', '@amigo08', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Amiga 08', '62999990116', '@amiga08', 'Goiânia', 'Setor Marista', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 09' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 09', '62999990117', '@amigo09', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Amiga 09', '62999990118', '@amiga09', 'Goiânia', 'Setor Aeroporto', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 10' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 10', '62999990119', '@amigo10', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Amiga 10', '62999990120', '@amiga10', 'Goiânia', 'Setor Jardim América', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 11' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 11', '62999990121', '@amigo11', 'Goiânia', 'Setor Vila Nova', 'admin_gratis', NOW(), 'Ativo', 'Amiga 11', '62999990122', '@amiga11', 'Goiânia', 'Setor Vila Nova', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 12' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 12', '62999990123', '@amigo12', 'Goiânia', 'Setor Campinas', 'admin_gratis', NOW(), 'Ativo', 'Amiga 12', '62999990124', '@amiga12', 'Goiânia', 'Setor Campinas', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 13' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 13', '62999990125', '@amigo13', 'Goiânia', 'Setor Pedro Ludovico', 'admin_gratis', NOW(), 'Ativo', 'Amiga 13', '62999990126', '@amiga13', 'Goiânia', 'Setor Pedro Ludovico', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 14' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 14', '62999990127', '@amigo14', 'Goiânia', 'Setor Finsocial', 'admin_gratis', NOW(), 'Ativo', 'Amiga 14', '62999990128', '@amiga14', 'Goiânia', 'Setor Finsocial', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 15' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 15', '62999990129', '@amigo15', 'Goiânia', 'Setor Universitário', 'admin_gratis', NOW(), 'Ativo', 'Amiga 15', '62999990130', '@amiga15', 'Goiânia', 'Setor Universitário', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 16' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 16', '62999990131', '@amigo16', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Amiga 16', '62999990132', '@amiga16', 'Goiânia', 'Setor Oeste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 17' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 17', '62999990133', '@amigo17', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Amiga 17', '62999990134', '@amiga17', 'Goiânia', 'Setor Sul', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 18' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 18', '62999990135', '@amigo18', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Amiga 18', '62999990136', '@amiga18', 'Goiânia', 'Setor Norte', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 19' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 19', '62999990137', '@amigo19', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Amiga 19', '62999990138', '@amiga19', 'Goiânia', 'Setor Leste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 20' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 20', '62999990139', '@amigo20', 'Goiânia', 'Setor Centro', 'admin_gratis', NOW(), 'Ativo', 'Amiga 20', '62999990140', '@amiga20', 'Goiânia', 'Setor Centro', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 21' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 21', '62999990141', '@amigo21', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Amiga 21', '62999990142', '@amiga21', 'Goiânia', 'Setor Coimbra', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 22' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 22', '62999990143', '@amigo22', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Amiga 22', '62999990144', '@amiga22', 'Goiânia', 'Setor Bueno', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 23' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 23', '62999990145', '@amigo23', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Amiga 23', '62999990146', '@amiga23', 'Goiânia', 'Setor Marista', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 24' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 24', '62999990147', '@amigo24', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Amiga 24', '62999990148', '@amiga24', 'Goiânia', 'Setor Aeroporto', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Membro 25' AND campaign = 'GRATIS' LIMIT 1), 'Amigo 25', '62999990149', '@amigo25', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Amiga 25', '62999990150', '@amiga25', 'Goiânia', 'Setor Jardim América', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW());

-- 3. VERIFICAR RESULTADO FINAL
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

-- 4. LIMPAR DADOS DE TESTE (quando necessário)
/*
DELETE FROM friends WHERE campaign = 'GRATIS' AND name LIKE 'Amigo %';
DELETE FROM members WHERE campaign = 'GRATIS' AND name LIKE 'Membro %';
*/
