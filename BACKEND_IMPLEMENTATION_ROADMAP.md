# BACKEND IMPLEMENTATION ROADMAP
**Obsidian Audit Management Platform - Build 37494**

**Date:** November 29, 2025
**Version:** 1.0
**Status:** Planning
**Objective:** Transform frontend-complete platform into full-stack production system

---

## EXECUTIVE SUMMARY

### Mission

Implement the complete Supabase backend infrastructure to enable data persistence, API functionality, real-time collaboration, and production deployment of the Obsidian Audit Management Platform.

### Current State

- ✅ **Frontend:** 100% complete, production-ready
- ❌ **Backend:** 0% complete, not started
- 🎯 **Goal:** Full-stack production deployment

### Timeline Overview

**Total Duration:** 14-18 weeks (3.5-4.5 months)

- **Phase 1:** Database Schema & Core Tables (3 weeks)
- **Phase 2:** Authentication & Multi-Tenancy (2 weeks)
- **Phase 3:** Core Audit Tools Backend (4 weeks)
- **Phase 4:** Advanced Features & Integrations (3 weeks)
- **Phase 5:** File Storage & Document Management (2 weeks)
- **Phase 6:** Testing, Optimization & Deployment (2-4 weeks)

### Resource Requirements

**Team Composition:**
- 1 Senior Backend Engineer (Lead)
- 1 Mid-level Backend Engineer
- 1 Database Engineer/DBA
- 1 DevOps Engineer (part-time)
- 1 QA Engineer (Weeks 13+)

**Tools & Services:**
- Supabase Pro account ($25/month)
- GitHub Actions (CI/CD)
- Vercel/Netlify (frontend hosting)
- Resend (email service) - already configured
- Sentry (error tracking) - optional

---

## PHASE 1: DATABASE SCHEMA & CORE TABLES
**Duration:** 3 weeks (Weeks 1-3)

### Week 1: Core Platform Tables

#### 1.1 Organizations & Users

**Tables to Create:**

**`organizations` table:**
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  domain TEXT,
  subscription_tier TEXT DEFAULT 'trial',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
```

**`organization_members` table:**
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'partner', 'manager', 'senior', 'staff', 'viewer')),
  department TEXT,
  job_title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- RLS Policies
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));
```

**`user_profiles` table:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  locale TEXT DEFAULT 'en-US',
  notification_preferences JSONB DEFAULT '{}',
  accessibility_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());
```

#### 1.2 Clients & Engagements

**`clients` table:**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  industry TEXT,
  entity_type TEXT,
  tax_id TEXT,
  fiscal_year_end TEXT,
  website TEXT,
  address JSONB,
  contacts JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  risk_rating TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view clients"
  ON clients FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage clients"
  ON clients FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_clients_organization ON clients(organization_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_name ON clients(name);
```

**`engagements` table:**
```sql
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  fiscal_year_end DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'fieldwork', 'review', 'reporting', 'completed', 'archived')),
  risk_rating TEXT,
  materiality_amount DECIMAL(15,2),
  start_date DATE,
  fieldwork_start DATE,
  fieldwork_end DATE,
  report_date DATE,
  budget_hours INTEGER,
  actual_hours INTEGER,
  team_members JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view engagements"
  ON engagements FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organization members can manage engagements"
  ON engagements FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_engagements_organization ON engagements(organization_id);
CREATE INDEX idx_engagements_client ON engagements(client_id);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_engagements_dates ON engagements(start_date, report_date);
```

**Deliverables - Week 1:**
- ✅ Core platform tables created
- ✅ RLS policies implemented
- ✅ Indexes optimized
- ✅ Migration files documented
- ✅ Basic CRUD operations tested

---

### Week 2: Audit Program Tables

#### 2.1 Risk Assessment

**`risk_assessments` table:**
```sql
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  business_profile JSONB NOT NULL,
  risk_areas JSONB NOT NULL DEFAULT '[]',
  fraud_assessment JSONB,
  it_assessment JSONB,
  overall_risk_rating TEXT,
  heat_map_data JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'reassessed')),
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view risk assessments"
  ON risk_assessments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_risk_assessments_engagement ON risk_assessments(engagement_id);
```

#### 2.2 Audit Programs & Procedures

**`audit_programs` table:**
```sql
CREATE TABLE audit_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID,
  risk_assessment_id UUID REFERENCES risk_assessments(id),
  status TEXT DEFAULT 'active',
  total_procedures INTEGER DEFAULT 0,
  completed_procedures INTEGER DEFAULT 0,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audit_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view audit programs"
  ON audit_programs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_audit_programs_engagement ON audit_programs(engagement_id);
```

