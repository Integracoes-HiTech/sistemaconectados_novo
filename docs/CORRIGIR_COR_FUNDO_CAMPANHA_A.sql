-- ========================================
-- VERIFICAR E CORRIGIR COR DE FUNDO DA CAMPANHA A
-- ========================================

-- PROBLEMA: Está vindo #1E3A8A ao invés de #14446C
-- CAUSA: O background_color da campanha A pode estar NULL ou incorreto

-- 1. VERIFICAR cor atual da campanha A
SELECT 
    code, 
    name, 
    background_color,
    primary_color,
    secondary_color,
    accent_color,
    created_at
FROM campaigns 
WHERE code = 'A';

-- 2. ATUALIZAR cor de fundo da campanha A para #14446C
UPDATE campaigns 
SET 
    background_color = '#14446C',
    updated_at = NOW()
WHERE code = 'A';

-- 3. VERIFICAR novamente se foi atualizado
SELECT 
    code, 
    name, 
    background_color,
    primary_color,
    secondary_color,
    accent_color,
    updated_at
FROM campaigns 
WHERE code = 'A';

-- 4. VERIFICAR todas as campanhas (A, B, SAUDE)
SELECT 
    code, 
    name, 
    background_color,
    primary_color,
    secondary_color,
    accent_color,
    is_active
FROM campaigns 
ORDER BY code;

-- ========================================
-- CORES CORRETAS ESPERADAS:
-- ========================================
-- CAMPANHA A:
--   background_color: #14446C
--   primary_color: #14446C
--   secondary_color: #2563EB
--   accent_color: #D4AF37
--
-- CAMPANHA B:
--   background_color: #3B82F6 (azul claro)
--   primary_color: #3B82F6
--   secondary_color: #1E40AF
--   accent_color: #D4AF37
--
-- CAMPANHA SAUDE:
--   background_color: #047857 (verde)
--   primary_color: #059669
--   secondary_color: #10B981
--   accent_color: #D4AF37
-- ========================================

