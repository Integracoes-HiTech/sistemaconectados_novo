-- Script simples para adicionar apenas a coluna payment_url
-- Use este se não quiser recriar o trigger

-- Adicionar coluna payment_url se não existir
ALTER TABLE landing_payments 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- Alterar payment_id para permitir NULL (já que será preenchido pelo N8N)
ALTER TABLE landing_payments 
ALTER COLUMN payment_id DROP NOT NULL;

-- Alterar status para ter default 'pending' se não tiver
DO $$ 
BEGIN
    -- Verifica se a coluna status já tem default
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'landing_payments' 
        AND column_name = 'status' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE landing_payments 
        ALTER COLUMN status SET DEFAULT 'pending';
    END IF;
END $$;

-- Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'landing_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
