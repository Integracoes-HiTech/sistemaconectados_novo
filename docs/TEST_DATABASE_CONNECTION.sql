-- Script para testar conexão e verificar estrutura das tabelas

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('landing_leads', 'landing_payments', 'landing_campaigns')
ORDER BY table_name;

-- 2. Verificar estrutura da tabela landing_leads
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'landing_leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela landing_payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'landing_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar políticas RLS
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
WHERE tablename IN ('landing_leads', 'landing_payments', 'landing_campaigns')
ORDER BY tablename, policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('landing_leads', 'landing_payments', 'landing_campaigns');

-- 6. Teste de inserção (comentado para não inserir dados reais)
/*
INSERT INTO landing_leads (
    nome_completo,
    cpf_cnpj,
    whatsapp,
    email,
    plano_escolhido,
    status
) VALUES (
    'Teste Conexão',
    '12345678901',
    '5562999999999',
    'teste@teste.com',
    'gratuito',
    'pendente'
);
*/

-- 7. Verificar últimos leads inseridos (se houver)
SELECT 
    id,
    nome_completo,
    email,
    plano_escolhido,
    status,
    created_at
FROM landing_leads 
ORDER BY created_at DESC 
LIMIT 5;
