-- =====================================================
-- CRIAR FUNCTION PARA INSERT PÚBLICO (BYPASS RLS)
-- =====================================================
-- Esta function roda com permissões de SECURITY DEFINER
-- permitindo INSERT mesmo com RLS ativo

-- 1. CRIAR FUNCTION (parâmetros obrigatórios primeiro, opcionais no final)
CREATE OR REPLACE FUNCTION public.insert_saude_person(
    p_leader_name TEXT,
    p_leader_whatsapp TEXT,
    p_person_name TEXT,
    p_person_whatsapp TEXT,
    p_observation TEXT,
    p_leader_cep TEXT DEFAULT NULL,
    p_person_cep TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador, não do usuário
AS $$
DECLARE
    v_result json;
BEGIN
    -- Inserir na tabela
    INSERT INTO saude_people (
        leader_name,
        leader_whatsapp,
        leader_cep,
        person_name,
        person_whatsapp,
        person_cep,
        observation
    ) VALUES (
        p_leader_name,
        p_leader_whatsapp,
        p_leader_cep,
        p_person_name,
        p_person_whatsapp,
        p_person_cep,
        p_observation
    )
    RETURNING to_json(saude_people.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- 2. PERMITIR EXECUÇÃO PÚBLICA
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO anon;
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_saude_person TO public;

-- 3. TESTAR A FUNCTION
SELECT public.insert_saude_person(
    'Líder Teste',           -- p_leader_name
    '62999999999',           -- p_leader_whatsapp
    'Pessoa Teste',          -- p_person_name
    '62988888888',           -- p_person_whatsapp
    'Teste de observação',   -- p_observation
    '74000000',              -- p_leader_cep (opcional)
    '74000000'               -- p_person_cep (opcional)
);

