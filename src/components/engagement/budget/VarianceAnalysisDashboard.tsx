import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";

interface VarianceAnalysisDashboardProps {
  engagement: any;
}

export const VarianceAnalysisDashboard = ({ engagement }: VarianceAnalysisDashboardProps) => {
  const budgetVariance = (engagement.budget_allocated || 0) - (engagement.budget_spent || 0);
  const hoursVariance = (engagement.hours_allocated || 0) - (engagement.hours_spent || 0);
  const budgetVariancePercent = engagement.budget_allocated > 0
    ? ((budgetVariance / engagement.budget_allocated) * 100).toFixed(1)
    : 0;
  const hoursVariancePercent = engagement.hours_allocated > 0
    ? ((hoursVariance / engagement.hours_allocated) * 100).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Variance Analysis
        </CardTitle>
        <CardDescription>
          Compare actual vs. budgeted performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Variance analysis dashboard is under development.
            This feature will provide detailed variance reporting, trend analysis,
            and actionable insights for budget management.
          </AlertDescription>
        </Alert>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Budget Variance</p>
                <p className="text-xs text-muted-foreground">
                  ${Math.abs(budgetVariance).toLocaleString()} {budgetVariance >= 0 ? 'under budget' : 'over budget'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {budgetVariance >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${budgetVariance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {budgetVariancePercent}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Hours Variance</p>
                <p className="text-xs text-muted-foreground">
                  {Math.abs(hoursVariance).toLocaleString()} hours {hoursVariance >= 0 ? 'remaining' : 'over'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hoursVariance >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
                <span className={`font-medium ${hoursVariance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {hoursVariancePercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
