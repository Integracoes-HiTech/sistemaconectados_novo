-- Script para atualizar tabela landing_payments com novos campos
-- Remove trigger existente e recria com as atualizações

-- 1. Remover trigger existente se existir
DROP TRIGGER IF EXISTS trigger_create_admin_after_payment ON landing_payments;

-- 2. Remover função existente se existir
DROP FUNCTION IF EXISTS create_admin_after_payment();

-- 3. Adicionar coluna payment_url se não existir
ALTER TABLE landing_payments 
ADD COLUMN IF NOT EXISTS payment_url TEXT;

-- 4. Alterar payment_id para permitir NULL (já que será preenchido pelo N8N)
ALTER TABLE landing_payments 
ALTER COLUMN payment_id DROP NOT NULL;

-- 5. Alterar status para ter default 'pending'
ALTER TABLE landing_payments 
ALTER COLUMN status SET DEFAULT 'pending';

-- 6. Recriar função atualizada
CREATE OR REPLACE FUNCTION create_admin_after_payment()
RETURNS TRIGGER AS $$
DECLARE
    lead_data landing_leads%ROWTYPE;
    admin_username VARCHAR(50);
    admin_password VARCHAR(50);
    campaign_code VARCHAR(50);
    campaign_name VARCHAR(100);
BEGIN
    -- Só processa se o pagamento foi confirmado (ASAAS)
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Busca dados do lead
        SELECT * INTO lead_data FROM landing_leads WHERE id = NEW.lead_id;
        
        IF lead_data IS NULL THEN
            RAISE EXCEPTION 'Lead não encontrado para o pagamento %', NEW.id;
        END IF;
        
        -- Gera código da campanha baseado no nome
        campaign_name := lead_data.nome_completo;
        campaign_code := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(campaign_name, '[^a-zA-Z0-9\s]', '', 'g'), 
            '\s+', '', 'g'
        ));
        
        -- Limita a 10 caracteres e adiciona sufixo se necessário
        IF LENGTH(campaign_code) > 10 THEN
            campaign_code := LEFT(campaign_code, 10);
        END IF;
        
        -- Adiciona sufixo único se necessário
        campaign_code := campaign_code || '_' || EXTRACT(EPOCH FROM NOW())::INTEGER::TEXT;
        
        -- Gera username e senha do admin
        admin_username := 'admin' || LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(LEFT(campaign_name, 15), '[^a-zA-Z0-9\s]', '', 'g'), 
            '\s+', '', 'g'
        ));
        
        admin_password := LOWER(REGEXP_REPLACE(
            REGEXP_REPLACE(LEFT(campaign_name, 10), '[^a-zA-Z0-9\s]', '', 'g'), 
            '\s+', '', 'g'
        )) || UPPER(campaign_code);
        
        -- Cria o admin na tabela auth_users
        INSERT INTO auth_users (
            username, 
            password, 
            name, 
            role, 
            full_name, 
            display_name, 
            instagram, 
            phone, 
            is_active, 
            campaign
        ) VALUES (
            admin_username,
            admin_password,
            'Admin ' || campaign_name,
            'Admin',
            'Admin ' || campaign_name || ' - Administrador',
            'Admin ' || SPLIT_PART(campaign_name, ' ', 1),
            lead_data.email,
            lead_data.whatsapp,
            true,
            campaign_code
        );
        
        -- Cria a campanha na tabela campaigns
        INSERT INTO campaigns (
            name,
            code,
            primary_color,
            secondary_color,
            accent_color,
            background_color,
            description,
            admin_user_id
        ) VALUES (
            campaign_name,
            campaign_code,
            lead_data.cor_principal,
            lead_data.cor_secundaria,
            '#CFBA7F', -- Cor padrão
            '#14446C', -- Cor padrão
            'Campanha criada automaticamente via landing page',
            (SELECT id FROM auth_users WHERE username = admin_username AND campaign = campaign_code LIMIT 1)
        );
        
        -- Registra na tabela landing_campaigns
        INSERT INTO landing_campaigns (
            lead_id,
            campaign_name,
            campaign_code,
            admin_username,
            admin_password,
            admin_user_id
        ) VALUES (
            lead_data.id,
            campaign_name,
            campaign_code,
            admin_username,
            admin_password,
            (SELECT id FROM auth_users WHERE username = admin_username AND campaign = campaign_code LIMIT 1)
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recriar trigger
CREATE TRIGGER trigger_create_admin_after_payment
    AFTER INSERT OR UPDATE ON landing_payments
    FOR EACH ROW 
    EXECUTE FUNCTION create_admin_after_payment();

-- 8. Verificar se as colunas foram adicionadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'landing_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'landing_payments'
AND trigger_name = 'trigger_create_admin_after_payment';
