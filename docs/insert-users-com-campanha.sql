-- =====================================================
-- INSERT INTO users COM COLUNA CAMPAIGN
-- =====================================================

INSERT INTO "public"."users" 
(
  "id", 
  "name", 
  "city", 
  "phone", 
  "instagram", 
  "referrer", 
  "registration_date", 
  "status", 
  "created_at", 
  "updated_at", 
  "sector", 
  "deleted_at",
  "campaign"
) 
VALUES 
(
  '1043a20e-a89d-47a1-ad1e-256912dce385', 
  'Wegney  costa', 
  'Aparecida de Goiânia', 
  '(62) 98410-1515', 
  '@Wegneycosta', 
  'Admin', 
  '2025-09-29', 
  'Ativo', 
  '2025-09-29 16:23:23.129811+00', 
  '2025-09-29 17:45:46.224114+00', 
  'Setor Serra Dourada - 3ª Etapa', 
  null,
  'A'
), 
(
  '1d5b6555-a3d2-4c52-ba95-e1b5be8a3e5b', 
  'Andre Marcos Moreira', 
  'Aparecida de Goiânia', 
  '(62) 99206-7000', 
  '@andremoreiraoficial', 
  'Admin', 
  '2025-10-01', 
  'Ativo', 
  '2025-10-01 19:55:59.629854+00', 
  '2025-10-01 19:56:14.326031+00', 
  'Independência - 1º Complemento Setor das Mansões', 
  null,
  'A'
), 
(
  '45f60e0a-5374-4fa5-8c97-9593357cc97a', 
  'VALTER GOMES DA SILVA', 
  'Goiânia', 
  '(62) 99362-8028', 
  '@Meugoiasoficial', 
  'Valter', 
  '2025-09-28', 
  'Ativo', 
  '2025-09-28 03:38:51.089016+00', 
  '2025-09-28 03:38:51.089016+00', 
  'Loteamento Areião I', 
  null,
  'A'
), 
(
  '6afd7f10-2e70-45a9-9137-077d5304589a', 
  'Wegney costa', 
  'Aparecida de Goiânia', 
  '(62) 98410-1515', 
  '@wegneycosta', 
  'Admin', 
  '2025-10-01', 
  'Ativo', 
  '2025-10-01 21:35:56.272073+00', 
  '2025-10-01 21:36:06.579016+00', 
  'Setor Serra Dourada - 3ª Etapa', 
  null,
  'A'
), 
(
  '80a06b4e-fe11-4dd8-aebb-52dbcb1845d3', 
  'Valter Gomes Da Silva', 
  'Goiânia', 
  '(62) 99362-8028', 
  '@maestrovaltergomes', 
  'Admin', 
  '2025-10-01', 
  'Ativo', 
  '2025-10-01 19:53:46.108719+00', 
  '2025-10-01 20:35:58.547195+00', 
  'Loteamento Areião I', 
  null,
  'A'
);

-- Verificar se os usuários foram inseridos corretamente
SELECT id, name, city, sector, campaign 
FROM users 
WHERE name IN ('Wegney  costa', 'Andre Marcos Moreira', 'VALTER GOMES DA SILVA', 'Wegney costa', 'Valter Gomes Da Silva');
