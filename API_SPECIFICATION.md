# API SPECIFICATION
## Hooks, Endpoints, and Data Layer

---

## Table of Contents
1. [React Query Hooks](#1-react-query-hooks)
2. [Database Queries](#2-database-queries)
3. [Utility Functions](#3-utility-functions)
4. [Type Definitions](#4-type-definitions)
5. [Error Handling](#5-error-handling)
6. [Cache Strategy](#6-cache-strategy)

---

## 1. React Query Hooks

### 1.1 useRiskAssessment

**Purpose:** Fetch current risk assessment for an engagement

**File:** `src/hooks/useRiskAssessment.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { EngagementRiskAssessment } from '@/types/risk-assessment';

export function useRiskAssessment(engagementId: string) {
  return useQuery({
    queryKey: ['risk-assessment', engagementId],
    queryFn: async (): Promise<EngagementRiskAssessment | null> => {
      const { data, error } = await supabase
        .from('engagement_risk_assessments')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_current', true)
        .single();

      // PGRST116 = no rows found (not an error in this case)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
```

**Query Key Pattern:** `['risk-assessment', engagementId]`

**Returns:**
- `data: EngagementRiskAssessment | null`
- `isLoading: boolean`
- `error: Error | null`

**Cache Invalidation Triggers:**
- New risk assessment created
- Risk assessment updated
- Engagement deleted

---

### 1.2 useRiskAssessmentAreas

**Purpose:** Fetch risk areas for a specific assessment

**File:** `src/hooks/useRiskAssessment.tsx`

```typescript
export function useRiskAssessmentAreas(assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['risk-areas', assessmentId],
    queryFn: async (): Promise<RiskAreaAssessment[]> => {
      if (!assessmentId) return [];

      const { data, error } = await supabase
        .from('risk_assessment_areas')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('area_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000,
  });
}
```

**Query Key Pattern:** `['risk-areas', assessmentId]`

**Returns:**
- `data: RiskAreaAssessment[]`
- `isLoading: boolean`
- `error: Error | null`

---

### 1.3 useCreateRiskAssessment

**Purpose:** Create new risk assessment with areas

**File:** `src/hooks/useRiskAssessment.tsx`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRiskAssessmentInput) => {
      // Step 1: Set all existing assessments to is_current=false
      await supabase
        .from('engagement_risk_assessments')
        .update({ is_current: false })
        .eq('engagement_id', input.engagement_id);

      // Step 2: Create new assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('engagement_risk_assessments')
        .insert({
          engagement_id: input.engagement_id,
          assessment_date: input.assessment_date || new Date().toISOString(),
          assessed_by: input.assessed_by,
          industry: input.industry,
          company_size: input.company_size,
          revenue_range: input.revenue_range,
          complexity_factors: input.complexity_factors,
          overall_risk_rating: input.overall_risk_rating,
          fraud_risk_assessment: input.fraud_risk_assessment,
          it_risk_assessment: input.it_risk_assessment,
          is_current: true,
          version: 1,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Step 3: Create risk areas
      if (input.areas && input.areas.length > 0) {
        const areasToInsert = input.areas.map(area => ({
          assessment_id: assessment.id,
          area_name: area.area_name,
          area_category: area.area_category,
          inherent_risk: area.inherent_risk,
          control_risk: area.control_risk,
          combined_risk: area.combined_risk,
          is_material_area: area.is_material_area,
          key_risk_factors: area.key_risk_factors,
          fraud_risk_factors: area.fraud_risk_factors,
          notes: area.notes,
        }));

        const { error: areasError } = await supabase
          .from('risk_assessment_areas')
          .insert(areasToInsert);

        if (areasError) throw areasError;
      }

      return assessment.id;
    },
    onSuccess: (assessmentId, variables) => {
      // Invalidate risk assessment cache
      queryClient.invalidateQueries({
        queryKey: ['risk-assessment', variables.engagement_id]
      });

      // Invalidate risk areas cache
      queryClient.invalidateQueries({
        queryKey: ['risk-areas', assessmentId]
      });

      // Invalidate recommendations cache (will be recalculated)
      queryClient.invalidateQueries({
        queryKey: ['recommendations', assessmentId]
      });
    },
  });
}
```

**Input Type:**
```typescript
interface CreateRiskAssessmentInput {
  engagement_id: string;
  assessment_date?: string;
  assessed_by: string;
  industry: string;
  company_size: string;
  revenue_range?: string;
  complexity_factors: any[];
  overall_risk_rating: string;
  fraud_risk_assessment?: any;
  it_risk_assessment?: any;
  areas: {
    area_name: string;
    area_category: string;
    inherent_risk: string;
    control_risk: string;
    combined_risk: string;
    is_material_area: boolean;
    key_risk_factors: string[];
    fraud_risk_factors: string[];
    notes?: string;
  }[];
}
```

**Returns:**
- `mutate: (data: CreateRiskAssessmentInput) => void`
- `mutateAsync: (data: CreateRiskAssessmentInput) => Promise<string>`
- `isPending: boolean`
- `error: Error | null`

---

### 1.4 useUpdateRiskAssessment

**Purpose:** Update existing risk assessment (reassessment)

```typescript
export function useUpdateRiskAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRiskAssessmentInput) => {
      // Update assessment
      const { error: updateError } = await supabase
        .from('engagement_risk_assessments')
        .update({
          industry: input.industry,
          company_size: input.company_size,
          revenue_range: input.revenue_range,
          complexity_factors: input.complexity_factors,
          overall_risk_rating: input.overall_risk_rating,
          fraud_risk_assessment: input.fraud_risk_assessment,
          it_risk_assessment: input.it_risk_assessment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.assessment_id);

      if (updateError) throw updateError;

      // Update areas if provided
      if (input.areas) {
        // Delete existing areas
        await supabase
          .from('risk_assessment_areas')
          .delete()
          .eq('assessment_id', input.assessment_id);

        // Insert updated areas
        const areasToInsert = input.areas.map(area => ({
          assessment_id: input.assessment_id,
          ...area,
        }));

        const { error: areasError } = await supabase
          .from('risk_assessment_areas')
          .insert(areasToInsert);

        if (areasError) throw areasError;
      }

      return input.assessment_id;
    },
    onSuccess: (assessmentId, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['risk-assessment', variables.engagement_id]
      });
      queryClient.invalidateQueries({
        queryKey: ['risk-areas', assessmentId]
      });
      queryClient.invalidateQueries({
        queryKey: ['recommendations', assessmentId]
      });
    },
  });
}
```

---

### 1.5 useProcedureRecommendations

**Purpose:** Generate procedure recommendations based on risk assessment

**File:** `src/hooks/useProcedureRecommendations.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { recommendProcedures } from '@/utils/procedureRecommendations';
import type { RecommendationResult } from '@/types/procedures';

