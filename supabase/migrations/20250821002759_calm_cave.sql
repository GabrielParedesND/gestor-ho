/*
# Datos de Semilla para Sistema de Incentivo HO

## Datos incluidos:
1. **Equipos** - Equipos de desarrollo y gestión
2. **Usuarios** - Roles variados para testing completo
3. **Períodos** - Semanas históricas con datos
4. **Configuraciones** - Parámetros del sistema
5. **Datos históricos** - Votos, resultados y grants para demostración

## Usuarios de prueba:
- admin@example.com / Admin123! (ADMIN)
- manager@example.com / Manager123! (MANAGER)
- dev@example.com / Dev123! (LEADER_DEV)
- po@example.com / Po123! (LEADER_PO) 
- infra@example.com / Infra123! (LEADER_INFRA)
- member1@example.com / Member123! (MEMBER)
- member2@example.com / Member123! (MEMBER)
- member3@example.com / Member123! (MEMBER)
*/

-- Insert teams
INSERT INTO teams (id, name, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Desarrollo', 'Equipo de desarrollo de software'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Gestión', 'Equipo de gestión y administración');

-- Insert test users (passwords will be handled by Supabase Auth)
-- Note: In real implementation, these would be created through the signup process
INSERT INTO users (id, name, email, role, team_id, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Admin Usuario', 'admin@example.com', 'ADMIN', '550e8400-e29b-41d4-a716-446655440002', true),
  ('550e8400-e29b-41d4-a716-446655440101', 'Gerente TI', 'manager@example.com', 'MANAGER', '550e8400-e29b-41d4-a716-446655440002', true),
  ('550e8400-e29b-41d4-a716-446655440102', 'Jefe Desarrollo', 'dev@example.com', 'LEADER_DEV', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440103', 'Product Owner', 'po@example.com', 'LEADER_PO', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440104', 'Jefe Infraestructura', 'infra@example.com', 'LEADER_INFRA', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440105', 'María García', 'member1@example.com', 'MEMBER', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440106', 'Carlos López', 'member2@example.com', 'MEMBER', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440107', 'Ana Martínez', 'member3@example.com', 'MEMBER', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440108', 'Pedro Rodríguez', 'member4@example.com', 'MEMBER', '550e8400-e29b-41d4-a716-446655440001', true),
  ('550e8400-e29b-41d4-a716-446655440109', 'Laura Hernández', 'member5@example.com', 'MEMBER', '550e8400-e29b-41d4-a716-446655440001', true);

-- Insert historical periods
INSERT INTO periods (id, week_label, start_date, end_date, status, timezone, closed_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440200', 'Semana 1/2025', '2025-01-06', '2025-01-10', 'CLOSED', 'America/Mexico_City', '2025-01-10 17:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440201', 'Semana 2/2025', '2025-01-13', '2025-01-17', 'CLOSED', 'America/Mexico_City', '2025-01-17 17:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Semana 3/2025', '2025-01-20', '2025-01-24', 'OPEN', 'America/Mexico_City', NULL);

-- Insert candidates for all periods
INSERT INTO candidates (user_id, period_id, role_at_period) 
SELECT u.id, p.id, u.role
FROM users u, periods p
WHERE u.role = 'MEMBER';

-- Insert historical votes for closed periods
-- Week 1 votes
INSERT INTO votes (period_id, voter_id, target_user_id, weight, comment, created_at) VALUES
  -- Votes for María García (member1)
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440105', 1, 'Excelente trabajo en el proyecto', '2025-01-08 10:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440105', 1, 'Muy colaborativa', '2025-01-08 11:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440105', 1, 'Entrega a tiempo', '2025-01-08 12:00:00-06'),
  
  -- Votes for Carlos López (member2) 
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440106', 1, 'Buen desempeño', '2025-01-08 10:15:00-06'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440106', 1, 'Soporte técnico excelente', '2025-01-08 13:00:00-06'),
  
  -- Votes for Ana Martínez (member3)
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440107', 1, 'Iniciativa propia', '2025-01-08 14:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440107', 1, 'Análisis detallado', '2025-01-08 15:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440107', 1, 'Optimización efectiva', '2025-01-08 16:00:00-06');

-- Week 2 votes (different pattern)
INSERT INTO votes (period_id, voter_id, target_user_id, weight, comment, created_at) VALUES
  -- More votes for different members
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440108', 1, 'Liderazgo en proyecto crítico', '2025-01-15 09:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440108', 1, 'Resolución de bugs importantes', '2025-01-15 10:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440108', 1, 'Gestión de stakeholders', '2025-01-15 11:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440108', 1, 'Mejoras de infraestructura', '2025-01-15 12:00:00-06'),
  
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440109', 1, 'Documentación excepcional', '2025-01-15 13:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440109', 1, 'Code review exhaustivo', '2025-01-15 14:00:00-06'),
  
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440106', 1, 'Feedback valioso', '2025-01-15 15:00:00-06');

-- Insert tallies (calculated results) for closed periods
INSERT INTO tallies (period_id, user_id, raw_votes, counted_votes, discarded_voter_id, manager_included, result_days, calculation_seed) VALUES
  -- Week 1 results
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440105', 3, 3, NULL, true, 3, '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440105'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440106', 2, 2, NULL, true, 1, '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440106'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440107', 3, 3, NULL, false, 2, '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440107'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440108', 0, 0, NULL, false, 0, '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440108'),
  ('550e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440109', 0, 0, NULL, false, 0, '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440109'),

  -- Week 2 results  
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440105', 0, 0, NULL, false, 0, '550e8400-e29b-41d4-a716-446655440201-550e8400-e29b-41d4-a716-446655440105'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440106', 1, 1, NULL, false, 0, '550e8400-e29b-41d4-a716-446655440201-550e8400-e29b-41d4-a716-446655440106'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440107', 0, 0, NULL, false, 0, '550e8400-e29b-41d4-a716-446655440201-550e8400-e29b-41d4-a716-446655440107'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440108', 4, 3, '550e8400-e29b-41d4-a716-446655440104', true, 3, '550e8400-e29b-41d4-a716-446655440201-550e8400-e29b-41d4-a716-446655440108'),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440109', 2, 2, NULL, true, 1, '550e8400-e29b-41d4-a716-446655440201-550e8400-e29b-41d4-a716-446655440109');