**`audit_procedures` table:**
```sql
CREATE TABLE audit_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES audit_programs(id) ON DELETE CASCADE,
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  instructions TEXT,
  category TEXT,
  priority TEXT CHECK (priority IN ('required', 'recommended', 'optional')),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'reviewed', 'approved')),
  assigned_to UUID REFERENCES auth.users(id),
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  evidence_checklist JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  conclusion TEXT,
  preparer_signoff JSONB,
  reviewer_signoff JSONB,
  manager_signoff JSONB,
  partner_signoff JSONB,
  sequence_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audit_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view procedures"
  ON audit_procedures FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Assigned users can update procedures"
  ON audit_procedures FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ) AND (
      assigned_to = auth.uid() OR
      auth.uid() IN (
        SELECT user_id FROM organization_members
        WHERE organization_id = audit_procedures.organization_id
        AND role IN ('partner', 'manager', 'admin')
      )
    )
  );

-- Indexes
CREATE INDEX idx_audit_procedures_program ON audit_procedures(program_id);
CREATE INDEX idx_audit_procedures_engagement ON audit_procedures(engagement_id);
CREATE INDEX idx_audit_procedures_assigned ON audit_procedures(assigned_to);
CREATE INDEX idx_audit_procedures_status ON audit_procedures(status);
```

**Deliverables - Week 2:**
- ✅ Risk assessment tables created
- ✅ Audit program tables created
- ✅ Procedure management tables created
- ✅ Complex RLS policies tested
- ✅ Performance indexes validated

---

### Week 3: Audit Tools Tables

#### 3.1 Materiality & Sampling

**`materiality_calculations` table:**
```sql
CREATE TABLE materiality_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  benchmark_type TEXT NOT NULL,
  benchmark_amount DECIMAL(15,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  overall_materiality DECIMAL(15,2) NOT NULL,
  performance_materiality DECIMAL(15,2) NOT NULL,
  clearly_trivial DECIMAL(15,2) NOT NULL,
  component_allocations JSONB DEFAULT '[]',
  rationale TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE materiality_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view materiality"
  ON materiality_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_materiality_engagement ON materiality_calculations(engagement_id);
```

**`sampling_plans` table:**
```sql
CREATE TABLE sampling_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE CASCADE,
  sampling_method TEXT NOT NULL CHECK (sampling_method IN ('mus', 'classical_variables', 'attributes')),
  population_size INTEGER NOT NULL,
  population_value DECIMAL(15,2),
  confidence_level DECIMAL(5,2) NOT NULL,
  tolerable_misstatement DECIMAL(15,2),
  expected_misstatement DECIMAL(15,2),
  sample_size INTEGER NOT NULL,
  calculation_details JSONB NOT NULL,
  selected_items JSONB DEFAULT '[]',
  results JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE sampling_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view sampling plans"
  ON sampling_plans FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_sampling_plans_engagement ON sampling_plans(engagement_id);
CREATE INDEX idx_sampling_plans_procedure ON sampling_plans(procedure_id);
```

#### 3.2 Confirmations & Analytical Procedures

**`confirmations` table:**
```sql
CREATE TABLE confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('ar', 'ap', 'bank', 'legal', 'other')),
  account_name TEXT NOT NULL,
  account_number TEXT,
  balance DECIMAL(15,2),
  status TEXT DEFAULT 'not_sent' CHECK (status IN ('not_sent', 'sent', 'received', 'reconciled', 'exception')),
  sent_date DATE,
  response_date DATE,
  confirmed_balance DECIMAL(15,2),
  exceptions JSONB DEFAULT '[]',
  alternative_procedures JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view confirmations"
  ON confirmations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_confirmations_engagement ON confirmations(engagement_id);
CREATE INDEX idx_confirmations_type ON confirmations(confirmation_type);
CREATE INDEX idx_confirmations_status ON confirmations(status);
```

**`analytical_procedures` table:**
```sql
CREATE TABLE analytical_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ratio', 'trend', 'variance', 'benford')),
  title TEXT NOT NULL,
  current_period_data JSONB NOT NULL,
  prior_period_data JSONB,
  industry_benchmarks JSONB,
  calculated_ratios JSONB,
  variance_analysis JSONB,
  threshold_exceeded BOOLEAN DEFAULT false,
  explanation TEXT,
  follow_up_procedures JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE analytical_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view analytical procedures"
  ON analytical_procedures FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_analytical_procedures_engagement ON analytical_procedures(engagement_id);
```

#### 3.3 Findings & Adjustments

**`audit_findings` table:**
```sql
CREATE TABLE audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id),
  finding_type TEXT NOT NULL CHECK (finding_type IN ('control_deficiency', 'misstatement', 'disclosure', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('significant', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_description TEXT,
  quantitative_impact DECIMAL(15,2),
  risk_areas JSONB DEFAULT '[]',
  management_response TEXT,
  remediation_plan TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view findings"
  ON audit_findings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_audit_findings_engagement ON audit_findings(engagement_id);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX idx_audit_findings_status ON audit_findings(status);
```

**`audit_adjustments` table:**
```sql
CREATE TABLE audit_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('aje', 'pje', 'sum')),
  number TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  materiality_impact DECIMAL(15,2),
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'posted', 'passed')),
  rationale TEXT,
  finding_id UUID REFERENCES audit_findings(id),
  proposed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE audit_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view adjustments"
  ON audit_adjustments FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_audit_adjustments_engagement ON audit_adjustments(engagement_id);
CREATE INDEX idx_audit_adjustments_type ON audit_adjustments(adjustment_type);
CREATE INDEX idx_audit_adjustments_status ON audit_adjustments(status);
```

