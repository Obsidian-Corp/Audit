# Audit Management Platform - Technical Design Document

## Executive Summary

This document outlines the technical architecture and implementation strategy to transform the audit management platform from a procedure-centric tool into a risk-based audit execution platform that competes with enterprise solutions like SAP Audit Management.

**Current State:** Engagement-centric platform with procedure library (Grade: B-, 75/100)
**Target State:** Risk-driven intelligent audit platform with execution workspace (Target: A, 95/100)
**Timeline:** 26 weeks (6 months) across 4 phases

---

## 1. Critical Problems Being Solved

### Problem 1: Missing Risk-Based Audit Methodology
**Severity:** CRITICAL
**Current Gap:** Procedures selected manually without risk assessment driving the selection.

**Solution Architecture:**
- Pre-engagement risk assessment wizard
- Risk scoring matrices by financial statement area
- AI-powered procedure recommendation engine
- Visual risk heat map

### Problem 2: Procedures Are Too Generic
**Severity:** HIGH
**Current Gap:** Static procedures don't adjust for client size, risk level, or industry.

**Solution Architecture:**
- Dynamic procedure parameterization system
- Risk-adjusted sample sizes
- Industry-specific procedure variants
- Materiality-driven adjustments

### Problem 3: Linear Workflow Doesn't Match Reality
**Severity:** MEDIUM-HIGH
**Current Gap:** Once created, programs feel locked; no easy mid-engagement changes.

**Solution Architecture:**
- Program version control with audit trail
- Scope change workflow with rationale tracking
- Dynamic procedure addition/removal
- Change impact analysis

### Problem 4: Procedure Execution UX is Missing
**Severity:** CRITICAL
**Current Gap:** No execution workspace where auditors spend 80% of their time.

**Solution Architecture:**
- Integrated procedure workspace
- Smart workpaper templates
- Evidence repository
- Multi-level review workflow
- Real-time time tracking

### Problem 5: No Cross-Reference or Linkage System
**Severity:** MEDIUM
**Current Gap:** Procedures exist in isolation; findings don't trigger related procedures.

**Solution Architecture:**
- Finding management system
- Procedure dependency engine
- Impact analysis dashboard
- Cross-procedure linkage

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Risk Assessment Wizard  │  Program Builder  │  Execution   │
│  - Business Profile      │  - Procedure Rec  │  Workspace   │
│  - Risk Matrix           │  - Smart Selection│  - Workpapers│
│  - Heat Map              │  - Scope Changes  │  - Evidence  │
│                          │                   │  - Review    │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Recommendation Engine   │  Risk Calculator  │  Finding     │
│  - Risk-based matching   │  - Scoring logic  │  Manager     │
│  - Industry filters      │  - Materiality    │  - Impact    │
│  - Sample size adjust    │  - Adjustments    │  - Linkage   │
├─────────────────────────────────────────────────────────────┤
│                       DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Risk Assessments │ Enhanced Procedures │ Findings │ Versions│
│  - Business info  │ - Risk metadata     │ - Cross- │ - Audit  │
│  - Risk scores    │ - Industry tags     │   ref    │   trail  │
│  - Heat maps      │ - Parameterization  │ - Impact │ - Changes│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- React 18+ with TypeScript
- shadcn/ui component library
- TanStack Query for data fetching
- Zustand for state management
- Recharts for data visualization

**Backend:**
- Supabase (PostgreSQL 15+)
- Row Level Security (RLS) for multi-tenancy
- Edge Functions for complex business logic
- Real-time subscriptions for collaborative features

**Development:**
- Vite for build tooling
- Vitest for unit testing
- Playwright for E2E testing
- GitHub Actions for CI/CD

---

## 3. Database Schema Design

### 3.1 Risk Assessment Domain

#### 3.1.1 engagement_risk_assessments
Stores the overall risk assessment for each engagement.

```sql
CREATE TABLE public.engagement_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Business Understanding
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL, -- small, medium, large, enterprise
  revenue_range TEXT,
  complexity_factors JSONB DEFAULT '[]'::jsonb, -- multi-entity, international, etc.

  -- Engagement Context
  engagement_type TEXT NOT NULL, -- first_year, recurring, special_purpose
  prior_year_opinion TEXT, -- clean, qualified, adverse, disclaimer
  years_as_client INTEGER DEFAULT 0,

  -- Overall Risk Ratings
  overall_risk_rating TEXT NOT NULL, -- low, medium, high, significant
  fraud_risk_rating TEXT NOT NULL,
  it_dependency_rating TEXT NOT NULL,

  -- Assessment Metadata
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  review_status TEXT DEFAULT 'draft', -- draft, reviewed, approved

  -- Audit Trail
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(engagement_id, version)
);
```

#### 3.1.2 risk_assessment_areas
Individual risk scores for each financial statement area or audit focus area.

```sql
CREATE TABLE public.risk_assessment_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_assessment_id UUID NOT NULL REFERENCES public.engagement_risk_assessments(id) ON DELETE CASCADE,

  -- Area Identification
  area_name TEXT NOT NULL, -- Cash, AR, Inventory, Revenue, etc.
  area_category TEXT NOT NULL, -- balance_sheet, income_statement, control_environment

  -- Risk Scoring
  inherent_risk TEXT NOT NULL, -- low, medium, high, significant
  control_risk TEXT NOT NULL,
  combined_risk TEXT NOT NULL,
  fraud_risk_factors JSONB DEFAULT '[]'::jsonb,

  -- Risk Justification
  risk_rationale TEXT,
  key_risk_factors JSONB DEFAULT '[]'::jsonb,

  -- Materiality Context
  materiality_threshold NUMERIC,
  is_material_area BOOLEAN DEFAULT true,

  -- Recommendations
  recommended_approach TEXT, -- substantive, controls_reliance, combined
  recommended_testing_level TEXT, -- minimal, standard, enhanced, extensive

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(risk_assessment_id, area_name)
);
```

#### 3.1.3 risk_assessment_responses
Individual questionnaire responses that inform risk scoring.

```sql
CREATE TABLE public.risk_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_assessment_id UUID NOT NULL REFERENCES public.engagement_risk_assessments(id) ON DELETE CASCADE,

  -- Question Context
  question_category TEXT NOT NULL, -- business, controls, fraud, it, industry
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,

  -- Response
  response_value TEXT,
  response_type TEXT NOT NULL, -- boolean, text, numeric, multi_select
  risk_impact TEXT, -- increases_risk, decreases_risk, neutral

  -- Metadata
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(risk_assessment_id, question_id)
);
```

### 3.2 Enhanced Procedure Domain

#### 3.2.1 Enhanced audit_procedures table
Add risk intelligence to existing procedures.

```sql
-- Migration: Add new columns to existing audit_procedures table
ALTER TABLE public.audit_procedures
  ADD COLUMN IF NOT EXISTS applicable_risk_levels TEXT[] DEFAULT ARRAY['low', 'medium', 'high', 'significant'],
  ADD COLUMN IF NOT EXISTS applicable_industries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_area_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS procedure_rationale TEXT,
  ADD COLUMN IF NOT EXISTS dynamic_parameters JSONB DEFAULT '{}'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN public.audit_procedures.applicable_risk_levels IS
  'Risk levels where this procedure is applicable (e.g., high AR risk triggers FSA-200)';

COMMENT ON COLUMN public.audit_procedures.applicable_industries IS
  'Industries where this procedure is particularly relevant';

COMMENT ON COLUMN public.audit_procedures.trigger_conditions IS
  'Conditions that automatically recommend this procedure (e.g., first_year_audit, new_system)';

COMMENT ON COLUMN public.audit_procedures.risk_area_tags IS
  'Financial statement areas this procedure addresses (e.g., cash, ar, revenue)';

COMMENT ON COLUMN public.audit_procedures.dynamic_parameters IS
  'Risk-adjusted parameters: { "low_risk": { "sample_size": "...", "depth": "..." }, "high_risk": {...} }';
```

