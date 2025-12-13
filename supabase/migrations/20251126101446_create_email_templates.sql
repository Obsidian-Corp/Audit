-- Email Template Management Migration
-- Created: 2025-11-26
-- Purpose: Add email template management and tracking system

-- Email Templates
CREATE TABLE IF NOT EXISTS platform_admin.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('transactional', 'billing', 'security', 'platform', 'marketing')),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Template Versions (for rollback)
CREATE TABLE IF NOT EXISTS platform_admin.email_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES platform_admin.email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version)
);

-- Email Sent Log
CREATE TABLE IF NOT EXISTS public.email_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT CHECK (status IN ('sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  provider_message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Email Analytics
CREATE TABLE IF NOT EXISTS platform_admin.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT,
  date DATE DEFAULT CURRENT_DATE,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  UNIQUE(template_key, date)
);

-- Create indexes
CREATE INDEX idx_email_templates_key ON platform_admin.email_templates(template_key);
CREATE INDEX idx_email_templates_category ON platform_admin.email_templates(category);
CREATE INDEX idx_email_sent_log_recipient ON email_sent_log(recipient_email);
CREATE INDEX idx_email_sent_log_template ON email_sent_log(template_key);
CREATE INDEX idx_email_sent_log_sent_at ON email_sent_log(sent_at);
CREATE INDEX idx_email_analytics_template_date ON platform_admin.email_analytics(template_key, date);

-- RLS Policies
ALTER TABLE platform_admin.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_admin.email_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage email templates"
  ON platform_admin.email_templates FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view template versions"
  ON platform_admin.email_template_versions FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins view email logs"
  ON public.email_sent_log FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Insert default email templates
INSERT INTO platform_admin.email_templates (template_key, category, subject, html_body, text_body, variables, is_system) VALUES

-- Transactional
('welcome_email', 'transactional', 'Welcome to {{platform.name}}!',
'<html><body><h1>Welcome {{user.name}}!</h1><p>Thanks for joining {{platform.name}}.</p></body></html>',
'Welcome {{user.name}}! Thanks for joining {{platform.name}}.',
'["user.name", "user.email", "platform.name", "platform.url"]'::jsonb,
true),

('password_reset', 'transactional', 'Reset Your Password',
'<html><body><h1>Password Reset</h1><p>Click here to reset: <a href="{{reset.url}}">Reset Password</a></p></body></html>',
'Password Reset: {{reset.url}}',
'["user.name", "reset.url", "reset.expires"]'::jsonb,
true),

-- Billing
('payment_successful', 'billing', 'Payment Received - Thank You!',
'<html><body><h1>Payment Successful</h1><p>Amount: {{payment.amount}}</p></body></html>',
'Payment successful for {{payment.amount}}',
'["user.name", "payment.amount", "payment.date", "invoice.url"]'::jsonb,
true),

('payment_failed', 'billing', 'Payment Failed - Action Required',
'<html><body><h1>Payment Failed</h1><p>Your payment of {{payment.amount}} failed. Please update your payment method.</p></body></html>',
'Payment failed for {{payment.amount}}. Please update payment method.',
'["user.name", "payment.amount", "failure.reason", "update.url"]'::jsonb,
true),

('trial_expiring', 'billing', 'Your Trial Expires in {{trial.days_left}} Days',
'<html><body><h1>Trial Expiring Soon</h1><p>Your trial expires in {{trial.days_left}} days.</p></body></html>',
'Your trial expires in {{trial.days_left}} days.',
'["user.name", "trial.days_left", "upgrade.url"]'::jsonb,
true),

-- Security
('suspicious_login', 'security', 'Unusual Login Detected',
'<html><body><h1>Unusual Login</h1><p>Location: {{login.location}}<br>Time: {{login.time}}</p></body></html>',
'Unusual login from {{login.location}} at {{login.time}}',
'["user.name", "login.location", "login.time", "login.ip"]'::jsonb,
true);

-- Function to increment email analytics
CREATE OR REPLACE FUNCTION increment_email_analytics(
  _template_key TEXT,
  _metric TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO platform_admin.email_analytics (template_key, date, sent_count, delivered_count, opened_count, clicked_count, bounced_count, failed_count)
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
$$ LANGUAGE plpgsql;
