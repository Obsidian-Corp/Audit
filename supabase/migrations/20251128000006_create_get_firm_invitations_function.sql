-- Create function to get all firm invitations
-- This bypasses RLS since platform admin auth is custom JWT-based, not Supabase auth
CREATE OR REPLACE FUNCTION public.get_firm_invitations()
RETURNS SETOF public.firm_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Note: Platform admins use custom JWT auth, not Supabase auth.uid()
  -- The edge function/UI layer handles authentication
  -- This function just returns all invitations for platform admin viewing
  RETURN QUERY
  SELECT * FROM public.firm_invitations
  ORDER BY created_at DESC;
END;
$$;
