-- Create platform admin users table (separate from auth.users)
CREATE TABLE IF NOT EXISTS platform_admin.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  certificate_required BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin certificates table for certificate-based auth
CREATE TABLE IF NOT EXISTS platform_admin.admin_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES platform_admin.admin_users(id) ON DELETE CASCADE,
  certificate_fingerprint TEXT UNIQUE NOT NULL,
  certificate_subject TEXT NOT NULL,
  certificate_issuer TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Update admin_sessions to reference admin_users instead of auth.users
ALTER TABLE platform_admin.admin_sessions 
  DROP CONSTRAINT IF EXISTS admin_sessions_user_id_fkey;

-- Add new column for admin_user_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'platform_admin' 
                 AND table_name = 'admin_sessions' 
                 AND column_name = 'admin_user_id') THEN
    ALTER TABLE platform_admin.admin_sessions 
      ADD COLUMN admin_user_id UUID REFERENCES platform_admin.admin_users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create admin refresh tokens table
CREATE TABLE IF NOT EXISTS platform_admin.admin_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES platform_admin.admin_users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON platform_admin.admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON platform_admin.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_certificates_fingerprint ON platform_admin.admin_certificates(certificate_fingerprint);
CREATE INDEX IF NOT EXISTS idx_admin_certificates_user_id ON platform_admin.admin_certificates(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_user_id ON platform_admin.admin_refresh_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_refresh_tokens_token_hash ON platform_admin.admin_refresh_tokens(token_hash);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION platform_admin.update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON platform_admin.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON platform_admin.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION platform_admin.update_admin_updated_at();

-- Enable RLS
ALTER TABLE platform_admin.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.admin_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.admin_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (only accessible via service role)
CREATE POLICY "Service role only for admin_users" ON platform_admin.admin_users
  FOR ALL USING (false);

CREATE POLICY "Service role only for admin_certificates" ON platform_admin.admin_certificates
  FOR ALL USING (false);

CREATE POLICY "Service role only for admin_refresh_tokens" ON platform_admin.admin_refresh_tokens
  FOR ALL USING (false);