import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, TrendingUp, Shield, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { RiskAssessmentSummaryCard } from '@/components/audit/risk/RiskAssessmentSummaryCard';
import { RiskAssessmentWizard } from '@/components/audit/risk/RiskAssessmentWizard';
import { useState } from 'react';

interface EngagementRiskAssessmentTabProps {
  engagementId: string;
}

export function EngagementRiskAssessmentTab({ engagementId }: EngagementRiskAssessmentTabProps) {
  const { data: riskAssessment, isLoading } = useRiskAssessment(engagementId);
  const [riskWizardOpen, setRiskWizardOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!riskAssessment) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment Required</CardTitle>
            <CardDescription>
              Complete a risk assessment to identify and evaluate engagement risks per AU-C 315
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A comprehensive risk assessment is the foundation of an effective audit approach.
              The risk assessment should identify and evaluate:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Fraud risks and indicators</li>
              <li>Going concern considerations</li>
              <li>Related party transactions</li>
              <li>Material account balances and assertions</li>
              <li>Business risks and industry factors</li>
            </ul>
            <Button onClick={() => setRiskWizardOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Start Risk Assessment
            </Button>
          </CardContent>
        </Card>

        <RiskAssessmentWizard
          engagementId={engagementId}
          open={riskWizardOpen}
          onOpenChange={setRiskWizardOpen}
          onComplete={() => setRiskWizardOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Risk Assessment</h3>
          <p className="text-sm text-muted-foreground">
            AU-C 315: Understanding the Entity and Assessing Risks
          </p>
        </div>
        <Button onClick={() => setRiskWizardOpen(true)}>
          <Target className="h-4 w-4 mr-2" />
          Update Assessment
        </Button>
      </div>

      {/* Risk Assessment Summary */}
      <RiskAssessmentSummaryCard
        assessment={riskAssessment}
        mode="full"
        onReassess={() => setRiskWizardOpen(true)}
      />

      {/* Risk Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Matrix</CardTitle>
          <CardDescription>
            Inherent risk vs control risk evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Inherent Risk Factors</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Industry complexity and volatility</li>
                <li>Financial statement complexity</li>
                <li>Management integrity and competence</li>
                <li>Related party transactions</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Control Risk Factors</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Control environment effectiveness</li>
                <li>IT general controls maturity</li>
                <li>Segregation of duties</li>
                <li>Management override risk</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <RiskAssessmentWizard
        engagementId={engagementId}
        open={riskWizardOpen}
        onOpenChange={setRiskWizardOpen}
        onComplete={() => setRiskWizardOpen(false)}
      />
    </div>
  );
}