**Deliverables - Week 3:**
- ✅ All audit tool tables created
- ✅ Complete RLS policies implemented
- ✅ Cross-table relationships validated
- ✅ Data integrity constraints tested
- ✅ Performance benchmarks established

---

## PHASE 2: AUTHENTICATION & MULTI-TENANCY
**Duration:** 2 weeks (Weeks 4-5)

### Week 4: Authentication & Authorization

#### 4.1 Supabase Auth Setup

**Authentication Configuration:**

```typescript
// supabase/config.toml
[auth]
site_url = "https://app.obsidianaudit.com"
additional_redirect_urls = ["http://localhost:5173"]
enable_signup = false  # Invitation-only
enable_email_confirmations = true
enable_phone_confirmations = false

[auth.email]
enable_signup = false
double_confirm_changes = true
max_frequency = "1h"

[auth.sessions]
inactivity_timeout = "8h"  # Session timeout
refresh_token_rotation = true
```

**Email Templates:**

```sql
-- Invitation Email Template
INSERT INTO auth.email_templates (template_name, subject, body) VALUES
('invite', 'You''ve been invited to Obsidian Audit',
'<h1>Join Obsidian Audit</h1>
<p>You have been invited to join {{ .OrganizationName }} on Obsidian Audit.</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invitation</a></p>
<p>This link expires in {{ .HoursUntilExpiry }} hours.</p>');
```

#### 4.2 Edge Functions: Auth & Invitations

**`invite-user` Edge Function:**

```typescript
// supabase/functions/invite-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { email, role, organizationId } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Create user with invitation metadata
  const { data: user, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        organization_id: organizationId,
        role: role,
        invited_at: new Date().toISOString()
      },
      redirectTo: `${Deno.env.get('SITE_URL')}/accept-invitation`
    }
  )

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Create organization_member record
  await supabaseAdmin.from('organization_members').insert({
    organization_id: organizationId,
    user_id: user.user.id,
    role: role,
    status: 'invited',
    invited_at: new Date().toISOString()
  })

  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Deliverables - Week 4:**
- ✅ Supabase Auth configured
- ✅ Invitation system implemented
- ✅ Email templates created
- ✅ Edge function deployed
- ✅ Integration tested

---

### Week 5: Multi-Tenant Data Isolation

#### 5.1 RLS Policy Refinement

**Comprehensive RLS Testing:**

```sql
-- Test RLS isolation between organizations
-- User from Org A should NOT see data from Org B

-- Create test function
CREATE OR REPLACE FUNCTION test_rls_isolation()
RETURNS TABLE(table_name TEXT, isolation_status TEXT) AS $$
BEGIN
  -- Test each table for cross-org data leakage
  RETURN QUERY
  SELECT 'engagements'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT
  FROM engagements
  WHERE organization_id != (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() LIMIT 1
  );
  -- Repeat for all tables...
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.2 Performance Optimization

**Partition Large Tables:**

```sql
-- Partition audit_procedures by organization_id for better performance
CREATE TABLE audit_procedures_partitioned (
  LIKE audit_procedures INCLUDING ALL
) PARTITION BY HASH (organization_id);

-- Create 16 partitions
CREATE TABLE audit_procedures_p0 PARTITION OF audit_procedures_partitioned
  FOR VALUES WITH (MODULUS 16, REMAINDER 0);
-- ... create p1-p15
```

**Database Indexes:**

```sql
-- Create composite indexes for common queries
CREATE INDEX idx_procedures_org_status_assigned
  ON audit_procedures(organization_id, status, assigned_to);

CREATE INDEX idx_engagements_org_client_status
  ON engagements(organization_id, client_id, status);

CREATE INDEX idx_findings_org_severity_status
  ON audit_findings(organization_id, severity, status);

-- Create GIN indexes for JSONB columns
CREATE INDEX idx_risk_areas_jsonb ON risk_assessments USING GIN (risk_areas);
CREATE INDEX idx_team_members_jsonb ON engagements USING GIN (team_members);
```

**Deliverables - Week 5:**
- ✅ RLS isolation verified across all tables
- ✅ Performance indexes created
- ✅ Query optimization completed
- ✅ Load testing performed (1000+ concurrent users)
- ✅ Multi-tenant security audit passed

---

## PHASE 3: CORE AUDIT TOOLS BACKEND
**Duration:** 4 weeks (Weeks 6-9)

### Week 6: Materiality & Sampling APIs

#### 6.1 Materiality Calculator Edge Function

**`calculate-materiality` Edge Function:**

