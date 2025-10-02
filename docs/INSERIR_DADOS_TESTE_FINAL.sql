-- =====================================================
-- INSERIR DADOS DE TESTE PARA FUNCIONAMENTO NORMAL
-- =====================================================

-- 1. Inserir membros de exemplo para Campanha A
INSERT INTO members (
    name, phone, instagram, city, sector, referrer, 
    registration_date, status, campaign,
    couple_name, couple_phone, couple_city, couple_sector, couple_instagram
) VALUES 
(
    'João Silva', '62999999999', '@joaosilva', 'Goiânia', 'Setor Central', 'Admin',
    '2024-01-15', 'Ativo', 'A',
    'Maria Silva', '62988888888', 'Goiânia', 'Setor Central', '@mariasilva'
),
(
    'Pedro Santos', '62977777777', '@pedrosantos', 'Aparecida de Goiânia', 'Setor 1', 'Admin',
    '2024-01-16', 'Ativo', 'A',
    'Ana Santos', '62966666666', 'Aparecida de Goiânia', 'Setor 1', '@anasantos'
),
(
    'Carlos Oliveira', '62955555555', '@carlosoliveira', 'Goiânia', 'Setor Sul', 'Admin',
    '2024-01-17', 'Ativo', 'A',
    'Lucia Oliveira', '62944444444', 'Goiânia', 'Setor Sul', '@luciaoliveira'
),
(
    'Roberto Lima', '62933333333', '@robertolima', 'Goiânia', 'Setor Oeste', 'João Silva',
    '2024-01-18', 'Ativo', 'A',
    'Fernanda Lima', '62922222222', 'Goiânia', 'Setor Oeste', '@fernandalima'
);

-- 2. Inserir amigos de exemplo para Campanha A
INSERT INTO friends (
    name, phone, instagram, city, sector, referrer,
    registration_date, status, campaign,
    couple_name, couple_phone, couple_city, couple_sector, couple_instagram
) VALUES 
(
    'Marcos Costa', '62911111111', '@marcoscosta', 'Aparecida de Goiânia', 'Setor 2', 'Pedro Santos',
    '2024-01-19', 'Ativo', 'A',
    'Patricia Costa', '62900000000', 'Aparecida de Goiânia', 'Setor 2', '@patriciacosta'
),
(
    'Lucas Pereira', '62899999999', '@lucaspereira', 'Goiânia', 'Setor Norte', 'Carlos Oliveira',
    '2024-01-20', 'Ativo', 'A',
    'Camila Pereira', '62888888888', 'Goiânia', 'Setor Norte', '@camilapereira'
);

-- 3. Inserir membros de exemplo para Campanha B
INSERT INTO members (
    name, phone, instagram, city, sector, referrer, 
    registration_date, status, campaign,
    couple_name, couple_phone, couple_city, couple_sector, couple_instagram
) VALUES 
(
    'Bruno Almeida', '62777777777', '@brunoalmeida', 'Goiânia', 'Setor Leste', 'Admin B',
    '2024-01-21', 'Ativo', 'B',
    'Juliana Almeida', '62766666666', 'Goiânia', 'Setor Leste', '@julianaalmeida'
),
(
    'Diego Souza', '62755555555', '@diegosouza', 'Aparecida de Goiânia', 'Setor 3', 'Admin B',
    '2024-01-22', 'Ativo', 'B',
    'Renata Souza', '62744444444', 'Aparecida de Goiânia', 'Setor 3', '@renatasouza'
);

-- 4. Inserir amigos de exemplo para Campanha B
INSERT INTO friends (
    name, phone, instagram, city, sector, referrer,
    registration_date, status, campaign,
    couple_name, couple_phone, couple_city, couple_sector, couple_instagram
) VALUES 
(
    'Gabriel Martins', '62733333333', '@gabrielmartins', 'Goiânia', 'Setor Sudoeste', 'Bruno Almeida',
    '2024-01-23', 'Ativo', 'B',
    'Isabela Martins', '62722222222', 'Goiânia', 'Setor Sudoeste', '@isabelamartins'
);

-- 5. Verificar dados inseridos
SELECT 
    'Membros Campanha A' as tipo,
    COUNT(*) as total
FROM members 
WHERE campaign = 'A' AND status = 'Ativo'

UNION ALL

SELECT 
    'Amigos Campanha A' as tipo,
    COUNT(*) as total
FROM friends 
WHERE campaign = 'A' AND status = 'Ativo'

UNION ALL

SELECT 
    'Membros Campanha B' as tipo,
    COUNT(*) as total
FROM members 
WHERE campaign = 'B' AND status = 'Ativo'

UNION ALL

SELECT 
    'Amigos Campanha B' as tipo,
    COUNT(*) as total
FROM friends 
WHERE campaign = 'B' AND status = 'Ativo';

-- 6. Verificar dados específicos
SELECT 
    'Membros' as tabela,
    name,
    city,
    sector,
    campaign,
    referrer
FROM members 
WHERE status = 'Ativo'
ORDER BY campaign, name

UNION ALL

SELECT 
    'Amigos' as tabela,
    name,
    city,
    sector,
    campaign,
    referrer
FROM friends 
WHERE status = 'Ativo'
ORDER BY campaign, name;
