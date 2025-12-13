-- Drop all RLS policies from audit tables for completely public access

-- audit_entities
DROP POLICY IF EXISTS "Admins and auditors can manage audit entities" ON public.audit_entities;
DROP POLICY IF EXISTS "Org members can view audit entities" ON public.audit_entities;
DROP POLICY IF EXISTS "Public read access" ON public.audit_entities;

-- audit_evidence
DROP POLICY IF EXISTS "Audit team can view evidence" ON public.audit_evidence;
DROP POLICY IF EXISTS "Auditors can create evidence" ON public.audit_evidence;

-- audit_findings
DROP POLICY IF EXISTS "Audit team can update findings" ON public.audit_findings;
DROP POLICY IF EXISTS "Auditors can create findings" ON public.audit_findings;
DROP POLICY IF EXISTS "Org members can view findings" ON public.audit_findings;
DROP POLICY IF EXISTS "Public read access" ON public.audit_findings;

-- audit_logs
DROP POLICY IF EXISTS "Auditors and admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public read access" ON public.audit_logs;
DROP POLICY IF EXISTS "Platform admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- audit_metrics
DROP POLICY IF EXISTS "Admins can manage metrics" ON public.audit_metrics;
DROP POLICY IF EXISTS "Org members can view metrics" ON public.audit_metrics;

-- audit_plans
DROP POLICY IF EXISTS "Admins can manage audit plans" ON public.audit_plans;
DROP POLICY IF EXISTS "Org members can view audit plans" ON public.audit_plans;

-- audit_programs
DROP POLICY IF EXISTS "Audit team can view programs" ON public.audit_programs;
DROP POLICY IF EXISTS "Auditors can manage their programs" ON public.audit_programs;
DROP POLICY IF EXISTS "Public read access" ON public.audit_programs;

-- audit_reports
DROP POLICY IF EXISTS "Audit team can manage reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Org members can view reports" ON public.audit_reports;

-- audit_team_members
DROP POLICY IF EXISTS "Audit leads can manage team members" ON public.audit_team_members;
DROP POLICY IF EXISTS "Public read access" ON public.audit_team_members;
DROP POLICY IF EXISTS "Team members can view audit team" ON public.audit_team_members;

-- audit_workpapers
DROP POLICY IF EXISTS "Audit team can view workpapers" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Auditors can create workpapers" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Preparers and reviewers can update workpapers" ON public.audit_workpapers;
DROP POLICY IF EXISTS "Public read access" ON public.audit_workpapers;

-- audits
DROP POLICY IF EXISTS "Audit leads and admins can update audits" ON public.audits;
DROP POLICY IF EXISTS "Audit managers can create audits" ON public.audits;
DROP POLICY IF EXISTS "Org members can view audits" ON public.audits;
DROP POLICY IF EXISTS "Public read access" ON public.audits;

-- Create new unrestricted policies for all operations
CREATE POLICY "Public full access" ON public.audit_entities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audit_workpapers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access" ON public.audits FOR ALL USING (true) WITH CHECK (true);