-- Fix complete_firm_administrator_signup to remove firm_type enum cast
-- The firms table uses TEXT with CHECK constraint, not an enum
-- Also reorder parameters: required first, then optional with defaults

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
  p_specializations TEXT[] DEFAULT NULL,
  p_partner_count INTEGER DEFAULT NULL,
  p_staff_count INTEGER DEFAULT NULL,
  p_practicing_since INTEGER DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
BEGIN
  -- Create firm
  INSERT INTO public.firms (
    name,
    firm_type,
    specializations,
    partner_count,
    staff_count,
    practicing_since,
    primary_contact_name,
    primary_contact_email,
    primary_contact_phone,
    billing_address,
    plan_type,
    is_active
  ) VALUES (
    p_firm_name,
    p_firm_type,  -- Removed ::firm_type cast - just use TEXT
    p_specializations,
    p_partner_count,
    p_staff_count,
    p_practicing_since,
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
    job_title = p_job_title,
    phone = p_phone,
    updated_at = now()
  WHERE id = p_user_id;

  -- Assign firm_administrator role
  INSERT INTO public.user_roles (user_id, firm_id, role)
  VALUES (p_user_id, v_firm_id, 'firm_administrator');

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
$$;
