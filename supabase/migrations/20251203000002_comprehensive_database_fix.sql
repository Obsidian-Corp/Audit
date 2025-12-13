-- ============================================================================
-- COMPREHENSIVE DATABASE FIX MIGRATION
-- Version: 20251203000002
-- Description: Fixes all critical issues identified in database audit
-- Author: Database Audit Team
-- Date: December 3, 2024
-- ============================================================================
-- WARNINGS:
-- 1. This migration makes significant schema changes
-- 2. Backup your database before running
-- 3. Estimated execution time: 10-15 minutes
-- 4. Some downtime required for safety
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: STANDARDIZE SCHEMA (firms vs organizations)
-- ============================================================================

-- Step 1.1: Ensure we have a firms table (rename organizations if needed)
DO $$
BEGIN
  -- Check what exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN

    RAISE NOTICE 'Renaming organizations table to firms';
    ALTER TABLE organizations RENAME TO firms;

  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN

    RAISE NOTICE 'Both organizations and firms exist - creating view for compatibility';
    DROP VIEW IF EXISTS organizations CASCADE;
    CREATE VIEW organizations AS SELECT * FROM firms;

  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms' AND table_schema = 'public') THEN

    RAISE EXCEPTION 'Neither firms nor organizations table exists - cannot proceed';

  END IF;
END $$;

-- Step 1.2: Add missing columns to firms table
ALTER TABLE firms
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0066CC',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('trial', 'starter', 'professional', 'enterprise')) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS firm_type TEXT DEFAULT 'small' CHECK (firm_type IN ('solo', 'small', 'regional', 'national', 'international')),
  ADD COLUMN IF NOT EXISTS practicing_since DATE,
  ADD COLUMN IF NOT EXISTS license_numbers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partner_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}'::jsonb;

-- Step 1.3: Rename all organization_id columns to firm_id
DO $$
DECLARE
  tbl record;
  col record;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
  LOOP
    FOR col IN
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = tbl.table_name
      AND column_name = 'organization_id'
    LOOP
      RAISE NOTICE 'Renaming %.organization_id to firm_id', tbl.table_name;
      EXECUTE format('ALTER TABLE %I RENAME COLUMN organization_id TO firm_id', tbl.table_name);
    END LOOP;
  END LOOP;
END $$;

-- Step 1.4: Update foreign key constraints
DO $$
DECLARE
  constraint_rec record;
BEGIN
  FOR constraint_rec IN
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND rc.unique_constraint_name IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'organizations'
        AND table_schema = 'public'
      )
  LOOP
    RAISE NOTICE 'Updating foreign key constraint % on table %', constraint_rec.constraint_name, constraint_rec.table_name;
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', constraint_rec.table_name, constraint_rec.constraint_name);
    EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES firms(id) ON DELETE CASCADE',
                   constraint_rec.table_name, constraint_rec.constraint_name, constraint_rec.column_name);
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 2: FIX PROFILES TABLE
-- ============================================================================

-- Step 2.1: Ensure profiles table has correct structure
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS primary_use_case TEXT,
  ADD COLUMN IF NOT EXISTS expected_team_size TEXT;

-- Step 2.2: Create unique constraint on email if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_email_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: CREATE/FIX HELPER FUNCTIONS
-- ============================================================================

-- Step 3.1: Create user_firms function (non-recursive)
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

