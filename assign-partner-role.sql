-- Assign current user as partner role

-- First, check current user
SELECT
  id,
  email,
  firm_id
FROM profiles
WHERE id = auth.uid();

-- Assign partner role to current user
INSERT INTO user_roles (user_id, firm_id, role, assigned_at)
SELECT
  id,
  firm_id,
  'partner'::app_role,
  NOW()
FROM profiles
WHERE id = auth.uid()
ON CONFLICT (user_id, firm_id, role) DO UPDATE
SET role = 'partner'::app_role,
    assigned_at = NOW();

-- Verify the assignment
SELECT
  ur.user_id,
  p.email,
  ur.firm_id,
  ur.role,
  ur.assigned_at
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.user_id = auth.uid();
