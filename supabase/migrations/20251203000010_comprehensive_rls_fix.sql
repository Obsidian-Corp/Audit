-- =============================================================================
-- COMPREHENSIVE RLS POLICY FIX - ALL PHASES
-- =============================================================================
-- This migration fixes all RLS policy issues in a single transaction:
-- 1. Schema standardization (firm_id vs organization_id)
-- 2. Drop all conflicting policies
-- 3. Fix helper functions
-- 4. Create comprehensive RLS policies
-- 5. Fix handle_new_user trigger
-- 6. Backfill existing users
-- 7. Validate fixes
-- =============================================================================

BEGIN;

-- =============================================================================
-- PHASE 1: SCHEMA STANDARDIZATION
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 1: Schema Standardization - Unifying firm_id columns';
END $$;

-- 1.1: Rename organizations to firms if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN
    ALTER TABLE organizations RENAME TO firms;
    RAISE NOTICE '✓ Renamed organizations table to firms';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN
    RAISE NOTICE '✓ Firms table already exists';
  END IF;
END $$;

-- 1.2: Rename all organization_id columns to firm_id (handle existing firm_id)
DO $$
DECLARE
  tbl RECORD;
  has_firm_id BOOLEAN;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'organization_id'
  LOOP
    -- Check if firm_id already exists in this table
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = tbl.table_name
      AND column_name = 'firm_id'
    ) INTO has_firm_id;

    IF has_firm_id THEN
      -- firm_id exists, drop organization_id instead
      EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS organization_id', tbl.table_name);
      RAISE NOTICE '✓ Dropped duplicate organization_id in table: %', tbl.table_name;
    ELSE
      -- firm_id doesn''t exist, safe to rename
      EXECUTE format('ALTER TABLE %I RENAME COLUMN organization_id TO firm_id', tbl.table_name);
      RAISE NOTICE '✓ Renamed organization_id to firm_id in table: %', tbl.table_name;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- PHASE 2: DROP ALL CONFLICTING RLS POLICIES
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 2: Dropping all existing RLS policies';
END $$;

DO $$
DECLARE
  pol RECORD;
  policy_count INTEGER := 0;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    policy_count := policy_count + 1;
  END LOOP;
  RAISE NOTICE '✓ Dropped % existing policies', policy_count;
END $$;

-- =============================================================================
-- PHASE 3: FIX HELPER FUNCTIONS & TRIGGERS
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 3: Fixing helper functions and triggers';
END $$;

-- 3.1: Create/Fix user_firms() function
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 10
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

DO $$ BEGIN
  RAISE NOTICE '✓ Fixed user_firms() function';
END $$;

-- 3.2: Create/Fix user_has_role() function
CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
    AND firm_id IN (SELECT public.user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

DO $$ BEGIN
  RAISE NOTICE '✓ Fixed user_has_role() function';
END $$;

-- 3.3: Fix handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_token TEXT;
  v_default_role app_role;
BEGIN
  -- Extract invitation token from user metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';

  -- If invited, get firm from invitation
  IF v_invitation_token IS NOT NULL THEN
    SELECT firm_id, role
    INTO v_firm_id, v_default_role
    FROM firm_invitations
    WHERE token = v_invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Update invitation status
    IF v_firm_id IS NOT NULL THEN
      UPDATE firm_invitations
      SET status = 'accepted',
          accepted_at = NOW()
      WHERE token = v_invitation_token;
    END IF;
  ELSE
    -- For non-invited users, assign to first available firm (development only)
    -- In production, this should go through onboarding flow
    SELECT id INTO v_firm_id FROM firms ORDER BY created_at LIMIT 1;
    v_default_role := 'staff_auditor';
  END IF;

  -- Create profile with firm assignment
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    firm_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_firm_id,
    NOW(),
    NOW()
  );

  -- Assign default role
  IF v_default_role IS NOT NULL AND v_firm_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, firm_id, role, assigned_at)
    VALUES (NEW.id, v_firm_id, v_default_role, NOW())
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DO $$ BEGIN
  RAISE NOTICE '✓ Fixed handle_new_user() trigger';
END $$;

-- 3.4: Backfill existing users without firm_id
DO $$
DECLARE
  user_record RECORD;
  default_firm_id UUID;
  fixed_count INTEGER := 0;
BEGIN
  -- Get first firm as default
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  IF default_firm_id IS NULL THEN
    RAISE EXCEPTION 'No firms exist in database - cannot backfill users';
  END IF;

  -- Fix all users without firm_id
  FOR user_record IN
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.firm_id IS NULL OR p.id IS NULL
  LOOP
    -- Upsert profile with firm
    INSERT INTO profiles (id, email, firm_id, first_name, last_name)
    VALUES (
      user_record.id,
      user_record.email,
      default_firm_id,
      COALESCE(split_part(user_record.email, '@', 1), 'User'),
      ''
    )
    ON CONFLICT (id) DO UPDATE
    SET firm_id = default_firm_id,
        updated_at = NOW();

    -- Ensure they have at least staff_auditor role
    INSERT INTO user_roles (user_id, firm_id, role)
    VALUES (user_record.id, default_firm_id, 'staff_auditor'::app_role)
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;

    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE '✓ Backfilled % users with firm_id', fixed_count;