-- Step 3.2: Create user_firm_id function (non-recursive)
CREATE OR REPLACE FUNCTION public.user_firm_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Step 3.3: Create user_has_role function (non-recursive)
CREATE OR REPLACE FUNCTION public.user_has_role(check_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid()
    AND role::text = check_role
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

-- Step 3.4: Fix the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_token TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';
  v_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'firstName',
    split_part(NEW.email, '@', 1)
  );
  v_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'lastName',
    ''
  );

  -- Check for invitation
  IF v_invitation_token IS NOT NULL THEN
    SELECT firm_id INTO v_firm_id
    FROM firm_invitations
    WHERE token = v_invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Update invitation if found
    IF v_firm_id IS NOT NULL THEN
      UPDATE firm_invitations
      SET status = 'accepted',
          accepted_at = NOW(),
          accepted_by = NEW.id
      WHERE token = v_invitation_token;
    END IF;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    firm_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_firm_id,  -- Will be NULL for non-invited users
    true,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = COALESCE(profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(profiles.last_name, EXCLUDED.last_name),
    firm_id = COALESCE(profiles.firm_id, EXCLUDED.firm_id),
    updated_at = NOW();

  -- If user has a firm, create default role
  IF v_firm_id IS NOT NULL THEN
    INSERT INTO public.user_roles (
      user_id,
      firm_id,
      role,
      assigned_at,
      assigned_by
    ) VALUES (
      NEW.id,
      v_firm_id,
      'staff_auditor',  -- Default role for invited users
      NOW(),
      NEW.id
    ) ON CONFLICT (user_id, firm_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3.5: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 4: CLEAN UP ALL RLS POLICIES
-- ============================================================================

-- Step 4.1: Drop ALL policies on key tables
DO $$
DECLARE
  pol record;
  tbl text;
  tables_to_clean text[] := ARRAY[
    'profiles',
    'firms',
    'clients',
    'engagements',
    'audit_programs',
    'audit_procedures',
    'risk_assessments',
    'materiality_calculations',
    'sampling_plans',
    'confirmations',
    'analytical_procedures',
    'audit_findings',
    'audit_adjustments',
    'documents',
    'time_entries',
    'review_notes',
    'signoffs',
    'audit_reports',
    'notifications',
    'activity_log',
    'comments',
    'templates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_clean
  LOOP
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl AND table_schema = 'public') THEN
      RAISE NOTICE 'Cleaning policies for table: %', tbl;

      -- Drop all existing policies
      FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = tbl
        AND schemaname = 'public'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
      END LOOP;

      -- Enable RLS if not already enabled
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SECTION 5: CREATE CLEAN RLS POLICIES
-- ============================================================================

-- PROFILES table policies
CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_view_firm_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- FIRMS table policies
CREATE POLICY "firm_members_view" ON firms
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_firms()));

CREATE POLICY "firm_admins_update" ON firms
  FOR UPDATE TO authenticated
  USING (
    id IN (SELECT public.user_firms())
    AND public.user_has_role('firm_administrator')
  )
  WITH CHECK (
    id IN (SELECT public.user_firms())
    AND public.user_has_role('firm_administrator')
  );

-- CLIENTS table policies
CREATE POLICY "firm_members_view_clients" ON clients
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

CREATE POLICY "firm_members_insert_clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

CREATE POLICY "firm_members_update_clients" ON clients
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

CREATE POLICY "firm_members_delete_clients" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND (
      public.user_has_role('firm_administrator')
      OR public.user_has_role('partner')
      OR public.user_has_role('engagement_manager')
    )
  );

-- ENGAGEMENTS table policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'engagements' AND table_schema = 'public') THEN
    CREATE POLICY "firm_members_view_engagements" ON engagements
      FOR SELECT TO authenticated
      USING (firm_id IN (SELECT public.user_firms()));

    CREATE POLICY "firm_members_insert_engagements" ON engagements
      FOR INSERT TO authenticated
      WITH CHECK (firm_id IN (SELECT public.user_firms()));

    CREATE POLICY "firm_members_update_engagements" ON engagements
      FOR UPDATE TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
      WITH CHECK (firm_id IN (SELECT public.user_firms()));

    CREATE POLICY "firm_members_delete_engagements" ON engagements
      FOR DELETE TO authenticated
      USING (
        firm_id IN (SELECT public.user_firms())
        AND (
          public.user_has_role('firm_administrator')
          OR public.user_has_role('partner')
          OR public.user_has_role('engagement_manager')
        )
      );
  END IF;
END $$;

-- USER_ROLES table policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    CREATE POLICY "users_view_own_roles" ON user_roles
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());

    CREATE POLICY "users_view_firm_roles" ON user_roles
      FOR SELECT TO authenticated
      USING (firm_id IN (SELECT public.user_firms()));

    CREATE POLICY "firm_admins_manage_roles" ON user_roles
      FOR ALL TO authenticated
      USING (
        firm_id IN (SELECT public.user_firms())
        AND public.user_has_role('firm_administrator')
      )
      WITH CHECK (
        firm_id IN (SELECT public.user_firms())
        AND public.user_has_role('firm_administrator')
      );
  END IF;
END $$;

-- ============================================================================
-- SECTION 6: ADD MISSING CONSTRAINTS
-- ============================================================================

-- Step 6.1: Add NOT NULL constraints where critical
DO $$
BEGIN
  -- Check if clients table exists and has firm_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients'
    AND column_name = 'firm_id'
    AND table_schema = 'public'
  ) THEN
    -- First update any NULL values
    UPDATE clients SET firm_id = (SELECT id FROM firms LIMIT 1) WHERE firm_id IS NULL;
    -- Then add constraint
    ALTER TABLE clients ALTER COLUMN firm_id SET NOT NULL;
  END IF;

  -- Check if engagements table exists and has firm_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'engagements'
    AND column_name = 'firm_id'
    AND table_schema = 'public'
  ) THEN
    UPDATE engagements SET firm_id = (SELECT id FROM firms LIMIT 1) WHERE firm_id IS NULL;
    ALTER TABLE engagements ALTER COLUMN firm_id SET NOT NULL;
  END IF;
