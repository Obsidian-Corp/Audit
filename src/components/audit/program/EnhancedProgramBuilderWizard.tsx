import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { ProcedureRecommendationCard } from './ProcedureRecommendationCard';
import { RiskCoverageAnalysisPanel } from '../risk/RiskCoverageAnalysisPanel';
import { useProcedureRecommendations } from '@/hooks/useProcedureRecommendations';
import { useEngagementPrograms } from '@/hooks/useEngagementPrograms';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { filterRecommendationsByPriority } from '@/utils/procedureRecommendations';
import type { ProcedureRecommendation } from '@/types/procedures';

interface EnhancedProgramBuilderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  riskAssessmentId: string;
  onSuccess?: () => void;
}

export function EnhancedProgramBuilderWizard({
  open,
  onOpenChange,
  engagementId,
  riskAssessmentId,
  onSuccess,
}: EnhancedProgramBuilderWizardProps) {
  const { data: recommendationResult, isLoading } = useProcedureRecommendations(riskAssessmentId);
  const { data: riskAssessment } = useRiskAssessment(engagementId);
  const { applyProgramToEngagement } = useEngagementPrograms(engagementId);
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Filter recommendations by priority
  const requiredProcedures = useMemo(() => {
    if (!recommendationResult) return [];
    return filterRecommendationsByPriority(recommendationResult.recommendations, 'required');
  }, [recommendationResult]);

  const recommendedProcedures = useMemo(() => {
    if (!recommendationResult) return [];
    return filterRecommendationsByPriority(recommendationResult.recommendations, 'recommended');
  }, [recommendationResult]);

  const optionalProcedures = useMemo(() => {
    if (!recommendationResult) return [];
    return filterRecommendationsByPriority(recommendationResult.recommendations, 'optional');
  }, [recommendationResult]);

  // Auto-select all required procedures on load
  useMemo(() => {
    if (requiredProcedures.length > 0 && selectedProcedureIds.size === 0) {
      const requiredIds = new Set(requiredProcedures.map(p => p.procedure.id));
      setSelectedProcedureIds(requiredIds);
    }
  }, [requiredProcedures]);

  // Calculate selected recommendations
  const selectedRecommendations = useMemo(() => {
    if (!recommendationResult) return [];
    return recommendationResult.recommendations.filter(
      rec => selectedProcedureIds.has(rec.procedure.id)
    );
  }, [selectedProcedureIds, recommendationResult]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!recommendationResult) return null;

    const totalHours = selectedRecommendations.reduce(
      (sum, rec) => sum + (rec.adjusted_hours || rec.procedure.estimated_hours),
      0
    );

    const requiredSelected = selectedRecommendations.filter(r => r.priority === 'required').length;
    const recommendedSelected = selectedRecommendations.filter(r => r.priority === 'recommended').length;
    const optionalSelected = selectedRecommendations.filter(r => r.priority === 'optional').length;

    return {
      totalSelected: selectedProcedureIds.size,
      totalHours,
      requiredSelected,
      recommendedSelected,
      optionalSelected,
      coverageScore: recommendationResult.coverage_analysis.coverage_percentage,
    };
  }, [selectedProcedureIds, recommendationResult, selectedRecommendations]);

  const handleToggleProcedure = (procedureId: string) => {
    setSelectedProcedureIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(procedureId)) {
        newSet.delete(procedureId);
      } else {
        newSet.add(procedureId);
      }
      return newSet;
    });
  };

  const handleSelectAllInTab = (procedures: ProcedureRecommendation[]) => {
    setSelectedProcedureIds(prev => {
      const newSet = new Set(prev);
      procedures.forEach(p => newSet.add(p.procedure.id));
      return newSet;
    });
  };

  const handleDeselectAllInTab = (procedures: ProcedureRecommendation[]) => {
    setSelectedProcedureIds(prev => {
      const newSet = new Set(prev);
      procedures.forEach(p => newSet.delete(p.procedure.id));
      return newSet;
    });
  };

  const handleCreateProgram = async () => {
    if (selectedProcedureIds.size === 0) {
      return;
    }

    // Check for critical coverage gaps
    if (riskAssessment?.areas) {
      const proceduresByArea = new Map<string, number>();
      selectedRecommendations.forEach(rec => {
        if (rec.risk_areas && rec.risk_areas.length > 0) {
          rec.risk_areas.forEach(areaName => {
            proceduresByArea.set(areaName, (proceduresByArea.get(areaName) || 0) + 1);
          });
        }
      });

      const criticalGaps = riskAssessment.areas.filter(area => {
        const count = proceduresByArea.get(area.area_name) || 0;
        return count === 0 && (area.combined_risk === 'high' || area.combined_risk === 'significant');
      });

      if (criticalGaps.length > 0) {
        const confirmed = window.confirm(
          `Warning: ${criticalGaps.length} high-risk area${criticalGaps.length !== 1 ? 's' : ''} have NO procedures selected:\n\n` +
          criticalGaps.map(g => `• ${g.area_name} (${g.combined_risk.toUpperCase()} RISK)`).join('\n') +
          '\n\nThis may result in insufficient audit coverage. Do you want to create the program anyway?'
        );

        if (!confirmed) {
          return;
        }
      }
    }

    setIsCreating(true);
    try {
      // This would call the actual API to create the program
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating program:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Analyzing risk assessment and generating recommendations...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!recommendationResult) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Recommendations Available</AlertTitle>
            <AlertDescription>
              Unable to generate procedure recommendations. Please ensure the risk assessment is complete.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>AI-Powered Audit Program Builder</DialogTitle>
          </div>
          <DialogDescription>
            Procedures recommended based on your risk assessment. Required procedures are pre-selected.
          </DialogDescription>
        </DialogHeader>

        {/* Statistics Bar */}
        {stats && (
          <div className="grid grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalSelected}</p>
              <p className="text-xs text-muted-foreground">Selected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.requiredSelected}</p>
              <p className="text-xs text-muted-foreground">Required</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.recommendedSelected}</p>
              <p className="text-xs text-muted-foreground">Recommended</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Est. Hours</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold text-green-600">{stats.coverageScore}%</p>
                {stats.coverageScore >= 80 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Coverage</p>
            </div>
          </div>
        )}

        {/* Coverage Warning */}
        {stats && stats.coverageScore < 80 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Coverage Below 80%</AlertTitle>
            <AlertDescription>
              Consider selecting more recommended procedures to achieve adequate risk coverage.
            </AlertDescription>
          </Alert>
        )}

        {/* Procedure Tabs */}
        <Tabs defaultValue="required" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="required" className="flex items-center gap-2">
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {requiredProcedures.length}
              </Badge>
              Required
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex items-center gap-2">
              <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {recommendedProcedures.length}
              </Badge>
              Recommended
            </TabsTrigger>
            <TabsTrigger value="optional" className="flex items-center gap-2">
              <Badge variant="secondary" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {optionalProcedures.length}
              </Badge>
              Optional
            </TabsTrigger>
          </TabsList>

          <TabsContent value="required" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Required procedures for high-risk areas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllInTab(requiredProcedures)}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeselectAllInTab(requiredProcedures)}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {requiredProcedures.map(rec => (
                  <ProcedureRecommendationCard
                    key={rec.procedure.id}
                    recommendation={rec}
                    isSelected={selectedProcedureIds.has(rec.procedure.id)}
                    onToggle={handleToggleProcedure}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recommended" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Recommended for comprehensive audit coverage
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllInTab(recommendedProcedures)}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeselectAllInTab(recommendedProcedures)}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {recommendedProcedures.map(rec => (
                  <ProcedureRecommendationCard
                    key={rec.procedure.id}
                    recommendation={rec}
                    isSelected={selectedProcedureIds.has(rec.procedure.id)}
                    onToggle={handleToggleProcedure}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="optional" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Optional procedures based on engagement specifics
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAllInTab(optionalProcedures)}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeselectAllInTab(optionalProcedures)}
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {optionalProcedures.map(rec => (
                  <ProcedureRecommendationCard
                    key={rec.procedure.id}
                    recommendation={rec}
                    isSelected={selectedProcedureIds.has(rec.procedure.id)}
                    onToggle={handleToggleProcedure}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Risk Coverage Analysis */}
        {riskAssessment?.areas && (
          <RiskCoverageAnalysisPanel
            riskAreas={riskAssessment.areas}
            selectedRecommendations={selectedRecommendations}
            mode="compact"
            className="mt-4"
          />
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>AI-powered recommendations based on risk assessment</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProgram}
              disabled={selectedProcedureIds.size === 0 || isCreating}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Program ({selectedProcedureIds.size} procedures)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
