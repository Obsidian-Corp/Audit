-- MEGA FIX FOR RLS RECURSION ISSUES
-- Run this in Supabase SQL Editor

-- 1. Create helper functions for common permission checks
CREATE OR REPLACE FUNCTION public.user_has_role(check_user_id UUID, check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = check_role
  );
$$;

CREATE OR REPLACE FUNCTION public.user_firm_id(check_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT firm_id FROM public.profiles WHERE id = check_user_id;
$$;

-- 2. Fix audits table RLS
DROP POLICY IF EXISTS "Users can view audits in their firm" ON public.audits;
DROP POLICY IF EXISTS "Firm members can view audits" ON public.audits;
DROP POLICY IF EXISTS "Users can view their firm's audits" ON public.audits;

CREATE POLICY "Users can view audits in their firm"
  ON public.audits
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 3. Fix audit_entities table RLS
DROP POLICY IF EXISTS "Users can view entities in their firm" ON public.audit_entities;
DROP POLICY IF EXISTS "Firm members can view entities" ON public.audit_entities;
DROP POLICY IF EXISTS "Users can view their firm's entities" ON public.audit_entities;

CREATE POLICY "Users can view entities in their firm"
  ON public.audit_entities
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 4. Fix audit_findings table RLS
DROP POLICY IF EXISTS "Users can view findings in their firm" ON public.audit_findings;
DROP POLICY IF EXISTS "Firm members can view findings" ON public.audit_findings;
DROP POLICY IF EXISTS "Users can view their audit findings" ON public.audit_findings;

CREATE POLICY "Users can view findings in their firm"
  ON public.audit_findings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_findings.audit_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- 5. Fix audit_team_members table RLS
DROP POLICY IF EXISTS "Users can view team members in their firm" ON public.audit_team_members;
DROP POLICY IF EXISTS "Firm members can view team members" ON public.audit_team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.audit_team_members;

CREATE POLICY "Users can view team members in their firm"
  ON public.audit_team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_team_members.audit_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- 6. Fix clients table RLS
DROP POLICY IF EXISTS "Users can view clients in their firm" ON public.clients;
DROP POLICY IF EXISTS "Firm members can view clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their firm's clients" ON public.clients;

CREATE POLICY "Users can view clients in their firm"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 7. Fix opportunities table RLS (for CRM pipeline page)
DROP POLICY IF EXISTS "Users can view opportunities in their firm" ON public.opportunities;
DROP POLICY IF EXISTS "Firm members can view opportunities" ON public.opportunities;

CREATE POLICY "Users can view opportunities in their firm"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 8. Fix risks table RLS (for risk assessments page)
DROP POLICY IF EXISTS "Users can view risks in their firm" ON public.risks;
DROP POLICY IF EXISTS "Firm members can view risks" ON public.risks;

CREATE POLICY "Users can view risks in their firm"
  ON public.risks
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 9. Fix audit_plans table RLS
DROP POLICY IF EXISTS "Users can view audit plans in their firm" ON public.audit_plans;
DROP POLICY IF EXISTS "Firm members can view audit plans" ON public.audit_plans;

CREATE POLICY "Users can view audit plans in their firm"
  ON public.audit_plans
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 10. Fix audit_programs table RLS
DROP POLICY IF EXISTS "Users can view audit programs in their firm" ON public.audit_programs;
DROP POLICY IF EXISTS "Firm members can view audit programs" ON public.audit_programs;

CREATE POLICY "Users can view audit programs in their firm"
  ON public.audit_programs
  FOR SELECT
  TO authenticated
  USING (firm_id = public.user_firm_id(auth.uid()));

-- 11. Fix audit_workpapers table RLS
DROP POLICY IF EXISTS "Users can view workpapers in their firm" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Firm members can view workpapers" ON public.audit_workpapers;

CREATE POLICY "Users can view workpapers in their firm"
  ON public.audit_workpapers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      WHERE a.id = audit_workpapers.audit_id
      AND a.firm_id = public.user_firm_id(auth.uid())
    )
  );

-- Verify the fix
SELECT 'RLS policies fixed for 11 core tables - refresh your browser now!' as result;