```typescript
// supabase/functions/calculate-materiality/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MaterialityInput {
  engagementId: string
  benchmarkType: string
  benchmarkAmount: number
  percentage: number
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const input: MaterialityInput = await req.json()

  // Calculate materiality values
  const overallMateriality = input.benchmarkAmount * (input.percentage / 100)
  const performanceMateriality = overallMateriality * 0.75
  const clearlyTrivial = overallMateriality * 0.05

  // Validate user has access to engagement
  const { data: engagement } = await supabase
    .from('engagements')
    .select('organization_id')
    .eq('id', input.engagementId)
    .single()

  if (!engagement) {
    return new Response(JSON.stringify({ error: 'Engagement not found' }), {
      status: 404
    })
  }

  // Save calculation
  const { data, error } = await supabase
    .from('materiality_calculations')
    .insert({
      engagement_id: input.engagementId,
      organization_id: engagement.organization_id,
      benchmark_type: input.benchmarkType,
      benchmark_amount: input.benchmarkAmount,
      percentage: input.percentage,
      overall_materiality: overallMateriality,
      performance_materiality: performanceMateriality,
      clearly_trivial: clearlyTrivial
    })
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400
    })
  }

  // Update engagement with materiality
  await supabase
    .from('engagements')
    .update({ materiality_amount: overallMateriality })
    .eq('id', input.engagementId)

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

#### 6.2 Sampling Calculator Edge Function

**`calculate-sampling` Edge Function:**

```typescript
// supabase/functions/calculate-sampling/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface SamplingInput {
  engagementId: string
  procedureId?: string
  samplingMethod: 'mus' | 'classical_variables' | 'attributes'
  populationSize: number
  populationValue?: number
  confidenceLevel: number
  tolerableMisstatement?: number
  expectedMisstatement?: number
  expectedErrorRate?: number
  tolerableErrorRate?: number
}

// Reliability factors table for MUS
const RELIABILITY_FACTORS = {
  0: { 90: 2.31, 95: 3.00, 99: 4.61 },
  1: { 90: 3.89, 95: 4.75, 99: 6.64 },
  2: { 90: 5.33, 95: 6.30, 99: 8.41 },
  3: { 90: 6.69, 95: 7.76, 99: 10.05 }
}

function calculateMUSSampleSize(input: SamplingInput): number {
  const { populationValue, tolerableMisstatement, expectedMisstatement, confidenceLevel } = input
  const rf = RELIABILITY_FACTORS[0][confidenceLevel]
  return Math.ceil((populationValue! * rf) / tolerableMisstatement!)
}

function calculateClassicalVariablesSampleSize(input: SamplingInput): number {
  // Implement classical variables sampling formula
  const { populationSize, confidenceLevel } = input
  const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 99 ? 2.58 : 1.645
  // Simplified calculation - use proper formula in production
  return Math.ceil((zScore ** 2 * 0.5 * 0.5 * populationSize) /
    (0.05 ** 2 * (populationSize - 1) + zScore ** 2 * 0.5 * 0.5))
}

function calculateAttributesSampleSize(input: SamplingInput): number {
  // Implement attributes sampling formula
  const { populationSize, expectedErrorRate, tolerableErrorRate, confidenceLevel } = input
  const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 99 ? 2.58 : 1.645
  return Math.ceil((zScore ** 2 * expectedErrorRate! * (1 - expectedErrorRate!)) /
    (tolerableErrorRate! ** 2))
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  const input: SamplingInput = await req.json()

  let sampleSize: number
  let calculationDetails: any = {}

  // Calculate sample size based on method
  switch (input.samplingMethod) {
    case 'mus':
      sampleSize = calculateMUSSampleSize(input)
      calculationDetails = {
        method: 'MUS',
        reliabilityFactor: RELIABILITY_FACTORS[0][input.confidenceLevel],
        formula: '(Population Value × RF) / Tolerable Misstatement'
      }
      break
    case 'classical_variables':
      sampleSize = calculateClassicalVariablesSampleSize(input)
      calculationDetails = {
        method: 'Classical Variables',
        formula: 'Standard statistical formula'
      }
      break
    case 'attributes':
      sampleSize = calculateAttributesSampleSize(input)
      calculationDetails = {
        method: 'Attributes',
        formula: 'Error rate-based formula'
      }
      break
  }

  // Save sampling plan
  const { data, error } = await supabase
    .from('sampling_plans')
    .insert({
      engagement_id: input.engagementId,
      procedure_id: input.procedureId,
      sampling_method: input.samplingMethod,
      population_size: input.populationSize,
      population_value: input.populationValue,
      confidence_level: input.confidenceLevel,
      tolerable_misstatement: input.tolerableMisstatement,
      expected_misstatement: input.expectedMisstatement,
      sample_size: sampleSize,
      calculation_details: calculationDetails
    })
    .select()
    .single()

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

**Deliverables - Week 6:**
- ✅ Materiality calculator API complete
- ✅ Sampling calculator API complete
- ✅ Statistical formulas validated
- ✅ Frontend integration tested
- ✅ Data persistence verified

---

### Week 7: Confirmations & Analytical Procedures APIs

#### 7.1 Confirmations Management

**Edge Function: `manage-confirmations`**

```typescript
// CRUD operations for confirmations
// Email integration for sending confirmation requests
// Status tracking workflow
// Exception handling
```

#### 7.2 Analytical Procedures Engine

**Edge Function: `run-analytical-procedures`**

```typescript
// Ratio calculations
// Trend analysis algorithms
// Variance analysis
// Benford's Law implementation
```

**Deliverables - Week 7:**
- ✅ Confirmations CRUD API complete
- ✅ Email integration for confirmations
- ✅ Analytical procedures engine built
- ✅ Calculation accuracy validated
- ✅ Frontend connected

---

### Week 8: Review Notes & Sign-Off Workflows

#### 8.1 Review Notes System

**`review_notes` table:**

```sql
CREATE TABLE review_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  note TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  preparer_response TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Edge Function: `manage-review-notes`**

```typescript
// Create review note
// Assign to preparer
// Track responses
// Send email notifications
// Mark as resolved
```

#### 8.2 Sign-Off Workflow

**`signoffs` table:**

```sql
CREATE TABLE signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT CHECK (entity_type IN ('procedure', 'section', 'engagement')),
  entity_id UUID,
  role TEXT CHECK (role IN ('preparer', 'reviewer', 'manager', 'partner')),
  user_id UUID REFERENCES auth.users(id),
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  signature_data JSONB,
  comments TEXT,
  locked BOOLEAN DEFAULT false
);
```

**Edge Function: `sign-off`**

```typescript
// Digital signature creation
// Multi-level approval workflow
// Lock content after final sign-off
// Delegation handling
// Audit trail
```

**Deliverables - Week 8:**
- ✅ Review notes system complete
- ✅ Sign-off workflow implemented
- ✅ Email notifications functional
- ✅ Digital signatures working
- ✅ Audit trail verified

---

### Week 9: Audit Reports & Strategy Memos

#### 9.1 Audit Reports

**`audit_reports` table:**

```sql
CREATE TABLE audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT CHECK (report_type IN ('unqualified', 'qualified', 'adverse', 'disclaimer', 'management_letter')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,  -- Tiptap JSON format
  version INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('draft', 'in_review', 'final')),
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID[],
  issued_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Edge Function: `generate-audit-report-pdf`**

