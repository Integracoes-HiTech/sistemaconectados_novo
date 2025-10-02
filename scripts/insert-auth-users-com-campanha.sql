-- =====================================================
-- INSERT INTO auth_users COM COLUNA CAMPAIGN
-- =====================================================

INSERT INTO "public"."auth_users" 
(
  "id", 
  "username", 
  "password", 
  "name", 
  "role", 
  "full_name", 
  "phone", 
  "is_active", 
  "last_login", 
  "created_at", 
  "updated_at", 
  "instagram", 
  "display_name", 
  "deleted_at",
  "campaign"
) 
VALUES 
(
  '0b163d45-f15b-4e03-a849-25454f770f8f', 
  'andremoreiraoficial', 
  'andremoreiraoficial7000', 
  'Andre Marcos Moreira', 
  'Membro', 
  'Andre Marcos Moreira - Membro', 
  '(62) 99206-7000', 
  'true', 
  '2025-10-01 19:56:13.295+00', 
  '2025-10-01 19:56:00.41747+00', 
  '2025-10-01 19:56:14.607621+00', 
  '@andremoreiraoficial', 
  'Andre', 
  null,
  'A'
), 
(
  '3ce2fb19-d885-4d6d-a2a6-b6af8493830d', 
  'maestrovaltergomes', 
  'maestrovaltergomes8028', 
  'Valter Gomes Da Silva', 
  'Membro', 
  'Valter Gomes Da Silva - Membro', 
  '(62) 99362-8028', 
  'true', 
  '2025-10-01 20:35:58.59+00', 
  '2025-10-01 19:53:47.051455+00', 
  '2025-10-01 20:37:35.806486+00', 
  '@maestrovaltergomes', 
  'Valter', 
  null,
  'A'
), 
(
  'a6b19d1a-8711-46a2-9758-f985dcc608b4', 
  'wegneycosta', 
  'wegneycosta1515', 
  'Wegney costa', 
  'Membro', 
  'Wegney costa - Membro', 
  '(62) 98410-1515', 
  'true', 
  '2025-10-01 21:36:06.055+00', 
  '2025-10-01 21:35:57.353243+00', 
  '2025-10-01 21:36:06.828053+00', 
  '@wegneycosta', 
  'Wegney', 
  null,
  'A'
);

-- Verificar se os registros foram inseridos corretamente
SELECT id, username, name, role, campaign 
FROM auth_users 
WHERE username IN ('andremoreiraoficial', 'maestrovaltergomes', 'wegneycosta');
