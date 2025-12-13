# Billing & Subscription Management - Implementation Specification

**Module**: Billing System
**Priority**: CRITICAL
**Estimated Effort**: 10 weeks
**Status**: NOT STARTED

---

## Technical Architecture

### Database Schema

#### Step 1: Create Billing Tables

**File**: `supabase/migrations/YYYYMMDDHHMMSS_create_billing_tables.sql`

```sql
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

-- Platform admins can view all
CREATE POLICY "Platform admins full access to billing"
  ON public.stripe_customers FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

---

## Edge Functions

### Step 2: Create Stripe Integration Functions

#### Function 1: stripe-webhook

**File**: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
  }

  console.log('Stripe event:', event.type);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'payment_method.attached':
      await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
      break;

    case 'customer.created':
    case 'customer.updated':
      await handleCustomerUpdate(event.data.object as Stripe.Customer);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organization_subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (error) console.error('Error updating subscription:', error);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) console.error('Error deleting subscription:', error);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Update invoice status
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid_cents: invoice.amount_paid,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  if (invoiceError) console.error('Error updating invoice:', invoiceError);

  // Resolve any payment failures
  const { data: stripeCustomer } = await supabase
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (stripeCustomer) {
    await supabase
      .from('payment_failures')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', stripeCustomer.organization_id)
      .eq('stripe_invoice_id', invoice.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Get organization
  const { data: stripeCustomer } = await supabase
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!stripeCustomer) return;

  // Create payment failure record
  const { error } = await supabase
    .from('payment_failures')
    .insert({
      organization_id: stripeCustomer.organization_id,
      stripe_invoice_id: invoice.id,
      failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
      failure_code: invoice.last_finalization_error?.code || 'unknown',
      retry_count: 0,
      next_retry_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });

  if (error) console.error('Error creating payment failure:', error);

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  // TODO: Send payment failure email
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const { error } = await supabase
    .from('payment_methods')
    .upsert({
      stripe_customer_id: paymentMethod.customer as string,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
      brand: paymentMethod.card?.brand,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_payment_method_id'
    });

  if (error) console.error('Error saving payment method:', error);
}

async function handleCustomerUpdate(customer: Stripe.Customer) {
  const { error } = await supabase
    .from('stripe_customers')
    .update({
      email: customer.email,
      default_payment_method_id: customer.invoice_settings.default_payment_method as string,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);

  if (error) console.error('Error updating customer:', error);
}
```

#### Function 2: create-stripe-customer

**File**: `supabase/functions/create-stripe-customer/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    const { organizationId, email, name } = await req.json();

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organization_id: organizationId,
      },
    });

    // Save to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('stripe_customers')
      .insert({
        organization_id: organizationId,
        stripe_customer_id: customer.id,
        email: customer.email,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

#### Function 3: create-subscription

**File**: `supabase/functions/create-subscription/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    const { organizationId, planId, paymentMethodId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get Stripe customer
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .single();

    if (!customer) throw new Error('Stripe customer not found');

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Plan not found');

    // Attach payment method to customer
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.stripe_customer_id,
      });

      await stripe.customers.update(customer.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.stripe_customer_id,
      items: [{ price: plan.stripe_price_id }],
      trial_period_days: plan.trial_days > 0 ? plan.trial_days : undefined,
      metadata: {
        organization_id: organizationId,
        plan_id: planId,
      },
    });

    // Save subscription to database
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: organizationId,
        plan_id: planId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_end: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

## Frontend Components

### Step 3: Create Billing Components

#### Component 1: Subscription Plan Manager (Admin)

**File**: `src/components/platform-admin/SubscriptionPlanManager.tsx`

```typescript
// Implementation needed
// Features:
// - List all subscription plans
// - Create new plan
// - Edit existing plan
// - Toggle plan active status
// - Sync with Stripe
// - Set features and limits
```

#### Component 2: Billing Overview (Customer)

**File**: `src/pages/settings/Billing.tsx`

```typescript
// Implementation needed
// Features:
// - Show current plan
// - Display next billing date
// - Payment method on file
// - Upgrade/downgrade options
// - Usage vs limits
```

#### Component 3: Payment Method Manager

**File**: `src/components/billing/PaymentMethodManager.tsx`

```typescript
// Implementation needed
// Features:
// - List saved payment methods
// - Add new card (Stripe Elements)
// - Set default payment method
// - Remove payment method
```

---

## Implementation Checklist

### Phase 1: Database & Backend (Week 1-2)
- [ ] Create billing migration file
- [ ] Run migration on development
- [ ] Create stripe-webhook function
- [ ] Create create-stripe-customer function
- [ ] Create create-subscription function
- [ ] Configure Stripe webhook endpoint
- [ ] Test webhook locally

### Phase 2: Admin Components (Week 3-4)
- [ ] SubscriptionPlanManager component
- [ ] Create default plans (Free, Pro, Enterprise)
- [ ] Sync plans with Stripe
- [ ] Test plan creation

### Phase 3: Customer Portal (Week 5-6)
- [ ] Billing overview page
- [ ] PaymentMethodManager component
- [ ] Subscription upgrade/downgrade flow
- [ ] Invoice history component

### Phase 4: Dunning & Automation (Week 7-8)
- [ ] Create dunning scheduled function
- [ ] Payment failure email templates
- [ ] Trial expiration workflow
- [ ] Auto-conversion logic

### Phase 5: Analytics (Week 9-10)
- [ ] Revenue dashboard component
- [ ] MRR/ARR calculations
- [ ] Churn tracking
- [ ] Trial conversion metrics

---

## Environment Variables Required

Add to `.env`:
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Add to Supabase edge function secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Testing Strategy

1. **Unit Tests**: Payment method handling, subscription creation
2. **Integration Tests**: Stripe webhook processing
3. **E2E Tests**: Complete subscription flow
4. **Test Mode**: Use Stripe test cards
5. **Load Tests**: Webhook handling under load

---

## Success Criteria

- [ ] Organizations can subscribe to paid plans
- [ ] Payment processing works (95%+ success rate)
- [ ] Invoices auto-generated
- [ ] Dunning recovers failed payments
- [ ] Revenue dashboard shows accurate MRR/ARR
