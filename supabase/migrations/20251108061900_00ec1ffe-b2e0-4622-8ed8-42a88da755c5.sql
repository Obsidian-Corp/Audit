-- Update is_first_run to check the correct admin roles table
CREATE OR REPLACE FUNCTION public.is_first_run()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_roles 
    WHERE role = 'platform_admin'
      AND (expires_at IS NULL OR expires_at > now())
  );
$function$;