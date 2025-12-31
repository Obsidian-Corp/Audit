/**
 * ==================================================================
 * BUDGET FORECAST PANEL
 * ==================================================================
 * Predictive analytics for budget completion and forecasting
 * ==================================================================
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface BudgetForecastPanelProps {
  engagement: any;
}

export const BudgetForecastPanel = ({ engagement }: BudgetForecastPanelProps) => {
  const budgetAllocated = engagement?.budget_allocated || 0;
  const budgetSpent = engagement?.budget_spent || 0;
  const hoursAllocated = engagement?.hours_allocated || 0;
  const hoursSpent = engagement?.hours_spent || 0;

  const forecast = useMemo(() => {
    // Calculate completion percentage based on workflow status
    const statusProgress: Record<string, number> = {
      draft: 5,
      pending_approval: 10,
      approved: 15,
      planning: 25,
      fieldwork: 60,
      reporting: 85,
      review: 95,
      complete: 100,
    };

    const completionPercent = statusProgress[engagement?.workflow_status] || 0;
    const budgetPercent = budgetAllocated > 0 ? (budgetSpent / budgetAllocated) * 100 : 0;
    const hoursPercent = hoursAllocated > 0 ? (hoursSpent / hoursAllocated) * 100 : 0;

    // Forecast calculations
    const budgetAtCompletion = completionPercent > 0
      ? (budgetSpent / completionPercent) * 100
      : budgetAllocated;

    const hoursAtCompletion = completionPercent > 0
      ? (hoursSpent / completionPercent) * 100
      : hoursAllocated;

    const budgetVariance = budgetAllocated - budgetAtCompletion;
    const hoursVariance = hoursAllocated - hoursAtCompletion;

    const budgetStatus = budgetVariance >= 0 ? 'under' : 'over';
    const hoursStatus = hoursVariance >= 0 ? 'under' : 'over';

    return {
      completionPercent,
      budgetPercent,
      hoursPercent,
      budgetAtCompletion,
      hoursAtCompletion,
      budgetVariance,
      hoursVariance,
      budgetStatus,
      hoursStatus,
    };
  }, [engagement, budgetAllocated, budgetSpent, hoursAllocated, hoursSpent]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Budget Forecast
        </CardTitle>
        <CardDescription>
          Projected budget and hours at completion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Engagement Progress</span>
            <span className="font-medium">{forecast.completionPercent}%</span>
          </div>
          <Progress value={forecast.completionPercent} className="h-2" />
          <p className="text-xs text-muted-foreground capitalize">
            Status: {engagement?.workflow_status?.replace('_', ' ') || 'Draft'}
          </p>
        </div>

        {/* Budget Forecast */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Budget Forecast</span>
            <Badge variant={forecast.budgetStatus === 'under' ? 'default' : 'destructive'}>
              {forecast.budgetStatus === 'under' ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> Under Budget</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Over Budget</>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Allocated</p>
              <p className="font-semibold text-lg">{formatCurrency(budgetAllocated)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Spent to Date</p>
              <p className="font-semibold text-lg">{formatCurrency(budgetSpent)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forecast at Completion</p>
              <p className={`font-semibold text-lg ${forecast.budgetStatus === 'over' ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(forecast.budgetAtCompletion)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Variance</p>
              <p className={`font-semibold text-lg flex items-center gap-1 ${forecast.budgetVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {forecast.budgetVariance >= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                {formatCurrency(Math.abs(forecast.budgetVariance))}
              </p>
            </div>
          </div>

          <Progress value={Math.min(forecast.budgetPercent, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {forecast.budgetPercent.toFixed(1)}% of budget used
          </p>
        </div>

        {/* Hours Forecast */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Hours Forecast</span>
            <Badge variant={forecast.hoursStatus === 'under' ? 'default' : 'destructive'}>
              {forecast.hoursStatus === 'under' ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" /> On Track</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" /> Over Hours</>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Allocated</p>
              <p className="font-semibold text-lg">{hoursAllocated} hrs</p>
            </div>
            <div>
              <p className="text-muted-foreground">Logged to Date</p>
              <p className="font-semibold text-lg">{hoursSpent} hrs</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forecast at Completion</p>
              <p className={`font-semibold text-lg ${forecast.hoursStatus === 'over' ? 'text-red-600' : 'text-green-600'}`}>
                {forecast.hoursAtCompletion.toFixed(0)} hrs
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Variance</p>
              <p className={`font-semibold text-lg flex items-center gap-1 ${forecast.hoursVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {forecast.hoursVariance >= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                {Math.abs(forecast.hoursVariance).toFixed(0)} hrs
              </p>
            </div>
          </div>

          <Progress value={Math.min(forecast.hoursPercent, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {forecast.hoursPercent.toFixed(1)}% of hours used
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
