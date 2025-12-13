
-- Migration: 20251107171349

-- Migration: 20251106045224

-- Migration: 20251106013237
-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'Testing', 'Completed', 'On Hold')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget DECIMAL(12, 2),
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  team_members TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251106034829
-- ============================================
-- OBSIDIAN PHASE 1: ORGANIZATIONS & RBAC
-- ============================================

-- Create enums for roles and permissions
CREATE TYPE public.app_role AS ENUM (
  'org_admin',
  'project_manager',
  'internal_contributor',
  'client_executive',
  'client_contributor',
  'external_vendor',
  'auditor',
  'read_only'
);

CREATE TYPE public.permission_type AS ENUM (
  'org.manage',
  'org.view',
  'project.create',
  'project.manage',
  'project.view',
  'task.create',
  'task.manage',
  'task.view',
  'deliverable.create',
  'deliverable.manage',
  'deliverable.approve',
  'deliverable.view',
  'file.upload',
  'file.download',
  'file.delete',
  'form.create',
  'form.assign',
  'form.complete',
  'stakeholder.invite',
  'stakeholder.manage',
  'audit.view',
  'settings.manage'
);

-- ============================================
-- ORGANIZATIONS (Multi-tenant)
-- ============================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4AF37',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  
  -- Settings
  sso_enabled BOOLEAN DEFAULT false,
  mfa_required BOOLEAN DEFAULT false,
  data_region TEXT DEFAULT 'us-east-1',
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES (CRITICAL: Separate table for security)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  
  -- Scope (null = org-wide, otherwise project/artifact-specific)
  project_id UUID,
  
  -- Metadata
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, organization_id, role, project_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PERMISSIONS
-- ============================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission permission_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Seed default permissions
INSERT INTO public.permissions (permission, description) VALUES
  ('org.manage', 'Manage organization settings'),
  ('org.view', 'View organization details'),
  ('project.create', 'Create new projects'),
  ('project.manage', 'Manage project settings'),
  ('project.view', 'View project details'),
  ('task.create', 'Create tasks'),
  ('task.manage', 'Manage tasks'),
  ('task.view', 'View tasks'),
  ('deliverable.create', 'Create deliverables'),
  ('deliverable.manage', 'Manage deliverables'),
  ('deliverable.approve', 'Approve deliverables'),
  ('deliverable.view', 'View deliverables'),
  ('file.upload', 'Upload files'),
  ('file.download', 'Download files'),
  ('file.delete', 'Delete files'),
  ('form.create', 'Create forms'),
  ('form.assign', 'Assign forms'),
  ('form.complete', 'Complete forms'),
  ('stakeholder.invite', 'Invite stakeholders'),
  ('stakeholder.manage', 'Manage stakeholders'),
  ('audit.view', 'View audit logs'),
  ('settings.manage', 'Manage settings');

-- ============================================
-- ROLE PERMISSIONS (Map roles to permissions)
-- ============================================
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission permission_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission)
);

-- Seed role-permission mappings (based on RBAC requirements)
-- Org Admin: Full permissions
INSERT INTO public.role_permissions (role, permission)
SELECT 'org_admin', permission
FROM public.permissions;

-- Project Manager: Project and below
INSERT INTO public.role_permissions (role, permission) VALUES
  ('project_manager', 'org.view'),
  ('project_manager', 'project.create'),
  ('project_manager', 'project.manage'),
  ('project_manager', 'project.view'),
  ('project_manager', 'task.create'),
  ('project_manager', 'task.manage'),
  ('project_manager', 'task.view'),
  ('project_manager', 'deliverable.create'),
  ('project_manager', 'deliverable.manage'),
  ('project_manager', 'deliverable.view'),
  ('project_manager', 'file.upload'),
  ('project_manager', 'file.download'),
  ('project_manager', 'file.delete'),
  ('project_manager', 'form.create'),
  ('project_manager', 'form.assign'),
  ('project_manager', 'stakeholder.invite'),
  ('project_manager', 'stakeholder.manage');

-- Internal Contributor: Work on assigned tasks
INSERT INTO public.role_permissions (role, permission) VALUES
  ('internal_contributor', 'project.view'),
  ('internal_contributor', 'task.view'),
  ('internal_contributor', 'task.manage'),
  ('internal_contributor', 'deliverable.view'),
  ('internal_contributor', 'file.upload'),
  ('internal_contributor', 'file.download'),
  ('internal_contributor', 'form.complete');

-- Client Executive: Approve and request
INSERT INTO public.role_permissions (role, permission) VALUES
  ('client_executive', 'project.view'),
  ('client_executive', 'task.view'),
  ('client_executive', 'deliverable.view'),
  ('client_executive', 'deliverable.approve'),
  ('client_executive', 'file.download'),
  ('client_executive', 'stakeholder.invite');

-- Client Contributor: Complete assigned actions
INSERT INTO public.role_permissions (role, permission) VALUES
  ('client_contributor', 'project.view'),
  ('client_contributor', 'task.view'),
  ('client_contributor', 'deliverable.view'),
  ('client_contributor', 'file.upload'),
  ('client_contributor', 'file.download'),
  ('client_contributor', 'form.complete');

-- External Vendor: Restricted access
INSERT INTO public.role_permissions (role, permission) VALUES
  ('external_vendor', 'task.view'),
  ('external_vendor', 'file.upload'),
  ('external_vendor', 'file.download');

-- Auditor: Read-only with audit access
INSERT INTO public.role_permissions (role, permission) VALUES
  ('auditor', 'org.view'),
  ('auditor', 'project.view'),
  ('auditor', 'task.view'),
  ('auditor', 'deliverable.view'),
  ('auditor', 'audit.view');

-- Read-Only: View only
INSERT INTO public.role_permissions (role, permission) VALUES
  ('read_only', 'org.view'),
  ('read_only', 'project.view'),
  ('read_only', 'task.view'),
  ('read_only', 'deliverable.view');

-- ============================================
-- ORGANIZATION MEMBERS (Junction table)
-- ============================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX idx_audit_logs_org ON public.audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- ============================================
-- SECURITY DEFINER FUNCTIONS (Avoid RLS recursion)
-- ============================================

-- Check if user has a specific role in an organization
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _org_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
      AND project_id IS NULL
  );
$$;

-- Check if user has any role in an organization
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND status = 'active'
  );
$$;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _org_id UUID, _permission permission_type)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND ur.organization_id = _org_id
      AND rp.permission = _permission
      AND ur.project_id IS NULL
  );
$$;

-- Get user's primary organization
CREATE OR REPLACE FUNCTION public.get_user_primary_org(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Organizations: Users can view orgs they're members of
CREATE POLICY "Users can view their organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), id)
);

-- Organizations: Org admins can update
CREATE POLICY "Org admins can update organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), id, 'org_admin')
);

-- User Roles: Users can view roles in their orgs
CREATE POLICY "Users can view roles in their organizations"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- User Roles: Org admins can manage roles
CREATE POLICY "Org admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), organization_id, 'org_admin')
);

-- Organization Members: Users can view members of their orgs
CREATE POLICY "Users can view org members"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- Organization Members: Org admins can manage members
CREATE POLICY "Org admins can manage members"
ON public.organization_members
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), organization_id, 'org_admin')
);

-- Audit Logs: Auditors and org admins can view
CREATE POLICY "Auditors and admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), organization_id, 'org_admin')
  OR public.has_role(auth.uid(), organization_id, 'auditor')
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles to add org reference
ALTER TABLE public.profiles
ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Update profiles trigger to support first_name and last_name
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      CONCAT(
        NEW.raw_user_meta_data->>'first_name',
        ' ',
        NEW.raw_user_meta_data->>'last_name'
      ),
      NEW.raw_user_meta_data->>'full_name',
      ''
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251106040218
-- ============================================
-- WORKSTREAMS MODULE (Fixed)
-- ============================================

-- Create workstreams table
CREATE TABLE public.workstreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'archived')),
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  color TEXT DEFAULT '#D4AF37',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.workstreams ENABLE ROW LEVEL SECURITY;

-- Create index for performance
CREATE INDEX idx_workstreams_project ON public.workstreams(project_id);

-- ============================================
-- RLS POLICIES FOR WORKSTREAMS
-- ============================================

-- Workstreams: Users can view workstreams in accessible projects
CREATE POLICY "Users can view workstreams"
ON public.workstreams
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects
    WHERE user_id = auth.uid()
  )
);

-- Workstreams: Project owners can create workstreams
CREATE POLICY "Project owners can create workstreams"
ON public.workstreams
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

-- Workstreams: Project owners can update workstreams
CREATE POLICY "Project owners can update workstreams"
ON public.workstreams
FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

