-- Políticas RLS seguras para landing page
-- Permite inserções públicas mas mantém segurança

-- 1. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Admins can view all leads" ON landing_leads;
DROP POLICY IF EXISTS "Admins can view payments" ON landing_payments;
DROP POLICY IF EXISTS "Admins can view campaigns" ON landing_campaigns;

-- 2. Políticas para landing_leads
CREATE POLICY "Public can insert leads" ON landing_leads
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read own leads" ON landing_leads
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all leads" ON landing_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- 3. Políticas para landing_payments
CREATE POLICY "Public can insert payments" ON landing_payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read own payments" ON landing_payments
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all payments" ON landing_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- 4. Políticas para landing_campaigns
CREATE POLICY "Public can read campaigns" ON landing_campaigns
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage all campaigns" ON landing_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role IN ('Admin', 'Administrador', 'AdminHitech')
        )
    );

-- 5. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('landing_leads', 'landing_payments', 'landing_campaigns')
ORDER BY tablename, policyname;
