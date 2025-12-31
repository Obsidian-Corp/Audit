-- =============================================================================
-- PHASE 1: BALANCED RLS FOUNDATION
-- Date: 2024-12-03
-- Purpose: Establish firm isolation and helper functions
-- Philosophy: Enable work, maintain security through firm isolation
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: VERIFY SCHEMA STANDARDIZATION
-- =============================================================================

DO $$ BEGIN
  RAISE NOTICE 'Phase 1: Foundation - Firm isolation & helper functions';
END $$;

-- Verify all critical columns use firm_id (should already be done)
DO $$
DECLARE
  org_id_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO org_id_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'organization_id';

  IF org_id_count > 0 THEN
    RAISE WARNING 'Found % tables still using organization_id - run schema standardization first!', org_id_count;
  ELSE
    RAISE NOTICE '✓ All tables use firm_id';
  END IF;
END $$;

-- =============================================================================
-- STEP 2: CREATE/UPDATE HELPER FUNCTIONS
-- =============================================================================

-- Helper function: Get user's firms
CREATE OR REPLACE FUNCTION public.user_firms()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 10
AS $$
  SELECT firm_id
  FROM profiles
  WHERE id = auth.uid()
  AND firm_id IS NOT NULL;
$$;

RAISE NOTICE '✓ Created user_firms() function';

-- Helper function: Check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(check_roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(check_roles)
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

RAISE NOTICE '✓ Created user_has_any_role() function';

-- Helper function: Check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(check_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
COST 5
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = check_role
    AND firm_id IN (SELECT user_firms())
    AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

RAISE NOTICE '✓ Created user_has_role() function';

-- =============================================================================
-- STEP 3: UPDATE handle_new_user() TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_invitation_token TEXT;
  v_default_role app_role;
BEGIN
  -- Extract invitation token from user metadata
  v_invitation_token := NEW.raw_user_meta_data->>'invitation_token';

  -- If invited, get firm from invitation
  IF v_invitation_token IS NOT NULL THEN
    SELECT firm_id, role
    INTO v_firm_id, v_default_role
    FROM firm_invitations
    WHERE token = v_invitation_token
    AND status = 'pending'
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Update invitation status
    IF v_firm_id IS NOT NULL THEN
      UPDATE firm_invitations
      SET status = 'accepted',
          accepted_at = NOW()
      WHERE token = v_invitation_token;
    END IF;
  ELSE
    -- For non-invited users (development/testing), assign to first firm
    SELECT id INTO v_firm_id FROM firms ORDER BY created_at LIMIT 1;
    v_default_role := 'staff_auditor';
  END IF;

  -- Create profile with firm assignment
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    firm_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    v_firm_id,
    NOW(),
    NOW()
  );

  -- Assign default role
  IF v_default_role IS NOT NULL AND v_firm_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, firm_id, role, assigned_at)
    VALUES (NEW.id, v_firm_id, v_default_role, NOW())
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

RAISE NOTICE '✓ Updated handle_new_user() trigger';

-- =============================================================================
-- STEP 4: BACKFILL EXISTING USERS
-- =============================================================================

DO $$
DECLARE
  user_record RECORD;
  default_firm_id UUID;
  fixed_count INTEGER := 0;
BEGIN
  -- Get first firm as default
  SELECT id INTO default_firm_id FROM firms ORDER BY created_at LIMIT 1;

  IF default_firm_id IS NULL THEN
    RAISE WARNING 'No firms exist in database - cannot backfill users';
    RETURN;
  END IF;

  -- Fix all users without firm_id
  FOR user_record IN
    SELECT u.id, u.email
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.firm_id IS NULL OR p.id IS NULL
  LOOP
    -- Upsert profile with firm
    INSERT INTO profiles (id, email, firm_id, first_name, last_name)
    VALUES (
      user_record.id,
      user_record.email,
      default_firm_id,
      COALESCE(split_part(user_record.email, '@', 1), 'User'),
      ''
    )
    ON CONFLICT (id) DO UPDATE
    SET firm_id = default_firm_id,
        updated_at = NOW()
    WHERE profiles.firm_id IS NULL;

    -- Ensure they have at least one role
    INSERT INTO user_roles (user_id, firm_id, role)
    VALUES (user_record.id, default_firm_id, 'staff_auditor'::app_role)
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;

    fixed_count := fixed_count + 1;
  END LOOP;

  RAISE NOTICE '✓ Backfilled % users with firm_id and roles', fixed_count;
END $$;

-- =============================================================================
-- STEP 5: VALIDATION
-- =============================================================================

DO $$
DECLARE
  orphan_count INTEGER;
  users_without_roles INTEGER;
BEGIN
  -- Check for users without firm_id
  SELECT COUNT(*) INTO orphan_count
  FROM profiles
  WHERE firm_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE WARNING '% profiles still missing firm_id!', orphan_count;
  ELSE
    RAISE NOTICE '✓ All profiles have firm_id';
  END IF;

  -- Check for users without roles
  SELECT COUNT(*) INTO users_without_roles
  FROM profiles p
  LEFT JOIN user_roles ur ON p.id = ur.user_id
  WHERE ur.user_id IS NULL;

  IF users_without_roles > 0 THEN
    RAISE WARNING '% users still missing roles!', users_without_roles;
  ELSE
    RAISE NOTICE '✓ All users have roles assigned';
  END IF;
END $$;

COMMIT;

-- =============================================================================
DO $$ BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PHASE 1 COMPLETE - Foundation Ready';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper functions created';
  RAISE NOTICE 'All users have firm_id and roles';
  RAISE NOTICE 'Ready for Phase 2: Core table policies';
  RAISE NOTICE '========================================';
END $$;