```typescript
// Convert Tiptap JSON to PDF
// Apply firm branding
// Insert findings dynamically
// Generate PDF
// Store in Supabase Storage
```

#### 9.2 Audit Strategy Memos

**`audit_strategy_memos` table:**

```sql
CREATE TABLE audit_strategy_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_information JSONB,
  engagement_information JSONB,
  risk_assessment_summary JSONB,
  audit_approach JSONB,
  resource_allocation JSONB,
  timeline JSONB,
  other_matters JSONB,
  planning_checklist JSONB DEFAULT '[]',
  checklist_completion INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Deliverables - Week 9:**
- ✅ Audit reports backend complete
- ✅ PDF generation working
- ✅ Strategy memos backend complete
- ✅ Checklist tracking functional
- ✅ All AU-C standards supported

---

## PHASE 4: ADVANCED FEATURES & INTEGRATIONS
**Duration:** 3 weeks (Weeks 10-12)

### Week 10: Real-Time Collaboration

#### 10.1 Supabase Realtime Setup

**Enable Realtime on Tables:**

```sql
-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE audit_procedures;
ALTER PUBLICATION supabase_realtime ADD TABLE review_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE engagements;
```

**Frontend Integration:**

```typescript
// Listen to procedure updates
const subscription = supabase
  .channel('procedures')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'audit_procedures',
      filter: `engagement_id=eq.${engagementId}`
    },
    (payload) => {
      // Update UI in real-time
      console.log('Procedure changed:', payload)
    }
  )
  .subscribe()
```

#### 10.2 Presence & Collaboration

**Track Active Users:**

```typescript
const presenceChannel = supabase.channel(`engagement:${engagementId}`)

// Track who's online
presenceChannel
  .on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState()
    console.log('Active users:', state)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: currentUser.id,
        name: currentUser.full_name,
        viewing: 'procedure-15'
      })
    }
  })
```

**Deliverables - Week 10:**
- ✅ Real-time updates working
- ✅ Presence tracking functional
- ✅ Collaborative editing tested
- ✅ Conflict resolution implemented
- ✅ Performance optimized

---

### Week 11: Email & Notification System

#### 11.1 Resend Integration

**Edge Function: `send-notification-email`**

```typescript
// supabase/functions/send-notification-email/index.ts
import { Resend } from 'https://esm.sh/resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const { to, subject, template, data } = await req.json()

  const emailHtml = renderTemplate(template, data)

  const { data: emailData, error } = await resend.emails.send({
    from: 'Obsidian Audit <notifications@obsidianaudit.com>',
    to: to,
    subject: subject,
    html: emailHtml
  })

  return new Response(JSON.stringify({ emailData, error }))
})
```

**Email Templates:**
- Review note assigned
- Review note response
- Sign-off requested
- Sign-off completed
- Document request sent
- Document received
- Finding created
- Engagement milestone reached

#### 11.2 In-App Notifications

**`notifications` table:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());
```

**Edge Function: `create-notification`**

```typescript
// Create notification in DB
// Send realtime notification via Supabase channel
// Optionally send email via Resend
// Optionally send push notification
```

**Deliverables - Week 11:**
- ✅ Email system integrated
- ✅ All email templates created
- ✅ In-app notifications working
- ✅ Real-time notifications functional
- ✅ Notification preferences respected

---

### Week 12: Search & Analytics

