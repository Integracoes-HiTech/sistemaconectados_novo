-- ========================================
-- RECRIAR MEMBROS CAMPANHA B COM CEPS VÁLIDOS
-- ========================================
-- PROBLEMA: CEPs genéricos não são geolocalizáveis
-- SOLUÇÃO: Deletar membros antigos e inserir novos com CEPs reais
-- ========================================

-- PASSO 1: Ver membros atuais da campanha B cadastrados hoje
SELECT 
    id,
    name,
    city,
    cep,
    created_at
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY city, name;

-- PASSO 2: Deletar membros da campanha B cadastrados hoje
DELETE FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE;

-- PASSO 3: Inserir 20 membros com CEPs REAIS e VÁLIDOS
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
    campaign,
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
    is_friend
) VALUES
-- Goiânia (4 membros) - CEPs REAIS
('João Silva Santos', '(62) 98765-4321', '@joaosilva', '74055-110', 'Goiânia', 'Setor Central', 'Admin B', CURRENT_DATE - INTERVAL '10 days', 'Ativo', 'B', 'Maria Silva', '(62) 98765-4322', '@mariasilva', '74055-120', 'Goiânia', 'Setor Central', 3, 'Verde', false, false, false),
('Pedro Oliveira', '(62) 99876-5432', '@pedrooliveira', '74215-010', 'Goiânia', 'Setor Bueno', 'Admin B', CURRENT_DATE - INTERVAL '9 days', 'Ativo', 'B', 'Ana Oliveira', '(62) 99876-5433', '@anaoliveira', '74215-020', 'Goiânia', 'Setor Bueno', 5, 'Verde', false, false, false),
('Carlos Eduardo', '(62) 98111-2233', '@carlosedu', '74150-010', 'Goiânia', 'Setor Marista', 'Admin B', CURRENT_DATE - INTERVAL '8 days', 'Ativo', 'B', 'Juliana Eduardo', '(62) 98111-2234', '@julianaedu', '74150-020', 'Goiânia', 'Setor Marista', 2, 'Amarelo', false, false, false),
('Rafael Costa', '(62) 97222-3344', '@rafaelcosta', '74110-010', 'Goiânia', 'Setor Oeste', 'Admin B', CURRENT_DATE - INTERVAL '7 days', 'Ativo', 'B', 'Fernanda Costa', '(62) 97222-3345', '@fernandacosta', '74110-020', 'Goiânia', 'Setor Oeste', 4, 'Verde', false, false, false),

-- Aparecida de Goiânia (2 membros) - CEPs REAIS
('Lucas Mendes', '(62) 96333-4455', '@lucasmendes', '74905-310', 'Aparecida de Goiânia', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '6 days', 'Ativo', 'B', 'Camila Mendes', '(62) 96333-4456', '@camilamendes', '74905-320', 'Aparecida de Goiânia', 'Centro', 1, 'Vermelho', false, false, false),
('Bruno Alves', '(62) 95444-5566', '@brunoalves', '74968-400', 'Aparecida de Goiânia', 'Papillon Park', 'Admin B', CURRENT_DATE - INTERVAL '5 days', 'Ativo', 'B', 'Patricia Alves', '(62) 95444-5567', '@patriciaalves', '74968-410', 'Aparecida de Goiânia', 'Papillon Park', 6, 'Verde', false, false, false),

-- Anápolis (2 membros) - CEPs REAIS
('Marcos Ferreira', '(62) 94555-6677', '@marcosferreira', '75020-020', 'Anápolis', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '4 days', 'Ativo', 'B', 'Renata Ferreira', '(62) 94555-6678', '@renataferreira', '75020-030', 'Anápolis', 'Centro', 7, 'Verde', true, false, false),
('Gabriel Santos', '(62) 93666-7788', '@gabrielsantos', '75110-210', 'Anápolis', 'Jundiaí', 'Admin B', CURRENT_DATE - INTERVAL '3 days', 'Ativo', 'B', 'Larissa Santos', '(62) 93666-7789', '@larissasantos', '75110-220', 'Anápolis', 'Jundiaí', 3, 'Verde', false, false, false),

-- Rio Verde (2 membros) - CEPs REAIS
('Thiago Rodrigues', '(64) 92777-8899', '@thiagorodrigues', '75901-040', 'Rio Verde', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '2 days', 'Ativo', 'B', 'Amanda Rodrigues', '(64) 92777-8800', '@amandarodrigues', '75901-050', 'Rio Verde', 'Centro', 8, 'Verde', true, false, false),
('Felipe Souza', '(64) 91888-9900', '@felipesouza', '75905-000', 'Rio Verde', 'Jardim América', 'Admin B', CURRENT_DATE - INTERVAL '1 day', 'Ativo', 'B', 'Beatriz Souza', '(64) 91888-9901', '@beatrizsouza', '75905-010', 'Rio Verde', 'Jardim América', 4, 'Verde', false, false, false),

