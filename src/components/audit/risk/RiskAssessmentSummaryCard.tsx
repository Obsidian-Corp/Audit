import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RiskHeatMap } from './RiskHeatMap';
import { Eye, EyeOff, RefreshCw, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { getRiskBadgeVariant } from '@/types/risk-assessment';
import type { RiskAssessmentSummaryCardProps, RiskStats } from './types';

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
              <span>by {assessment.assessed_by || 'Team'}</span>
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
                  {assessment.complexity_factors
                    .filter((factor: any) => factor.is_selected)
                    .map((factor: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {factor.factor?.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Heat Map (Expandable) */}
        {heatMapVisible && mode === 'full' && assessment.areas && (
          <>
            <Separator />
            <div className="p-4 border rounded-lg bg-muted/50">
              <RiskHeatMap areas={assessment.areas} />
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
            <Alert>
              <AlertTitle>Coverage Analysis</AlertTitle>
              <AlertDescription>
                {procedures.length} procedures selected covering {riskStats.total} risk areas
              </AlertDescription>
            </Alert>
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
