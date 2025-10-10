-- ================================================
-- ATUALIZAR FUNCTION insert_saude_person
-- Para usar novos nomes de campos
-- ================================================

-- 1. Remover function antiga (se existir)
DROP FUNCTION IF EXISTS insert_saude_person(
  text, text, text, text, text, text, text
);

-- 2. Criar nova function com novos parâmetros
CREATE OR REPLACE FUNCTION insert_saude_person(
  p_lider_nome_completo TEXT,
  p_lider_whatsapp TEXT,
  p_pessoa_nome_completo TEXT,
  p_pessoa_whatsapp TEXT,
  p_cep TEXT DEFAULT NULL,
  p_cidade TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT ''
)
RETURNS saude_people
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_person saude_people;
BEGIN
  -- Inserir nova pessoa na tabela saude_people
  INSERT INTO saude_people (
    lider_nome_completo,
    lider_whatsapp,
    pessoa_nome_completo,
    pessoa_whatsapp,
    cep,
    cidade,
    observacoes
  ) VALUES (
    p_lider_nome_completo,
    p_lider_whatsapp,
    p_pessoa_nome_completo,
    p_pessoa_whatsapp,
    p_cep,
    p_cidade,
    COALESCE(p_observacoes, '')
  )
  RETURNING * INTO v_new_person;
  
  RETURN v_new_person;
END;
$$;

-- 3. Conceder permissão para executar a function
GRANT EXECUTE ON FUNCTION insert_saude_person(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. Comentar a function
COMMENT ON FUNCTION insert_saude_person IS 'Insere uma nova pessoa na campanha de saúde com bypass de RLS';

