-- ============================================================================
-- STEP 2A: ADD MISSING FIRM_ID COLUMNS
-- ============================================================================
-- Add firm_id to tables that don't have it yet
-- ============================================================================

-- Add firm_id to canvas_workspaces (if not exists)
ALTER TABLE canvas_workspaces 
  ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES firms(id) ON DELETE CASCADE;

-- Add firm_id to canvas_elements (if not exists via workspace relation)
-- Elements inherit firm through workspace, no direct firm_id needed

-- Update existing canvas_workspaces to use firm from creator's profile
UPDATE canvas_workspaces
SET firm_id = (SELECT firm_id FROM profiles WHERE id = canvas_workspaces.created_by LIMIT 1)
WHERE firm_id IS NULL AND created_by IS NOT NULL;

-- ============================================================================
-- STEP 2B: ROW-LEVEL SECURITY POLICIES (MULTI-TENANT ISOLATION)
-- ============================================================================

-- 1. CREATE ENGAGEMENT_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS engagement_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES audits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_on_engagement TEXT NOT NULL CHECK (role_on_engagement IN ('lead', 'manager', 'senior', 'staff', 'reviewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  removed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(engagement_id, user_id, role_on_engagement)
);

ALTER TABLE engagement_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
ON engagement_assignments FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Managers can manage assignments on their engagements"
ON engagement_assignments FOR ALL TO authenticated
USING (
  engagement_id IN (
    SELECT engagement_id FROM engagement_assignments
    WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager')
  )
);

-- 2. FIRMS TABLE RLS
-- ============================================================================
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own firm"
ON firms FOR SELECT TO authenticated
USING (id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm admins update their firm"
ON firms FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND firm_id = firms.id AND role = 'firm_administrator'
  )
);

-- 3. AUDITS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audits;

CREATE POLICY "Firm members see firm audits"
ON audits FOR SELECT TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  OR id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
);

CREATE POLICY "Partners manage all firm audits"
ON audits FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND firm_id = audits.firm_id AND role IN ('firm_administrator', 'partner')
  )
);

CREATE POLICY "Managers create audits"
ON audits FOR INSERT TO authenticated
WITH CHECK (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND firm_id = audits.firm_id
    AND role IN ('firm_administrator', 'partner', 'engagement_manager', 'business_development')
  )
);

-- 4. AUDIT_WORKPAPERS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_workpapers;

CREATE POLICY "Users see assigned workpapers"
ON audit_workpapers FOR SELECT TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

CREATE POLICY "Users create workpapers"
ON audit_workpapers FOR INSERT TO authenticated
WITH CHECK (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  AND firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users update workpapers"
ON audit_workpapers FOR UPDATE TO authenticated
USING (
  prepared_by = auth.uid() OR reviewed_by = auth.uid()
  OR audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager', 'senior'))
);

CREATE POLICY "Managers delete workpapers"
ON audit_workpapers FOR DELETE TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager'))
);

-- 5. AUDIT_FINDINGS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_findings;

CREATE POLICY "Users see assigned findings"
ON audit_findings FOR SELECT TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

CREATE POLICY "Users create findings"
ON audit_findings FOR INSERT TO authenticated
WITH CHECK (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  AND firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users update findings"
ON audit_findings FOR UPDATE TO authenticated
USING (
  identified_by = auth.uid()
  OR audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager', 'senior'))
);

CREATE POLICY "Managers delete findings"
ON audit_findings FOR DELETE TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager'))
);

-- 6. AUDIT_EVIDENCE RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_evidence;

CREATE POLICY "Users see assigned evidence"
ON audit_evidence FOR SELECT TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

CREATE POLICY "Users manage evidence"
ON audit_evidence FOR ALL TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  AND firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

-- 7. AUDIT_REPORTS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_reports;

CREATE POLICY "Users see assigned reports"
ON audit_reports FOR SELECT TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

CREATE POLICY "Managers manage reports"
ON audit_reports FOR ALL TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager'))
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner'))
);

-- 8. AUDIT_ENTITIES RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_entities;

CREATE POLICY "Firm members see firm entities"
ON audit_entities FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Leaders manage entities"
ON audit_entities FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

-- 9. AUDIT_PLANS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_plans;

CREATE POLICY "Firm members see plans"
ON audit_plans FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Leaders manage plans"
ON audit_plans FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

-- 10. AUDIT_PROGRAMS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_programs;

CREATE POLICY "Users see assigned programs"
ON audit_programs FOR SELECT TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid())
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'practice_leader'))
);

CREATE POLICY "Managers manage programs"
ON audit_programs FOR ALL TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager'))
  OR firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner'))
);

-- 11. AUDIT_TEAM_MEMBERS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_team_members;