#### 3.2.2 procedure_risk_mappings
Explicit mappings between risk areas and procedures.

```sql
CREATE TABLE public.procedure_risk_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID NOT NULL REFERENCES public.audit_procedures(id) ON DELETE CASCADE,

  -- Risk Context
  risk_area TEXT NOT NULL, -- cash, ar, inventory, revenue, etc.
  risk_level_required TEXT NOT NULL, -- low, medium, high, significant

  -- Recommendation Logic
  is_recommended BOOLEAN DEFAULT true,
  is_required BOOLEAN DEFAULT false,
  recommendation_priority INTEGER DEFAULT 1, -- 1=highest, lower numbers first

  -- Parameterization
  sample_size_override TEXT,
  estimated_hours_override NUMERIC,
  depth_guidance TEXT, -- limited, standard, enhanced, extensive

  -- Conditions
  conditional_logic JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(procedure_id, risk_area, risk_level_required)
);
```

### 3.3 Finding Management Domain

#### 3.3.1 audit_findings
Stores issues identified during procedure execution.

```sql
CREATE TABLE public.audit_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  engagement_procedure_id UUID REFERENCES public.engagement_procedures(id) ON DELETE SET NULL,

  -- Finding Details
  finding_title TEXT NOT NULL,
  finding_description TEXT NOT NULL,
  finding_type TEXT NOT NULL, -- control_deficiency, misstatement, exception, observation
  severity TEXT NOT NULL, -- trivial, material, significant_deficiency, material_weakness

  -- Financial Impact
  quantified_amount NUMERIC,
  materiality_impact TEXT, -- none, planning, performance, trivial

  -- Related Areas
  affected_accounts TEXT[] DEFAULT '{}',
  affected_areas TEXT[] DEFAULT '{}',

  -- Management Response
  management_response TEXT,
  corrective_action_plan TEXT,
  remediation_deadline DATE,

  -- Status Tracking
  status TEXT DEFAULT 'open', -- open, in_remediation, resolved, accepted_risk
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolved_date DATE,

  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT true,
  follow_up_procedures JSONB DEFAULT '[]'::jsonb,

  -- Workflow
  identified_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.3.2 finding_procedure_linkages
Links findings to related/impacted procedures.

```sql
CREATE TABLE public.finding_procedure_linkages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id UUID NOT NULL REFERENCES public.audit_findings(id) ON DELETE CASCADE,
  procedure_id UUID NOT NULL REFERENCES public.audit_procedures(id) ON DELETE CASCADE,

  -- Linkage Type
  linkage_type TEXT NOT NULL, -- originated_from, impacts, triggers_follow_up

  -- Impact
  impact_description TEXT,
  requires_expanded_testing BOOLEAN DEFAULT false,

  -- Status
  linkage_status TEXT DEFAULT 'active', -- active, resolved, not_applicable

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(finding_id, procedure_id, linkage_type)
);
```

### 3.4 Program Versioning Domain

#### 3.4.1 engagement_program_versions
Track changes to engagement programs over time.

```sql
CREATE TABLE public.engagement_program_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_program_id UUID NOT NULL REFERENCES public.engagement_programs(id) ON DELETE CASCADE,

  -- Version Info
  version_number INTEGER NOT NULL,
  version_type TEXT NOT NULL, -- initial, scope_change, finding_response, other

  -- Change Details
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_reason TEXT NOT NULL,
  change_summary TEXT,

  -- What Changed
  procedures_added JSONB DEFAULT '[]'::jsonb,
  procedures_removed JSONB DEFAULT '[]'::jsonb,
  procedures_modified JSONB DEFAULT '[]'::jsonb,

  -- Impact Analysis
  hours_delta NUMERIC DEFAULT 0,
  budget_impact NUMERIC DEFAULT 0,
  timeline_impact_days INTEGER DEFAULT 0,

  -- Workflow
  changed_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approval_date DATE,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(engagement_program_id, version_number)
);
```

#### 3.4.2 procedure_execution_history
Audit trail of procedure work.

```sql
CREATE TABLE public.procedure_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_procedure_id UUID NOT NULL REFERENCES public.engagement_procedures(id) ON DELETE CASCADE,

  -- Change Event
  event_type TEXT NOT NULL, -- status_change, assignment_change, hours_updated, evidence_added
  event_timestamp TIMESTAMPTZ DEFAULT now(),

  -- Change Details
  old_value JSONB,
  new_value JSONB,
  change_description TEXT,

  -- Context
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Workpaper Domain

#### 3.5.1 workpaper_templates
Pre-built templates for common procedures.

```sql
CREATE TABLE public.workpaper_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,

  -- Template Identity
  template_name TEXT NOT NULL,
  template_code TEXT NOT NULL,
  procedure_types TEXT[] DEFAULT '{}', -- Which procedures use this template

  -- Template Structure
  template_structure JSONB NOT NULL, -- Defines fields, sections, calculations

  -- Configuration
  supports_auto_population BOOLEAN DEFAULT false,
  data_mapping JSONB DEFAULT '{}'::jsonb, -- Maps to engagement data

  -- Metadata
  is_standard BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(firm_id, template_code)
);
```

#### 3.5.2 Enhanced audit_workpapers
Add to existing workpapers table.

```sql
-- Assuming audit_workpapers exists, enhance it
ALTER TABLE public.audit_workpapers
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.workpaper_templates(id),
  ADD COLUMN IF NOT EXISTS workpaper_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS calculated_fields JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS exceptions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tick_marks JSONB DEFAULT '[]'::jsonb;
```

---

## 4. Component Architecture

### 4.1 Risk Assessment Wizard

**Purpose:** Guide users through structured risk assessment before program building.

**Component Hierarchy:**
```
RiskAssessmentWizard/
├── BusinessProfileStep
│   ├── IndustrySelector
│   ├── CompanySizeSelector
│   └── ComplexityFactorsChecklist
├── RiskScoringStep
│   ├── FinancialStatementAreasGrid
│   ├── RiskRatingSelector (per area)
│   └── RiskRationaleInput
├── FraudRiskStep
│   ├── FraudRiskFactorChecklist
│   └── FraudRiskAssessment
├── ITRiskStep
│   ├── SystemDependencyAssessment
│   └── ITControlsEvaluation
└── ReviewStep
    ├── RiskHeatMap
    ├── RiskSummaryTable
    └── ProcedureRecommendationPreview
```

**Key Props & State:**
```typescript
interface RiskAssessmentWizardProps {
  engagementId: string;
  onComplete: (assessmentId: string) => void;
  onCancel: () => void;
  existingAssessment?: EngagementRiskAssessment;
}

interface RiskAssessmentState {
  currentStep: number;
  businessProfile: BusinessProfile;
  riskAreas: RiskAreaAssessment[];
  fraudRiskFactors: FraudRiskFactor[];
  itRiskAssessment: ITRiskAssessment;
  overallRisk: 'low' | 'medium' | 'high' | 'significant';
}
```

### 4.2 Risk Heat Map Component

**Purpose:** Visual representation of risk across financial statement areas.

