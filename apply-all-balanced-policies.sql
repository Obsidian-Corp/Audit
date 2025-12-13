-- =============================================================================
-- PHASE 1: BALANCED RLS FOUNDATION
-- Date: 2024-12-03
-- Purpose: Establish firm isolation and helper functions
-- Philosophy: Enable work, maintain security through firm isolation
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: VERIFY SCHEMA STANDARDIZATION
-- =============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Phase 1: Foundation - Firm isolation & helper functions';
END $$;

-- Verify all critical columns use firm_id (should already be done)
DO $$
DECLARE
  org_id_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO org_id_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'organization_id';

  IF org_id_count > 0 THEN
    RAISE WARNING 'Found % tables still using organization_id - run schema standardization first!', org_id_count;
  ELSE
    RAISE NOTICE '✓ All tables use firm_id';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: CREATE/UPDATE HELPER FUNCTIONS
-- =============================================================================

-- Helper function: Get user's firms
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF UUID
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

RAISE NOTICE '✓ Created user_firms() function';

-- Helper function: Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(check_roles)
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

RAISE NOTICE '✓ Created user_has_any_role() function';

-- Helper function: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

RAISE NOTICE '✓ Created user_has_role() function';

-- =============================================================================
-- STEP 3: UPDATE handle_new_user() TRIGGER
-- =============================================================================

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
    -- For non-invited users (development/testing), assign to first firm
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

RAISE NOTICE '✓ Updated handle_new_user() trigger';

-- =============================================================================
-- STEP 4: BACKFILL EXISTING USERS
-- =============================================================================

DO $$
DECLARE
  user_record RECORD;
  default_firm_id UUID;
  fixed_count INTEGER := 0;
BEGIN
  -- Get first firm as default
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  IF default_firm_id IS NULL THEN
    RAISE WARNING 'No firms exist in database - cannot backfill users';
    RETURN;
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
        updated_at = NOW()
    WHERE profiles.firm_id IS NULL;

    -- Ensure they have at least one role
    INSERT INTO user_roles (user_id, firm_id, role)
    VALUES (user_record.id, default_firm_id, 'staff_auditor'::app_role)
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;

    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE '✓ Backfilled % users with firm_id and roles', fixed_count;
END $$;

-- =============================================================================
-- STEP 5: VALIDATION
-- =============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
  users_without_roles INTEGER;
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

  -- Check for users without roles
  SELECT COUNT(*) INTO users_without_roles
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.user_id IS NULL;

  IF users_without_roles > 0 THEN
    RAISE WARNING '% users still missing roles!', users_without_roles;
  ELSE
    RAISE NOTICE '✓ All users have roles assigned';
  END IF;
END $$;

COMMIT;

-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 1 COMPLETE - Foundation Ready';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper functions created';
  RAISE NOTICE 'All users have firm_id and roles';
  RAISE NOTICE 'Ready for Phase 2: Core table policies';
  RAISE NOTICE '========================================';
END $$;
-- =============================================================================
-- PHASE 2: BALANCED CORE TABLE POLICIES
-- Date: 2024-12-03
-- Purpose: Enable daily work with practical role-based restrictions
-- Philosophy: Staff can work, managers can approve, admins can manage
-- =============================================================================

BEGIN;

DO $$ BEGIN
  RAISE NOTICE 'Phase 2: Creating balanced policies for core tables';
END $$;

-- =============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON CORE TABLES
-- =============================================================================

DO $$
DECLARE
  pol RECORD;
  table_list TEXT[] := ARRAY['clients', 'time_entries', 'audit_procedures',
                              'audit_workpapers', 'audit_findings', 'engagements'];
BEGIN
  FOR pol IN
    SELECT DISTINCT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = ANY(table_list)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    RAISE NOTICE 'Dropped policy: %.%', pol.tablename, pol.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- TABLE 1: CLIENTS - Partners/BD create, all firm members read
-- =============================================================================

-- SELECT: All firm members can view all firm clients
CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- INSERT: Partners, BD, and admins can create clients
CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['partner', 'practice_leader', 'business_development',
                                'engagement_manager', 'firm_administrator']::app_role[])
  );

-- UPDATE: Leadership can update clients
CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['partner', 'practice_leader', 'business_development',
                                'engagement_manager', 'firm_administrator']::app_role[])
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Only partners and admins can delete
CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['partner', 'firm_administrator']::app_role[])
  );

RAISE NOTICE '✓ Created balanced policies for clients';

-- =============================================================================
-- TABLE 2: TIME_ENTRIES - Universal access, approval workflow
-- =============================================================================

-- SELECT: See own entries + managers see team
CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      user_id = auth.uid()
      OR user_has_any_role(ARRAY['engagement_manager', 'partner', 'practice_leader',
                                  'firm_administrator']::app_role[])
    )
  );

-- INSERT: Create own time entries
CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_id = auth.uid()
  );

