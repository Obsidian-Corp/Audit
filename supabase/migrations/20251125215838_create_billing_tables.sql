-- Billing & Subscription Management Migration
-- Created: 2025-11-25
-- Purpose: Add Stripe integration, subscription management, and payment processing

-- Stripe Configuration (Platform Admin Only)
CREATE TABLE IF NOT EXISTS platform_admin.stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publishable_key TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  webhook_secret_encrypted TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('test', 'live')) DEFAULT 'test',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Customers (One per Organization)
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES firms(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  default_payment_method_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('card', 'bank_account', 'sepa_debit')),
  last4 TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS platform_admin.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT,
  billing_period TEXT CHECK (billing_period IN ('monthly', 'annual')),
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Subscriptions
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES firms(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES platform_admin.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')) DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_due_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Failures (Dunning)
CREATE TABLE IF NOT EXISTS public.payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  failure_reason TEXT,
  failure_code TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Events (for usage-based billing)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stripe_customers_org ON stripe_customers(organization_id);
CREATE INDEX idx_payment_methods_customer ON payment_methods(stripe_customer_id);
CREATE INDEX idx_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payment_failures_org ON payment_failures(organization_id);
CREATE INDEX idx_payment_failures_unresolved ON payment_failures(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_usage_events_org_time ON usage_events(organization_id, timestamp);

-- RLS Policies
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Organizations can only see their own billing data
CREATE POLICY "Organizations can view own billing"
  ON public.stripe_customers FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can view own subscriptions"
  ON public.organization_subscriptions FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can view own invoices"
  ON public.invoices FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can view own invoice line items"
  ON public.invoice_line_items FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE organization_id IN (
      SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Organizations can view own payment methods"
  ON public.payment_methods FOR SELECT
  USING (stripe_customer_id IN (
    SELECT stripe_customer_id FROM stripe_customers WHERE organization_id IN (
      SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Organizations can view own payment failures"
  ON public.payment_failures FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can view own usage events"
  ON public.usage_events FOR SELECT
  USING (organization_id IN (
    SELECT firm_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- Platform admins can view all
CREATE POLICY "Platform admins full access to stripe_customers"
  ON public.stripe_customers FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins full access to subscriptions"
  ON public.organization_subscriptions FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins full access to invoices"
  ON public.invoices FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins full access to payment_methods"
  ON public.payment_methods FOR ALL
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins full access to payment_failures"
  ON public.payment_failures FOR ALL
  USING (public.is_platform_admin(auth.uid()));