#### 12.1 Full-Text Search

**PostgreSQL Full-Text Search:**

```sql
-- Add tsvector column for full-text search
ALTER TABLE audit_procedures
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(code, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(objective, '') || ' ' ||
      coalesce(instructions, '')
    )
  ) STORED;

-- Create GIN index for fast searching
CREATE INDEX idx_procedures_search ON audit_procedures USING GIN (search_vector);

-- Search function
CREATE FUNCTION search_procedures(
  org_id UUID,
  search_query TEXT
) RETURNS TABLE (
  id UUID,
  code TEXT,
  title TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.code,
    p.title,
    ts_rank(p.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM audit_procedures p
  WHERE
    p.organization_id = org_id
    AND p.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Edge Function: `global-search`**

```typescript
// Search across:
// - Engagements
// - Clients
// - Procedures
// - Workpapers
// - Findings
// - Reports
// Return unified results with relevance ranking
```

#### 12.2 Analytics & Reporting

**Materialized Views for Analytics:**

```sql
-- Engagement statistics view
CREATE MATERIALIZED VIEW engagement_stats AS
SELECT
  e.id,
  e.organization_id,
  e.client_id,
  e.status,
  COUNT(DISTINCT ap.id) AS total_procedures,
  COUNT(DISTINCT ap.id) FILTER (WHERE ap.status = 'completed') AS completed_procedures,
  SUM(ap.estimated_hours) AS estimated_hours,
  SUM(ap.actual_hours) AS actual_hours,
  COUNT(DISTINCT af.id) AS total_findings,
  COUNT(DISTINCT af.id) FILTER (WHERE af.severity = 'significant') AS significant_findings
FROM engagements e
LEFT JOIN audit_procedures ap ON ap.engagement_id = e.id
LEFT JOIN audit_findings af ON af.engagement_id = e.id
GROUP BY e.id;

-- Refresh periodically
CREATE INDEX ON engagement_stats (organization_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY engagement_stats;
```

**Dashboard Queries:**

```typescript
// Firm-wide dashboard
// - Active engagements count
// - Total procedures this month
// - Hours logged vs budgeted
// - Findings by severity
// - Team utilization
// - Overdue procedures
```

**Deliverables - Week 12:**
- ✅ Full-text search working
- ✅ Global search functional
- ✅ Analytics views created
- ✅ Dashboard queries optimized
- ✅ Performance benchmarked

---

## PHASE 5: FILE STORAGE & DOCUMENT MANAGEMENT
**Duration:** 2 weeks (Weeks 13-14)

### Week 13: Supabase Storage Setup

#### 13.1 Storage Buckets

**Create Storage Buckets:**

```sql
-- Engagement documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('engagement-documents', 'engagement-documents', false);

-- Workpaper attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('workpapers', 'workpapers', false);

-- Audit reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-reports', 'audit-reports', false);

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

**Storage Policies:**

```sql
-- Users can upload to their organization's folder
CREATE POLICY "Organization members can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'engagement-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Users can download their organization's files
CREATE POLICY "Organization members can download files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'engagement-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM organizations
    WHERE id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

#### 13.2 Document Metadata Tracking

**`documents` table:**

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES audit_procedures(id),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  category TEXT,
  version INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can view documents"
  ON documents FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_documents_engagement ON documents(engagement_id);
CREATE INDEX idx_documents_procedure ON documents(procedure_id);
```

**Edge Function: `upload-document`**

```typescript
// Handle file upload
// Virus scanning
// Generate storage path: {org_id}/{engagement_id}/{filename}
// Create document record
// Return download URL
```

**Deliverables - Week 13:**
- ✅ Storage buckets configured
- ✅ Storage policies implemented
- ✅ File upload working
- ✅ Virus scanning integrated
- ✅ Download/preview functional

---

### Week 14: Document Management Features

#### 14.1 Version Control

**`document_versions` table:**

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);
```

**Edge Function: `create-document-version`**

```typescript
// Upload new version
// Increment version number
// Keep previous version in storage
// Update document record
// Notify relevant users
```

#### 14.2 PDF Generation

**Edge Function: `generate-pdf`**

```typescript
// Use Puppeteer or similar
// Convert HTML/JSON to PDF
// Apply firm branding
// Save to storage
// Return download link
```

**Excel Export:**

```typescript
// Use ExcelJS or similar
// Generate Excel files for:
// - Materiality calculations
// - Sampling plans
// - Adjustments journal
// - Analytical procedures
```

**Deliverables - Week 14:**
- ✅ Version control working
- ✅ PDF generation functional
- ✅ Excel export working
- ✅ Document preview implemented
- ✅ Bulk download tested

---

## PHASE 6: TESTING, OPTIMIZATION & DEPLOYMENT
**Duration:** 2-4 weeks (Weeks 15-18)

### Week 15-16: Integration Testing

#### 15.1 End-to-End Testing

**Test Scenarios:**

1. **Complete Audit Lifecycle:**
   - Create organization
   - Invite users
   - Create client
   - Create engagement
   - Perform risk assessment
   - Build audit program
   - Execute procedures
   - Upload workpapers
   - Create findings
   - Review workflow
   - Sign-off
   - Generate report
   - Archive engagement

2. **Multi-Tenant Isolation:**
   - Create 2 organizations
   - Verify complete data isolation
   - Test cross-org access attempts
   - Verify RLS enforcement

3. **Real-Time Collaboration:**
   - Multiple users editing same procedure
   - Conflict resolution
   - Presence tracking
   - Notifications

4. **Performance Testing:**
   - 1000 concurrent users
   - 10,000 procedures per engagement
   - 100MB file uploads
   - Complex search queries

#### 15.2 Security Testing

**Security Audit:**
- Penetration testing
- SQL injection attempts
- XSS vulnerability testing
- CSRF protection verification
- API authentication testing
- RLS bypass attempts
- File upload security
- Session management testing

**Deliverables - Weeks 15-16:**
- ✅ All end-to-end tests passing
- ✅ Security audit completed
- ✅ Performance benchmarks met
- ✅ Zero critical bugs
- ✅ Load testing passed

---

### Week 17: Performance Optimization

#### 17.1 Database Optimization

**Query Performance:**
```sql
-- Analyze slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Add missing indexes
-- Optimize complex queries
-- Implement query caching
```

**Connection Pooling:**
```typescript
// Configure pgBouncer
// Set connection limits
// Implement connection pooling
```

#### 17.2 Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load routes
// Split vendor bundles
// Optimize bundle size
```

