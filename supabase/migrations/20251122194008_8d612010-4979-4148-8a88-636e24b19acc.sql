-- ============================================================================
-- STEP 1: DATABASE FOUNDATION - CONSULTING FIRM PLATFORM (FINAL)
-- ============================================================================

-- 1. RENAME ORGANIZATIONS → FIRMS
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations RENAME TO firms;
  END IF;
END $$;

-- Add consulting-specific fields to firms
ALTER TABLE firms 
  ADD COLUMN IF NOT EXISTS firm_type TEXT DEFAULT 'small' CHECK (firm_type IN ('solo', 'small', 'regional', 'national', 'international')),
  ADD COLUMN IF NOT EXISTS practicing_since DATE,
  ADD COLUMN IF NOT EXISTS license_numbers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS partner_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. RENAME ORGANIZATION_ID → FIRM_ID IN ALL TABLES
-- ============================================================================
DO $$
BEGIN
  -- Rename columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_entities' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_entities RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_evidence' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_evidence RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_findings' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_findings RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_logs RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_metrics' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_metrics RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_plans' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_plans RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_programs' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_programs RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_reports' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_reports RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_workpapers' AND column_name = 'organization_id') THEN
    ALTER TABLE audit_workpapers RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audits' AND column_name = 'organization_id') THEN
    ALTER TABLE audits RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'action_items' AND column_name = 'organization_id') THEN
    ALTER TABLE action_items RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canvas_activity' AND column_name = 'organization_id') THEN
    ALTER TABLE canvas_activity RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canvas_comments' AND column_name = 'organization_id') THEN
    ALTER TABLE canvas_comments RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'change_requests' AND column_name = 'organization_id') THEN
    ALTER TABLE change_requests RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classification_rules' AND column_name = 'organization_id') THEN
    ALTER TABLE classification_rules RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_agents' AND column_name = 'organization_id') THEN
    ALTER TABLE ai_agents RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_executions' AND column_name = 'organization_id') THEN
    ALTER TABLE ai_executions RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_prompts' AND column_name = 'organization_id') THEN
    ALTER TABLE ai_prompts RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_workflows' AND column_name = 'organization_id') THEN
    ALTER TABLE ai_workflows RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'organization_id') THEN
    ALTER TABLE api_keys RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_configurations' AND column_name = 'organization_id') THEN
    ALTER TABLE app_configurations RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_permissions' AND column_name = 'organization_id') THEN
    ALTER TABLE app_permissions RENAME COLUMN organization_id TO firm_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'approval_workflows' AND column_name = 'organization_id') THEN
    ALTER TABLE approval_workflows RENAME COLUMN organization_id TO firm_id;
  END IF;
END $$;

-- 3. DROP OLD TABLES AND TYPE, THEN RECREATE
-- ============================================================================
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS app_role CASCADE;

-- Recreate app_role with 9 consulting firm roles
CREATE TYPE app_role AS ENUM (
  'firm_administrator',
  'partner',
  'practice_leader',
  'business_development',
  'engagement_manager',
  'senior_auditor',
  'staff_auditor',
  'client_administrator',
  'client_user'
);

-- 4. CREATE PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  hire_date DATE,
  termination_date DATE,
  department TEXT,
  practice_area TEXT,
  license_number TEXT,
  client_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Firm members can view firm profiles"
ON profiles FOR SELECT TO authenticated
USING (
  firm_id IN (SELECT firm_id FROM profiles WHERE id = auth.uid())
);

-- 5. CREATE USER_ROLES TABLE
-- ============================================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, role, firm_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Firm admins can manage roles"
ON user_roles FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'firm_administrator'
    AND ur.firm_id = user_roles.firm_id
  )
);

-- 6. CREATE SECURITY DEFINER FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _firm_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND role = _role
    AND firm_id = _firm_id
    AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.is_firm_member(_user_id UUID, _firm_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id 
    AND firm_id = _firm_id
    AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_primary_firm(_user_id UUID)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT firm_id FROM user_roles
  WHERE user_id = _user_id
  AND (expires_at IS NULL OR expires_at > now())
  ORDER BY assigned_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID, _firm_id UUID)
