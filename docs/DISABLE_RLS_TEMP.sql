-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- ATENÇÃO: Use apenas para teste, reative depois!

-- Desabilitar RLS nas tabelas da landing page
ALTER TABLE landing_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE landing_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE landing_campaigns DISABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('landing_leads', 'landing_payments', 'landing_campaigns');

-- PARA REATIVAR DEPOIS (execute quando terminar os testes):
-- ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE landing_campaigns ENABLE ROW LEVEL SECURITY;
