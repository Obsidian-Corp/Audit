import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity } from "lucide-react";

interface BurnRateAnalysisProps {
  engagement: any;
}

export const BurnRateAnalysis = ({ engagement }: BurnRateAnalysisProps) => {
  const hoursSpent = engagement.hours_spent || 0;
  const hoursAllocated = engagement.hours_allocated || 0;
  const budgetSpent = engagement.budget_spent || 0;
  const budgetAllocated = engagement.budget_allocated || 0;

  const hoursBurnRate = hoursAllocated > 0 ? ((hoursSpent / hoursAllocated) * 100).toFixed(1) : 0;
  const budgetBurnRate = budgetAllocated > 0 ? ((budgetSpent / budgetAllocated) * 100).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Burn Rate Analysis
        </CardTitle>
        <CardDescription>
          Track budget and time consumption rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Burn rate analysis component is under development.
            This feature will provide detailed burn rate metrics, trend analysis,
            and early warning indicators for budget overruns.
          </AlertDescription>
        </Alert>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hours Burn Rate</span>
              <span className="font-medium">{hoursBurnRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Burn Rate</span>
              <span className="font-medium">{budgetBurnRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
