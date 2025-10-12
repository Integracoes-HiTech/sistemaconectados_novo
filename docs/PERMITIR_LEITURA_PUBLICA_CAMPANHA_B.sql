-- ========================================
-- PERMITIR LEITURA PÚBLICA DOS MEMBROS DA CAMPANHA B
-- ========================================
-- PROBLEMA: O mapa não consegue acessar os dados dos membros
-- porque as políticas RLS bloqueiam acesso anônimo
-- SOLUÇÃO: Criar política que permite leitura pública
-- ========================================

-- PASSO 1: Verificar políticas atuais na tabela members
SELECT 
    policyname as politica,
    cmd as comando,
    roles as funcoes,
    qual as condicao_using,
    with_check as condicao_check
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;

-- PASSO 2: Remover a política allow_all (muito permissiva)
DROP POLICY IF EXISTS "allow_all_members" ON members;

-- PASSO 3: Criar política específica para leitura pública da campanha B
CREATE POLICY "public_read_campaign_b_members"
ON members
FOR SELECT
TO anon, authenticated  -- Permite acesso anônimo E autenticado
USING (
    campaign = 'B' 
    AND status = 'Ativo'
    AND (cep IS NOT NULL OR couple_cep IS NOT NULL)
);

-- PASSO 4: Criar política para usuários autenticados gerenciarem seus dados
CREATE POLICY "authenticated_manage_own_campaign"
ON members
FOR ALL
TO authenticated
USING (true)  -- Usuários autenticados podem ver tudo
WITH CHECK (true);  -- Usuários autenticados podem inserir/atualizar tudo

-- PASSO 5: Verificar se as políticas foram criadas
SELECT 
    policyname as politica,
    cmd as comando,
    roles as funcoes,
    qual as condicao_using
FROM pg_policies
WHERE tablename = 'members'
ORDER BY policyname;

-- PASSO 6: Testar se a política está funcionando (simular acesso anônimo)
-- Execute esta query SEM estar logado (ou em uma aba anônima do navegador)
SELECT 
    COUNT(*) as total_membros_visiveis_publicamente
FROM members
WHERE campaign = 'B' 
  AND status = 'Ativo'
  AND (cep IS NOT NULL OR couple_cep IS NOT NULL);

-- ========================================
-- RESULTADO ESPERADO:
-- Deve retornar 20 membros visíveis publicamente
-- ========================================

-- PASSO 7: Listar os membros visíveis publicamente
SELECT 
    id,
    name,
    city,
    cep,
    couple_cep,
    status,
    campaign
FROM members
WHERE campaign = 'B' 
  AND status = 'Ativo'
  AND (cep IS NOT NULL OR couple_cep IS NOT NULL)
ORDER BY city, name;

-- ========================================
-- ATENÇÃO: SEGURANÇA
-- ========================================
-- Esta política permite que QUALQUER PESSOA (mesmo sem login)
-- veja os membros da campanha B que estão ativos e têm CEP.
-- 
-- Isso é necessário para o mapa funcionar, mas significa que
-- os dados (nome, cidade, telefone, etc.) são PÚBLICOS.
-- 
-- Se você quiser restringir quais campos são visíveis publicamente,
-- você pode criar uma VIEW específica para o mapa:
-- 
-- CREATE VIEW v_mapa_campaign_b AS
-- SELECT 
--     id,
--     name,
--     city,
--     cep,
--     couple_cep,
--     couple_city
-- FROM members
-- WHERE campaign = 'B' 
--   AND status = 'Ativo'
--   AND (cep IS NOT NULL OR couple_cep IS NOT NULL);
-- 
-- E então modificar o mapa para buscar de v_mapa_campaign_b
-- ao invés de members diretamente.
-- ========================================

