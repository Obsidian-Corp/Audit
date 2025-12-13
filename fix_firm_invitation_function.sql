-- Fix the create_firm_invitation function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.create_firm_invitation(
  p_firm_name TEXT,
  p_firm_type TEXT,
  p_admin_email TEXT,
  p_admin_first_name TEXT DEFAULT NULL,
  p_admin_last_name TEXT DEFAULT NULL,
  p_admin_job_title TEXT DEFAULT 'Managing Partner'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_token TEXT;
BEGIN
  -- Generate unique token using gen_random_uuid (built-in, no extension needed)
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  -- Create invitation
  INSERT INTO public.firm_invitations (
    firm_name,
    firm_type,
    admin_email,
    admin_first_name,
    admin_last_name,
    admin_job_title,
    token,
    expires_at
  ) VALUES (
    p_firm_name,
    p_firm_type,
    p_admin_email,
    p_admin_first_name,
    p_admin_last_name,
    p_admin_job_title,
    v_token,
    now() + interval '30 days'
  )
  RETURNING id INTO v_invitation_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'expires_at', (now() + interval '30 days')::text
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