**Implementation:**
```typescript
interface RiskHeatMapProps {
  riskAreas: RiskAreaAssessment[];
  onAreaClick?: (area: RiskAreaAssessment) => void;
  highlightMaterialAreas?: boolean;
}

// Uses Recharts for visualization
// X-axis: Inherent Risk
// Y-axis: Control Risk
// Bubble size: Materiality
// Color: Combined Risk Level
```

### 4.3 Enhanced Program Builder Wizard

**Purpose:** Intelligently recommend procedures based on risk assessment.

**New Features:**
1. Risk-based procedure filtering
2. Automatic procedure recommendations
3. Risk coverage gap analysis
4. Sample size adjustments based on risk

**Component Enhancements:**
```typescript
interface EnhancedProgramBuilderProps {
  engagementId: string;
  riskAssessmentId: string; // NEW: Required risk assessment
  onComplete: (programId: string) => void;
}

interface ProcedureRecommendation {
  procedure: AuditProcedure;
  recommendationReason: string;
  isAutoRecommended: boolean;
  riskAreas: string[];
  priority: 'required' | 'recommended' | 'optional';
  adjustedSampleSize?: string;
  adjustedHours?: number;
}
```

**New Steps:**
```
Step 0: Risk Assessment (if not completed)
Step 1: Program Details
Step 2: Review Risk Profile ← NEW
Step 3: AI-Recommended Procedures ← ENHANCED
Step 4: Additional Procedures (optional)
Step 5: Sequence & Configure
Step 6: Review & Create
```

### 4.4 Procedure Execution Workspace

**Purpose:** Integrated workspace where auditors execute procedures.

**Component Structure:**
```
ProcedureWorkspace/
├── ProcedureHeader
│   ├── ProcedureInfo
│   ├── StatusBadge
│   └── ActionMenu
├── LeftPanel
│   ├── ProcedureStepsChecklist
│   ├── StepNotes
│   └── StepEvidence
├── CenterPanel
│   ├── WorkpaperEditor
│   ├── CalculatedFieldsDisplay
│   └── ExceptionsLog
├── RightPanel
│   ├── EvidenceRepository
│   ├── ReviewNotesThread
│   └── RelatedProcedures
└── BottomPanel
    ├── TimeTracker
    ├── SignOffSection
    └── SubmitForReview
```

**Key Features:**
- Real-time auto-save
- Collaborative editing (multiple reviewers)
- Evidence drag-and-drop
- Integrated time tracking
- Multi-level review workflow

### 4.5 Finding Management Component

**Purpose:** Capture, track, and link findings across procedures.

**Component Structure:**
```
FindingManager/
├── FindingsList
├── FindingDetail
│   ├── FindingForm
│   ├── ImpactAnalysis
│   ├── RelatedProceduresLinks
│   └── ManagementResponse
└── FindingImpactDashboard
    ├── MaterialityImpactChart
    ├── AffectedAreasView
    └── FollowUpProcedures
```

---

## 5. Business Logic & Algorithms

### 5.1 Risk Scoring Algorithm

**Combined Risk Calculation:**
```typescript
function calculateCombinedRisk(
  inherentRisk: RiskLevel,
  controlRisk: RiskLevel
): RiskLevel {
  const riskMatrix = {
    low: { low: 'low', medium: 'medium', high: 'high', significant: 'high' },
    medium: { low: 'medium', medium: 'medium', high: 'high', significant: 'significant' },
    high: { low: 'high', medium: 'high', high: 'significant', significant: 'significant' },
    significant: { low: 'high', medium: 'significant', high: 'significant', significant: 'significant' }
  };

  return riskMatrix[inherentRisk][controlRisk];
}
```

**Overall Engagement Risk:**
```typescript
function calculateOverallRisk(
  riskAreas: RiskAreaAssessment[],
  fraudRisk: RiskLevel,
  itRisk: RiskLevel
): RiskLevel {
  // Weight material areas more heavily
  const materialAreas = riskAreas.filter(a => a.is_material_area);

  // Count significant/high risk areas
  const highRiskCount = materialAreas.filter(a =>
    a.combined_risk === 'high' || a.combined_risk === 'significant'
  ).length;

  const significantCount = materialAreas.filter(a =>
    a.combined_risk === 'significant'
  ).length;

  // Fraud risk elevates overall risk
  if (fraudRisk === 'significant' || significantCount > 0) {
    return 'significant';
  }

  if (fraudRisk === 'high' || highRiskCount >= 2) {
    return 'high';
  }

  if (highRiskCount === 1) {
    return 'medium';
  }

  return 'low';
}
```

### 5.2 Procedure Recommendation Engine

**Core Recommendation Logic:**
```typescript
interface RecommendationContext {
  riskAssessment: EngagementRiskAssessment;
  riskAreas: RiskAreaAssessment[];
  engagementType: string;
  industry: string;
  companySize: string;
}

async function recommendProcedures(
  context: RecommendationContext
): Promise<ProcedureRecommendation[]> {
  const recommendations: ProcedureRecommendation[] = [];

  // 1. Get all procedures with risk mappings
  const procedures = await db
    .from('audit_procedures')
    .select(`
      *,
      procedure_risk_mappings (*)
    `);

  // 2. For each risk area, find matching procedures
  for (const riskArea of context.riskAreas) {
    const matchingProcedures = procedures.filter(proc => {
      // Check risk level match
      const hasRiskMapping = proc.procedure_risk_mappings.some(m =>
        m.risk_area === riskArea.area_name &&
        m.risk_level_required === riskArea.combined_risk
      );

      // Check industry match
      const industryMatch = !proc.applicable_industries.length ||
        proc.applicable_industries.includes(context.industry);

      // Check trigger conditions
      const triggerMatch = evaluateTriggerConditions(
        proc.trigger_conditions,
        context
      );

      return hasRiskMapping && industryMatch && triggerMatch;
    });

    // 3. Create recommendations with rationale
    for (const proc of matchingProcedures) {
      const mapping = proc.procedure_risk_mappings.find(m =>
        m.risk_area === riskArea.area_name
      );

      recommendations.push({
        procedure: proc,
        recommendationReason: `${riskArea.area_name} assessed as ${riskArea.combined_risk} risk`,
        isAutoRecommended: true,
        riskAreas: [riskArea.area_name],
        priority: mapping.is_required ? 'required' : 'recommended',
        adjustedSampleSize: mapping.sample_size_override,
        adjustedHours: mapping.estimated_hours_override
      });
    }
  }

  // 4. Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { required: 0, recommended: 1, optional: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

### 5.3 Sample Size Adjustment Logic

**Risk-Based Sample Size:**
```typescript
function adjustSampleSize(
  baseGuidance: string,
  riskLevel: RiskLevel,
  materiality: number,
  populationSize: number
): string {
  const adjustmentFactors = {
    low: 0.6,        // 60% of base
    medium: 1.0,     // 100% of base
    high: 1.5,       // 150% of base
    significant: 2.0 // 200% of base (full population if small)
  };

  const factor = adjustmentFactors[riskLevel];

  // Parse base guidance (e.g., "Top 80% of balances")
  // Apply factor
  // Return adjusted guidance

  if (riskLevel === 'significant' && populationSize < 100) {
    return "100% of population (full examination)";
  }

  // ... implementation details
}
```

### 5.4 Finding Impact Analysis

**Determine Affected Procedures:**
```typescript
async function analyzeFindingImpact(
  finding: AuditFinding
): Promise<{
  affectedProcedures: string[];
  recommendedFollowUp: ProcedureRecommendation[];
  materialityImpact: string;
}> {
  // 1. Identify directly related procedures
  const relatedProcedures = await db
    .from('engagement_procedures')
    .select('*')
    .in('category', finding.affected_areas);

  // 2. Check if finding impacts materiality
  const materialityImpact = determineMaterialityImpact(
    finding.quantified_amount,
    engagement.planning_materiality
  );

  // 3. If material, recommend expanded testing
  let followUpProcedures = [];
  if (materialityImpact !== 'none') {
    followUpProcedures = await recommendFollowUpProcedures(
      finding.affected_areas,
      materialityImpact
    );
  }

  return {
    affectedProcedures: relatedProcedures.map(p => p.id),
    recommendedFollowUp: followUpProcedures,
    materialityImpact
  };
}
```

---

## 6. API Endpoints & Data Models

### 6.1 Risk Assessment APIs

**POST /api/risk-assessments**
```typescript
// Create new risk assessment
Request: {
  engagement_id: string;
  business_profile: BusinessProfile;
  risk_areas: RiskAreaAssessment[];
  fraud_risk: FraudRiskAssessment;
  it_risk: ITRiskAssessment;
}

