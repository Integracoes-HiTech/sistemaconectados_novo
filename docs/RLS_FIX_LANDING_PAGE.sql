-- Correção RLS para permitir inserções públicas na landing page
-- Execute este SQL no Supabase para corrigir o erro

-- 1. Permitir inserções públicas na tabela landing_leads
CREATE POLICY "Allow public inserts for landing_leads" ON landing_leads
    FOR INSERT WITH CHECK (true);

-- 2. Permitir inserções públicas na tabela landing_payments
CREATE POLICY "Allow public inserts for landing_payments" ON landing_payments
    FOR INSERT WITH CHECK (true);

-- 3. Permitir leitura pública para landing_leads (opcional - para verificar se foi salvo)
CREATE POLICY "Allow public read for own leads" ON landing_leads
    FOR SELECT USING (true);

-- 4. Permitir leitura pública para landing_payments (opcional)
CREATE POLICY "Allow public read for own payments" ON landing_payments
    FOR SELECT USING (true);

-- 5. Permitir atualizações públicas (para atualizar status)
CREATE POLICY "Allow public updates for landing_leads" ON landing_leads
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public updates for landing_payments" ON landing_payments
    FOR UPDATE USING (true) WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('landing_leads', 'landing_payments')
ORDER BY tablename, policyname;
