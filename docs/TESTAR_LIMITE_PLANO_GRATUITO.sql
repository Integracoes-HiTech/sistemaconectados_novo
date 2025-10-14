-- Script para testar limite do plano Gratuito
-- Inserir 25 membros + 25 amigos = 50 usuários total

-- 1. Verificar campanhas com plano Gratuito
SELECT 
    code,
    name,
    nome_plano,
    is_active,
    created_at
FROM campaigns 
WHERE nome_plano ILIKE '%gratuito%'
ORDER BY created_at DESC;

-- 2. Verificar quantos membros já existem na campanha Gratuito
SELECT 
    campaign,
    COUNT(*) as total_membros,
    COUNT(*) FILTER (WHERE status = 'Ativo') as membros_ativos,
    COUNT(*) FILTER (WHERE status = 'Inativo') as membros_inativos
FROM members 
WHERE campaign = 'GRATIS' -- Substitua pelo código correto da campanha Gratuito
GROUP BY campaign;

-- 3. Verificar quantos amigos já existem na campanha Gratuito
SELECT 
    campaign,
    COUNT(*) as total_amigos,
    COUNT(*) FILTER (WHERE status = 'Ativo') as amigos_ativos,
    COUNT(*) FILTER (WHERE status = 'Inativo') as amigos_inativos
FROM friends 
WHERE campaign = 'GRATIS' -- Substitua pelo código correto da campanha Gratuito
GROUP BY campaign;

-- 4. INSERIR 25 MEMBROS PARA TESTE (substitua 'GRATIS' pelo código correto)
-- DESCOMENTE E AJUSTE OS VALORES ABAIXO:

/*
-- Inserir 25 membros com CEPs válidos de Goiás
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
-- Membros 1-5
('João Silva', '62999990001', '@joao_silva', '74000001', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Maria Silva', '62999990002', '@maria_silva', '74000001', 'Goiânia', 'Centro', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Pedro Santos', '62999990003', '@pedro_santos', '74000002', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Ana Santos', '62999990004', '@ana_santos', '74000002', 'Goiânia', 'Setor Sul', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Carlos Oliveira', '62999990005', '@carlos_oliveira', '74000003', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Lucia Oliveira', '62999990006', '@lucia_oliveira', '74000003', 'Goiânia', 'Setor Norte', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Roberto Lima', '62999990007', '@roberto_lima', '74000004', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Fernanda Lima', '62999990008', '@fernanda_lima', '74000004', 'Goiânia', 'Setor Leste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Marcos Costa', '62999990009', '@marcos_costa', '74000005', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Patricia Costa', '62999990010', '@patricia_costa', '74000005', 'Goiânia', 'Setor Oeste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),

-- Membros 6-10
('Antonio Ferreira', '62999990011', '@antonio_ferreira', '74000006', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Sandra Ferreira', '62999990012', '@sandra_ferreira', '74000006', 'Goiânia', 'Setor Coimbra', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Jose Almeida', '62999990013', '@jose_almeida', '74000007', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Cristina Almeida', '62999990014', '@cristina_almeida', '74000007', 'Goiânia', 'Setor Bueno', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Francisco Souza', '62999990015', '@francisco_souza', '74000008', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Beatriz Souza', '62999990016', '@beatriz_souza', '74000008', 'Goiânia', 'Setor Marista', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Paulo Rodrigues', '62999990017', '@paulo_rodrigues', '74000009', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Juliana Rodrigues', '62999990018', '@juliana_rodrigues', '74000009', 'Goiânia', 'Setor Aeroporto', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Rafael Barbosa', '62999990019', '@rafael_barbosa', '74000010', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Camila Barbosa', '62999990020', '@camila_barbosa', '74000010', 'Goiânia', 'Setor Jardim América', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),

-- Membros 11-15
('Diego Nascimento', '62999990021', '@diego_nascimento', '74000011', 'Goiânia', 'Setor Vila Nova', 'admin_gratis', NOW(), 'Ativo', 'Gabriela Nascimento', '62999990022', '@gabriela_nascimento', '74000011', 'Goiânia', 'Setor Vila Nova', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Felipe Cardoso', '62999990023', '@felipe_cardoso', '74000012', 'Goiânia', 'Setor Campinas', 'admin_gratis', NOW(), 'Ativo', 'Larissa Cardoso', '62999990024', '@larissa_cardoso', '74000012', 'Goiânia', 'Setor Campinas', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Bruno Mendes', '62999990025', '@bruno_mendes', '74000013', 'Goiânia', 'Setor Pedro Ludovico', 'admin_gratis', NOW(), 'Ativo', 'Isabela Mendes', '62999990026', '@isabela_mendes', '74000013', 'Goiânia', 'Setor Pedro Ludovico', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Thiago Rocha', '62999990027', '@thiago_rocha', '74000014', 'Goiânia', 'Setor Finsocial', 'admin_gratis', NOW(), 'Ativo', 'Mariana Rocha', '62999990028', '@mariana_rocha', '74000014', 'Goiânia', 'Setor Finsocial', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Lucas Pereira', '62999990029', '@lucas_pereira', '74000015', 'Goiânia', 'Setor Universitário', 'admin_gratis', NOW(), 'Ativo', 'Amanda Pereira', '62999990030', '@amanda_pereira', '74000015', 'Goiânia', 'Setor Universitário', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),

-- Membros 16-20
('Gabriel Martins', '62999990031', '@gabriel_martins', '74000016', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Natália Martins', '62999990032', '@natalia_martins', '74000016', 'Goiânia', 'Setor Oeste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Henrique Gomes', '62999990033', '@henrique_gomes', '74000017', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Carolina Gomes', '62999990034', '@carolina_gomes', '74000017', 'Goiânia', 'Setor Sul', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Matheus Dias', '62999990035', '@matheus_dias', '74000018', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Leticia Dias', '62999990036', '@leticia_dias', '74000018', 'Goiânia', 'Setor Norte', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Vinicius Campos', '62999990037', '@vinicius_campos', '74000019', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Renata Campos', '62999990038', '@renata_campos', '74000019', 'Goiânia', 'Setor Leste', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('André Lopes', '62999990039', '@andre_lopes', '74000020', 'Goiânia', 'Setor Centro', 'admin_gratis', NOW(), 'Ativo', 'Vanessa Lopes', '62999990040', '@vanessa_lopes', '74000020', 'Goiânia', 'Setor Centro', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),

-- Membros 21-25
('Rodrigo Teixeira', '62999990041', '@rodrigo_teixeira', '74000021', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Priscila Teixeira', '62999990042', '@priscila_teixeira', '74000021', 'Goiânia', 'Setor Coimbra', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Leandro Moreira', '62999990043', '@leandro_moreira', '74000022', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Tatiana Moreira', '62999990044', '@tatiana_moreira', '74000022', 'Goiânia', 'Setor Bueno', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Eduardo Castro', '62999990045', '@eduardo_castro', '74000023', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Monique Castro', '62999990046', '@monique_castro', '74000023', 'Goiânia', 'Setor Marista', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Gustavo Araújo', '62999990047', '@gustavo_araujo', '74000024', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Bianca Araújo', '62999990048', '@bianca_araujo', '74000024', 'Goiânia', 'Setor Aeroporto', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW()),
('Daniel Monteiro', '62999990049', '@daniel_monteiro', '74000025', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Raquel Monteiro', '62999990050', '@raquel_monteiro', '74000025', 'Goiânia', 'Setor Jardim América', 0, 'Vermelho', false, false, false, 'GRATIS', NOW(), NOW());
*/

-- 5. INSERIR 25 AMIGOS PARA TESTE (substitua 'GRATIS' pelo código correto)
-- DESCOMENTE E AJUSTE OS VALORES ABAIXO:

/*
-- Inserir 25 amigos (vinculados aos membros acima)
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
-- Amigos 1-5 (vinculados aos primeiros 5 membros)
((SELECT id FROM members WHERE name = 'João Silva' AND campaign = 'GRATIS' LIMIT 1), 'Carlos Amigo1', '62999990101', '@carlos_amigo1', 'Goiânia', 'Centro', 'admin_gratis', NOW(), 'Ativo', 'Sofia Amigo1', '62999990102', '@sofia_amigo1', 'Goiânia', 'Centro', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Pedro Santos' AND campaign = 'GRATIS' LIMIT 1), 'Miguel Amigo2', '62999990103', '@miguel_amigo2', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Valentina Amigo2', '62999990104', '@valentina_amigo2', 'Goiânia', 'Setor Sul', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Carlos Oliveira' AND campaign = 'GRATIS' LIMIT 1), 'Arthur Amigo3', '62999990105', '@arthur_amigo3', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Helena Amigo3', '62999990106', '@helena_amigo3', 'Goiânia', 'Setor Norte', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Roberto Lima' AND campaign = 'GRATIS' LIMIT 1), 'Bernardo Amigo4', '62999990107', '@bernardo_amigo4', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Alice Amigo4', '62999990108', '@alice_amigo4', 'Goiânia', 'Setor Leste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Marcos Costa' AND campaign = 'GRATIS' LIMIT 1), 'Heitor Amigo5', '62999990109', '@heitor_amigo5', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Laura Amigo5', '62999990110', '@laura_amigo5', 'Goiânia', 'Setor Oeste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),

-- Amigos 6-10
((SELECT id FROM members WHERE name = 'Antonio Ferreira' AND campaign = 'GRATIS' LIMIT 1), 'Davi Amigo6', '62999990111', '@davi_amigo6', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Manuela Amigo6', '62999990112', '@manuela_amigo6', 'Goiânia', 'Setor Coimbra', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Jose Almeida' AND campaign = 'GRATIS' LIMIT 1), 'Lorenzo Amigo7', '62999990113', '@lorenzo_amigo7', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Sophia Amigo7', '62999990114', '@sophia_amigo7', 'Goiânia', 'Setor Bueno', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Francisco Souza' AND campaign = 'GRATIS' LIMIT 1), 'Theo Amigo8', '62999990115', '@theo_amigo8', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Isabella Amigo8', '62999990116', '@isabella_amigo8', 'Goiânia', 'Setor Marista', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Paulo Rodrigues' AND campaign = 'GRATIS' LIMIT 1), 'Pedro Amigo9', '62999990117', '@pedro_amigo9', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Luiza Amigo9', '62999990118', '@luiza_amigo9', 'Goiânia', 'Setor Aeroporto', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Rafael Barbosa' AND campaign = 'GRATIS' LIMIT 1), 'Gabriel Amigo10', '62999990119', '@gabriel_amigo10', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Cecília Amigo10', '62999990120', '@cecilia_amigo10', 'Goiânia', 'Setor Jardim América', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),

-- Amigos 11-15
((SELECT id FROM members WHERE name = 'Diego Nascimento' AND campaign = 'GRATIS' LIMIT 1), 'Benjamin Amigo11', '62999990121', '@benjamin_amigo11', 'Goiânia', 'Setor Vila Nova', 'admin_gratis', NOW(), 'Ativo', 'Eloá Amigo11', '62999990122', '@eloa_amigo11', 'Goiânia', 'Setor Vila Nova', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Felipe Cardoso' AND campaign = 'GRATIS' LIMIT 1), 'Matheus Amigo12', '62999990123', '@matheus_amigo12', 'Goiânia', 'Setor Campinas', 'admin_gratis', NOW(), 'Ativo', 'Lívia Amigo12', '62999990124', '@livia_amigo12', 'Goiânia', 'Setor Campinas', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Bruno Mendes' AND campaign = 'GRATIS' LIMIT 1), 'Rafael Amigo13', '62999990125', '@rafael_amigo13', 'Goiânia', 'Setor Pedro Ludovico', 'admin_gratis', NOW(), 'Ativo', 'Giovanna Amigo13', '62999990126', '@giovanna_amigo13', 'Goiânia', 'Setor Pedro Ludovico', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Thiago Rocha' AND campaign = 'GRATIS' LIMIT 1), 'Nicolas Amigo14', '62999990127', '@nicolas_amigo14', 'Goiânia', 'Setor Finsocial', 'admin_gratis', NOW(), 'Ativo', 'Lara Amigo14', '62999990128', '@lara_amigo14', 'Goiânia', 'Setor Finsocial', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Lucas Pereira' AND campaign = 'GRATIS' LIMIT 1), 'Samuel Amigo15', '62999990129', '@samuel_amigo15', 'Goiânia', 'Setor Universitário', 'admin_gratis', NOW(), 'Ativo', 'Beatriz Amigo15', '62999990130', '@beatriz_amigo15', 'Goiânia', 'Setor Universitário', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),

-- Amigos 16-20
((SELECT id FROM members WHERE name = 'Gabriel Martins' AND campaign = 'GRATIS' LIMIT 1), 'João Amigo16', '62999990131', '@joao_amigo16', 'Goiânia', 'Setor Oeste', 'admin_gratis', NOW(), 'Ativo', 'Julia Amigo16', '62999990132', '@julia_amigo16', 'Goiânia', 'Setor Oeste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Henrique Gomes' AND campaign = 'GRATIS' LIMIT 1), 'Lucca Amigo17', '62999990133', '@lucca_amigo17', 'Goiânia', 'Setor Sul', 'admin_gratis', NOW(), 'Ativo', 'Lorena Amigo17', '62999990134', '@lorena_amigo17', 'Goiânia', 'Setor Sul', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Matheus Dias' AND campaign = 'GRATIS' LIMIT 1), 'Isaac Amigo18', '62999990135', '@isaac_amigo18', 'Goiânia', 'Setor Norte', 'admin_gratis', NOW(), 'Ativo', 'Liz Amigo18', '62999990136', '@liz_amigo18', 'Goiânia', 'Setor Norte', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Vinicius Campos' AND campaign = 'GRATIS' LIMIT 1), 'Anthony Amigo19', '62999990137', '@anthony_amigo19', 'Goiânia', 'Setor Leste', 'admin_gratis', NOW(), 'Ativo', 'Antonella Amigo19', '62999990138', '@antonella_amigo19', 'Goiânia', 'Setor Leste', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'André Lopes' AND campaign = 'GRATIS' LIMIT 1), 'Leonardo Amigo20', '62999990139', '@leonardo_amigo20', 'Goiânia', 'Setor Centro', 'admin_gratis', NOW(), 'Ativo', 'Maitê Amigo20', '62999990140', '@maite_amigo20', 'Goiânia', 'Setor Centro', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),

-- Amigos 21-25
((SELECT id FROM members WHERE name = 'Rodrigo Teixeira' AND campaign = 'GRATIS' LIMIT 1), 'Lucas Amigo21', '62999990141', '@lucas_amigo21', 'Goiânia', 'Setor Coimbra', 'admin_gratis', NOW(), 'Ativo', 'Esther Amigo21', '62999990142', '@esther_amigo21', 'Goiânia', 'Setor Coimbra', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Leandro Moreira' AND campaign = 'GRATIS' LIMIT 1), 'Henry Amigo22', '62999990143', '@henry_amigo22', 'Goiânia', 'Setor Bueno', 'admin_gratis', NOW(), 'Ativo', 'Pietra Amigo22', '62999990144', '@pietra_amigo22', 'Goiânia', 'Setor Bueno', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Eduardo Castro' AND campaign = 'GRATIS' LIMIT 1), 'Ryan Amigo23', '62999990145', '@ryan_amigo23', 'Goiânia', 'Setor Marista', 'admin_gratis', NOW(), 'Ativo', 'Catarina Amigo23', '62999990146', '@catarina_amigo23', 'Goiânia', 'Setor Marista', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Gustavo Araújo' AND campaign = 'GRATIS' LIMIT 1), 'Arthur Amigo24', '62999990147', '@arthur_amigo24', 'Goiânia', 'Setor Aeroporto', 'admin_gratis', NOW(), 'Ativo', 'Lavínia Amigo24', '62999990148', '@lavinia_amigo24', 'Goiânia', 'Setor Aeroporto', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW()),
((SELECT id FROM members WHERE name = 'Daniel Monteiro' AND campaign = 'GRATIS' LIMIT 1), 'Davi Amigo25', '62999990149', '@davi_amigo25', 'Goiânia', 'Setor Jardim América', 'admin_gratis', NOW(), 'Ativo', 'Alícia Amigo25', '62999990150', '@alicia_amigo25', 'Goiânia', 'Setor Jardim América', 0, null, 'Vermelho', false, false, 'GRATIS', NOW(), NOW());
*/

-- 6. VERIFICAR RESULTADO FINAL
-- DESCOMENTE APÓS EXECUTAR OS INSERTS:

/*
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
*/

-- 7. LIMPAR DADOS DE TESTE (quando necessário)
-- DESCOMENTE PARA REMOVER OS DADOS DE TESTE:

/*
DELETE FROM friends WHERE campaign = 'GRATIS' AND name LIKE '%Amigo%';
DELETE FROM members WHERE campaign = 'GRATIS' AND name IN (
    'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Roberto Lima', 'Marcos Costa',
    'Antonio Ferreira', 'Jose Almeida', 'Francisco Souza', 'Paulo Rodrigues', 'Rafael Barbosa',
    'Diego Nascimento', 'Felipe Cardoso', 'Bruno Mendes', 'Thiago Rocha', 'Lucas Pereira',
    'Gabriel Martins', 'Henrique Gomes', 'Matheus Dias', 'Vinicius Campos', 'André Lopes',
    'Rodrigo Teixeira', 'Leandro Moreira', 'Eduardo Castro', 'Gustavo Araújo', 'Daniel Monteiro'
);
*/