export function useProcedureRecommendations(riskAssessmentId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', riskAssessmentId],
    queryFn: async (): Promise<RecommendationResult | null> => {
      if (!riskAssessmentId) return null;

      // Fetch risk assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('engagement_risk_assessments')
        .select('*')
        .eq('id', riskAssessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Fetch risk areas
      const { data: areas, error: areasError } = await supabase
        .from('risk_assessment_areas')
        .select('*')
        .eq('assessment_id', riskAssessmentId);

      if (areasError) throw areasError;

      // Fetch all active procedures
      const { data: procedures, error: proceduresError } = await supabase
        .from('audit_procedures')
        .select('*')
        .eq('is_active', true);

      if (proceduresError) throw proceduresError;

      // Fetch procedure risk mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('procedure_risk_mappings')
        .select('*')
        .eq('is_recommended', true);

      if (mappingsError) throw mappingsError;

      // Compute recommendations locally
      const result = recommendProcedures(
        assessment,
        areas || [],
        procedures || [],
        mappings || []
      );

      return {
        ...result,
        risk_areas: areas || [],
      };
    },
    enabled: !!riskAssessmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
}
```

**Query Key Pattern:** `['recommendations', riskAssessmentId]`

**Returns:**
```typescript
{
  data: {
    recommendations: ProcedureRecommendation[];
    coverage_analysis: CoverageAnalysis;
    total_estimated_hours: number;
    risk_areas: RiskAreaAssessment[];
  } | null;
  isLoading: boolean;
  error: Error | null;
}
```

---

### 1.6 useCreateEngagementProgram

**Purpose:** Create engagement program with selected procedures

**File:** `src/hooks/useEngagementPrograms.tsx`

```typescript
export function useCreateEngagementProgram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEngagementProgramInput) => {
      // Step 1: Create engagement program
      const { data: program, error: programError } = await supabase
        .from('engagement_programs')
        .insert({
          engagement_id: input.engagement_id,
          program_name: input.program_name,
          program_description: input.program_description,
          risk_assessment_id: input.risk_assessment_id,
          total_procedures: input.procedure_ids.length,
          total_estimated_hours: input.total_estimated_hours,
          status: 'in_progress',
        })
        .select()
        .single();

      if (programError) throw programError;

      // Step 2: Create engagement procedures
      const proceduresToInsert = input.procedure_ids.map((procedureId, index) => ({
        engagement_id: input.engagement_id,
        program_id: program.id,
        procedure_id: procedureId,
        sequence_number: index + 1,
        status: 'not_started',
        estimated_hours: input.procedure_hours?.[procedureId] || 0,
      }));

      const { error: proceduresError } = await supabase
        .from('engagement_procedures')
        .insert(proceduresToInsert);

      if (proceduresError) throw proceduresError;

      return program.id;
    },
    onSuccess: (programId, variables) => {
      // Invalidate programs cache
      queryClient.invalidateQueries({
        queryKey: ['engagement-programs', variables.engagement_id]
      });

      // Invalidate procedures cache
      queryClient.invalidateQueries({
        queryKey: ['engagement-procedures', variables.engagement_id]
      });
    },
  });
}
```

**Input Type:**
```typescript
interface CreateEngagementProgramInput {
  engagement_id: string;
  program_name: string;
  program_description?: string;
  risk_assessment_id: string;
  procedure_ids: string[];
  procedure_hours?: Record<string, number>;
  total_estimated_hours: number;
}
```

---

## 2. Database Queries

### 2.1 Risk Assessment Queries

**Get Current Risk Assessment:**
```sql
SELECT *
FROM engagement_risk_assessments
WHERE engagement_id = $1
  AND is_current = true