**Caching Strategy:**
```typescript
// Implement React Query
// Cache API responses
// Invalidate stale data
// Optimistic updates
```

**Deliverables - Week 17:**
- ✅ Database queries optimized (<100ms p95)
- ✅ Bundle size optimized (<500KB gzipped)
- ✅ API response times <200ms p95
- ✅ Lighthouse score >90
- ✅ Core Web Vitals passing

---

### Week 18: Production Deployment

#### 18.1 Deployment Preparation

**Infrastructure Setup:**
- Configure production Supabase project
- Set up custom domain
- Configure SSL certificates
- Set up CDN
- Configure monitoring (Sentry, LogRocket)
- Set up uptime monitoring

**Environment Variables:**
```bash
# Production .env
VITE_SUPABASE_URL=https://prod.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key
VITE_RESEND_API_KEY=prod_resend_key
VITE_SENTRY_DSN=prod_sentry_dsn
```

**Database Migration:**
```bash
# Run all migrations on production
supabase db push

# Verify schema
supabase db diff

# Create backup
pg_dump production > backup.sql
```

#### 18.2 Deployment Process

**CI/CD Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Supabase Functions
        run: supabase functions deploy --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
```

**Post-Deployment Verification:**
- Smoke tests
- Health check endpoints
- Database connectivity
- Storage access
- Email delivery
- Real-time subscriptions
- Performance monitoring

**Deliverables - Week 18:**
- ✅ Production deployment successful
- ✅ All systems operational
- ✅ Monitoring configured
- ✅ Backups automated
- ✅ Rollback plan documented
- ✅ Documentation complete

---

## RESOURCE ALLOCATION & TIMELINE

### Team Structure

**Backend Team (3 engineers):**

**Senior Backend Engineer (Lead):**
- Architecture design
- Complex edge functions
- Performance optimization
- Code reviews
- **Allocation:** 100% (Weeks 1-18)

**Mid-Level Backend Engineer:**
- Edge function implementation
- API development
- Integration work
- Testing
- **Allocation:** 100% (Weeks 1-18)

**Database Engineer:**
- Schema design
- RLS policies
- Query optimization
- Migration management
- **Allocation:** 100% (Weeks 1-12), 50% (Weeks 13-18)

**DevOps Engineer:**
- Infrastructure setup
- CI/CD pipeline
- Monitoring
- Deployment
- **Allocation:** 25% (Weeks 1-14), 100% (Weeks 15-18)

**QA Engineer:**
- Test planning
- Integration testing
- Security testing
- UAT coordination
- **Allocation:** 0% (Weeks 1-12), 100% (Weeks 13-18)

### Gantt Chart

```
Phase 1: Database Schema         [████████░░░░░░░░░░░░░░░░░░░░░░░░░░] Weeks 1-3
Phase 2: Auth & Multi-Tenancy    [░░░░░░░░████████░░░░░░░░░░░░░░░░░░] Weeks 4-5
Phase 3: Core Audit Tools        [░░░░░░░░░░░░░░░░████████████████░░] Weeks 6-9
Phase 4: Advanced Features       [░░░░░░░░░░░░░░░░░░░░░░░░████████░░] Weeks 10-12
Phase 5: File Storage            [░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░] Weeks 13-14
Phase 6: Testing & Deployment    [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████] Weeks 15-18
```

### Budget Estimate

**Labor Costs (18 weeks):**
- Senior Backend Engineer: $150/hr × 40 hrs/wk × 18 wks = $108,000
- Mid-Level Backend Engineer: $100/hr × 40 hrs/wk × 18 wks = $72,000
- Database Engineer: $120/hr × 30 hrs/wk × 18 wks = $64,800
- DevOps Engineer: $110/hr × 20 hrs/wk × 18 wks = $39,600
- QA Engineer: $90/hr × 30 hrs/wk × 6 wks = $16,200

**Total Labor:** $300,600

**Infrastructure & Services:**
- Supabase Pro: $25/mo × 6 months = $150
- Vercel Pro: $20/mo × 6 months = $120
- Resend Email: $20/mo × 6 months = $120
- Sentry: $26/mo × 6 months = $156
- Misc Services: $500

**Total Infrastructure:** $1,046

**Grand Total:** $301,646

---

## SUCCESS CRITERIA

### Technical Metrics

**Performance:**
- ✅ API response time p95 < 200ms
- ✅ Database query time p95 < 100ms
- ✅ Page load time < 2 seconds
- ✅ Time to Interactive < 3 seconds
- ✅ Support 1,000 concurrent users

**Reliability:**
- ✅ 99.9% uptime
- ✅ Zero data loss
- ✅ Automatic failover
- ✅ Backup every 6 hours
- ✅ Recovery time < 1 hour

**Security:**
- ✅ Zero critical vulnerabilities
- ✅ RLS isolation verified
- ✅ Data encrypted at rest and in transit
- ✅ SOC 2 Type II ready
- ✅ GDPR compliant

**Scalability:**
- ✅ Handle 10,000+ engagements
- ✅ Support 1,000+ organizations
- ✅ Process 100GB+ documents
- ✅ Maintain performance at scale

### Business Metrics

**Functionality:**
- ✅ 100% GAAS compliance (AU-C standards)
- ✅ All 28 features implemented
- ✅ Feature parity with SAP/TeamMate
- ✅ Superior UX (9.5/10 score)

**User Acceptance:**
- ✅ Pass UAT with 3-5 audit firms
- ✅ <5 critical bugs in production
- ✅ 90%+ user satisfaction
- ✅ <10% support ticket rate

**Production Readiness:**
- ✅ All tests passing
- ✅ Documentation complete
- ✅ Training materials ready
- ✅ Support processes defined
- ✅ Deployment successful

---

## RISK MANAGEMENT

### Technical Risks

**Risk 1: Database Performance Degradation**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Implement partitioning, optimize queries early, load test frequently
- **Contingency:** Add read replicas, implement caching layer

**Risk 2: Supabase Limitations**
- **Probability:** Low
- **Impact:** High
- **Mitigation:** Validate all features in staging, test edge cases
- **Contingency:** Migrate to self-hosted PostgreSQL if needed

**Risk 3: Real-Time Scalability**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Test with 1000+ concurrent connections
- **Contingency:** Implement polling fallback for non-critical features

### Schedule Risks

**Risk 4: Feature Scope Creep**
- **Probability:** High
- **Impact:** High
- **Mitigation:** Strict change control, prioritize ruthlessly
- **Contingency:** Defer non-critical features to Phase 2

**Risk 5: Integration Complexity**
- **Probability:** Medium
- **Impact:** Medium
- **Mitigation:** Early integration testing, prototype complex features
- **Contingency:** Add 2-week buffer in schedule

**Risk 6: Team Availability**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:** Cross-train team members, document everything
- **Contingency:** Contract backup resources

---

## NEXT STEPS

### Immediate Actions (Week 0)

**Day 1-2:**
1. ✅ Review and approve roadmap
2. ✅ Assemble development team
3. ✅ Set up project management tools (Jira, GitHub Projects)
4. ✅ Create development Supabase project

**Day 3-5:**
5. ✅ Design complete database schema (ERD)
6. ✅ Set up CI/CD pipeline
7. ✅ Configure development environments
8. ✅ Create first sprint backlog

**Week 1 Kickoff:**
9. ✅ Team kickoff meeting
10. ✅ Begin Phase 1: Database Schema implementation
11. ✅ Daily standups established
12. ✅ Weekly stakeholder updates scheduled

### Ongoing Activities

**Weekly:**
- Sprint planning
- Sprint retrospectives
- Stakeholder demos
- Progress reports

**Bi-Weekly:**
- Code reviews
- Architecture reviews
- Security reviews
- Performance benchmarking

**Monthly:**
- Budget review
- Timeline adjustment
- Risk assessment
- Quality gate review

---

## APPENDICES

### A. Database Schema ERD

[Full ERD diagram to be created showing all 30+ tables and relationships]

### B. API Endpoint Specification

[Complete API documentation for all 20+ edge functions]

### C. Testing Plan

[Detailed test cases for all features, 500+ test scenarios]

### D. Deployment Checklist

[50+ item pre-deployment verification checklist]

### E. Monitoring & Alerting

[Dashboard configurations, alert thresholds, SLA definitions]

---

**Document Version:** 1.0
**Last Updated:** November 29, 2025
**Status:** Ready for Review
**Next Review:** Upon team assembly

---

## APPROVAL SIGNATURES

**Product Owner:** ___________________________ Date: ___________

**Engineering Lead:** _______________________ Date: ___________

**Project Manager:** ________________________ Date: ___________

**Finance Approval:** _______________________ Date: ___________

---

**END OF ROADMAP**