Response: {
  id: string;
  overall_risk: RiskLevel;
  recommended_procedures: ProcedureRecommendation[];
}
```

**GET /api/risk-assessments/:id**
```typescript
// Get risk assessment with calculated scores
Response: {
  assessment: EngagementRiskAssessment;
  risk_areas: RiskAreaAssessment[];
  heat_map_data: HeatMapDataPoint[];
}
```

**PUT /api/risk-assessments/:id**
```typescript
// Update risk assessment (creates new version)
Request: {
  risk_areas: RiskAreaAssessment[];
  change_reason: string;
}

Response: {
  version: number;
  updated_assessment: EngagementRiskAssessment;
}
```

### 6.2 Procedure Recommendation APIs

**POST /api/procedures/recommend**
```typescript
Request: {
  risk_assessment_id: string;
  filters?: {
    categories?: string[];
    max_hours?: number;
    required_only?: boolean;
  };
}

Response: {
  recommendations: ProcedureRecommendation[];
  coverage_analysis: {
    areas_covered: string[];
    areas_missing: string[];
    total_estimated_hours: number;
  };
}
```

**GET /api/procedures/:id/risk-parameters**
```typescript
// Get risk-adjusted parameters for a procedure
Query: {
  risk_level: RiskLevel;
  industry: string;
  company_size: string;
}

Response: {
  adjusted_sample_size: string;
  adjusted_hours: number;
  depth_guidance: string;
  industry_specific_notes: string[];
}
```

### 6.3 Program Version APIs

**POST /api/engagement-programs/:id/versions**
```typescript
// Create new version (scope change)
Request: {
  change_reason: string;
  procedures_to_add: string[];
  procedures_to_remove: string[];
  procedures_to_modify: { id: string; changes: any }[];
}

Response: {
  version_number: number;
  impact_analysis: {
    hours_delta: number;
    budget_impact: number;
    risk_coverage_change: string;
  };
}
```

### 6.4 Finding Management APIs

**POST /api/findings**
```typescript
Request: {
  engagement_id: string;
  procedure_id: string;
  finding: {
    title: string;
    description: string;
    type: FindingType;
    severity: SeverityLevel;
    quantified_amount?: number;
  };
}

Response: {
  finding_id: string;
  impact_analysis: FindingImpactAnalysis;
  recommended_follow_up: ProcedureRecommendation[];
}
```

**GET /api/findings/:id/impact**
```typescript
Response: {
  affected_procedures: EngagementProcedure[];
  materiality_impact: string;
  required_follow_up: boolean;
  related_findings: AuditFinding[];
}
```

---

## 7. TypeScript Type Definitions

### 7.1 Risk Assessment Types

```typescript
// src/types/risk-assessment.ts

export type RiskLevel = 'low' | 'medium' | 'high' | 'significant';
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise';
export type EngagementType = 'first_year' | 'recurring' | 'special_purpose';

export interface BusinessProfile {
  industry: string;
  company_size: CompanySize;
  revenue_range?: string;
  complexity_factors: ComplexityFactor[];
}

export interface ComplexityFactor {
  factor: string;
  description: string;
  impact_on_risk: 'increases' | 'decreases' | 'neutral';
}

export interface RiskAreaAssessment {
  area_name: string;
  area_category: 'balance_sheet' | 'income_statement' | 'control_environment';
  inherent_risk: RiskLevel;
  control_risk: RiskLevel;
  combined_risk: RiskLevel;
  fraud_risk_factors: string[];
  risk_rationale?: string;
  key_risk_factors: string[];
  materiality_threshold?: number;
  is_material_area: boolean;
  recommended_approach: 'substantive' | 'controls_reliance' | 'combined';
  recommended_testing_level: 'minimal' | 'standard' | 'enhanced' | 'extensive';
}

export interface EngagementRiskAssessment {
  id: string;
  engagement_id: string;
  firm_id: string;
  industry: string;
  company_size: CompanySize;
  revenue_range?: string;
  complexity_factors: ComplexityFactor[];
  engagement_type: EngagementType;
  prior_year_opinion?: string;
  years_as_client: number;
  overall_risk_rating: RiskLevel;
  fraud_risk_rating: RiskLevel;
  it_dependency_rating: RiskLevel;
  assessment_date: string;
  assessed_by?: string;
  reviewed_by?: string;
  review_status: 'draft' | 'reviewed' | 'approved';
  version: number;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface FraudRiskFactor {
  category: 'incentive' | 'opportunity' | 'rationalization';
  factor: string;
  is_present: boolean;
  severity: RiskLevel;
  notes?: string;
}

export interface ITRiskAssessment {
  overall_it_dependency: RiskLevel;
  systems: ITSystem[];
  control_environment_rating: RiskLevel;
  cybersecurity_risk: RiskLevel;
}

export interface ITSystem {
  system_name: string;
  criticality: 'high' | 'medium' | 'low';
  integration_complexity: RiskLevel;
  control_effectiveness: RiskLevel;
}
```

### 7.2 Procedure Types

```typescript
// src/types/procedures.ts

export interface DynamicProcedureParameters {
  low_risk?: {
    sample_size: string;
    depth: string;
    estimated_hours: number;
  };
  medium_risk?: {
    sample_size: string;
    depth: string;
    estimated_hours: number;
  };
  high_risk?: {
    sample_size: string;
    depth: string;
    estimated_hours: number;
  };
  significant_risk?: {
    sample_size: string;
    depth: string;
    estimated_hours: number;
  };
}

export interface AuditProcedure {
  id: string;
  firm_id: string;
  procedure_name: string;
  procedure_code: string;
  category: string;
  objective?: string;
  instructions?: any;
  sample_size_guidance?: string;
  evidence_requirements?: any[];
  expected_outcomes?: string;
  estimated_hours: number;
  risk_level: string;
  control_objectives?: any[];
  procedure_type: string;
  is_active: boolean;

