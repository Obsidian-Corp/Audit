-- Create table to track admin migration status
CREATE TABLE IF NOT EXISTS platform_admin.admin_migration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  migration_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  migrated BOOLEAN DEFAULT false,
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_migration_tokens_token ON platform_admin.admin_migration_tokens(migration_token);
CREATE INDEX IF NOT EXISTS idx_admin_migration_tokens_email ON platform_admin.admin_migration_tokens(email);

-- Function to generate migration tokens for existing admins
CREATE OR REPLACE FUNCTION public.generate_admin_migration_tokens()
RETURNS TABLE(
  email TEXT,
  full_name TEXT,
  migration_token TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public', 'auth'
AS $function$
BEGIN
  -- Only platform admins can run this
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can generate migration tokens';
  END IF;

  -- Find all users with platform_admin role in the old system
  RETURN QUERY
  INSERT INTO platform_admin.admin_migration_tokens (
    old_user_id,
    email,
    full_name,
    migration_token,
    expires_at
  )
  SELECT 
    ar.user_id,
    p.email,
    p.full_name,
    encode(gen_random_bytes(32), 'hex'),
    now() + interval '7 days'
  FROM platform_admin.admin_roles ar
  JOIN public.profiles p ON p.id = ar.user_id
  WHERE ar.role = 'platform_admin'
    AND (ar.expires_at IS NULL OR ar.expires_at > now())
    AND NOT EXISTS (
      SELECT 1 FROM platform_admin.admin_users au 
      WHERE au.email = p.email
    )
    AND NOT EXISTS (
      SELECT 1 FROM platform_admin.admin_migration_tokens amt
      WHERE amt.old_user_id = ar.user_id AND amt.migrated = false
    )
  RETURNING 
    admin_migration_tokens.email,
    admin_migration_tokens.full_name,
    admin_migration_tokens.migration_token,
    admin_migration_tokens.expires_at;
END;
$function$;

-- Function to complete admin migration
CREATE OR REPLACE FUNCTION public.complete_admin_migration(
  _migration_token TEXT,
  _new_password_hash TEXT,
  _username TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $function$
DECLARE
  _token_record RECORD;
  _new_admin_id UUID;
BEGIN
  -- Find migration token
  SELECT * INTO _token_record
  FROM platform_admin.admin_migration_tokens
  WHERE migration_token = _migration_token
    AND migrated = false
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired migration token';
  END IF;

  -- Create new admin user
  INSERT INTO platform_admin.admin_users (
    email,
    username,
    password_hash,
    full_name,
    is_active,
    mfa_enabled
  ) VALUES (
    _token_record.email,
    _username,
    _new_password_hash,
    _token_record.full_name,
    true,
    false -- Will be forced to enable on first login
  )
  RETURNING id INTO _new_admin_id;

  -- Mark token as migrated
  UPDATE platform_admin.admin_migration_tokens
  SET 
    migrated = true,
    migrated_at = now()
  WHERE migration_token = _migration_token;

  -- Assign platform admin role (for legacy compatibility)
  PERFORM public.assign_platform_admin_role(
    _new_admin_id,
    _new_admin_id,
    NULL,
    jsonb_build_object(
      'migrated_from', _token_record.old_user_id,
      'migration_date', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'admin_id', _new_admin_id,
    'email', _token_record.email
  );
END;
$function$;

-- Enable RLS
ALTER TABLE platform_admin.admin_migration_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy (only accessible via service role through edge functions)
CREATE POLICY "Service role only for admin_migration_tokens" ON platform_admin.admin_migration_tokens
  FOR ALL USING (false);