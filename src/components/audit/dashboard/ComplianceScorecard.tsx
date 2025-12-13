import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const COMPLIANCE_STANDARDS = ['SOX', 'IFRS', 'GAAP', 'GDPR', 'ISO27001'];

export function ComplianceScorecard() {
  const { currentOrg } = useOrganization();

  const { data: complianceData, isLoading } = useQuery({
    queryKey: ['compliance-scorecard', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;

      const scores: Record<string, { total: number; compliant: number }> = {};
      
      for (const standard of COMPLIANCE_STANDARDS) {
        // Get audits for this standard
        const { data: audits } = await supabase
          .from('audits')
          .select('id, status, compliance_standards')
          .eq('firm_id', currentOrg.id)
          .contains('compliance_standards', [standard]);

        if (audits) {
          const total = audits.length;
          const compliant = audits.filter(a => 
            a.status === 'closed' || a.status === 'reporting'
          ).length;

          scores[standard] = { total, compliant };
        }
      }

      return scores;
    },
    enabled: !!currentOrg
  });

  const getScore = (standard: string) => {
    if (!complianceData || !complianceData[standard]) return 0;
    const { total, compliant } = complianceData[standard];
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Compliance Scorecard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {COMPLIANCE_STANDARDS.map(standard => {
              const score = getScore(standard);
              return (
                <div key={standard} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {score >= 90 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="font-medium text-sm">{standard}</span>
                    </div>
                    <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              );
            })}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Score</span>
                <span className="font-bold text-lg">
                  {Math.round(
                    COMPLIANCE_STANDARDS.reduce((acc, std) => acc + getScore(std), 0) /
                    COMPLIANCE_STANDARDS.length
                  )}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
