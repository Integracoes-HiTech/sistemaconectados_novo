    -- =====================================================
    -- SOLUÇÃO ALTERNATIVA: DESABILITAR RLS APENAS PARA INSERT
    -- =====================================================
    -- Use este script apenas se o FIX_RLS_SAUDE_SIMPLES.sql não funcionar

    -- OPÇÃO 1: Desabilitar RLS completamente (NÃO RECOMENDADO PARA PRODUÇÃO)
    -- ALTER TABLE saude_people DISABLE ROW LEVEL SECURITY;

    -- OPÇÃO 2: Criar política permissiva para INSERT público
    DROP POLICY IF EXISTS "saude_public_insert" ON saude_people;

    CREATE POLICY "saude_public_insert" 
    ON saude_people 
    AS PERMISSIVE
    FOR INSERT 
    TO anon, public, authenticated
    WITH CHECK (true);

    -- Verificar
    SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
    FROM pg_policies 
    WHERE tablename = 'saude_people'
    ORDER BY cmd, policyname;