-- Workstreams: Project owners can delete workstreams
CREATE POLICY "Project owners can delete workstreams"
ON public.workstreams
FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_workstreams_updated_at
BEFORE UPDATE ON public.workstreams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106044558
-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workstream_id UUID REFERENCES public.workstreams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  tags JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_workstream_id ON public.tasks(workstream_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for tasks
CREATE POLICY "Users can view tasks for their projects"
ON public.tasks FOR SELECT
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create tasks for their projects"
ON public.tasks FOR INSERT
WITH CHECK (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update tasks for their projects"
ON public.tasks FOR UPDATE
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete tasks for their projects"
ON public.tasks FOR DELETE
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

-- Create files table
CREATE TABLE public.files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workstream_id UUID REFERENCES public.workstreams(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  folder TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for files
CREATE INDEX idx_files_project_id ON public.files(project_id);
CREATE INDEX idx_files_workstream_id ON public.files(workstream_id);
CREATE INDEX idx_files_task_id ON public.files(task_id);

-- Enable RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS policies for files
CREATE POLICY "Users can view files for their projects"
ON public.files FOR SELECT
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can upload files to their projects"
ON public.files FOR INSERT
WITH CHECK (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete files from their projects"
ON public.files FOR DELETE
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for task_comments
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);

-- Enable RLS for task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_comments
CREATE POLICY "Users can view comments for accessible tasks"
ON public.task_comments FOR SELECT
USING (task_id IN (
  SELECT id FROM public.tasks WHERE project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can create comments on accessible tasks"
ON public.task_comments FOR INSERT
WITH CHECK (
  task_id IN (
    SELECT id FROM public.tasks WHERE project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  ) AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own comments"
ON public.task_comments FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
ON public.task_comments FOR DELETE
USING (user_id = auth.uid());

-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for activity_log
CREATE INDEX idx_activity_log_project_id ON public.activity_log(project_id);
CREATE INDEX idx_activity_log_task_id ON public.activity_log(task_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Enable RLS for activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_log
CREATE POLICY "Users can view activity for their projects"
ON public.activity_log FOR SELECT
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create activity logs for their projects"
ON public.activity_log FOR INSERT
WITH CHECK (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- Create task_dependencies table
CREATE TABLE public.task_dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Create indexes for task_dependencies
CREATE INDEX idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

-- Enable RLS for task_dependencies
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_dependencies
CREATE POLICY "Users can view task dependencies for their projects"
ON public.task_dependencies FOR SELECT
USING (task_id IN (
  SELECT id FROM public.tasks WHERE project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can create task dependencies for their projects"
ON public.task_dependencies FOR INSERT
WITH CHECK (task_id IN (
  SELECT id FROM public.tasks WHERE project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can delete task dependencies for their projects"
ON public.task_dependencies FOR DELETE
USING (task_id IN (
  SELECT id FROM public.tasks WHERE project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
));

-- Create project_members table for team management
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create index for project_members
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);

-- Enable RLS for project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_members
CREATE POLICY "Project owners can manage members"
ON public.project_members FOR ALL
USING (project_id IN (
  SELECT id FROM public.projects WHERE user_id = auth.uid()
));

CREATE POLICY "Members can view project members"
ON public.project_members FOR SELECT
USING (
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  ) OR user_id = auth.uid()
);

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- Storage RLS policies
CREATE POLICY "Project owners can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project owners can view their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project owners can update their files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project owners can delete their files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at
BEFORE UPDATE ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;


-- Migration: 20251106051202
-- Phase 1, Week 1: Organization Setup & RBAC Foundation

-- Add default org creation for existing users
CREATE OR REPLACE FUNCTION ensure_user_has_org()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create personal org
  INSERT INTO organizations (name, slug, status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Organization',
    lower(replace(split_part(NEW.email, '@', 1), '.', '-')) || '-' || substr(NEW.id::text, 1, 8),
    'active'
  )
  RETURNING id INTO new_org_id;
  
  -- Add user as org member
  INSERT INTO organization_members (user_id, organization_id, status)
  VALUES (NEW.id, new_org_id, 'active');
  
  -- Assign org_admin role
  INSERT INTO user_roles (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'org_admin');
  
  -- Update profile with org_id
  UPDATE profiles 
  SET organization_id = new_org_id 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_org_setup ON auth.users;
CREATE TRIGGER on_auth_user_org_setup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_has_org();

-- Organization invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  roles app_role[] NOT NULL DEFAULT '{}',
  invited_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email, status)
);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: Org admins can manage invitations
CREATE POLICY "Org admins can manage invitations"
  ON organization_invitations
  FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

-- Enhanced security functions
CREATE OR REPLACE FUNCTION get_user_roles(_user_id uuid, _org_id uuid)
RETURNS TABLE (role app_role, project_id uuid) AS $$
  SELECT role, project_id
  FROM user_roles
  WHERE user_id = _user_id 
    AND organization_id = _org_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(_user_id uuid, _org_id uuid)
RETURNS TABLE (permission permission_type) AS $$
  SELECT DISTINCT rp.permission
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = _project_id
      AND (
        p.user_id = _user_id
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = _user_id
        )
        OR has_role(_user_id, (SELECT organization_id FROM profiles WHERE id = p.user_id), 'org_admin')
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_org ON user_roles(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org ON organization_invitations(organization_id, status);

-- Migration: 20251106053635
-- Phase 1: Database Changes for Two-Track Signup System

-- 1. Add company information fields to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS billing_email text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS tax_id text;

-- 2. Add acceptance tracking to organization_invitations
ALTER TABLE public.organization_invitations
ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. Remove auto-organization creation trigger and function
DROP TRIGGER IF EXISTS on_auth_user_org_setup ON auth.users;
DROP FUNCTION IF EXISTS public.ensure_user_has_org();

-- 4. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token 
ON public.organization_invitations(token) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_organization_invitations_accepted 
ON public.organization_invitations(accepted_at) 
WHERE accepted_at IS NOT NULL;

-- 5. Update RLS policy for organization_invitations to allow public token validation
DROP POLICY IF EXISTS "Public can validate invitation tokens" ON public.organization_invitations;
CREATE POLICY "Public can validate invitation tokens"
ON public.organization_invitations
FOR SELECT
TO public
USING (status = 'pending' AND expires_at > now());

-- Migration: 20251106162050
-- Create function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id uuid,
  _organization_id uuid,
  _action text,
  _resource_type text,
  _resource_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    _user_id,
    _organization_id,
    _action,
    _resource_type,
    _resource_id,
    _metadata,
    now()
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Trigger function for user role changes
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event(
      NEW.assigned_by,
      NEW.organization_id,
      'role_assigned',
      'user_role',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'role', NEW.role,
        'project_id', NEW.project_id
      )
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event(
      NEW.assigned_by,
      NEW.organization_id,
      'role_updated',
      'user_role',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'project_id', NEW.project_id
      )
    );
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event(
      auth.uid(),
      OLD.organization_id,
      'role_removed',
      'user_role',
      OLD.id,
      jsonb_build_object(
        'user_id', OLD.user_id,
        'role', OLD.role,
        'project_id', OLD.project_id
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for organization changes
CREATE OR REPLACE FUNCTION public.audit_organization_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    -- Log SSO changes
    IF OLD.sso_enabled != NEW.sso_enabled THEN
      PERFORM log_audit_event(
        auth.uid(),
        NEW.id,
        CASE WHEN NEW.sso_enabled THEN 'sso_enabled' ELSE 'sso_disabled' END,
        'organization',
        NEW.id,
        jsonb_build_object('sso_enabled', NEW.sso_enabled)
      );
    END IF;
    
    -- Log MFA requirement changes
    IF OLD.mfa_required != NEW.mfa_required THEN
      PERFORM log_audit_event(
        auth.uid(),
        NEW.id,
        CASE WHEN NEW.mfa_required THEN 'mfa_required_enabled' ELSE 'mfa_required_disabled' END,
        'organization',
        NEW.id,
        jsonb_build_object('mfa_required', NEW.mfa_required)
      );
    END IF;
    
    -- Log general organization updates
    IF OLD.name != NEW.name OR OLD.slug != NEW.slug THEN
      PERFORM log_audit_event(
        auth.uid(),
        NEW.id,
        'organization_updated',
        'organization',
        NEW.id,
        jsonb_build_object(
          'old_name', OLD.name,
          'new_name', NEW.name,
          'old_slug', OLD.slug,
          'new_slug', NEW.slug
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for project changes
CREATE OR REPLACE FUNCTION public.audit_project_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Get organization_id from user's profile
  SELECT organization_id INTO _org_id
  FROM profiles
  WHERE id = COALESCE(NEW.user_id, OLD.user_id)
  LIMIT 1;
  
  IF _org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event(
      NEW.user_id,
      _org_id,
      'project_created',
      'project',
      NEW.id,
      jsonb_build_object(
        'project_name', NEW.name,
        'status', NEW.status,
        'client', NEW.client
      )
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM log_audit_event(
      auth.uid(),
      _org_id,
      'project_updated',
      'project',
      NEW.id,
      jsonb_build_object(
        'project_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event(
      auth.uid(),
      _org_id,
      'project_deleted',
      'project',
      OLD.id,
      jsonb_build_object(
        'project_name', OLD.name,
        'client', OLD.client
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function for organization member changes
CREATE OR REPLACE FUNCTION public.audit_organization_member_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event(
      NEW.invited_by,
      NEW.organization_id,
      'member_added',
      'organization_member',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'status', NEW.status
      )
    );
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event(
      auth.uid(),
      OLD.organization_id,
      'member_removed',
      'organization_member',
      OLD.id,
      jsonb_build_object(
        'user_id', OLD.user_id
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS audit_user_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_user_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_role_changes();

DROP TRIGGER IF EXISTS audit_organization_changes_trigger ON public.organizations;
CREATE TRIGGER audit_organization_changes_trigger
  AFTER UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_organization_changes();

DROP TRIGGER IF EXISTS audit_project_changes_trigger ON public.projects;
CREATE TRIGGER audit_project_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_project_changes();

DROP TRIGGER IF EXISTS audit_organization_member_changes_trigger ON public.organization_members;
CREATE TRIGGER audit_organization_member_changes_trigger
  AFTER INSERT OR DELETE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_organization_member_changes();

-- Migration: 20251106162852
-- Create deliverables table with lifecycle management
CREATE TABLE public.deliverables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workstream_id uuid REFERENCES public.workstreams(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'document', -- document, design, code, report, presentation, other
  status text NOT NULL DEFAULT 'draft', -- draft, in_review, approved, rejected, archived
  version integer NOT NULL DEFAULT 1,
  due_date date,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  reviewed_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  file_ids uuid[] DEFAULT ARRAY[]::uuid[],
  tags text[] DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_deliverables_project_id ON public.deliverables(project_id);
CREATE INDEX idx_deliverables_workstream_id ON public.deliverables(workstream_id);
CREATE INDEX idx_deliverables_status ON public.deliverables(status);
CREATE INDEX idx_deliverables_created_by ON public.deliverables(created_by);
CREATE INDEX idx_deliverables_assigned_to ON public.deliverables(assigned_to);
CREATE INDEX idx_deliverables_due_date ON public.deliverables(due_date);

-- RLS Policies for deliverables
CREATE POLICY "Users can view deliverables for their projects"
  ON public.deliverables
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create deliverables for their projects"
  ON public.deliverables
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update deliverables for their projects"
  ON public.deliverables
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete deliverables for their projects"
  ON public.deliverables
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create deliverable comments table
CREATE TABLE public.deliverable_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id uuid NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for deliverable comments
ALTER TABLE public.deliverable_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deliverable comments
CREATE POLICY "Users can view comments for accessible deliverables"
  ON public.deliverable_comments
  FOR SELECT
  USING (
    deliverable_id IN (
      SELECT id FROM deliverables WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create comments on accessible deliverables"
  ON public.deliverable_comments
  FOR INSERT
  WITH CHECK (
    deliverable_id IN (
      SELECT id FROM deliverables WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON public.deliverable_comments
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON public.deliverable_comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Create deliverable versions table for version history
CREATE TABLE public.deliverable_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deliverable_id uuid NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL,
  file_ids uuid[] DEFAULT ARRAY[]::uuid[],
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS for deliverable versions
ALTER TABLE public.deliverable_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions for accessible deliverables"
  ON public.deliverable_versions
  FOR SELECT
  USING (
    deliverable_id IN (
      SELECT id FROM deliverables WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger function for deliverable changes audit
CREATE OR REPLACE FUNCTION public.audit_deliverable_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Get organization_id from user's profile
  SELECT organization_id INTO _org_id
  FROM profiles
  WHERE id = COALESCE(NEW.created_by, OLD.created_by)
  LIMIT 1;
  
  IF _org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  IF (TG_OP = 'INSERT') THEN
    PERFORM log_audit_event(
      NEW.created_by,
      _org_id,
      'deliverable_created',
      'deliverable',
      NEW.id,
      jsonb_build_object(
        'title', NEW.title,
        'type', NEW.type,
        'status', NEW.status,
        'project_id', NEW.project_id
      )
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      PERFORM log_audit_event(
        auth.uid(),
        _org_id,
        'deliverable_status_changed',
        'deliverable',
        NEW.id,
        jsonb_build_object(
          'title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'approved_by', NEW.approved_by,
          'reviewed_by', NEW.reviewed_by
        )
      );
    END IF;
    
    -- Log approval
    IF OLD.approved_by IS NULL AND NEW.approved_by IS NOT NULL THEN
      PERFORM log_audit_event(
        NEW.approved_by,
        _org_id,
        'deliverable_approved',
        'deliverable',
        NEW.id,
        jsonb_build_object(
          'title', NEW.title,
          'version', NEW.version,
          'approved_at', NEW.approved_at
        )
      );
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM log_audit_event(
      auth.uid(),
      _org_id,
      'deliverable_deleted',
      'deliverable',
      OLD.id,
      jsonb_build_object(
        'title', OLD.title,
        'type', OLD.type,
        'status', OLD.status
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for deliverable audit logging
DROP TRIGGER IF EXISTS audit_deliverable_changes_trigger ON public.deliverables;
CREATE TRIGGER audit_deliverable_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_deliverable_changes();

-- Add updated_at trigger for deliverables
DROP TRIGGER IF EXISTS update_deliverables_updated_at ON public.deliverables;
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for deliverable_comments
DROP TRIGGER IF EXISTS update_deliverable_comments_updated_at ON public.deliverable_comments;
CREATE TRIGGER update_deliverable_comments_updated_at
  BEFORE UPDATE ON public.deliverable_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106163510
-- Add storage policies for deliverable files
CREATE POLICY "Users can view deliverable files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-files' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM deliverables 
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can upload deliverable files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM deliverables 
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete deliverable files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM deliverables 
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

-- Add a helper column to files table for easier deliverable association
ALTER TABLE files ADD COLUMN IF NOT EXISTS deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE;

-- Add index to improve file queries by deliverable
CREATE INDEX IF NOT EXISTS idx_files_deliverable_id ON files(deliverable_id) WHERE deliverable_id IS NOT NULL;

-- Migration: 20251106163600
-- Enable RLS on permissions and role_permissions tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view permissions (read-only reference data)
CREATE POLICY "Everyone can view permissions"
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

-- Allow everyone to view role_permissions (read-only reference data)
CREATE POLICY "Everyone can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Migration: 20251106164201
-- Create approval workflow tables

-- Approval workflow templates
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Approval stages within a workflow
CREATE TABLE IF NOT EXISTS public.approval_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  stage_order integer NOT NULL,
  approval_type text NOT NULL CHECK (approval_type IN ('sequential', 'parallel', 'any_one')),
  required_approvals integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Approvers for each stage
CREATE TABLE IF NOT EXISTS public.stage_approvers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES approval_stages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(stage_id, user_id)
);

-- Deliverable approval instances (links deliverable to workflow)
CREATE TABLE IF NOT EXISTS public.deliverable_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id),
  current_stage_id uuid REFERENCES approval_stages(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Individual approval records
CREATE TABLE IF NOT EXISTS public.approval_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_approval_id uuid NOT NULL REFERENCES deliverable_approvals(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES approval_stages(id),
  approver_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comments text,
  decided_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(deliverable_approval_id, stage_id, approver_id)
);

-- Enable RLS on all tables
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverable_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval_workflows
CREATE POLICY "Users can view org workflows"
ON public.approval_workflows FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage workflows"
ON public.approval_workflows FOR ALL
USING (has_role(auth.uid(), organization_id, 'org_admin'))
WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'));

-- RLS Policies for approval_stages
CREATE POLICY "Users can view stages of accessible workflows"
ON public.approval_stages FOR SELECT
USING (
  workflow_id IN (
    SELECT id FROM approval_workflows 
    WHERE is_org_member(auth.uid(), organization_id)
  )
);

CREATE POLICY "Org admins can manage stages"
ON public.approval_stages FOR ALL
USING (
  workflow_id IN (
    SELECT id FROM approval_workflows 
    WHERE has_role(auth.uid(), organization_id, 'org_admin')
  )
)
WITH CHECK (
  workflow_id IN (
    SELECT id FROM approval_workflows 
    WHERE has_role(auth.uid(), organization_id, 'org_admin')
  )
);

-- RLS Policies for stage_approvers
CREATE POLICY "Users can view approvers of accessible stages"
ON public.stage_approvers FOR SELECT
USING (
  stage_id IN (
    SELECT s.id FROM approval_stages s
    JOIN approval_workflows w ON s.workflow_id = w.id
    WHERE is_org_member(auth.uid(), w.organization_id)
  )
);

CREATE POLICY "Org admins can manage approvers"
ON public.stage_approvers FOR ALL
USING (
  stage_id IN (
    SELECT s.id FROM approval_stages s
    JOIN approval_workflows w ON s.workflow_id = w.id
    WHERE has_role(auth.uid(), w.organization_id, 'org_admin')
  )
)
WITH CHECK (
  stage_id IN (
    SELECT s.id FROM approval_stages s
    JOIN approval_workflows w ON s.workflow_id = w.id
    WHERE has_role(auth.uid(), w.organization_id, 'org_admin')
  )
);

-- RLS Policies for deliverable_approvals
CREATE POLICY "Users can view approvals for accessible deliverables"
ON public.deliverable_approvals FOR SELECT
USING (
  deliverable_id IN (
    SELECT id FROM deliverables
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create approvals for their deliverables"
ON public.deliverable_approvals FOR INSERT
WITH CHECK (
  deliverable_id IN (
    SELECT id FROM deliverables
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Approvers can update approval status"
ON public.deliverable_approvals FOR UPDATE
USING (
  id IN (
    SELECT deliverable_approval_id FROM approval_records
    WHERE approver_id = auth.uid()
  )
  OR deliverable_id IN (
    SELECT id FROM deliverables
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for approval_records
CREATE POLICY "Users can view approval records for accessible deliverables"
ON public.approval_records FOR SELECT
USING (
  deliverable_approval_id IN (
    SELECT id FROM deliverable_approvals
    WHERE deliverable_id IN (
      SELECT id FROM deliverables
      WHERE project_id IN (
        SELECT id FROM projects WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "System can create approval records"
ON public.approval_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "Approvers can update their own records"
ON public.approval_records FOR UPDATE
USING (approver_id = auth.uid())
WITH CHECK (approver_id = auth.uid());

-- Create indexes
CREATE INDEX idx_approval_stages_workflow ON approval_stages(workflow_id);
CREATE INDEX idx_stage_approvers_stage ON stage_approvers(stage_id);
CREATE INDEX idx_stage_approvers_user ON stage_approvers(user_id);
CREATE INDEX idx_deliverable_approvals_deliverable ON deliverable_approvals(deliverable_id);
CREATE INDEX idx_approval_records_approval ON approval_records(deliverable_approval_id);
CREATE INDEX idx_approval_records_approver ON approval_records(approver_id);

-- Add updated_at trigger
CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliverable_approvals_updated_at
  BEFORE UPDATE ON deliverable_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: 20251106173501
-- Add INSERT policy for organizations table to allow authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Migration: 20251106174611
-- Bootstrap policies to allow org creator to add themselves as first member and admin

-- organization_members: allow authenticated user to insert themselves as the first member of a new org
CREATE POLICY "User can self-join as first member"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = organization_members.organization_id
  )
);

-- user_roles: allow authenticated user to assign themselves org_admin as the first role entry for that org
CREATE POLICY "User can self-assign org_admin initially"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'org_admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.organization_id = user_roles.organization_id
  )
);

-- Migration: 20251106190543
-- Create form_templates table for reusable form templates
CREATE TABLE public.form_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_runs table for tracking form assignments and responses
CREATE TABLE public.form_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_answers table for storing individual field answers
CREATE TABLE public.form_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_run_id UUID NOT NULL REFERENCES public.form_runs(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL,
  value JSONB NOT NULL,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Org members can view templates"
  ON public.form_templates FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage templates"
  ON public.form_templates FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- RLS Policies for form_runs
CREATE POLICY "Users can view assigned forms"
  ON public.form_runs FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id) OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Users with form.create permission can create forms"
  ON public.form_runs FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), organization_id, 'form.create'::permission_type) AND
    assigned_by = auth.uid()
  );

CREATE POLICY "Form creators and assignees can update forms"
  ON public.form_runs FOR UPDATE
  USING (
    assigned_by = auth.uid() OR
    assigned_to = auth.uid() OR
    has_permission(auth.uid(), organization_id, 'form.assign'::permission_type)
  );

CREATE POLICY "Form creators can delete forms"
  ON public.form_runs FOR DELETE
  USING (assigned_by = auth.uid());

-- RLS Policies for form_answers
CREATE POLICY "Users can view answers for accessible forms"
  ON public.form_answers FOR SELECT
  USING (
    form_run_id IN (
      SELECT id FROM public.form_runs
      WHERE assigned_to = auth.uid() OR assigned_by = auth.uid()
    )
  );

CREATE POLICY "Assigned users can create answers"
  ON public.form_answers FOR INSERT
  WITH CHECK (
    form_run_id IN (
      SELECT id FROM public.form_runs WHERE assigned_to = auth.uid()
    ) AND answered_by = auth.uid()
  );

CREATE POLICY "Users can update their own answers"
  ON public.form_answers FOR UPDATE
  USING (answered_by = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_runs_updated_at
  BEFORE UPDATE ON public.form_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_form_templates_org ON public.form_templates(organization_id);
CREATE INDEX idx_form_runs_org ON public.form_runs(organization_id);
CREATE INDEX idx_form_runs_project ON public.form_runs(project_id);
CREATE INDEX idx_form_runs_assigned_to ON public.form_runs(assigned_to);
CREATE INDEX idx_form_answers_run ON public.form_answers(form_run_id);

-- Migration: 20251106200105
-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL DEFAULT 'general', -- general, kickoff, review, status, client, internal
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT, -- physical location or meeting link
  meeting_link TEXT, -- Zoom, Teams, Meet link
  recording_link TEXT,
  transcript_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting_attendees table
CREATE TABLE public.meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL DEFAULT 'invited', -- invited, accepted, declined, tentative, attended
  is_organizer BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

-- Create meeting_minutes table
CREATE TABLE public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  agenda TEXT,
  summary TEXT,
  decisions TEXT,
  next_steps TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create action_items table
CREATE TABLE public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, completed, cancelled
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings in their org"
  ON public.meetings FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create meetings in their org"
  ON public.meetings FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Meeting creators and org admins can update"
  ON public.meetings FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), organization_id, 'org_admin')
  );

CREATE POLICY "Meeting creators and org admins can delete"
  ON public.meetings FOR DELETE
  USING (
    created_by = auth.uid() 
    OR has_role(auth.uid(), organization_id, 'org_admin')
  );

-- RLS Policies for meeting_attendees
CREATE POLICY "Users can view attendees of accessible meetings"
  ON public.meeting_attendees FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Meeting organizers can manage attendees"
  ON public.meeting_attendees FOR ALL
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings 
      WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for meeting_minutes
CREATE POLICY "Users can view minutes of accessible meetings"
  ON public.meeting_minutes FOR SELECT
  USING (
    meeting_id IN (
      SELECT id FROM public.meetings 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Meeting attendees can create minutes"
  ON public.meeting_minutes FOR INSERT
  WITH CHECK (
    meeting_id IN (
      SELECT meeting_id FROM public.meeting_attendees 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Minutes creators can update"
  ON public.meeting_minutes FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for action_items
CREATE POLICY "Users can view action items in their org"
  ON public.action_items FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create action items in their org"
  ON public.action_items FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Assigned users and creators can update action items"
  ON public.action_items FOR UPDATE
  USING (
    assigned_to = auth.uid() 
    OR created_by = auth.uid()
    OR has_role(auth.uid(), organization_id, 'org_admin')
  );

CREATE POLICY "Creators and org admins can delete action items"
  ON public.action_items FOR DELETE
  USING (
    created_by = auth.uid()
    OR has_role(auth.uid(), organization_id, 'org_admin')
  );

-- Create indexes
CREATE INDEX idx_meetings_organization ON public.meetings(organization_id);
CREATE INDEX idx_meetings_project ON public.meetings(project_id);
CREATE INDEX idx_meetings_scheduled_at ON public.meetings(scheduled_at);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meeting_attendees_meeting ON public.meeting_attendees(meeting_id);
CREATE INDEX idx_meeting_attendees_user ON public.meeting_attendees(user_id);
CREATE INDEX idx_meeting_minutes_meeting ON public.meeting_minutes(meeting_id);
CREATE INDEX idx_action_items_organization ON public.action_items(organization_id);
CREATE INDEX idx_action_items_meeting ON public.action_items(meeting_id);
CREATE INDEX idx_action_items_project ON public.action_items(project_id);
CREATE INDEX idx_action_items_assigned_to ON public.action_items(assigned_to);
CREATE INDEX idx_action_items_status ON public.action_items(status);
CREATE INDEX idx_action_items_due_date ON public.action_items(due_date);

-- Create updated_at triggers
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON public.meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106200709
-- Create risks table
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical', -- technical, schedule, budget, resource, external, other
  probability TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  impact TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE probability
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
      ELSE 2
    END *
    CASE impact
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
      WHEN 'critical' THEN 4
      ELSE 2
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'identified', -- identified, assessing, mitigating, monitoring, closed
  owner_id UUID REFERENCES auth.users(id),
  mitigation_plan TEXT,
  contingency_plan TEXT,
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_closure_date DATE,
  actual_closure_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issues table
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'technical', -- technical, process, resource, quality, scope, other
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID REFERENCES auth.users(id),
  reported_by UUID REFERENCES auth.users(id),
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  resolved_date DATE,
  resolution TEXT,
  sla_breach BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decisions table
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT,
  decision TEXT NOT NULL,
  rationale TEXT,
  alternatives_considered TEXT,
  decision_type TEXT NOT NULL DEFAULT 'technical', -- technical, business, architectural, process, other
  status TEXT NOT NULL DEFAULT 'proposed', -- proposed, under_review, approved, rejected, implemented
  impact_assessment TEXT,
  decision_maker_id UUID REFERENCES auth.users(id),
  decided_date DATE,
  review_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decision_votes table
CREATE TABLE public.decision_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote TEXT NOT NULL, -- approve, reject, abstain
  comment TEXT,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(decision_id, user_id)
);

-- Create change_requests table
CREATE TABLE public.change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'scope', -- scope, schedule, budget, resource, requirement, other
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, under_review, approved, rejected, implemented, cancelled
  requested_by UUID REFERENCES auth.users(id),
  requested_date DATE NOT NULL DEFAULT CURRENT_DATE,
  impact_scope TEXT,
  impact_schedule TEXT,
  impact_budget NUMERIC,
  impact_resources TEXT,
  justification TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_date DATE,
  implementation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risks
CREATE POLICY "Users can view risks in their org projects"
  ON public.risks FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create risks in their projects"
  ON public.risks FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update risks in their projects"
  ON public.risks FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete risks in their projects"
  ON public.risks FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for issues
CREATE POLICY "Users can view issues in their org projects"
  ON public.issues FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create issues in their projects"
  ON public.issues FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
    AND reported_by = auth.uid()
  );

CREATE POLICY "Users can update issues in their projects"
  ON public.issues FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete issues in their projects"
  ON public.issues FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for decisions
CREATE POLICY "Users can view decisions in their org projects"
  ON public.decisions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create decisions in their projects"
  ON public.decisions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update decisions in their projects"
  ON public.decisions FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete decisions in their projects"
  ON public.decisions FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for decision_votes
CREATE POLICY "Users can view votes on accessible decisions"
  ON public.decision_votes FOR SELECT
  USING (
    decision_id IN (
      SELECT id FROM public.decisions 
      WHERE project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create their own votes"
  ON public.decision_votes FOR INSERT
  WITH CHECK (
    decision_id IN (
      SELECT id FROM public.decisions 
      WHERE project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own votes"
  ON public.decision_votes FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for change_requests
CREATE POLICY "Users can view change requests in their org projects"
  ON public.change_requests FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create change requests in their projects"
  ON public.change_requests FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Users can update change requests in their projects"
  ON public.change_requests FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete change requests in their projects"
  ON public.change_requests FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_risks_organization ON public.risks(organization_id);
CREATE INDEX idx_risks_project ON public.risks(project_id);
CREATE INDEX idx_risks_status ON public.risks(status);
CREATE INDEX idx_risks_owner ON public.risks(owner_id);
CREATE INDEX idx_risks_score ON public.risks(risk_score DESC);

CREATE INDEX idx_issues_organization ON public.issues(organization_id);
CREATE INDEX idx_issues_project ON public.issues(project_id);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_priority ON public.issues(priority);
CREATE INDEX idx_issues_assigned_to ON public.issues(assigned_to);
CREATE INDEX idx_issues_sla_breach ON public.issues(sla_breach) WHERE sla_breach = true;

CREATE INDEX idx_decisions_organization ON public.decisions(organization_id);
CREATE INDEX idx_decisions_project ON public.decisions(project_id);
CREATE INDEX idx_decisions_status ON public.decisions(status);
CREATE INDEX idx_decisions_maker ON public.decisions(decision_maker_id);

CREATE INDEX idx_decision_votes_decision ON public.decision_votes(decision_id);
CREATE INDEX idx_decision_votes_user ON public.decision_votes(user_id);

CREATE INDEX idx_change_requests_organization ON public.change_requests(organization_id);
CREATE INDEX idx_change_requests_project ON public.change_requests(project_id);
CREATE INDEX idx_change_requests_status ON public.change_requests(status);
CREATE INDEX idx_change_requests_priority ON public.change_requests(priority);

-- Create updated_at triggers
CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_change_requests_updated_at
  BEFORE UPDATE ON public.change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106204315
-- Phase 1: Time Tracking, Resource Management & Financial Management

-- =====================================================
-- TIME TRACKING SYSTEM
-- =====================================================

-- Time entries table for tracking work hours
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(10, 2),
  description TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  billable_rate DECIMAL(10, 2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger for time_entries updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for time_entries
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time entries"
  ON public.time_entries FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create their own time entries"
  ON public.time_entries FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own draft time entries"
  ON public.time_entries FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

CREATE POLICY "Admins and PMs can delete time entries"
  ON public.time_entries FOR DELETE
  USING (
    has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

-- =====================================================
-- RESOURCE MANAGEMENT SYSTEM
-- =====================================================

-- Skills catalog
CREATE TABLE public.skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view skills"
  ON public.skills FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage skills"
  ON public.skills FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- User skills (skills matrix)
CREATE TABLE public.user_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT 'beginner' CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience DECIMAL(4, 1),
  last_used_date DATE,
  certified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view skills in their org"
  ON public.user_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.skills s
      WHERE s.id = user_skills.skill_id
      AND is_org_member(auth.uid(), s.organization_id)
    )
  );

CREATE POLICY "Users can manage their own skills"
  ON public.user_skills FOR ALL
  USING (user_id = auth.uid());

-- Resource allocations (who works on what and when)
CREATE TABLE public.resource_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  allocation_percentage INTEGER NOT NULL DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  hours_per_day DECIMAL(4, 2),
  role TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'active', 'completed', 'cancelled')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE TRIGGER update_resource_allocations_updated_at
  BEFORE UPDATE ON public.resource_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view allocations"
  ON public.resource_allocations FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "PMs and admins can manage allocations"
  ON public.resource_allocations FOR ALL
  USING (
    has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

-- =====================================================
-- FINANCIAL MANAGEMENT SYSTEM
-- =====================================================

-- Cost categories
CREATE TABLE public.cost_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category_type TEXT NOT NULL DEFAULT 'expense' CHECK (category_type IN ('expense', 'labor', 'material', 'overhead', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view cost categories"
  ON public.cost_categories FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admins can manage cost categories"
  ON public.cost_categories FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- Project budgets
CREATE TABLE public.project_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  budget_type TEXT NOT NULL DEFAULT 'total' CHECK (budget_type IN ('total', 'labor', 'materials', 'expenses', 'contingency')),
  planned_amount DECIMAL(15, 2) NOT NULL,
  allocated_amount DECIMAL(15, 2) DEFAULT 0,
  spent_amount DECIMAL(15, 2) DEFAULT 0,
  remaining_amount DECIMAL(15, 2) GENERATED ALWAYS AS (planned_amount - spent_amount) STORED,
  fiscal_year INTEGER,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_project_budgets_updated_at
  BEFORE UPDATE ON public.project_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view budgets"
  ON public.project_budgets FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "PMs and admins can manage budgets"
  ON public.project_budgets FOR ALL
  USING (
    has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

-- Project expenses
CREATE TABLE public.project_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cost_category_id UUID REFERENCES public.cost_categories(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  submitted_by UUID NOT NULL,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_project_expenses_updated_at
  BEFORE UPDATE ON public.project_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view expenses"
  ON public.project_expenses FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their projects"
  ON public.project_expenses FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id)
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Users can update their own pending expenses"
  ON public.project_expenses FOR UPDATE
  USING (
    submitted_by = auth.uid() AND status = 'pending'
    OR has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

CREATE POLICY "PMs and admins can delete expenses"
  ON public.project_expenses FOR DELETE
  USING (
    has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

-- Create indexes for performance
CREATE INDEX idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX idx_time_entries_project_id ON public.time_entries(project_id);
CREATE INDEX idx_time_entries_status ON public.time_entries(status);
CREATE INDEX idx_time_entries_dates ON public.time_entries(start_time, end_time);

CREATE INDEX idx_resource_allocations_user_id ON public.resource_allocations(user_id);
CREATE INDEX idx_resource_allocations_project_id ON public.resource_allocations(project_id);
CREATE INDEX idx_resource_allocations_dates ON public.resource_allocations(start_date, end_date);

CREATE INDEX idx_project_expenses_project_id ON public.project_expenses(project_id);
CREATE INDEX idx_project_expenses_status ON public.project_expenses(status);
CREATE INDEX idx_project_expenses_date ON public.project_expenses(expense_date);

-- Migration: 20251106205241
-- Phase 2: Advanced Scheduling & Planning (Updated - Skip existing tables)

-- =====================================================
-- TASK DEPENDENCIES - Already exists, just add missing columns to tasks
-- =====================================================

-- Add critical path fields to tasks table if they don't exist
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS is_on_critical_path BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS float_days INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_start DATE,
  ADD COLUMN IF NOT EXISTS early_finish DATE,
  ADD COLUMN IF NOT EXISTS late_start DATE,
  ADD COLUMN IF NOT EXISTS late_finish DATE;

-- =====================================================
-- PROJECT BASELINES
-- =====================================================

-- Baselines for tracking original vs current plan
CREATE TABLE IF NOT EXISTS public.project_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  baseline_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  baseline_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, baseline_number)
);

ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can view baselines" ON public.project_baselines;
CREATE POLICY "Project members can view baselines"
  ON public.project_baselines FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PMs can manage baselines" ON public.project_baselines;
CREATE POLICY "PMs can manage baselines"
  ON public.project_baselines FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

-- Baseline task snapshots
CREATE TABLE IF NOT EXISTS public.baseline_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  baseline_id UUID NOT NULL REFERENCES public.project_baselines(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  planned_start_date DATE,
  planned_due_date DATE,
  planned_duration INTEGER,
  planned_effort_hours DECIMAL(10, 2),
  planned_cost DECIMAL(15, 2),
  assigned_to UUID,
  status TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(baseline_id, task_id)
);

ALTER TABLE public.baseline_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view baseline tasks for accessible baselines" ON public.baseline_tasks;
CREATE POLICY "Users can view baseline tasks for accessible baselines"
  ON public.baseline_tasks FOR SELECT
  USING (
    baseline_id IN (
      SELECT id FROM public.project_baselines
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- SCENARIO PLANNING (WHAT-IF ANALYSIS)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  scenario_type TEXT NOT NULL DEFAULT 'what_if' CHECK (scenario_type IN ('what_if', 'best_case', 'worst_case', 'optimistic', 'pessimistic')),
  is_active BOOLEAN DEFAULT false,
  assumptions TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_project_scenarios_updated_at ON public.project_scenarios;
CREATE TRIGGER update_project_scenarios_updated_at
  BEFORE UPDATE ON public.project_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.project_scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can view scenarios" ON public.project_scenarios;
CREATE POLICY "Project members can view scenarios"
  ON public.project_scenarios FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PMs can manage scenarios" ON public.project_scenarios;
CREATE POLICY "PMs can manage scenarios"
  ON public.project_scenarios FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

-- Scenario task variations
CREATE TABLE IF NOT EXISTS public.scenario_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.project_scenarios(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  adjusted_start_date DATE,
  adjusted_due_date DATE,
  adjusted_duration INTEGER,
  adjusted_effort_hours DECIMAL(10, 2),
  adjusted_cost DECIMAL(15, 2),
  probability_percentage INTEGER CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(scenario_id, task_id)
);

ALTER TABLE public.scenario_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view scenario tasks for accessible scenarios" ON public.scenario_tasks;
CREATE POLICY "Users can view scenario tasks for accessible scenarios"
  ON public.scenario_tasks FOR SELECT
  USING (
    scenario_id IN (
      SELECT id FROM public.project_scenarios
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "PMs can manage scenario tasks" ON public.scenario_tasks;
CREATE POLICY "PMs can manage scenario tasks"
  ON public.scenario_tasks FOR ALL
  USING (
    scenario_id IN (
      SELECT id FROM public.project_scenarios
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- RESOURCE LEVELING & OPTIMIZATION
-- =====================================================

-- Resource conflicts/overallocations
CREATE TABLE IF NOT EXISTS public.resource_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  conflict_date DATE NOT NULL,
  total_allocation_percentage INTEGER NOT NULL,
  total_hours DECIMAL(10, 2) NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'acknowledged', 'resolved', 'ignored')),
  resolution_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

ALTER TABLE public.resource_conflicts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view resource conflicts" ON public.resource_conflicts;
CREATE POLICY "Org members can view resource conflicts"
  ON public.resource_conflicts FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

DROP POLICY IF EXISTS "PMs and admins can manage conflicts" ON public.resource_conflicts;
CREATE POLICY "PMs and admins can manage conflicts"
  ON public.resource_conflicts FOR ALL
  USING (
    has_role(auth.uid(), organization_id, 'org_admin'::app_role)
    OR has_role(auth.uid(), organization_id, 'project_manager'::app_role)
  );

-- =====================================================
-- PROJECT SCHEDULE METRICS (EVM)
-- =====================================================

-- Schedule performance metrics
CREATE TABLE IF NOT EXISTS public.project_schedule_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  planned_value DECIMAL(15, 2),
  earned_value DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2),
  schedule_variance DECIMAL(15, 2),
  schedule_performance_index DECIMAL(5, 3),
  cost_variance DECIMAL(15, 2),
  cost_performance_index DECIMAL(5, 3),
  estimate_at_completion DECIMAL(15, 2),
  estimate_to_complete DECIMAL(15, 2),
  variance_at_completion DECIMAL(15, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, metric_date)
);

ALTER TABLE public.project_schedule_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project members can view schedule metrics" ON public.project_schedule_metrics;
CREATE POLICY "Project members can view schedule metrics"
  ON public.project_schedule_metrics FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "PMs can manage schedule metrics" ON public.project_schedule_metrics;
CREATE POLICY "PMs can manage schedule metrics"
  ON public.project_schedule_metrics FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance (skip if already exist)
CREATE INDEX IF NOT EXISTS idx_project_baselines_project ON public.project_baselines(project_id);
CREATE INDEX IF NOT EXISTS idx_project_baselines_current ON public.project_baselines(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline ON public.baseline_tasks(baseline_id);
CREATE INDEX IF NOT EXISTS idx_baseline_tasks_task ON public.baseline_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_project_scenarios_project ON public.project_scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_scenario_tasks_scenario ON public.scenario_tasks(scenario_id);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_user_date ON public.resource_conflicts(user_id, conflict_date);
CREATE INDEX IF NOT EXISTS idx_resource_conflicts_status ON public.resource_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_schedule_metrics_project_date ON public.project_schedule_metrics(project_id, metric_date);

-- Migration: 20251106214106
-- Add missing columns to projects table for portfolio management

-- Add spent column to track actual project spending
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS spent numeric DEFAULT 0;

-- Add priority column for project prioritization
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Add organization_id if it doesn't exist (for multi-org support)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Add comment for documentation
COMMENT ON COLUMN public.projects.spent IS 'Actual amount spent on the project';
COMMENT ON COLUMN public.projects.priority IS 'Project priority level: low, medium, high, critical';

-- Migration: 20251106220231
-- Create API keys table for integration authentication
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create webhooks table
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'slack', 'teams', 'jira', 'calendar', 'email'
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create stakeholder register table
CREATE TABLE public.stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  influence_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  interest_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  engagement_strategy TEXT,
  communication_frequency TEXT DEFAULT 'weekly',
  preferred_channel TEXT DEFAULT 'email',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create RACI matrix table
CREATE TABLE public.raci_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL, -- 'responsible', 'accountable', 'consulted', 'informed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stakeholder_id, task_id, assignment_type),
  UNIQUE(stakeholder_id, deliverable_id, assignment_type)
);

-- Create custom dashboards table
CREATE TABLE public.custom_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raci_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_dashboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Org admins can manage API keys"
  ON public.api_keys FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

CREATE POLICY "Users can view org API keys"
  ON public.api_keys FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- RLS Policies for webhooks
CREATE POLICY "Org admins can manage webhooks"
  ON public.webhooks FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

CREATE POLICY "Users can view org webhooks"
  ON public.webhooks FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- RLS Policies for integrations
CREATE POLICY "Org admins can manage integrations"
  ON public.integrations FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

CREATE POLICY "Users can view org integrations"
  ON public.integrations FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- RLS Policies for stakeholders
CREATE POLICY "Users can view org stakeholders"
  ON public.stakeholders FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users with permission can manage stakeholders"
  ON public.stakeholders FOR ALL
  USING (
    has_permission(auth.uid(), organization_id, 'stakeholder.manage') OR
    has_role(auth.uid(), organization_id, 'org_admin')
  );

-- RLS Policies for RACI assignments
CREATE POLICY "Users can view RACI assignments"
  ON public.raci_assignments FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users with permission can manage RACI"
  ON public.raci_assignments FOR ALL
  USING (
    has_permission(auth.uid(), organization_id, 'stakeholder.manage') OR
    has_role(auth.uid(), organization_id, 'org_admin')
  );

-- RLS Policies for custom dashboards
CREATE POLICY "Users can view their own dashboards"
  ON public.custom_dashboards FOR SELECT
  USING (user_id = auth.uid() OR is_shared = true);

CREATE POLICY "Users can manage their own dashboards"
  ON public.custom_dashboards FOR ALL
  USING (user_id = auth.uid());

-- Add indexes
CREATE INDEX idx_api_keys_org ON public.api_keys(organization_id);
CREATE INDEX idx_webhooks_org ON public.webhooks(organization_id);
CREATE INDEX idx_integrations_org ON public.integrations(organization_id);
CREATE INDEX idx_stakeholders_org ON public.stakeholders(organization_id);
CREATE INDEX idx_stakeholders_project ON public.stakeholders(project_id);
CREATE INDEX idx_raci_stakeholder ON public.raci_assignments(stakeholder_id);
CREATE INDEX idx_raci_task ON public.raci_assignments(task_id);
CREATE INDEX idx_custom_dashboards_user ON public.custom_dashboards(user_id);

-- Add triggers
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at
  BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_dashboards_updated_at
  BEFORE UPDATE ON public.custom_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251106221243
-- Create communication logs table
CREATE TABLE public.stakeholder_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL DEFAULT 'email', -- 'email', 'meeting', 'call', 'message'
  subject TEXT,
  content TEXT,
  direction TEXT NOT NULL DEFAULT 'outbound', -- 'inbound', 'outbound'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.stakeholder_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view communications in their org"
  ON public.stakeholder_communications FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create communications"
  ON public.stakeholder_communications FOR INSERT
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) AND 
    created_by = auth.uid()
  );

CREATE POLICY "Users can update their communications"
  ON public.stakeholder_communications FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their communications"
  ON public.stakeholder_communications FOR DELETE
  USING (created_by = auth.uid());

-- Add indexes
CREATE INDEX idx_stakeholder_communications_stakeholder ON public.stakeholder_communications(stakeholder_id);
CREATE INDEX idx_stakeholder_communications_org ON public.stakeholder_communications(organization_id);

-- Enable realtime for stakeholders table
ALTER TABLE public.stakeholders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholder_communications;

-- Migration: 20251106232939
-- Create apps registry table
CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  route_prefix TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_setup BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create app permissions table
CREATE TABLE public.app_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, organization_id, role)
);

-- Create user app preferences table
CREATE TABLE public.user_app_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);

-- Create cross-app contexts table for navigation state
CREATE TABLE public.cross_app_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  target_app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  resource_type TEXT,
  resource_id UUID,
  context_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create resource registry for universal resource tracking
CREATE TABLE public.resource_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(resource_type, resource_id, app_id)
);

-- Create cross-app references for linking resources
CREATE TABLE public.cross_app_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_registry_id UUID NOT NULL REFERENCES public.resource_registry(id) ON DELETE CASCADE,
  target_registry_id UUID NOT NULL REFERENCES public.resource_registry(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_registry_id, target_registry_id, link_type)
);

-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_app_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_app_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cross_app_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for apps (public read, admin write)
CREATE POLICY "Anyone can view active apps"
  ON public.apps FOR SELECT
  USING (is_active = true);

CREATE POLICY "Org admins can manage apps"
  ON public.apps FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for app_permissions
CREATE POLICY "Users can view app permissions for their org"
  ON public.app_permissions FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage app permissions"
  ON public.app_permissions FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- RLS Policies for user_app_preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.user_app_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for cross_app_contexts
CREATE POLICY "Users can manage their own contexts"
  ON public.cross_app_contexts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for resource_registry
CREATE POLICY "Users can view resources in their org"
  ON public.resource_registry FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create resources in their org"
  ON public.resource_registry FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can update resources in their org"
  ON public.resource_registry FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

-- RLS Policies for cross_app_references
CREATE POLICY "Users can view cross-app references"
  ON public.cross_app_references FOR SELECT
  USING (
    source_registry_id IN (
      SELECT id FROM public.resource_registry 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Users can create cross-app references"
  ON public.cross_app_references FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Add updated_at trigger for apps
CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for user_app_preferences
CREATE TRIGGER update_user_app_preferences_updated_at
  BEFORE UPDATE ON public.user_app_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for resource_registry
CREATE TRIGGER update_resource_registry_updated_at
  BEFORE UPDATE ON public.resource_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial apps
INSERT INTO public.apps (slug, name, description, icon, route_prefix, category, sort_order) VALUES
  ('project-management', 'Project Management', 'Comprehensive enterprise project management system', 'FolderKanban', '/apps/pm', 'productivity', 1),
  ('dashboards', 'Custom Dashboards', 'Build and customize interactive dashboards', 'LayoutDashboard', '/apps/dashboards', 'analytics', 2),
  ('stakeholders', 'Stakeholder Management', 'Manage stakeholders and engagement', 'Users', '/apps/stakeholders', 'collaboration', 3),
  ('integrations', 'Integrations', 'Connect external tools and APIs', 'Plug', '/apps/integrations', 'settings', 4);

-- Migration: 20251106235825
-- Create app_configurations table to store app-specific settings
CREATE TABLE IF NOT EXISTS public.app_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.app_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org admins can manage app configurations"
  ON public.app_configurations
  FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

CREATE POLICY "Org members can view app configurations"
  ON public.app_configurations
  FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- Create trigger for updated_at
CREATE TRIGGER update_app_configurations_updated_at
  BEFORE UPDATE ON public.app_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_app_configurations_org_app ON public.app_configurations(organization_id, app_id);

-- Migration: 20251107013815
-- Fix App Marketplace: Backfill app_permissions and auto-enable for new orgs

-- Step 1: Backfill app_permissions for existing organizations
-- Enable 4 core apps for all existing organizations with no role restrictions
INSERT INTO public.app_permissions (organization_id, app_id, is_enabled, role)
SELECT 
  o.id as organization_id,
  a.id as app_id,
  true as is_enabled,
  NULL as role
FROM 
  public.organizations o
CROSS JOIN 
  public.apps a
WHERE 
  a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
  AND a.is_active = true
  -- Only insert if permission doesn't already exist
  AND NOT EXISTS (
    SELECT 1 
    FROM public.app_permissions ap 
    WHERE ap.organization_id = o.id 
    AND ap.app_id = a.id
  );

-- Step 2: Create function to auto-enable apps for new organizations
CREATE OR REPLACE FUNCTION public.auto_enable_apps_for_new_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert app_permissions for all active core apps
  INSERT INTO public.app_permissions (organization_id, app_id, is_enabled, role)
  SELECT 
    NEW.id as organization_id,
    a.id as app_id,
    true as is_enabled,
    NULL as role
  FROM 
    public.apps a
  WHERE 
    a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
    AND a.is_active = true;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to run function on organization creation
DROP TRIGGER IF EXISTS trigger_auto_enable_apps ON public.organizations;

CREATE TRIGGER trigger_auto_enable_apps
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enable_apps_for_new_org();

-- Migration: 20251107020119
-- Drop the existing INSERT policy for organizations
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Create a proper INSERT policy that allows authenticated users to create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure the policy is applied
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Migration: 20251107023818
-- Update app icons to use business-like Lucide icons
UPDATE apps SET icon = 'Briefcase' WHERE slug = 'project-management';
UPDATE apps SET icon = 'LayoutDashboard' WHERE slug = 'dashboards';
UPDATE apps SET icon = 'Users' WHERE slug = 'stakeholders';
UPDATE apps SET icon = 'Plug' WHERE slug = 'integrations';

-- Migration: 20251107030102
-- ============================================
-- CODEX: Enterprise Ontology Management System
-- ============================================

-- Object Types: Define types of entities in the system
CREATE TABLE public.ontology_object_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Box',
  color TEXT DEFAULT '#3b82f6',
  category TEXT DEFAULT 'general', -- general, business, technical, data
  is_system BOOLEAN DEFAULT false, -- System-defined vs user-defined
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Properties: Define attributes for object types
CREATE TABLE public.ontology_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type_id UUID NOT NULL REFERENCES public.ontology_object_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL, -- text, number, date, boolean, json, reference
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  is_indexed BOOLEAN DEFAULT false,
  default_value JSONB,
  validation_rules JSONB DEFAULT '{}', -- min, max, pattern, enum, etc.
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(object_type_id, slug)
);

-- Relationship Types: Define how object types relate
CREATE TABLE public.ontology_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  source_type_id UUID NOT NULL REFERENCES public.ontology_object_types(id) ON DELETE CASCADE,
  target_type_id UUID NOT NULL REFERENCES public.ontology_object_types(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- one_to_one, one_to_many, many_to_many
  is_bidirectional BOOLEAN DEFAULT true,
  inverse_name TEXT, -- Name for reverse relationship
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

-- Objects: Actual instances of object types
CREATE TABLE public.ontology_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  object_type_id UUID NOT NULL REFERENCES public.ontology_object_types(id) ON DELETE CASCADE,
  external_id TEXT, -- Link to actual table record (projects.id, tasks.id, etc.)
  external_table TEXT, -- Source table name
  display_name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, object_type_id, external_id)
);

-- Object Properties: Property values for object instances
CREATE TABLE public.ontology_object_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.ontology_properties(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(object_id, property_id)
);

-- Object Relationships: Actual relationships between objects
CREATE TABLE public.ontology_object_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_type_id UUID NOT NULL REFERENCES public.ontology_relationships(id) ON DELETE CASCADE,
  source_object_id UUID NOT NULL REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  target_object_id UUID NOT NULL REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(relationship_type_id, source_object_id, target_object_id)
);

-- Data Lineage: Track data flow and transformations
CREATE TABLE public.ontology_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_object_id UUID REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  target_object_id UUID REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  transformation_type TEXT NOT NULL, -- created, derived, aggregated, transformed, imported
  transformation_logic TEXT, -- SQL, formula, or description
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation Results: Track validation outcomes
CREATE TABLE public.ontology_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID NOT NULL REFERENCES public.ontology_objects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.ontology_properties(id) ON DELETE SET NULL,
  validation_status TEXT NOT NULL, -- passed, failed, warning
  validation_message TEXT,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_ontology_objects_org ON public.ontology_objects(organization_id);
CREATE INDEX idx_ontology_objects_type ON public.ontology_objects(object_type_id);
CREATE INDEX idx_ontology_objects_external ON public.ontology_objects(external_table, external_id);
CREATE INDEX idx_ontology_object_props_object ON public.ontology_object_properties(object_id);
CREATE INDEX idx_ontology_object_rels_source ON public.ontology_object_relationships(source_object_id);
CREATE INDEX idx_ontology_object_rels_target ON public.ontology_object_relationships(target_object_id);
CREATE INDEX idx_ontology_lineage_source ON public.ontology_lineage(source_object_id);
CREATE INDEX idx_ontology_lineage_target ON public.ontology_lineage(target_object_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Object Types
ALTER TABLE public.ontology_object_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view object types"
  ON public.ontology_object_types FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage object types"
  ON public.ontology_object_types FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'));

-- Properties
ALTER TABLE public.ontology_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view properties of accessible object types"
  ON public.ontology_properties FOR SELECT
  USING (object_type_id IN (
    SELECT id FROM ontology_object_types WHERE is_org_member(auth.uid(), organization_id)
  ));

CREATE POLICY "Org admins can manage properties"
  ON public.ontology_properties FOR ALL
  USING (object_type_id IN (
    SELECT id FROM ontology_object_types WHERE has_role(auth.uid(), organization_id, 'org_admin')
  ))
  WITH CHECK (object_type_id IN (
    SELECT id FROM ontology_object_types WHERE has_role(auth.uid(), organization_id, 'org_admin')
  ));

-- Relationships
ALTER TABLE public.ontology_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view relationships"
  ON public.ontology_relationships FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage relationships"
  ON public.ontology_relationships FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'));

-- Objects
ALTER TABLE public.ontology_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view objects"
  ON public.ontology_objects FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create objects"
  ON public.ontology_objects FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Object creators and admins can update objects"
  ON public.ontology_objects FOR UPDATE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

CREATE POLICY "Admins can delete objects"
  ON public.ontology_objects FOR DELETE
  USING (has_role(auth.uid(), organization_id, 'org_admin'));

-- Object Properties
ALTER TABLE public.ontology_object_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object properties"
  ON public.ontology_object_properties FOR SELECT
  USING (object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

CREATE POLICY "Users can manage object properties"
  ON public.ontology_object_properties FOR ALL
  USING (object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ))
  WITH CHECK (object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

-- Object Relationships
ALTER TABLE public.ontology_object_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object relationships"
  ON public.ontology_object_relationships FOR SELECT
  USING (source_object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

CREATE POLICY "Users can manage object relationships"
  ON public.ontology_object_relationships FOR ALL
  USING (source_object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ))
  WITH CHECK (source_object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

-- Lineage
ALTER TABLE public.ontology_lineage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lineage"
  ON public.ontology_lineage FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can create lineage records"
  ON public.ontology_lineage FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

-- Validation Results
ALTER TABLE public.ontology_validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view validation results"
  ON public.ontology_validation_results FOR SELECT
  USING (object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

CREATE POLICY "System can create validation results"
  ON public.ontology_validation_results FOR INSERT
  WITH CHECK (object_id IN (
    SELECT id FROM ontology_objects WHERE is_org_member(auth.uid(), organization_id)
  ));

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_ontology_object_types_updated_at
  BEFORE UPDATE ON public.ontology_object_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ontology_properties_updated_at
  BEFORE UPDATE ON public.ontology_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ontology_relationships_updated_at
  BEFORE UPDATE ON public.ontology_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ontology_objects_updated_at
  BEFORE UPDATE ON public.ontology_objects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ontology_object_properties_updated_at
  BEFORE UPDATE ON public.ontology_object_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED DATA: System Object Types
-- ============================================

-- Note: We'll seed this via insert tool after migration;

-- Migration: 20251107151429
-- =====================================================
-- CODEX ONTOLOGY MANAGER - DATABASE SCHEMA
-- Enterprise-grade object type registry, properties, and relationships
-- =====================================================

-- Object Types: Define entity types (Project, Task, Stakeholder, etc.)
CREATE TABLE public.codex_object_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'box',
  color TEXT DEFAULT '#6366f1',
  is_system BOOLEAN DEFAULT false, -- System types can't be deleted
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Properties: Define attributes for object types
CREATE TABLE public.codex_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  object_type_id UUID REFERENCES public.codex_object_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  data_type TEXT NOT NULL, -- text, number, date, boolean, json, reference
  is_required BOOLEAN DEFAULT false,
  is_unique BOOLEAN DEFAULT false,
  default_value JSONB,
  validation_rules JSONB DEFAULT '{}'::jsonb, -- min, max, pattern, enum
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(object_type_id, name)
);

-- Relationship Types: Define how objects relate to each other
CREATE TABLE public.codex_relationship_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  source_object_type_id UUID REFERENCES public.codex_object_types(id) ON DELETE CASCADE,
  target_object_type_id UUID REFERENCES public.codex_object_types(id) ON DELETE CASCADE,
  cardinality TEXT NOT NULL DEFAULT 'many_to_many', -- one_to_one, one_to_many, many_to_many
  is_bidirectional BOOLEAN DEFAULT true,
  inverse_name TEXT, -- Name when viewed from target (e.g., "belongs_to" inverse of "contains")
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Objects: Actual instances of object types
CREATE TABLE public.codex_objects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  object_type_id UUID REFERENCES public.codex_object_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT,
  description TEXT,
  external_id TEXT, -- For linking to external systems
  external_source TEXT, -- Name of external system (e.g., 'jira', 'salesforce')
  status TEXT DEFAULT 'active', -- active, archived, deleted
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER DEFAULT 1 -- For versioning/history
);

CREATE INDEX idx_codex_objects_org ON public.codex_objects(organization_id);
CREATE INDEX idx_codex_objects_type ON public.codex_objects(object_type_id);
CREATE INDEX idx_codex_objects_external ON public.codex_objects(external_source, external_id);

-- Object Property Values: Store actual property values for objects
CREATE TABLE public.codex_object_property_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID REFERENCES public.codex_objects(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.codex_properties(id) ON DELETE CASCADE,
  value JSONB NOT NULL, -- Store all values as JSONB for flexibility
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(object_id, property_id)
);

CREATE INDEX idx_codex_property_values_object ON public.codex_object_property_values(object_id);
CREATE INDEX idx_codex_property_values_property ON public.codex_object_property_values(property_id);

-- Object Relationships: Actual relationships between objects
CREATE TABLE public.codex_object_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  relationship_type_id UUID REFERENCES public.codex_relationship_types(id) ON DELETE CASCADE,
  source_object_id UUID REFERENCES public.codex_objects(id) ON DELETE CASCADE,
  target_object_id UUID REFERENCES public.codex_objects(id) ON DELETE CASCADE,
  strength NUMERIC(3,2) DEFAULT 1.0, -- Relationship strength 0.0-1.0 for weighted graphs
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(relationship_type_id, source_object_id, target_object_id)
);

CREATE INDEX idx_codex_relationships_source ON public.codex_object_relationships(source_object_id);
CREATE INDEX idx_codex_relationships_target ON public.codex_object_relationships(target_object_id);
CREATE INDEX idx_codex_relationships_type ON public.codex_object_relationships(relationship_type_id);

-- Data Lineage: Track data transformations and provenance
CREATE TABLE public.codex_data_lineage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  source_object_id UUID REFERENCES public.codex_objects(id) ON DELETE CASCADE,
  target_object_id UUID REFERENCES public.codex_objects(id) ON DELETE CASCADE,
  transformation_type TEXT NOT NULL, -- derived, aggregated, filtered, joined, etc.
  transformation_logic TEXT, -- SQL, code, or description of transformation
  executed_by UUID REFERENCES auth.users(id),
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_codex_lineage_source ON public.codex_data_lineage(source_object_id);
CREATE INDEX idx_codex_lineage_target ON public.codex_data_lineage(target_object_id);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Object Types
ALTER TABLE public.codex_object_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view object types"
  ON public.codex_object_types FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage object types"
  ON public.codex_object_types FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- Properties
ALTER TABLE public.codex_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view properties"
  ON public.codex_properties FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage properties"
  ON public.codex_properties FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- Relationship Types
ALTER TABLE public.codex_relationship_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view relationship types"
  ON public.codex_relationship_types FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage relationship types"
  ON public.codex_relationship_types FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- Objects
ALTER TABLE public.codex_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view objects"
  ON public.codex_objects FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create objects"
  ON public.codex_objects FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Object creators and admins can update objects"
  ON public.codex_objects FOR UPDATE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  );

CREATE POLICY "Admins can delete objects"
  ON public.codex_objects FOR DELETE
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- Object Property Values
ALTER TABLE public.codex_object_property_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view property values for accessible objects"
  ON public.codex_object_property_values FOR SELECT
  USING (
    object_id IN (
      SELECT id FROM public.codex_objects 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );

CREATE POLICY "Users can manage property values for accessible objects"
  ON public.codex_object_property_values FOR ALL
  USING (
    object_id IN (
      SELECT id FROM public.codex_objects 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  )
  WITH CHECK (
    object_id IN (
      SELECT id FROM public.codex_objects 
      WHERE is_org_member(auth.uid(), organization_id)
    )
  );

-- Object Relationships
ALTER TABLE public.codex_object_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view relationships"
  ON public.codex_object_relationships FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create relationships"
  ON public.codex_object_relationships FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Relationship creators and admins can manage relationships"
  ON public.codex_object_relationships FOR ALL
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  )
  WITH CHECK (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'::app_role))
  );

-- Data Lineage
ALTER TABLE public.codex_data_lineage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lineage"
  ON public.codex_data_lineage FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Users can create lineage records"
  ON public.codex_data_lineage FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_codex_object_types_updated_at
  BEFORE UPDATE ON public.codex_object_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codex_properties_updated_at
  BEFORE UPDATE ON public.codex_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codex_relationship_types_updated_at
  BEFORE UPDATE ON public.codex_relationship_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codex_objects_updated_at
  BEFORE UPDATE ON public.codex_objects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_codex_property_values_updated_at
  BEFORE UPDATE ON public.codex_object_property_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all properties for an object type (including inherited)
CREATE OR REPLACE FUNCTION public.get_object_type_properties(object_type_id_param UUID)
RETURNS TABLE (
  property_id UUID,
  name TEXT,
  display_name TEXT,
  data_type TEXT,
  is_required BOOLEAN,
  default_value JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.display_name,
    p.data_type,
    p.is_required,
    p.default_value
  FROM public.codex_properties p
  WHERE p.object_type_id = object_type_id_param
  ORDER BY p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get object with all its property values
CREATE OR REPLACE FUNCTION public.get_object_with_properties(object_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'object_type_id', o.object_type_id,
    'name', o.name,
    'display_name', o.display_name,
    'description', o.description,
    'status', o.status,
    'created_at', o.created_at,
    'properties', (
      SELECT jsonb_object_agg(
        p.name,
        pv.value
      )
      FROM public.codex_object_property_values pv
      JOIN public.codex_properties p ON p.id = pv.property_id
      WHERE pv.object_id = o.id
    )
  ) INTO result
  FROM public.codex_objects o
  WHERE o.id = object_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration: 20251107154846
-- Create data pipeline tables
CREATE TABLE public.data_pipelines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pipeline_config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  schedule_cron TEXT,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.data_pipelines(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('extract', 'transform', 'load', 'filter', 'join', 'aggregate', 'validate', 'branch')),
  node_config JSONB NOT NULL DEFAULT '{}',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_edges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.data_pipelines(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.pipeline_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.pipeline_nodes(id) ON DELETE CASCADE,
  edge_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES public.data_pipelines(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_logs JSONB DEFAULT '[]',
  metrics JSONB DEFAULT '{}',
  triggered_by UUID,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'api', 'event')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.pipeline_node_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES public.pipeline_runs(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES public.pipeline_nodes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  input_data JSONB,
  output_data JSONB,
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_node_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_pipelines
CREATE POLICY "Users can view pipelines in their organization"
  ON public.data_pipelines FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create pipelines in their organization"
  ON public.data_pipelines FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update pipelines in their organization"
  ON public.data_pipelines FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete pipelines in their organization"
  ON public.data_pipelines FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for pipeline_nodes
CREATE POLICY "Users can view nodes in their organization pipelines"
  ON public.pipeline_nodes FOR SELECT
  USING (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage nodes in their organization pipelines"
  ON public.pipeline_nodes FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- RLS Policies for pipeline_edges
CREATE POLICY "Users can view edges in their organization pipelines"
  ON public.pipeline_edges FOR SELECT
  USING (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage edges in their organization pipelines"
  ON public.pipeline_edges FOR ALL
  USING (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- RLS Policies for pipeline_runs
CREATE POLICY "Users can view runs in their organization pipelines"
  ON public.pipeline_runs FOR SELECT
  USING (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can create runs in their organization pipelines"
  ON public.pipeline_runs FOR INSERT
  WITH CHECK (
    pipeline_id IN (
      SELECT id FROM public.data_pipelines
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

-- RLS Policies for pipeline_node_executions
CREATE POLICY "Users can view node executions in their organization pipelines"
  ON public.pipeline_node_executions FOR SELECT
  USING (
    run_id IN (
      SELECT id FROM public.pipeline_runs
      WHERE pipeline_id IN (
        SELECT id FROM public.data_pipelines
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    )
  );

CREATE POLICY "Users can create node executions"
  ON public.pipeline_node_executions FOR INSERT
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.pipeline_runs
      WHERE pipeline_id IN (
        SELECT id FROM public.data_pipelines
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_pipelines_org ON public.data_pipelines(organization_id);
CREATE INDEX idx_pipelines_status ON public.data_pipelines(status);
CREATE INDEX idx_pipeline_nodes_pipeline ON public.pipeline_nodes(pipeline_id);
CREATE INDEX idx_pipeline_edges_pipeline ON public.pipeline_edges(pipeline_id);
CREATE INDEX idx_pipeline_runs_pipeline ON public.pipeline_runs(pipeline_id);
CREATE INDEX idx_pipeline_runs_status ON public.pipeline_runs(status);
CREATE INDEX idx_node_executions_run ON public.pipeline_node_executions(run_id);
CREATE INDEX idx_node_executions_node ON public.pipeline_node_executions(node_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.data_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_nodes_updated_at
  BEFORE UPDATE ON public.pipeline_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251107161028
-- Create enum for agent types
CREATE TYPE public.ai_agent_type AS ENUM ('rag', 'workflow', 'automation', 'analysis');

-- Create enum for agent status
CREATE TYPE public.ai_agent_status AS ENUM ('draft', 'active', 'paused', 'archived');

-- Create enum for execution status
CREATE TYPE public.ai_execution_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');

-- Create enum for trigger types
CREATE TYPE public.ai_trigger_type AS ENUM ('manual', 'scheduled', 'event', 'webhook');

-- Create ai_agents table
CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agent_type ai_agent_type NOT NULL DEFAULT 'workflow',
  status ai_agent_status NOT NULL DEFAULT 'draft',
  configuration JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_workflows table
CREATE TABLE public.ai_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  workflow_definition JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
  trigger_type ai_trigger_type NOT NULL DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  status ai_agent_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_executions table
CREATE TABLE public.ai_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  status ai_execution_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  execution_data JSONB DEFAULT '{}',
  execution_result JSONB DEFAULT '{}',
  error_message TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,4) DEFAULT 0,
  executed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_prompts table
CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  model TEXT DEFAULT 'google/gemini-2.5-flash',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  version INTEGER NOT NULL DEFAULT 1,
  status ai_agent_status NOT NULL DEFAULT 'draft',
  parent_prompt_id UUID REFERENCES public.ai_prompts(id),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Org members can view agents"
  ON public.ai_agents FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create agents"
  ON public.ai_agents FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can update agents"
  ON public.ai_agents FOR UPDATE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

CREATE POLICY "Creators and admins can delete agents"
  ON public.ai_agents FOR DELETE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

-- RLS Policies for ai_workflows
CREATE POLICY "Org members can view workflows"
  ON public.ai_workflows FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create workflows"
  ON public.ai_workflows FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can update workflows"
  ON public.ai_workflows FOR UPDATE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

CREATE POLICY "Creators and admins can delete workflows"
  ON public.ai_workflows FOR DELETE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

-- RLS Policies for ai_executions
CREATE POLICY "Org members can view executions"
  ON public.ai_executions FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "System can create executions"
  ON public.ai_executions FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update execution status"
  ON public.ai_executions FOR UPDATE
  USING (is_org_member(auth.uid(), organization_id));

-- RLS Policies for ai_prompts
CREATE POLICY "Org members can view prompts"
  ON public.ai_prompts FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create prompts"
  ON public.ai_prompts FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can update prompts"
  ON public.ai_prompts FOR UPDATE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

CREATE POLICY "Creators and admins can delete prompts"
  ON public.ai_prompts FOR DELETE
  USING (
    is_org_member(auth.uid(), organization_id) AND 
    (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'org_admin'))
  );

-- Create indexes for performance
CREATE INDEX idx_ai_agents_organization ON public.ai_agents(organization_id);
CREATE INDEX idx_ai_agents_status ON public.ai_agents(status);
CREATE INDEX idx_ai_agents_created_by ON public.ai_agents(created_by);

CREATE INDEX idx_ai_workflows_organization ON public.ai_workflows(organization_id);
CREATE INDEX idx_ai_workflows_agent ON public.ai_workflows(agent_id);
CREATE INDEX idx_ai_workflows_status ON public.ai_workflows(status);

CREATE INDEX idx_ai_executions_organization ON public.ai_executions(organization_id);
CREATE INDEX idx_ai_executions_workflow ON public.ai_executions(workflow_id);
CREATE INDEX idx_ai_executions_status ON public.ai_executions(status);
CREATE INDEX idx_ai_executions_created_at ON public.ai_executions(created_at DESC);

CREATE INDEX idx_ai_prompts_organization ON public.ai_prompts(organization_id);
CREATE INDEX idx_ai_prompts_version ON public.ai_prompts(parent_prompt_id, version);

-- Create triggers for updated_at
CREATE TRIGGER update_ai_agents_updated_at
  BEFORE UPDATE ON public.ai_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_workflows_updated_at
  BEFORE UPDATE ON public.ai_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_prompts_updated_at
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251107163628
-- Add template columns to ai_agents table
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_category TEXT,
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'google/gemini-2.5-flash',
ADD COLUMN IF NOT EXISTS system_prompt TEXT;

-- Canvas Workspaces Table
CREATE TABLE IF NOT EXISTS public.canvas_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  layout JSONB DEFAULT '{}'::jsonb,
  is_template BOOLEAN DEFAULT false,
  template_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Canvas Elements Table
CREATE TABLE IF NOT EXISTS public.canvas_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.canvas_workspaces(id) ON DELETE CASCADE,
  element_type TEXT NOT NULL CHECK (element_type IN ('object', 'pipeline', 'agent', 'workflow', 'note')),
  element_id UUID,
  element_data JSONB DEFAULT '{}'::jsonb,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "width": 200, "height": 100}'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canvas_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_elements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canvas_workspaces
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_workspaces' AND policyname = 'Users can view workspaces in their org') THEN
    CREATE POLICY "Users can view workspaces in their org"
      ON public.canvas_workspaces FOR SELECT
      USING (is_org_member(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_workspaces' AND policyname = 'Users can create workspaces in their org') THEN
    CREATE POLICY "Users can create workspaces in their org"
      ON public.canvas_workspaces FOR INSERT
      WITH CHECK (is_org_member(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_workspaces' AND policyname = 'Users can update workspaces in their org') THEN
    CREATE POLICY "Users can update workspaces in their org"
      ON public.canvas_workspaces FOR UPDATE
      USING (is_org_member(auth.uid(), organization_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_workspaces' AND policyname = 'Users can delete their own workspaces') THEN
    CREATE POLICY "Users can delete their own workspaces"
      ON public.canvas_workspaces FOR DELETE
      USING (created_by = auth.uid());
  END IF;
END $$;

-- RLS Policies for canvas_elements
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_elements' AND policyname = 'Users can view elements in their org workspaces') THEN
    CREATE POLICY "Users can view elements in their org workspaces"
      ON public.canvas_elements FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.canvas_workspaces w
          WHERE w.id = workspace_id AND is_org_member(auth.uid(), w.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_elements' AND policyname = 'Users can create elements in their org workspaces') THEN
    CREATE POLICY "Users can create elements in their org workspaces"
      ON public.canvas_elements FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.canvas_workspaces w
          WHERE w.id = workspace_id AND is_org_member(auth.uid(), w.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_elements' AND policyname = 'Users can update elements in their org workspaces') THEN
    CREATE POLICY "Users can update elements in their org workspaces"
      ON public.canvas_elements FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.canvas_workspaces w
          WHERE w.id = workspace_id AND is_org_member(auth.uid(), w.organization_id)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'canvas_elements' AND policyname = 'Users can delete elements in their org workspaces') THEN
    CREATE POLICY "Users can delete elements in their org workspaces"
      ON public.canvas_elements FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.canvas_workspaces w
          WHERE w.id = workspace_id AND is_org_member(auth.uid(), w.organization_id)
        )
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_canvas_workspaces_org ON public.canvas_workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_canvas_workspaces_created_by ON public.canvas_workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_workspace ON public.canvas_elements(workspace_id);
CREATE INDEX IF NOT EXISTS idx_canvas_elements_type ON public.canvas_elements(element_type);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_canvas_workspaces_updated_at') THEN
    CREATE TRIGGER update_canvas_workspaces_updated_at
      BEFORE UPDATE ON public.canvas_workspaces
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_canvas_elements_updated_at') THEN
    CREATE TRIGGER update_canvas_elements_updated_at
      BEFORE UPDATE ON public.canvas_elements
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Pre-built AI Agent Templates
INSERT INTO public.ai_agents (
  name, description, model, system_prompt, 
  organization_id, is_template, template_category, 
  created_by, agent_type, status
)
SELECT 
  'Data Quality Agent',
  'Validates incoming data for completeness, accuracy, and consistency',
  'google/gemini-2.5-flash',
  'You are a data quality validation expert. Analyze datasets and identify issues with completeness, accuracy, consistency, and validity. Provide actionable recommendations for improvement.',
  o.id,
  true,
  'data-quality',
  (SELECT id FROM auth.users LIMIT 1),
  'workflow',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents 
  WHERE name = 'Data Quality Agent' AND organization_id = o.id
);

INSERT INTO public.ai_agents (
  name, description, model, system_prompt, 
  organization_id, is_template, template_category, 
  created_by, agent_type, status
)
SELECT 
  'Transformation Agent',
  'Applies ML transformations and data enrichment',
  'google/gemini-2.5-pro',
  'You are a data transformation expert. Apply machine learning transformations, data enrichment, and feature engineering to datasets. Suggest optimal transformation pipelines.',
  o.id,
  true,
  'transformation',
  (SELECT id FROM auth.users LIMIT 1),
  'workflow',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents 
  WHERE name = 'Transformation Agent' AND organization_id = o.id
);

INSERT INTO public.ai_agents (
  name, description, model, system_prompt, 
  organization_id, is_template, template_category, 
  created_by, agent_type, status
)
SELECT 
  'Anomaly Detection Agent',
  'Flags unusual patterns and outliers in data',
  'google/gemini-2.5-flash',
  'You are an anomaly detection specialist. Identify unusual patterns, outliers, and anomalies in datasets. Flag potential data quality issues and security concerns.',
  o.id,
  true,
  'detection',
  (SELECT id FROM auth.users LIMIT 1),
  'workflow',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents 
  WHERE name = 'Anomaly Detection Agent' AND organization_id = o.id
);

INSERT INTO public.ai_agents (
  name, description, model, system_prompt, 
  organization_id, is_template, template_category, 
  created_by, agent_type, status
)
SELECT 
  'Summarization Agent',
  'Generates dataset summaries and insights',
  'google/gemini-2.5-flash-lite',
  'You are a data summarization expert. Generate clear, concise summaries of datasets including key statistics, distributions, and notable insights.',
  o.id,
  true,
  'summarization',
  (SELECT id FROM auth.users LIMIT 1),
  'workflow',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents 
  WHERE name = 'Summarization Agent' AND organization_id = o.id
);

INSERT INTO public.ai_agents (
  name, description, model, system_prompt, 
  organization_id, is_template, template_category, 
  created_by, agent_type, status
)
SELECT 
  'Classification Agent',
  'Auto-categorizes objects based on their attributes',
  'google/gemini-2.5-flash',
  'You are a classification expert. Analyze objects and categorize them based on their attributes, properties, and relationships. Suggest optimal categorization schemes.',
  o.id,
  true,
  'classification',
  (SELECT id FROM auth.users LIMIT 1),
  'workflow',
  'active'
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents 
  WHERE name = 'Classification Agent' AND organization_id = o.id
);


-- Migration: 20251107174713
-- =====================================================
-- PART 1: DISTRIBUTED QUERY ENGINE
-- =====================================================

-- Query federation layer
CREATE TABLE query_engines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  engine_type TEXT NOT NULL CHECK (engine_type IN ('postgres', 'duckdb', 's3_parquet')),
  connection_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE query_engines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's query engines"
  ON query_engines FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage query engines"
  ON query_engines FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
  ));

-- Materialized datasets
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_query TEXT,
  storage_format TEXT DEFAULT 'parquet' CHECK (storage_format IN ('parquet', 'delta', 'postgres')),
  storage_location TEXT,
  row_count BIGINT DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  last_materialized_at TIMESTAMPTZ,
  materialization_schedule TEXT,
  is_incremental BOOLEAN DEFAULT false,
  incremental_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's datasets"
  ON datasets FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage datasets"
  ON datasets FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Query execution history
CREATE TABLE query_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  query_text TEXT NOT NULL,
  engine_type TEXT NOT NULL,
  execution_time_ms INTEGER,
  rows_returned BIGINT,
  bytes_scanned BIGINT,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE query_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own query executions"
  ON query_executions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own query executions"
  ON query_executions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PART 2: ADVANCED ONTOLOGY FEATURES
-- =====================================================

-- Temporal tracking for objects
CREATE TABLE codex_object_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES codex_objects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  property_values JSONB NOT NULL DEFAULT '{}',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(object_id, version_number)
);

ALTER TABLE codex_object_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object versions"
  ON codex_object_versions FOR SELECT
  USING (
    object_id IN (
      SELECT co.id FROM codex_objects co
      JOIN codex_object_types cot ON co.object_type_id = cot.id
      WHERE cot.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Calculated/derived properties
CREATE TABLE codex_calculated_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES codex_properties(id) ON DELETE CASCADE,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('formula', 'aggregation', 'lookup')),
  formula TEXT,
  dependencies TEXT[] DEFAULT '{}',
  refresh_strategy TEXT DEFAULT 'on_read' CHECK (refresh_strategy IN ('on_read', 'on_write', 'scheduled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE codex_calculated_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calculated properties"
  ON codex_calculated_properties FOR SELECT
  USING (
    property_id IN (
      SELECT cp.id FROM codex_properties cp
      JOIN codex_object_types cot ON cp.object_type_id = cot.id
      WHERE cot.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Data quality rules
CREATE TABLE codex_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  object_type_id UUID REFERENCES codex_object_types(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('range', 'pattern', 'uniqueness', 'completeness', 'custom')),
  rule_config JSONB NOT NULL DEFAULT '{}',
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE codex_quality_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality rules"
  ON codex_quality_rules FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage quality rules"
  ON codex_quality_rules FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
  ));

-- Quality validation results
CREATE TABLE codex_quality_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES codex_objects(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES codex_quality_rules(id) ON DELETE CASCADE,
  property_id UUID REFERENCES codex_properties(id) ON DELETE SET NULL,
  violation_details JSONB NOT NULL DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE codex_quality_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quality violations"
  ON codex_quality_violations FOR SELECT
  USING (
    object_id IN (
      SELECT co.id FROM codex_objects co
      JOIN codex_object_types cot ON co.object_type_id = cot.id
      WHERE cot.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Action types (user-triggered operations)
CREATE TABLE codex_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_type_id UUID REFERENCES codex_object_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  action_config JSONB DEFAULT '{}',
  function_name TEXT,
  required_permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE codex_action_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action types"
  ON codex_action_types FOR SELECT
  USING (
    object_type_id IN (
      SELECT id FROM codex_object_types 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Action execution log
CREATE TABLE codex_action_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type_id UUID REFERENCES codex_action_types(id) ON DELETE CASCADE,
  object_id UUID REFERENCES codex_objects(id) ON DELETE CASCADE,
  executed_by UUID REFERENCES auth.users(id),
  input_params JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('success', 'error')),
  executed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE codex_action_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action executions"
  ON codex_action_executions FOR SELECT
  USING (executed_by = auth.uid() OR object_id IN (
    SELECT co.id FROM codex_objects co
    JOIN codex_object_types cot ON co.object_type_id = cot.id
    WHERE cot.organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  ));

-- =====================================================
-- PART 3: GIT-INTEGRATED TRANSFORM REPOSITORY
-- =====================================================

-- Transform code repository
CREATE TABLE transform_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  git_url TEXT,
  branch TEXT DEFAULT 'main',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transform_repositories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's repositories"
  ON transform_repositories FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage repositories"
  ON transform_repositories FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
  ));

-- Transform definitions (SQL/Python files)
CREATE TABLE transforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES transform_repositories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  transform_type TEXT NOT NULL CHECK (transform_type IN ('sql', 'python')),
  code TEXT NOT NULL,
  depends_on TEXT[] DEFAULT '{}',
  output_dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  version TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transforms"
  ON transforms FOR SELECT
  USING (
    repository_id IN (
      SELECT id FROM transform_repositories 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage transforms"
  ON transforms FOR ALL
  USING (
    repository_id IN (
      SELECT id FROM transform_repositories 
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Transform DAG (directed acyclic graph)
CREATE TABLE transform_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transform_id UUID REFERENCES transforms(id) ON DELETE CASCADE,
  depends_on_transform_id UUID REFERENCES transforms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(transform_id, depends_on_transform_id)
);

ALTER TABLE transform_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transform dependencies"
  ON transform_dependencies FOR SELECT
  USING (true);

-- Transform execution runs
CREATE TABLE transform_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transform_id UUID REFERENCES transforms(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rows_affected BIGINT,
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'scheduled', 'dependency')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transform_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transform runs"
  ON transform_runs FOR SELECT
  USING (
    transform_id IN (
      SELECT t.id FROM transforms t
      JOIN transform_repositories tr ON t.repository_id = tr.id
      WHERE tr.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Incremental build state
CREATE TABLE transform_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transform_id UUID REFERENCES transforms(id) ON DELETE CASCADE,
  checkpoint_value TEXT NOT NULL,
  checkpoint_type TEXT CHECK (checkpoint_type IN ('timestamp', 'id', 'hash')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transform_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkpoints"
  ON transform_checkpoints FOR SELECT
  USING (true);

-- =====================================================
-- PART 4: ENTERPRISE SECURITY (MARKING-BASED)
-- =====================================================

-- Security markings
CREATE TABLE security_markings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT DEFAULT '#666666',
  sensitivity_level INTEGER NOT NULL CHECK (sensitivity_level >= 0 AND sensitivity_level <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE security_markings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's markings"
  ON security_markings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage markings"
  ON security_markings FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
  ));

-- User clearances
CREATE TABLE user_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  marking_id UUID REFERENCES security_markings(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, marking_id)
);

ALTER TABLE user_clearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clearances"
  ON user_clearances FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage clearances"
  ON user_clearances FOR ALL
  USING (
    marking_id IN (
      SELECT sm.id FROM security_markings sm
      WHERE sm.organization_id IN (
        SELECT organization_id FROM user_roles 
        WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
      )
    )
  );

-- Object-level markings
CREATE TABLE codex_object_markings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID REFERENCES codex_objects(id) ON DELETE CASCADE,
  marking_id UUID REFERENCES security_markings(id) ON DELETE CASCADE,
  applied_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(object_id, marking_id)
);

ALTER TABLE codex_object_markings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object markings"
  ON codex_object_markings FOR SELECT
  USING (true);

-- Column-level markings (for datasets/tables)
CREATE TABLE dataset_column_markings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  marking_id UUID REFERENCES security_markings(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dataset_id, column_name, marking_id)
);

ALTER TABLE dataset_column_markings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view column markings"
  ON dataset_column_markings FOR SELECT
  USING (true);

-- Data classification rules (auto-detect PII, etc.)
CREATE TABLE classification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('regex_pattern', 'column_name', 'data_type')),
  pattern TEXT,
  auto_apply_marking_id UUID REFERENCES security_markings(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view classification rules"
  ON classification_rules FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage classification rules"
  ON classification_rules FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_roles 
    WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
  ));

-- Access audit log (every data access)
CREATE TABLE data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('object', 'dataset', 'query')),
  resource_id UUID,
  action TEXT NOT NULL CHECK (action IN ('view', 'edit', 'export', 'delete')),
  markings_accessed TEXT[] DEFAULT '{}',
  access_granted BOOLEAN NOT NULL,
  denial_reason TEXT,
  ip_address INET,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs"
  ON data_access_logs FOR SELECT
  USING (
    user_id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id IN (
        SELECT organization_id FROM user_roles 
        WHERE user_id = auth.uid() AND role::text IN ('admin', 'owner')
      )
    ) OR user_id = auth.uid()
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Query engine indexes
CREATE INDEX idx_query_engines_org ON query_engines(organization_id);
CREATE INDEX idx_datasets_org ON datasets(organization_id);
CREATE INDEX idx_query_executions_user ON query_executions(user_id);
CREATE INDEX idx_query_executions_created ON query_executions(created_at DESC);

-- Ontology indexes
CREATE INDEX idx_object_versions_object ON codex_object_versions(object_id);
CREATE INDEX idx_object_versions_valid_from ON codex_object_versions(valid_from);
CREATE INDEX idx_quality_violations_object ON codex_quality_violations(object_id);
CREATE INDEX idx_quality_violations_rule ON codex_quality_violations(rule_id);
CREATE INDEX idx_action_executions_object ON codex_action_executions(object_id);

-- Transform indexes
CREATE INDEX idx_transforms_repo ON transforms(repository_id);
CREATE INDEX idx_transform_runs_transform ON transform_runs(transform_id);
CREATE INDEX idx_transform_runs_status ON transform_runs(status);

-- Security indexes
CREATE INDEX idx_user_clearances_user ON user_clearances(user_id);
CREATE INDEX idx_user_clearances_marking ON user_clearances(marking_id);
CREATE INDEX idx_object_markings_object ON codex_object_markings(object_id);
CREATE INDEX idx_data_access_logs_user ON data_access_logs(user_id);
CREATE INDEX idx_data_access_logs_accessed_at ON data_access_logs(accessed_at DESC);

-- Migration: 20251107203851
-- Add relationship columns to canvas_elements
ALTER TABLE canvas_elements 
  ADD COLUMN codex_object_id UUID REFERENCES codex_objects(id) ON DELETE SET NULL,
  ADD COLUMN relationship_type_id UUID REFERENCES codex_relationship_types(id) ON DELETE SET NULL,
  ADD COLUMN node_metadata JSONB DEFAULT '{}';

-- Collaboration tables
CREATE TABLE canvas_workspace_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  cursor_position JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS for collaborators
ALTER TABLE canvas_workspace_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators in their workspaces"
  ON canvas_workspace_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id
        AND (w.created_by = auth.uid() OR workspace_id IN (
          SELECT workspace_id FROM canvas_workspace_collaborators 
          WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Workspace owners can manage collaborators"
  ON canvas_workspace_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id AND w.created_by = auth.uid()
    )
  );

-- Version history table
CREATE TABLE canvas_workspace_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE canvas_workspace_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their workspaces"
  ON canvas_workspace_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id
        AND (w.created_by = auth.uid() OR workspace_id IN (
          SELECT workspace_id FROM canvas_workspace_collaborators 
          WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create versions for their workspaces"
  ON canvas_workspace_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id
        AND (w.created_by = auth.uid() OR workspace_id IN (
          SELECT workspace_id FROM canvas_workspace_collaborators 
          WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        ))
    )
  );

-- Comments table
CREATE TABLE canvas_workspace_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES canvas_workspaces(id) ON DELETE CASCADE,
  element_id UUID REFERENCES canvas_elements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  position JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE canvas_workspace_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments in their workspaces"
  ON canvas_workspace_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id
        AND (w.created_by = auth.uid() OR workspace_id IN (
          SELECT workspace_id FROM canvas_workspace_collaborators 
          WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create comments in their workspaces"
  ON canvas_workspace_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM canvas_workspaces w
      WHERE w.id = workspace_id
        AND (w.created_by = auth.uid() OR workspace_id IN (
          SELECT workspace_id FROM canvas_workspace_collaborators 
          WHERE user_id = auth.uid()
        ))
    ) AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON canvas_workspace_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON canvas_workspace_comments FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_elements;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_workspace_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE canvas_workspace_comments;

-- Create indexes for performance
CREATE INDEX idx_canvas_elements_codex_object ON canvas_elements(codex_object_id);
CREATE INDEX idx_canvas_elements_relationship_type ON canvas_elements(relationship_type_id);
CREATE INDEX idx_collaborators_workspace ON canvas_workspace_collaborators(workspace_id);
CREATE INDEX idx_versions_workspace ON canvas_workspace_versions(workspace_id);
CREATE INDEX idx_comments_workspace ON canvas_workspace_comments(workspace_id);
CREATE INDEX idx_comments_element ON canvas_workspace_comments(element_id);

-- Migration: 20251107234504
-- Canvas collaboration tables for real-time features

-- Table for tracking active collaborators on canvases
CREATE TABLE IF NOT EXISTS public.canvas_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_x FLOAT,
  cursor_y FLOAT,
  color TEXT NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(canvas_id, user_id)
);

-- Table for canvas comments/annotations
CREATE TABLE IF NOT EXISTS public.canvas_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  node_id TEXT,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for canvas activity feed
CREATE TABLE IF NOT EXISTS public.canvas_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.canvas_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canvas_collaborators
CREATE POLICY "Users can view collaborators on their org's canvases"
  ON public.canvas_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can insert their own collaborator record"
  ON public.canvas_collaborators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collaborator record"
  ON public.canvas_collaborators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collaborator record"
  ON public.canvas_collaborators FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for canvas_comments
CREATE POLICY "Users can view comments in their org"
  ON public.canvas_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = canvas_comments.organization_id
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can create comments in their org"
  ON public.canvas_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = canvas_comments.organization_id
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can update their own comments"
  ON public.canvas_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.canvas_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for canvas_activity
CREATE POLICY "Users can view activity in their org"
  ON public.canvas_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = canvas_activity.organization_id
      AND om.status = 'active'
    )
  );

CREATE POLICY "Users can create activity in their org"
  ON public.canvas_activity FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = canvas_activity.organization_id
      AND om.status = 'active'
    )
  );

-- Enable realtime for collaboration tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_activity;

-- Create indexes for performance
CREATE INDEX idx_canvas_collaborators_canvas_id ON public.canvas_collaborators(canvas_id);
CREATE INDEX idx_canvas_collaborators_user_id ON public.canvas_collaborators(user_id);
CREATE INDEX idx_canvas_comments_canvas_id ON public.canvas_comments(canvas_id);
CREATE INDEX idx_canvas_comments_organization_id ON public.canvas_comments(organization_id);
CREATE INDEX idx_canvas_activity_canvas_id ON public.canvas_activity(canvas_id);
CREATE INDEX idx_canvas_activity_organization_id ON public.canvas_activity(organization_id);
CREATE INDEX idx_canvas_activity_created_at ON public.canvas_activity(created_at DESC);

-- Trigger to update updated_at on canvas_comments
CREATE TRIGGER update_canvas_comments_updated_at
  BEFORE UPDATE ON public.canvas_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251108004248
-- Migration 1: Add platform_admin to app_role enum
-- This must be in a separate transaction
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';

-- Migration: 20251108004404
-- Migration 2: Update user_roles table and create platform access system

-- Make organization_id nullable in user_roles (for platform roles)
ALTER TABLE public.user_roles 
  ALTER COLUMN organization_id DROP NOT NULL;

-- Add constraint: platform_admin must have NULL organization_id
ALTER TABLE public.user_roles
  ADD CONSTRAINT platform_admin_no_org 
  CHECK (
    (role != 'platform_admin' AND organization_id IS NOT NULL) 
    OR 
    (role = 'platform_admin' AND organization_id IS NULL)
  );

-- Create index for platform admin lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_platform_admin 
  ON public.user_roles(user_id, role) 
  WHERE organization_id IS NULL;

COMMENT ON CONSTRAINT platform_admin_no_org ON public.user_roles IS 
  'Platform admins must have NULL organization_id; org roles must have an organization_id';

-- Create Platform Access Requests Table
CREATE TABLE IF NOT EXISTS public.platform_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request details
  email TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  
  -- Optional metadata
  company_size TEXT,
  industry TEXT,
  estimated_users INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  
  -- Review tracking
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Organization assignment (after approval)
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Invitation tracking
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.platform_access_requests ENABLE ROW LEVEL SECURITY;

-- Platform admins can see all requests
CREATE POLICY "Platform admins can view all access requests"
  ON public.platform_access_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'platform_admin'
        AND organization_id IS NULL
    )
  );

-- Platform admins can update requests
CREATE POLICY "Platform admins can manage access requests"
  ON public.platform_access_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'platform_admin'
        AND organization_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'platform_admin'
        AND organization_id IS NULL
    )
  );

-- Anyone can submit an access request (unauthenticated)
CREATE POLICY "Anyone can submit access request"
  ON public.platform_access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending' AND
    reviewed_by IS NULL AND
    reviewed_at IS NULL
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_access_requests_status 
  ON public.platform_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_platform_access_requests_email 
  ON public.platform_access_requests(email);
CREATE INDEX IF NOT EXISTS idx_platform_access_requests_reviewed_by 
  ON public.platform_access_requests(reviewed_by);

-- Trigger for updated_at
CREATE TRIGGER update_platform_access_requests_updated_at
  BEFORE UPDATE ON public.platform_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create Helper Functions
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
      AND organization_id IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.get_platform_admin_count()
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.user_roles
  WHERE role = 'platform_admin'
    AND organization_id IS NULL;
$$;

COMMENT ON FUNCTION public.is_platform_admin IS 
  'Returns true if the given user_id has platform_admin role (control plane access)';

-- Update organizations RLS policies for platform admins
CREATE POLICY "Platform admins can view all organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    is_platform_admin(auth.uid())
  );

CREATE POLICY "Platform admins can create organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_platform_admin(auth.uid())
  );

CREATE POLICY "Platform admins can update organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    is_platform_admin(auth.uid())
  );

-- Bootstrap First Platform Admin
-- ⚠️ IMPORTANT: Replace 'your-email@example.com' with your actual email after signing up
DO $$
DECLARE
  _admin_user_id UUID;
  _admin_email TEXT := 'your-email@example.com'; -- 🔴 REPLACE THIS WITH YOUR EMAIL
BEGIN
  -- Get the admin user's ID from auth.users
  SELECT id INTO _admin_user_id
  FROM auth.users
  WHERE email = _admin_email
  LIMIT 1;

  IF _admin_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found. Please sign up first, then update this migration with your email and rerun.', _admin_email;
  ELSE
    -- Update profile to remove organization_id for platform admin
    UPDATE public.profiles
    SET organization_id = NULL,
        full_name = COALESCE(full_name, 'Platform Administrator')
    WHERE id = _admin_user_id;

    -- Assign platform_admin role
    INSERT INTO public.user_roles (
      user_id,
      role,
      organization_id,
      assigned_by
    )
    VALUES (
      _admin_user_id,
      'platform_admin',
      NULL,  -- Platform-level role
      _admin_user_id  -- Self-assigned during bootstrap
    )
    ON CONFLICT (user_id, organization_id, role) DO NOTHING;

    RAISE NOTICE '✅ Platform admin created successfully for user: %', _admin_user_id;
  END IF;
END $$;

-- Migration: 20251108011703

-- Make organization_id nullable in audit_logs for platform admin operations
ALTER TABLE public.audit_logs 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update audit trigger to handle NULL organization_id for platform admins
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Skip audit log if it's a platform admin role (organization_id is NULL)
    IF NEW.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        NEW.assigned_by,
        NEW.organization_id,
        'role_assigned',
        'user_role',
        NEW.id,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'role', NEW.role,
          'project_id', NEW.project_id
        )
      );
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        NEW.assigned_by,
        NEW.organization_id,
        'role_updated',
        'user_role',
        NEW.id,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role,
          'project_id', NEW.project_id
        )
      );
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        auth.uid(),
        OLD.organization_id,
        'role_removed',
        'user_role',
        OLD.id,
        jsonb_build_object(
          'user_id', OLD.user_id,
          'role', OLD.role,
          'project_id', OLD.project_id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


-- Migration: 20251108011730

-- Make organization_id nullable in audit_logs for platform admin operations
ALTER TABLE public.audit_logs 
ALTER COLUMN organization_id DROP NOT NULL;

-- Update audit trigger to handle NULL organization_id for platform admins
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Skip audit log if it's a platform admin role (organization_id is NULL)
    IF NEW.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        NEW.assigned_by,
        NEW.organization_id,
        'role_assigned',
        'user_role',
        NEW.id,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'role', NEW.role,
          'project_id', NEW.project_id
        )
      );
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        NEW.assigned_by,
        NEW.organization_id,
        'role_updated',
        'user_role',
        NEW.id,
        jsonb_build_object(
          'user_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role,
          'project_id', NEW.project_id
        )
      );
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.organization_id IS NOT NULL THEN
      PERFORM log_audit_event(
        auth.uid(),
        OLD.organization_id,
        'role_removed',
        'user_role',
        OLD.id,
        jsonb_build_object(
          'user_id', OLD.user_id,
          'role', OLD.role,
          'project_id', OLD.project_id
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


-- Migration: 20251108012823
-- ============================================================================
-- PHASE 1: DATABASE ARCHITECTURE OVERHAUL - SCHEMA SEPARATION (IDEMPOTENT)
-- ============================================================================

-- Create platform_admin schema if not exists
CREATE SCHEMA IF NOT EXISTS platform_admin;

-- Create data classification enum if not exists
DO $$ BEGIN
  CREATE TYPE public.data_classification AS ENUM (
    'public', 'internal', 'confidential', 'restricted', 'highly_restricted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create data classification tracking table
CREATE TABLE IF NOT EXISTS platform_admin.data_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  classification public.data_classification NOT NULL,
  encryption_required BOOLEAN DEFAULT false,
  retention_days INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(schema_name, table_name)
);

-- Platform admin roles table
CREATE TABLE IF NOT EXISTS platform_admin.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'read_only',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Platform admin audit logs
CREATE TABLE IF NOT EXISTS platform_admin.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System configuration table
CREATE TABLE IF NOT EXISTS platform_admin.system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  classification public.data_classification DEFAULT 'restricted',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform admin access logs
CREATE TABLE IF NOT EXISTS platform_admin.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  accessed_schema TEXT NOT NULL,
  accessed_table TEXT,
  accessed_organization_id UUID,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cross-schema access permissions
CREATE TABLE IF NOT EXISTS platform_admin.cross_schema_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  target_schema TEXT NOT NULL,
  target_table TEXT,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'delete', 'admin')),
  granted_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security boundaries audit
CREATE TABLE IF NOT EXISTS platform_admin.schema_boundary_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  source_schema TEXT NOT NULL,
  target_schema TEXT NOT NULL,
  operation TEXT NOT NULL,
  data_classification public.data_classification,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrate platform admin roles (idempotent)
INSERT INTO platform_admin.admin_roles (user_id, role, assigned_by, assigned_at, created_at, updated_at)
SELECT 
  user_id,
  role,
  assigned_by,
  created_at as assigned_at,
  created_at,
  created_at as updated_at
FROM public.user_roles
WHERE organization_id IS NULL AND role = 'platform_admin'
ON CONFLICT (user_id, role) DO NOTHING;

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON platform_admin.admin_roles(user_id);
  CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON platform_admin.admin_roles(role);
  CREATE INDEX IF NOT EXISTS idx_platform_audit_user_id ON platform_admin.audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_platform_audit_action ON platform_admin.audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_platform_audit_created_at ON platform_admin.audit_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_access_logs_admin_user ON platform_admin.access_logs(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON platform_admin.access_logs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_cross_schema_perms_admin ON platform_admin.cross_schema_permissions(admin_user_id);
  CREATE INDEX IF NOT EXISTS idx_cross_schema_perms_active ON platform_admin.cross_schema_permissions(is_active) WHERE is_active = true;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE platform_admin.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.cross_schema_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.schema_boundary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.data_classifications ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admin.admin_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION platform_admin.log_admin_access(
  _admin_user_id uuid, _accessed_schema text, _accessed_table text DEFAULT NULL,
  _accessed_org_id uuid DEFAULT NULL, _action text DEFAULT 'view',
  _success boolean DEFAULT true, _reason text DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE _log_id uuid;
BEGIN
  INSERT INTO platform_admin.access_logs (admin_user_id, accessed_schema, accessed_table,
    accessed_organization_id, action, success, reason, created_at)
  VALUES (_admin_user_id, _accessed_schema, _accessed_table, _accessed_org_id,
    _action, _success, _reason, now())
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;

CREATE OR REPLACE FUNCTION platform_admin.log_platform_audit(
  _user_id uuid, _action text, _resource_type text,
  _resource_id uuid DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb,
  _severity text DEFAULT 'low'
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE _log_id uuid;
BEGIN
  INSERT INTO platform_admin.audit_logs (user_id, action, resource_type, resource_id, metadata, severity, created_at)
  VALUES (_user_id, _action, _resource_type, _resource_id, _metadata, _severity, now())
  RETURNING id INTO _log_id;
  RETURN _log_id;
END;
$$;

CREATE OR REPLACE FUNCTION platform_admin.can_access_schema(
  _admin_user_id uuid, _target_schema text, _permission_type text
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_admin.cross_schema_permissions
    WHERE admin_user_id = _admin_user_id AND target_schema = _target_schema
      AND permission_type = _permission_type AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) OR public.is_platform_admin(_admin_user_id);
$$;

-- RLS Policies (drop and recreate to be idempotent)
DROP POLICY IF EXISTS "Platform admins can view all admin roles" ON platform_admin.admin_roles;
DROP POLICY IF EXISTS "Platform admins can insert admin roles" ON platform_admin.admin_roles;
DROP POLICY IF EXISTS "Platform admins can update admin roles" ON platform_admin.admin_roles;
DROP POLICY IF EXISTS "Platform admins can view audit logs" ON platform_admin.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON platform_admin.audit_logs;
DROP POLICY IF EXISTS "Platform admins can manage system config" ON platform_admin.system_config;
DROP POLICY IF EXISTS "Users can view their own access logs" ON platform_admin.access_logs;
DROP POLICY IF EXISTS "System can insert access logs" ON platform_admin.access_logs;
DROP POLICY IF EXISTS "Platform admins can manage cross-schema permissions" ON platform_admin.cross_schema_permissions;
DROP POLICY IF EXISTS "Platform admins can view schema boundary logs" ON platform_admin.schema_boundary_logs;
DROP POLICY IF EXISTS "System can insert schema boundary logs" ON platform_admin.schema_boundary_logs;
DROP POLICY IF EXISTS "Platform admins can manage data classifications" ON platform_admin.data_classifications;

CREATE POLICY "Platform admins can view all admin roles" ON platform_admin.admin_roles FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can insert admin roles" ON platform_admin.admin_roles FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can update admin roles" ON platform_admin.admin_roles FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can view audit logs" ON platform_admin.audit_logs FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "System can insert audit logs" ON platform_admin.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Platform admins can manage system config" ON platform_admin.system_config FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Users can view their own access logs" ON platform_admin.access_logs FOR SELECT TO authenticated USING (admin_user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
CREATE POLICY "System can insert access logs" ON platform_admin.access_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Platform admins can manage cross-schema permissions" ON platform_admin.cross_schema_permissions FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can view schema boundary logs" ON platform_admin.schema_boundary_logs FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "System can insert schema boundary logs" ON platform_admin.schema_boundary_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Platform admins can manage data classifications" ON platform_admin.data_classifications FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid()));

-- Triggers
DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON platform_admin.admin_roles;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON platform_admin.system_config;
DROP TRIGGER IF EXISTS update_cross_schema_perms_updated_at ON platform_admin.cross_schema_permissions;
DROP TRIGGER IF EXISTS update_data_classifications_updated_at ON platform_admin.data_classifications;

CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON platform_admin.admin_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON platform_admin.system_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cross_schema_perms_updated_at BEFORE UPDATE ON platform_admin.cross_schema_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_classifications_updated_at BEFORE UPDATE ON platform_admin.data_classifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Populate data classifications (idempotent)
INSERT INTO platform_admin.data_classifications (schema_name, table_name, classification, encryption_required, description) VALUES
('platform_admin', 'admin_roles', 'highly_restricted', true, 'Platform administrator role assignments'),
('platform_admin', 'audit_logs', 'restricted', true, 'Platform-level audit trail'),
('platform_admin', 'system_config', 'highly_restricted', true, 'System-wide configuration settings'),
('platform_admin', 'access_logs', 'restricted', true, 'Cross-schema access tracking'),
('platform_admin', 'cross_schema_permissions', 'restricted', true, 'Schema boundary permissions'),
('platform_admin', 'schema_boundary_logs', 'restricted', true, 'Data movement across schemas'),
('platform_admin', 'data_classifications', 'restricted', false, 'Data classification metadata'),
('public', 'profiles', 'confidential', true, 'User profile information'),
('public', 'organizations', 'internal', false, 'Organization metadata'),
('public', 'organization_members', 'confidential', false, 'Organization membership'),
('public', 'user_roles', 'confidential', false, 'Organization-level user roles'),
('public', 'audit_logs', 'internal', true, 'Organization-level audit logs'),
('public', 'projects', 'internal', false, 'Project data'),
('public', 'tasks', 'internal', false, 'Task data'),
('public', 'deliverables', 'confidential', true, 'Deliverable artifacts')
ON CONFLICT (schema_name, table_name) DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA platform_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION platform_admin.log_admin_access(uuid, text, text, uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION platform_admin.log_platform_audit(uuid, text, text, uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION platform_admin.can_access_schema(uuid, text, text) TO authenticated;

-- Migration: 20251108012903
-- ============================================================================
-- FIX SECURITY LINTER WARNINGS - FUNCTION SEARCH PATH
-- ============================================================================
-- Add search_path to existing functions that are missing it

-- Fix get_object_type_properties
CREATE OR REPLACE FUNCTION public.get_object_type_properties(object_type_id_param uuid)
RETURNS TABLE(property_id uuid, name text, display_name text, data_type text, is_required boolean, default_value jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.display_name,
    p.data_type,
    p.is_required,
    p.default_value
  FROM public.codex_properties p
  WHERE p.object_type_id = object_type_id_param
  ORDER BY p.created_at;
END;
$$;

-- Fix get_object_with_properties
CREATE OR REPLACE FUNCTION public.get_object_with_properties(object_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'object_type_id', o.object_type_id,
    'name', o.name,
    'display_name', o.display_name,
    'description', o.description,
    'status', o.status,
    'created_at', o.created_at,
    'properties', (
      SELECT jsonb_object_agg(
        p.name,
        pv.value
      )
      FROM public.codex_object_property_values pv
      JOIN public.codex_properties p ON p.id = pv.property_id
      WHERE pv.object_id = o.id
    )
  ) INTO result
  FROM public.codex_objects o
  WHERE o.id = object_id_param;
  
  RETURN result;
END;
$$;

-- Fix get_platform_admin_count
CREATE OR REPLACE FUNCTION public.get_platform_admin_count()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM platform_admin.admin_roles
  WHERE role = 'platform_admin'
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- Fix get_user_primary_org (add explicit search_path)
CREATE OR REPLACE FUNCTION public.get_user_primary_org(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
    AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;
$$;

-- Fix auto_enable_apps_for_new_org
CREATE OR REPLACE FUNCTION public.auto_enable_apps_for_new_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert app_permissions for all active core apps
  INSERT INTO public.app_permissions (organization_id, app_id, is_enabled, role)
  SELECT 
    NEW.id as organization_id,
    a.id as app_id,
    true as is_enabled,
    NULL as role
  FROM 
    public.apps a
  WHERE 
    a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
    AND a.is_active = true;
  
  RETURN NEW;
END;
$$;

-- Migration: 20251108012951
-- ============================================================================
-- FIX REMAINING FUNCTION SEARCH PATH WARNINGS
-- ============================================================================

-- Fix can_access_project
CREATE OR REPLACE FUNCTION public.can_access_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = _project_id
      AND (
        p.user_id = _user_id
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = _user_id
        )
        OR has_role(_user_id, (SELECT organization_id FROM profiles WHERE id = p.user_id), 'org_admin')
      )
  );
$$;

-- Fix get_user_permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid, _org_id uuid)
RETURNS TABLE(permission permission_type)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT rp.permission
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  WHERE ur.user_id = _user_id 
    AND ur.organization_id = _org_id;
$$;

-- Fix get_user_roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid, _org_id uuid)
RETURNS TABLE(role app_role, project_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, project_id
  FROM user_roles
  WHERE user_id = _user_id 
    AND organization_id = _org_id;
$$;

-- Migration: 20251108013443
-- ============================================================================
-- CREATE HELPER FUNCTIONS TO ACCESS PLATFORM_ADMIN SCHEMA
-- ============================================================================
-- Since PostgREST only exposes public schema, we need functions to access platform_admin data

-- Function to get platform admin roles
CREATE OR REPLACE FUNCTION public.get_platform_admin_roles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  assigned_by uuid,
  assigned_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    ar.role,
    ar.assigned_by,
    ar.assigned_at,
    ar.expires_at,
    ar.metadata,
    ar.created_at,
    ar.updated_at,
    p.full_name,
    p.email
  FROM platform_admin.admin_roles ar
  LEFT JOIN public.profiles p ON p.id = ar.user_id
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY ar.assigned_at DESC;
END;
$$;

-- Function to get platform admin access logs
CREATE OR REPLACE FUNCTION public.get_platform_access_logs(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  admin_user_id uuid,
  accessed_schema text,
  accessed_table text,
  accessed_organization_id uuid,
  action text,
  success boolean,
  reason text,
  created_at timestamptz,
  admin_name text,
  admin_email text,
  org_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.admin_user_id,
    al.accessed_schema,
    al.accessed_table,
    al.accessed_organization_id,
    al.action,
    al.success,
    al.reason,
    al.created_at,
    p.full_name as admin_name,
    p.email as admin_email,
    o.name as org_name
  FROM platform_admin.access_logs al
  LEFT JOIN public.profiles p ON p.id = al.admin_user_id
  LEFT JOIN public.organizations o ON o.id = al.accessed_organization_id
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get schema boundary logs
CREATE OR REPLACE FUNCTION public.get_schema_boundary_logs(limit_count integer DEFAULT 15)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  source_schema text,
  target_schema text,
  operation text,
  data_classification data_classification,
  approved boolean,
  approved_by uuid,
  metadata jsonb,
  created_at timestamptz,
  user_name text,
  user_email text,
  approver_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbl.id,
    sbl.user_id,
    sbl.source_schema,
    sbl.target_schema,
    sbl.operation,
    sbl.data_classification,
    sbl.approved,
    sbl.approved_by,
    sbl.metadata,
    sbl.created_at,
    p.full_name as user_name,
    p.email as user_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get data classifications
CREATE OR REPLACE FUNCTION public.get_data_classifications()
RETURNS TABLE (
  id uuid,
  schema_name text,
  table_name text,
  classification data_classification,
  encryption_required boolean,
  retention_days integer,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.schema_name,
    dc.table_name,
    dc.classification,
    dc.encryption_required,
    dc.retention_days,
    dc.description,
    dc.created_at,
    dc.updated_at
  FROM platform_admin.data_classifications dc
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY dc.classification DESC, dc.schema_name ASC;
END;
$$;

-- Function to get platform admin counts for metrics
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'total_admins', (SELECT COUNT(*) FROM platform_admin.admin_roles WHERE expires_at IS NULL OR expires_at > now()),
    'recent_access_count', (SELECT COUNT(*) FROM platform_admin.access_logs WHERE created_at > now() - interval '24 hours'),
    'pending_boundaries', (SELECT COUNT(*) FROM platform_admin.schema_boundary_logs WHERE approved = false),
    'classified_tables', (SELECT COUNT(*) FROM platform_admin.data_classifications)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_platform_admin_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_access_logs(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_schema_boundary_logs(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_classifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_metrics() TO authenticated;

-- Migration: 20251108013558
-- ============================================================================
-- CREATE HELPER FUNCTIONS TO ACCESS PLATFORM_ADMIN SCHEMA
-- ============================================================================
-- Since PostgREST only exposes public schema, we need functions to access platform_admin data

-- Function to get platform admin roles
CREATE OR REPLACE FUNCTION public.get_platform_admin_roles()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role app_role,
  assigned_by uuid,
  assigned_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    ar.role,
    ar.assigned_by,
    ar.assigned_at,
    ar.expires_at,
    ar.metadata,
    ar.created_at,
    ar.updated_at,
    p.full_name,
    p.email
  FROM platform_admin.admin_roles ar
  LEFT JOIN public.profiles p ON p.id = ar.user_id
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY ar.assigned_at DESC;
END;
$$;

-- Function to get platform admin access logs
CREATE OR REPLACE FUNCTION public.get_platform_access_logs(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  admin_user_id uuid,
  accessed_schema text,
  accessed_table text,
  accessed_organization_id uuid,
  action text,
  success boolean,
  reason text,
  created_at timestamptz,
  admin_name text,
  admin_email text,
  org_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.id,
    al.admin_user_id,
    al.accessed_schema,
    al.accessed_table,
    al.accessed_organization_id,
    al.action,
    al.success,
    al.reason,
    al.created_at,
    p.full_name as admin_name,
    p.email as admin_email,
    o.name as org_name
  FROM platform_admin.access_logs al
  LEFT JOIN public.profiles p ON p.id = al.admin_user_id
  LEFT JOIN public.organizations o ON o.id = al.accessed_organization_id
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY al.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get schema boundary logs
CREATE OR REPLACE FUNCTION public.get_schema_boundary_logs(limit_count integer DEFAULT 15)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  source_schema text,
  target_schema text,
  operation text,
  data_classification data_classification,
  approved boolean,
  approved_by uuid,
  metadata jsonb,
  created_at timestamptz,
  user_name text,
  user_email text,
  approver_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbl.id,
    sbl.user_id,
    sbl.source_schema,
    sbl.target_schema,
    sbl.operation,
    sbl.data_classification,
    sbl.approved,
    sbl.approved_by,
    sbl.metadata,
    sbl.created_at,
    p.full_name as user_name,
    p.email as user_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to get data classifications
CREATE OR REPLACE FUNCTION public.get_data_classifications()
RETURNS TABLE (
  id uuid,
  schema_name text,
  table_name text,
  classification data_classification,
  encryption_required boolean,
  retention_days integer,
  description text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.schema_name,
    dc.table_name,
    dc.classification,
    dc.encryption_required,
    dc.retention_days,
    dc.description,
    dc.created_at,
    dc.updated_at
  FROM platform_admin.data_classifications dc
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY dc.classification DESC, dc.schema_name ASC;
END;
$$;

-- Function to get platform admin counts for metrics
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'total_admins', (SELECT COUNT(*) FROM platform_admin.admin_roles WHERE expires_at IS NULL OR expires_at > now()),
    'recent_access_count', (SELECT COUNT(*) FROM platform_admin.access_logs WHERE created_at > now() - interval '24 hours'),
    'pending_boundaries', (SELECT COUNT(*) FROM platform_admin.schema_boundary_logs WHERE approved = false),
    'classified_tables', (SELECT COUNT(*) FROM platform_admin.data_classifications)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_platform_admin_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_access_logs(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_schema_boundary_logs(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_data_classifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_metrics() TO authenticated;

-- Migration: 20251108014228
-- Add approval reason field to schema_boundary_logs
ALTER TABLE platform_admin.schema_boundary_logs
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create function to approve/deny schema boundary crossing
CREATE OR REPLACE FUNCTION public.approve_schema_boundary(
  _log_id UUID,
  _approved BOOLEAN,
  _reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _admin_id UUID;
  _user_id UUID;
  _user_email TEXT;
  _result JSONB;
BEGIN
  -- Check if caller is platform admin
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can approve boundary crossings';
  END IF;

  _admin_id := auth.uid();

  -- Get the user_id and email from the log
  SELECT sbl.user_id, p.email INTO _user_id, _user_email
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  WHERE sbl.id = _log_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Schema boundary log not found';
  END IF;

  -- Update the log
  UPDATE platform_admin.schema_boundary_logs
  SET 
    approved = _approved,
    approved_by = _admin_id,
    approval_reason = _reason,
    approved_at = now()
  WHERE id = _log_id;

  -- Return result for notification
  SELECT jsonb_build_object(
    'user_id', _user_id,
    'user_email', _user_email,
    'approved', _approved,
    'reason', _reason,
    'log_id', _log_id
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Migration: 20251108014410
-- Add approval reason field to schema_boundary_logs
ALTER TABLE platform_admin.schema_boundary_logs
ADD COLUMN IF NOT EXISTS approval_reason TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create function to approve/deny schema boundary crossing
CREATE OR REPLACE FUNCTION public.approve_schema_boundary(
  _log_id UUID,
  _approved BOOLEAN,
  _reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _admin_id UUID;
  _user_id UUID;
  _user_email TEXT;
  _result JSONB;
BEGIN
  -- Check if caller is platform admin
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can approve boundary crossings';
  END IF;

  _admin_id := auth.uid();

  -- Get the user_id and email from the log
  SELECT sbl.user_id, p.email INTO _user_id, _user_email
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  WHERE sbl.id = _log_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Schema boundary log not found';
  END IF;

  -- Update the log
  UPDATE platform_admin.schema_boundary_logs
  SET 
    approved = _approved,
    approved_by = _admin_id,
    approval_reason = _reason,
    approved_at = now()
  WHERE id = _log_id;

  -- Return result for notification
  SELECT jsonb_build_object(
    'user_id', _user_id,
    'user_email', _user_email,
    'approved', _approved,
    'reason', _reason,
    'log_id', _log_id
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Migration: 20251108014722
-- Drop and recreate get_schema_boundary_logs to include approval_reason
DROP FUNCTION IF EXISTS public.get_schema_boundary_logs(integer);

CREATE OR REPLACE FUNCTION public.get_schema_boundary_logs(limit_count integer DEFAULT 15)
 RETURNS TABLE(id uuid, user_id uuid, source_schema text, target_schema text, operation text, data_classification data_classification, approved boolean, approved_by uuid, approval_reason text, metadata jsonb, created_at timestamp with time zone, user_name text, user_email text, approver_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbl.id,
    sbl.user_id,
    sbl.source_schema,
    sbl.target_schema,
    sbl.operation,
    sbl.data_classification,
    sbl.approved,
    sbl.approved_by,
    sbl.approval_reason,
    sbl.metadata,
    sbl.created_at,
    p.full_name as user_name,
    p.email as user_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Migration: 20251108014752
-- Drop and recreate get_schema_boundary_logs to include approval_reason
DROP FUNCTION IF EXISTS public.get_schema_boundary_logs(integer);

CREATE FUNCTION public.get_schema_boundary_logs(limit_count integer DEFAULT 15)
 RETURNS TABLE(id uuid, user_id uuid, source_schema text, target_schema text, operation text, data_classification data_classification, approved boolean, approved_by uuid, approval_reason text, metadata jsonb, created_at timestamp with time zone, user_name text, user_email text, approver_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbl.id,
    sbl.user_id,
    sbl.source_schema,
    sbl.target_schema,
    sbl.operation,
    sbl.data_classification,
    sbl.approved,
    sbl.approved_by,
    sbl.approval_reason,
    sbl.metadata,
    sbl.created_at,
    p.full_name as user_name,
    p.email as user_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Migration: 20251108014824
-- Drop and recreate get_schema_boundary_logs to include approval_reason
DROP FUNCTION IF EXISTS public.get_schema_boundary_logs(integer);

CREATE FUNCTION public.get_schema_boundary_logs(limit_count integer DEFAULT 15)
 RETURNS TABLE(id uuid, user_id uuid, source_schema text, target_schema text, operation text, data_classification data_classification, approved boolean, approved_by uuid, approval_reason text, metadata jsonb, created_at timestamp with time zone, user_name text, user_email text, approver_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sbl.id,
    sbl.user_id,
    sbl.source_schema,
    sbl.target_schema,
    sbl.operation,
    sbl.data_classification,
    sbl.approved,
    sbl.approved_by,
    sbl.approval_reason,
    sbl.metadata,
    sbl.created_at,
    p.full_name as user_name,
    p.email as user_email,
    ap.full_name as approver_name
  FROM platform_admin.schema_boundary_logs sbl
  LEFT JOIN public.profiles p ON p.id = sbl.user_id
  LEFT JOIN public.profiles ap ON ap.id = sbl.approved_by
  WHERE public.is_platform_admin(auth.uid())
  ORDER BY sbl.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Migration: 20251108014927
-- Create function to get boundary crossing analytics
CREATE OR REPLACE FUNCTION public.get_boundary_crossing_analytics(
  days_back integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  result jsonb;
  total_count integer;
  approved_count integer;
  denied_count integer;
  pending_count integer;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RETURN '{}'::jsonb;
  END IF;

  -- Get overall counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE approved = true AND approved_by IS NOT NULL),
    COUNT(*) FILTER (WHERE approved = false AND approved_by IS NOT NULL),
    COUNT(*) FILTER (WHERE approved_by IS NULL)
  INTO total_count, approved_count, denied_count, pending_count
  FROM platform_admin.schema_boundary_logs
  WHERE created_at >= now() - (days_back || ' days')::interval;

  -- Build comprehensive result
  SELECT jsonb_build_object(
    'summary', jsonb_build_object(
      'total', total_count,
      'approved', approved_count,
      'denied', denied_count,
      'pending', pending_count,
      'approval_rate', CASE WHEN (approved_count + denied_count) > 0 
        THEN ROUND((approved_count::numeric / (approved_count + denied_count)) * 100, 2)
        ELSE 0 END
    ),
    'daily_trends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_series::date,
          'approved', COALESCE(approved, 0),
          'denied', COALESCE(denied, 0),
          'pending', COALESCE(pending, 0)
        ) ORDER BY date_series
      )
      FROM generate_series(
        now() - (days_back || ' days')::interval,
        now(),
        '1 day'::interval
      ) date_series
      LEFT JOIN (
        SELECT 
          DATE(created_at) as log_date,
          COUNT(*) FILTER (WHERE approved = true AND approved_by IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE approved = false AND approved_by IS NOT NULL) as denied,
          COUNT(*) FILTER (WHERE approved_by IS NULL) as pending
        FROM platform_admin.schema_boundary_logs
        WHERE created_at >= now() - (days_back || ' days')::interval
        GROUP BY DATE(created_at)
      ) daily ON daily.log_date = date_series::date
    ),
    'common_crossings', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'source', source_schema,
          'target', target_schema,
          'count', count,
          'approved', approved,
          'denied', denied
        ) ORDER BY count DESC
      )
      FROM (
        SELECT 
          source_schema,
          target_schema,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE approved = true AND approved_by IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE approved = false AND approved_by IS NOT NULL) as denied
        FROM platform_admin.schema_boundary_logs
        WHERE created_at >= now() - (days_back || ' days')::interval
        GROUP BY source_schema, target_schema
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) top_crossings
    ),
    'by_operation', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'operation', operation,
          'count', count,
          'approved', approved,
          'denied', denied
        ) ORDER BY count DESC
      )
      FROM (
        SELECT 
          operation,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE approved = true AND approved_by IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE approved = false AND approved_by IS NOT NULL) as denied
        FROM platform_admin.schema_boundary_logs
        WHERE created_at >= now() - (days_back || ' days')::interval
        GROUP BY operation
      ) by_op
    ),
    'by_classification', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'classification', COALESCE(data_classification::text, 'unclassified'),
          'count', count,
          'approved', approved,
          'denied', denied
        ) ORDER BY count DESC
      )
      FROM (
        SELECT 
          data_classification,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE approved = true AND approved_by IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE approved = false AND approved_by IS NOT NULL) as denied
        FROM platform_admin.schema_boundary_logs
        WHERE created_at >= now() - (days_back || ' days')::interval
        GROUP BY data_classification
      ) by_class
    ),
    'top_requesters', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_name', user_name,
          'user_email', user_email,
          'count', count,
          'approved', approved,
          'denied', denied
        ) ORDER BY count DESC
      )
      FROM (
        SELECT 
          p.full_name as user_name,
          p.email as user_email,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE sbl.approved = true AND sbl.approved_by IS NOT NULL) as approved,
          COUNT(*) FILTER (WHERE sbl.approved = false AND sbl.approved_by IS NOT NULL) as denied
        FROM platform_admin.schema_boundary_logs sbl
        JOIN public.profiles p ON p.id = sbl.user_id
        WHERE sbl.created_at >= now() - (days_back || ' days')::interval
        GROUP BY p.full_name, p.email
        ORDER BY COUNT(*) DESC
        LIMIT 10
      ) top_users
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Migration: 20251108020936
-- PHASE 1: SECURITY HARDENING
-- Fix critical RLS policies and add security infrastructure

-- 1. Create organization financial data table (separate sensitive data)
CREATE TABLE IF NOT EXISTS organization_financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_id text,
  billing_email text,
  encrypted_billing_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only org admins can see financial data
ALTER TABLE organization_financial_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only org admins see financial data" 
  ON organization_financial_data FOR SELECT
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

CREATE POLICY "Only org admins manage financial data" 
  ON organization_financial_data FOR ALL
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- 2. Add MFA tracking for platform admins
ALTER TABLE platform_admin.admin_roles 
  ADD COLUMN IF NOT EXISTS mfa_enforced_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_last_verified timestamptz;

-- 3. Create sensitive data access log
CREATE TABLE IF NOT EXISTS platform_admin.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id),
  accessed_table text NOT NULL,
  accessed_record_id uuid,
  operation text NOT NULL,
  data_classification text,
  reason text,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view sensitive access logs" 
  ON platform_admin.sensitive_data_access_log FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can insert sensitive access logs" 
  ON platform_admin.sensitive_data_access_log FOR INSERT
  WITH CHECK (true);

-- 4. Failed authentication tracking
CREATE TABLE IF NOT EXISTS platform_admin.failed_auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  ip_address inet NOT NULL,
  attempt_count integer DEFAULT 1,
  last_attempt timestamptz DEFAULT now(),
  blocked_until timestamptz,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.failed_auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view failed auth attempts" 
  ON platform_admin.failed_auth_attempts FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can manage failed auth attempts" 
  ON platform_admin.failed_auth_attempts FOR ALL
  WITH CHECK (true);

-- PHASE 2: UX & COLLABORATION

-- 5. Multi-admin approval workflows
CREATE TABLE IF NOT EXISTS platform_admin.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_condition jsonb NOT NULL,
  required_approvers integer DEFAULT 2,
  approver_roles text[] DEFAULT ARRAY['platform_admin'],
  timeout_hours integer DEFAULT 24,
  escalation_policy jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.approval_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage approval workflows" 
  ON platform_admin.approval_workflows FOR ALL
  USING (is_platform_admin(auth.uid()));

-- 6. Approval workflow executions
CREATE TABLE IF NOT EXISTS platform_admin.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES platform_admin.approval_workflows(id),
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  required_approvals integer NOT NULL,
  current_approvals integer DEFAULT 0,
  approvers jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending',
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view workflow executions" 
  ON platform_admin.workflow_executions FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update workflow executions" 
  ON platform_admin.workflow_executions FOR UPDATE
  USING (is_platform_admin(auth.uid()));

-- PHASE 3: AI & INTELLIGENCE

-- 7. AI approval suggestions
CREATE TABLE IF NOT EXISTS platform_admin.ai_approval_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  recommendation text NOT NULL,
  confidence_score numeric(5,2),
  reasoning text,
  risk_factors jsonb DEFAULT '[]'::jsonb,
  model_version text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.ai_approval_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view AI suggestions" 
  ON platform_admin.ai_approval_suggestions FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can create AI suggestions" 
  ON platform_admin.ai_approval_suggestions FOR INSERT
  WITH CHECK (true);

-- 8. Anomaly detection
CREATE TABLE IF NOT EXISTS platform_admin.anomaly_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anomaly_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  affected_user_id uuid REFERENCES auth.users(id),
  affected_org_id uuid REFERENCES organizations(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz DEFAULT now(),
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text
);

ALTER TABLE platform_admin.anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage anomaly alerts" 
  ON platform_admin.anomaly_alerts FOR ALL
  USING (is_platform_admin(auth.uid()));

-- PHASE 4: ENTERPRISE FEATURES

-- 9. Request queue
CREATE TABLE IF NOT EXISTS platform_admin.request_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  payload jsonb NOT NULL,
  priority integer DEFAULT 5,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  status text DEFAULT 'pending',
  error_message text,
  scheduled_for timestamptz DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.request_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view request queue" 
  ON platform_admin.request_queue FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can manage request queue" 
  ON platform_admin.request_queue FOR ALL
  WITH CHECK (true);

-- 10. SLA configuration
CREATE TABLE IF NOT EXISTS platform_admin.sla_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  priority text NOT NULL,
  response_time_hours integer NOT NULL,
  resolution_time_hours integer NOT NULL,
  escalation_chain jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(request_type, priority)
);

ALTER TABLE platform_admin.sla_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage SLA config" 
  ON platform_admin.sla_config FOR ALL
  USING (is_platform_admin(auth.uid()));

-- 11. SLA violations tracking
CREATE TABLE IF NOT EXISTS platform_admin.sla_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  request_type text NOT NULL,
  sla_config_id uuid REFERENCES platform_admin.sla_config(id),
  violation_type text NOT NULL,
  expected_resolution_at timestamptz NOT NULL,
  actual_resolution_at timestamptz,
  escalation_level integer DEFAULT 0,
  escalated_to uuid REFERENCES auth.users(id),
  escalated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.sla_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view SLA violations" 
  ON platform_admin.sla_violations FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can create SLA violations" 
  ON platform_admin.sla_violations FOR INSERT
  WITH CHECK (true);

-- 12. Compliance audit trail
CREATE TABLE IF NOT EXISTS platform_admin.compliance_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type text NOT NULL,
  framework text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  file_path text,
  file_size_bytes bigint,
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE platform_admin.compliance_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage compliance exports" 
  ON platform_admin.compliance_exports FOR ALL
  USING (is_platform_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensitive_access_log_admin ON platform_admin.sensitive_data_access_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_auth_email ON platform_admin.failed_auth_attempts(user_email, last_attempt DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_severity ON platform_admin.anomaly_alerts(severity, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_queue_status ON platform_admin.request_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_sla_violations_request ON platform_admin.sla_violations(request_id, created_at DESC);

-- Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.schema_boundary_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.anomaly_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.request_queue;

-- Insert default SLA configurations
INSERT INTO platform_admin.sla_config (request_type, priority, response_time_hours, resolution_time_hours, escalation_chain) VALUES
  ('schema_boundary', 'critical', 1, 4, '[{"role": "platform_admin", "after_hours": 1}, {"role": "senior_admin", "after_hours": 2}]'::jsonb),
  ('schema_boundary', 'high', 4, 24, '[{"role": "platform_admin", "after_hours": 4}, {"role": "senior_admin", "after_hours": 8}]'::jsonb),
  ('schema_boundary', 'medium', 24, 72, '[{"role": "platform_admin", "after_hours": 24}]'::jsonb),
  ('access_request', 'critical', 2, 8, '[{"role": "platform_admin", "after_hours": 2}, {"role": "senior_admin", "after_hours": 4}]'::jsonb)
ON CONFLICT (request_type, priority) DO NOTHING;

-- Migration: 20251108024130
-- ========================================
-- PHASE 1: SECURITY HARDENING (CLEAN START)
-- ========================================

-- Clean up any previous partial migrations
DROP TABLE IF EXISTS platform_admin.sensitive_data_access_log CASCADE;
DROP TABLE IF EXISTS platform_admin.failed_access_attempts CASCADE;
DROP TABLE IF EXISTS platform_admin.security_alerts CASCADE;
DROP TABLE IF EXISTS organization_financial_data CASCADE;

-- 1. Fix profiles table RLS - restrict to org members only
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Org members can view org profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() 
        AND om2.user_id = profiles.id
        AND om1.status = 'active'
        AND om2.status = 'active'
    )
  );

-- 2. Create secure financial data table
CREATE TABLE organization_financial_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tax_id text,
  billing_email text,
  payment_method_id text,
  encrypted_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(organization_id)
);

ALTER TABLE organization_financial_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only org admins view financial data" 
  ON organization_financial_data FOR SELECT
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

CREATE POLICY "Only org admins update financial data" 
  ON organization_financial_data FOR UPDATE
  USING (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

CREATE POLICY "Only org admins insert financial data" 
  ON organization_financial_data FOR INSERT
  WITH CHECK (has_role(auth.uid(), organization_id, 'org_admin'::app_role));

-- 3. Restrict apps table to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active apps" ON apps;

CREATE POLICY "Authenticated users view apps" ON apps
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- 4. Restrict app_permissions to org members
DROP POLICY IF EXISTS "Users can view app permissions for their org" ON app_permissions;

CREATE POLICY "Org members view app permissions" ON app_permissions
  FOR SELECT USING (is_org_member(auth.uid(), organization_id));

-- 5. Create sensitive data access log table
CREATE TABLE platform_admin.sensitive_data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  data_classification text,
  ip_address inet,
  user_agent text,
  query_details jsonb DEFAULT '{}'::jsonb,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.sensitive_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view sensitive access logs"
  ON platform_admin.sensitive_data_access_log FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System inserts sensitive access logs"
  ON platform_admin.sensitive_data_access_log FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_sensitive_access_user ON platform_admin.sensitive_data_access_log(user_id, accessed_at DESC);
CREATE INDEX idx_sensitive_access_table ON platform_admin.sensitive_data_access_log(table_name, accessed_at DESC);
CREATE INDEX idx_sensitive_access_classification ON platform_admin.sensitive_data_access_log(data_classification, accessed_at DESC);

-- 6. Create failed access attempts log
CREATE TABLE platform_admin.failed_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  organization_id uuid,
  resource_type text NOT NULL,
  resource_id uuid,
  action_attempted text NOT NULL,
  failure_reason text NOT NULL,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.failed_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view failed attempts"
  ON platform_admin.failed_access_attempts FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System inserts failed attempts"
  ON platform_admin.failed_access_attempts FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_failed_attempts_user ON platform_admin.failed_access_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_failed_attempts_ip ON platform_admin.failed_access_attempts(ip_address, attempted_at DESC);

-- 7. Add MFA tracking to admin_roles
ALTER TABLE platform_admin.admin_roles 
  ADD COLUMN IF NOT EXISTS mfa_enforced_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_mfa_check timestamptz;

-- 8. Create security alerts table
CREATE TABLE platform_admin.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN ('suspicious_access', 'multiple_failures', 'unusual_timing', 'data_exfiltration', 'privilege_escalation')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid,
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage security alerts"
  ON platform_admin.security_alerts FOR ALL
  USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_security_alerts_status ON platform_admin.security_alerts(status, severity, created_at DESC);
CREATE INDEX idx_security_alerts_user ON platform_admin.security_alerts(user_id, created_at DESC);

-- Migration: 20251108025118
-- ========================================
-- ORGANIZATION COMMAND CENTER SCHEMA
-- ========================================

-- 1. App Entitlements
CREATE TABLE IF NOT EXISTS platform_admin.app_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_id uuid NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'requested', 'approved', 'denied', 'suspended', 'expired')),
  tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise', 'custom')),
  features_enabled jsonb DEFAULT '{}'::jsonb,
  limits jsonb DEFAULT '{
    "max_users": null,
    "storage_gb": null,
    "api_calls_per_month": null,
    "compute_hours_per_month": null
  }'::jsonb,
  requested_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  requested_at timestamptz,
  approved_at timestamptz,
  activated_at timestamptz,
  expires_at timestamptz,
  denial_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, app_id)
);

ALTER TABLE platform_admin.app_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage app entitlements"
  ON platform_admin.app_entitlements FOR ALL
  USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_app_entitlements_org ON platform_admin.app_entitlements(organization_id, status);
CREATE INDEX idx_app_entitlements_status ON platform_admin.app_entitlements(status) WHERE status IN ('requested', 'active');

-- 2. Organization Metrics
CREATE TABLE IF NOT EXISTS platform_admin.organization_metrics (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  storage_used_bytes bigint DEFAULT 0,
  storage_limit_bytes bigint,
  storage_percentage numeric GENERATED ALWAYS AS (
    CASE WHEN storage_limit_bytes > 0 
    THEN (storage_used_bytes::numeric / storage_limit_bytes * 100)::numeric(5,2)
    ELSE 0 END
  ) STORED,
  active_users_count integer DEFAULT 0,
  total_users_count integer DEFAULT 0,
  max_users_limit integer,
  api_calls_30d bigint DEFAULT 0,
  api_calls_limit_30d bigint,
  database_size_mb numeric DEFAULT 0,
  database_tables_count integer DEFAULT 0,
  compute_hours_30d numeric DEFAULT 0,
  compute_limit_30d numeric,
  last_activity_at timestamptz,
  last_login_at timestamptz,
  projects_count integer DEFAULT 0,
  active_projects_count integer DEFAULT 0,
  health_score numeric DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
  health_issues jsonb DEFAULT '[]'::jsonb,
  features_used jsonb DEFAULT '{}'::jsonb,
  estimated_monthly_cost_usd numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.organization_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view org metrics"
  ON platform_admin.organization_metrics FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System inserts org metrics"
  ON platform_admin.organization_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System modifies org metrics"
  ON platform_admin.organization_metrics FOR UPDATE
  USING (true);

-- 3. Usage Events
CREATE TABLE IF NOT EXISTS platform_admin.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_id uuid REFERENCES apps(id),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL CHECK (event_type IN (
    'api_call', 'storage_write', 'storage_read', 
    'compute_hours', 'user_login', 'feature_usage',
    'pipeline_execution', 'ai_inference'
  )),
  quantity numeric NOT NULL DEFAULT 1,
  unit text,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  cost_usd numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins view usage events"
  ON platform_admin.usage_events FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "System inserts usage events"
  ON platform_admin.usage_events FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_usage_events_org_time ON platform_admin.usage_events(organization_id, created_at DESC);
CREATE INDEX idx_usage_events_type_time ON platform_admin.usage_events(event_type, created_at DESC);
CREATE INDEX idx_usage_events_app ON platform_admin.usage_events(app_id, created_at DESC);

-- 4. Organization Configuration
CREATE TABLE IF NOT EXISTS platform_admin.organization_config (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise', 'custom')),
  plan_name text,
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'annual', 'custom')),
  features_enabled jsonb DEFAULT '{}'::jsonb,
  global_limits jsonb DEFAULT '{
    "max_users": 5,
    "max_projects": 10,
    "storage_gb": 10,
    "api_calls_per_day": 10000,
    "compute_hours_per_month": 100
  }'::jsonb,
  support_tier text DEFAULT 'community' CHECK (support_tier IN ('community', 'standard', 'priority', 'enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'churned')),
  trial_ends_at timestamptz,
  suspended_reason text,
  suspended_at timestamptz,
  onboarding_completed boolean DEFAULT false,
  onboarding_step text,
  custom_settings jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_admin.organization_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage org config"
  ON platform_admin.organization_config FOR ALL
  USING (is_platform_admin(auth.uid()));

-- 5. Trigger function for new orgs
CREATE OR REPLACE FUNCTION platform_admin.initialize_org_admin_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO platform_admin.organization_metrics (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  
  INSERT INTO platform_admin.organization_config (organization_id)
  VALUES (NEW.id)
  ON CONFLICT (organization_id) DO NOTHING;
  
  INSERT INTO platform_admin.app_entitlements (organization_id, app_id, status, tier, activated_at)
  SELECT NEW.id, a.id, 'active', 'free', now()
  FROM apps a
  WHERE a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
    AND a.is_active = true
  ON CONFLICT (organization_id, app_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = platform_admin, public;

CREATE TRIGGER trigger_initialize_org_admin_data
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION platform_admin.initialize_org_admin_data();

-- 6. Initialize existing orgs
INSERT INTO platform_admin.organization_metrics (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO platform_admin.organization_config (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;

INSERT INTO platform_admin.app_entitlements (organization_id, app_id, status, tier, activated_at)
SELECT o.id, a.id, 'active', 'free', now()
FROM organizations o
CROSS JOIN apps a
WHERE a.slug IN ('project-management', 'dashboards', 'stakeholders', 'integrations')
  AND a.is_active = true
ON CONFLICT (organization_id, app_id) DO NOTHING;

-- 7. Health score calculation function
CREATE OR REPLACE FUNCTION platform_admin.calculate_org_health_score(_org_id uuid)
RETURNS numeric AS $$
DECLARE
  _score numeric := 100;
  _issues jsonb := '[]'::jsonb;
  _metrics RECORD;
BEGIN
  SELECT * INTO _metrics FROM platform_admin.organization_metrics WHERE organization_id = _org_id;
  
  IF NOT FOUND THEN RETURN 0; END IF;
  
  IF _metrics.storage_percentage > 95 THEN
    _score := _score - 20;
    _issues := _issues || jsonb_build_object('type', 'storage_critical', 'severity', 'high');
  ELSIF _metrics.storage_percentage > 80 THEN
    _score := _score - 10;
    _issues := _issues || jsonb_build_object('type', 'storage_warning', 'severity', 'medium');
  END IF;
  
  IF _metrics.last_activity_at < now() - interval '30 days' THEN
    _score := _score - 30;
    _issues := _issues || jsonb_build_object('type', 'inactive_org', 'severity', 'high');
  ELSIF _metrics.last_activity_at < now() - interval '7 days' THEN
    _score := _score - 15;
    _issues := _issues || jsonb_build_object('type', 'low_activity', 'severity', 'medium');
  END IF;
  
  IF _metrics.active_users_count = 0 THEN
    _score := _score - 25;
    _issues := _issues || jsonb_build_object('type', 'no_active_users', 'severity', 'high');
  END IF;
  
  UPDATE platform_admin.organization_metrics
  SET health_score = _score, health_issues = _issues, last_calculated_at = now()
  WHERE organization_id = _org_id;
  
  RETURN _score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = platform_admin, public;

-- Migration: 20251108030250
-- Enable realtime for organization metrics
ALTER TABLE platform_admin.organization_metrics REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.organization_metrics;

-- Enable realtime for usage events
ALTER TABLE platform_admin.usage_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.usage_events;

-- Enable realtime for organization config
ALTER TABLE platform_admin.organization_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.organization_config;

-- Enable realtime for app entitlements
ALTER TABLE platform_admin.app_entitlements REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.app_entitlements;

-- Migration: 20251108030519
-- Create health score history table for trend analysis
CREATE TABLE platform_admin.health_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL DEFAULT '{}',
  issues JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_history_org_date ON platform_admin.health_score_history(organization_id, created_at DESC);

-- Create health alerts table
CREATE TABLE platform_admin.health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendations JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_health_alerts_org_status ON platform_admin.health_alerts(organization_id, status, created_at DESC);
CREATE INDEX idx_health_alerts_severity ON platform_admin.health_alerts(severity, status);

-- Enable RLS
ALTER TABLE platform_admin.health_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for health_score_history
CREATE POLICY "Platform admins can view health history"
  ON platform_admin.health_score_history
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert health history"
  ON platform_admin.health_score_history
  FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- RLS Policies for health_alerts
CREATE POLICY "Platform admins can manage health alerts"
  ON platform_admin.health_alerts
  FOR ALL
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Function to record health score history
CREATE OR REPLACE FUNCTION platform_admin.record_health_score_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform_admin, public
AS $$
BEGIN
  -- Insert current health scores into history
  INSERT INTO platform_admin.health_score_history (organization_id, score, factors, issues)
  SELECT 
    organization_id,
    health_score,
    jsonb_build_object(
      'active_users', active_users_count,
      'storage', storage_percentage,
      'projects', projects_count,
      'last_activity', last_activity_at
    ),
    health_issues
  FROM platform_admin.organization_metrics
  WHERE health_score IS NOT NULL;
END;
$$;

-- Trigger to update health alerts timestamp
CREATE OR REPLACE FUNCTION platform_admin.update_health_alert_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_health_alerts_updated_at
  BEFORE UPDATE ON platform_admin.health_alerts
  FOR EACH ROW
  EXECUTE FUNCTION platform_admin.update_health_alert_timestamp();

-- Enable realtime for health alerts
ALTER TABLE platform_admin.health_alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.health_alerts;

-- Enable realtime for health score history
ALTER TABLE platform_admin.health_score_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE platform_admin.health_score_history;

-- Migration: 20251108035751
-- Create access justifications table
CREATE TABLE platform_admin.access_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users NOT NULL,
  target_organization_id uuid REFERENCES public.organizations,
  reason text NOT NULL CHECK (char_length(reason) >= 20),
  ticket_reference text,
  approved_by uuid REFERENCES auth.users,
  approved_at timestamptz,
  expires_at timestamptz NOT NULL,
  access_granted boolean DEFAULT false,
  ip_address text,
  user_agent text,
  session_metadata jsonb DEFAULT '{}'::jsonb,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users,
  revoked_reason text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at),
  CONSTRAINT valid_approval CHECK (
    (access_granted = false AND approved_by IS NULL) OR
    (access_granted = true AND approved_by IS NOT NULL)
  )
);

-- Add indexes for performance
CREATE INDEX idx_access_justifications_admin ON platform_admin.access_justifications(admin_user_id);
CREATE INDEX idx_access_justifications_org ON platform_admin.access_justifications(target_organization_id);
CREATE INDEX idx_access_justifications_active ON platform_admin.access_justifications(admin_user_id, expires_at, access_granted, revoked_at);

-- Add justification_id to schema boundary logs
ALTER TABLE platform_admin.schema_boundary_logs 
ADD COLUMN justification_id uuid REFERENCES platform_admin.access_justifications;

-- Function to check if admin has valid justification
CREATE OR REPLACE FUNCTION platform_admin.has_valid_justification(
  _admin_id uuid,
  _org_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_admin.access_justifications
    WHERE admin_user_id = _admin_id
      AND (target_organization_id = _org_id OR target_organization_id IS NULL)
      AND access_granted = true
      AND expires_at > now()
      AND revoked_at IS NULL
  );
END;
$$;

-- Function to get active justification for admin
CREATE OR REPLACE FUNCTION platform_admin.get_active_justification(
  _admin_id uuid,
  _org_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _justification_id uuid;
BEGIN
  SELECT id INTO _justification_id
  FROM platform_admin.access_justifications
  WHERE admin_user_id = _admin_id
    AND (target_organization_id = _org_id OR target_organization_id IS NULL)
    AND access_granted = true
    AND expires_at > now()
    AND revoked_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN _justification_id;
END;
$$;

-- Function to create access justification
CREATE OR REPLACE FUNCTION public.create_access_justification(
  _target_org_id uuid,
  _reason text,
  _ticket_reference text,
  _duration_minutes integer DEFAULT 120,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _justification_id uuid;
  _admin_id uuid;
  _result jsonb;
BEGIN
  -- Check if caller is platform admin
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can create access justifications';
  END IF;

  _admin_id := auth.uid();

  -- Validate reason length
  IF char_length(_reason) < 20 THEN
    RAISE EXCEPTION 'Justification reason must be at least 20 characters';
  END IF;

  -- Create justification
  INSERT INTO platform_admin.access_justifications (
    admin_user_id,
    target_organization_id,
    reason,
    ticket_reference,
    approved_by,
    approved_at,
    expires_at,
    access_granted,
    ip_address,
    user_agent
  ) VALUES (
    _admin_id,
    _target_org_id,
    _reason,
    _ticket_reference,
    _admin_id, -- Self-approved for now, can add approval workflow later
    now(),
    now() + (_duration_minutes || ' minutes')::interval,
    true,
    _ip_address,
    _user_agent
  )
  RETURNING id INTO _justification_id;

  -- Log the justification creation
  PERFORM public.log_audit_event(
    _admin_id,
    _target_org_id,
    'access_justification_created',
    'access_justification',
    _justification_id,
    jsonb_build_object(
      'reason', _reason,
      'ticket_reference', _ticket_reference,
      'duration_minutes', _duration_minutes,
      'expires_at', now() + (_duration_minutes || ' minutes')::interval
    )
  );

  SELECT jsonb_build_object(
    'id', _justification_id,
    'expires_at', now() + (_duration_minutes || ' minutes')::interval,
    'organization_id', _target_org_id
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Function to revoke access justification
CREATE OR REPLACE FUNCTION public.revoke_access_justification(
  _justification_id uuid,
  _revoke_reason text DEFAULT 'Manually revoked'
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _admin_id uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can revoke access justifications';
  END IF;

  _admin_id := auth.uid();

  UPDATE platform_admin.access_justifications
  SET 
    revoked_at = now(),
    revoked_by = _admin_id,
    revoked_reason = _revoke_reason
  WHERE id = _justification_id
    AND admin_user_id = _admin_id
    AND revoked_at IS NULL;

  IF FOUND THEN
    PERFORM public.log_audit_event(
      _admin_id,
      (SELECT target_organization_id FROM platform_admin.access_justifications WHERE id = _justification_id),
      'access_justification_revoked',
      'access_justification',
      _justification_id,
      jsonb_build_object('revoke_reason', _revoke_reason)
    );
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function to get active access sessions
CREATE OR REPLACE FUNCTION public.get_active_access_sessions()
RETURNS TABLE(
  id uuid,
  admin_user_id uuid,
  admin_name text,
  admin_email text,
  target_organization_id uuid,
  org_name text,
  reason text,
  ticket_reference text,
  expires_at timestamptz,
  time_remaining interval,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view active access sessions';
  END IF;

  RETURN QUERY
  SELECT 
    aj.id,
    aj.admin_user_id,
    p.full_name as admin_name,
    p.email as admin_email,
    aj.target_organization_id,
    o.name as org_name,
    aj.reason,
    aj.ticket_reference,
    aj.expires_at,
    aj.expires_at - now() as time_remaining,
    aj.created_at
  FROM platform_admin.access_justifications aj
  LEFT JOIN public.profiles p ON p.id = aj.admin_user_id
  LEFT JOIN public.organizations o ON o.id = aj.target_organization_id
  WHERE aj.access_granted = true
    AND aj.expires_at > now()
    AND aj.revoked_at IS NULL
  ORDER BY aj.expires_at ASC;
END;
$$;

-- Enable RLS on access_justifications
ALTER TABLE platform_admin.access_justifications ENABLE ROW LEVEL SECURITY;

-- Policy: Platform admins can view all justifications (for auditing)
CREATE POLICY "platform_admins_view_all_justifications" ON platform_admin.access_justifications
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Migration: 20251108040251
-- Create admin access scopes table
CREATE TABLE platform_admin.admin_access_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('organization_subset', 'geography', 'tier', 'classification', 'all')),
  scope_value jsonb NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  description text
);

CREATE INDEX idx_admin_access_scopes_admin ON platform_admin.admin_access_scopes(admin_user_id);
CREATE INDEX idx_admin_access_scopes_type ON platform_admin.admin_access_scopes(scope_type);

-- Create emergency access log table
CREATE TABLE platform_admin.emergency_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users NOT NULL,
  target_organization_id uuid REFERENCES public.organizations,
  reason text NOT NULL CHECK (char_length(reason) >= 50),
  incident_ticket text NOT NULL,
  approved_by uuid REFERENCES auth.users,
  approved_at timestamptz,
  access_started_at timestamptz DEFAULT now(),
  access_ended_at timestamptz,
  actions_taken jsonb DEFAULT '[]'::jsonb,
  ip_address text,
  user_agent text,
  session_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_emergency_access_admin ON platform_admin.emergency_access_log(admin_user_id);
CREATE INDEX idx_emergency_access_org ON platform_admin.emergency_access_log(target_organization_id);

-- Function to check if admin has access scope for organization
CREATE OR REPLACE FUNCTION platform_admin.has_access_scope(
  _admin_id uuid,
  _org_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _has_unrestricted_scope boolean;
  _org_tier text;
  _org_region text;
BEGIN
  -- Check if admin has "all" scope (unrestricted access)
  SELECT EXISTS (
    SELECT 1 FROM platform_admin.admin_access_scopes
    WHERE admin_user_id = _admin_id
      AND scope_type = 'all'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO _has_unrestricted_scope;
  
  IF _has_unrestricted_scope THEN
    RETURN true;
  END IF;
  
  -- Check if admin has NO scopes defined (legacy admins get full access)
  IF NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_access_scopes
    WHERE admin_user_id = _admin_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Get organization details
  SELECT 
    oc.tier,
    oc.region
  INTO _org_tier, _org_region
  FROM public.organizations o
  LEFT JOIN platform_admin.organization_config oc ON oc.organization_id = o.id
  WHERE o.id = _org_id;
  
  -- Check organization_subset scope
  IF EXISTS (
    SELECT 1 FROM platform_admin.admin_access_scopes
    WHERE admin_user_id = _admin_id
      AND scope_type = 'organization_subset'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND scope_value ? _org_id::text
  ) THEN
    RETURN true;
  END IF;
  
  -- Check tier scope
  IF _org_tier IS NOT NULL AND EXISTS (
    SELECT 1 FROM platform_admin.admin_access_scopes
    WHERE admin_user_id = _admin_id
      AND scope_type = 'tier'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND scope_value ? _org_tier
  ) THEN
    RETURN true;
  END IF;
  
  -- Check geography scope
  IF _org_region IS NOT NULL AND EXISTS (
    SELECT 1 FROM platform_admin.admin_access_scopes
    WHERE admin_user_id = _admin_id
      AND scope_type = 'geography'
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND scope_value ? _org_region
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to create emergency access override
CREATE OR REPLACE FUNCTION public.create_emergency_access(
  _target_org_id uuid,
  _reason text,
  _incident_ticket text,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _emergency_id uuid;
  _admin_id uuid;
  _result jsonb;
BEGIN
  -- Check if caller is platform admin
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can create emergency access';
  END IF;

  _admin_id := auth.uid();

  -- Validate reason length (stricter for emergency access)
  IF char_length(_reason) < 50 THEN
    RAISE EXCEPTION 'Emergency access reason must be at least 50 characters';
  END IF;
  
  -- Validate incident ticket
  IF char_length(_incident_ticket) < 5 THEN
    RAISE EXCEPTION 'Valid incident ticket reference required';
  END IF;

  -- Create emergency access log
  INSERT INTO platform_admin.emergency_access_log (
    admin_user_id,
    target_organization_id,
    reason,
    incident_ticket,
    approved_by,
    approved_at,
    ip_address,
    user_agent
  ) VALUES (
    _admin_id,
    _target_org_id,
    _reason,
    _incident_ticket,
    _admin_id, -- Self-approved for now, can add approval workflow
    now(),
    _ip_address,
    _user_agent
  )
  RETURNING id INTO _emergency_id;

  -- Log as critical audit event
  PERFORM public.log_audit_event(
    _admin_id,
    _target_org_id,
    'emergency_access_granted',
    'emergency_access',
    _emergency_id,
    jsonb_build_object(
      'reason', _reason,
      'incident_ticket', _incident_ticket,
      'severity', 'CRITICAL',
      'ip_address', _ip_address
    )
  );

  SELECT jsonb_build_object(
    'id', _emergency_id,
    'expires_at', now() + interval '2 hours',
    'organization_id', _target_org_id
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Function to end emergency access session
CREATE OR REPLACE FUNCTION public.end_emergency_access(
  _emergency_id uuid,
  _actions_taken jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _admin_id uuid;
  _org_id uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can end emergency access';
  END IF;

  _admin_id := auth.uid();

  UPDATE platform_admin.emergency_access_log
  SET 
    access_ended_at = now(),
    actions_taken = _actions_taken
  WHERE id = _emergency_id
    AND admin_user_id = _admin_id
    AND access_ended_at IS NULL
  RETURNING target_organization_id INTO _org_id;

  IF FOUND THEN
    PERFORM public.log_audit_event(
      _admin_id,
      _org_id,
      'emergency_access_ended',
      'emergency_access',
      _emergency_id,
      jsonb_build_object(
        'actions_taken', _actions_taken,
        'duration_minutes', EXTRACT(EPOCH FROM (now() - (SELECT access_started_at FROM platform_admin.emergency_access_log WHERE id = _emergency_id)))/60
      )
    );
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function to manage admin access scopes
CREATE OR REPLACE FUNCTION public.manage_admin_scope(
  _operation text, -- 'create', 'update', 'delete'
  _scope_id uuid DEFAULT NULL,
  _target_admin_id uuid DEFAULT NULL,
  _scope_type text DEFAULT NULL,
  _scope_value jsonb DEFAULT NULL,
  _description text DEFAULT NULL,
  _expires_at timestamptz DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _result_id uuid;
  _admin_id uuid;
BEGIN
  -- Only platform admins can manage scopes
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can manage access scopes';
  END IF;

  _admin_id := auth.uid();

  IF _operation = 'create' THEN
    INSERT INTO platform_admin.admin_access_scopes (
      admin_user_id,
      scope_type,
      scope_value,
      description,
      expires_at,
      created_by
    ) VALUES (
      _target_admin_id,
      _scope_type,
      _scope_value,
      _description,
      _expires_at,
      _admin_id
    )
    RETURNING id INTO _result_id;
    
    PERFORM public.log_audit_event(
      _admin_id,
      NULL,
      'admin_scope_created',
      'admin_access_scope',
      _result_id,
      jsonb_build_object(
        'target_admin_id', _target_admin_id,
        'scope_type', _scope_type,
        'scope_value', _scope_value
      )
    );
    
  ELSIF _operation = 'update' THEN
    UPDATE platform_admin.admin_access_scopes
    SET
      is_active = COALESCE(_scope_value->>'is_active', is_active::text)::boolean,
      description = COALESCE(_description, description),
      expires_at = COALESCE(_expires_at, expires_at),
      updated_at = now()
    WHERE id = _scope_id
    RETURNING id INTO _result_id;
    
  ELSIF _operation = 'delete' THEN
    UPDATE platform_admin.admin_access_scopes
    SET is_active = false, updated_at = now()
    WHERE id = _scope_id
    RETURNING id INTO _result_id;
    
    PERFORM public.log_audit_event(
      _admin_id,
      NULL,
      'admin_scope_deleted',
      'admin_access_scope',
      _result_id,
      jsonb_build_object('scope_id', _scope_id)
    );
  END IF;

  RETURN jsonb_build_object('id', _result_id, 'operation', _operation);
END;
$$;

-- Function to get admin scopes
CREATE OR REPLACE FUNCTION public.get_admin_scopes(_admin_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  admin_user_id uuid,
  admin_name text,
  admin_email text,
  scope_type text,
  scope_value jsonb,
  description text,
  is_active boolean,
  expires_at timestamptz,
  created_at timestamptz,
  created_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view access scopes';
  END IF;

  RETURN QUERY
  SELECT 
    s.id,
    s.admin_user_id,
    p.full_name as admin_name,
    p.email as admin_email,
    s.scope_type,
    s.scope_value,
    s.description,
    s.is_active,
    s.expires_at,
    s.created_at,
    cp.full_name as created_by_name
  FROM platform_admin.admin_access_scopes s
  LEFT JOIN public.profiles p ON p.id = s.admin_user_id
  LEFT JOIN public.profiles cp ON cp.id = s.created_by
  WHERE (_admin_id IS NULL OR s.admin_user_id = _admin_id)
  ORDER BY s.created_at DESC;
END;
$$;

-- Function to get emergency access history
CREATE OR REPLACE FUNCTION public.get_emergency_access_log(
  _limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  admin_user_id uuid,
  admin_name text,
  admin_email text,
  target_organization_id uuid,
  org_name text,
  reason text,
  incident_ticket text,
  access_started_at timestamptz,
  access_ended_at timestamptz,
  duration_minutes numeric,
  actions_taken jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view emergency access logs';
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.admin_user_id,
    p.full_name as admin_name,
    p.email as admin_email,
    e.target_organization_id,
    o.name as org_name,
    e.reason,
    e.incident_ticket,
    e.access_started_at,
    e.access_ended_at,
    CASE 
      WHEN e.access_ended_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (e.access_ended_at - e.access_started_at))/60
      ELSE NULL
    END as duration_minutes,
    e.actions_taken,
    e.created_at
  FROM platform_admin.emergency_access_log e
  LEFT JOIN public.profiles p ON p.id = e.admin_user_id
  LEFT JOIN public.organizations o ON o.id = e.target_organization_id
  ORDER BY e.created_at DESC
  LIMIT _limit;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE platform_admin.admin_access_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.emergency_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_access_scopes
CREATE POLICY "platform_admins_view_scopes" ON platform_admin.admin_access_scopes
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admins_manage_scopes" ON platform_admin.admin_access_scopes
  FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- RLS Policies for emergency_access_log
CREATE POLICY "platform_admins_view_emergency_log" ON platform_admin.emergency_access_log
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admins_create_emergency_log" ON platform_admin.emergency_access_log
  FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform_admins_update_emergency_log" ON platform_admin.emergency_access_log
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

-- Migration: 20251108042012
-- Create app versions table for tracking app releases
CREATE TABLE IF NOT EXISTS platform_admin.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  release_notes TEXT,
  changelog JSONB DEFAULT '[]'::jsonb,
  release_type TEXT NOT NULL CHECK (release_type IN ('major', 'minor', 'patch', 'hotfix')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'stable', 'deprecated')),
  breaking_changes BOOLEAN DEFAULT false,
  dependencies JSONB DEFAULT '{}'::jsonb,
  min_platform_version TEXT,
  released_by UUID REFERENCES auth.users(id),
  released_at TIMESTAMP WITH TIME ZONE,
  deprecated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(app_id, version_number)
);

-- Create app deployments tracking table
CREATE TABLE IF NOT EXISTS platform_admin.app_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  version_id UUID REFERENCES platform_admin.app_versions(id),
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('initial', 'update', 'rollback', 'hotfix')),
  target_orgs JSONB, -- null = all orgs, or array of org IDs
  deployment_status TEXT NOT NULL DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  deployed_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  rollback_version_id UUID REFERENCES platform_admin.app_versions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create app usage analytics table
CREATE TABLE IF NOT EXISTS platform_admin.app_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_users INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_session_duration_minutes NUMERIC(10,2),
  error_count INTEGER DEFAULT 0,
  feature_usage JSONB DEFAULT '{}'::jsonb,
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(app_id, organization_id, date)
);

-- Create app feature flags table
CREATE TABLE IF NOT EXISTS platform_admin.app_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_orgs JSONB, -- null = all orgs, or array of org IDs
  target_roles JSONB, -- null = all roles, or array of roles
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(app_id, flag_key)
);

-- Create app health status table
CREATE TABLE IF NOT EXISTS platform_admin.app_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'critical', 'offline')),
  uptime_percentage NUMERIC(5,2),
  avg_response_time_ms INTEGER,
  error_rate NUMERIC(5,2),
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(app_id, organization_id)
);

-- Enable RLS
ALTER TABLE platform_admin.app_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.app_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.app_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.app_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.app_health_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Platform admins only
CREATE POLICY "Platform admins can view app versions"
  ON platform_admin.app_versions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage app versions"
  ON platform_admin.app_versions FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view deployments"
  ON platform_admin.app_deployments FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage deployments"
  ON platform_admin.app_deployments FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view analytics"
  ON platform_admin.app_usage_analytics FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage analytics"
  ON platform_admin.app_usage_analytics FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view feature flags"
  ON platform_admin.app_feature_flags FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage feature flags"
  ON platform_admin.app_feature_flags FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view health status"
  ON platform_admin.app_health_status FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage health status"
  ON platform_admin.app_health_status FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Functions for app management
CREATE OR REPLACE FUNCTION public.deploy_app(
  _app_id UUID,
  _version_id UUID,
  _deployment_type TEXT,
  _target_orgs JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _deployment_id UUID;
  _admin_id UUID;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can deploy apps';
  END IF;

  _admin_id := auth.uid();

  INSERT INTO platform_admin.app_deployments (
    app_id,
    version_id,
    deployment_type,
    target_orgs,
    deployment_status,
    deployed_by
  ) VALUES (
    _app_id,
    _version_id,
    _deployment_type,
    _target_orgs,
    'pending',
    _admin_id
  )
  RETURNING id INTO _deployment_id;

  PERFORM public.log_audit_event(
    _admin_id,
    NULL,
    'app_deployment_initiated',
    'app_deployment',
    _deployment_id,
    jsonb_build_object(
      'app_id', _app_id,
      'version_id', _version_id,
      'deployment_type', _deployment_type,
      'target_orgs', _target_orgs
    )
  );

  RETURN jsonb_build_object(
    'deployment_id', _deployment_id,
    'status', 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_app_usage_summary(
  _app_id UUID DEFAULT NULL,
  _days_back INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _result JSONB;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view app usage';
  END IF;

  SELECT jsonb_build_object(
    'total_organizations', COUNT(DISTINCT organization_id),
    'total_active_users', SUM(active_users),
    'total_sessions', SUM(total_sessions),
    'avg_session_duration', AVG(avg_session_duration_minutes),
    'total_errors', SUM(error_count),
    'daily_trends', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date,
          'active_users', active_users,
          'sessions', sessions,
          'errors', errors
        ) ORDER BY date DESC
      )
      FROM (
        SELECT 
          date,
          SUM(active_users) as active_users,
          SUM(total_sessions) as sessions,
          SUM(error_count) as errors
        FROM platform_admin.app_usage_analytics
        WHERE (_app_id IS NULL OR app_id = _app_id)
          AND date >= CURRENT_DATE - _days_back
        GROUP BY date
        ORDER BY date DESC
        LIMIT 30
      ) daily
    ),
    'top_organizations', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'organization_id', organization_id,
          'organization_name', o.name,
          'active_users', total_users,
          'sessions', total_sessions
        ) ORDER BY total_users DESC
      )
      FROM (
        SELECT 
          a.organization_id,
          SUM(a.active_users) as total_users,
          SUM(a.total_sessions) as total_sessions
        FROM platform_admin.app_usage_analytics a
        WHERE (_app_id IS NULL OR a.app_id = _app_id)
          AND a.date >= CURRENT_DATE - _days_back
        GROUP BY a.organization_id
        ORDER BY total_users DESC
        LIMIT 10
      ) top_orgs
      LEFT JOIN public.organizations o ON o.id = top_orgs.organization_id
    )
  ) INTO _result
  FROM platform_admin.app_usage_analytics
  WHERE (_app_id IS NULL OR app_id = _app_id)
    AND date >= CURRENT_DATE - _days_back;

  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_app_health_overview()
RETURNS TABLE(
  app_id UUID,
  app_name TEXT,
  total_orgs INTEGER,
  healthy_orgs INTEGER,
  degraded_orgs INTEGER,
  critical_orgs INTEGER,
  offline_orgs INTEGER,
  avg_uptime NUMERIC,
  avg_response_time INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can view app health';
  END IF;

  RETURN QUERY
  SELECT 
    a.id as app_id,
    a.name as app_name,
    COUNT(DISTINCT h.organization_id)::INTEGER as total_orgs,
    COUNT(*) FILTER (WHERE h.status = 'healthy')::INTEGER as healthy_orgs,
    COUNT(*) FILTER (WHERE h.status = 'degraded')::INTEGER as degraded_orgs,
    COUNT(*) FILTER (WHERE h.status = 'critical')::INTEGER as critical_orgs,
    COUNT(*) FILTER (WHERE h.status = 'offline')::INTEGER as offline_orgs,
    AVG(h.uptime_percentage) as avg_uptime,
    AVG(h.avg_response_time_ms)::INTEGER as avg_response_time
  FROM public.apps a
  LEFT JOIN platform_admin.app_health_status h ON h.app_id = a.id
  WHERE a.is_active = true
  GROUP BY a.id, a.name
  ORDER BY a.name;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_app_versions_app_id ON platform_admin.app_versions(app_id);
CREATE INDEX idx_app_versions_status ON platform_admin.app_versions(status);
CREATE INDEX idx_app_deployments_app_id ON platform_admin.app_deployments(app_id);
CREATE INDEX idx_app_deployments_status ON platform_admin.app_deployments(deployment_status);
CREATE INDEX idx_app_usage_analytics_date ON platform_admin.app_usage_analytics(date DESC);
CREATE INDEX idx_app_usage_analytics_app_org ON platform_admin.app_usage_analytics(app_id, organization_id);
CREATE INDEX idx_app_health_status_app_id ON platform_admin.app_health_status(app_id);
CREATE INDEX idx_app_health_status_status ON platform_admin.app_health_status(status);
