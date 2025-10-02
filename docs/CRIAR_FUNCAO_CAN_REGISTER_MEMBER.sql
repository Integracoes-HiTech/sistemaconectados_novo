-- =====================================================
-- CRIAR FUNÇÃO CAN_REGISTER_MEMBER
-- =====================================================

-- 1. Criar função para verificar se pode cadastrar membro
CREATE OR REPLACE FUNCTION can_register_member()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_count INTEGER;
    max_limit INTEGER;
BEGIN
    -- Buscar limite máximo de membros
    SELECT setting_value::INTEGER INTO max_limit
    FROM system_settings
    WHERE setting_key = 'max_members'
    LIMIT 1;
    
    -- Se não encontrar configuração, usar limite padrão
    IF max_limit IS NULL THEN
        max_limit := 1500;
    END IF;
    
    -- Contar membros ativos
    SELECT COUNT(*) INTO current_count
    FROM members
    WHERE status = 'Ativo'
        AND deleted_at IS NULL;
    
    -- Retornar true se ainda pode cadastrar
    RETURN current_count < max_limit;
END;
$$;

-- 2. Testar a função
SELECT 
    'Função criada' as status,
    can_register_member() as pode_cadastrar;

-- 3. Verificar configuração do sistema
SELECT 
    setting_key,
    setting_value,
    description
FROM system_settings
WHERE setting_key = 'max_members';

-- 4. Inserir configuração se não existir
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('max_members', '1500', 'Limite máximo de membros no sistema')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Verificar contagem atual
SELECT 
    'Membros ativos' as tipo,
    COUNT(*) as total
FROM members
WHERE status = 'Ativo'
    AND deleted_at IS NULL;

-- 6. Testar função novamente
SELECT 
    'Teste final' as status,
    can_register_member() as pode_cadastrar,
    (SELECT COUNT(*) FROM members WHERE status = 'Ativo' AND deleted_at IS NULL) as membros_ativos,
    (SELECT setting_value::INTEGER FROM system_settings WHERE setting_key = 'max_members') as limite_maximo;
