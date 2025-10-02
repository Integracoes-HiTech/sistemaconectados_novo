-- =====================================================
-- INSERIR DADOS DE EXEMPLO PARA TESTES
-- =====================================================

-- 1. Inserir membros de exemplo
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
);

-- 2. Inserir amigos de exemplo
INSERT INTO friends (
    name, phone, instagram, city, sector, referrer,
    registration_date, status, campaign,
    couple_name, couple_phone, couple_city, couple_sector, couple_instagram
) VALUES 
(
    'Roberto Lima', '62933333333', '@robertolima', 'Goiânia', 'Setor Oeste', 'João Silva',
    '2024-01-18', 'Ativo', 'A',
    'Fernanda Lima', '62922222222', 'Goiânia', 'Setor Oeste', '@fernandalima'
),
(
    'Marcos Costa', '62911111111', '@marcoscosta', 'Aparecida de Goiânia', 'Setor 2', 'Pedro Santos',
    '2024-01-19', 'Ativo', 'A',
    'Patricia Costa', '62900000000', 'Aparecida de Goiânia', 'Setor 2', '@patriciacosta'
);

-- 3. Verificar se os dados foram inseridos
SELECT 'Membros inseridos' as tipo, COUNT(*) as total FROM members WHERE status = 'Ativo'
UNION ALL
SELECT 'Amigos inseridos' as tipo, COUNT(*) as total FROM friends WHERE status = 'Ativo';

-- 4. Verificar dados específicos
SELECT 
    'Membros' as tabela,
    name,
    phone,
    city,
    sector,
    referrer
FROM members 
WHERE status = 'Ativo'
ORDER BY name

UNION ALL

SELECT 
    'Amigos' as tabela,
    name,
    phone,
    city,
    sector,
    referrer
FROM friends 
WHERE status = 'Ativo'
ORDER BY name;
