-- MANUAL FIX: Run this in Supabase Dashboard SQL Editor
-- This fixes the role table mismatch issue

-- Step 1: Migrate any roles from firm_roles to user_roles
-- (This will fix your current user's missing role)
INSERT INTO public.user_roles (user_id, firm_id, role)
SELECT user_id, firm_id, role
FROM public.firm_roles
WHERE true
ON CONFLICT (user_id, firm_id, role) DO NOTHING;

-- Step 2: Update the complete_firm_administrator_signup function
CREATE OR REPLACE FUNCTION public.complete_firm_administrator_signup(
  p_user_id UUID,
  p_firm_name TEXT,
  p_firm_type TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
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
AS $$
DECLARE
  v_firm_id UUID;
BEGIN
  INSERT INTO public.firms (
    name, firm_type, specializations, partner_count, staff_count,
    practicing_since, primary_contact, contact_email, contact_phone,
    location, subscription_tier, is_active
  ) VALUES (
    p_firm_name, p_firm_type, p_specializations, p_partner_count, p_staff_count,
    CASE WHEN p_practicing_since IS NOT NULL THEN make_date(p_practicing_since, 1, 1) ELSE NULL END,
    p_first_name || ' ' || p_last_name, p_email, p_phone,
    jsonb_build_object('city', p_city, 'country', p_country),
    'professional', true
  )
  RETURNING id INTO v_firm_id;

  UPDATE public.profiles
  SET firm_id = v_firm_id, first_name = p_first_name, last_name = p_last_name,
      title = p_job_title, phone = p_phone, updated_at = now()
  WHERE id = p_user_id;

  -- FIXED: Insert into user_roles instead of firm_roles
  INSERT INTO public.user_roles (user_id, firm_id, role)
  VALUES (p_user_id, v_firm_id, 'firm_administrator')
  ON CONFLICT (user_id, firm_id, role) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'firm_id', v_firm_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Step 3: Verify the fix
SELECT
  u.email,
  p.first_name,
  p.last_name,
  ur.role,
  f.name as firm_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.firms f ON f.id = p.firm_id
WHERE u.email NOT LIKE '%test%'
ORDER BY u.created_at DESC
LIMIT 5;
