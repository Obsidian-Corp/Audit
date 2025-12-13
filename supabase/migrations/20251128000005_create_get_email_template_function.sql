-- Create function to get email template by key
-- This is called by the send-email edge function
CREATE OR REPLACE FUNCTION public.get_email_template(p_template_key TEXT)
RETURNS TABLE (
  template_key TEXT,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  variables JSONB,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.template_key,
    t.subject,
    t.html_body,
    t.text_body,
    t.variables,
    t.is_active
  FROM platform_admin.email_templates t
  WHERE t.template_key = p_template_key
    AND t.is_active = true;
END;
$$;
