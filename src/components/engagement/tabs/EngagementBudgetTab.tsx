import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetForecastPanel } from "@/components/engagement/budget/BudgetForecastPanel";
import { BurnRateAnalysis } from "@/components/engagement/budget/BurnRateAnalysis";
import { VarianceAnalysisDashboard } from "@/components/engagement/budget/VarianceAnalysisDashboard";

export const EngagementBudgetTab = ({ engagement }: { engagement: any }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${engagement.budget_allocated?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{engagement.hours_allocated || 0} hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${engagement.budget_spent?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{engagement.hours_spent || 0} hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${((engagement.budget_allocated || 0) - (engagement.budget_spent || 0)).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {((engagement.hours_allocated || 0) - (engagement.hours_spent || 0))} hours
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="burnrate">Burn Rate</TabsTrigger>
          <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast">
          <BudgetForecastPanel engagement={engagement} />
        </TabsContent>

        <TabsContent value="burnrate">
          <BurnRateAnalysis engagement={engagement} />
        </TabsContent>

        <TabsContent value="variance">
          <VarianceAnalysisDashboard engagement={engagement} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