LIMIT 1;
```

**Get Risk Areas:**
```sql
SELECT *
FROM risk_assessment_areas
WHERE assessment_id = $1
ORDER BY area_name;
```

**Get All Risk Assessments (History):**
```sql
SELECT *
FROM engagement_risk_assessments
WHERE engagement_id = $1
ORDER BY assessment_date DESC, version DESC;
```

---

### 2.2 Procedure Queries

**Get Active Procedures:**
```sql
SELECT *
FROM audit_procedures
WHERE is_active = true
ORDER BY procedure_code;
```

**Get Procedure Risk Mappings:**
```sql
SELECT *
FROM procedure_risk_mappings
WHERE is_recommended = true
  AND risk_area = $1
  AND risk_level_required = $2;
```

**Get Procedures for Engagement:**
```sql
SELECT
  ep.*,
  ap.procedure_code,
  ap.procedure_name,
  ap.category,
  ap.objective,
  ap.detailed_steps
FROM engagement_procedures ep
INNER JOIN audit_procedures ap ON ap.id = ep.procedure_id
WHERE ep.engagement_id = $1
ORDER BY ep.sequence_number;
```

---

### 2.3 Performance Indexes

**Required Indexes:**
```sql
-- Fast lookup of current risk assessment
CREATE INDEX idx_risk_assessment_engagement_current
ON engagement_risk_assessments(engagement_id, is_current)
WHERE is_current = true;

-- Fast risk areas lookup
CREATE INDEX idx_risk_areas_assessment
ON risk_assessment_areas(assessment_id);

-- Fast procedure mapping lookup
CREATE INDEX idx_procedure_mappings_lookup
ON procedure_risk_mappings(risk_area, risk_level_required, is_recommended)
WHERE is_recommended = true;