END $$;

-- =============================================================================
-- PHASE 4: CREATE COMPREHENSIVE RLS POLICIES
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 4: Creating comprehensive RLS policies';
END $$;

-- =============================================================================
-- CLIENTS TABLE POLICIES
-- =============================================================================

-- SELECT: Leadership roles can view all firm clients
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.firm_id IN (SELECT public.user_firms())
      AND ur.role IN ('partner', 'practice_leader', 'business_development', 'firm_administrator')
    )
  );

-- INSERT: Leadership can create clients
CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'business_development', 'firm_administrator')
    )
  );

-- UPDATE: Leadership can update clients
CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'business_development', 'firm_administrator')
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Partners and admins only
CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('partner', 'firm_administrator')
    )
  );

DO $$ BEGIN
  RAISE NOTICE '✓ Created clients table policies';
END $$;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- SELECT: See all firm members
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- UPDATE: Own profile or admin
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'firm_administrator'
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

DO $$ BEGIN
  RAISE NOTICE '✓ Created profiles table policies';
END $$;

-- =============================================================================
-- TIME_ENTRIES TABLE POLICIES
-- =============================================================================

-- SELECT: Own entries or managed team
CREATE POLICY "time_entries_select_policy" ON time_entries
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  );

-- INSERT: Create own time entries
CREATE POLICY "time_entries_insert_policy" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- UPDATE: Own unapproved entries or manager approval
CREATE POLICY "time_entries_update_policy" ON time_entries
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role IN ('engagement_manager', 'partner', 'firm_administrator')
      )
    )
  )
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE: Own unapproved entries or admin
CREATE POLICY "time_entries_delete_policy" ON time_entries
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'firm_administrator'
      )
    )
  );

DO $$ BEGIN
  RAISE NOTICE '✓ Created time_entries table policies';
END $$;

-- =============================================================================
-- APPLY POLICIES TO ALL OTHER TABLES WITH firm_id
-- =============================================================================
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'firm_id'
    AND table_name NOT IN ('clients', 'profiles', 'time_entries', 'firms', 'user_roles')
  LOOP
    -- SELECT: All firm members can see
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR SELECT TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_select_policy', tbl.table_name);

    -- INSERT: All firm members can create
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR INSERT TO authenticated
      WITH CHECK (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_insert_policy', tbl.table_name);

    -- UPDATE: All firm members can update
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR UPDATE TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
      WITH CHECK (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_update_policy', tbl.table_name);

    -- DELETE: Only admins can delete
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR DELETE TO authenticated
      USING (
        firm_id IN (SELECT public.user_firms())
        AND EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN (''firm_administrator'', ''partner'')
        )
      )
    ', tbl.table_name || '_delete_policy', tbl.table_name);

    RAISE NOTICE '✓ Created policies for table: %', tbl.table_name;
  END LOOP;
END $$;

-- =============================================================================
-- PHASE 5: VALIDATION
-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE 'Phase 5: Validating fixes';
END $$;

DO $$
DECLARE
  orphan_count INTEGER;
  policy_count INTEGER;
  total_tables INTEGER;
BEGIN
  -- Check for users without firm_id
  SELECT COUNT(*) INTO orphan_count
  FROM profiles
  WHERE firm_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE WARNING '% profiles still missing firm_id!', orphan_count;
  ELSE
    RAISE NOTICE '✓ All profiles have firm_id';
  END IF;

  -- Check policy coverage
  SELECT COUNT(DISTINCT tablename) INTO total_tables
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'firm_id'
  );

  SELECT COUNT(DISTINCT tablename) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '✓ Created policies for % tables', policy_count;

  -- Verify no organization_id columns remain
  SELECT COUNT(*) INTO orphan_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'organization_id';

  IF orphan_count > 0 THEN
    RAISE WARNING '% columns still named organization_id!', orphan_count;
  ELSE
    RAISE NOTICE '✓ All columns standardized to firm_id';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- FINAL VERIFICATION QUERIES (Run these separately to check)
-- =============================================================================

-- Check all users have firms
SELECT
  COUNT(*) as total_users,
  COUNT(firm_id) as users_with_firm,
  COUNT(*) - COUNT(firm_id) as orphaned_users
FROM profiles;

-- Check policy counts per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verify user_firms() works
SELECT public.user_firms() as my_firms;

-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPREHENSIVE RLS FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All schema standardization, policy cleanup, and fixes applied.';
  RAISE NOTICE 'You can now try creating a client - the 403 error should be resolved.';
  RAISE NOTICE '========================================';
END $$;
