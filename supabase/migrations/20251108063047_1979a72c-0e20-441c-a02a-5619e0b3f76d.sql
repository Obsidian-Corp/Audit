-- Update is_first_run to check the new admin_users table
CREATE OR REPLACE FUNCTION public.is_first_run()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_users 
    WHERE is_active = true
  );
$function$;

-- Create RPC function to check if bootstrap is needed (client-callable)
CREATE OR REPLACE FUNCTION public.check_admin_bootstrap_needed()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM platform_admin.admin_users 
    WHERE is_active = true
  );
$function$;