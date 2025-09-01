-- Migración para unificar roles de líderes
-- Convierte LEADER_DEV, LEADER_PO, LEADER_INFRA a LEADER

-- Actualizar usuarios con roles específicos de líderes
UPDATE users 
SET role = 'LEADER' 
WHERE role IN ('LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA');

-- Verificar la migración
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;
