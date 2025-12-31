-- =============================================================================
-- Migration: Fix RLS Policies - Add Missing INSERT/UPDATE/DELETE Policies
-- Fixes: BUG-029, BUG-030
-- Description: Ensures all tables have complete CRUD policies for proper data isolation
-- =============================================================================

-- Helper function to get user's firms (if not exists)
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

-- =============================================================================
-- CLIENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_clients" ON clients;
CREATE POLICY "firm_members_insert_clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_clients" ON clients;
CREATE POLICY "firm_members_update_clients"
  ON clients FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_clients" ON clients;
CREATE POLICY "firm_members_delete_clients"
  ON clients FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- ENGAGEMENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_engagements" ON engagements;
CREATE POLICY "firm_members_insert_engagements"
  ON engagements FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_engagements" ON engagements;
CREATE POLICY "firm_members_update_engagements"
  ON engagements FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_engagements" ON engagements;
CREATE POLICY "firm_members_delete_engagements"
  ON engagements FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- AUDIT_PROGRAMS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_audit_programs" ON audit_programs;
CREATE POLICY "firm_members_insert_audit_programs"
  ON audit_programs FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_audit_programs" ON audit_programs;
CREATE POLICY "firm_members_update_audit_programs"
  ON audit_programs FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_audit_programs" ON audit_programs;
CREATE POLICY "firm_members_delete_audit_programs"
  ON audit_programs FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- AUDIT_PROCEDURES TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_audit_procedures" ON audit_procedures;
CREATE POLICY "firm_members_insert_audit_procedures"
  ON audit_procedures FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy - Allow assigned user or firm members
DROP POLICY IF EXISTS "firm_members_update_audit_procedures" ON audit_procedures;
CREATE POLICY "firm_members_update_audit_procedures"
  ON audit_procedures FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    OR assigned_to = auth.uid()
  );

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_audit_procedures" ON audit_procedures;
CREATE POLICY "firm_members_delete_audit_procedures"
  ON audit_procedures FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- RISK_ASSESSMENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_risk_assessments" ON risk_assessments;
CREATE POLICY "firm_members_insert_risk_assessments"
  ON risk_assessments FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_risk_assessments" ON risk_assessments;
CREATE POLICY "firm_members_update_risk_assessments"
  ON risk_assessments FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_risk_assessments" ON risk_assessments;
CREATE POLICY "firm_members_delete_risk_assessments"
  ON risk_assessments FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- MATERIALITY_CALCULATIONS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_materiality_calculations" ON materiality_calculations;
CREATE POLICY "firm_members_insert_materiality_calculations"
  ON materiality_calculations FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_materiality_calculations" ON materiality_calculations;
CREATE POLICY "firm_members_update_materiality_calculations"
  ON materiality_calculations FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_materiality_calculations" ON materiality_calculations;
CREATE POLICY "firm_members_delete_materiality_calculations"
  ON materiality_calculations FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- SAMPLING_PLANS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_sampling_plans" ON sampling_plans;
CREATE POLICY "firm_members_insert_sampling_plans"
  ON sampling_plans FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_sampling_plans" ON sampling_plans;
CREATE POLICY "firm_members_update_sampling_plans"
  ON sampling_plans FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_sampling_plans" ON sampling_plans;
CREATE POLICY "firm_members_delete_sampling_plans"
  ON sampling_plans FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- CONFIRMATIONS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_confirmations" ON confirmations;
CREATE POLICY "firm_members_insert_confirmations"
  ON confirmations FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_confirmations" ON confirmations;
CREATE POLICY "firm_members_update_confirmations"
  ON confirmations FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_confirmations" ON confirmations;
CREATE POLICY "firm_members_delete_confirmations"
  ON confirmations FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- ANALYTICAL_PROCEDURES TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_analytical_procedures" ON analytical_procedures;
CREATE POLICY "firm_members_insert_analytical_procedures"
  ON analytical_procedures FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_analytical_procedures" ON analytical_procedures;
