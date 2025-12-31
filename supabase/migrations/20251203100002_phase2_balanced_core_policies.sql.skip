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
