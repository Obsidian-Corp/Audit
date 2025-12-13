-- Multi-Tenant Architecture Support
-- Phase 1-4: Full enterprise subdomain and custom domain support
-- Created: 2025-11-27

-- Add multi-tenant columns to firms table
ALTER TABLE firms ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#0066CC';
ALTER TABLE firms ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE firms ADD COLUMN IF NOT EXISTS plan_type TEXT CHECK (plan_type IN ('trial', 'starter', 'professional', 'enterprise')) DEFAULT 'trial';

-- Create index on slug for fast subdomain lookup
CREATE INDEX IF NOT EXISTS idx_firms_slug ON firms(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_firms_custom_domain ON firms(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_firms_active ON firms(is_active) WHERE is_active = TRUE;

-- Function to generate slug from firm name
CREATE OR REPLACE FUNCTION generate_firm_slug(firm_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  -- Convert to lowercase, replace spaces/special chars with hyphens
  base_slug := lower(regexp_replace(firm_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Limit length
  base_slug := substring(base_slug from 1 for 50);

  final_slug := base_slug;

  -- Check for conflicts and add counter if needed
  WHILE EXISTS (SELECT 1 FROM firms WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION auto_generate_firm_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_firm_slug(NEW.name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_generate_firm_slug ON firms;
CREATE TRIGGER trigger_auto_generate_firm_slug
  BEFORE INSERT OR UPDATE ON firms
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_firm_slug();

-- Generate slugs for existing firms (backfill)
UPDATE firms
SET slug = generate_firm_slug(name)
WHERE slug IS NULL;

-- Create domain_mappings table for tracking custom domains
CREATE TABLE IF NOT EXISTS domain_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  domain_type TEXT CHECK (domain_type IN ('app', 'client_portal')) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  ssl_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(firm_id, domain_type)
);

CREATE INDEX idx_domain_mappings_firm ON domain_mappings(firm_id);
CREATE INDEX idx_domain_mappings_domain ON domain_mappings(domain);
CREATE INDEX idx_domain_mappings_verified ON domain_mappings(is_verified) WHERE is_verified = TRUE;

-- RLS for domain_mappings
ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage domain mappings"
  ON domain_mappings FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Function to get firm by domain (subdomain or custom)
CREATE OR REPLACE FUNCTION get_firm_by_domain(hostname TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  custom_domain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  is_active BOOLEAN,
  plan_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subdomain TEXT;
  firm_slug TEXT;
BEGIN
  -- First, check if it's a custom domain
  RETURN QUERY
  SELECT f.id, f.name, f.slug, f.custom_domain, f.logo_url, f.primary_color, f.is_active, f.plan_type
  FROM firms f
  INNER JOIN domain_mappings dm ON f.id = dm.firm_id
  WHERE dm.domain = hostname
    AND dm.is_verified = TRUE
    AND f.is_active = TRUE
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- If not custom domain, extract subdomain
  -- Format: app.firmslug.obsidian-corp.com or clients.firmslug.obsidian-corp.com
  subdomain := split_part(hostname, '.', 1);
  firm_slug := split_part(hostname, '.', 2);

  -- Check if subdomain is 'app' or 'clients'
  IF subdomain IN ('app', 'clients') THEN
    RETURN QUERY
    SELECT f.id, f.name, f.slug, f.custom_domain, f.logo_url, f.primary_color, f.is_active, f.plan_type
    FROM firms f
    WHERE f.slug = firm_slug
      AND f.is_active = TRUE
    LIMIT 1;
  END IF;

  RETURN;
END;
$$;

-- Add comments for documentation
COMMENT ON COLUMN firms.slug IS 'URL-safe identifier for subdomain routing (e.g., "deloitte" for app.deloitte.obsidian-corp.com)';
COMMENT ON COLUMN firms.custom_domain IS 'Custom domain for white-labeling (e.g., "audit.deloitte.com")';
COMMENT ON COLUMN firms.logo_url IS 'URL to firm logo for branding';
COMMENT ON COLUMN firms.primary_color IS 'Primary brand color in hex format';
COMMENT ON TABLE domain_mappings IS 'Tracks custom domain mappings for firms (Phase 4 enterprise feature)';