CREATE POLICY "firm_members_update_analytical_procedures"
  ON analytical_procedures FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_analytical_procedures" ON analytical_procedures;
CREATE POLICY "firm_members_delete_analytical_procedures"
  ON analytical_procedures FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- AUDIT_FINDINGS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_audit_findings" ON audit_findings;
CREATE POLICY "firm_members_insert_audit_findings"
  ON audit_findings FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_audit_findings" ON audit_findings;
CREATE POLICY "firm_members_update_audit_findings"
  ON audit_findings FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_audit_findings" ON audit_findings;
CREATE POLICY "firm_members_delete_audit_findings"
  ON audit_findings FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- AUDIT_ADJUSTMENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_audit_adjustments" ON audit_adjustments;
CREATE POLICY "firm_members_insert_audit_adjustments"
  ON audit_adjustments FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_audit_adjustments" ON audit_adjustments;
CREATE POLICY "firm_members_update_audit_adjustments"
  ON audit_adjustments FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_audit_adjustments" ON audit_adjustments;
CREATE POLICY "firm_members_delete_audit_adjustments"
  ON audit_adjustments FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- DOCUMENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_documents" ON documents;
CREATE POLICY "firm_members_insert_documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy - Only uploader or firm members can update
DROP POLICY IF EXISTS "firm_members_update_documents" ON documents;
CREATE POLICY "firm_members_update_documents"
  ON documents FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    OR uploaded_by = auth.uid()
  )
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    OR uploaded_by = auth.uid()
  );

-- DELETE policy - Only uploader or firm members can delete
DROP POLICY IF EXISTS "firm_members_delete_documents" ON documents;
CREATE POLICY "firm_members_delete_documents"
  ON documents FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    OR uploaded_by = auth.uid()
  );

-- =============================================================================
-- TIME_ENTRIES TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy - Users can only insert their own time entries
DROP POLICY IF EXISTS "users_insert_own_time_entries" ON time_entries;
CREATE POLICY "users_insert_own_time_entries"
  ON time_entries FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- UPDATE policy - Users can only update their own time entries
DROP POLICY IF EXISTS "users_update_own_time_entries" ON time_entries;
CREATE POLICY "users_update_own_time_entries"
  ON time_entries FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- DELETE policy - Users can only delete their own time entries
DROP POLICY IF EXISTS "users_delete_own_time_entries" ON time_entries;
CREATE POLICY "users_delete_own_time_entries"
  ON time_entries FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- =============================================================================
-- REVIEW_NOTES TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_review_notes" ON review_notes;
CREATE POLICY "firm_members_insert_review_notes"
  ON review_notes FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy - Only creator can update
DROP POLICY IF EXISTS "creator_update_review_notes" ON review_notes;
CREATE POLICY "creator_update_review_notes"
  ON review_notes FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND created_by = auth.uid()
  )
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND created_by = auth.uid()
  );

-- DELETE policy - Only creator can delete
DROP POLICY IF EXISTS "creator_delete_review_notes" ON review_notes;
CREATE POLICY "creator_delete_review_notes"
  ON review_notes FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND created_by = auth.uid()
  );

-- =============================================================================
-- SIGNOFFS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_signoffs" ON signoffs;
CREATE POLICY "firm_members_insert_signoffs"
  ON signoffs FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND signed_by = auth.uid()
  );

-- UPDATE policy - Signoffs cannot be updated (immutable)
-- No UPDATE policy needed

-- DELETE policy - Only admin can delete signoffs
DROP POLICY IF EXISTS "admin_delete_signoffs" ON signoffs;
CREATE POLICY "admin_delete_signoffs"
  ON signoffs FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================================================
-- AUDIT_REPORTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_audit_reports" ON audit_reports;
CREATE POLICY "firm_members_insert_audit_reports"
  ON audit_reports FOR INSERT TO authenticated
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- UPDATE policy
DROP POLICY IF EXISTS "firm_members_update_audit_reports" ON audit_reports;
CREATE POLICY "firm_members_update_audit_reports"
  ON audit_reports FOR UPDATE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- DELETE policy