-- Fast engagement procedures lookup
CREATE INDEX idx_engagement_procedures_lookup
ON engagement_procedures(engagement_id, status);
```

---

## 3. Utility Functions

### 3.1 recommendProcedures

**File:** `src/utils/procedureRecommendations.ts`

**Purpose:** Core recommendation engine

**Signature:**
```typescript
export function recommendProcedures(
  riskAssessment: EngagementRiskAssessment,
  riskAreas: RiskAreaAssessment[],
  allProcedures: AuditProcedure[],
  procedureRiskMappings: ProcedureRiskMapping[]
): RecommendationResult;
```

**Algorithm:**
```typescript
function recommendProcedures(assessment, areas, procedures, mappings) {
  const recommendations = [];

  // For each material risk area
  for (const area of areas.filter(a => a.is_material_area)) {
    // Find mappings for this area + risk level
    const areaName = area.area_name.toLowerCase().replace(/ /g, '_');
    const relevantMappings = mappings.filter(m =>
      m.risk_area === areaName &&
      m.risk_level_required === area.combined_risk
    );

    for (const mapping of relevantMappings) {
      const procedure = procedures.find(p => p.id === mapping.procedure_id);
      if (!procedure || !procedure.is_active) continue;

      // Determine priority
      let priority: 'required' | 'recommended' | 'optional';
      if (area.combined_risk === 'significant' || area.combined_risk === 'high') {
        priority = mapping.priority === 'required' ? 'required' : 'recommended';
      } else if (area.combined_risk === 'medium') {
        priority = 'recommended';
      } else {
        priority = 'optional';
      }

      // Adjust hours based on risk
      const baseHours = procedure.estimated_hours || 0;
      const adjusted_hours = adjustHoursForRisk(baseHours, area.combined_risk);

      // Adjust sample size
      const adjusted_sample_size = adjustSampleSizeForRisk(
        procedure.sample_size_guidance,
        area.combined_risk
      );

      // Generate risk rationale
      const risk_rationale = generateRiskRationale(area, procedure);

      recommendations.push({
        procedure,
        priority,
        risk_area: areaName,
        risk_level: area.combined_risk,
        risk_rationale,
        adjusted_hours,
        adjusted_sample_size,
        base_hours: baseHours,
        base_sample_size: procedure.sample_size_guidance,
      });
    }
  }

  // Deduplicate (procedure may apply to multiple areas)
  const uniqueRecommendations = deduplicateRecommendations(recommendations);

  // Sort by priority
  const sorted = sortByPriority(uniqueRecommendations);

  // Calculate coverage
  const coverage_analysis = analyzeCoverage(areas, sorted);

  // Calculate total hours
  const total_estimated_hours = sorted.reduce(
    (sum, rec) => sum + rec.adjusted_hours,
    0
  );

  return {
    recommendations: sorted,
    coverage_analysis,
    total_estimated_hours,
  };
}
```

---

### 3.2 adjustHoursForRisk

```typescript
function adjustHoursForRisk(baseHours: number, riskLevel: RiskLevel): number {
  const multipliers: Record<RiskLevel, number> = {
    significant: 1.5,
    high: 1.3,
    medium: 1.0,
    low: 0.8,
  };

  return Math.round(baseHours * multipliers[riskLevel]);
}
```

---

### 3.3 adjustSampleSizeForRisk

```typescript
function adjustSampleSizeForRisk(
  baseSample: string | null,
  riskLevel: RiskLevel
): string {
  if (riskLevel === 'significant') {
    return '100% of population (all items)';
  }
  if (riskLevel === 'high') {
    return 'Top 90% of balances or 30+ items, whichever is greater';
  }
  if (riskLevel === 'medium') {
    return 'Top 70% of balances or 25+ items';
  }
  return 'Top 50% of balances or 15+ items';
}
```

---

### 3.4 generateRiskRationale

```typescript
function generateRiskRationale(
  area: RiskAreaAssessment,
  procedure: AuditProcedure
): string {
  const riskLevelText = area.combined_risk === 'significant' ? 'significant' :
                        area.combined_risk === 'high' ? 'high' :
                        area.combined_risk === 'medium' ? 'medium' : 'low';

  const areaName = area.area_name;

  // Generate context-aware rationale
  if (area.combined_risk === 'significant' || area.combined_risk === 'high') {
    const factors = area.key_risk_factors?.slice(0, 2).join(', ') || 'complex transactions';
    return `${areaName} represents ${riskLevelText} risk due to ${factors}. This procedure is required to obtain sufficient appropriate audit evidence.`;
  }

  if (area.combined_risk === 'medium') {
    return `${areaName} has ${riskLevelText} risk. This procedure is recommended to address potential material misstatement risks.`;
  }

  return `${areaName} has ${riskLevelText} risk. This procedure provides additional assurance but may be optional based on engagement risk tolerance.`;
}
```

---

### 3.5 calculateCoverage

```typescript
function calculateCoverage(
  riskAreas: RiskAreaAssessment[],
  selectedRecommendations: ProcedureRecommendation[]
): CoverageAnalysis {
  const coverageByArea = riskAreas.map(area => {
    const areaProcedures = selectedRecommendations.filter(
      rec => rec.risk_area === area.area_name.toLowerCase().replace(/ /g, '_')
    );

    const requiredCount = areaProcedures.filter(p => p.priority === 'required').length;
    const totalCount = areaProcedures.length;

    // Determine status
    let status: 'adequate' | 'warning' | 'critical';
    if (area.combined_risk === 'significant' || area.combined_risk === 'high') {
      status = requiredCount >= 3 ? 'adequate' :
               requiredCount >= 1 ? 'warning' : 'critical';
    } else if (area.combined_risk === 'medium') {
      status = totalCount >= 2 ? 'adequate' :
               totalCount >= 1 ? 'warning' : 'critical';
    } else {
      status = totalCount >= 1 ? 'adequate' : 'warning';
    }

    return {
      area,
      procedureCount: totalCount,
      requiredCount,
      status,
    };
  });

  const criticalGaps = coverageByArea.filter(c => c.status === 'critical');
  const warnings = coverageByArea.filter(c => c.status === 'warning');

  const adequateCount = coverageByArea.filter(c => c.status === 'adequate').length;
  const overallScore = Math.round((adequateCount / coverageByArea.length) * 100);

  return {
    byArea: coverageByArea,
    criticalGaps,
    warnings,
    overallScore,
  };
}
```

---

## 4. Type Definitions

### 4.1 Core Types

Already defined in:
- `src/types/risk-assessment.ts`
- `src/types/procedures.ts`
- `src/types/findings.ts`

### 4.2 Additional Hook Types

**Hook Input Types:**
```typescript
// useCreateRiskAssessment
export interface CreateRiskAssessmentInput {
  engagement_id: string;
  assessed_by: string;
  assessment_date?: string;
  industry: Industry;
  company_size: CompanySize;
  revenue_range?: string;
  complexity_factors: ComplexityFactor[];
  overall_risk_rating: RiskLevel;
  fraud_risk_assessment?: FraudRiskAssessment;
  it_risk_assessment?: ITRiskAssessment;
  areas: CreateRiskAreaInput[];
}