-- Insert home office grants based on results
INSERT INTO home_office_grants (user_id, period_id, days, source, expires_at, redeemed) VALUES
  -- Week 1 grants
  ('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440200', 3, 'NORMAL', '2025-03-11 23:59:59-06', false),
  ('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440200', 1, 'NORMAL', '2025-03-11 23:59:59-06', false),
  ('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440200', 2, 'NORMAL', '2025-03-11 23:59:59-06', false),

  -- Week 2 grants
  ('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440201', 3, 'NORMAL', '2025-03-18 23:59:59-06', false),
  ('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440201', 1, 'NORMAL', '2025-03-18 23:59:59-06', false);

-- Insert some initiatives for leaders
INSERT INTO initiatives (id, user_id, period_id, type, title, description, status, approved, approved_by) VALUES
  ('550e8400-e29b-41d4-a716-446655440300', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440200', 'DEV', 'Implementación de CI/CD Pipeline', 'Automatización completa del proceso de deployment usando GitHub Actions', 'ADOPTED', true, '550e8400-e29b-41d4-a716-446655440101'),
  ('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440201', 'PO', 'Chatbot con IA para Soporte', 'Desarrollo de asistente virtual para reducir tickets de soporte nivel 1', 'PLANNED', true, '550e8400-e29b-41d4-a716-446655440101'),
  ('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440201', 'INFRA', 'Migración a Contenedores', 'Containerización de aplicaciones legacy para reducir costos 30%', 'IMPACTFUL', true, '550e8400-e29b-41d4-a716-446655440101'),
  ('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440202', 'DEV', 'Framework de Testing Automatizado', 'Suite de pruebas E2E para reducir regresiones', 'DRAFT', false, NULL);

-- Insert innovation points based on initiatives
INSERT INTO innovation_points (user_id, period_id, value, reason, approved_by, approved_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440200', 1, 'Iniciativa adoptada: CI/CD Pipeline', '550e8400-e29b-41d4-a716-446655440101', '2025-01-10 17:30:00-06'),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440201', 1, 'Iniciativa planificada: Chatbot con IA', '550e8400-e29b-41d4-a716-446655440101', '2025-01-17 17:30:00-06'),
  ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440201', 2, 'Iniciativa con impacto medible: Migración contenedores', '550e8400-e29b-41d4-a716-446655440101', '2025-01-17 17:30:00-06'),
  ('550e8400-e29b-41d4-a716-446655440102', NULL, 1, 'Bonus por 4 puntos acumulados', '550e8400-e29b-41d4-a716-446655440101', '2025-01-18 10:00:00-06');

-- Insert leader bonus grants
INSERT INTO home_office_grants (user_id, period_id, days, source, expires_at, redeemed, notes) VALUES
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440200', 1, 'POINTS', '2025-03-11 23:59:59-06', false, 'Bonus por iniciativa adoptada'),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440201', 1, 'POINTS', '2025-03-18 23:59:59-06', false, 'Bonus por iniciativa planificada'),
  ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440201', 1, 'POINTS', '2025-03-18 23:59:59-06', false, 'Bonus por iniciativa con impacto'),
  ('550e8400-e29b-41d4-a716-446655440102', NULL, 1, 'POINTS', '2025-03-20 23:59:59-06', false, 'Bonus por 4 puntos acumulados');

