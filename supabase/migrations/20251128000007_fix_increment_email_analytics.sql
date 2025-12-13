-- Fix increment_email_analytics function to have SECURITY DEFINER
-- This allows it to bypass permission checks when called from edge functions

DROP FUNCTION IF EXISTS public.increment_email_analytics(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.increment_email_analytics(
  _template_key TEXT,
  _metric TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, platform_admin
AS $$
BEGIN
  INSERT INTO platform_admin.email_analytics (
    template_key,
    date,
    sent_count,
    delivered_count,
    opened_count,
    clicked_count,
    bounced_count,
    failed_count
  )
  VALUES (
    _template_key,
    CURRENT_DATE,
    CASE WHEN _metric = 'sent_count' THEN 1 ELSE 0 END,
    CASE WHEN _metric = 'delivered_count' THEN 1 ELSE 0 END,
    CASE WHEN _metric = 'opened_count' THEN 1 ELSE 0 END,
    CASE WHEN _metric = 'clicked_count' THEN 1 ELSE 0 END,
    CASE WHEN _metric = 'bounced_count' THEN 1 ELSE 0 END,
    CASE WHEN _metric = 'failed_count' THEN 1 ELSE 0 END
  )
  ON CONFLICT (template_key, date)
  DO UPDATE SET
    sent_count = platform_admin.email_analytics.sent_count + CASE WHEN _metric = 'sent_count' THEN 1 ELSE 0 END,
    delivered_count = platform_admin.email_analytics.delivered_count + CASE WHEN _metric = 'delivered_count' THEN 1 ELSE 0 END,
    opened_count = platform_admin.email_analytics.opened_count + CASE WHEN _metric = 'opened_count' THEN 1 ELSE 0 END,
    clicked_count = platform_admin.email_analytics.clicked_count + CASE WHEN _metric = 'clicked_count' THEN 1 ELSE 0 END,
    bounced_count = platform_admin.email_analytics.bounced_count + CASE WHEN _metric = 'bounced_count' THEN 1 ELSE 0 END,
    failed_count = platform_admin.email_analytics.failed_count + CASE WHEN _metric = 'failed_count' THEN 1 ELSE 0 END;
END;
$$;