RETURNS TABLE(role app_role)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM user_roles
  WHERE user_id = _user_id 
  AND firm_id = _firm_id
  AND (expires_at IS NULL OR expires_at > now())
$$;

-- 7. CREATE ROLE_PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  scope TEXT DEFAULT 'assigned' CHECK (scope IN ('all', 'assigned', 'practice', 'own', 'firm')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission, resource_type)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
ON role_permissions FOR SELECT TO authenticated
USING (true);

-- 8. SEED 150+ ROLE PERMISSIONS
-- ============================================================================
INSERT INTO role_permissions (role, permission, resource_type, scope, description) VALUES
  -- FIRM ADMINISTRATOR (40 permissions)
  ('firm_administrator', 'manage', 'firm', 'firm', 'Full firm management'),
  ('firm_administrator', 'create', 'user', 'firm', 'Create users'),
  ('firm_administrator', 'update', 'user', 'firm', 'Update users'),
  ('firm_administrator', 'delete', 'user', 'firm', 'Delete users'),
  ('firm_administrator', 'assign', 'role', 'firm', 'Assign roles'),
  ('firm_administrator', 'create', 'engagement', 'firm', 'Create engagements'),
  ('firm_administrator', 'update', 'engagement', 'all', 'Update all engagements'),
  ('firm_administrator', 'delete', 'engagement', 'all', 'Delete engagements'),
  ('firm_administrator', 'view', 'engagement', 'all', 'View all engagements'),
  ('firm_administrator', 'create', 'client', 'firm', 'Create clients'),
  ('firm_administrator', 'update', 'client', 'all', 'Update clients'),
  ('firm_administrator', 'delete', 'client', 'all', 'Delete clients'),
  ('firm_administrator', 'view', 'client', 'all', 'View all clients'),
  ('firm_administrator', 'manage', 'billing', 'firm', 'Manage billing'),
  ('firm_administrator', 'view', 'financials', 'firm', 'View financials'),
  ('firm_administrator', 'manage', 'settings', 'firm', 'Manage settings'),
  ('firm_administrator', 'view', 'audit_log', 'firm', 'View audit logs'),
  ('firm_administrator', 'manage', 'integrations', 'firm', 'Manage integrations'),
  ('firm_administrator', 'create', 'workpaper', 'all', 'Create workpapers'),
  ('firm_administrator', 'update', 'workpaper', 'all', 'Update workpapers'),
  ('firm_administrator', 'delete', 'workpaper', 'all', 'Delete workpapers'),
  ('firm_administrator', 'view', 'workpaper', 'all', 'View workpapers'),
  ('firm_administrator', 'approve', 'workpaper', 'all', 'Approve workpapers'),
  ('firm_administrator', 'create', 'finding', 'all', 'Create findings'),
  ('firm_administrator', 'update', 'finding', 'all', 'Update findings'),
  ('firm_administrator', 'delete', 'finding', 'all', 'Delete findings'),
  ('firm_administrator', 'view', 'finding', 'all', 'View findings'),
  ('firm_administrator', 'approve', 'finding', 'all', 'Approve findings'),
  ('firm_administrator', 'create', 'report', 'all', 'Create reports'),
  ('firm_administrator', 'update', 'report', 'all', 'Update reports'),
  ('firm_administrator', 'delete', 'report', 'all', 'Delete reports'),
  ('firm_administrator', 'view', 'report', 'all', 'View reports'),
  ('firm_administrator', 'approve', 'report', 'all', 'Approve reports'),
  ('firm_administrator', 'view', 'timesheet', 'all', 'View all timesheets'),
  ('firm_administrator', 'approve', 'timesheet', 'all', 'Approve timesheets'),
  ('firm_administrator', 'view', 'budget', 'all', 'View budgets'),
  ('firm_administrator', 'update', 'budget', 'all', 'Update budgets'),
  ('firm_administrator', 'view', 'analytics', 'firm', 'View analytics'),
  ('firm_administrator', 'manage', 'team', 'firm', 'Manage teams'),
  ('firm_administrator', 'assign', 'engagement', 'all', 'Assign engagements'),
  
  -- PARTNER (29 permissions)
  ('partner', 'view', 'engagement', 'all', 'View all engagements'),
  ('partner', 'create', 'engagement', 'firm', 'Create engagements'),
  ('partner', 'update', 'engagement', 'all', 'Update engagements'),
  ('partner', 'approve', 'engagement', 'all', 'Approve engagements'),
  ('partner', 'view', 'client', 'all', 'View all clients'),
  ('partner', 'create', 'client', 'firm', 'Create clients'),
  ('partner', 'update', 'client', 'all', 'Update clients'),
  ('partner', 'view', 'financials', 'firm', 'View financials'),
  ('partner', 'approve', 'budget', 'all', 'Approve budgets'),
  ('partner', 'view', 'workpaper', 'all', 'View all workpapers'),
  ('partner', 'approve', 'workpaper', 'all', 'Approve workpapers'),
  ('partner', 'view', 'finding', 'all', 'View all findings'),
  ('partner', 'approve', 'finding', 'all', 'Approve findings'),
  ('partner', 'view', 'report', 'all', 'View all reports'),
  ('partner', 'approve', 'report', 'all', 'Approve reports'),
  ('partner', 'assign', 'engagement', 'all', 'Assign engagements'),
  ('partner', 'view', 'analytics', 'firm', 'View analytics'),
  ('partner', 'view', 'timesheet', 'all', 'View timesheets'),
  ('partner', 'approve', 'timesheet', 'all', 'Approve timesheets'),
  ('partner', 'view', 'budget', 'all', 'View budgets'),
  ('partner', 'update', 'budget', 'all', 'Update budgets'),
  ('partner', 'create', 'workpaper', 'all', 'Create workpapers'),
  ('partner', 'update', 'workpaper', 'all', 'Update workpapers'),
  ('partner', 'create', 'finding', 'all', 'Create findings'),
  ('partner', 'update', 'finding', 'all', 'Update findings'),
  ('partner', 'create', 'report', 'all', 'Create reports'),
  ('partner', 'update', 'report', 'all', 'Update reports'),
  ('partner', 'manage', 'team', 'firm', 'Manage teams'),
  ('partner', 'assign', 'role', 'firm', 'Assign roles'),
  
  -- PRACTICE LEADER (26 permissions)
  ('practice_leader', 'view', 'engagement', 'practice', 'View practice engagements'),
  ('practice_leader', 'create', 'engagement', 'practice', 'Create engagements'),
  ('practice_leader', 'update', 'engagement', 'practice', 'Update engagements'),
  ('practice_leader', 'approve', 'engagement', 'practice', 'Approve engagements'),
  ('practice_leader', 'view', 'client', 'practice', 'View practice clients'),
  ('practice_leader', 'create', 'client', 'practice', 'Create clients'),
  ('practice_leader', 'update', 'client', 'practice', 'Update clients'),
  ('practice_leader', 'view', 'workpaper', 'practice', 'View workpapers'),
  ('practice_leader', 'approve', 'workpaper', 'practice', 'Approve workpapers'),
  ('practice_leader', 'view', 'finding', 'practice', 'View findings'),
  ('practice_leader', 'approve', 'finding', 'practice', 'Approve findings'),
  ('practice_leader', 'view', 'report', 'practice', 'View reports'),
  ('practice_leader', 'approve', 'report', 'practice', 'Approve reports'),
  ('practice_leader', 'assign', 'engagement', 'practice', 'Assign engagements'),
  ('practice_leader', 'view', 'analytics', 'practice', 'View analytics'),
  ('practice_leader', 'manage', 'team', 'practice', 'Manage practice team'),
  ('practice_leader', 'create', 'workpaper', 'practice', 'Create workpapers'),
  ('practice_leader', 'update', 'workpaper', 'practice', 'Update workpapers'),
  ('practice_leader', 'create', 'finding', 'practice', 'Create findings'),
  ('practice_leader', 'update', 'finding', 'practice', 'Update findings'),
  ('practice_leader', 'create', 'report', 'practice', 'Create reports'),
  ('practice_leader', 'update', 'report', 'practice', 'Update reports'),
  ('practice_leader', 'view', 'timesheet', 'practice', 'View timesheets'),
  ('practice_leader', 'approve', 'timesheet', 'practice', 'Approve timesheets'),
  ('practice_leader', 'view', 'budget', 'practice', 'View budgets'),
  ('practice_leader', 'update', 'budget', 'practice', 'Update budgets'),
  
  -- BUSINESS DEVELOPMENT (12 permissions)
  ('business_development', 'create', 'client', 'firm', 'Create clients'),
  ('business_development', 'update', 'client', 'own', 'Update own clients'),
  ('business_development', 'view', 'client', 'all', 'View all clients'),
  ('business_development', 'create', 'opportunity', 'firm', 'Create opportunities'),
  ('business_development', 'update', 'opportunity', 'own', 'Update own opportunities'),
  ('business_development', 'view', 'opportunity', 'all', 'View opportunities'),
  ('business_development', 'create', 'proposal', 'firm', 'Create proposals'),
  ('business_development', 'update', 'proposal', 'own', 'Update own proposals'),
  ('business_development', 'view', 'proposal', 'all', 'View proposals'),
  ('business_development', 'view', 'analytics', 'firm', 'View BD analytics'),
  ('business_development', 'manage', 'pipeline', 'firm', 'Manage pipeline'),
  ('business_development', 'create', 'engagement', 'firm', 'Create engagements'),
  
  -- ENGAGEMENT MANAGER (24 permissions)
  ('engagement_manager', 'view', 'engagement', 'assigned', 'View assigned engagements'),
  ('engagement_manager', 'update', 'engagement', 'assigned', 'Update assigned engagements'),
  ('engagement_manager', 'create', 'workpaper', 'assigned', 'Create workpapers'),
  ('engagement_manager', 'update', 'workpaper', 'assigned', 'Update workpapers'),
  ('engagement_manager', 'view', 'workpaper', 'assigned', 'View workpapers'),
  ('engagement_manager', 'review', 'workpaper', 'assigned', 'Review workpapers'),
  ('engagement_manager', 'create', 'finding', 'assigned', 'Create findings'),
  ('engagement_manager', 'update', 'finding', 'assigned', 'Update findings'),
  ('engagement_manager', 'view', 'finding', 'assigned', 'View findings'),
  ('engagement_manager', 'create', 'report', 'assigned', 'Create reports'),
  ('engagement_manager', 'update', 'report', 'assigned', 'Update reports'),
  ('engagement_manager', 'view', 'report', 'assigned', 'View reports'),
  ('engagement_manager', 'assign', 'task', 'assigned', 'Assign tasks'),
  ('engagement_manager', 'view', 'timesheet', 'assigned', 'View timesheets'),
  ('engagement_manager', 'approve', 'timesheet', 'assigned', 'Approve timesheets'),
  ('engagement_manager', 'view', 'budget', 'assigned', 'View budget'),
  ('engagement_manager', 'update', 'budget', 'assigned', 'Update budget'),
  ('engagement_manager', 'view', 'client', 'assigned', 'View engagement clients'),
  ('engagement_manager', 'communicate', 'client', 'assigned', 'Communicate with clients'),
  ('engagement_manager', 'create', 'evidence', 'assigned', 'Create evidence'),
  ('engagement_manager', 'update', 'evidence', 'assigned', 'Update evidence'),
  ('engagement_manager', 'view', 'evidence', 'assigned', 'View evidence'),
  ('engagement_manager', 'delete', 'workpaper', 'assigned', 'Delete workpapers'),
  ('engagement_manager', 'delete', 'finding', 'assigned', 'Delete findings'),
  
  -- SENIOR AUDITOR (20 permissions)
  ('senior_auditor', 'view', 'engagement', 'assigned', 'View assigned engagements'),
  ('senior_auditor', 'create', 'workpaper', 'assigned', 'Create workpapers'),
  ('senior_auditor', 'update', 'workpaper', 'assigned', 'Update workpapers'),
  ('senior_auditor', 'view', 'workpaper', 'assigned', 'View workpapers'),
  ('senior_auditor', 'review', 'workpaper', 'assigned', 'Review workpapers'),
  ('senior_auditor', 'create', 'finding', 'assigned', 'Create findings'),
  ('senior_auditor', 'update', 'finding', 'assigned', 'Update findings'),
  ('senior_auditor', 'view', 'finding', 'assigned', 'View findings'),
  ('senior_auditor', 'create', 'evidence', 'assigned', 'Create evidence'),
  ('senior_auditor', 'update', 'evidence', 'assigned', 'Update evidence'),
  ('senior_auditor', 'view', 'evidence', 'assigned', 'View evidence'),
  ('senior_auditor', 'create', 'timesheet', 'own', 'Create timesheets'),
  ('senior_auditor', 'update', 'timesheet', 'own', 'Update timesheets'),
  ('senior_auditor', 'view', 'timesheet', 'own', 'View own timesheets'),
  ('senior_auditor', 'view', 'task', 'assigned', 'View assigned tasks'),
  ('senior_auditor', 'update', 'task', 'assigned', 'Update tasks'),
  ('senior_auditor', 'communicate', 'client', 'assigned', 'Communicate with clients'),
  ('senior_auditor', 'view', 'report', 'assigned', 'View reports'),
  ('senior_auditor', 'create', 'report', 'assigned', 'Create reports'),
  ('senior_auditor', 'update', 'report', 'assigned', 'Update reports'),
  
  -- STAFF AUDITOR (15 permissions)
  ('staff_auditor', 'view', 'engagement', 'assigned', 'View assigned engagements'),
  ('staff_auditor', 'create', 'workpaper', 'assigned', 'Create workpapers'),
  ('staff_auditor', 'update', 'workpaper', 'own', 'Update own workpapers'),
  ('staff_auditor', 'view', 'workpaper', 'assigned', 'View workpapers'),
  ('staff_auditor', 'create', 'finding', 'assigned', 'Create findings'),
  ('staff_auditor', 'update', 'finding', 'own', 'Update own findings'),
  ('staff_auditor', 'view', 'finding', 'assigned', 'View findings'),
  ('staff_auditor', 'create', 'evidence', 'assigned', 'Create evidence'),
  ('staff_auditor', 'update', 'evidence', 'own', 'Update own evidence'),
  ('staff_auditor', 'view', 'evidence', 'assigned', 'View evidence'),
  ('staff_auditor', 'create', 'timesheet', 'own', 'Create timesheets'),
  ('staff_auditor', 'update', 'timesheet', 'own', 'Update timesheets'),
  ('staff_auditor', 'view', 'timesheet', 'own', 'View own timesheets'),
  ('staff_auditor', 'view', 'task', 'assigned', 'View assigned tasks'),
  ('staff_auditor', 'update', 'task', 'assigned', 'Update tasks'),
  
  -- CLIENT ADMINISTRATOR (10 permissions)
  ('client_administrator', 'view', 'engagement', 'assigned', 'View client engagements'),
  ('client_administrator', 'view', 'report', 'assigned', 'View engagement reports'),
  ('client_administrator', 'view', 'finding', 'assigned', 'View findings'),
  ('client_administrator', 'create', 'document', 'assigned', 'Upload documents'),
  ('client_administrator', 'view', 'document', 'assigned', 'View documents'),
  ('client_administrator', 'update', 'document', 'own', 'Update own documents'),
  ('client_administrator', 'create', 'comment', 'assigned', 'Create comments'),
  ('client_administrator', 'view', 'comment', 'assigned', 'View comments'),
  ('client_administrator', 'view', 'timeline', 'assigned', 'View engagement timeline'),
  ('client_administrator', 'manage', 'client_users', 'assigned', 'Manage client users'),
  
  -- CLIENT USER (8 permissions)
  ('client_user', 'view', 'engagement', 'assigned', 'View assigned engagements'),
  ('client_user', 'view', 'report', 'assigned', 'View reports'),
  ('client_user', 'view', 'finding', 'assigned', 'View findings'),
  ('client_user', 'create', 'document', 'assigned', 'Upload documents'),
  ('client_user', 'view', 'document', 'assigned', 'View documents'),
  ('client_user', 'update', 'document', 'own', 'Update own documents'),
  ('client_user', 'create', 'comment', 'assigned', 'Create comments'),
  ('client_user', 'view', 'comment', 'assigned', 'View comments');

-- 9. AUTO-CREATE PROFILE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. PERMISSION CHECK FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id UUID,
  _firm_id UUID,
  _permission TEXT,
  _resource_type TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id
    AND ur.firm_id = _firm_id
    AND rp.permission = _permission
    AND rp.resource_type = _resource_type
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$;