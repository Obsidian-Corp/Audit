import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function RiskHeatmap() {
  const { currentOrg } = useOrganization();

  const { data: riskData, isLoading } = useQuery({
    queryKey: ['risk-heatmap', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;

      const { data } = await supabase
        .from('risk_assessments')
        .select('likelihood_score, impact_score, risk_category')
        .eq('organization_id', currentOrg.id)
        .eq('status', 'approved')
        .order('inherent_risk', { ascending: false })
        .limit(50);

      return data || [];
    },
    enabled: !!currentOrg
  });

  // Create 5x5 heatmap matrix
  const heatmapData = Array.from({ length: 5 }, (_, i) => 
    Array.from({ length: 5 }, (_, j) => ({
      likelihood: i + 1,
      impact: j + 1,
      count: 0
    }))
  );

  // Populate matrix with actual data
  if (riskData) {
    riskData.forEach(risk => {
      const likelihoodIdx = risk.likelihood_score - 1;
      const impactIdx = risk.impact_score - 1;
      if (likelihoodIdx >= 0 && likelihoodIdx < 5 && impactIdx >= 0 && impactIdx < 5) {
        heatmapData[likelihoodIdx][impactIdx].count++;
      }
    });
  }

  const getRiskColor = (likelihood: number, impact: number) => {
    const risk = likelihood * impact;
    if (risk >= 20) return 'bg-red-600';
    if (risk >= 12) return 'bg-orange-500';
    if (risk >= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Risk Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 bg-muted rounded animate-pulse" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-1">
              {/* Y-axis label */}
              <div className="col-span-1 row-span-5 flex items-center justify-center">
                <span className="text-xs text-muted-foreground -rotate-90 whitespace-nowrap">
                  Likelihood →
                </span>
              </div>

              {/* Heatmap cells (reversed for top-down display) */}
              {[...Array(5)].map((_, i) => (
                <>
                  {[...Array(5)].map((_, j) => {
                    const likelihood = 5 - i; // Reverse for top-down
                    const impact = j + 1;
                    const cell = heatmapData[likelihood - 1][impact - 1];
                    return (
                      <div
                        key={`${likelihood}-${impact}`}
                        className={`aspect-square flex items-center justify-center text-xs font-medium text-white rounded ${getRiskColor(
                          likelihood,
                          impact
                        )} hover:scale-110 transition-transform cursor-pointer`}
                        title={`L${likelihood} x I${impact}: ${cell.count} risks`}
                      >
                        {cell.count > 0 ? cell.count : ''}
                      </div>
                    );
                  })}
                </>
              ))}

              {/* X-axis labels */}
              <div className="col-span-1" />
              {[1, 2, 3, 4, 5].map(impact => (
                <div key={impact} className="flex items-center justify-center text-xs text-muted-foreground">
                  {impact}
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              ← Impact →
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-xs text-muted-foreground">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span className="text-xs text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-600" />
                <span className="text-xs text-muted-foreground">Critical</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
