-- =====================================================
-- CRIAR CONFIGURAÇÕES DE SISTEMA PARA NOVA CAMPANHA
-- =====================================================
-- Este script cria as configurações necessárias para 
-- que uma nova campanha funcione corretamente
-- =====================================================

-- 1. Verificar se já existe configuração de tipo de links
-- Se não existir, criar com valor padrão 'members'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'member_links_type') THEN
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES ('member_links_type', 'members', NOW());
  END IF;
END $$;

-- 2. Verificar se já existe configuração de fase de contratos pagos
-- Se não existir, criar com valor padrão 'false'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'paid_contracts_phase_active') THEN
    INSERT INTO system_settings (setting_key, setting_value, updated_at)
    VALUES ('paid_contracts_phase_active', 'false', NOW());
  END IF;
END $$;

-- 3. Verificar controle de fases
-- Se não existir, criar fase de membros
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phase_control WHERE phase_name = 'members') THEN
    INSERT INTO phase_control (phase_name, is_active, start_date, created_at, updated_at)
    VALUES ('members', true, CURRENT_DATE, NOW(), NOW());
  END IF;
END $$;

-- 4. Criar fase de contratos pagos (inativa por padrão)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM phase_control WHERE phase_name = 'paid_contracts') THEN
    INSERT INTO phase_control (phase_name, is_active, start_date, created_at, updated_at)
    VALUES ('paid_contracts', false, NULL, NOW(), NOW());
  END IF;
END $$;

-- =====================================================
-- COMO USAR:
-- =====================================================
-- Execute este script no Supabase SQL Editor sempre que
-- uma nova campanha for criada para garantir que todas
-- as configurações estejam presentes.
--
-- Ou melhor ainda: adicione isso na função automática
-- de criação de campanha no PublicRegisterCampanha.tsx
-- =====================================================

-- Verificar configurações criadas
SELECT * FROM system_settings ORDER BY setting_key;
SELECT * FROM phase_control ORDER BY phase_name;

