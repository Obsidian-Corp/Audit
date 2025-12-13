-- Add RPC to know if IP whitelist is configured (active entries)
CREATE OR REPLACE FUNCTION public.get_active_ip_whitelist_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'platform_admin', 'public'
AS $$
  SELECT COUNT(*)::integer FROM platform_admin.ip_whitelist WHERE is_active = true;
$$;