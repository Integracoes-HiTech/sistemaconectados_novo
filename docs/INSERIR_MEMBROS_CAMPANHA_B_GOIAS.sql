-- ========================================
-- INSERIR MEMBROS DE TESTE - CAMPANHA B
-- ========================================
-- Inserir 20 membros de teste para apresentação
-- Campaign: B (admin_b)
-- Estado: Goiás (diversos CEPs e cidades)
-- ========================================

-- PASSO 1: Verificar estrutura da tabela campaigns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- PASSO 2: Buscar campanhas existentes
SELECT id, name, code, created_at
FROM campaigns
ORDER BY code;

-- NOTA: A coluna 'campaign' nas tabelas aceita tanto o UUID da campanha
-- quanto o code (ex: 'B', 'A') dependendo de como foi configurado

-- PASSO 3: Inserir 20 membros com dados variados de Goiás
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
-- Goiânia (CEPs 74xxx-xxx)
('João Silva Santos', '(62) 98765-4321', '@joaosilva', '74000-000', 'Goiânia', 'Setor Central', 'Admin B', CURRENT_DATE - INTERVAL '10 days', 'Ativo', 'B', 'Maria Silva', '(62) 98765-4322', '@mariasilva', '74000-001', 'Goiânia', 'Setor Central', 3, 'Verde', false, false, false),
('Pedro Oliveira', '(62) 99876-5432', '@pedrooliveira', '74120-000', 'Goiânia', 'Setor Bueno', 'Admin B', CURRENT_DATE - INTERVAL '9 days', 'Ativo', 'B', 'Ana Oliveira', '(62) 99876-5433', '@anaoliveira', '74120-001', 'Goiânia', 'Setor Bueno', 5, 'Verde', false, false, false),
('Carlos Eduardo', '(62) 98111-2233', '@carlosedu', '74175-000', 'Goiânia', 'Setor Marista', 'Admin B', CURRENT_DATE - INTERVAL '8 days', 'Ativo', 'B', 'Juliana Eduardo', '(62) 98111-2234', '@julianaedu', '74175-001', 'Goiânia', 'Setor Marista', 2, 'Amarelo', false, false, false),
('Rafael Costa', '(62) 97222-3344', '@rafaelcosta', '74230-000', 'Goiânia', 'Setor Oeste', 'Admin B', CURRENT_DATE - INTERVAL '7 days', 'Ativo', 'B', 'Fernanda Costa', '(62) 97222-3345', '@fernandacosta', '74230-001', 'Goiânia', 'Setor Oeste', 4, 'Verde', false, false, false),

-- Aparecida de Goiânia (CEPs 74xxx-xxx)
('Lucas Mendes', '(62) 96333-4455', '@lucasmendes', '74920-000', 'Aparecida de Goiânia', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '6 days', 'Ativo', 'B', 'Camila Mendes', '(62) 96333-4456', '@camilamendes', '74920-001', 'Aparecida de Goiânia', 'Centro', 1, 'Vermelho', false, false, false),
('Bruno Alves', '(62) 95444-5566', '@brunoalves', '74968-000', 'Aparecida de Goiânia', 'Papillon Park', 'Admin B', CURRENT_DATE - INTERVAL '5 days', 'Ativo', 'B', 'Patricia Alves', '(62) 95444-5567', '@patriciaalves', '74968-001', 'Aparecida de Goiânia', 'Papillon Park', 6, 'Verde', false, false, false),

-- Anápolis (CEPs 75xxx-xxx)
('Marcos Ferreira', '(62) 94555-6677', '@marcosferreira', '75000-000', 'Anápolis', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '4 days', 'Ativo', 'B', 'Renata Ferreira', '(62) 94555-6678', '@renataferreira', '75000-001', 'Anápolis', 'Centro', 7, 'Verde', true, false, false),
('Gabriel Santos', '(62) 93666-7788', '@gabrielsantos', '75110-000', 'Anápolis', 'Jundiaí', 'Admin B', CURRENT_DATE - INTERVAL '3 days', 'Ativo', 'B', 'Larissa Santos', '(62) 93666-7789', '@larissasantos', '75110-001', 'Anápolis', 'Jundiaí', 3, 'Verde', false, false, false),

-- Rio Verde (CEPs 75xxx-xxx)
('Thiago Rodrigues', '(64) 92777-8899', '@thiagorodrigues', '75900-000', 'Rio Verde', 'Centro', 'Admin B', CURRENT_DATE - INTERVAL '2 days', 'Ativo', 'B', 'Amanda Rodrigues', '(64) 92777-8800', '@amandarodrigues', '75900-001', 'Rio Verde', 'Centro', 8, 'Verde', true, false, false),
('Felipe Souza', '(64) 91888-9900', '@felipesouza', '75901-000', 'Rio Verde', 'Jardim América', 'Admin B', CURRENT_DATE - INTERVAL '1 day', 'Ativo', 'B', 'Beatriz Souza', '(64) 91888-9901', '@beatrizsouza', '75901-001', 'Rio Verde', 'Jardim América', 4, 'Verde', false, false, false),

