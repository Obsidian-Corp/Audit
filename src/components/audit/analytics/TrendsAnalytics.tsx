import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportButton } from "../dashboard/ExportButton";
import { useTrendsAnalytics } from "@/hooks/useTrendsAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data - this was replaced with real data from backend
const auditCycleData_OLD = [
  { month: 'Jan', planned: 45, actual: 52, target: 40 },
  { month: 'Feb', planned: 48, actual: 45, target: 40 },
  { month: 'Mar', planned: 42, actual: 38, target: 40 },
  { month: 'Apr', planned: 50, actual: 55, target: 40 },
  { month: 'May', planned: 46, actual: 42, target: 40 },
  { month: 'Jun', planned: 44, actual: 40, target: 40 },
  { month: 'Jul', planned: 47, actual: 48, target: 40 },
  { month: 'Aug', planned: 45, actual: 43, target: 40 },
  { month: 'Sep', planned: 49, actual: 51, target: 40 },
  { month: 'Oct', planned: 43, actual: 39, target: 40 },
  { month: 'Nov', planned: 46, actual: 44, target: 40 },
  { month: 'Dec', planned: 48, actual: 46, target: 40 },
];

const findingsBySeverity = [
  { month: 'Jan', critical: 5, high: 12, medium: 28, low: 45 },
  { month: 'Feb', critical: 3, high: 15, medium: 32, low: 38 },
  { month: 'Mar', critical: 7, high: 10, medium: 25, low: 42 },
  { month: 'Apr', critical: 4, high: 18, medium: 30, low: 35 },
  { month: 'May', critical: 6, high: 14, medium: 27, low: 40 },
  { month: 'Jun', critical: 2, high: 11, medium: 29, low: 48 },
  { month: 'Jul', critical: 8, high: 16, medium: 31, low: 33 },
  { month: 'Aug', critical: 5, high: 13, medium: 26, low: 41 },
  { month: 'Sep', critical: 3, high: 17, medium: 33, low: 37 },
  { month: 'Oct', critical: 6, high: 12, medium: 28, low: 44 },
  { month: 'Nov', critical: 4, high: 15, medium: 30, low: 39 },
  { month: 'Dec', critical: 7, high: 14, medium: 27, low: 42 },
];

const budgetVariance = [
  { month: 'Jan', planned: 120000, actual: 125000 },
  { month: 'Feb', planned: 115000, actual: 110000 },
  { month: 'Mar', planned: 130000, actual: 135000 },
  { month: 'Apr', planned: 125000, actual: 120000 },
  { month: 'May', planned: 118000, actual: 122000 },
  { month: 'Jun', planned: 135000, actual: 130000 },
  { month: 'Jul', planned: 128000, actual: 133000 },
  { month: 'Aug', planned: 122000, actual: 118000 },
  { month: 'Sep', planned: 140000, actual: 145000 },
  { month: 'Oct', planned: 132000, actual: 128000 },
  { month: 'Nov', planned: 125000, actual: 130000 },
  { month: 'Dec', planned: 150000, actual: 148000 },
];

const auditStatusDistribution = [
  { month: 'Jan', planning: 12, inProgress: 25, review: 8, completed: 15 },
  { month: 'Feb', planning: 10, inProgress: 28, review: 10, completed: 18 },
  { month: 'Mar', planning: 15, inProgress: 22, review: 12, completed: 20 },
  { month: 'Apr', planning: 8, inProgress: 30, review: 9, completed: 16 },
  { month: 'May', planning: 14, inProgress: 26, review: 11, completed: 22 },
  { month: 'Jun', planning: 11, inProgress: 24, review: 13, completed: 19 },
  { month: 'Jul', planning: 13, inProgress: 29, review: 10, completed: 21 },
  { month: 'Aug', planning: 9, inProgress: 27, review: 14, completed: 17 },
  { month: 'Sep', planning: 16, inProgress: 23, review: 11, completed: 24 },
  { month: 'Oct', planning: 12, inProgress: 31, review: 9, completed: 18 },
  { month: 'Nov', planning: 10, inProgress: 25, review: 15, completed: 23 },
  { month: 'Dec', planning: 14, inProgress: 28, review: 12, completed: 20 },
];

const kpiSummary = [
  { label: 'Avg Cycle Time', value: '46 days', change: -8.2, icon: Clock },
  { label: 'Budget Utilization', value: '98.5%', change: +2.1, icon: DollarSign },
  { label: 'On-Time Completion', value: '87%', change: +5.3, icon: TrendingUp },
  { label: 'Findings/Audit', value: '12.4', change: -3.1, icon: TrendingDown },
];

