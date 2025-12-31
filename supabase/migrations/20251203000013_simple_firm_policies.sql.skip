-- SIMPLEST POSSIBLE POLICIES - Just firm membership, nothing else
-- If you're in the firm, you can do anything with that firm's data

BEGIN;

-- Drop ALL existing policies on all tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
  RAISE NOTICE '✓ Dropped all existing policies';
END $$;

-- Create simple policies for all tables with firm_id
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'firm_id'
    AND table_name NOT IN ('firms')
  LOOP
    -- One simple SELECT policy
    EXECUTE format('
      CREATE POLICY %I ON %I
      FOR ALL TO authenticated
      USING (firm_id IN (SELECT public.user_firms()))
      WITH CHECK (firm_id IN (SELECT public.user_firms()))
    ', tbl.table_name || '_policy', tbl.table_name);

    RAISE NOTICE '✓ Created simple policy for: %', tbl.table_name;
  END LOOP;
END $$;

-- Profiles - can see all in firm, can update own
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- User roles - can see all in firm
CREATE POLICY "user_roles_policy" ON user_roles
  FOR ALL TO authenticated
  USING (firm_id IN (SELECT public.user_firms()))
  WITH CHECK (firm_id IN (SELECT public.user_firms()));

-- Firms - can only see your own firm
CREATE POLICY "firms_policy" ON firms
  FOR ALL TO authenticated
  USING (id IN (SELECT public.user_firms()))
  WITH CHECK (id IN (SELECT public.user_firms()));

-- Ensure all users have a firm and a role
DO $$
DECLARE
  profile_record RECORD;
  default_firm_id UUID;
BEGIN
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  FOR profile_record IN
    SELECT p.id, p.email, p.firm_id
    FROM profiles p
  LOOP
    -- Ensure firm_id
    IF profile_record.firm_id IS NULL THEN
      UPDATE profiles
      SET firm_id = default_firm_id
      WHERE id = profile_record.id;
    END IF;

    -- Ensure role
    INSERT INTO user_roles (user_id, firm_id, role)
    VALUES (profile_record.id, COALESCE(profile_record.firm_id, default_firm_id), 'firm_administrator'::app_role)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ ALL DONE - Simple policies applied';
END $$;

COMMIT;
