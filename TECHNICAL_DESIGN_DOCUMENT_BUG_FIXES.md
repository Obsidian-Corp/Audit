# Technical Design Document: Bug Fixes & System Improvements
## Audit Management System - Build It Happens

**Document Version**: 1.0  
**Date**: November 30, 2025  
**Author**: Senior Software Architecture Team  
**Status**: Ready for Implementation  
**Estimated Timeline**: 12-14 weeks

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Detailed Solutions by Category](#3-detailed-solutions-by-category)
4. [Implementation Phases](#4-implementation-phases)
5. [Technical Specifications](#5-technical-specifications)
6. [Testing Strategy](#6-testing-strategy)
7. [Risk Assessment](#7-risk-assessment)
8. [Success Metrics](#8-success-metrics)
9. [Appendices](#9-appendices)

---

## 1. Executive Summary

### 1.1 Overview

This document provides comprehensive technical solutions for all 29 bugs/issues identified in the QA Production Readiness Report. The issues span authentication, data validation, file management, workflow enforcement, analytics, user experience, performance, and security.

### 1.2 Issue Breakdown

- **Critical Bugs**: 6 (must fix before any production use)
- **High Priority**: 5 (should fix before production launch)
- **Medium Priority**: 13 (fix during beta or shortly after launch)
- **Low Priority**: 5 (post-launch improvements)

### 1.3 High-Level Approach

Our solution strategy follows these principles:

1. **Fix Critical Blockers First**: Address authentication, RLS, and security issues in weeks 1-2
2. **Incremental Implementation**: Deploy fixes in phases to minimize risk
3. **Test-Driven Development**: Every fix includes comprehensive tests
4. **Backward Compatibility**: Minimize breaking changes where possible
5. **Security-First**: All changes reviewed for security implications

### 1.4 Timeline & Effort Estimate

**Total Timeline**: 12-14 weeks (3-3.5 months)

| Phase | Duration | Focus | Effort (Dev Days) |
|-------|----------|-------|-------------------|
| Phase 1: Critical Blockers | 2 weeks | Auth, RLS, Validation | 10 days |
| Phase 2: High Priority | 4 weeks | Features, Workflows | 28 days |
| Phase 3: Medium Priority | 4 weeks | Quality, Performance | 28 days |
| Phase 4: Low Priority | 2 weeks | Enhancements | 10 days |
| **Total** | **12 weeks** | | **76 dev days** |

**Team Size Recommendation**: 2-3 senior developers + 1 QA engineer

### 1.5 Risk Assessment Summary

**High Risks**:
- RLS policy changes could break data access (Mitigation: Comprehensive testing)
- Database migrations could fail (Mitigation: Rollback scripts ready)
- Breaking changes to AuthContext (Mitigation: Feature flags)

**Medium Risks**:
- Performance degradation from validation overhead (Mitigation: Benchmarking)
- User disruption from UI changes (Mitigation: Beta testing)

**Low Risks**:
- Code conflicts during parallel development (Mitigation: Clear task ownership)

---

## 2. Current Architecture Analysis

### 2.1 Existing Architecture Review

**Tech Stack**:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + ShadCN UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

**Current Strengths**:
✅ Excellent database schema design (32 tables, proper normalization)  
✅ Modern, performant frontend stack  
✅ Row Level Security enabled on all tables  
✅ Professional UI components with ShadCN  
✅ Comprehensive audit tool implementations (materiality, sampling, etc.)

**Architectural Weaknesses Causing Issues**:
❌ Inconsistent naming (firms vs organizations)  
❌ No centralized validation layer  
❌ RLS policies untested and inconsistent  
❌ No state machine for workflow enforcement  
❌ Missing file upload abstraction  
❌ No query optimization strategy

### 2.2 Root Cause Analysis

**Why do we have 29 bugs?**

1. **Rapid Development Without Testing** (BUG-002, 031, 043)
   - Zero automated tests allowed bugs to accumulate
   - No RLS verification during development

2. **Inconsistent Architectural Decisions** (BUG-001, 005, 029)
   - Database uses "organizations", code uses "firms"
   - No architectural decision records (ADRs)

3. **Missing Abstraction Layers** (BUG-021, 026, 042)
   - No validation middleware for edge functions
   - No file upload service layer
   - Direct database access without app-layer validation

4. **Incomplete Feature Implementation** (ISSUE-025, 019, 022)
   - Features started but not finished
   - Placeholder data not replaced with real queries

5. **No Workflow State Machines** (BUG-008, ISSUE-013, 024)
   - Status transitions not enforced
   - No business logic validation

### 2.3 Architectural Improvements Needed

**New Architectural Patterns to Introduce**:

1. **Validation Middleware Layer**
   - Centralized Zod schema validation
   - Applied to edge functions AND client-side

2. **State Machine Pattern**
   - XState or custom state machines for workflows
   - Engagement status, procedure status, time entry status

3. **Service Layer Abstraction**
   - FileUploadService, PDFGenerationService
   - Encapsulate Supabase Storage logic

4. **RLS Testing Framework**
   - Automated SQL tests for all policies
   - Run on every migration

5. **Repository Pattern**
   - Abstract database queries
   - Centralize query optimization

---

## 3. Detailed Solutions by Category

### 3.1 Authentication & Authorization Fixes

**Bugs Addressed**: BUG-001, BUG-002, BUG-029, BUG-030

#### 3.1.1 BUG-001: Schema Mismatch (firms vs organizations)

**Problem**: AuthContext references `firms` table and `firm_id`, but database uses `organizations` and `organization_id`.

**Solution**: Complete terminology standardization to "Organization"

**Implementation Steps**:

1. **Database Migration** (if needed):
```sql
-- supabase/migrations/[timestamp]_standardize_organizations.sql

-- If profiles table has firm_id, rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'firm_id'
  ) THEN
    ALTER TABLE user_profiles RENAME COLUMN firm_id TO organization_id;
  END IF;
END $$;

-- Update any other tables with firm_id
-- (Check all tables first with grep)
```

2. **Update TypeScript Types**:
```typescript
// src/types/database.types.ts
// BEFORE:
type Firm = Database['public']['Tables']['firms']['Row'];

// AFTER:
type Organization = Database['public']['Tables']['organizations']['Row'];

// Create type alias for backward compatibility during transition
type Firm = Organization;  // Deprecated, use Organization
```

3. **Fix AuthContext**:
```typescript
// src/contexts/AuthContext.tsx
import { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  organization: Organization | null;  // Changed from 'firm'
  organizationId: string | null;      // Changed from 'firmId'
  // ... rest
}

const fetchUserData = async (user: User) => {
  // Fetch profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile?.organization_id) {
    setProfile(profile);
    return;
  }

  // Fetch organization (NOT firm)
  const { data: organization } = await supabase
    .from('organizations')  // Changed from 'firms'
    .select('*')
    .eq('id', profile.organization_id)  // Changed from firm_id
    .single();

  setProfile(profile);
  setOrganization(organization);  // Changed from setFirm
  setOrganizationId(organization?.id || null);
};
```

4. **Global Find & Replace**:
```bash
# Find all occurrences of firm/Firm
grep -r "firm" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules

# Replace systematically:
# firm → organization
# Firm → Organization  
# firmId → organizationId
# FIRM → ORGANIZATION
```

5. **Update All Components**:
```typescript
// Example: src/components/OrgSwitcher.tsx (remove FirmSwitcher.tsx)
export function OrganizationSwitcher() {
  const { organization, organizations, switchOrganization } = useAuth();
  // Implementation
}
```

**Time Estimate**: 2 days  
**Testing**: Manual testing of login flow + automated E2E test  
**Risk**: Medium - could break existing sessions (add migration script)

---

#### 3.1.2 BUG-002, 029, 030: RLS Policy Standardization & Testing

**Problems**:
- RLS policies untested (BUG-002)
- Policies reference wrong tables (BUG-029)  
- No write policies on some tables (BUG-030)

**Solution**: Comprehensive RLS testing framework + standardized policies

**Standard RLS Policy Pattern**:
```sql
-- Pattern for organization-scoped tables

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "org_members_select_table_name"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "org_members_insert_table_name"
  ON table_name
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "org_members_update_table_name"
  ON table_name
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "org_members_delete_table_name"
  ON table_name
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

**Optimized Pattern (Performance Improvement)**:
```sql
-- Use security definer function for better performance
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id 
  FROM organization_members 
  WHERE user_id = auth.uid();
$$;

-- Then policies become:
CREATE POLICY "org_members_select_table_name"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.user_organizations()));
```

**RLS Testing Framework**:
```sql
-- supabase/tests/test_rls_policies.sql

-- Test framework setup
CREATE SCHEMA IF NOT EXISTS tests;

CREATE OR REPLACE FUNCTION tests.test_organization_isolation()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  org1_id uuid := gen_random_uuid();
  org2_id uuid := gen_random_uuid();
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  test_passed boolean := true;
BEGIN
  -- Setup: Create test organizations
  INSERT INTO organizations (id, name, slug) VALUES
    (org1_id, 'Test Org 1', 'test-org-1'),
    (org2_id, 'Test Org 2', 'test-org-2');

  -- Setup: Create test users
  INSERT INTO auth.users (id, email) VALUES
    (user1_id, 'user1@test.com'),
    (user2_id, 'user2@test.com');

  -- Setup: Assign users to organizations
  INSERT INTO organization_members (organization_id, user_id, role) VALUES
    (org1_id, user1_id, 'member'),
    (org2_id, user2_id, 'member');

  -- Test all tables
  PERFORM tests.test_table_isolation('clients', org1_id, org2_id, user1_id, user2_id);
  PERFORM tests.test_table_isolation('engagements', org1_id, org2_id, user1_id, user2_id);
  -- ... repeat for all 32 tables

  -- Cleanup
  DELETE FROM organization_members WHERE organization_id IN (org1_id, org2_id);
  DELETE FROM organizations WHERE id IN (org1_id, org2_id);
  DELETE FROM auth.users WHERE id IN (user1_id, user2_id);

  RAISE NOTICE 'Organization isolation test PASSED';
END;
$$;

CREATE OR REPLACE FUNCTION tests.test_table_isolation(
  table_name text,
  org1_id uuid,
  org2_id uuid,
  user1_id uuid,
  user2_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  record_id uuid := gen_random_uuid();
  visible_count int;
BEGIN
  -- Insert record for org1
  EXECUTE format(
    'INSERT INTO %I (id, organization_id, name) VALUES ($1, $2, $3)',
    table_name
  ) USING record_id, org1_id, 'Test Record';

  -- Switch to user2 (org2) and verify cannot see org1 data
  PERFORM set_config('request.jwt.claims', json_build_object('sub', user2_id)::text, true);
  
  EXECUTE format('SELECT count(*) FROM %I WHERE id = $1', table_name)
    INTO visible_count
    USING record_id;

  IF visible_count > 0 THEN
    RAISE EXCEPTION 'RLS VIOLATION: User2 can see User1 data in table %', table_name;
  END IF;

  -- Cleanup
  EXECUTE format('DELETE FROM %I WHERE id = $1', table_name) USING record_id;
  
  RAISE NOTICE 'Table % isolation test PASSED', table_name;
END;
$$;
```

**CI/CD Integration**:
```yaml
# .github/workflows/test-rls.yml
name: Test RLS Policies

on:
  push:
    paths:
      - 'supabase/migrations/**'
  pull_request:
    paths:
      - 'supabase/migrations/**'

jobs:
  test-rls:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Start Supabase
        run: supabase start
        
      - name: Run RLS Tests
        run: |
          psql $DATABASE_URL -f supabase/tests/test_rls_policies.sql
          psql $DATABASE_URL -c "SELECT tests.test_organization_isolation();"
```

**Migration to Fix Existing Policies**:
```sql
-- supabase/migrations/[timestamp]_fix_rls_policies.sql

-- Audit existing policies
DO $$
DECLARE
  tbl record;
  missing_policies text[];
BEGIN
  FOR tbl IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    -- Check if table has all 4 operation policies
    SELECT array_agg(cmd)
    INTO missing_policies
    FROM (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS ops(cmd)
    WHERE cmd NOT IN (
      SELECT cmd FROM pg_policies 
      WHERE tablename = tbl.tablename 
      AND schemaname = 'public'
    );

    IF array_length(missing_policies, 1) > 0 THEN
      RAISE WARNING 'Table % missing policies: %', tbl.tablename, missing_policies;
    END IF;
  END LOOP;
END $$;

-- Add missing INSERT/UPDATE/DELETE policies for key tables
-- Example for clients table:
DROP POLICY IF EXISTS "org_members_insert_clients" ON clients;
CREATE POLICY "org_members_insert_clients"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT public.user_organizations()));

DROP POLICY IF EXISTS "org_members_update_clients" ON clients;
CREATE POLICY "org_members_update_clients"
  ON clients FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT public.user_organizations()))
  WITH CHECK (organization_id IN (SELECT public.user_organizations()));

DROP POLICY IF EXISTS "org_members_delete_clients" ON clients;
CREATE POLICY "org_members_delete_clients"
  ON clients FOR DELETE TO authenticated
  USING (organization_id IN (SELECT public.user_organizations()));

-- Repeat for all 32 tables...
```

**Time Estimate**: 5 days  
**Testing**: Automated SQL tests + manual verification  
**Risk**: High - could break data access (thorough testing required)

---

### 3.2 Data Validation & Security

**Bugs Addressed**: BUG-026, ISSUE-042, ISSUE-044, VULN-003

#### 3.2.1 BUG-026 & ISSUE-042: Comprehensive Input Validation

**Problem**: No validation in edge functions, minimal application-layer validation

**Solution**: Centralized Zod validation middleware + application-layer validation

**Validation Architecture**:
```typescript
// src/lib/validation/schemas.ts

import { z } from 'zod';

// Base schemas
export const organizationIdSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const positiveNumberSchema = z.number().positive();

// Domain schemas
export const clientSchema = z.object({
  organization_id: organizationIdSchema,
  client_name: z.string().min(2).max(100),
  industry: z.string().optional(),
  fiscal_year_end: z.string().regex(/^\d{2}-\d{2}$/),  // MM-DD format
  entity_type: z.enum(['corporation', 'partnership', 'llc', 'nonprofit', 'government']),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  risk_rating: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
  website: urlSchema.optional(),
});

export const materialityCalculationSchema = z.object({
  engagement_id: z.string().uuid(),
  benchmark_type: z.enum(['total_assets', 'total_revenue', 'gross_profit', 'net_income', 'total_equity', 'custom']),
  benchmark_amount: positiveNumberSchema,
  percentage: z.number().min(0.1).max(10),  // 0.1% to 10%
}).refine(
  (data) => data.benchmark_amount > 0,
  { message: "Benchmark amount must be greater than 0" }
);

// Edge function validation middleware
export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (req: Request): Promise<z.infer<T>> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: error.errors,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  };
}
```

**Edge Function Example**:
```typescript
// supabase/functions/calculate-materiality/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schema
const requestSchema = z.object({
  engagement_id: z.string().uuid(),
  benchmark_type: z.enum(['total_assets', 'total_revenue', 'gross_profit', 'net_income', 'total_equity']),
  benchmark_amount: z.number().positive(),
  percentage: z.number().min(0.1).max(10),
});

type MaterialityRequest = z.infer<typeof requestSchema>;

serve(async (req) => {
  try {
    // Parse and validate request
    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    // Extract auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify engagement exists and user has access (RLS handles this)
    const { data: engagement, error: engagementError } = await supabase
      .from('engagements')
      .select('id, organization_id')
      .eq('id', validatedData.engagement_id)
      .single();

    if (engagementError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found or access denied' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Calculate materiality
    const overallMateriality = validatedData.benchmark_amount * (validatedData.percentage / 100);
    const performanceMateriality = overallMateriality * 0.75;
    const clearlyTrivial = performanceMateriality * 0.05;

    // Save to database
    const { data, error } = await supabase
      .from('materiality_calculations')
      .insert({
        engagement_id: validatedData.engagement_id,
        organization_id: engagement.organization_id,
        benchmark_type: validatedData.benchmark_type,
        benchmark_amount: validatedData.benchmark_amount,
        percentage: validatedData.percentage,
        overall_materiality: overallMateriality,
        performance_materiality: performanceMateriality,
        clearly_trivial: clearlyTrivial,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save calculation' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Application-Layer Validation (React)**:
```typescript
// src/hooks/useCreateClient.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { clientSchema } from '@/lib/validation/schemas';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod';

type ClientInput = z.infer<typeof clientSchema>;

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClientInput) => {
      // Validate before sending to database
      const validated = clientSchema.parse(input);

      const { data, error } = await supabase
        .from('clients')
        .insert(validated)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Success',
        description: 'Client created successfully',
      });
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create client',
        });
      }
    },
  });
}
```

**Time Estimate**: 3 days  
**Testing**: Unit tests for schemas + integration tests for edge functions  
**Risk**: Low - additive changes

---

#### 3.2.2 ISSUE-044: JSONB Schema Validation

**Problem**: JSONB columns have no schema validation

**Solution**: Runtime validation with Zod + database CHECK constraints

**Implementation**:
```typescript
// src/lib/validation/jsonb-schemas.ts

import { z } from 'zod';

// Engagement settings schema
export const engagementSettingsSchema = z.object({
  audit_approach: z.enum(['substantive', 'controls_reliance', 'mixed']).optional(),
  reporting_framework: z.enum(['us_gaap', 'ifrs', 'tax_basis', 'regulatory']).optional(),
  use_specialists: z.boolean().optional(),
  group_audit: z.boolean().optional(),
  significant_components: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

// Risk assessment - business profile schema
export const businessProfileSchema = z.object({
  revenue: z.number().positive().optional(),
  employees: z.number().int().positive().optional(),
  locations: z.array(z.string()).optional(),
  regulatory_environment: z.enum(['low', 'moderate', 'high']).optional(),
  complexity: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  going_concern_indicators: z.array(z.string()).optional(),
});

// Risk areas schema
export const riskAreasSchema = z.array(
  z.object({
    area: z.string().min(1),
    inherent_risk: z.enum(['low', 'moderate', 'high']),
    control_risk: z.enum(['low', 'moderate', 'high']),
    fraud_risk: z.enum(['low', 'moderate', 'high']),
    combined_risk: z.enum(['low', 'moderate', 'high', 'very_high']),
    rationale: z.string().optional(),
    assertions: z.array(z.enum(['existence', 'completeness', 'valuation', 'rights', 'presentation'])).optional(),
  })
);

// Helper function to validate JSONB on write
export function validateJSONB<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

// Helper function to safely read JSONB with defaults
export function parseJSONB<T extends z.ZodType>(
  schema: T,
  data: unknown,
  defaultValue: z.infer<T>
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch {
    return defaultValue;
  }
}
```

**Usage Example**:
```typescript
// In component or hook
import { validateJSONB, engagementSettingsSchema } from '@/lib/validation/jsonb-schemas';

// When writing
const settings = validateJSONB(engagementSettingsSchema, {
  audit_approach: 'substantive',
  reporting_framework: 'us_gaap',
  use_specialists: true,
});

await supabase.from('engagements').update({ settings });

// When reading
const { data: engagement } = await supabase
  .from('engagements')
  .select('settings')
  .eq('id', engagementId)
  .single();

const settings = parseJSONB(
  engagementSettingsSchema,
  engagement.settings,
  {} // default empty settings
);
```

**Database-Level Validation (PostgreSQL)**:
```sql
-- Add CHECK constraints for critical JSONB fields

-- Engagement settings validation
ALTER TABLE engagements
ADD CONSTRAINT check_settings_schema
CHECK (
  settings IS NULL OR (
    settings ? 'audit_approach' IS NULL OR 
    settings->>'audit_approach' IN ('substantive', 'controls_reliance', 'mixed')
  ) AND (
    settings ? 'reporting_framework' IS NULL OR
    settings->>'reporting_framework' IN ('us_gaap', 'ifrs', 'tax_basis', 'regulatory')
  )
);

-- Risk areas validation
ALTER TABLE risk_assessments
ADD CONSTRAINT check_risk_areas_schema
CHECK (
  risk_areas IS NULL OR (
    jsonb_typeof(risk_areas) = 'array' AND
    (
      SELECT bool_and(
        area ? 'area' AND
        area ? 'inherent_risk' AND
        area->>'inherent_risk' IN ('low', 'moderate', 'high')
      )
      FROM jsonb_array_elements(risk_areas) AS area
    )
  )
);
```

**Time Estimate**: 2 days  
**Testing**: Unit tests for schemas + database constraint tests  
**Risk**: Low - validation catches errors early

---

#### 3.2.3 VULN-003: Content Security Policy

**Problem**: No CSP headers, XSS vulnerability

**Solution**: Implement strict CSP headers

**Implementation (Vite)**:
```typescript
// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    // CSP plugin
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://esm.sh",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ');

        return html.replace(
          '</head>',
          `<meta http-equiv="Content-Security-Policy" content="${csp}"></head>`
        );
      }
    }
  ],
})
```

**Production Headers (Supabase Edge Function or Cloudflare)**:
```typescript
// supabase/functions/_shared/headers.ts

export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// Apply to all edge function responses
export function addSecurityHeaders(response: Response): Response {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

**Time Estimate**: 1 day  
**Testing**: Browser console CSP violation checks  
**Risk**: Low - may need adjustment for third-party integrations

---

### 3.3 File Management & Storage

**Bugs Addressed**: BUG-021, ISSUE-022

#### 3.3.1 BUG-021: File Upload Integration

**Problem**: No actual file upload, only database structure

**Solution**: Complete Supabase Storage integration

**Architecture**:
```
┌─────────────────┐
│  Upload UI      │
│  Component      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  FileUploadService      │
│  - Validation           │
│  - Virus scan queue     │
│  - Progress tracking    │
│  - Retry logic          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase Storage       │
│  Bucket: audit-docs     │
│  - RLS policies         │
│  - Size limits          │
│  - Type restrictions    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Database (documents)   │
│  - Metadata             │
│  - Access tracking      │
│  - Version history      │
└─────────────────────────┘
```

**Storage Setup**:
```sql
-- supabase/migrations/[timestamp]_setup_storage.sql

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-documents', 'audit-documents', false);

-- RLS policies for storage
CREATE POLICY "Users can upload to their org folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their org files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audit-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

**File Upload Service**:
```typescript
// src/lib/services/FileUploadService.ts

import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'text/csv',
];

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  organizationId: string;
  engagementId?: string;
  procedureId?: string;
  category?: 'workpaper' | 'evidence' | 'report' | 'other';
  onProgress?: (progress: UploadProgress) => void;
}

export class FileUploadService {
  /**
   * Upload a file to Supabase Storage with progress tracking
   */
  static async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<{ path: string; documentId: string }> {
    // Validate file
    this.validateFile(file);

    const { organizationId, engagementId, procedureId, category = 'other', onProgress } = options;

    // Generate storage path
    const timestamp = new Date().getTime();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${organizationId}/${engagementId || 'general'}/${timestamp}_${sanitizedName}`;

    // Upload to storage with progress
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audit-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: (progress.loaded / progress.total) * 100,
            });
          }
        },
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        engagement_id: engagementId || null,
        procedure_id: procedureId || null,
        name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_bucket: 'audit-documents',
        storage_path: storagePath,
        category,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (docError) {
      // Cleanup storage if database insert fails
      await supabase.storage.from('audit-documents').remove([storagePath]);
      throw new Error(`Failed to create document record: ${docError.message}`);
    }

    return {
      path: storagePath,
      documentId: document.id,
    };
  }

  /**
   * Download a file from storage
   */
  static async downloadFile(storagePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from('audit-documents')
      .download(storagePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get public URL for a file (creates signed URL for private buckets)
   */
  static async getFileUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('audit-documents')
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a file
   */
  static async deleteFile(documentId: string): Promise<void> {
    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Document not found: ${fetchError.message}`);
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('audit-documents')
      .remove([document.storage_path]);

    if (storageError) {
      throw new Error(`Storage deletion failed: ${storageError.message}`);
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `File type ${file.type} not allowed. Allowed types: PDF, Excel, Word, Images, CSV`
      );
    }

    // Additional validation
    if (file.name.length > 255) {
      throw new Error('File name too long (max 255 characters)');
    }
  }

  /**
   * Create a new version of an existing document
   */
  static async createVersion(
    documentId: string,
    file: File,
    options: Omit<UploadOptions, 'category'>
  ): Promise<string> {
    // Get original document
    const { data: originalDoc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      throw new Error(`Original document not found: ${error.message}`);
    }

    // Upload new version
    const { path } = await this.uploadFile(file, {
      ...options,
      category: originalDoc.category,
    });

    // Create version record
    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_number: originalDoc.current_version + 1,
        storage_path: path,
        file_size: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (versionError) {
      throw new Error(`Failed to create version: ${versionError.message}`);
    }

    // Update document current version
    await supabase
      .from('documents')
      .update({ current_version: originalDoc.current_version + 1 })
      .eq('id', documentId);

    return version.id;
  }
}
```

**Upload Component**:
```typescript
// src/components/documents/FileUpload.tsx

import React, { useState } from 'react';
import { FileUploadService, UploadProgress } from '@/lib/services/FileUploadService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FileUploadProps {
  organizationId: string;
  engagementId?: string;
  procedureId?: string;
  category?: 'workpaper' | 'evidence' | 'report' | 'other';
  onUploadComplete?: (documentId: string) => void;
}

export function FileUpload({
  organizationId,
  engagementId,
  procedureId,
  category,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    setUploading(true);

    for (const file of files) {
      try {
        const { documentId } = await FileUploadService.uploadFile(file, {
          organizationId,
          engagementId,
          procedureId,
          category,
          onProgress: (p) => {
            setProgress((prev) => ({ ...prev, [file.name]: p }));
          },
        });

        setCompleted((prev) => new Set(prev).add(file.name));
        onUploadComplete?.(documentId);

        toast({
          title: 'Success',
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to select files or drag and drop
          </span>
          <span className="text-xs text-muted-foreground">
            PDF, Excel, Word, Images, CSV (max 50MB each)
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{file.name}</span>
                  {completed.has(file.name) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {progress[file.name] && (
                  <Progress value={progress[file.name].percentage} className="h-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          Upload {files.length} file{files.length > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}
```

**Time Estimate**: 5 days  
**Testing**: Upload/download tests with various file types  
**Risk**: Medium - storage configuration critical

---

#### 3.3.2 ISSUE-022: PDF Generation

**Problem**: No PDF export for reports

**Solution**: Implement PDF generation using jsPDF + html2canvas

**Implementation**:
```typescript
// src/lib/services/PDFGenerationService.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';

export interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  margin?: number;
  includeTimestamp?: boolean;
  includePageNumbers?: boolean;
}

export class PDFGenerationService {
  /**
   * Generate PDF from HTML element
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const {
      orientation = 'portrait',
      format = 'letter',
      margin = 10,
      includeTimestamp = true,
      includePageNumbers = true,
    } = options;

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    });

    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // mm
    const pageHeight = format === 'a4' ? 297 : 279; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const imgData = canvas.toDataURL('image/png');
    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth - 2 * margin, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth - 2 * margin, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add page numbers
    if (includePageNumbers) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          imgWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    }

    // Add timestamp
    if (includeTimestamp) {
      pdf.setPage(1);
      pdf.setFontSize(8);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 5
      );
    }

    return pdf.output('blob');
  }

  /**
   * Generate audit report PDF
   */
  static async generateAuditReport(
    reportId: string,
    options: PDFOptions = {}
  ): Promise<{ blob: Blob; documentId: string }> {
    // Fetch report data
    const { data: report, error } = await supabase
      .from('audit_reports')
      .select('*, engagement:engagements(*)')
      .eq('id', reportId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    // Create temporary DOM element with report content
    const element = this.createReportElement(report);
    document.body.appendChild(element);

    try {
      // Generate PDF
      const blob = await this.generateFromElement(element, {
        ...options,
        filename: `audit-report-${report.engagement.client_name}.pdf`,
      });

      // Upload to storage
      const storagePath = `${report.organization_id}/reports/${reportId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('audit-documents')
        .upload(storagePath, blob, { upsert: true });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update report record with PDF URL
      const { data: signedUrl } = await supabase.storage
        .from('audit-documents')
        .createSignedUrl(storagePath, 3600);

      await supabase
        .from('audit_reports')
        .update({ pdf_url: storagePath })
        .eq('id', reportId);

      // Create document record
      const { data: document } = await supabase
        .from('documents')
        .insert({
          organization_id: report.organization_id,
          engagement_id: report.engagement_id,
          name: `Audit Report - ${report.engagement.client_name}.pdf`,
          file_type: 'application/pdf',
          file_size: blob.size,
          storage_bucket: 'audit-documents',
          storage_path: storagePath,
          category: 'report',
        })
        .select()
        .single();

      return { blob, documentId: document.id };
    } finally {
      // Cleanup temporary element
      document.body.removeChild(element);
    }
  }

  /**
   * Create HTML element for report
   */
  private static createReportElement(report: any): HTMLElement {
    const div = document.createElement('div');
    div.style.width = '8.5in';
    div.style.padding = '1in';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '12pt';
    div.style.lineHeight = '1.5';

    div.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 2em;">
        Independent Auditor's Report
      </h1>
      
      <p style="margin-bottom: 1em;">
        <strong>To the Board of Directors and Shareholders of</strong><br>
        ${report.engagement.client_name}
      </p>

      <h2 style="margin-top: 2em;">Opinion</h2>
      <p>${report.content || 'Report content here...'}</p>

      <div style="margin-top: 4em;">
        <p>
          <strong>${report.engagement.firm_name}</strong><br>
          ${new Date(report.report_date).toLocaleDateString()}
        </p>
      </div>
    `;

    return div;
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

**Usage in Component**:
```typescript
// src/components/reports/AuditReportView.tsx

import { Button } from '@/components/ui/button';
import { PDFGenerationService } from '@/lib/services/PDFGenerationService';
import { Download } from 'lucide-react';

export function AuditReportView({ reportId }: { reportId: string }) {
  const [generating, setGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const { blob } = await PDFGenerationService.generateAuditReport(reportId);
      PDFGenerationService.downloadBlob(blob, `audit-report-${reportId}.pdf`);
      
      toast({
        title: 'Success',
        description: 'PDF generated and downloaded',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate PDF',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Button onClick={handleGeneratePDF} disabled={generating}>
        <Download className="mr-2 h-4 w-4" />
        {generating ? 'Generating...' : 'Download PDF'}
      </Button>
    </div>
  );
}
```

**Time Estimate**: 3 days  
**Testing**: PDF generation with various report types  
**Risk**: Low - library well-established

---

This is getting very long. Would you like me to continue creating the full document with all remaining sections (Workflow & State Management, Analytics, UX, Performance, Implementation Phases, etc.), or would you prefer I finalize what I have and save it as a complete file?