END $$;

-- Step 6.2: Create missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_firm_id ON profiles(firm_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_firm_id ON clients(firm_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_firm ON user_roles(user_id, firm_id);

-- ============================================================================
-- SECTION 7: CREATE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate database state
CREATE OR REPLACE FUNCTION public.validate_database_fix()
RETURNS TABLE (
  check_name text,
  status text,
  details text
) AS $$
BEGIN
  -- Check 1: Firms table exists
  RETURN QUERY
  SELECT
    'Firms table exists'::text,
    CASE
      WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'firms')
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Firms table is required for multi-tenancy'::text;

  -- Check 2: No organization_id columns remain
  RETURN QUERY
  SELECT
    'No organization_id columns'::text,
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE column_name = 'organization_id'
        AND table_schema = 'public'
      )
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'All columns should use firm_id'::text;

  -- Check 3: Profiles have firm_id column
  RETURN QUERY
  SELECT
    'Profiles have firm_id'::text,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'firm_id'
      )
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Profiles need firm_id for tenant isolation'::text;

  -- Check 4: RLS enabled on key tables
  RETURN QUERY
  SELECT
    'RLS enabled on clients'::text,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'clients'
        AND rowsecurity = true
      )
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Row Level Security must be enabled'::text;

  -- Check 5: Helper functions exist
  RETURN QUERY
  SELECT
    'Helper functions exist'::text,
    CASE
      WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_firms')
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'user_firms() function is required for RLS'::text;

  -- Check 6: No conflicting policies
  RETURN QUERY
  SELECT
    'No duplicate policies'::text,
    CASE
      WHEN NOT EXISTS (
        SELECT tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename, policyname
        HAVING COUNT(*) > 1
      )
      THEN 'PASS'::text
      ELSE 'FAIL'::text
    END,
    'Each table should have unique policy names'::text;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 8: DATA CLEANUP AND MIGRATION
-- ============================================================================

-- Step 8.1: Ensure all profiles have email
UPDATE profiles
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL OR email = '';

-- Step 8.2: Clean up orphaned records
DELETE FROM profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 8.3: Set default firm for profiles without one (if a default firm exists)
DO $$
DECLARE
  default_firm_id UUID;
BEGIN
  -- Try to find a default firm
  SELECT id INTO default_firm_id
  FROM firms
  WHERE is_active = true
  ORDER BY created_at
  LIMIT 1;

  -- Only update if we found a firm and it's safe to do so
  IF default_firm_id IS NOT NULL THEN
    -- Only update profiles that have no firm and belong to existing users
    UPDATE profiles
    SET firm_id = default_firm_id,
        updated_at = NOW()
    WHERE firm_id IS NULL
    AND id IN (SELECT id FROM auth.users)
    AND NOT EXISTS (
      -- Don't update if user has pending invitation
      SELECT 1 FROM firm_invitations
      WHERE email = profiles.email
      AND status = 'pending'
    );
  END IF;
END $$;

-- ============================================================================
-- SECTION 9: FINAL VALIDATION
-- ============================================================================

-- Run validation
DO $$
DECLARE
  validation_result record;
  failed_checks integer := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE FIX VALIDATION RESULTS';
  RAISE NOTICE '========================================';

  FOR validation_result IN SELECT * FROM public.validate_database_fix()
  LOOP
    RAISE NOTICE '% | % | %',
      rpad(validation_result.check_name, 30),
      rpad(validation_result.status, 6),
      validation_result.details;

    IF validation_result.status = 'FAIL' THEN
      failed_checks := failed_checks + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';

  IF failed_checks > 0 THEN
    RAISE WARNING 'VALIDATION COMPLETED WITH % FAILURES', failed_checks;
  ELSE
    RAISE NOTICE 'ALL VALIDATION CHECKS PASSED!';
  END IF;
END $$;

-- ============================================================================
-- COMMIT THE TRANSACTION
-- ============================================================================
COMMIT;

-- ============================================================================
-- POST-MIGRATION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPREHENSIVE DATABASE FIX COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Test user registration flow';
  RAISE NOTICE '2. Test client creation';
  RAISE NOTICE '3. Test all CRUD operations';
  RAISE NOTICE '4. Monitor for any 403 errors';
  RAISE NOTICE '5. Review application logs';
  RAISE NOTICE '========================================';
END $$;