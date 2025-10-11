-- Sistema de Landing Page - Tabelas para Leads e Pagamentos
-- Criado em: 2025-01-10

-- Tabela para armazenar leads da landing page
CREATE TABLE IF NOT EXISTS landing_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    cep VARCHAR(10),
    cidade VARCHAR(100),
    bairro VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    cor_principal VARCHAR(7) DEFAULT '#14446C',
    cor_secundaria VARCHAR(7) DEFAULT '#CFBA7F',
    plano_escolhido VARCHAR(50) NOT NULL, -- 'gratuito', 'essencial', 'profissional', 'avancado'
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'cancelado', 'expirado'
    payment_id VARCHAR(255), -- ID do gateway de pagamento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar informações de pagamento
CREATE TABLE IF NOT EXISTS landing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES landing_leads(id) ON DELETE CASCADE,
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'asaas', -- 'asaas', 'pagseguro', 'stripe'
    payment_id VARCHAR(255) NOT NULL, -- ID do pagamento no ASAAS
    transaction_id VARCHAR(255), -- ID da transação
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(20) NOT NULL, -- 'pending', 'received', 'confirmed', 'overdue', 'cancelled'
    payment_method VARCHAR(50), -- 'PIX', 'BOLETO', 'CREDIT_CARD'
    installments INTEGER DEFAULT 1,
    due_date DATE, -- Data de vencimento
    gateway_response JSONB, -- Resposta completa do ASAAS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar campanhas criadas automaticamente
CREATE TABLE IF NOT EXISTS landing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES landing_leads(id) ON DELETE CASCADE,
    campaign_code VARCHAR(50) NOT NULL UNIQUE,
    campaign_name VARCHAR(255) NOT NULL,
    admin_user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_landing_leads_email ON landing_leads(email);
CREATE INDEX IF NOT EXISTS idx_landing_leads_whatsapp ON landing_leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_landing_leads_status ON landing_leads(status);
CREATE INDEX IF NOT EXISTS idx_landing_payments_lead_id ON landing_payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_landing_payments_payment_id ON landing_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_landing_payments_status ON landing_payments(status);
CREATE INDEX IF NOT EXISTS idx_landing_campaigns_lead_id ON landing_campaigns(lead_id);
CREATE INDEX IF NOT EXISTS idx_landing_campaigns_code ON landing_campaigns(campaign_code);

-- RLS Policies
ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy para landing_leads - apenas admins podem ver todos os leads
CREATE POLICY "Admins can view all leads" ON landing_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- Policy para landing_leads - leads podem ver apenas seus próprios dados
CREATE POLICY "Leads can view own data" ON landing_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.username = landing_leads.email
        )
    );

-- Policy para landing_payments - apenas admins podem ver pagamentos
CREATE POLICY "Admins can view payments" ON landing_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- Policy para landing_campaigns - apenas admins podem ver campanhas
CREATE POLICY "Admins can view campaigns" ON landing_campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- Função para criar admin automaticamente após pagamento confirmado
CREATE OR REPLACE FUNCTION create_admin_after_payment()
RETURNS TRIGGER AS $$
DECLARE
    lead_data landing_leads%ROWTYPE;
    admin_username VARCHAR(50);
    admin_password VARCHAR(50);
    campaign_code VARCHAR(50);
