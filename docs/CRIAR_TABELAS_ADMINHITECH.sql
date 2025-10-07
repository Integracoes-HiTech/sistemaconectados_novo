-- =====================================================
-- TABELAS PARA SISTEMA ADMINHITECH
-- =====================================================

-- Tabela de Campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    accent_color VARCHAR(7) DEFAULT '#D4AF37',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pessoas da Campanha Saúde
CREATE TABLE IF NOT EXISTS saude_people (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Dados do líder
    leader_name VARCHAR(255) NOT NULL,
    leader_whatsapp VARCHAR(20) NOT NULL,
    leader_cep VARCHAR(10),
    
    -- Dados da pessoa
    person_name VARCHAR(255) NOT NULL,
    person_whatsapp VARCHAR(20) NOT NULL,
    person_cep VARCHAR(10),
    observation TEXT NOT NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INSERIR CAMPANHAS PADRÃO
-- =====================================================

INSERT INTO campaigns (name, code, primary_color, secondary_color, accent_color) VALUES
('Campanha A', 'A', '#3B82F6', '#1E40AF', '#D4AF37'),
('Campanha B', 'B', '#3B82F6', '#1E40AF', '#D4AF37'),
('Campanha Saúde', 'SAUDE', '#10B981', '#059669', '#D4AF37')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CRIAR ADMINHITECH
-- =====================================================

INSERT INTO auth_users (
    id,
    username,
    password,
    name,
    role,
    full_name,
    display_name,
    campaign,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'adminhitech',
    'adminhitech123',
    'AdminHitech',
    'AdminHitech',
    'AdminHitech - Super Administrador',
    'AdminHitech',
    'A',
    true,
    NOW(),
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS PARA AS NOVAS TABELAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE saude_people ENABLE ROW LEVEL SECURITY;

-- Política para campaigns (todos podem ler, apenas AdminHitech pode modificar)
CREATE POLICY "Campaigns are viewable by everyone" ON campaigns
    FOR SELECT USING (true);

CREATE POLICY "Only AdminHitech can modify campaigns" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role = 'AdminHitech'
        )
    );

-- Políticas para saude_people
-- 1. Permitir INSERT público (cadastro sem autenticação)
CREATE POLICY "Allow public insert on saude_people" ON saude_people
    FOR INSERT 
    WITH CHECK (true);

-- 2. SELECT apenas para admin3 e AdminHitech
CREATE POLICY "Saude people are viewable by admin3 and AdminHitech" ON saude_people
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

-- 3. UPDATE apenas para admin3 e AdminHitech
CREATE POLICY "Saude people are modifiable by admin3 and AdminHitech" ON saude_people
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

-- 4. DELETE apenas para admin3 e AdminHitech
CREATE POLICY "Saude people can be deleted by admin3 and AdminHitech" ON saude_people
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.username = current_user 
            AND (auth_users.role = 'admin3' OR auth_users.role = 'AdminHitech')
        )
    );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_code ON campaigns(code);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);

CREATE INDEX IF NOT EXISTS idx_saude_people_deleted_at ON saude_people(deleted_at);
CREATE INDEX IF NOT EXISTS idx_saude_people_whatsapp ON saude_people(person_whatsapp);
CREATE INDEX IF NOT EXISTS idx_saude_people_leader_whatsapp ON saude_people(leader_whatsapp);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para campaigns
CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaigns_updated_at();

-- Trigger para saude_people
CREATE OR REPLACE FUNCTION update_saude_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saude_people_updated_at
    BEFORE UPDATE ON saude_people
    FOR EACH ROW
    EXECUTE FUNCTION update_saude_people_updated_at();

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
    'campaigns' as tabela,
    COUNT(*) as registros
FROM campaigns
UNION ALL
SELECT 
    'saude_people' as tabela,
    COUNT(*) as registros
FROM saude_people
UNION ALL
SELECT 
    'auth_users AdminHitech' as tabela,
    COUNT(*) as registros
FROM auth_users 
WHERE role = 'AdminHitech';
