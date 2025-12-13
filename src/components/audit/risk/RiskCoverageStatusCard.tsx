import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import type { EngagementRiskAssessment } from '@/types/risk-assessment';
import type { EngagementProcedure } from '@/types/procedures';

interface RiskCoverageStatusCardProps {
  assessment: EngagementRiskAssessment;
  procedures: EngagementProcedure[];
  className?: string;
}

interface AreaCoverage {
  areaName: string;
  riskLevel: string;
  procedureCount: number;
  requiredCount: number;
  status: 'adequate' | 'warning' | 'critical';
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

/**
 * Get status color
 */
function getStatusColor(status: 'adequate' | 'warning' | 'critical'): string {
  switch (status) {
    case 'adequate':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
  }
}

export function RiskCoverageStatusCard({
  assessment,
  procedures,
  className,
}: RiskCoverageStatusCardProps) {
  const coverageAnalysis = useMemo(() => {
    // Group procedures by risk area
    // Note: In a real implementation, procedures would have risk_area metadata
    // For now, we'll use a simplified approach based on procedure categories
    const proceduresByArea = new Map<string, number>();

    // Count procedures (simplified - in production this would map via procedure metadata)
    procedures.forEach(() => {
      // This is a placeholder - real implementation would use procedure.risk_area_id
      // to properly map procedures to risk areas
    });

    // Calculate coverage for each risk area
    const areaCoverage: AreaCoverage[] = (assessment.areas || []).map(area => {
      const procedureCount = proceduresByArea.get(area.area_name) || 0;
      const requiredCount = getRequiredProcedureCount(area.combined_risk);

      let status: 'adequate' | 'warning' | 'critical';
      if (procedureCount === 0) {
        status = 'critical';
      } else if (procedureCount < requiredCount) {
        status = 'warning';
      } else {
        status = 'adequate';
      }

      return {
        areaName: area.area_name,
        riskLevel: area.combined_risk,
        procedureCount,
        requiredCount,
        status,
      };
    });

    // Count procedures by priority (if metadata exists)
    const requiredCount = procedures.filter(p => p.priority === 'required').length;
    const recommendedCount = procedures.filter(p => p.priority === 'recommended').length;
    const optionalCount = procedures.filter(p => p.priority === 'optional').length;

    // Count areas by status
    const adequateAreas = areaCoverage.filter(a => a.status === 'adequate').length;
    const warningAreas = areaCoverage.filter(a => a.status === 'warning').length;
    const criticalAreas = areaCoverage.filter(a => a.status === 'critical').length;

    // Calculate overall coverage percentage
    const overallCoverage = assessment.areas && assessment.areas.length > 0
      ? Math.round((adequateAreas / assessment.areas.length) * 100)
      : 0;

    return {
      areaCoverage,
      requiredCount,
      recommendedCount,
      optionalCount,
      adequateAreas,
      warningAreas,
      criticalAreas,
      overallCoverage,
    };
  }, [assessment, procedures]);

  const overallScoreColor = coverageAnalysis.overallCoverage >= 80
    ? 'text-green-600'
    : coverageAnalysis.overallCoverage >= 60
    ? 'text-yellow-600'
    : 'text-red-600';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Risk Coverage Status</CardTitle>
        <CardDescription>
          Procedure coverage at time of program creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Coverage */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className={`text-3xl font-bold ${overallScoreColor}`}>
              {coverageAnalysis.overallCoverage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Coverage</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{coverageAnalysis.adequateAreas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Adequate</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{coverageAnalysis.warningAreas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Warning</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{coverageAnalysis.criticalAreas}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Critical</p>
          </div>
        </div>

        {/* Procedure Breakdown by Priority */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Procedure Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Required</span>
                <Badge variant="destructive" className="text-xs">
                  {coverageAnalysis.requiredCount}
                </Badge>
              </div>
              <Progress
                value={coverageAnalysis.requiredCount > 0 ? 100 : 0}
                className="[&>div]:bg-red-600"
              />
            </div>

            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Recommended</span>
                <Badge variant="default" className="text-xs">
                  {coverageAnalysis.recommendedCount}
                </Badge>
              </div>
              <Progress
                value={coverageAnalysis.recommendedCount > 0 ? 100 : 0}
                className="[&>div]:bg-blue-600"
              />
            </div>

            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Optional</span>
                <Badge variant="secondary" className="text-xs">
                  {coverageAnalysis.optionalCount}
                </Badge>
              </div>
              <Progress
                value={coverageAnalysis.optionalCount > 0 ? 100 : 0}
                className="[&>div]:bg-gray-600"
              />
            </div>
          </div>
        </div>

        {/* High-Risk Area Coverage */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">High-Risk Area Coverage</h4>
          {coverageAnalysis.areaCoverage
            .filter(area => area.riskLevel === 'high' || area.riskLevel === 'significant')
            .map((area, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">{area.areaName}</span>
                  <Badge variant={getRiskBadgeVariant(area.riskLevel)} className="text-xs">
                    {area.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {area.procedureCount}/{area.requiredCount}
                  </span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(area.status)}
                    <span className={`text-xs font-medium ${getStatusColor(area.status)}`}>
                      {area.status === 'adequate' ? 'OK' : area.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {coverageAnalysis.areaCoverage.filter(
            area => area.riskLevel === 'high' || area.riskLevel === 'significant'
          ).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No high-risk areas identified
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
