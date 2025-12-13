# COMPONENT SPECIFICATIONS
## Detailed TypeScript Interfaces and Implementation Guides

---

## Table of Contents
1. [RiskAssessmentSummaryCard](#1-riskassessmentsummarycard)
2. [EnhancedProgramBuilderWizard](#2-enhancedprogrambuilderwizard)
3. [ProcedureRecommendationCard](#3-procedurerecommendationcard)
4. [RiskCoverageAnalysisPanel](#4-riskcoverageanalysispanel)
5. [RiskCoverageStatusCard](#5-riskcoveragestatuscard)
6. [Supporting Components](#6-supporting-components)

---

## 1. RiskAssessmentSummaryCard

### 1.1 Purpose
Display risk assessment summary with key statistics, heat map toggle, and action buttons. Used in both "ready to build program" state and "program exists" state.

### 1.2 File Location
`src/components/audit/risk/RiskAssessmentSummaryCard.tsx`

### 1.3 Full TypeScript Interface

```typescript
import type { EngagementRiskAssessment } from '@/types/risk-assessment';
import type { EngagementProcedure } from '@/types/procedures';

interface RiskAssessmentSummaryCardProps {
  /** The risk assessment to display */
  assessment: EngagementRiskAssessment;

  /** Display mode - full shows all details, compact shows summary only */
  mode?: 'full' | 'compact';

  /** Whether to show the heat map by default */
  defaultShowHeatMap?: boolean;

  /** Whether to show coverage analysis section */
  showCoverageAnalysis?: boolean;

  /** Procedures for coverage analysis (required if showCoverageAnalysis=true) */
  procedures?: EngagementProcedure[];

  /** Callback when reassess button clicked */
  onReassess: () => void;

  /** Callback when build program button clicked (only shown if no program exists) */
  onBuildProgram?: () => void;

  /** Optional className for styling */
  className?: string;
}

interface RiskStats {
  significant: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}
```

### 1.4 Implementation Scaffold

```typescript
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RiskHeatMap } from './RiskHeatMap';
import { Eye, EyeOff, RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { getRiskBadgeVariant, getRiskColor } from '@/types/risk-assessment';
import type { RiskAssessmentSummaryCardProps } from './types';

export function RiskAssessmentSummaryCard({
  assessment,
  mode = 'full',
  defaultShowHeatMap = false,
  showCoverageAnalysis = false,
  procedures,
  onReassess,
  onBuildProgram,
  className
}: RiskAssessmentSummaryCardProps) {
  const [heatMapVisible, setHeatMapVisible] = useState(defaultShowHeatMap);

  // Calculate risk statistics
  const riskStats: RiskStats = {
    significant: assessment.areas?.filter(a => a.combined_risk === 'significant').length || 0,
    high: assessment.areas?.filter(a => a.combined_risk === 'high').length || 0,
    medium: assessment.areas?.filter(a => a.combined_risk === 'medium').length || 0,
    low: assessment.areas?.filter(a => a.combined_risk === 'low').length || 0,
    total: assessment.areas?.length || 0
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">Risk Assessment Summary</CardTitle>
              <Badge variant={getRiskBadgeVariant(assessment.overall_risk_rating)}>
                {assessment.overall_risk_rating.toUpperCase()} RISK
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <span>
                Assessed {format(new Date(assessment.assessment_date), 'MMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">•</span>
              <span>by {assessment.assessed_by_name || 'Team'}</span>
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {mode === 'full' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHeatMapVisible(!heatMapVisible)}
              >
                {heatMapVisible ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Hide Heat Map</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />View Heat Map</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onReassess}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reassess
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Risk Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {riskStats.significant > 0 && (
            <RiskStatCard
              label="Significant Risk"
              count={riskStats.significant}
              color="red"
            />
          )}
          <RiskStatCard
            label="High Risk"
            count={riskStats.high}
            color="orange"
          />
          <RiskStatCard
            label="Medium Risk"
            count={riskStats.medium}
            color="yellow"
          />
          <RiskStatCard
            label="Low Risk"
            count={riskStats.low}
            color="green"
          />
        </div>

        {/* Industry and Complexity Summary */}
        {mode === 'full' && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Industry</p>
                <p className="font-medium">{assessment.industry}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Company Size</p>
                <p className="font-medium">{assessment.company_size}</p>
              </div>
            </div>

            {assessment.complexity_factors && assessment.complexity_factors.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Complexity Factors</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.complexity_factors.map((factor: any) => (
                    <Badge key={factor.id} variant="outline">
                      {factor.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Heat Map (Expandable) */}
        {heatMapVisible && mode === 'full' && (
          <>
            <Separator />
            <div className="p-4 border rounded-lg bg-muted/50">
              <RiskHeatMap assessment={assessment} />
            </div>
          </>
        )}

        {/* Build Program CTA (if no program exists) */}
        {onBuildProgram && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
              <div>
                <h4 className="font-medium mb-1">Ready to Build Your Audit Program</h4>
                <p className="text-sm text-muted-foreground">
                  Use AI-recommended procedures based on your risk assessment
                </p>
              </div>
              <Button onClick={onBuildProgram} size="lg">
                <TrendingUp className="h-4 w-4 mr-2" />
                Build Risk-Based Program
              </Button>
            </div>
          </>
        )}

        {/* Coverage Analysis (if program exists) */}
        {showCoverageAnalysis && procedures && (
          <>
            <Separator />
            <RiskCoverageStatusCard
              assessment={assessment}
              procedures={procedures}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Supporting subcomponent
function RiskStatCard({ label, count, color }: {
  label: string;
  count: number;
  color: 'red' | 'orange' | 'yellow' | 'green';
}) {
  const colorClasses = {
    red: 'text-red-600 dark:text-red-400',
    orange: 'text-orange-600 dark:text-orange-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    green: 'text-green-600 dark:text-green-400'
  };

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>
        {count}
      </p>
      <p className="text-xs text-muted-foreground">
        {count === 1 ? 'Risk Area' : 'Risk Areas'}
      </p>
    </div>
  );
}
```

### 1.5 Props Behavior Matrix

| Prop Combination | Behavior |
|-----------------|----------|
| `mode='full'` | Shows all sections: stats, industry, complexity, heat map toggle |
| `mode='compact'` | Shows only: stats + reassess button |
| `defaultShowHeatMap=true` | Heat map visible on mount |
| `onBuildProgram` provided | Shows "Build Program" CTA button |
| `showCoverageAnalysis=true` + `procedures` | Shows RiskCoverageStatusCard below |
| No `procedures` but `showCoverageAnalysis=true` | Logs warning, doesn't show coverage |

### 1.6 State Management
- **Local State Only:** `heatMapVisible` (boolean)
- **No Data Fetching:** All data passed as props
- **No Side Effects:** Pure display component

### 1.7 Usage Examples

```typescript
// Example 1: Full mode with build program button (no program exists yet)
<RiskAssessmentSummaryCard
  assessment={riskAssessment}
  mode="full"
  onReassess={() => setRiskWizardOpen(true)}
  onBuildProgram={() => setProgramBuilderOpen(true)}
/>

// Example 2: Compact mode in program view
<RiskAssessmentSummaryCard
  assessment={riskAssessment}
  mode="compact"
  onReassess={() => setRiskWizardOpen(true)}
/>

// Example 3: Full mode with coverage analysis
<RiskAssessmentSummaryCard
  assessment={riskAssessment}
  mode="full"
  showCoverageAnalysis={true}
  procedures={procedures}
  onReassess={() => setRiskWizardOpen(true)}
/>
```

---

## 2. EnhancedProgramBuilderWizard

### 2.1 Purpose
Risk-driven program builder that fetches recommendations, displays procedures grouped by priority, and provides real-time coverage analysis.

### 2.2 File Location
`src/components/audit/programs/EnhancedProgramBuilderWizard.tsx`

### 2.3 Full TypeScript Interface

```typescript
import type { ProcedureRecommendation, RecommendationResult } from '@/types/procedures';

interface EnhancedProgramBuilderWizardProps {
  /** Engagement ID for the program */
  engagementId: string;

  /** Risk assessment ID to use for recommendations */
  riskAssessmentId: string;

  /** Whether dialog is open */
  open: boolean;

  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;

  /** Callback when program successfully created */
  onComplete?: (programId: string) => void;

  /** Optional initial program name */
  initialProgramName?: string;
}

interface EnhancedProgramBuilderWizardState {
  currentTab: 'required' | 'recommended' | 'optional';
  selectedProcedureIds: Set<string>;
  programName: string;
  programDescription: string;
  isSubmitting: boolean;
}

interface GroupedRecommendations {
  required: ProcedureRecommendation[];
  recommended: ProcedureRecommendation[];
  optional: ProcedureRecommendation[];
}
```

### 2.4 Implementation Scaffold

```typescript
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { useProcedureRecommendations } from '@/hooks/useProcedureRecommendations';
import { useCreateEngagementProgram } from '@/hooks/useEngagementPrograms';
import { ProcedureRecommendationCard } from './ProcedureRecommendationCard';
import { RiskCoverageAnalysisPanel } from '@/components/audit/risk/RiskCoverageAnalysisPanel';
import { toast } from 'sonner';

export function EnhancedProgramBuilderWizard({
  engagementId,
  riskAssessmentId,
  open,
  onOpenChange,
  onComplete,
  initialProgramName = 'Risk-Based Audit Program'
}: EnhancedProgramBuilderWizardProps) {
  const [currentTab, setCurrentTab] = useState<'required' | 'recommended' | 'optional'>('required');
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<Set<string>>(new Set());
  const [programName, setProgramName] = useState(initialProgramName);
  const [programDescription, setProgramDescription] = useState('');

  // Fetch recommendations
  const {
    data: recommendationResult,
    isLoading: recommendationsLoading,
    error: recommendationsError
  } = useProcedureRecommendations(riskAssessmentId);

  // Create program mutation
  const createProgram = useCreateEngagementProgram();

  // Group recommendations by priority
  const groupedRecommendations: GroupedRecommendations = useMemo(() => {
    if (!recommendationResult) {
      return { required: [], recommended: [], optional: [] };
    }

    return {
      required: recommendationResult.recommendations.filter(r => r.priority === 'required'),
      recommended: recommendationResult.recommendations.filter(r => r.priority === 'recommended'),
      optional: recommendationResult.recommendations.filter(r => r.priority === 'optional')
    };
  }, [recommendationResult]);

  // Auto-select required procedures on mount
  useEffect(() => {
    if (groupedRecommendations.required.length > 0 && selectedProcedureIds.size === 0) {
      const requiredIds = groupedRecommendations.required.map(r => r.procedure.id);
      setSelectedProcedureIds(new Set(requiredIds));
    }
  }, [groupedRecommendations.required]);

  // Get selected recommendations for coverage analysis
  const selectedRecommendations = useMemo(() => {
    if (!recommendationResult) return [];
    return recommendationResult.recommendations.filter(r =>
      selectedProcedureIds.has(r.procedure.id)
    );
  }, [recommendationResult, selectedProcedureIds]);

  // Toggle procedure selection
  const toggleProcedure = (procedureId: string, isRequired: boolean) => {
    if (isRequired) {
      // Cannot deselect required procedures
      toast.error('Required procedures cannot be removed');
      return;
    }

    setSelectedProcedureIds(prev => {
      const next = new Set(prev);
      if (next.has(procedureId)) {
        next.delete(procedureId);
      } else {
        next.add(procedureId);
      }
      return next;
    });
  };

  // Calculate total hours
  const totalHours = useMemo(() => {
    return selectedRecommendations.reduce((sum, rec) => {
      return sum + (rec.adjusted_hours || rec.procedure.estimated_hours || 0);
    }, 0);
  }, [selectedRecommendations]);

  // Handle program creation
  const handleSubmit = async () => {
    if (!programName.trim()) {
      toast.error('Please enter a program name');
      return;
    }

    if (selectedProcedureIds.size === 0) {
      toast.error('Please select at least one procedure');
      return;
    }

    // Check for critical coverage gaps
    const coverage = calculateCoverage(
      recommendationResult?.risk_areas || [],
      selectedRecommendations
    );

    if (coverage.criticalGaps.length > 0) {
      const confirmed = await showConfirmDialog({
        title: 'Critical Coverage Gaps',
        description: `${coverage.criticalGaps.length} high-risk area(s) have insufficient procedures. Are you sure you want to continue?`,
        confirmLabel: 'Create Program Anyway',
        confirmVariant: 'destructive'
      });

      if (!confirmed) return;
    }

    try {
      const programId = await createProgram.mutateAsync({
        engagement_id: engagementId,
        program_name: programName,
        program_description: programDescription,
        risk_assessment_id: riskAssessmentId,
        procedure_ids: Array.from(selectedProcedureIds),
        total_estimated_hours: totalHours
      });

      toast.success('Audit program created successfully');
      onComplete?.(programId);
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to create program', {
        description: error.message
      });
    }
  };

  if (recommendationsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Analyzing Risk Assessment...</p>
            <p className="text-sm text-muted-foreground">
              Generating procedure recommendations
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (recommendationsError || !recommendationResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to Load Recommendations</AlertTitle>
            <AlertDescription>
              {recommendationsError?.message || 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Build Risk-Based Audit Program</DialogTitle>
          <DialogDescription>
            AI-recommended procedures based on your risk assessment
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>AI-Powered Recommendations</AlertTitle>
          <AlertDescription>
            We've selected {groupedRecommendations.required.length} required procedures and{' '}
            {groupedRecommendations.recommended.length} recommended procedures based on your
            risk assessment. Required procedures address high/significant risk areas and
            cannot be removed.
          </AlertDescription>
        </Alert>

        {/* Program Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="program-name">Program Name *</Label>
            <Input
              id="program-name"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              placeholder="e.g., Financial Statement Audit 2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program-description">Description (Optional)</Label>
            <Input
              id="program-description"
              value={programDescription}
              onChange={(e) => setProgramDescription(e.target.value)}
              placeholder="e.g., Full-scope financial statement audit"
            />
          </div>
        </div>

        {/* Tabbed Procedure Selection */}
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="required" className="relative">
              Required ({groupedRecommendations.required.length})
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            </TabsTrigger>
            <TabsTrigger value="recommended">
              Recommended ({groupedRecommendations.recommended.length})
            </TabsTrigger>
            <TabsTrigger value="optional">
              Optional ({groupedRecommendations.optional.length})
            </TabsTrigger>
          </TabsList>

          {/* Required Tab */}
          <TabsContent value="required" className="flex-1 overflow-y-auto space-y-3 pr-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Required Procedures</AlertTitle>
              <AlertDescription>
                These procedures address high/significant risk areas and cannot be removed.
              </AlertDescription>
            </Alert>

            {groupedRecommendations.required.map(rec => (
              <ProcedureRecommendationCard
                key={rec.procedure.id}
                recommendation={rec}
                isSelected={true}
                isLocked={true}
                onToggle={() => {}}
              />
            ))}
          </TabsContent>

          {/* Recommended Tab */}
          <TabsContent value="recommended" className="flex-1 overflow-y-auto space-y-3 pr-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These procedures address medium-risk areas. Removing them may reduce audit effectiveness.
              </AlertDescription>
            </Alert>

            {groupedRecommendations.recommended.map(rec => (
              <ProcedureRecommendationCard
                key={rec.procedure.id}
                recommendation={rec}
                isSelected={selectedProcedureIds.has(rec.procedure.id)}
                isLocked={false}
                onToggle={() => toggleProcedure(rec.procedure.id, false)}
              />
            ))}
          </TabsContent>

          {/* Optional Tab */}
          <TabsContent value="optional" className="flex-1 overflow-y-auto space-y-3 pr-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These procedures address low-risk areas or provide additional assurance.
              </AlertDescription>
            </Alert>

            {groupedRecommendations.optional.map(rec => (
              <ProcedureRecommendationCard
                key={rec.procedure.id}
                recommendation={rec}
                isSelected={selectedProcedureIds.has(rec.procedure.id)}
                isLocked={false}
                onToggle={() => toggleProcedure(rec.procedure.id, false)}
              />
            ))}
          </TabsContent>
        </Tabs>

        {/* Coverage Analysis */}
        <div className="border-t pt-4 max-h-64 overflow-y-auto">
          <RiskCoverageAnalysisPanel
            riskAreas={recommendationResult.risk_areas || []}
            selectedRecommendations={selectedRecommendations}
            compact={true}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedProcedureIds.size} procedures selected • Estimated {totalHours}h
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProgram.isPending || selectedProcedureIds.size === 0}
            >
              {createProgram.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Create Program</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2.5 Data Flow

```
Mount → Fetch recommendations via useProcedureRecommendations
  ↓
Receive RecommendationResult {
  recommendations: ProcedureRecommendation[],
  coverage_analysis: CoverageAnalysis,
  total_estimated_hours: number
}
  ↓
Group by priority (required/recommended/optional)
  ↓
Auto-select required procedures
  ↓
User toggles recommended/optional procedures
  ↓
Real-time coverage recalculation
  ↓
User clicks Create Program
  ↓
Validate coverage (check for critical gaps)
  ↓
If critical gaps → Show confirmation dialog
  ↓
Create engagement_program + engagement_procedures
  ↓
Call onComplete(programId)
```

---

## 3. ProcedureRecommendationCard

### 3.1 Purpose
Display individual procedure recommendation with risk rationale, adjusted parameters, and selection control.

### 3.2 File Location
`src/components/audit/programs/ProcedureRecommendationCard.tsx`

### 3.3 Full TypeScript Interface

```typescript
import type { ProcedureRecommendation } from '@/types/procedures';

interface ProcedureRecommendationCardProps {
  /** The procedure recommendation to display */
  recommendation: ProcedureRecommendation;

  /** Whether this procedure is currently selected */
  isSelected: boolean;

  /** Whether this procedure is locked (required procedures) */
  isLocked: boolean;

  /** Callback when checkbox toggled */
  onToggle: () => void;

  /** Optional className */
  className?: string;
}
```

### 3.4 Implementation Scaffold

```typescript
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Clock, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProcedureRecommendationCard({
  recommendation,
  isSelected,
  isLocked,
  onToggle,
  className
}: ProcedureRecommendationCardProps) {
  const { procedure, priority, risk_area, risk_level, risk_rationale, adjusted_hours, adjusted_sample_size } = recommendation;

  const getPriorityColor = () => {
    if (priority === 'required') return 'border-red-500 bg-red-50 dark:bg-red-950/20';
    if (priority === 'recommended') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    return 'border-gray-300';
  };

  return (
    <Card className={cn(
      'p-4 transition-all',
      isSelected ? getPriorityColor() : 'hover:border-primary',
      className
    )}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          disabled={isLocked}
          className="mt-1"
          aria-label={`Select ${procedure.procedure_name}`}
          aria-describedby={`risk-rationale-${procedure.id}`}
        />

        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-lg">{procedure.procedure_code}</span>
                <Badge variant="outline">{procedure.category}</Badge>
                {isLocked && (
                  <Badge variant="destructive" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Required
                  </Badge>
                )}
                {priority === 'recommended' && (
                  <Badge variant="secondary">Recommended</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {procedure.procedure_name}
              </p>
            </div>
          </div>

          {/* Risk Rationale - THE KEY FEATURE */}
          <Alert className="bg-muted/50 border-l-4 border-l-primary">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-1">
              <div>
                <strong>Why {priority}:</strong> {risk_rationale}
              </div>
              <div>
                <strong>Risk Area:</strong> {risk_area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({risk_level.toUpperCase()} risk)
              </div>
              {adjusted_sample_size && (
                <div>
                  <strong>Sample Size:</strong> {adjusted_sample_size}
                  {procedure.sample_size_guidance && procedure.sample_size_guidance !== adjusted_sample_size && (
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                      (adjusted for {risk_level} risk)
                    </span>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Procedure Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {adjusted_hours || procedure.estimated_hours || 0}h
                {adjusted_hours && adjusted_hours !== procedure.estimated_hours && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                    (adjusted from {procedure.estimated_hours}h)
                  </span>
                )}
              </span>
            </div>

            {procedure.evidence_required && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{procedure.evidence_required}</span>
              </div>
            )}
          </div>

          {/* Expandable Details (Optional) */}
          {procedure.detailed_steps && (
            <details className="text-sm">
              <summary className="cursor-pointer text-primary hover:underline">
                View Detailed Steps
              </summary>
              <div className="mt-2 pl-4 border-l-2 border-muted space-y-1 text-muted-foreground">
                {procedure.detailed_steps.split('\n').map((step, i) => (
                  <p key={i}>{step}</p>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

## 4. RiskCoverageAnalysisPanel

### 4.1 Purpose
Real-time risk coverage validation with critical gap warnings and coverage scoring.

### 4.2 File Location
`src/components/audit/risk/RiskCoverageAnalysisPanel.tsx`

### 4.3 Full TypeScript Interface

```typescript
import type { RiskAreaAssessment } from '@/types/risk-assessment';
import type { ProcedureRecommendation } from '@/types/procedures';

interface RiskCoverageAnalysisPanelProps {
  /** Risk areas from the assessment */
  riskAreas: RiskAreaAssessment[];

  /** Currently selected procedure recommendations */
  selectedRecommendations: ProcedureRecommendation[];

  /** Callback when "Add Procedures" clicked for a specific area */
  onAddProcedures?: (riskArea: string) => void;

  /** Compact mode shows summary only */
  compact?: boolean;

  /** Optional className */
  className?: string;
}

interface CoverageByArea {
  area: RiskAreaAssessment;
  procedureCount: number;
  requiredCount: number;
  status: 'adequate' | 'warning' | 'critical';
  missingCount?: number;
}

interface CoverageAnalysis {
  byArea: CoverageByArea[];
  criticalGaps: CoverageByArea[];
  warnings: CoverageByArea[];
  overallScore: number;
}
```

### 4.4 Coverage Calculation Algorithm

```typescript
/**
 * Calculate risk coverage based on selected procedures
 */
function calculateCoverage(
  riskAreas: RiskAreaAssessment[],
  selectedRecommendations: ProcedureRecommendation[]
): CoverageAnalysis {
  const coverageByArea: CoverageByArea[] = riskAreas.map(area => {
    // Find procedures covering this area
    const areaProcedures = selectedRecommendations.filter(
      rec => rec.risk_area === area.area_name.toLowerCase().replace(/ /g, '_')
    );

    const requiredCount = areaProcedures.filter(p => p.priority === 'required').length;
    const totalCount = areaProcedures.length;

    // Determine adequacy status based on risk level
    let status: 'adequate' | 'warning' | 'critical';
    let missingCount = 0;

    if (area.combined_risk === 'significant' || area.combined_risk === 'high') {
      // High-risk areas need at least 3 procedures
      const threshold = 3;
      if (requiredCount >= threshold) {
        status = 'adequate';
      } else if (requiredCount >= 1) {
        status = 'warning';
        missingCount = threshold - requiredCount;
      } else {
        status = 'critical';
        missingCount = threshold;
      }
    } else if (area.combined_risk === 'medium') {
      // Medium-risk areas need at least 2 procedures
      const threshold = 2;
      if (totalCount >= threshold) {
        status = 'adequate';
      } else if (totalCount >= 1) {
        status = 'warning';
        missingCount = threshold - totalCount;
      } else {
        status = 'critical';
        missingCount = threshold;
      }
    } else {
      // Low-risk areas need at least 1 procedure
      status = totalCount >= 1 ? 'adequate' : 'warning';
      missingCount = totalCount === 0 ? 1 : 0;
    }

    return {
      area,
      procedureCount: totalCount,
      requiredCount,
      status,
      missingCount
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
    overallScore
  };
}
```

### 4.5 Implementation Scaffold

```typescript
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RiskCoverageAnalysisPanel({
  riskAreas,
  selectedRecommendations,
  onAddProcedures,
  compact = false,
  className
}: RiskCoverageAnalysisPanelProps) {
  // Calculate coverage
  const coverage = useMemo(() =>
    calculateCoverage(riskAreas, selectedRecommendations),
    [riskAreas, selectedRecommendations]
  );

  const getStatusIcon = (status: string) => {
    if (status === 'adequate') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getProgressColor = (status: string) => {
    if (status === 'adequate') return 'bg-green-500';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {coverage.criticalGaps.length > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : coverage.warnings.length > 0 ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          )}
          Risk Coverage Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Critical Gaps */}
        {coverage.criticalGaps.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Critical Coverage Gaps ({coverage.criticalGaps.length})</AlertTitle>
            <AlertDescription>
              The following high-risk areas have insufficient procedures:
            </AlertDescription>
          </Alert>
        )}

        {coverage.criticalGaps.map(({ area, procedureCount, missingCount }) => (
          <Alert key={area.id} variant="destructive">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  {area.area_name}
                  <Badge variant="destructive">
                    {area.combined_risk.toUpperCase()} RISK
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  {procedureCount === 0 ? (
                    <strong>NO PROCEDURES SELECTED</strong>
                  ) : (
                    `Only ${procedureCount} procedure(s) selected for high-risk area`
                  )}
                  <br />
                  <span className="text-xs">
                    Recommendation: Add at least {missingCount} more procedure(s)
                  </span>
                </AlertDescription>
              </div>
              {onAddProcedures && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddProcedures(area.area_name)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </Alert>
        ))}

        {/* Warnings */}
        {!compact && coverage.warnings.map(({ area, procedureCount }) => (
          <Alert key={area.id}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {area.area_name}
              <Badge variant="outline">
                {area.combined_risk.toUpperCase()} RISK
              </Badge>
            </AlertTitle>
            <AlertDescription>
              {procedureCount} procedure(s) selected. Consider adding more for better coverage.
            </AlertDescription>
          </Alert>
        ))}

        {/* Coverage by Area */}
        {!compact && (
          <>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Coverage by Risk Area</h4>
              {coverage.byArea.map(({ area, procedureCount, status }) => (
                <div key={area.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span>{area.area_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {area.combined_risk}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {procedureCount} {procedureCount === 1 ? 'procedure' : 'procedures'}
                    </span>
                  </div>
                  <Progress
                    value={status === 'adequate' ? 100 : status === 'warning' ? 50 : 0}
                    className="h-2"
                    indicatorClassName={getProgressColor(status)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Overall Coverage Score */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Risk Coverage</span>
            <span className={cn(
              "text-2xl font-bold",
              coverage.overallScore >= 80 ? "text-green-600" :
              coverage.overallScore >= 60 ? "text-yellow-600" :
              "text-red-600"
            )}>
              {coverage.overallScore}%
            </span>
          </div>
          <Progress
            value={coverage.overallScore}
            indicatorClassName={
              coverage.overallScore >= 80 ? "bg-green-500" :
              coverage.overallScore >= 60 ? "bg-yellow-500" :
              "bg-red-500"
            }
          />
          <p className="text-xs text-muted-foreground">
            {coverage.byArea.filter(c => c.status === 'adequate').length} of{' '}
            {coverage.byArea.length} risk areas adequately covered
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 5. RiskCoverageStatusCard

### 5.1 Purpose
Display risk coverage status in the program view (after program created).

### 5.2 File Location
`src/components/audit/risk/RiskCoverageStatusCard.tsx`

**Implementation:** Similar to RiskCoverageAnalysisPanel but read-only, shows historical coverage status.

---

## 6. Supporting Components

### 6.1 EmptyState Components

```typescript
// RiskAssessmentRequiredView.tsx
export function RiskAssessmentRequiredView({
  onStartRiskAssessment,
  onSkipToManual
}: {
  onStartRiskAssessment: () => void;
  onSkipToManual: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-4 mb-6">
          <AlertCircle className="h-16 w-16 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Risk Assessment Required</h2>

        <p className="text-muted-foreground text-center max-w-md mb-8">
          Professional auditing standards require risk assessment before designing
          audit procedures. This ensures your testing is responsive to engagement-specific risks.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-md">
          <Button onClick={onStartRiskAssessment} size="lg" className="w-full">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Start Risk Assessment
          </Button>

          <Button
            variant="outline"
            onClick={onSkipToManual}
            size="sm"
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            Skip to Manual Program (Not Recommended)
          </Button>
        </div>

        <Alert className="mt-8 max-w-md">
          <Info className="h-4 w-4" />
          <AlertTitle>Why Risk Assessment?</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Focus testing on high-risk areas</li>
              <li>Avoid over-testing low-risk areas</li>
              <li>Match procedures to client industry</li>
              <li>Meet professional standards (AU-C 315, 330)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Testing Specifications

### 7.1 Unit Test Requirements

Each component should have:
- ✅ Rendering tests (with various prop combinations)
- ✅ Interaction tests (button clicks, toggles)
- ✅ State management tests
- ✅ Edge case tests (no data, error states)

### 7.2 Integration Test Requirements

- ✅ Risk assessment → program builder flow
- ✅ Coverage calculation accuracy
- ✅ Procedure selection persistence
- ✅ Real-time coverage updates

### 7.3 Accessibility Requirements

- ✅ All interactive elements keyboard accessible
- ✅ ARIA labels on all form controls
- ✅ Screen reader friendly
- ✅ Color contrast AAA compliant
- ✅ Focus indicators visible

---

**Document Complete**
**Total Specifications:** 6 major components + supporting utilities
**Ready for Implementation:** Yes