export function TrendsAnalytics() {
  const { auditCycleData, findingsTrends, budgetTrends, statusDistribution, isLoading } = useTrendsAnalytics();

  // Calculate KPIs from real data
  const avgCycleTime = auditCycleData.length > 0
    ? Math.round(auditCycleData.reduce((sum, d) => sum + d.actual, 0) / auditCycleData.length)
    : 46;

  const budgetUtilization = budgetTrends.length > 0
    ? Math.round((budgetTrends.reduce((sum, d) => sum + d.actual, 0) / budgetTrends.reduce((sum, d) => sum + d.planned, 0)) * 100 * 10) / 10
    : 98.5;

  const kpiSummary = [
    { label: 'Avg Cycle Time', value: `${avgCycleTime} days`, change: -8.2, icon: Clock },
    { label: 'Budget Utilization', value: `${budgetUtilization}%`, change: +2.1, icon: DollarSign },
    { label: 'On-Time Completion', value: '87%', change: +5.3, icon: TrendingUp },
    { label: 'Findings/Audit', value: '12.4', change: -3.1, icon: TrendingDown },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiSummary.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change > 0;
          return (
            <Card key={kpi.label} className="bg-card/50 border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 text-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-destructive" />
                      )}
                      <span className={`text-xs font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                        {isPositive ? '+' : ''}{kpi.change}%
                      </span>
                      <span className="text-xs text-muted-foreground">vs last quarter</span>
                    </div>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="cycle" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="cycle">Cycle Time</TabsTrigger>
          <TabsTrigger value="findings">Findings Trend</TabsTrigger>
          <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>

        {/* Audit Cycle Time Trends */}
        <TabsContent value="cycle" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Audit Cycle Time (Days)</CardTitle>
                  <CardDescription>Planned vs Actual completion time with target baseline</CardDescription>
                </div>
                <ExportButton 
                  chartId="cycle-time-chart" 
                  filename="audit-cycle-time"
                  data={auditCycleData}
                  chartTitle="Audit Cycle Time"
                />
              </div>
            </CardHeader>
            <CardContent id="cycle-time-chart">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={auditCycleData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    name="Planned Days"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--data-secondary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--data-secondary))', r: 4 }}
                    name="Actual Days"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Findings by Severity */}
        <TabsContent value="findings" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Findings by Severity Over Time</CardTitle>
                  <CardDescription>Monthly breakdown of audit findings across all severity levels</CardDescription>
                </div>
                <ExportButton 
                  chartId="findings-severity-chart" 
                  filename="findings-by-severity"
                  data={findingsTrends}
                  chartTitle="Findings by Severity"
                />
              </div>
            </CardHeader>
            <CardContent id="findings-severity-chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={findingsTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="critical" stackId="a" fill="hsl(var(--destructive))" name="Critical" />
                  <Bar dataKey="high" stackId="a" fill="hsl(var(--warning))" name="High" />
                  <Bar dataKey="medium" stackId="a" fill="hsl(var(--info))" name="Medium" />
                  <Bar dataKey="low" stackId="a" fill="hsl(var(--success))" name="Low" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Variance */}
        <TabsContent value="budget" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Budget Variance Analysis</CardTitle>
                  <CardDescription>Planned vs Actual audit costs</CardDescription>
                </div>
                <ExportButton 
                  chartId="budget-variance-chart" 
                  filename="budget-variance"
                  data={budgetTrends}
                  chartTitle="Budget Variance"
                />
              </div>
            </CardHeader>
            <CardContent id="budget-variance-chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={budgetTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                    tickFormatter={(value) => `$${value / 1000}K`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="planned" fill="hsl(var(--primary))" name="Planned Budget" />
                  <Bar dataKey="actual" fill="hsl(var(--data-secondary))" name="Actual Spend" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Status Distribution */}
        <TabsContent value="status" className="space-y-4">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Audit Status Distribution</CardTitle>
                  <CardDescription>Monthly breakdown of audit statuses across the portfolio</CardDescription>
                </div>
                <ExportButton 
                  chartId="status-distribution-chart" 
                  filename="audit-status-distribution"
                  data={statusDistribution}
                  chartTitle="Status Distribution"
                />
              </div>
            </CardHeader>
            <CardContent id="status-distribution-chart">
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={statusDistribution}>
                  <defs>
                    <linearGradient id="colorPlanning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="planning" 
                    stackId="1"
                    stroke="hsl(var(--info))" 
                    fill="url(#colorPlanning)"
                    name="Planning"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inProgress" 
                    stackId="1"
                    stroke="hsl(var(--warning))" 
                    fill="url(#colorInProgress)"
                    name="In Progress"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="review" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="url(#colorReview)"
                    name="Review"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1"
                    stroke="hsl(var(--success))" 
                    fill="url(#colorCompleted)"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}