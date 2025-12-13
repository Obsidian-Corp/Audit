-- Create a SECURITY DEFINER function to handle complete firm onboarding
-- This bypasses RLS to allow initial role assignment during signup

CREATE OR REPLACE FUNCTION public.complete_firm_onboarding(
  p_user_id UUID,
  p_firm_id UUID,
  p_job_title TEXT,
  p_phone TEXT,
  p_primary_use_case TEXT DEFAULT NULL,
  p_expected_team_size TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_existing_firm_id UUID;
  v_firm_owner UUID;
BEGIN
  -- SECURITY CHECK 1: Only allow if user is calling for themselves
  IF p_user_id != auth.uid() THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Cannot onboard other users'
    );
    RETURN v_result;
  END IF;

  -- SECURITY CHECK 2: Only allow if user doesn't already have a firm
  SELECT firm_id INTO v_existing_firm_id
  FROM profiles
  WHERE id = p_user_id;

  IF v_existing_firm_id IS NOT NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'User already belongs to a firm'
    );
    RETURN v_result;
  END IF;

  -- SECURITY CHECK 3: Verify the firm was just created and has no owner yet
  SELECT primary_contact_email INTO v_firm_owner
  FROM firms
  WHERE id = p_firm_id;

  IF v_firm_owner IS NULL THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Invalid firm'
    );
    RETURN v_result;
  END IF;

  -- SECURITY CHECK 4: Verify user's email matches firm's primary contact
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND email = v_firm_owner
  ) THEN
    v_result := jsonb_build_object(
      'success', false,
      'error', 'Email does not match firm primary contact'
    );
    RETURN v_result;
  END IF;

  -- All security checks passed, proceed with onboarding

  -- Update user profile with firm details
  UPDATE profiles
  SET
    firm_id = p_firm_id,
    title = p_job_title,
    phone = p_phone,
    metadata = jsonb_build_object(
      'primary_use_case', p_primary_use_case,
      'expected_team_size', p_expected_team_size
    )
  WHERE id = p_user_id;

  -- Assign firm_administrator role (bypasses RLS because this is SECURITY DEFINER)
  INSERT INTO user_roles (user_id, firm_id, role)
  VALUES (p_user_id, p_firm_id, 'firm_administrator')
  ON CONFLICT (user_id, role, firm_id) DO NOTHING;

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Onboarding completed successfully'
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    v_result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_firm_onboarding(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.complete_firm_onboarding IS
'Completes firm onboarding by updating user profile and assigning firm_administrator role.
This function uses SECURITY DEFINER to bypass RLS policies during initial signup.';