export interface CreateRiskAreaInput {
  area_name: string;
  area_category: AreaCategory;
  inherent_risk: RiskLevel;
  control_risk: RiskLevel;
  combined_risk: RiskLevel;
  is_material_area: boolean;
  key_risk_factors: string[];
  fraud_risk_factors: string[];
  notes?: string;
}

// useCreateEngagementProgram
export interface CreateEngagementProgramInput {
  engagement_id: string;
  program_name: string;
  program_description?: string;
  risk_assessment_id: string;
  procedure_ids: string[];
  procedure_hours?: Record<string, number>;
  total_estimated_hours: number;
}
```

---

## 5. Error Handling

### 5.1 Error Types

```typescript
export class RiskAssessmentError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RiskAssessmentError';
  }
}

export class ProcedureRecommendationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ProcedureRecommendationError';
  }
}
```

### 5.2 Error Codes

```typescript
export const ERROR_CODES = {
  // Risk Assessment Errors
  RISK_ASSESSMENT_NOT_FOUND: 'RISK_ASSESSMENT_NOT_FOUND',
  RISK_AREAS_MISSING: 'RISK_AREAS_MISSING',
  INVALID_RISK_LEVEL: 'INVALID_RISK_LEVEL',

  // Recommendation Errors
  NO_PROCEDURES_FOUND: 'NO_PROCEDURES_FOUND',
  NO_MAPPINGS_FOUND: 'NO_MAPPINGS_FOUND',
  INVALID_COVERAGE: 'INVALID_COVERAGE',

  // Program Creation Errors
  PROGRAM_ALREADY_EXISTS: 'PROGRAM_ALREADY_EXISTS',
  NO_PROCEDURES_SELECTED: 'NO_PROCEDURES_SELECTED',
  CRITICAL_GAPS_EXIST: 'CRITICAL_GAPS_EXIST',
} as const;
```

### 5.3 Error Handling Pattern

```typescript
// In hooks
try {
  const result = await operation();
  return result;
} catch (error: any) {
  // Log to monitoring service
  console.error('Operation failed:', error);

  // Re-throw with context
  if (error.code === 'PGRST116') {
    throw new RiskAssessmentError(
      'Risk assessment not found',
      ERROR_CODES.RISK_ASSESSMENT_NOT_FOUND
    );
  }

  throw error;
}

// In components
const { data, error } = useRiskAssessment(engagementId);

if (error) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error Loading Risk Assessment</AlertTitle>
      <AlertDescription>
        {error.message}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 6. Cache Strategy

### 6.1 Cache Keys

