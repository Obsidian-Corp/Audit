-- Fix role insertion table mismatch
-- The complete_firm_administrator_signup function was inserting into firm_roles
-- but AuthContext queries from user_roles

-- Step 1: Migrate any existing roles from firm_roles to user_roles (if firm_roles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'firm_roles') THEN
    -- Copy roles from firm_roles to user_roles, avoiding duplicates
    INSERT INTO public.user_roles (user_id, firm_id, role)
    SELECT user_id, firm_id, role
    FROM public.firm_roles
    ON CONFLICT (user_id, firm_id, role) DO NOTHING;

    RAISE NOTICE 'Migrated roles from firm_roles to user_roles';
  END IF;
END $$;

-- Step 2: Update the complete_firm_administrator_signup function to use user_roles
CREATE OR REPLACE FUNCTION public.complete_firm_administrator_signup(
  -- Required parameters first
  p_user_id UUID,
  p_firm_name TEXT,
  p_firm_type TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  -- Optional parameters with defaults
  p_job_title TEXT DEFAULT 'Managing Partner',
  p_country TEXT DEFAULT '',
  p_city TEXT DEFAULT '',
  p_specializations TEXT[] DEFAULT '{}',
  p_partner_count INTEGER DEFAULT 1,
  p_staff_count INTEGER DEFAULT 1,
  p_practicing_since INTEGER DEFAULT NULL,
  p_phone TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_firm_id UUID;
BEGIN
  -- Create the firm
  INSERT INTO public.firms (
    name,
    firm_type,
    specializations,
    partner_count,
    staff_count,
    practicing_since,
    primary_contact,
    contact_email,
    contact_phone,
    location,
    subscription_tier,
    is_active
  ) VALUES (
    p_firm_name,
    p_firm_type,
    p_specializations,
    p_partner_count,
    p_staff_count,
    CASE
      WHEN p_practicing_since IS NOT NULL
      THEN make_date(p_practicing_since, 1, 1)
      ELSE NULL
    END,
    p_first_name || ' ' || p_last_name,
    p_email,
    p_phone,
    jsonb_build_object(
      'city', p_city,
      'country', p_country
    ),
    'professional',
    true
  )
  RETURNING id INTO v_firm_id;

  -- Update the user's profile
  UPDATE public.profiles
  SET
    firm_id = v_firm_id,
    first_name = p_first_name,
    last_name = p_last_name,
    title = p_job_title,
    phone = p_phone,
    updated_at = now()
  WHERE id = p_user_id;

  -- Assign firm_administrator role to USER_ROLES table (not firm_roles)
  INSERT INTO public.user_roles (user_id, firm_id, role)
  VALUES (p_user_id, v_firm_id, 'firm_administrator')
  ON CONFLICT (user_id, firm_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'firm_id', v_firm_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$function$;

COMMENT ON FUNCTION public.complete_firm_administrator_signup(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], INTEGER, INTEGER, INTEGER, TEXT) IS 'Fixed to insert role into user_roles table instead of firm_roles';
