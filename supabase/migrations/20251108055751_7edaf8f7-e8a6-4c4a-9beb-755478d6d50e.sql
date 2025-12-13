-- Add RLS policy to allow bootstrap of first platform admin
-- This policy allows inserting the first platform_admin role when no admins exist yet

CREATE POLICY "Allow bootstrap of first platform admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if this is the first platform admin (no existing platform admins)
  NOT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE role = 'platform_admin'
  )
  AND role = 'platform_admin'
  AND user_id = auth.uid()
);