-- Insert some audit logs for transparency
INSERT INTO audit_logs (actor_user_id, action, entity, entity_id, new_values, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'PERIOD_CREATED', 'period', '550e8400-e29b-41d4-a716-446655440200', '{"week_label": "Semana 1/2025", "status": "OPEN"}', '2025-01-06 08:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440101', 'VOTE_CAST', 'vote', '550e8400-e29b-41d4-a716-446655440200-550e8400-e29b-41d4-a716-446655440105', '{"target_user_id": "550e8400-e29b-41d4-a716-446655440105"}', '2025-01-08 10:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440100', 'PERIOD_CLOSED', 'period', '550e8400-e29b-41d4-a716-446655440200', '{"status": "CLOSED", "closed_at": "2025-01-10T17:00:00-06:00"}', '2025-01-10 17:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440102', 'INITIATIVE_CREATED', 'initiative', '550e8400-e29b-41d4-a716-446655440300', '{"title": "Implementación de CI/CD Pipeline", "type": "DEV"}', '2025-01-08 09:00:00-06'),
  ('550e8400-e29b-41d4-a716-446655440101', 'INITIATIVE_APPROVED', 'initiative', '550e8400-e29b-41d4-a716-446655440300', '{"status": "ADOPTED", "approved": true}', '2025-01-09 16:00:00-06');

-- Update settings with proper configuration
UPDATE settings SET value = '17' WHERE key = 'friday_hour';
UPDATE settings SET value = '"America/Mexico_City"' WHERE key = 'timezone';
UPDATE settings SET value = '3' WHERE key = 'min_quorum';
UPDATE settings SET value = '60' WHERE key = 'grant_expiry_days';
UPDATE settings SET value = '4' WHERE key = 'points_for_bonus_day';

-- Add additional settings
INSERT INTO settings (key, value, description) VALUES
  ('system_name', '"Sistema de Incentivo HO"', 'Nombre del sistema'),
  ('voting_deadline_hour', '17', 'Hora límite para votar (formato 24h)'),
  ('max_votes_per_candidate', '4', 'Máximo de votos por candidato'),
  ('enable_special_votes', 'true', 'Permitir votos especiales del gerente'),
  ('notification_enabled', 'true', 'Habilitar notificaciones del sistema');