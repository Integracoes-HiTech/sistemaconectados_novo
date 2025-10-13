-- ========================================
-- ATUALIZAR ESTRUTURA DA TABELA CAMPAIGNS
-- ========================================
-- Este script ajusta as colunas de cores da tabela campaigns
-- para o novo padrão: primary_color (fundo) e secondary_color (botões)

-- 1. Verificar se as colunas antigas existem e criar as novas se necessário
DO $$ 
BEGIN
    -- Adicionar primary_color se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'primary_color'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN primary_color VARCHAR(7) DEFAULT '#1e3a8a';
        RAISE NOTICE 'Coluna primary_color adicionada';
    ELSE
        RAISE NOTICE 'Coluna primary_color já existe';
    END IF;

    -- Adicionar secondary_color se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'secondary_color'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN secondary_color VARCHAR(7) DEFAULT '#d4af37';
        RAISE NOTICE 'Coluna secondary_color adicionada';
    ELSE
        RAISE NOTICE 'Coluna secondary_color já existe';
    END IF;
END $$;

-- 2. Migrar dados da coluna antiga background_color para primary_color (se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'background_color'
    ) THEN
        UPDATE campaigns 
        SET primary_color = COALESCE(background_color, '#1e3a8a')
        WHERE primary_color IS NULL OR primary_color = '#1e3a8a';
        
        RAISE NOTICE 'Dados migrados de background_color para primary_color';
    END IF;
END $$;

-- 3. Garantir que secondary_color tem valores (usar accent_color se existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'accent_color'
    ) THEN
        UPDATE campaigns 
        SET secondary_color = COALESCE(accent_color, secondary_color, '#d4af37')
        WHERE secondary_color IS NULL OR secondary_color = '#d4af37';
        
        RAISE NOTICE 'Dados de accent_color migrados para secondary_color';
    END IF;
END $$;

-- 4. Remover colunas antigas se existirem
DO $$ 
BEGIN
    -- Remover background_color
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'background_color'
    ) THEN
        ALTER TABLE campaigns DROP COLUMN background_color;
        RAISE NOTICE 'Coluna background_color removida';
    END IF;

    -- Remover accent_color
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'accent_color'
    ) THEN
        ALTER TABLE campaigns DROP COLUMN accent_color;
        RAISE NOTICE 'Coluna accent_color removida';
    END IF;
END $$;

-- 5. Garantir que todas as campanhas têm cores válidas
UPDATE campaigns 
SET 
    primary_color = COALESCE(primary_color, '#1e3a8a'),
    secondary_color = COALESCE(secondary_color, '#d4af37')
WHERE primary_color IS NULL OR secondary_color IS NULL;

-- 6. Verificar resultado final
SELECT 
    id,
    name,
    code,
    primary_color,
    secondary_color,
    plano_id,
    nome_plano
FROM campaigns
ORDER BY created_at DESC;

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- ✅ Coluna primary_color criada (ou já existe)
-- ✅ Coluna secondary_color criada (ou já existe)
-- ✅ Dados migrados de background_color → primary_color
-- ✅ Dados migrados de accent_color → secondary_color
-- ✅ Colunas antigas removidas
-- ✅ Todas as campanhas têm cores válidas

