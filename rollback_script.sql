-- =============================================================================
-- ROLLBACK SCRIPT - EMERGENCY USE ONLY
-- Use this script to rollback the RLS policy migration if issues are encountered
-- This will remove all policies created by the migration
-- =============================================================================

-- WARNING: This script will DROP all firm_members_* policies
-- Only run this if the migration caused critical issues

BEGIN;

-- Log the rollback attempt
DO $$
BEGIN
  RAISE NOTICE 'Starting rollback of RLS policies migration...';
  RAISE NOTICE 'This will drop all firm_members_* policies';
  RAISE NOTICE 'Current time: %', now();
END $$;

-- =============================================================================
-- Drop all firm_members_* policies
-- =============================================================================

-- Clients table policies
DROP POLICY IF EXISTS "firm_members_insert_clients" ON clients;
DROP POLICY IF EXISTS "firm_members_update_clients" ON clients;
DROP POLICY IF EXISTS "firm_members_delete_clients" ON clients;

-- Engagements table policies
DROP POLICY IF EXISTS "firm_members_insert_engagements" ON engagements;
DROP POLICY IF EXISTS "firm_members_update_engagements" ON engagements;
DROP POLICY IF EXISTS "firm_members_delete_engagements" ON engagements;

-- Audit programs table policies
DROP POLICY IF EXISTS "firm_members_insert_audit_programs" ON audit_programs;
DROP POLICY IF EXISTS "firm_members_update_audit_programs" ON audit_programs;
DROP POLICY IF EXISTS "firm_members_delete_audit_programs" ON audit_programs;

-- Audit procedures table policies
DROP POLICY IF EXISTS "firm_members_insert_audit_procedures" ON audit_procedures;
DROP POLICY IF EXISTS "firm_members_update_audit_procedures" ON audit_procedures;
DROP POLICY IF EXISTS "firm_members_delete_audit_procedures" ON audit_procedures;

-- Audit findings table policies
DROP POLICY IF EXISTS "firm_members_insert_audit_findings" ON audit_findings;
DROP POLICY IF EXISTS "firm_members_update_audit_findings" ON audit_findings;
DROP POLICY IF EXISTS "firm_members_delete_audit_findings" ON audit_findings;

-- Audit reports table policies
DROP POLICY IF EXISTS "firm_members_insert_audit_reports" ON audit_reports;
DROP POLICY IF EXISTS "firm_members_update_audit_reports" ON audit_reports;
DROP POLICY IF EXISTS "firm_members_delete_audit_reports" ON audit_reports;

-- Documents table policies
DROP POLICY IF EXISTS "firm_members_insert_documents" ON documents;
DROP POLICY IF EXISTS "firm_members_update_documents" ON documents;
DROP POLICY IF EXISTS "firm_members_delete_documents" ON documents;

-- Comments table policies
DROP POLICY IF EXISTS "firm_members_insert_comments" ON comments;
DROP POLICY IF EXISTS "firm_members_update_comments" ON comments;
DROP POLICY IF EXISTS "firm_members_delete_comments" ON comments;

-- Confirmations table policies
DROP POLICY IF EXISTS "firm_members_insert_confirmations" ON confirmations;
DROP POLICY IF EXISTS "firm_members_update_confirmations" ON confirmations;
DROP POLICY IF EXISTS "firm_members_delete_confirmations" ON confirmations;

-- Templates table policies
DROP POLICY IF EXISTS "firm_members_insert_templates" ON templates;
DROP POLICY IF EXISTS "firm_members_update_templates" ON templates;

-- Signoffs table policies
DROP POLICY IF EXISTS "firm_members_insert_signoffs" ON signoffs;
DROP POLICY IF EXISTS "firm_members_delete_signoffs" ON signoffs;

-- Materiality calculations table policies
DROP POLICY IF EXISTS "firm_members_insert_materiality_calculations" ON materiality_calculations;
DROP POLICY IF EXISTS "firm_members_update_materiality_calculations" ON materiality_calculations;
DROP POLICY IF EXISTS "firm_members_delete_materiality_calculations" ON materiality_calculations;

-- Sampling plans table policies
DROP POLICY IF EXISTS "firm_members_insert_sampling_plans" ON sampling_plans;
DROP POLICY IF EXISTS "firm_members_update_sampling_plans" ON sampling_plans;
DROP POLICY IF EXISTS "firm_members_delete_sampling_plans" ON sampling_plans;

-- Risk assessments table policies
DROP POLICY IF EXISTS "firm_members_insert_risk_assessments" ON risk_assessments;
DROP POLICY IF EXISTS "firm_members_update_risk_assessments" ON risk_assessments;
DROP POLICY IF EXISTS "firm_members_delete_risk_assessments" ON risk_assessments;

-- Analytical procedures table policies
DROP POLICY IF EXISTS "firm_members_insert_analytical_procedures" ON analytical_procedures;
DROP POLICY IF EXISTS "firm_members_update_analytical_procedures" ON analytical_procedures;
DROP POLICY IF EXISTS "firm_members_delete_analytical_procedures" ON analytical_procedures;

-- Audit adjustments table policies
DROP POLICY IF EXISTS "firm_members_insert_audit_adjustments" ON audit_adjustments;
DROP POLICY IF EXISTS "firm_members_update_audit_adjustments" ON audit_adjustments;
DROP POLICY IF EXISTS "firm_members_delete_audit_adjustments" ON audit_adjustments;

-- Review notes table policies
DROP POLICY IF EXISTS "firm_members_insert_review_notes" ON review_notes;
DROP POLICY IF EXISTS "firm_members_update_review_notes" ON review_notes;
DROP POLICY IF EXISTS "firm_members_delete_review_notes" ON review_notes;

-- Time entries table policies
DROP POLICY IF EXISTS "firm_members_insert_time_entries" ON time_entries;
DROP POLICY IF EXISTS "firm_members_update_time_entries" ON time_entries;
DROP POLICY IF EXISTS "firm_members_delete_time_entries" ON time_entries;

-- Notifications table policies
DROP POLICY IF EXISTS "firm_members_own_notifications" ON notifications;
DROP POLICY IF EXISTS "firm_members_update_notifications" ON notifications;

-- Activity log policy
DROP POLICY IF EXISTS "firm_members_view_activity_log" ON activity_log;

-- =============================================================================
-- Optionally drop the user_firms() helper function
-- WARNING: Only uncomment if you need to fully rollback including the helper function
-- =============================================================================
-- DROP FUNCTION IF EXISTS public.user_firms();

-- =============================================================================
-- Verification
-- =============================================================================

DO $$
DECLARE
  remaining_policies integer;
BEGIN
  SELECT count(*) INTO remaining_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE 'firm_members_%';

  RAISE NOTICE 'Rollback verification:';
  RAISE NOTICE '  Remaining firm_members_* policies: %', remaining_policies;

  IF remaining_policies > 0 THEN
    RAISE WARNING 'Some policies were not dropped. Manual intervention required.';
  ELSE
    RAISE NOTICE '✓ All firm_members_* policies successfully removed';
  END IF;
END $$;

-- Do NOT commit yet - review the output first
-- If everything looks good, run: COMMIT;
-- If you want to cancel, run: ROLLBACK;

ROLLBACK; -- Safe default - change to COMMIT after verification