-- Catalão (CEPs 75xxx-xxx)
('André Lima', '(64) 99111-0011', '@andrelima', '75700-000', 'Catalão', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Carla Lima', '(64) 99111-0012', '@carlalima', '75700-001', 'Catalão', 'Centro', 2, 'Amarelo', false, false, false),
('Ricardo Pereira', '(64) 98222-1122', '@ricardopereira', '75704-000', 'Catalão', 'Novo Horizonte', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Daniela Pereira', '(64) 98222-1123', '@danielapereira', '75704-001', 'Catalão', 'Novo Horizonte', 5, 'Verde', false, false, false),

-- Itumbiara (CEPs 75xxx-xxx)
('Gustavo Martins', '(64) 97333-2233', '@gustavomartins', '75500-000', 'Itumbiara', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Bruna Martins', '(64) 97333-2234', '@brunamartins', '75500-001', 'Itumbiara', 'Centro', 3, 'Verde', false, false, false),
('Rodrigo Barbosa', '(64) 96444-3344', '@rodrigobarbosa', '75520-000', 'Itumbiara', 'Setor Norte', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Tatiana Barbosa', '(64) 96444-3345', '@tatianabarbosa', '75520-001', 'Itumbiara', 'Setor Norte', 9, 'Verde', true, false, false),

-- Jataí (CEPs 75xxx-xxx)
('Leandro Dias', '(64) 95555-4455', '@leandrodias', '75800-000', 'Jataí', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Vanessa Dias', '(64) 95555-4456', '@vanessadias', '75800-001', 'Jataí', 'Centro', 1, 'Vermelho', false, false, false),
('Fábio Rocha', '(64) 94666-5566', '@fabiorocha', '75801-000', 'Jataí', 'Setor Aeroporto', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Letícia Rocha', '(64) 94666-5567', '@leticiarocha', '75801-001', 'Jataí', 'Setor Aeroporto', 6, 'Verde', false, false, false),

-- Luziânia (CEPs 72xxx-xxx)
('Mateus Cardoso', '(61) 93777-6677', '@mateuscardoso', '72800-000', 'Luziânia', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Isabela Cardoso', '(61) 93777-6678', '@isabelacardoso', '72800-001', 'Luziânia', 'Centro', 7, 'Verde', true, false, false),
('Vinicius Gomes', '(61) 92888-7788', '@viniciusgomes', '72811-000', 'Luziânia', 'Jardim Ingá', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Gabriela Gomes', '(61) 92888-7789', '@gabrielagomes', '72811-001', 'Luziânia', 'Jardim Ingá', 4, 'Verde', false, false, false),

-- Formosa (CEPs 73xxx-xxx)
('Alexandre Nunes', '(61) 91999-8899', '@alexandrenunes', '73800-000', 'Formosa', 'Centro', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Priscila Nunes', '(61) 91999-8800', '@priscilanunes', '73800-001', 'Formosa', 'Centro', 2, 'Amarelo', false, false, false),
('Daniel Carvalho', '(61) 99000-9900', '@danielcarvalho', '73801-000', 'Formosa', 'JK', 'Admin B', CURRENT_DATE, 'Ativo', 'B', 'Aline Carvalho', '(61) 99000-9901', '@alinecarvalho', '73801-001', 'Formosa', 'JK', 10, 'Verde', true, false, false);

-- PASSO 4: Verificar quantos membros foram inseridos
SELECT 
    COUNT(*) as total_membros_campanha_b,
    COUNT(DISTINCT city) as total_cidades,
    COUNT(*) FILTER (WHERE ranking_status = 'Verde') as verde,
    COUNT(*) FILTER (WHERE ranking_status = 'Amarelo') as amarelo,
    COUNT(*) FILTER (WHERE ranking_status = 'Vermelho') as vermelho,
    COUNT(*) FILTER (WHERE is_top_1500 = true) as top_1500
FROM members
WHERE campaign = 'B';

-- PASSO 5: Listar membros inseridos por cidade
SELECT 
    city as cidade,
    COUNT(*) as total_membros,
    STRING_AGG(name, ', ' ORDER BY name) as membros
FROM members
WHERE campaign = 'B'
GROUP BY city
ORDER BY total_membros DESC, city;

-- PASSO 6: Ver todos os membros da campanha B
SELECT 
    id,
    name as nome,
    city as cidade,
    sector as setor,
    cep,
    phone as telefone,
    contracts_completed as contratos,
    ranking_status as status,
    is_top_1500 as top_1500,
    registration_date as data_cadastro
FROM members
WHERE campaign = 'B'
ORDER BY city, name;

-- ========================================
-- RESULTADO ESPERADO:
-- 20 membros inseridos na campanha B
-- Distribuídos em 10 cidades de Goiás:
-- - Goiânia (4 membros)
-- - Aparecida de Goiânia (2 membros)
-- - Anápolis (2 membros)
-- - Rio Verde (2 membros)
-- - Catalão (2 membros)
-- - Itumbiara (2 membros)
-- - Jataí (2 membros)
-- - Luziânia (2 membros)
-- - Formosa (2 membros)
-- ========================================

