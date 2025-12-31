-- RELAX ALL RLS POLICIES - Make platform usable for all firm members
-- Only firm_id isolation matters, not role-based restrictions

BEGIN;

-- =============================================================================
-- CLIENTS TABLE - All firm members can do everything except delete
-- =============================================================================

DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- SELECT: All firm members
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- INSERT: All firm members
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE: All firm members
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: All firm members (even delete is open now)
CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- RELAX ALL OTHER TABLE POLICIES
-- =============================================================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  -- For all tables with firm_id, create open policies
  FOR tbl IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'firm_id'
    AND table_name NOT IN ('clients', 'profiles', 'firms', 'user_roles')
  LOOP
    -- Drop existing restrictive policies
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl.table_name || '_select_policy', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl.table_name || '_insert_policy', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl.table_name || '_update_policy', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl.table_name || '_delete_policy', tbl.table_name);

    -- Create open policies - all firm members can do everything
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR SELECT TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_select_policy', tbl.table_name);

    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR INSERT TO authenticated
      WITH CHECK (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_insert_policy', tbl.table_name);

    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR UPDATE TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
      WITH CHECK (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_update_policy', tbl.table_name);

    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR DELETE TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_delete_policy', tbl.table_name);

    RAISE NOTICE '✓ Relaxed policies for table: %', tbl.table_name;
  END LOOP;
END $$;

-- =============================================================================
-- ENSURE ALL USERS HAVE firm_administrator ROLE
-- =============================================================================

DO $$
DECLARE
  profile_record RECORD;
  default_firm_id UUID;
  assigned_count INTEGER := 0;
BEGIN
  -- Get the first firm
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  IF default_firm_id IS NULL THEN
    RAISE NOTICE 'No firms exist - skipping role assignment';
    RETURN;
  END IF;

  -- Assign firm_administrator to all users without roles
  FOR profile_record IN
    SELECT p.id, p.firm_id, p.email
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

    assigned_count := assigned_count + 1;
  END LOOP;

  RAISE NOTICE '✓ Assigned firm_administrator role to % users', assigned_count;
END $$;

-- =============================================================================
-- VALIDATION
-- =============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  users_with_roles INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(DISTINCT user_id) INTO users_with_roles FROM user_roles;

  RAISE NOTICE '================================';
  RAISE NOTICE '✅ RELAXED POLICIES APPLIED';
  RAISE NOTICE 'Total policies: %', policy_count;
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with roles: %', users_with_roles;
  RAISE NOTICE '================================';
END $$;

COMMIT;
