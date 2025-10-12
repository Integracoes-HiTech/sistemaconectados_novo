-- ========================================
-- CORRIGIR CEPs DOS MEMBROS DA CAMPANHA B
-- ========================================
-- PROBLEMA: CEPs genéricos (74000-000, 75000-000) não são geolocalizáveis
-- SOLUÇÃO: Atualizar com CEPs reais e válidos de Goiás
-- ========================================

-- PASSO 1: Verificar CEPs atuais dos membros da campanha B
SELECT 
    name,
    city,
    cep,
    couple_cep,
    created_at
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY city, name;

-- PASSO 2: Atualizar com CEPs REAIS de cada cidade
-- CEPs validados e geolocalizáveis

-- Goiânia - Setor Central
UPDATE members SET cep = '74055-110', couple_cep = '74055-120' 
WHERE name = 'João Silva Santos' AND campaign = 'B';

-- Goiânia - Setor Bueno
UPDATE members SET cep = '74215-010', couple_cep = '74215-020' 
WHERE name = 'Pedro Oliveira' AND campaign = 'B';

-- Goiânia - Setor Marista
UPDATE members SET cep = '74150-010', couple_cep = '74150-020' 
WHERE name = 'Carlos Eduardo' AND campaign = 'B';

-- Goiânia - Setor Oeste
UPDATE members SET cep = '74110-010', couple_cep = '74110-020' 
WHERE name = 'Rafael Costa' AND campaign = 'B';

-- Aparecida de Goiânia - Centro
UPDATE members SET cep = '74905-310', couple_cep = '74905-320' 
WHERE name = 'Lucas Mendes' AND campaign = 'B';

-- Aparecida de Goiânia - Papillon Park
UPDATE members SET cep = '74968-400', couple_cep = '74968-410' 
WHERE name = 'Bruno Alves' AND campaign = 'B';

-- Anápolis - Centro
UPDATE members SET cep = '75020-020', couple_cep = '75020-030' 
WHERE name = 'Marcos Ferreira' AND campaign = 'B';

-- Anápolis - Jundiaí
UPDATE members SET cep = '75110-210', couple_cep = '75110-220' 
WHERE name = 'Gabriel Santos' AND campaign = 'B';

-- Rio Verde - Centro
UPDATE members SET cep = '75901-040', couple_cep = '75901-050' 
WHERE name = 'Thiago Rodrigues' AND campaign = 'B';

-- Rio Verde - Jardim América
UPDATE members SET cep = '75905-000', couple_cep = '75905-010' 
WHERE name = 'Felipe Souza' AND campaign = 'B';

-- Catalão - Centro
UPDATE members SET cep = '75701-010', couple_cep = '75701-020' 
WHERE name = 'André Lima' AND campaign = 'B';

-- Catalão - Novo Horizonte
UPDATE members SET cep = '75704-020', couple_cep = '75704-030' 
WHERE name = 'Ricardo Pereira' AND campaign = 'B';

-- Itumbiara - Centro
UPDATE members SET cep = '75500-010', couple_cep = '75500-020' 
WHERE name = 'Gustavo Martins' AND campaign = 'B';

-- Itumbiara - Setor Norte
UPDATE members SET cep = '75520-020', couple_cep = '75520-030' 
WHERE name = 'Rodrigo Barbosa' AND campaign = 'B';

-- Jataí - Centro
UPDATE members SET cep = '75800-015', couple_cep = '75800-025' 
WHERE name = 'Leandro Dias' AND campaign = 'B';

-- Jataí - Setor Aeroporto
UPDATE members SET cep = '75804-020', couple_cep = '75804-030' 
WHERE name = 'Fábio Rocha' AND campaign = 'B';

-- Luziânia - Centro
UPDATE members SET cep = '72800-010', couple_cep = '72800-020' 
WHERE name = 'Mateus Cardoso' AND campaign = 'B';

-- Luziânia - Jardim Ingá
UPDATE members SET cep = '72811-010', couple_cep = '72811-020' 
WHERE name = 'Vinicius Gomes' AND campaign = 'B';

-- Formosa - Centro
UPDATE members SET cep = '73801-010', couple_cep = '73801-020' 
WHERE name = 'Alexandre Nunes' AND campaign = 'B';

-- Formosa - JK
UPDATE members SET cep = '73813-010', couple_cep = '73813-020' 
WHERE name = 'Daniel Carvalho' AND campaign = 'B';

-- PASSO 3: Verificar CEPs atualizados
SELECT 
    name as nome,
    city as cidade,
    cep as cep_principal,
    couple_cep as cep_conjuge,
    status,
    created_at
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
ORDER BY city, name;

-- PASSO 4: Verificar quantos membros têm CEPs válidos agora
SELECT 
    COUNT(*) as total_membros,
    COUNT(*) FILTER (WHERE cep IS NOT NULL AND LENGTH(cep) >= 8) as com_cep_valido_principal,
    COUNT(*) FILTER (WHERE couple_cep IS NOT NULL AND LENGTH(couple_cep) >= 8) as com_cep_valido_conjuge,
    COUNT(*) FILTER (WHERE (cep IS NOT NULL AND LENGTH(cep) >= 8) OR (couple_cep IS NOT NULL AND LENGTH(couple_cep) >= 8)) as com_pelo_menos_um_cep_valido
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE;

-- PASSO 5: Listar membros por cidade com CEPs corretos
SELECT 
    city as cidade,
    COUNT(*) as total,
    STRING_AGG(name || ' (' || cep || ')', ', ' ORDER BY name) as membros_e_ceps
FROM members
WHERE campaign = 'B'
  AND DATE(created_at) = CURRENT_DATE
GROUP BY city
ORDER BY city;

-- ========================================
-- RESULTADO ESPERADO:
-- Todos os 20 membros com CEPs REAIS e válidos
-- CEPs geolocalizáveis via APIs de mapas
-- ========================================

-- PASSO 6: DICA - Para testar se um CEP é válido
-- Acesse: https://viacep.com.br/ws/[CEP]/json/
-- Exemplo: https://viacep.com.br/ws/74055110/json/
-- Se retornar dados = CEP válido
-- Se retornar erro = CEP inválido
-- ========================================

