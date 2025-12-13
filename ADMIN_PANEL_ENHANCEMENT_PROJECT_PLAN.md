# Admin Panel Enhancement - Project Plan

**Project Manager**: Senior PM
**Date**: 2025-01-23
**Project Duration**: 16 weeks (4 months)
**Priority**: HIGH
**Status**: PLANNING

---

## Executive Summary

This project addresses critical gaps in the Platform Admin control panel to enable:
1. **Revenue generation** through billing/subscription management
2. **Operational efficiency** through advanced admin tools
3. **Competitive positioning** against enterprise platforms

**Business Impact**:
- Enable SaaS revenue model (currently no payment processing)
- Reduce support costs through user impersonation debugging
- Improve admin efficiency through better tooling
- Achieve feature parity with competitors (Stripe billing, admin impersonation)

**Investment**: $180K-240K (2 engineers × 4 months)
**Expected ROI**: 18-24 months (through subscription revenue)

---

## Gap Analysis

### Current State Assessment

#### Billing/Payments - 🔴 CRITICAL GAP
**Current Capability**: 10/100
- ✅ Basic cost attribution tracking exists (`CostAttributionDashboard`)
- ❌ NO payment processing (cannot charge customers)
- ❌ NO subscription management (cannot create plans)
- ❌ NO invoice generation for organizations
- ❌ NO dunning (failed payment handling)
- ❌ NO revenue recognition

**Business Impact**: 🔴 **CRITICAL** - Cannot monetize the platform

#### Advanced Admin Features - 🟡 MEDIUM GAP
**Current Capability**: 30/100
- ⚠️ Admin migration exists but not true impersonation
- ❌ NO "view as user" without changing admin to user
- ❌ Email templates hardcoded in edge functions
- ❌ NO UI for email customization
- ❌ NO performance monitoring tools
- ❌ NO query optimization dashboards

**Business Impact**: 🟡 **MEDIUM** - Increases support costs, reduces admin efficiency

---

## Project Scope

### In Scope ✅

**Module 1: Billing & Subscription Management**
1. Stripe payment integration
2. Subscription plan management
3. Customer billing portal
4. Invoice generation and delivery
5. Payment failure handling (dunning)
6. Revenue analytics dashboard
7. Trial management
8. Usage-based billing foundation

**Module 2: User Impersonation**
1. "View as organization" capability
2. "View as user" capability
3. Session tracking and audit logging
4. Impersonation banner (show admin is impersonating)
5. Exit impersonation controls
6. Permission restrictions during impersonation

**Module 3: Email Template Management**
1. Email template editor UI
2. Template versioning
3. Variable/placeholder system
4. Preview functionality
5. A/B testing support
6. Send test emails
7. Template library (welcome, alerts, invoices, etc.)

**Module 4: Performance Monitoring**
1. Database query analyzer
2. Slow query dashboard
3. API endpoint performance tracking
4. Resource utilization metrics
5. Cache hit/miss rates
6. Performance alerts

### Out of Scope ❌

- Advanced tax calculation (use Stripe Tax)
- Multi-currency support (Phase 2)
- Reseller/channel partner billing (Phase 2)
- Custom payment gateways beyond Stripe (Phase 2)
- Advanced load testing tools (use external tools)
- Database migration tools (Phase 2)

---

## Requirements Definition

### Module 1: Billing & Subscription Management

#### Epic 1.1: Stripe Integration
**Business Value**: Enable payment processing
**Priority**: 🔴 CRITICAL
**Effort**: 80 hours

**User Stories**:

**As a** Platform Admin
**I want to** connect the platform to Stripe
**So that** I can process payments from organizations

**Acceptance Criteria**:
- [ ] Stripe API keys configurable via admin UI
- [ ] Stripe webhook endpoint receiving events
- [ ] Customer creation in Stripe when org signs up
- [ ] Payment method storage (card, ACH, etc.)
- [ ] PCI compliance maintained (Stripe handles card data)
- [ ] Test mode and live mode support
- [ ] Error handling for failed API calls

