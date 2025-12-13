-- Create secure function for firm administrator signup
-- This function creates the firm, assigns the user as firm_administrator, and updates their profile
-- It runs with SECURITY DEFINER to bypass RLS policies

CREATE OR REPLACE FUNCTION public.complete_firm_administrator_signup(
  p_user_id UUID,
  p_firm_name TEXT,
  p_firm_type TEXT,
  p_country TEXT,
  p_city TEXT,
  p_specializations TEXT[],
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_job_title TEXT,
  p_phone TEXT,
  p_partner_count INTEGER DEFAULT 0,
  p_staff_count INTEGER DEFAULT 0,
  p_practicing_since TIMESTAMPTZ DEFAULT NULL,
  p_primary_use_case TEXT DEFAULT NULL,
  p_expected_team_size TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_firm_id UUID;
  v_existing_firm_id UUID;
BEGIN
  -- SECURITY CHECK 1: Only allow if user is calling for themselves
  IF p_user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: You can only create a firm for yourself'
    );
  END IF;

  -- SECURITY CHECK 2: Verify user doesn't already belong to a firm
  SELECT firm_id INTO v_existing_firm_id
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_existing_firm_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User already belongs to a firm'
    );
  END IF;

  -- SECURITY CHECK 3: Verify email matches the authenticated user's email
  IF p_email != (SELECT email FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email mismatch: Email must match your account email'
    );
  END IF;

  -- Create the firm
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
    p_firm_type::firm_type,
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
    'professional', -- Default plan type (matches existing column)
    true            -- Firm is active
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
    primary_use_case = p_primary_use_case,
    expected_team_size = p_expected_team_size,
    updated_at = now()
  WHERE id = p_user_id;

  -- Assign firm_administrator role
  INSERT INTO public.user_roles (
    user_id,
    firm_id,
    role,
    assigned_at,
    assigned_by
  ) VALUES (
    p_user_id,
    v_firm_id,
    'firm_administrator',
    now(),
    p_user_id -- Self-assigned during signup
  );

  -- Log the firm creation
  INSERT INTO public.audit_logs (
    firm_id,
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    v_firm_id,
    p_user_id,
    'CREATE',
    'firm',
    v_firm_id,
    jsonb_build_object(
      'firm_name', p_firm_name,
      'firm_type', p_firm_type,
      'action', 'firm_administrator_signup'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'firm_id', v_firm_id,
    'message', 'Firm created successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_firm_administrator_signup TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.complete_firm_administrator_signup IS
'Securely creates a new firm and assigns the user as firm administrator. Bypasses RLS policies using SECURITY DEFINER with multiple security checks.';
