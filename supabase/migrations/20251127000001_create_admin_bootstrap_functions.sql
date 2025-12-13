-- Platform Admin Bootstrap Functions
-- Required for admin-bootstrap edge function
-- Created: 2025-11-27

-- Create platform_admin schema if not exists
CREATE SCHEMA IF NOT EXISTS platform_admin;

-- Create admin_users table if not exists
CREATE TABLE IF NOT EXISTS platform_admin.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_admin.admin_users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON platform_admin.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON platform_admin.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON platform_admin.admin_users(is_active) WHERE is_active = TRUE;

-- Function 1: Get platform admin count
CREATE OR REPLACE FUNCTION get_platform_admin_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM platform_admin.admin_users
  WHERE is_active = TRUE;

  RETURN admin_count;
END;
$$;

-- Function 2: Check if bootstrap is needed
CREATE OR REPLACE FUNCTION check_admin_bootstrap_needed()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_users WHERE is_active = TRUE LIMIT 1
  );
END;
$$;

-- Function 3: Create platform admin user
CREATE OR REPLACE FUNCTION create_platform_admin_user(
  _email TEXT,
  _username TEXT,
  _full_name TEXT,
  _password_hash TEXT
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_admin_id UUID;
BEGIN
  -- Insert the admin user
  INSERT INTO platform_admin.admin_users (email, username, full_name, password_hash, is_active)
  VALUES (_email, _username, _full_name, _password_hash, TRUE)
  RETURNING admin_users.id INTO new_admin_id;

  -- Return the created user
  RETURN QUERY
  SELECT
    admin_users.id,
    admin_users.email,
    admin_users.username,
    admin_users.full_name
  FROM platform_admin.admin_users
  WHERE admin_users.id = new_admin_id;
END;
$$;

-- Function 4: Assign platform admin role (for compatibility with platform_admins table if it exists)
CREATE OR REPLACE FUNCTION assign_platform_admin_role(
  _user_id UUID,
  _assigned_by UUID,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if platform_admins table exists (legacy compatibility)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'platform_admins') THEN
    -- Insert into platform_admins if table exists
    INSERT INTO platform_admins (user_id, role, can_impersonate, can_manage_billing, metadata)
    VALUES (_user_id, 'super_admin', TRUE, TRUE, _metadata)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Log the assignment (we can add audit logging here later)
  RAISE NOTICE 'Platform admin role assigned to user %', _user_id;
END;
$$;

-- Add comments
COMMENT ON FUNCTION get_platform_admin_count() IS 'Returns count of active platform admin users';
COMMENT ON FUNCTION check_admin_bootstrap_needed() IS 'Returns TRUE if no active admin users exist (bootstrap needed)';
COMMENT ON FUNCTION create_platform_admin_user(TEXT, TEXT, TEXT, TEXT) IS 'Creates a new platform admin user during bootstrap';
COMMENT ON FUNCTION assign_platform_admin_role(UUID, UUID, JSONB) IS 'Assigns platform admin role (legacy compatibility)';
