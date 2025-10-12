-- ========================================
-- AUMENTAR LIMITE DO CAMPO USERNAME
-- ========================================
-- Aumenta de VARCHAR(50) para VARCHAR(100)
-- para aceitar emails longos como username
-- ========================================

-- PASSO 1: Verificar tamanho atual
SELECT 
    column_name,
    data_type,
    character_maximum_length as tamanho_maximo
FROM information_schema.columns
WHERE table_name = 'auth_users'
  AND column_name = 'username';

-- PASSO 2: Aumentar o limite para 100 caracteres
ALTER TABLE auth_users 
ALTER COLUMN username TYPE VARCHAR(100);

-- PASSO 3: Verificar se foi alterado
SELECT 
    column_name,
    data_type,
    character_maximum_length as tamanho_maximo
FROM information_schema.columns
WHERE table_name = 'auth_users'
  AND column_name = 'username';

-- ========================================
-- RESULTADO ESPERADO:
-- column_name | data_type      | tamanho_maximo
-- username    | character varying | 100
-- ========================================