BEGIN
    -- Só processa se o pagamento foi confirmado (ASAAS)
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        
        -- Busca dados do lead
        SELECT * INTO lead_data FROM landing_leads WHERE id = NEW.lead_id;
        
        -- Gera código da campanha baseado no nome
        campaign_code := UPPER(SUBSTRING(REGEXP_REPLACE(lead_data.nome_completo, '[^a-zA-Z0-9]', '', 'g'), 1, 8));
        
        -- Gera username e senha
        admin_username := 'admin' || LOWER(SUBSTRING(REGEXP_REPLACE(lead_data.nome_completo, '[^a-zA-Z0-9]', '', 'g'), 1, 10));
        admin_password := LOWER(SUBSTRING(REGEXP_REPLACE(lead_data.nome_completo, '[^a-zA-Z0-9]', '', 'g'), 1, 8)) || campaign_code;
        
        -- Cria usuário admin
        INSERT INTO auth_users (
            username, password, name, role, full_name, 
            display_name, instagram, phone, is_active, campaign
        ) VALUES (
            admin_username,
            admin_password,
            'Admin ' || lead_data.nome_completo,
            'Admin',
            'Admin ' || lead_data.nome_completo || ' - Administrador',
            SPLIT_PART(lead_data.nome_completo, ' ', 1),
            '@' || LOWER(REGEXP_REPLACE(lead_data.nome_completo, '[^a-zA-Z0-9]', '', 'g')),
            lead_data.whatsapp,
            true,
            campaign_code
        );
        
        -- Atualiza status do lead
        UPDATE landing_leads 
        SET status = 'pago', updated_at = NOW()
        WHERE id = lead_data.id;
        
        -- Cria registro da campanha
        INSERT INTO landing_campaigns (lead_id, campaign_code, campaign_name, admin_user_id)
        VALUES (
            lead_data.id, 
            campaign_code, 
            'Campanha ' || lead_data.nome_completo,
            (SELECT id FROM auth_users WHERE username = admin_username AND campaign = campaign_code LIMIT 1)
        );
        
        -- Cria configurações da campanha
        INSERT INTO campaigns (code, name, background_color, primary_color, secondary_color, accent_color, description)
        VALUES (
            campaign_code,
            'Campanha ' || lead_data.nome_completo,
            lead_data.cor_principal,
            lead_data.cor_principal,
            lead_data.cor_secundaria,
            lead_data.cor_secundaria,
            'Campanha criada automaticamente via landing page'
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função após pagamento aprovado
CREATE TRIGGER trigger_create_admin_after_payment
    AFTER INSERT OR UPDATE ON landing_payments
    FOR EACH ROW
    EXECUTE FUNCTION create_admin_after_payment();

-- Função para obter dados do plano
CREATE OR REPLACE FUNCTION get_plan_details(plan_name VARCHAR)
RETURNS TABLE (
    price DECIMAL(10,2),
    max_users INTEGER,
    features JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE plan_name
            WHEN 'gratuito' THEN 0.00
            WHEN 'essencial' THEN 650.00
            WHEN 'profissional' THEN 1250.00
            WHEN 'avancado' THEN 1500.00
            ELSE 0.00
        END as price,
        CASE plan_name
            WHEN 'gratuito' THEN 100
            WHEN 'essencial' THEN 1000
            WHEN 'profissional' THEN 5000
            WHEN 'avancado' THEN 999999
            ELSE 100
        END as max_users,
        CASE plan_name
            WHEN 'gratuito' THEN '{"cadastros": 100, "painel_completo": false, "mapa_interativo": false, "relatorios": false, "backup": false, "suporte": false, "personalizacao": false, "exportacao": false}'::jsonb
            WHEN 'essencial' THEN '{"cadastros": 1000, "painel_completo": true, "mapa_interativo": true, "relatorios": true, "backup": true, "suporte": true, "personalizacao": true, "exportacao": true}'::jsonb
            WHEN 'profissional' THEN '{"cadastros": 5000, "painel_completo": true, "mapa_interativo": true, "relatorios": true, "backup": true, "suporte_prioritario": true, "personalizacao": true, "exportacao": true}'::jsonb
            WHEN 'avancado' THEN '{"cadastros": 999999, "painel_completo": true, "mapa_interativo": true, "relatorios": true, "backup": true, "suporte_24h": true, "personalizacao": true, "exportacao": true}'::jsonb
            ELSE '{}'::jsonb
        END as features;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE landing_leads IS 'Armazena leads capturados na landing page';
COMMENT ON TABLE landing_payments IS 'Armazena informações de pagamentos processados';
COMMENT ON TABLE landing_campaigns IS 'Armazena campanhas criadas automaticamente após pagamento';
COMMENT ON FUNCTION create_admin_after_payment() IS 'Cria admin e campanha automaticamente após pagamento aprovado';
COMMENT ON FUNCTION get_plan_details(VARCHAR) IS 'Retorna detalhes do plano selecionado';