CREATE POLICY "Users see team for assigned engagements"
ON audit_team_members FOR SELECT TO authenticated
USING (audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid()));

CREATE POLICY "Managers manage team"
ON audit_team_members FOR ALL TO authenticated
USING (
  audit_id IN (SELECT engagement_id FROM engagement_assignments WHERE user_id = auth.uid() AND role_on_engagement IN ('lead', 'manager'))
);

-- 12. AUDIT_METRICS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_metrics;

CREATE POLICY "Firm members see firm metrics"
ON audit_metrics FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- 13. AUDIT_LOGS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Public full access" ON audit_logs;
DROP POLICY IF EXISTS "Platform admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Firm members see firm logs"
ON audit_logs FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()) OR user_id = auth.uid());

CREATE POLICY "System inserts audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- 14. ACTION_ITEMS RLS
-- ============================================================================
CREATE POLICY "Users see firm action items"
ON action_items FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users manage action items"
ON action_items FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  AND (assigned_to = auth.uid() OR created_by = auth.uid())
);

-- 15. AI TABLES RLS
-- ============================================================================
CREATE POLICY "Firm members see AI agents"
ON ai_agents FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage AI agents"
ON ai_agents FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner'))
);

CREATE POLICY "Firm members see AI executions"
ON ai_executions FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm members see AI workflows"
ON ai_workflows FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage AI workflows"
ON ai_workflows FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner'))
);

CREATE POLICY "Firm members see AI prompts"
ON ai_prompts FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

-- 16. API_KEYS RLS
-- ============================================================================
CREATE POLICY "Firm admins manage API keys"
ON api_keys FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role = 'firm_administrator')
);

-- 17. APP_PERMISSIONS & CONFIGURATIONS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users view apps" ON apps;
DROP POLICY IF EXISTS "Org admins can manage apps" ON apps;

CREATE POLICY "Authenticated users view apps"
ON apps FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Firm members see app permissions"
ON app_permissions FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm admins manage app permissions"
ON app_permissions FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role = 'firm_administrator')
);

CREATE POLICY "Firm members see app configs"
ON app_configurations FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm admins manage app configs"
ON app_configurations FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role = 'firm_administrator')
);

-- 18. CANVAS RLS
-- ============================================================================
CREATE POLICY "Firm members see workspaces"
ON canvas_workspaces FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users create workspaces"
ON canvas_workspaces FOR INSERT TO authenticated
WITH CHECK (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
  AND created_by = auth.uid()
);

CREATE POLICY "Users update own workspaces"
ON canvas_workspaces FOR UPDATE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Firm members see elements"
ON canvas_elements FOR SELECT TO authenticated
USING (
  workspace_id IN (SELECT id FROM canvas_workspaces WHERE firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()))
);

CREATE POLICY "Collaborators manage elements"
ON canvas_elements FOR ALL TO authenticated
USING (
  workspace_id IN (SELECT workspace_id FROM canvas_workspace_collaborators WHERE user_id = auth.uid())
);

CREATE POLICY "Firm members see activity"
ON canvas_activity FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users create activity"
ON canvas_activity FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Firm members see comments"
ON canvas_comments FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users create comments"
ON canvas_comments FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

-- 19. CHANGE_REQUESTS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Users can view change requests in their org projects" ON change_requests;
DROP POLICY IF EXISTS "Users can create change requests in their projects" ON change_requests;
DROP POLICY IF EXISTS "Users can update change requests in their projects" ON change_requests;
DROP POLICY IF EXISTS "Users can delete change requests in their projects" ON change_requests;

CREATE POLICY "Firm members see change requests"
ON change_requests FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users create change requests"
ON change_requests FOR INSERT TO authenticated
WITH CHECK (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()) AND requested_by = auth.uid()
);

CREATE POLICY "Users update own change requests"
ON change_requests FOR UPDATE TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "Managers delete change requests"
ON change_requests FOR DELETE TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role IN ('firm_administrator', 'partner', 'engagement_manager'))
);

-- 20. APPROVAL_WORKFLOWS RLS
-- ============================================================================
DROP POLICY IF EXISTS "Platform admins can manage approval workflows" ON approval_workflows;

CREATE POLICY "Firm members see workflows"
ON approval_workflows FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm admins manage workflows"
ON approval_workflows FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role = 'firm_administrator')
);

-- 21. CLASSIFICATION_RULES RLS
-- ============================================================================
CREATE POLICY "Firm members see classification rules"
ON classification_rules FOR SELECT TO authenticated
USING (firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Firm admins manage rules"
ON classification_rules FOR ALL TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM user_roles WHERE user_id = auth.uid() AND role = 'firm_administrator')
);

-- ============================================================================
-- STEP 2 COMPLETE - RLS POLICIES CREATED
-- ============================================================================