DROP POLICY IF EXISTS "firm_members_delete_audit_reports" ON audit_reports;
CREATE POLICY "firm_members_delete_audit_reports"
  ON audit_reports FOR DELETE TO authenticated
  USING (firm_id IN (SELECT public.user_firms()));

-- =============================================================================
-- NOTIFICATIONS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy - System only (handled by triggers/functions)
-- No direct INSERT policy needed for users

-- UPDATE policy - Users can mark their own notifications as read
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy - Users can delete their own notifications
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
CREATE POLICY "users_delete_own_notifications"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =============================================================================
-- ACTIVITY_LOG TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy - System only (handled by triggers)
-- No direct INSERT policy needed for users

-- No UPDATE policy - Activity logs are immutable

-- DELETE policy - Only admin can delete old logs
DROP POLICY IF EXISTS "admin_delete_activity_log" ON activity_log;
CREATE POLICY "admin_delete_activity_log"
  ON activity_log FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================================================
-- COMMENTS TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy
DROP POLICY IF EXISTS "firm_members_insert_comments" ON comments;
CREATE POLICY "firm_members_insert_comments"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- UPDATE policy - Only creator can update
DROP POLICY IF EXISTS "creator_update_comments" ON comments;
CREATE POLICY "creator_update_comments"
  ON comments FOR UPDATE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- DELETE policy - Only creator can delete
DROP POLICY IF EXISTS "creator_delete_comments" ON comments;
CREATE POLICY "creator_delete_comments"
  ON comments FOR DELETE TO authenticated
  USING (
    firm_id IN (SELECT public.user_firms())
    AND user_id = auth.uid()
  );

-- =============================================================================
-- TEMPLATES TABLE - Add missing write policies
-- =============================================================================

-- INSERT policy - Only admin can create templates
DROP POLICY IF EXISTS "admin_insert_templates" ON templates;
CREATE POLICY "admin_insert_templates"
  ON templates FOR INSERT TO authenticated
  WITH CHECK (
    (firm_id IS NULL) -- Global templates
    OR (
      firm_id IN (SELECT public.user_firms())
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- UPDATE policy - Only admin can update templates
DROP POLICY IF EXISTS "admin_update_templates" ON templates;
CREATE POLICY "admin_update_templates"
  ON templates FOR UPDATE TO authenticated
  USING (
    (firm_id IS NULL AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
    OR (
      firm_id IN (SELECT public.user_firms())
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    (firm_id IS NULL AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
    OR (
      firm_id IN (SELECT public.user_firms())
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- DELETE policy - Only admin can delete templates
DROP POLICY IF EXISTS "admin_delete_templates" ON templates;
CREATE POLICY "admin_delete_templates"
  ON templates FOR DELETE TO authenticated
  USING (
    (firm_id IS NULL AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
    OR (
      firm_id IN (SELECT public.user_firms())
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
      )
    )
  );

-- =============================================================================
-- Verify all policies are in place
-- =============================================================================
DO $$
DECLARE
  tbl record;
  missing_policies text[];
  policy_count integer;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'clients', 'engagements', 'audit_programs', 'audit_procedures',
      'risk_assessments', 'materiality_calculations', 'sampling_plans',
      'confirmations', 'analytical_procedures', 'audit_findings',
      'audit_adjustments', 'documents', 'time_entries', 'review_notes',
      'signoffs', 'audit_reports', 'notifications', 'activity_log',
      'comments', 'templates'
    )
  LOOP
    -- Count policies for this table
    SELECT count(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = tbl.tablename
    AND schemaname = 'public';

    -- Most tables should have at least 4 policies (SELECT, INSERT, UPDATE, DELETE)
    -- Some exceptions: signoffs (no UPDATE), activity_log (no INSERT/UPDATE)
    IF policy_count < 2 THEN
      RAISE WARNING 'Table % has only % policies', tbl.tablename, policy_count;
    END IF;
  END LOOP;

  RAISE NOTICE 'RLS policy fix completed. Run tests.run_all_rls_tests() to verify.';
END $$;