  // Enhanced fields
  applicable_risk_levels?: RiskLevel[];
  applicable_industries?: string[];
  trigger_conditions?: TriggerCondition[];
  risk_area_tags?: string[];
  procedure_rationale?: string;
  dynamic_parameters?: DynamicProcedureParameters;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TriggerCondition {
  condition_type: 'engagement_attribute' | 'risk_score' | 'finding' | 'custom';
  condition_logic: any;
  description: string;
}

export interface ProcedureRecommendation {
  procedure: AuditProcedure;
  recommendation_reason: string;
  is_auto_recommended: boolean;
  risk_areas: string[];
  priority: 'required' | 'recommended' | 'optional';
  adjusted_sample_size?: string;
  adjusted_hours?: number;
  coverage_percentage?: number;
}
```

### 7.3 Finding Types

```typescript
// src/types/findings.ts

export type FindingType = 'control_deficiency' | 'misstatement' | 'exception' | 'observation';
export type SeverityLevel = 'trivial' | 'material' | 'significant_deficiency' | 'material_weakness';
export type FindingStatus = 'open' | 'in_remediation' | 'resolved' | 'accepted_risk';

export interface AuditFinding {
  id: string;
  engagement_id: string;
  engagement_procedure_id?: string;
  finding_title: string;
  finding_description: string;
  finding_type: FindingType;
  severity: SeverityLevel;
  quantified_amount?: number;
  materiality_impact: 'none' | 'planning' | 'performance' | 'trivial';
  affected_accounts: string[];
  affected_areas: string[];
  management_response?: string;
  corrective_action_plan?: string;
  remediation_deadline?: string;
  status: FindingStatus;
  identified_date: string;
  resolved_date?: string;
  requires_follow_up: boolean;
  follow_up_procedures: string[];
  identified_by?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FindingImpactAnalysis {
  affected_procedures: string[];
  materiality_impact: string;
  requires_expanded_testing: boolean;
  recommended_follow_up: ProcedureRecommendation[];
  related_findings: AuditFinding[];
}

export interface FindingProcedureLinkage {
  id: string;
  finding_id: string;
  procedure_id: string;
  linkage_type: 'originated_from' | 'impacts' | 'triggers_follow_up';
  impact_description?: string;
  requires_expanded_testing: boolean;
  linkage_status: 'active' | 'resolved' | 'not_applicable';
  created_at: string;
}
```

### 7.4 Program Version Types

```typescript
// src/types/program-versions.ts

export interface EngagementProgramVersion {
  id: string;
  engagement_program_id: string;
  version_number: number;
  version_type: 'initial' | 'scope_change' | 'finding_response' | 'other';
  change_date: string;
  change_reason: string;
  change_summary?: string;
  procedures_added: ProcedureChange[];
  procedures_removed: ProcedureChange[];
  procedures_modified: ProcedureChange[];
  hours_delta: number;
  budget_impact: number;
  timeline_impact_days: number;
  changed_by?: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
}

export interface ProcedureChange {
  procedure_id: string;
  procedure_code: string;
  procedure_name: string;
  reason: string;
  old_values?: any;
  new_values?: any;
}
```

---

## 8. Integration Points

### 8.1 Existing System Integration

**Engagement Creation Flow:**
```
1. User creates engagement (existing)
2. System prompts for risk assessment (NEW)
3. User completes risk assessment wizard (NEW)
4. System auto-launches program builder with recommendations (ENHANCED)
5. User reviews/customizes program (existing + enhanced)
6. Program applied to engagement (existing)
```

**Procedure Execution Flow:**
```
1. User opens procedure from engagement dashboard (existing)
2. System loads procedure workspace (NEW)
3. User works through steps, adds evidence (NEW)
4. User submits for review (ENHANCED)
5. Reviewer provides feedback (ENHANCED)
6. Sign-off workflow (NEW)
```

### 8.2 Data Migration Strategy

**Phase 1: Add New Tables**
- Run migrations to create risk assessment tables
- Add columns to existing procedures table
- Create finding management tables
- No data migration needed yet

**Phase 2: Enhance Existing Procedures**
- Script to add risk metadata to existing procedures
- Map procedure codes to risk areas
- Set default parameters for risk levels

**Phase 3: Backfill for Active Engagements**
- For engagements in progress:
  - Create default risk assessment (medium risk all areas)
  - Link existing procedures to assessment
  - Allow users to refine assessment later

### 8.3 Backward Compatibility

**Existing Engagements:**
- Programs created before risk assessment feature will continue to work
- System will prompt to add risk assessment when editing
- No breaking changes to existing data structures

**Existing Procedures:**
- All existing procedures remain valid
- New fields are optional with sensible defaults
- Gradual enhancement of procedure library

---

## 9. UI/UX Wireframes (Described)

### 9.1 Risk Assessment Wizard

**Step 1: Business Profile**
```
┌─────────────────────────────────────────────────────┐
│ Risk Assessment Wizard - Business Understanding     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Industry:                                           │
│ [Dropdown: Healthcare, Financial, Tech, ...]        │
│                                                     │
│ Company Size:                                       │
│ ○ Small (<$10M)  ○ Medium ($10M-$100M)             │
│ ○ Large ($100M-$1B)  ○ Enterprise (>$1B)           │
│                                                     │
│ Engagement Type:                                    │
│ ○ First-year audit                                 │
│ ○ Recurring client (Year: [__])                    │
│ ○ Special purpose                                  │
│                                                     │
│ Complexity Factors:                                 │
│ ☑ Multi-entity structure                           │
│ ☑ International operations                         │
│ ☐ Complex financial instruments                    │
│ ☐ Significant acquisitions/disposals              │
│                                                     │
│              [Cancel]  [Next: Risk Scoring]         │
└─────────────────────────────────────────────────────┘
```

**Step 2: Risk Scoring Matrix**
```
┌─────────────────────────────────────────────────────┐
│ Risk Assessment Wizard - Financial Statement Areas  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Rate each area (click to expand):                  │
│                                                     │
│ ┌─ Cash & Cash Equivalents ────────────────────┐   │
│ │ Material: ☑ Yes  ☐ No                        │   │
│ │                                               │   │
│ │ Inherent Risk:  ○ Low  ● Medium ○ High       │   │
│ │ Control Risk:   ○ Low  ● Medium ○ High       │   │
│ │ Combined Risk:  [Auto-calculated: Medium]    │   │
│ │                                               │   │
│ │ Rationale:                                    │   │
│ │ [Text area for explanation]                  │   │
│ │                                               │   │
│ │ Key Risk Factors:                             │   │
│ │ ☑ Multiple bank accounts                     │   │
│ │ ☐ Foreign currency transactions              │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ Accounts Receivable ─────────────────────────┐  │
│ │ [Similar structure...]                        │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [6-8 more expandable areas...]                     │
│                                                     │
│              [Back]  [Next: Fraud Risk]             │
└─────────────────────────────────────────────────────┘
```

**Step 3: Review & Heat Map**
```
┌─────────────────────────────────────────────────────────────┐
│ Risk Assessment Summary                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Overall Engagement Risk: [High] 🔴                          │
│                                                             │
│ Risk Heat Map:                                              │
│                                                             │
│   Control Risk                                              │
│   High │     [Inventory]  [Revenue]                         │
│        │                                                    │
│ Medium │  [Cash]  [AR]  [Expenses]                          │
│        │                                                    │
│    Low │  [PP&E]  [Equity]                                  │
│        └──────────────────────────────                      │
│           Low   Medium   High                               │
│                Inherent Risk                                │
│                                                             │
│ Recommended Procedures: 18 procedures identified            │
│ Estimated Total Hours: 145 hours                            │
│                                                             │
│ [View Recommendations]  [Back]  [Complete Assessment]       │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Enhanced Program Builder

**Step 2: Risk Profile Review**
```
┌─────────────────────────────────────────────────────┐
│ Program Builder - Risk Profile                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Risk Assessment: Completed Nov 15, 2025            │
│ Overall Risk: High                                  │
│                                                     │
│ High Risk Areas (require enhanced testing):        │
│ • Accounts Receivable                              │
│ • Revenue Recognition                              │
│ • Inventory Valuation                              │
│                                                     │
│ Based on this assessment, we recommend:            │
│ • 18 required procedures                           │
│ • 12 recommended procedures                        │
│ • Estimated 145-180 hours                          │
│                                                     │
│ [Modify Risk Assessment]  [Continue to Procedures]  │
└─────────────────────────────────────────────────────┘
```

**Step 3: AI-Recommended Procedures**
```
┌──────────────────────────────────────────────────────────┐
│ Recommended Procedures                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Filter: [All] [Required Only] [By Risk Area ▼]          │
│                                                          │
│ ┌─ REQUIRED (High AR Risk) ──────────────────────────┐  │
│ │                                                     │  │
│ │ ☑ FSA-200: AR Aging Analysis (6h)                  │  │
│ │   Why: AR assessed as high risk                    │  │
│ │   Risk-adjusted: Enhanced testing required         │  │
│ │                                                     │  │
│ │ ☑ FSA-201: AR Confirmations (8h)                   │  │
│ │   Why: High risk + first year audit                │  │
│ │   Risk-adjusted: 70% coverage (up from 60%)        │  │
│ │                                                     │  │
│ │ ☑ FSA-202: Allowance Review (5h)                   │  │
│ │   Why: Healthcare industry - high collectibility   │  │
│ │                                                     │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌─ RECOMMENDED (Medium Cash Risk) ───────────────────┐  │
│ │ ☑ FSA-100: Bank Reconciliations (4h)               │  │
│ │ ☑ FSA-101: Bank Confirmations (3h)                 │  │
│ │ ☐ FSA-102: Cash Cutoff Testing (2h)                │  │
│ │   Optional for medium risk                         │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Selected: 14 procedures | 87 hours                      │
│                                                          │
│ ⚠ Risk Coverage Gap: Inventory procedures not selected  │
│                                                          │
│ [Select All Required] [Back] [Next: Additional]         │
└──────────────────────────────────────────────────────────┘
```

### 9.3 Procedure Execution Workspace

```
┌────────────────────────────────────────────────────────────────┐
│ FSA-200: AR Aging Analysis                    [In Progress] ✏️ │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌─ Steps (Left Panel) ──┐  ┌─ Workpaper (Center) ──────────┐ │
│ │                        │  │                                │ │
│ │ ☑ 1. Obtain AR aging  │  │ AR Aging Analysis Workpaper    │ │
│ │ ☑ 2. Foot & cross-foot│  │                                │ │
│ │ ⏺ 3. Reconcile to GL  │  │ Total AR per Aging: $2,450,000 │ │
│ │ ☐ 4. Analyze trends   │  │ Total AR per GL:    $2,450,000 │ │
│ │ ☐ 5. Calculate DSO    │  │ Difference:         $      0 ✓ │ │
│ │ ☐ 6. Identify conc.   │  │                                │ │
│ │ ☐ 7. Review aged bal. │  │ Aging Breakdown:               │ │
│ │ ☐ 8. Interview mgmt   │  │ Current:     $1,800,000 (73%) │ │
│ │                        │  │ 30-60 days:  $  400,000 (16%) │ │
│ │ Notes (Step 3):        │  │ 60-90 days:  $  150,000 (6%)  │ │
│ │ [Reconciliation clean, │  │ >90 days:    $  100,000 (4%)  │ │
│ │  no differences noted] │  │                                │ │
│ │                        │  │ [Auto-calculated fields...]    │ │
│ │ Evidence:              │  │                                │ │
│ │ 📄 AR_Aging_12-31.xlsx│  │ Exceptions:                    │ │
│ │ 📄 GL_Detail_AR.pdf   │  │ None noted                     │ │
│ └────────────────────────┘  └────────────────────────────────┘ │
│                                                                │
│ ┌─ Evidence & Review (Right Panel) ──────────────────────────┐│
│ │ Evidence Repository:                                       ││
│ │ 📄 AR_Aging_12-31.xlsx (uploaded 2h ago)                   ││
│ │ 📄 GL_Detail_AR.pdf (uploaded 1h ago)                      ││
│ │ [+ Upload Evidence]                                        ││
│ │                                                            ││
│ │ Review Notes:                                              ││
│ │ ┌─────────────────────────────────────────────────┐       ││
│ │ │ Sarah (Manager) - 30 min ago:                   │       ││
│ │ │ "Good work on the reconciliation. Please add    │       ││
│ │ │  more detail on the >90 day balances."          │       ││
│ │ └─────────────────────────────────────────────────┘       ││
│ │ [Add Review Note]                                          ││
│ │                                                            ││
│ │ Related Procedures:                                        ││
│ │ → FSA-201: AR Confirmations (Not Started)                 ││
│ │ → FSA-202: Allowance Review (Pending)                     ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─ Time & Sign-off (Bottom) ─────────────────────────────────┐│
│ │ ⏱ Time Tracked: 3.5 hours (Est: 4 hours)                   ││
│ │ [⏸ Pause Timer]  [Complete Timer]                          ││
│ │                                                             ││
│ │ Sign-off:                                                   ││
│ │ Preparer: You [Sign Off]                                   ││
│ │ Reviewer: Sarah Johnson [Pending]                          ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
│ [Save Draft] [Submit for Review] [Mark Complete]              │
└────────────────────────────────────────────────────────────────┘
```

### 9.4 Finding Management Interface

```
┌────────────────────────────────────────────────────────┐
│ New Finding: AR Confirmation Exception                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Finding Type: [Exception ▼]                           │
│ Severity: ○ Trivial ● Material ○ Sig. Deficiency      │
│                                                        │
│ Title:                                                 │
│ [Customer XYZ disputes $50,000 invoice]                │
│                                                        │
│ Description:                                           │
│ [Confirmation response from Customer XYZ indicates...] │
│                                                        │
│ Quantified Amount: $50,000                             │
│ Materiality Impact: [Performance Materiality ▼]        │
│                                                        │
│ Affected Accounts:                                     │
│ ☑ Accounts Receivable                                 │
│ ☑ Revenue                                             │
│                                                        │
│ ┌─ Impact Analysis ─────────────────────────────────┐ │
│ │ This finding affects:                             │ │
│ │ • FSA-200: AR Aging (originated from)             │ │
│ │ • FSA-400: Revenue Testing (may impact)           │ │
│ │                                                   │ │
│ │ Recommended Follow-up:                            │ │
│ │ ☑ FSA-203: Revenue Cutoff Testing                │ │
│ │ ☑ FSA-401: Sales Journal Testing                 │ │
│ │                                                   │ │
│ │ [Add to Program]                                  │ │
│ └───────────────────────────────────────────────────┘ │
│                                                        │
│ Management Response:                                   │
│ [Text area...]                                         │
│                                                        │
│ [Cancel]  [Save Finding]  [Save & Add Procedures]     │
└────────────────────────────────────────────────────────┘
```

---

## 10. Testing Strategy

### 10.1 Unit Testing

**Risk Calculation Logic:**
- Test combined risk matrix calculations
- Test overall engagement risk scoring
- Test edge cases (all low, all high, mixed)

**Recommendation Engine:**
- Test procedure matching based on risk levels
- Test industry filtering
- Test trigger condition evaluation
- Test sample size adjustments

**Finding Impact Analysis:**
- Test materiality impact calculations
- Test procedure linkage logic
- Test follow-up recommendations

### 10.2 Integration Testing

**Risk Assessment → Program Builder:**
- Complete risk assessment
- Verify recommendations appear in program builder
- Verify risk-adjusted parameters applied

**Procedure Execution → Findings:**
- Create finding during procedure
- Verify impact analysis runs
- Verify related procedures flagged

**Program Versions:**
- Create initial program
- Add procedures (scope change)
- Verify version created with audit trail

### 10.3 E2E Testing

**Full Audit Lifecycle:**
```
1. Create engagement
2. Complete risk assessment
3. Build program with recommendations
4. Execute procedures
5. Log finding
6. Add follow-up procedures (scope change)
7. Complete procedures
8. Generate report
```

### 10.4 Performance Testing

**Database Queries:**
- Recommendation engine with 500+ procedures
- Heat map rendering with 20+ risk areas
- Finding impact analysis across 50+ procedures

**Concurrent Users:**
- 10 users completing risk assessments simultaneously
- 50 users executing procedures in same engagement

---

## 11. Security & Compliance

### 11.1 Row Level Security (RLS)

All risk assessment tables enforce firm-level isolation:
```sql
CREATE POLICY "Firm members access risk assessments"
  ON public.engagement_risk_assessments FOR ALL
  USING (
    firm_id IN (SELECT firm_id FROM public.profiles WHERE id = auth.uid())
  );
```

### 11.2 Audit Trail

All changes to risk assessments and programs versioned:
- Who made the change
- What changed (before/after)
- When it changed
- Why (rationale required for scope changes)

### 11.3 Data Validation

**Frontend Validation:**
- Required fields marked clearly
- Risk level consistency checks
- Materiality thresholds validated

**Backend Validation:**
- Database constraints on risk levels
- Check constraints on version numbers
- Foreign key integrity

---

## 12. Migration Strategy

### 12.1 Database Migrations

**Migration 1: Risk Assessment Tables**
- File: `20251130000000_create_risk_assessment_tables.sql`
- Tables: engagement_risk_assessments, risk_assessment_areas, risk_assessment_responses
- No data migration needed (new feature)

**Migration 2: Enhanced Procedures**
- File: `20251130000001_enhance_procedures_with_risk_metadata.sql`
- Add columns to audit_procedures
- Create procedure_risk_mappings table
- Backfill script to add risk tags to existing procedures

**Migration 3: Finding Management**
- File: `20251130000002_create_finding_tables.sql`
- Tables: audit_findings, finding_procedure_linkages
- No data migration needed

**Migration 4: Program Versioning**
- File: `20251130000003_create_program_versioning.sql`
- Tables: engagement_program_versions, procedure_execution_history
- Backfill script to create version 1 for existing programs

**Migration 5: Workpaper Templates**
- File: `20251130000004_create_workpaper_templates.sql`
- Tables: workpaper_templates
- Enhance audit_workpapers table
- Seed data for common templates

### 12.2 Data Backfill Strategy

**Step 1: Enhance Existing Procedures (Week 1)**
```sql
-- Add risk metadata to all FSA procedures
UPDATE audit_procedures
SET
  risk_area_tags = ARRAY['cash'],
  applicable_risk_levels = ARRAY['medium', 'high', 'significant']
WHERE procedure_code IN ('FSA-100', 'FSA-101', 'FSA-102');

-- Add AR procedures
UPDATE audit_procedures
SET
  risk_area_tags = ARRAY['accounts_receivable'],
  applicable_risk_levels = ARRAY['medium', 'high', 'significant'],
  applicable_industries = ARRAY['healthcare', 'financial_services']
WHERE procedure_code IN ('FSA-200', 'FSA-201', 'FSA-202', 'FSA-203');

-- Continue for all procedure categories...
```

**Step 2: Create Default Risk Mappings (Week 1)**
```sql
-- Map high-risk AR procedures
INSERT INTO procedure_risk_mappings (procedure_id, risk_area, risk_level_required, is_required)
SELECT
  id,
  'accounts_receivable',
  'high',
  true
FROM audit_procedures
WHERE procedure_code IN ('FSA-200', 'FSA-201', 'FSA-202');
```

**Step 3: Backfill Active Engagements (Week 2)**
```sql
-- For engagements in progress without risk assessment
INSERT INTO engagement_risk_assessments (
  engagement_id,
  firm_id,
  industry,
  company_size,
  engagement_type,
  overall_risk_rating,
  fraud_risk_rating,
  it_dependency_rating,
  assessment_date
)
SELECT
  id,
  firm_id,
  COALESCE(client.industry, 'general'),
  'medium',
  CASE
    WHEN DATE_PART('year', start_date) = DATE_PART('year', client.created_at)
    THEN 'first_year'
    ELSE 'recurring'
  END,
  'medium', -- Default to medium risk
  'medium',
  'medium',
  CURRENT_DATE
FROM audits
WHERE status IN ('planning', 'fieldwork', 'in_progress')
AND id NOT IN (SELECT engagement_id FROM engagement_risk_assessments);
```

### 12.3 Feature Rollout Plan

**Phase 1: Internal Testing (Weeks 1-2)**
- Deploy to staging environment
- Test with sample data
- Fix bugs and refine UX

**Phase 2: Beta with Select Clients (Weeks 3-4)**
- Enable for 3-5 pilot firms
- Gather feedback
- Iterate based on real usage

**Phase 3: General Availability (Week 5)**
- Enable for all users
- In-app announcements
- Documentation and training materials
- Optional: webinar for firm administrators

**Phase 4: Drive Adoption (Weeks 6-8)**
- Make risk assessment recommended (not required)
- Show value through analytics ("firms using risk assessment save 15% on planning time")
- Week 8: Consider making risk assessment required for new engagements

---

## 13. Performance Optimization

### 13.1 Database Indexes

```sql
-- Risk assessment lookups
CREATE INDEX idx_risk_assessments_engagement ON engagement_risk_assessments(engagement_id);
CREATE INDEX idx_risk_assessments_current ON engagement_risk_assessments(engagement_id, is_current)
  WHERE is_current = true;

-- Procedure recommendations
CREATE INDEX idx_procedure_risk_mappings_area ON procedure_risk_mappings(risk_area, risk_level_required);
CREATE INDEX idx_procedures_risk_tags ON audit_procedures USING GIN(risk_area_tags);
CREATE INDEX idx_procedures_industries ON audit_procedures USING GIN(applicable_industries);

-- Finding queries
CREATE INDEX idx_findings_engagement ON audit_findings(engagement_id, status);
CREATE INDEX idx_findings_severity ON audit_findings(severity, status);
```

### 13.2 Query Optimization

**Recommendation Engine Query:**
```sql
-- Optimized query with proper joins and filtering
WITH risk_areas AS (
  SELECT area_name, combined_risk
  FROM risk_assessment_areas
  WHERE risk_assessment_id = $1
  AND is_material_area = true
)
SELECT DISTINCT
  p.*,
  prm.recommendation_priority,
  prm.sample_size_override,
  ra.area_name,
  ra.combined_risk
FROM audit_procedures p
INNER JOIN procedure_risk_mappings prm ON p.id = prm.procedure_id
INNER JOIN risk_areas ra ON prm.risk_area = ra.area_name
  AND prm.risk_level_required = ra.combined_risk
WHERE p.is_active = true
AND (p.applicable_industries = '{}' OR $2 = ANY(p.applicable_industries))
ORDER BY prm.recommendation_priority, p.procedure_code;
```

### 13.3 Caching Strategy

**Procedure Library:**
- Cache all procedures for a firm (changes infrequently)
- Invalidate on procedure update
- TTL: 1 hour

**Risk Assessment:**
- Cache current assessment for engagement
- Invalidate on update
- Real-time for active editing

**Recommendations:**
- Cache recommendation results for 5 minutes
- Invalidate when risk assessment changes

---

## 14. Monitoring & Analytics

### 14.1 Usage Metrics

**Track:**
- Risk assessments completed per week
- Time to complete risk assessment (target: <15 minutes)
- Percentage of programs using risk-based recommendations
- Procedure recommendation acceptance rate
- Findings logged per engagement
- Scope changes per engagement

### 14.2 Performance Metrics

**Monitor:**
- Recommendation engine response time (target: <1 second)
- Heat map render time (target: <500ms)
- Database query performance for complex joins
- Page load times for procedure workspace

### 14.3 Business Intelligence

**Reports:**
- Most common risk areas by industry
- Average risk scores by engagement type
- Procedure utilization rates
- Time savings from risk-based approach

---

## 15. Documentation Requirements

### 15.1 Technical Documentation

1. **API Documentation**
   - OpenAPI/Swagger specs for all new endpoints
   - Request/response examples
   - Error codes and handling

2. **Database Documentation**
   - ERD diagrams for new tables
   - Column descriptions
   - Index strategy

3. **Component Documentation**
   - Storybook for all new components
   - Props documentation
   - Usage examples

### 15.2 User Documentation

1. **Risk Assessment Guide**
   - How to complete risk assessment
   - Understanding risk levels
   - Best practices by industry

2. **Program Builder Guide**
   - Interpreting recommendations
   - Customizing suggested procedures
   - Managing scope changes

3. **Procedure Execution Guide**
   - Using the workspace
   - Uploading evidence
   - Review workflow

### 15.3 Training Materials

1. **Video Tutorials**
   - 5-minute: "Completing a Risk Assessment"
   - 10-minute: "Building Risk-Based Programs"
   - 15-minute: "Full Audit Lifecycle"

2. **Interactive Demos**
   - Guided risk assessment walkthrough
   - Sample engagement with dummy data

---

## 16. Success Metrics

### 16.1 Phase 1 Success Criteria (Weeks 1-4)

- [ ] Risk assessment wizard functional with all steps
- [ ] Risk heat map renders correctly
- [ ] Procedure recommendation engine returns accurate suggestions
- [ ] 100+ procedures tagged with risk metadata
- [ ] Database migrations run without errors
- [ ] Unit test coverage >80%

### 16.2 Phase 2 Success Criteria (Weeks 5-12)

- [ ] Procedure workspace fully functional
- [ ] 10+ workpaper templates created
- [ ] Multi-level review workflow working
- [ ] Time tracking integrated
- [ ] Evidence upload and management working
- [ ] User acceptance testing complete

### 16.3 Phase 3 Success Criteria (Weeks 13-20)

- [ ] Finding management system functional
- [ ] Procedure linkage working
- [ ] Scope change workflow with audit trail
- [ ] Impact analysis dashboard complete
- [ ] Integration testing complete

### 16.4 Phase 4 Success Criteria (Weeks 21-26)

- [ ] Production deployment successful
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Training materials published
- [ ] 80% user adoption within first month

---

## 17. Risks & Mitigation

### 17.1 Technical Risks

**Risk: Recommendation engine performance with large procedure libraries**
- Mitigation: Implement caching, optimize queries, add indexes
- Contingency: Paginate results, lazy load

**Risk: Complex state management in risk assessment wizard**
- Mitigation: Use Zustand for state, thorough testing
- Contingency: Simplify workflow, save progress frequently

**Risk: Database migration failures on large datasets**
- Mitigation: Test on production-sized datasets, use transactions
- Contingency: Rollback scripts, incremental migrations

### 17.2 UX Risks

**Risk: Risk assessment too time-consuming**
- Mitigation: Smart defaults, save progress, industry templates
- Contingency: Allow skipping for basic engagements

**Risk: Recommendation overload (too many suggested procedures)**
- Mitigation: Prioritization, filtering, visual hierarchy
- Contingency: Group by risk area, collapsible sections

### 17.3 Adoption Risks

**Risk: Users resist new workflow**
- Mitigation: Training, show value, make optional initially
- Contingency: Gradual rollout, gather feedback

**Risk: Existing engagements disrupted**
- Mitigation: Backward compatibility, optional backfill
- Contingency: Separate "legacy" mode for old engagements

---

## 18. Next Steps

### 18.1 Immediate Actions (Week 1)

1. **Review and approve design document**
2. **Set up development environment**
3. **Create database migration files**
4. **Set up component structure**
5. **Begin risk assessment wizard implementation**

### 18.2 Phase 1 Deliverables (Weeks 1-4)

1. All database migrations created and tested
2. Risk assessment wizard fully functional
3. Procedure library enhanced with risk metadata
4. Recommendation engine working
5. Risk heat map visualization complete
6. TypeScript types defined
7. Unit tests written

### 18.3 Phase 2 Planning (Weeks 5-12)

1. Procedure workspace design finalized
2. Workpaper template system architected
3. Evidence management planned
4. Review workflow designed

---

## Appendix A: Risk Level Definitions

**Low Risk:**
- Minimal inherent risk
- Strong controls in place
- No significant history of issues
- Limited complexity
- Sample: 60-70% coverage, limited depth

**Medium Risk:**
- Moderate inherent risk
- Adequate controls
- Some historical issues
- Standard complexity
- Sample: 70-80% coverage, standard depth

**High Risk:**
- Significant inherent risk
- Weak or untested controls
- History of material issues
- Complex transactions
- Sample: 85-95% coverage, enhanced depth

**Significant Risk:**
- Very high inherent risk
- Controls ineffective or absent
- Material issues identified
- High complexity or fraud indicators
- Sample: 95-100% coverage, extensive procedures

---

## Appendix B: Industry-Specific Considerations

**Healthcare:**
- High AR risk (patient payments, insurance)
- Revenue recognition complexity
- Regulatory compliance (HIPAA)
- Enhanced procedures: FSA-200, FSA-201, FSA-202, FSA-400

**Financial Services:**
- High cash/investment risk
- Regulatory capital requirements
- Complex financial instruments
- Enhanced procedures: FSA-100, FSA-101, FSA-500, FSA-600

**Technology/SaaS:**
- Revenue recognition (ASC 606)
- Capitalized development costs
- Stock-based compensation
- Enhanced procedures: FSA-400, FSA-401, FSA-700

**Manufacturing:**
- High inventory risk
- Cost accounting complexity
- Physical assets
- Enhanced procedures: FSA-300, FSA-301, FSA-302

---

## Appendix C: Sample Risk Assessment Templates

### Template 1: Small Healthcare Client (First Year)

**Business Profile:**
- Industry: Healthcare
- Size: Small ($5M revenue)
- Type: First-year audit
- Complexity: Low (single entity, local operations)

**Risk Ratings:**
- Cash: Low (simple operations)
- AR: High (patient payments, insurance complexity)
- Revenue: High (multiple payer types)
- Expenses: Medium
- Overall: High

**Recommended Procedures:** 12 core + 6 healthcare-specific

### Template 2: Large Tech Company (Recurring)

**Business Profile:**
- Industry: SaaS/Technology
- Size: Large ($500M revenue)
- Type: Recurring (Year 3)
- Complexity: High (multi-entity, international)

**Risk Ratings:**
- Cash: Low (strong controls, history clean)
- AR: Medium (subscription model, predictable)
- Revenue: High (ASC 606 complexity)
- Deferred Revenue: High
- Stock Comp: Medium
- Overall: Medium-High

**Recommended Procedures:** 20 core + 8 tech-specific

---

## Document Version Control

**Version:** 1.0
**Date:** November 29, 2025
**Author:** Senior Product Manager & Technical Architect
**Status:** Draft for Review
**Next Review:** After Phase 1 implementation

**Change Log:**
- v1.0 (Nov 29, 2025): Initial comprehensive design document
