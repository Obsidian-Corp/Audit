-- Create function to assign platform admin role
-- This inserts into platform_admin.admin_roles table
CREATE OR REPLACE FUNCTION public.assign_platform_admin_role(
  _user_id UUID,
  _assigned_by UUID DEFAULT NULL,
  _expires_at TIMESTAMPTZ DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
DECLARE
  _role_id UUID;
BEGIN
  -- Insert into platform_admin.admin_roles
  INSERT INTO platform_admin.admin_roles (
    user_id,
    role,
    assigned_by,
    expires_at,
    metadata
  ) VALUES (
    _user_id,
    'platform_admin',
    COALESCE(_assigned_by, _user_id),
    _expires_at,
    _metadata
  )
  RETURNING id INTO _role_id;
  
  RETURN _role_id;
END;
$$;

-- Update the bootstrap RLS policy to check platform_admin.admin_roles
DROP POLICY IF EXISTS "Allow bootstrap of first platform admin" ON public.user_roles;

CREATE POLICY "Allow bootstrap of first platform admin via function"
ON platform_admin.admin_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if this is the first platform admin (no existing platform admins)
  NOT EXISTS (
    SELECT 1 
    FROM platform_admin.admin_roles 
    WHERE role = 'platform_admin'
  )
  AND role = 'platform_admin'
  AND user_id = auth.uid()
);