```typescript
// Risk Assessment
['risk-assessment', engagementId]
['risk-areas', assessmentId]
['risk-assessment-history', engagementId]

// Recommendations
['recommendations', riskAssessmentId]

// Programs & Procedures
['engagement-programs', engagementId]
['engagement-procedures', engagementId]
['audit-procedures'] // All procedures (rarely changes)

// Mappings
['procedure-risk-mappings'] // All mappings (rarely changes)
```

### 6.2 Stale Times

```typescript
const CACHE_CONFIG = {
  riskAssessment: {
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes
  },
  recommendations: {
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime: 15 * 60 * 1000,       // 15 minutes
  },
  procedures: {
    staleTime: 30 * 60 * 1000,   // 30 minutes (rarely changes)
    gcTime: 60 * 60 * 1000,       // 1 hour
  },
  programs: {
    staleTime: 2 * 60 * 1000,    // 2 minutes
    gcTime: 5 * 60 * 1000,        // 5 minutes
  },
};
```

### 6.3 Invalidation Strategy

```typescript
// When risk assessment created/updated
queryClient.invalidateQueries({ queryKey: ['risk-assessment', engagementId] });
queryClient.invalidateQueries({ queryKey: ['risk-areas', assessmentId] });
queryClient.invalidateQueries({ queryKey: ['recommendations', assessmentId] });

// When program created
queryClient.invalidateQueries({ queryKey: ['engagement-programs', engagementId] });
queryClient.invalidateQueries({ queryKey: ['engagement-procedures', engagementId] });

// When procedure status updated
queryClient.invalidateQueries({ queryKey: ['engagement-procedures', engagementId] });
```

### 6.4 Optimistic Updates

```typescript
// Example: Update procedure status optimistically
const updateProcedureStatus = useMutation({
  mutationFn: async ({ procedureId, status }) => {
    const { error } = await supabase
      .from('engagement_procedures')
      .update({ status })
      .eq('id', procedureId);

    if (error) throw error;
  },
  onMutate: async ({ procedureId, status }) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: ['engagement-procedures', engagementId]
    });

    // Snapshot previous value
    const previousProcedures = queryClient.getQueryData([
      'engagement-procedures',
      engagementId
    ]);

    // Optimistically update
    queryClient.setQueryData(
      ['engagement-procedures', engagementId],
      (old: any[]) => old.map(p =>
        p.id === procedureId ? { ...p, status } : p
      )
    );

    return { previousProcedures };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousProcedures) {
      queryClient.setQueryData(
        ['engagement-procedures', engagementId],
        context.previousProcedures
      );
    }
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({
      queryKey: ['engagement-procedures', engagementId]
    });
  },
});
```

---

## 7. Performance Optimization

### 7.1 Prefetching

```typescript
// Prefetch recommendations when risk assessment loads
useEffect(() => {
  if (riskAssessment?.id) {
    queryClient.prefetchQuery({
      queryKey: ['recommendations', riskAssessment.id],
      queryFn: () => fetchRecommendations(riskAssessment.id),
    });
  }
}, [riskAssessment?.id]);
```

### 7.2 Parallel Queries

```typescript
// Use useQueries for parallel fetching
const results = useQueries({
  queries: [
    {
      queryKey: ['risk-assessment', engagementId],
      queryFn: () => fetchRiskAssessment(engagementId),
    },
    {
      queryKey: ['engagement-programs', engagementId],
      queryFn: () => fetchPrograms(engagementId),
    },
    {
      queryKey: ['engagement-procedures', engagementId],
      queryFn: () => fetchProcedures(engagementId),
    },
  ],
});

const [riskQuery, programsQuery, proceduresQuery] = results;
```

### 7.3 Pagination (Future)

```typescript
// For large procedure lists
export function useProcedures(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ['procedures', page, pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('audit_procedures')
        .select('*', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('procedure_code');

      if (error) throw error;

      return {
        procedures: data,
        totalCount: count,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    keepPreviousData: true,
  });
}
```

---

## 8. Testing

### 8.1 Hook Testing

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRiskAssessment } from '../useRiskAssessment';

describe('useRiskAssessment', () => {
  it('fetches risk assessment successfully', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useRiskAssessment('engagement-123'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.engagement_id).toBe('engagement-123');
  });

  it('returns null when no risk assessment exists', async () => {
    // Test PGRST116 error handling
  });

  it('caches results for 5 minutes', async () => {
    // Test cache behavior
  });
});
```

---

**API Specification Complete**
**Total Hooks:** 6 core hooks + utilities
**Total Utility Functions:** 5+ calculation functions
**Ready for Implementation:** Yes