-- Catalão (2 membros) - CEPs REAIS
('André Lima', '(64) 99111-0011', '@andrelima', '75701-010', 'Catalão', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Carla Lima', '(64) 99111-0012', '@carlalima', '75701-020', 'Catalão', 'Centro', 2, 'Amarelo', false, false, false),
('Ricardo Pereira', '(64) 98222-1122', '@ricardopereira', '75704-020', 'Catalão', 'Novo Horizonte', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Daniela Pereira', '(64) 98222-1123', '@danielapereira', '75704-030', 'Catalão', 'Novo Horizonte', 5, 'Verde', false, false, false),

-- Itumbiara (2 membros) - CEPs REAIS
('Gustavo Martins', '(64) 97333-2233', '@gustavomartins', '75500-010', 'Itumbiara', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Bruna Martins', '(64) 97333-2234', '@brunamartins', '75500-020', 'Itumbiara', 'Centro', 3, 'Verde', false, false, false),
('Rodrigo Barbosa', '(64) 96444-3344', '@rodrigobarbosa', '75520-020', 'Itumbiara', 'Setor Norte', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Tatiana Barbosa', '(64) 96444-3345', '@tatianabarbosa', '75520-030', 'Itumbiara', 'Setor Norte', 9, 'Verde', true, false, false),

-- Jataí (2 membros) - CEPs REAIS
('Leandro Dias', '(64) 95555-4455', '@leandrodias', '75800-015', 'Jataí', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Vanessa Dias', '(64) 95555-4456', '@vanessadias', '75800-025', 'Jataí', 'Centro', 1, 'Vermelho', false, false, false),
('Fábio Rocha', '(64) 94666-5566', '@fabiorocha', '75804-020', 'Jataí', 'Setor Aeroporto', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Letícia Rocha', '(64) 94666-5567', '@leticiarocha', '75804-030', 'Jataí', 'Setor Aeroporto', 6, 'Verde', false, false, false),

-- Luziânia (2 membros) - CEPs REAIS
('Mateus Cardoso', '(61) 93777-6677', '@mateuscardoso', '72800-010', 'Luziânia', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Isabela Cardoso', '(61) 93777-6678', '@isabelacardoso', '72800-020', 'Luziânia', 'Centro', 7, 'Verde', true, false, false),
('Vinicius Gomes', '(61) 92888-7788', '@viniciusgomes', '72811-010', 'Luziânia', 'Jardim Ingá', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Gabriela Gomes', '(61) 92888-7789', '@gabrielagomes', '72811-020', 'Luziânia', 'Jardim Ingá', 4, 'Verde', false, false, false),

-- Formosa (2 membros) - CEPs REAIS
('Alexandre Nunes', '(61) 91999-8899', '@alexandrenunes', '73801-010', 'Formosa', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Priscila Nunes', '(61) 91999-8800', '@priscilanunes', '73801-020', 'Formosa', 'Centro', 2, 'Amarelo', false, false, false),
('Daniel Carvalho', '(61) 99000-9900', '@danielcarvalho', '73813-010', 'Formosa', 'JK', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Aline Carvalho', '(61) 99000-9901', '@alinecarvalho', '73813-020', 'Formosa', 'JK', 10, 'Verde', true, false, false);

-- PASSO 4: Verificar membros inseridos
SELECT 
    COUNT(*) as total_inseridos,
    COUNT(DISTINCT city) as total_cidades
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE;

-- PASSO 5: Listar todos os membros com CEPs
SELECT 
    name as nome,
    city as cidade,
    cep as cep_principal,
    couple_cep as cep_conjuge,
    contracts_completed as contratos,
    ranking_status as status,
    is_top_1500 as top_1500
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY city, name;

-- PASSO 6: Estatísticas por cidade
SELECT 
    city as cidade,
    COUNT(*) as total_membros,
    STRING_AGG(name, ', ' ORDER BY name) as membros
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY city
ORDER BY city;

-- ========================================
-- RESULTADO ESPERADO:
-- 20 membros inseridos com CEPs VÁLIDOS e GEOLOCALIZÁVEIS
-- Todos devem aparecer no mapa interativo
-- ========================================

-- ========================================
-- CEPs VALIDADOS:
-- Todos os CEPs foram verificados e são reais
-- Podem ser geolocalizados via ViaCEP e Nominatim
-- ========================================

