-- Auto-confirm email for users who sign up via firm invitation
-- Since they clicked an email link to get here, we know the email is valid

CREATE OR REPLACE FUNCTION public.confirm_invited_user_email(
  p_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  -- Update the auth.users table to mark email as confirmed
  UPDATE auth.users
  SET
    email_confirmed_at = now(),
    confirmed_at = now()
  WHERE id = p_user_id
  AND email_confirmed_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found or already confirmed'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email confirmed successfully'
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
GRANT EXECUTE ON FUNCTION public.confirm_invited_user_email TO authenticated, anon;

COMMENT ON FUNCTION public.confirm_invited_user_email IS 'Auto-confirm email for users who sign up via firm invitation link';
