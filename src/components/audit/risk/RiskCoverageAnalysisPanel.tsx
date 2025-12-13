import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RiskAreaAssessment } from '@/types/risk-assessment';
import type { ProcedureRecommendation } from '@/types/procedures';

interface RiskCoverageAnalysisPanelProps {
  riskAreas: RiskAreaAssessment[];
  selectedRecommendations: ProcedureRecommendation[];
  mode?: 'full' | 'compact';
  className?: string;
}

interface CoverageByArea {
  area: RiskAreaAssessment;
  procedureCount: number;
  status: 'adequate' | 'warning' | 'critical';
  requiredCount: number;
  missingCount: number;
}

interface CoverageAnalysis {
  overallScore: number;
  totalAreas: number;
  adequateAreas: number;
  warningAreas: number;
  criticalAreas: number;
  coverageByArea: CoverageByArea[];
  criticalGaps: CoverageByArea[];
  warnings: CoverageByArea[];
}

/**
 * Calculate required procedure count based on risk level
 */
function getRequiredProcedureCount(riskLevel: string): number {
  switch (riskLevel) {
    case 'significant':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 1;
  }
}

/**
 * Determine coverage status for a risk area
 */
function getCoverageStatus(procedureCount: number, requiredCount: number): 'adequate' | 'warning' | 'critical' {
  if (procedureCount === 0) return 'critical';
  if (procedureCount < requiredCount) return 'warning';
  return 'adequate';
}

/**
 * Calculate coverage analysis from risk areas and selected procedures
 */
function calculateCoverage(
  riskAreas: RiskAreaAssessment[],
  selectedRecommendations: ProcedureRecommendation[]
): CoverageAnalysis {
  // Group selected procedures by risk area
  const proceduresByArea = new Map<string, number>();

  selectedRecommendations.forEach(rec => {
    if (rec.risk_areas && rec.risk_areas.length > 0) {
      rec.risk_areas.forEach(areaName => {
        proceduresByArea.set(areaName, (proceduresByArea.get(areaName) || 0) + 1);
      });
    }
  });

  // Calculate coverage for each area
  const coverageByArea: CoverageByArea[] = riskAreas.map(area => {
    const procedureCount = proceduresByArea.get(area.area_name) || 0;
    const requiredCount = getRequiredProcedureCount(area.combined_risk);
    const missingCount = Math.max(0, requiredCount - procedureCount);
    const status = getCoverageStatus(procedureCount, requiredCount);

    return {
      area,
      procedureCount,
      status,
      requiredCount,
      missingCount,
    };
  });

  // Separate critical gaps and warnings
  const criticalGaps = coverageByArea.filter(c => c.status === 'critical');
  const warnings = coverageByArea.filter(c => c.status === 'warning');
  const adequateAreas = coverageByArea.filter(c => c.status === 'adequate').length;

  // Calculate overall score (percentage of areas with adequate coverage)
  const overallScore = riskAreas.length > 0
    ? Math.round((adequateAreas / riskAreas.length) * 100)
    : 0;

  return {
    overallScore,
    totalAreas: riskAreas.length,
    adequateAreas,
    warningAreas: warnings.length,
    criticalAreas: criticalGaps.length,
    coverageByArea,
    criticalGaps,
    warnings,
  };
}

/**
 * Get badge variant for risk level
 */
function getRiskBadgeVariant(riskLevel: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (riskLevel) {
    case 'significant':
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Get color for coverage status
 */
function getStatusColor(status: 'adequate' | 'warning' | 'critical'): string {
  switch (status) {
    case 'adequate':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get progress bar color class
 */
function getProgressColor(status: 'adequate' | 'warning' | 'critical'): string {
  switch (status) {
    case 'adequate':
      return '[&>div]:bg-green-600';
    case 'warning':
      return '[&>div]:bg-yellow-600';
    case 'critical':
      return '[&>div]:bg-red-600';
    default:
      return '';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: 'adequate' | 'warning' | 'critical') {
  switch (status) {
    case 'adequate':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'critical':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

export function RiskCoverageAnalysisPanel({
  riskAreas,
  selectedRecommendations,
  mode = 'full',
  className,
}: RiskCoverageAnalysisPanelProps) {
  const coverage = useMemo(
    () => calculateCoverage(riskAreas, selectedRecommendations),
    [riskAreas, selectedRecommendations]
  );

  const overallScoreColor = coverage.overallScore >= 80
    ? 'text-green-600'
    : coverage.overallScore >= 60
    ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Risk Coverage Analysis</CardTitle>
        <CardDescription>
          Ensuring adequate procedure coverage for all identified risk areas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Gaps */}
        {coverage.criticalGaps.length > 0 && (
          <div className="space-y-3">
            {coverage.criticalGaps.map((gap, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <span>{gap.area.area_name}</span>
                  <Badge variant={getRiskBadgeVariant(gap.area.combined_risk)}>
                    {gap.area.combined_risk.toUpperCase()} RISK
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  <strong>NO PROCEDURES SELECTED</strong> - This{' '}
                  {gap.area.combined_risk}-risk area requires at least{' '}
                  {gap.requiredCount} procedure{gap.requiredCount !== 1 ? 's' : ''} to ensure
                  adequate audit coverage. Please select appropriate procedures to address this gap.
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Warnings (only in full mode) */}
        {mode === 'full' && coverage.warnings.length > 0 && (
          <div className="space-y-3">
            {coverage.warnings.map((warning, idx) => (
              <Alert key={idx}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  <span>{warning.area.area_name}</span>
                  <Badge variant={getRiskBadgeVariant(warning.area.combined_risk)}>
                    {warning.area.combined_risk.toUpperCase()} RISK
                  </Badge>
                </AlertTitle>
                <AlertDescription>
                  Only {warning.procedureCount} procedure{warning.procedureCount !== 1 ? 's' : ''}{' '}
                  selected. Recommend adding {warning.missingCount} more procedure
                  {warning.missingCount !== 1 ? 's' : ''} to achieve adequate coverage for this{' '}
                  {warning.area.combined_risk}-risk area.
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Overall Coverage Score */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Overall Coverage Score</p>
              <p className="text-xs text-muted-foreground">
                {coverage.adequateAreas} of {coverage.totalAreas} areas adequately covered
              </p>
            </div>
            <div className={`text-3xl font-bold ${overallScoreColor}`}>
              {coverage.overallScore}%
            </div>
          </div>
          <Progress
            value={coverage.overallScore}
            className={
              coverage.overallScore >= 80
                ? '[&>div]:bg-green-600'
                : coverage.overallScore >= 60
                ? '[&>div]:bg-yellow-600'
                : '[&>div]:bg-red-600'
            }
          />
          {coverage.overallScore < 80 && (
            <p className="text-xs text-muted-foreground">
              Target: 80% or higher for comprehensive audit coverage
            </p>
          )}
        </div>

        {/* Coverage by Area (only in full mode) */}
        {mode === 'full' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Coverage by Risk Area</h4>
            {coverage.coverageByArea.map((item, idx) => {
              const progressValue = item.requiredCount > 0
                ? Math.min(100, (item.procedureCount / item.requiredCount) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{item.area.area_name}</p>
                        <Badge variant={getRiskBadgeVariant(item.area.combined_risk)} className="text-xs">
                          {item.area.combined_risk.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.procedureCount} of {item.requiredCount} required procedures
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'adequate' ? 'Adequate' : item.status === 'warning' ? 'Warning' : 'Critical'}
                      </span>
                    </div>
                  </div>
                  <Progress value={progressValue} className={getProgressColor(item.status)} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