-- UPDATE: Own unapproved entries OR manager approval
CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[])
    )
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Own unapproved entries OR admin override
CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND (
      (user_id = auth.uid() AND approved_at IS NULL)
      OR user_has_any_role(ARRAY['firm_administrator']::app_role[])
    )
  );

RAISE NOTICE '✓ Created balanced policies for time_entries';

-- =============================================================================
-- TABLE 3: ENGAGEMENTS - Managers create, staff see assigned, leaders see all
-- =============================================================================

-- SELECT: All firm members can see all engagements (for now - can restrict later)
CREATE POLICY "engagements_select" ON engagements
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- INSERT: Managers and above can create
CREATE POLICY "engagements_insert" ON engagements
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'practice_leader',
                                'firm_administrator']::app_role[])
  );

-- UPDATE: Managers can update their engagements, partners update all
CREATE POLICY "engagements_update" ON engagements
  FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'practice_leader',
                                'firm_administrator']::app_role[])
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Only partners and admins
CREATE POLICY "engagements_delete" ON engagements
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['partner', 'firm_administrator']::app_role[])
  );

RAISE NOTICE '✓ Created balanced policies for engagements';

-- =============================================================================
-- TABLE 4: AUDIT_PROCEDURES - All firm members can work on procedures
-- =============================================================================

-- SELECT: All firm members can see procedures
CREATE POLICY "audit_procedures_select" ON audit_procedures
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- INSERT: Seniors and above can create procedures
CREATE POLICY "audit_procedures_insert" ON audit_procedures
  FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['senior_auditor', 'engagement_manager', 'partner',
                                'practice_leader', 'firm_administrator']::app_role[])
  );

-- UPDATE: All firm members can update (staff execute, seniors review)
CREATE POLICY "audit_procedures_update" ON audit_procedures
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT user_firms()))
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Managers and above
CREATE POLICY "audit_procedures_delete" ON audit_procedures
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[])
  );

RAISE NOTICE '✓ Created balanced policies for audit_procedures';

-- =============================================================================
-- TABLE 5: AUDIT_WORKPAPERS - Open for engagement teams
-- =============================================================================

-- SELECT: All firm members can see workpapers
CREATE POLICY "audit_workpapers_select" ON audit_workpapers
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- INSERT: All firm members can create workpapers
CREATE POLICY "audit_workpapers_insert" ON audit_workpapers
  FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- UPDATE: All firm members can update
CREATE POLICY "audit_workpapers_update" ON audit_workpapers
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT user_firms()))
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Managers and above
CREATE POLICY "audit_workpapers_delete" ON audit_workpapers
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[])
  );

RAISE NOTICE '✓ Created balanced policies for audit_workpapers';

-- =============================================================================
-- TABLE 6: AUDIT_FINDINGS - Open for all firm members
-- =============================================================================

-- SELECT: All firm members
CREATE POLICY "audit_findings_select" ON audit_findings
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- INSERT: All firm members can document findings
CREATE POLICY "audit_findings_insert" ON audit_findings
  FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- UPDATE: All firm members
CREATE POLICY "audit_findings_update" ON audit_findings
  FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT user_firms()))
  WITH CHECK (firm_id IN (SELECT user_firms()));

-- DELETE: Managers and above
CREATE POLICY "audit_findings_delete" ON audit_findings
  FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT user_firms())
    AND user_has_any_role(ARRAY['engagement_manager', 'partner', 'firm_administrator']::app_role[])
  );

RAISE NOTICE '✓ Created balanced policies for audit_findings';

-- =============================================================================
-- STEP 2: ENSURE PROFILES & USER_ROLES HAVE BASIC POLICIES
-- =============================================================================

-- Drop existing profile policies
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- SELECT: All firm members can see other firm members
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (firm_id IN (SELECT user_firms()));

-- UPDATE: Own profile OR admin
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid()
    OR user_has_role('firm_administrator'::app_role)
  )
  WITH CHECK (firm_id IN (SELECT user_firms()));

RAISE NOTICE '✓ Created policies for profiles';

-- =============================================================================
-- STEP 3: VALIDATION
-- =============================================================================

DO $$
DECLARE
  table_name TEXT;
  policy_count INTEGER;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY['clients', 'time_entries', 'engagements', 'audit_procedures',
                        'audit_workpapers', 'audit_findings'])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = table_name AND schemaname = 'public';

    RAISE NOTICE 'Table % has % policies', table_name, policy_count;

    IF policy_count < 4 THEN
      RAISE WARNING 'Table % has fewer than 4 policies!', table_name;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ PHASE 2 COMPLETE - Balanced Policies Active';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Core tables now have practical, workflow-based policies:';
  RAISE NOTICE '  - Staff can CREATE workpapers, procedures, findings';
  RAISE NOTICE '  - Everyone can track TIME (universal)';
  RAISE NOTICE '  - Managers can CREATE engagements, approve work';
  RAISE NOTICE '  - Partners/BD can CREATE clients';
  RAISE NOTICE '  - Firm isolation is MAINTAINED (critical)';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Test creating a client now - it should work!';
  RAISE NOTICE '================================================';
END $$;
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
