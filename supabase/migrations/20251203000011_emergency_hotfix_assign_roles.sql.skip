-- EMERGENCY HOTFIX: Assign roles to all users and relax policies
-- This ensures all existing users have access while maintaining security

BEGIN;

-- 1. Ensure all profiles have a role assigned
DO $$
DECLARE
  profile_record RECORD;
  default_firm_id UUID;
BEGIN
  -- Get the first firm
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  -- For each profile without a role, assign firm_administrator role
  FOR profile_record IN
    SELECT p.id, p.firm_id
    FROM profiles p
    LEFT JOIN user_roles ur ON p.id = ur.user_id
    WHERE ur.user_id IS NULL
  LOOP
    INSERT INTO user_roles (user_id, firm_id, role, assigned_at)
    VALUES (
      profile_record.id,
      COALESCE(profile_record.firm_id, default_firm_id),
      'firm_administrator'::app_role,
      NOW()
    )
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;

    RAISE NOTICE 'Assigned firm_administrator role to user: %', profile_record.id;
  END LOOP;
END $$;

-- 2. Relax clients policies - allow all firm members to INSERT
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- 3. Relax SELECT policy - all firm members can view
DROP POLICY IF EXISTS "clients_select_policy" ON clients;

CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- 4. Relax UPDATE policy - all firm members can update
DROP POLICY IF EXISTS "clients_update_policy" ON clients;

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- 5. Keep DELETE restricted to admins and partners
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.firm_id IN (SELECT public.user_firms())
      AND ur.role IN ('partner', 'firm_administrator')
    )
  );

-- 6. Validation
DO $$
DECLARE
  users_with_roles INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO users_with_roles FROM user_roles;

  RAISE NOTICE '========================';
  RAISE NOTICE 'HOTFIX APPLIED';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with roles: %', users_with_roles;
  RAISE NOTICE '========================';

  IF users_with_roles < total_users THEN
    RAISE WARNING 'Some users still without roles!';
  ELSE
    RAISE NOTICE '✅ All users have roles assigned';
  END IF;
END $$;

COMMIT;
