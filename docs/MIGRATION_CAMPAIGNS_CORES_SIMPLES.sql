-- ========================================
-- MIGRAÇÃO SIMPLES - CORES DA TABELA CAMPAIGNS
-- ========================================
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Adicionar novas colunas (se não existirem)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#1e3a8a';

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#d4af37';

-- PASSO 2: Copiar dados das colunas antigas (se existirem)
UPDATE campaigns 
SET primary_color = COALESCE(background_color, '#1e3a8a')
WHERE background_color IS NOT NULL;

UPDATE campaigns 
SET secondary_color = COALESCE(accent_color, secondary_color, '#d4af37')
WHERE accent_color IS NOT NULL;

-- PASSO 3: Remover colunas antigas
ALTER TABLE campaigns DROP COLUMN IF EXISTS background_color;
ALTER TABLE campaigns DROP COLUMN IF EXISTS accent_color;

-- PASSO 4: Verificar resultado
SELECT id, name, code, primary_color, secondary_color, plano_id, nome_plano 
FROM campaigns 
ORDER BY created_at DESC;