**Technical Requirements**:
```typescript
// Database schema additions
CREATE TABLE platform_admin.stripe_config (
  id UUID PRIMARY KEY,
  publishable_key TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL, -- Encrypted
  webhook_secret_encrypted TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('test', 'live')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.stripe_customers (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT,
  payment_method_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT, -- 'card', 'bank_account'
  last4 TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints**:
- `POST /api/admin/stripe/connect` - Configure Stripe
- `POST /api/admin/stripe/test-connection` - Verify setup
- `POST /api/stripe/webhook` - Handle Stripe events

---

#### Epic 1.2: Subscription Plan Management
**Business Value**: Define pricing tiers
**Priority**: 🔴 CRITICAL
**Effort**: 60 hours

**User Stories**:

**As a** Platform Admin
**I want to** create subscription plans with pricing
**So that** organizations can subscribe to different tiers

**Acceptance Criteria**:
- [ ] Create plans (Free, Professional, Enterprise)
- [ ] Define features per plan
- [ ] Set pricing (monthly/annual)
- [ ] Enable/disable plans
- [ ] Plan versioning (grandfather old customers)
- [ ] Usage limits per plan
- [ ] Add-on products (extra users, storage, etc.)

**Technical Requirements**:
```typescript
CREATE TABLE platform_admin.subscription_plans (
  id UUID PRIMARY KEY,
  plan_code TEXT UNIQUE NOT NULL, -- 'free', 'pro', 'enterprise'
  display_name TEXT NOT NULL,
  description TEXT,
  stripe_price_id TEXT, -- Stripe Price ID
  billing_period TEXT CHECK (billing_period IN ('monthly', 'annual')),
  price_cents INTEGER, -- Price in cents
  currency TEXT DEFAULT 'USD',
  trial_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB, -- {"max_users": 10, "max_storage_gb": 100}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.organization_subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  plan_id UUID REFERENCES platform_admin.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI Components**:
```tsx
// Components to build
<SubscriptionPlanManager />
  - Create/edit plans
  - Set pricing
  - Configure features
  - Stripe product sync

<PlanFeaturesEditor />
  - Define feature limits
  - Toggle features on/off
  - Usage caps
```

---

#### Epic 1.3: Customer Billing Portal
**Business Value**: Self-service billing for organizations
**Priority**: 🔴 HIGH
**Effort**: 70 hours

**User Stories**:

**As an** Organization Administrator
**I want to** manage my subscription and payment methods
**So that** I can control billing without contacting support

**Acceptance Criteria**:
- [ ] View current plan and features
- [ ] Upgrade/downgrade subscription
- [ ] Add/update payment methods
- [ ] View billing history
- [ ] Download invoices
- [ ] Cancel subscription
- [ ] View usage metrics vs. limits

**UI Location**: `/settings/billing` (for firm admins)

**Components**:
```tsx
<BillingOverview />
  - Current plan display
  - Next billing date
  - Payment method on file
  - Quick actions (upgrade, update card)

<SubscriptionManager />
  - Plan comparison table
  - Upgrade/downgrade buttons
  - Proration preview
  - Confirmation dialog

<PaymentMethodsManager />
  - List saved cards/bank accounts
  - Add new payment method (Stripe Elements)
  - Set default payment method
  - Remove payment method

<InvoiceHistory />
  - Table of past invoices
  - Download PDF
  - Payment status
  - Retry failed payments

<UsageDashboard />
  - User count vs. limit
  - Storage used vs. limit
  - API calls vs. limit
  - Progress bars with warnings
```

---

#### Epic 1.4: Invoice Generation & Delivery
**Business Value**: Automated invoicing
**Priority**: 🔴 HIGH
**Effort**: 50 hours

**User Stories**:

**As a** Platform Admin
**I want** invoices automatically generated and sent
**So that** billing is hands-off

**Acceptance Criteria**:
- [ ] Invoices auto-generated on subscription renewal
- [ ] PDF invoice generation
- [ ] Email delivery to organization billing contact
- [ ] Invoice includes line items, taxes, discounts
- [ ] Invoice stored in database and Stripe
- [ ] Organizations can download invoices anytime
- [ ] Support for credits and refunds

**Technical Implementation**:
```typescript
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT UNIQUE NOT NULL, -- INV-2025-001
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_due_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  invoice_pdf_url TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Edge Function**:
```typescript
// supabase/functions/generate-invoice
export async function generateInvoice(organizationId: string) {
  // 1. Fetch subscription details
  // 2. Calculate line items
  // 3. Apply taxes (Stripe Tax)
  // 4. Generate PDF (using PDF library)
  // 5. Store in database
  // 6. Send email to billing contact
  // 7. Update Stripe invoice
}
```

---

#### Epic 1.5: Payment Failure Handling (Dunning)
**Business Value**: Recover failed payments
**Priority**: 🔴 HIGH
**Effort**: 40 hours

**User Stories**:

**As a** Platform Admin
**I want** automated retry logic for failed payments
**So that** we recover revenue from payment failures

**Acceptance Criteria**:
- [ ] Automatic retry schedule (day 3, 5, 7, 14)
- [ ] Email notifications to customer on failure
- [ ] Escalation emails (card expiring, past due)
- [ ] Grace period before service suspension
- [ ] Account suspension after failed retries
- [ ] Reactivation workflow when payment succeeds
- [ ] Admin dashboard for at-risk subscriptions

**Dunning Email Sequence**:
1. **Day 0**: Payment failed - "Payment Issue - Please Update Card"
2. **Day 3**: Retry #1 failed - "Urgent: Update Payment Method"
3. **Day 7**: Retry #2 failed - "Final Notice - Account Suspension in 7 Days"
4. **Day 14**: Account suspended - "Account Suspended - Update Payment to Restore"

**Technical Implementation**:
```typescript
CREATE TABLE public.payment_failures (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  stripe_invoice_id TEXT,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Scheduled job: check-payment-failures (daily)
export async function checkPaymentFailures() {
  // 1. Find invoices past_due
  // 2. Check retry count and schedule
  // 3. Attempt retry if due
  // 4. Send escalation emails
  // 5. Suspend orgs after max retries
  // 6. Alert platform admins
}
```

**Admin Dashboard Component**:
```tsx
<DunningDashboard />
  - List of at-risk subscriptions
  - Filter by retry count
  - Manual retry button
  - Suspend/reactivate controls
  - Email history per org
  - Revenue at risk metric
```

---

#### Epic 1.6: Revenue Analytics Dashboard
**Business Value**: Track revenue metrics
**Priority**: 🟡 MEDIUM
**Effort**: 30 hours

**User Stories**:

**As a** Platform Admin
**I want to** view revenue metrics and trends
**So that** I can make business decisions

**Acceptance Criteria**:
- [ ] Monthly Recurring Revenue (MRR)
- [ ] Annual Recurring Revenue (ARR)
- [ ] Churn rate
- [ ] Customer Lifetime Value (LTV)
- [ ] Plan distribution (how many on each plan)
- [ ] Revenue by plan
- [ ] New vs. churned revenue
- [ ] Trial conversion rate

**Dashboard Metrics**:
```tsx
<RevenueDashboard />
  Metrics:
  - Current MRR: $45,230
  - MRR Growth: +12% MoM
  - Total ARR: $542,760
  - Active Subscriptions: 127
  - Churned This Month: 3
  - Churn Rate: 2.3%
  - Avg Revenue Per User (ARPU): $356/mo
  - Trial Conversion: 68%

  Charts:
  - MRR trend (12 months)
  - Plan distribution pie chart
  - Revenue by plan bar chart
  - New vs. churned revenue
  - Cohort retention
```

---

#### Epic 1.7: Trial Management
**Business Value**: Convert trial users to paid
**Priority**: 🟡 MEDIUM
**Effort**: 25 hours

**User Stories**:

**As a** Platform Admin
**I want to** manage trial periods
**So that** I can convert trials to paid customers

**Acceptance Criteria**:
- [ ] Set trial length per plan (14, 30 days)
- [ ] Trial countdown visible to users
- [ ] Email reminders (7 days left, 3 days left, expiring today)
- [ ] Auto-convert to paid if card on file
- [ ] Downgrade to free plan if no card
- [ ] Trial extension capability (manual override)
- [ ] Trial metrics dashboard

**Trial Reminder Emails**:
1. **Day 7**: "One week left in your trial"
2. **Day 11**: "3 days left - Add payment method to continue"
3. **Day 14**: "Trial expired - Upgrade to continue using [features]"

**Admin Dashboard**:
```tsx
<TrialsDashboard />
  - Active trials: 23
  - Expiring this week: 5
  - Trials without payment method: 12
  - Trial conversion rate: 68%
  - List of trials with days remaining
  - Quick extend trial action
```

---

#### Epic 1.8: Usage-Based Billing Foundation
**Business Value**: Enable metered billing
**Priority**: 🟢 LOW (Future)
**Effort**: 40 hours

**User Stories**:

**As a** Platform Admin
**I want to** charge based on usage (API calls, storage)
**So that** I can offer flexible pricing

**Acceptance Criteria**:
- [ ] Track metered usage (users, storage, API calls)
- [ ] Store usage events
- [ ] Aggregate usage per billing period
- [ ] Sync usage to Stripe
- [ ] Include usage charges in invoices
- [ ] Usage reports for customers

**Phase 1 Implementation** (Foundation only):
```typescript
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  event_type TEXT, -- 'api_call', 'storage_gb', 'user_seat'
  quantity NUMERIC,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE public.usage_aggregations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES firms(id),
  metric_name TEXT, -- 'total_api_calls', 'storage_gb_hours'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  total_quantity NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note**: Full usage billing in Phase 2

---

### Module 2: User Impersonation

#### Epic 2.1: Organization Impersonation
**Business Value**: Debug organization issues
**Priority**: 🔴 HIGH
**Effort**: 50 hours

**User Stories**:

**As a** Platform Admin
**I want to** view the platform as a specific organization
**So that** I can debug issues they're experiencing

**Acceptance Criteria**:
- [ ] "View as Organization" button in org detail page
- [ ] Switch admin session to organization context
- [ ] See exactly what org sees (data, permissions, features)
- [ ] Impersonation banner visible at all times
- [ ] "Exit Impersonation" button always accessible
- [ ] Cannot perform destructive actions while impersonating
- [ ] All actions logged to audit trail
- [ ] Session expires after 1 hour

**UI Implementation**:
```tsx
// In OrganizationDetail.tsx
<Button onClick={() => impersonateOrganization(org.id)}>
  <Eye className="h-4 w-4 mr-2" />
  View as Organization
</Button>

// Impersonation banner (shown on all pages)
<ImpersonationBanner>
  <AlertTriangle className="h-4 w-4" />
  You are viewing as: Acme Corp
  <Button onClick={exitImpersonation}>Exit</Button>
  <span className="text-xs">Session expires in 45:23</span>
</ImpersonationBanner>
```

**Technical Implementation**:
```typescript
CREATE TABLE platform_admin.impersonation_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID NOT NULL,
  organization_id UUID REFERENCES firms(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  actions_performed JSONB[], -- Log all actions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

// Edge function: start-impersonation
export async function startImpersonation(
  adminId: string,
  organizationId: string
) {
  // 1. Verify admin has permission
  // 2. Create impersonation session (1 hour TTL)
  // 3. Generate special JWT with org context
  // 4. Return token + session ID
  // 5. Log to audit trail
}

// Middleware: check-impersonation
export function checkImpersonation(req: Request) {
  const impersonationToken = req.headers.get('X-Impersonation-Token');
  if (impersonationToken) {
    // 1. Verify token validity
    // 2. Check expiration
    // 3. Load organization context
    // 4. Inject into request
    // 5. Log action to session
  }
}
```

**Security Restrictions**:
```typescript
// Actions BLOCKED during impersonation:
const RESTRICTED_ACTIONS = [
  'delete_organization',
  'delete_user',
  'transfer_ownership',
  'modify_billing',
  'export_all_data',
  'change_subscription',
];

// Check in each protected endpoint
if (isImpersonating && RESTRICTED_ACTIONS.includes(action)) {
  throw new Error('Action not allowed during impersonation');
}
```

---

#### Epic 2.2: User Impersonation
**Business Value**: Debug user-specific issues
**Priority**: 🟡 MEDIUM
**Effort**: 40 hours

**User Stories**:

**As a** Platform Admin
**I want to** view the platform as a specific user
**So that** I can debug permission or UX issues

**Acceptance Criteria**:
- [ ] "View as User" button in user detail page
- [ ] Switch to user's role and permissions
- [ ] See exactly what user sees
- [ ] Cannot modify user data while impersonating
- [ ] Impersonation banner shows user name
- [ ] All actions logged
- [ ] 1-hour session timeout

**Implementation** (similar to org impersonation):
```tsx
<Button onClick={() => impersonateUser(user.id)}>
  <UserCircle className="h-4 w-4 mr-2" />
  View as User
</Button>

<ImpersonationBanner>
  You are viewing as: John Smith (Senior Auditor)
  Organization: Acme Corp
  <Button onClick={exitImpersonation}>Exit</Button>
</ImpersonationBanner>
```

---

#### Epic 2.3: Impersonation Audit Logging
**Business Value**: Compliance and security
**Priority**: 🔴 HIGH
**Effort**: 20 hours

**User Stories**:

**As a** Platform Admin
**I want** all impersonation sessions logged
**So that** we maintain security and compliance

**Acceptance Criteria**:
- [ ] Log when impersonation starts/ends
- [ ] Log all actions performed during impersonation
- [ ] Record which admin impersonated which org/user
- [ ] Timestamp all events
- [ ] Export impersonation logs
- [ ] Alert on suspicious patterns

**Audit Log Entry**:
```json
{
  "event_type": "impersonation_started",
  "admin_id": "uuid",
  "admin_email": "admin@platform.com",
  "target_type": "organization",
  "target_id": "org-uuid",
  "target_name": "Acme Corp",
  "started_at": "2025-01-23T10:30:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}

{
  "event_type": "impersonation_action",
  "session_id": "session-uuid",
  "action": "viewed_engagement",
  "resource_id": "engagement-uuid",
  "timestamp": "2025-01-23T10:35:00Z"
}

{
  "event_type": "impersonation_ended",
  "session_id": "session-uuid",
  "ended_at": "2025-01-23T11:15:00Z",
  "total_actions": 12,
  "reason": "manual_exit" | "timeout" | "error"
}
```

**Admin Dashboard**:
```tsx
<ImpersonationAuditLog />
  - Table of all impersonation sessions
  - Filter by admin, organization, date
  - View session details (all actions)
  - Export to CSV
  - Alert on suspicious activity:
    - Multiple rapid impersonations
    - Long session duration
    - Impersonation outside business hours
```

---

### Module 3: Email Template Management

#### Epic 3.1: Email Template Editor UI
**Business Value**: Customize email communications
**Priority**: 🟡 MEDIUM
**Effort**: 60 hours

**User Stories**:

**As a** Platform Admin
**I want to** customize email templates
**So that** emails match our brand and messaging

**Acceptance Criteria**:
- [ ] Visual email editor (WYSIWYG)
- [ ] HTML and plain text editing
- [ ] Variable/placeholder insertion ({{user.name}}, {{org.name}})
- [ ] Preview functionality (desktop, mobile)
- [ ] Test send to admin email
- [ ] Template categories (transactional, marketing, alerts)
- [ ] Revert to default template option

**Email Template Categories**:
1. **Transactional**
   - Welcome email (new user)
   - Password reset
   - Email verification
   - Invitation to organization
   - Two-factor authentication code

2. **Billing**
   - Payment successful
   - Payment failed
   - Trial expiring
   - Subscription canceled
   - Invoice available

3. **Security**
   - Suspicious login detected
   - Password changed
   - New device login
   - Account locked

4. **Platform**
   - Health alert (to admins)
   - Access request pending
   - Compliance report ready
   - System maintenance notification

**UI Components**:
```tsx
<EmailTemplateManager />
  // Template list
  <TemplateLibrary>
    {templates.map(template => (
      <TemplateCard
        name={template.name}
        category={template.category}
        lastModified={template.updated_at}
        status={template.is_active}
        onEdit={() => openEditor(template)}
      />
    ))}
  </TemplateLibrary>

<EmailTemplateEditor>
  <Tabs>
    <Tab label="Visual">
      <WYSIWYGEditor
        content={template.html}
        onChange={updateTemplate}
      />
    </Tab>
    <Tab label="HTML">
      <CodeEditor
        language="html"
        value={template.html}
        onChange={updateTemplate}
      />
    </Tab>
    <Tab label="Plain Text">
      <TextArea
        value={template.text}
        onChange={updateTemplate}
      />
    </Tab>
    <Tab label="Variables">
      <VariableList>
        {{user.name}}
        {{user.email}}
        {{org.name}}
        {{platform.name}}
        {{action.url}}
      </VariableList>
    </Tab>
  </Tabs>

  <TemplatePreview>
    <DeviceToggle /> {/* Desktop, Tablet, Mobile */}
    <PreviewPane content={renderedHtml} />
  </TemplatePreview>

  <TestEmailDialog>
    <Input placeholder="admin@example.com" />
    <Button onClick={sendTestEmail}>Send Test</Button>
  </TestEmailDialog>
</EmailTemplateEditor>
```

**Technical Implementation**:
```typescript
CREATE TABLE platform_admin.email_templates (
  id UUID PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL, -- 'welcome_email', 'payment_failed'
  category TEXT, -- 'transactional', 'billing', 'security', 'platform'
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB, -- Available variables for this template
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- Cannot delete system templates
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE platform_admin.email_template_versions (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES email_templates(id),
  version INTEGER NOT NULL,
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version)
);
```

**Template Rendering Function**:
```typescript
export function renderEmailTemplate(
  templateKey: string,
  variables: Record<string, any>
): { subject: string; html: string; text: string } {
  // 1. Fetch template from database
  const template = await getTemplate(templateKey);

  // 2. Replace variables
  const subject = replaceVariables(template.subject, variables);
  const html = replaceVariables(template.html_body, variables);
  const text = replaceVariables(template.text_body, variables);

  // 3. Return rendered content
  return { subject, html, text };
}

function replaceVariables(template: string, vars: Record<string, any>): string {
  return template.replace(/\{\{(\w+\.?\w+)\}\}/g, (match, key) => {
    const keys = key.split('.');
    let value = vars;
    for (const k of keys) {
      value = value?.[k];
    }
    return value ?? match;
  });
}
```

---

#### Epic 3.2: Template Versioning & A/B Testing
**Business Value**: Optimize email effectiveness
**Priority**: 🟢 LOW
**Effort**: 30 hours

**User Stories**:

**As a** Platform Admin
**I want to** A/B test email templates
**So that** I can improve open and click rates

**Acceptance Criteria**:
- [ ] Create variant versions of templates
- [ ] Split traffic between variants (50/50, 80/20, etc.)
- [ ] Track opens and clicks per variant
- [ ] Declare winner manually or auto (statistical significance)
- [ ] Rollout winner to 100%

**Implementation**:
```typescript
CREATE TABLE platform_admin.email_template_variants (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES email_templates(id),
  variant_name TEXT, -- 'A', 'B', 'Control'
  subject TEXT,
  html_body TEXT,
  text_body TEXT,
  traffic_percentage INTEGER, -- 0-100
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.email_analytics (
  id UUID PRIMARY KEY,
  template_id UUID,
  variant_id UUID,
  recipient_email TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced BOOLEAN DEFAULT FALSE,
  unsubscribed BOOLEAN DEFAULT FALSE
);
```

---

### Module 4: Performance Monitoring

#### Epic 4.1: Database Query Analyzer
**Business Value**: Identify slow queries
**Priority**: 🟡 MEDIUM
**Effort**: 50 hours

**User Stories**:

**As a** Platform Admin
**I want to** see slow database queries
**So that** I can optimize performance

**Acceptance Criteria**:
- [ ] Track all queries over 500ms
- [ ] Show query text and execution plan
- [ ] Display frequency of slow queries
- [ ] Show which endpoint triggered query
- [ ] Suggest indexes
- [ ] Historical trend data

**Implementation**:
```typescript
CREATE TABLE platform_admin.slow_query_log (
  id UUID PRIMARY KEY,
  query_text TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  endpoint TEXT, -- Which API endpoint called this
  organization_id UUID,
  user_id UUID,
  query_plan JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

// Supabase function hook (via pg_stat_statements extension)
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS void AS $$
BEGIN
  INSERT INTO platform_admin.slow_query_log (
    query_text,
    execution_time_ms,
    timestamp
  )
  SELECT
    query,
    mean_exec_time::INTEGER,
    NOW()
  FROM pg_stat_statements
  WHERE mean_exec_time > 500
  ORDER BY mean_exec_time DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;
```

**Dashboard**:
```tsx
<SlowQueryDashboard />
  <QueryTable>
    Query Text | Avg Time | Count | Last Seen | Endpoint | Suggest Fix

    SELECT * FROM audits WHERE... | 2,350ms | 145 | 5 min ago | /api/engagements | Add index on client_id

    SELECT users.* FROM users JOIN... | 890ms | 67 | 1 hr ago | /api/users | Optimize JOIN
  </QueryTable>

  <QueryDetail>
    <ExecutionPlan /> {/* Visual EXPLAIN ANALYZE */}
    <IndexSuggestions /> {/* Recommend indexes */}
    <HistoricalTrend /> {/* Performance over time */}
  </QueryDetail>
```

---

#### Epic 4.2: API Endpoint Performance Tracking
**Business Value**: Monitor API health
**Priority**: 🟡 MEDIUM
**Effort**: 40 hours

**User Stories**:

**As a** Platform Admin
**I want to** track API endpoint response times
**So that** I can identify performance bottlenecks

**Acceptance Criteria**:
- [ ] Track response time for all endpoints
- [ ] P50, P95, P99 percentiles
- [ ] Error rate per endpoint
- [ ] Request volume
- [ ] Slowest endpoints dashboard
- [ ] Alerts for degraded performance

**Implementation**:
```typescript
CREATE TABLE platform_admin.api_performance (
  id UUID PRIMARY KEY,
  endpoint TEXT NOT NULL, -- '/api/engagements'
  method TEXT, -- 'GET', 'POST'
  response_time_ms INTEGER,
  status_code INTEGER,
  organization_id UUID,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

// Aggregate table for faster queries
CREATE TABLE platform_admin.api_performance_hourly (
  endpoint TEXT,
  method TEXT,
  hour TIMESTAMPTZ,
  request_count INTEGER,
  avg_response_time_ms INTEGER,
  p50_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  p99_response_time_ms INTEGER,
  error_count INTEGER,
  PRIMARY KEY (endpoint, method, hour)
);
```

**Dashboard**:
```tsx
<APIPerformanceDashboard />
  <EndpointTable>
    Endpoint | Method | Requests/hr | Avg Time | P95 | P99 | Errors | Status

    /api/engagements | GET | 1,245 | 145ms | 320ms | 890ms | 0.2% | 🟢
    /api/reports/create | POST | 67 | 2,340ms | 4,200ms | 8,900ms | 1.2% | 🔴
  </EndpointTable>

  <ResponseTimeChart>
    {/* Line chart of P50/P95/P99 over time */}
  </ResponseTimeChart>

  <ErrorRateChart>
    {/* Bar chart of error rates by endpoint */}
  </ErrorRateChart>
```

---

#### Epic 4.3: Resource Utilization Metrics
**Business Value**: Capacity planning
**Priority**: 🟢 LOW
**Effort**: 30 hours

**User Stories**:

**As a** Platform Admin
**I want to** see resource utilization trends
**So that** I can plan capacity

**Acceptance Criteria**:
- [ ] Database size growth
- [ ] Storage usage trends
- [ ] Connection pool utilization
- [ ] Edge function invocation rates
- [ ] Realtime connection count

**Dashboard**:
```tsx
<ResourceUtilizationDashboard />
  <DatabaseMetrics>
    - Database Size: 45.2 GB (growing 2.3 GB/month)
    - Connection Pool: 45/100 active
    - Replication Lag: 0ms
  </DatabaseMetrics>

  <StorageMetrics>
    - Total Storage: 124 GB
    - Growth Rate: 5.6 GB/month
    - Largest Orgs: [list]
  </StorageMetrics>

  <EdgeFunctionMetrics>
    - Total Invocations: 1.2M/day
    - Most Used: admin-auth (45K/day)
    - Avg Execution Time: 120ms
  </EdgeFunctionMetrics>
```

---

## Implementation Roadmap

### Phase 1: Billing Foundation (Weeks 1-6)
**Goal**: Enable payment processing and subscriptions

**Week 1-2: Stripe Integration**
- [ ] Configure Stripe API integration
- [ ] Implement webhook handling
- [ ] Customer creation workflow
- [ ] Payment method storage
- [ ] Testing and error handling

**Week 3-4: Subscription Plans**
- [ ] Build subscription plan manager UI
- [ ] Create plan database schema
- [ ] Sync plans with Stripe
- [ ] Feature limit enforcement
- [ ] Plan upgrade/downgrade logic

**Week 5-6: Customer Billing Portal**
- [ ] Build billing overview page
- [ ] Payment method management
- [ ] Subscription upgrade/downgrade UI
- [ ] Invoice history
- [ ] Usage dashboard

**Deliverables**:
- ✅ Organizations can subscribe to paid plans
- ✅ Payment processing functional
- ✅ Basic billing portal live

---

### Phase 2: Billing Advanced Features (Weeks 7-10)
**Goal**: Automated billing operations

**Week 7-8: Invoice & Dunning**
- [ ] Invoice generation automation
- [ ] PDF invoice generation
- [ ] Email delivery
- [ ] Payment failure handling
- [ ] Dunning workflow and emails

**Week 9: Trial Management**
- [ ] Trial period configuration
- [ ] Trial reminder emails
- [ ] Auto-conversion logic
- [ ] Trial extension capability

**Week 10: Revenue Analytics**
- [ ] MRR/ARR calculations
- [ ] Revenue dashboard
- [ ] Churn tracking
- [ ] Trial conversion metrics

**Deliverables**:
- ✅ Fully automated billing
- ✅ Revenue recovery through dunning
- ✅ Business metrics dashboard

---

### Phase 3: Admin Tools (Weeks 11-14)
**Goal**: Improve admin efficiency

**Week 11-12: User Impersonation**
- [ ] Organization impersonation
- [ ] User impersonation
- [ ] Impersonation banner UI
- [ ] Security restrictions
- [ ] Audit logging

**Week 13: Email Templates**
- [ ] Template editor UI
- [ ] Template versioning
- [ ] Preview functionality
- [ ] Variable system
- [ ] Test email sending

**Week 14: Performance Monitoring**
- [ ] Slow query dashboard
- [ ] API performance tracking
- [ ] Resource utilization metrics
- [ ] Performance alerts

**Deliverables**:
- ✅ Admins can impersonate users for debugging
- ✅ Customizable email templates
- ✅ Performance visibility

---

### Phase 4: Polish & Launch (Weeks 15-16)
**Goal**: Production readiness

**Week 15: Testing & QA**
- [ ] End-to-end billing tests
- [ ] Payment failure scenarios
- [ ] Impersonation security testing
- [ ] Email template rendering tests
- [ ] Performance testing
- [ ] Load testing

**Week 16: Documentation & Launch**
- [ ] Admin documentation
- [ ] Customer billing guide
- [ ] Email template guide
- [ ] Performance monitoring guide
- [ ] Launch to production
- [ ] Monitor and iterate

**Deliverables**:
- ✅ Production-ready billing system
- ✅ Comprehensive admin tools
- ✅ Full documentation

---

## Resource Requirements

### Team Composition

**Required Roles**:

1. **Senior Full-Stack Engineer** (2 people)
   - Stripe integration expertise
   - React/TypeScript frontend
   - Supabase/PostgreSQL backend
   - Edge function development
   - **Allocation**: 100% for 16 weeks
   - **Cost**: 2 × $60-80/hr × 640 hours = $76,800-102,400

2. **UI/UX Designer** (1 person)
   - Email template designs
   - Billing portal UX
   - Admin dashboard designs
   - **Allocation**: 25% for 16 weeks (160 hours)
   - **Cost**: $80-120/hr × 160 hours = $12,800-19,200

3. **QA Engineer** (1 person)
   - Payment testing
   - Impersonation security testing
   - Email template testing
   - **Allocation**: 50% for weeks 13-16 (80 hours)
   - **Cost**: $40-60/hr × 80 hours = $3,200-4,800

4. **Product Manager** (you!)
   - Requirements
   - Prioritization
   - Stakeholder communication
   - **Allocation**: 25% for 16 weeks (160 hours)
   - **Cost**: $80-120/hr × 160 hours = $12,800-19,200

5. **Technical Writer** (contractor)
   - Documentation
   - User guides
   - **Allocation**: 40 hours in Week 16
   - **Cost**: $60-80/hr × 40 hours = $2,400-3,200

**Total Team Cost**: $108,000-148,800

### External Services

**Stripe**:
- Transaction fees: 2.9% + $0.30 per transaction
- No monthly fee for standard integration
- **Estimated Year 1**: Negligible (few customers initially)

**Email Service** (already using Resend):
- Current plan sufficient
- **Cost**: $0 (within existing limits)

**Additional Tools**:
- Sentry (error tracking): $29/month = $348/year
- Figma (design): $15/user/month = $180/year
- **Total**: ~$530/year

**Total External**: ~$530/year

---

## Budget Summary

| Category | Cost Range |
|----------|------------|
| **Engineering** (2 engineers × 16 weeks) | $76,800 - $102,400 |
| **Design** (1 designer × 25% × 16 weeks) | $12,800 - $19,200 |
| **QA** (1 engineer × 50% × 4 weeks) | $3,200 - $4,800 |
| **Product Management** (25% × 16 weeks) | $12,800 - $19,200 |
| **Documentation** (40 hours) | $2,400 - $3,200 |
| **External Services** (annual) | $530 |
| **TOTAL PROJECT COST** | **$108,530 - $149,330** |

**Recommended Budget**: **$180,000** (includes 20% contingency)

---

## Success Criteria

### Module 1: Billing & Payments

**KPIs**:
- ✅ 95%+ payment success rate
- ✅ <2% failed payment rate after dunning
- ✅ 100% of invoices auto-generated
- ✅ Trial-to-paid conversion >60%
- ✅ MRR tracking accurate to $100
- ✅ Subscription changes processed <5 seconds

**User Acceptance**:
- ✅ Organizations can subscribe without support
- ✅ Payment failures handled automatically
- ✅ Billing portal rated 4/5+ by users

### Module 2: User Impersonation

**KPIs**:
- ✅ Support ticket resolution time reduced 30%
- ✅ 100% of impersonation sessions logged
- ✅ Zero security incidents from impersonation
- ✅ Average debugging time reduced 50%

**User Acceptance**:
- ✅ Admins use impersonation weekly
- ✅ No customer complaints about unauthorized access

### Module 3: Email Templates

**KPIs**:
- ✅ Email open rate >40%
- ✅ All transactional emails customized
- ✅ Template editing time <10 minutes
- ✅ Zero email rendering issues

**User Acceptance**:
- ✅ Marketing team can edit emails without engineering
- ✅ Emails match brand guidelines

### Module 4: Performance Monitoring

**KPIs**:
- ✅ All slow queries identified (>500ms)
- ✅ API P95 response time <500ms
- ✅ Performance alerts trigger before customer impact
- ✅ 90% of suggested optimizations implemented

**User Acceptance**:
- ✅ Engineering team uses dashboard daily
- ✅ Performance regressions caught in <24 hours

---

## Risks & Mitigations

### Risk 1: Stripe Integration Complexity
**Probability**: MEDIUM
**Impact**: HIGH
**Description**: Webhook handling, edge cases (refunds, disputes, proration)

**Mitigation**:
- Use Stripe's official libraries
- Extensive testing with Stripe test mode
- Implement comprehensive error handling
- Have Stripe support contact

### Risk 2: Payment Security & PCI Compliance
**Probability**: LOW
**Impact**: CRITICAL
**Description**: Handling payment data incorrectly

**Mitigation**:
- Use Stripe Elements (Stripe handles card data)
- Never store card numbers in our database
- Use Stripe's PCI-compliant infrastructure
- Security audit before launch

### Risk 3: Email Deliverability Issues
**Probability**: MEDIUM
**Impact**: MEDIUM
**Description**: Emails going to spam

**Mitigation**:
- Use Resend (already configured)
- Proper SPF/DKIM/DMARC setup
- Monitor bounce rates
- Email warmup for high volume

### Risk 4: Impersonation Security Breach
**Probability**: LOW
**Impact**: HIGH
**Description**: Unauthorized access to customer data

**Mitigation**:
- Comprehensive audit logging
- Time-limited sessions (1 hour max)
- Restrict destructive actions
- Require re-authentication for impersonation
- Regular security audits

### Risk 5: Performance Monitoring Overhead
**Probability**: MEDIUM
**Impact**: LOW
**Description**: Tracking adds latency

**Mitigation**:
- Async logging (non-blocking)
- Sample high-frequency endpoints (10% sampling)
- Separate performance DB
- Monitor monitoring overhead

### Risk 6: Scope Creep
**Probability**: HIGH
**Impact**: MEDIUM
**Description**: Additional features requested during development

**Mitigation**:
- Strict change control process
- Phase 2 backlog for nice-to-haves
- Weekly stakeholder updates
- Clear MVP definition

---

## Dependencies

### Technical Dependencies

**Required Before Start**:
- ✅ Stripe account created and verified
- ✅ Resend API keys (already have)
- ✅ Development environment setup
- ✅ Supabase project access

**Required During Development**:
- ⚠️ Stripe webhook endpoint SSL certificate
- ⚠️ Email sending domain verified
- ⚠️ Admin panel infrastructure ready (already exists)

### External Dependencies

**Stripe**:
- API stability
- Webhook delivery reliability
- Support response time

**Resend**:
- Email delivery SLA
- Template rendering

### Internal Dependencies

**Platform Stability**:
- Admin panel must be functional
- Database migrations must work
- Edge functions must be reliable

**Team Availability**:
- 2 full-time engineers for 16 weeks
- Design resources as needed
- QA resources in weeks 13-16

---

## Communication Plan

### Stakeholders

**Executive Team**:
- **Update Frequency**: Bi-weekly (every 2 weeks)
- **Format**: Executive summary (1 page)
- **Focus**: Progress, budget, risks, timeline

**Engineering Team**:
- **Update Frequency**: Daily standup
- **Format**: 15-minute sync
- **Focus**: Blockers, progress, technical decisions

**Design Team**:
- **Update Frequency**: Weekly
- **Format**: Design review
- **Focus**: UI/UX feedback, iterations

**QA Team**:
- **Update Frequency**: Starting week 13, daily
- **Format**: Bug triage
- **Focus**: Test results, critical issues

**Customer Success**:
- **Update Frequency**: Weekly in weeks 14-16
- **Format**: Demo + Q&A
- **Focus**: Feature training, documentation

### Deliverable Schedule

**Week 2**: Stripe integration demo
**Week 4**: Subscription plans demo
**Week 6**: Customer billing portal demo
**Week 8**: Invoice automation demo
**Week 10**: Revenue dashboard demo
**Week 12**: Impersonation demo
**Week 14**: Email templates demo
**Week 16**: Final launch presentation

---

## Go/No-Go Decision

### Proceed If:

✅ **Budget Approved**: $180K allocated
✅ **Team Committed**: 2 engineers available full-time for 16 weeks
✅ **Business Case Clear**: Revenue model defined (plan pricing)
✅ **Stripe Account Ready**: Approved and verified
✅ **Infrastructure Stable**: <5 P1 bugs in platform
✅ **Stakeholder Buy-in**: Executive team aligned

### Do Not Proceed If:

❌ Budget not available
❌ Engineering team unavailable
❌ Platform has stability issues
❌ No clear revenue model
❌ Regulatory/legal concerns unresolved

---

## Post-Launch Plan

### Week 17-20: Monitoring & Iteration

**Activities**:
- Monitor payment success rates
- Track billing portal usage
- Review impersonation audit logs
- Analyze email open/click rates
- Performance optimization

**Success Metrics Review**:
- Weekly review of all KPIs
- Customer feedback collection
- Bug fix prioritization

### Month 4-6: Phase 2 Planning

**Potential Phase 2 Features**:
- Multi-currency support
- Advanced usage-based billing
- Automated tax calculation (Stripe Tax)
- Reseller/channel partner billing
- Advanced email A/B testing
- Custom performance dashboards
- Advanced impersonation (audit trail replay)

---

## Conclusion & Recommendation

### Executive Summary

The admin panel currently lacks **critical revenue-generation capabilities** (billing) and **operational efficiency tools** (impersonation, email templates, performance monitoring).

**Recommendation**: ✅ **APPROVE & PROCEED**

**Why**:
1. **Business Critical**: Cannot monetize platform without billing
2. **Competitive Requirement**: All SaaS platforms have these features
3. **ROI Positive**: 18-24 month payback through subscription revenue
4. **Manageable Scope**: 16 weeks, 2 engineers, clear deliverables
5. **Low Risk**: Using proven technologies (Stripe, existing stack)

**Expected Outcomes**:
- ✅ Platform can generate revenue (subscription billing)
- ✅ Admins 30% more efficient (impersonation saves time)
- ✅ Better customer communication (customized emails)
- ✅ Proactive performance management (monitoring tools)

**Next Steps**:
1. **Week 0**: Secure budget approval ($180K)
2. **Week 0**: Assign engineering team (2 engineers)
3. **Week 0**: Create Stripe account
4. **Week 1**: Kick-off meeting
5. **Week 1**: Begin Phase 1 development

---

**Project Manager Signature**: _______________________
**Date**: 2025-01-23
**Status**: AWAITING APPROVAL

---

## Appendix A: Detailed User Stories

[See full user story breakdown in separate document]

## Appendix B: Technical Architecture Diagrams

[See architecture diagrams in separate document]

## Appendix C: Test Plans

[See comprehensive test plans in separate document]
