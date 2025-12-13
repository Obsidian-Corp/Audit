import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, TrendingUp, Users, FileText, Clock } from 'lucide-react';
import { useProgramAnalytics } from '@/hooks/useProgramAnalytics';
import { ProgramCompletionChart } from '@/components/audit/analytics/ProgramCompletionChart';
import { ProcedureEfficiencyChart } from '@/components/audit/analytics/ProcedureEfficiencyChart';
import { TeamPerformanceChart } from '@/components/audit/analytics/TeamPerformanceChart';
import { WorkpaperReviewChart } from '@/components/audit/analytics/WorkpaperReviewChart';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function ProgramAnalytics() {
  const { programMetrics, procedureEfficiency, teamPerformance, workpaperMetrics, isLoading } = useProgramAnalytics();

  const handleExport = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting analytics as ${format.toUpperCase()}...`);
    // Implement export logic
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalProcedures = programMetrics.reduce((sum, p) => sum + p.total_procedures, 0);
  const completedProcedures = programMetrics.reduce((sum, p) => sum + p.completed_procedures, 0);
  const overallCompletion = totalProcedures > 0 
    ? Math.round((completedProcedures / totalProcedures) * 100)
    : 0;

  const avgEfficiency = procedureEfficiency.length > 0
    ? Math.round(
        procedureEfficiency.reduce((sum, p) => sum + p.variance_percentage, 0) / procedureEfficiency.length
      )
    : 0;

  const totalWorkpapers = workpaperMetrics.reduce((sum, m) => sum + m.count, 0);
  const avgReviewTime = workpaperMetrics.length > 0
    ? Math.round(
        workpaperMetrics.reduce((sum, m) => sum + (m.avg_review_time_days * m.count), 0) / 
        totalWorkpapers
      )
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Program Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics and insights across audit programs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              {completedProcedures} of {totalProcedures} procedures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Variance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEfficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Average vs estimated hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPerformance.length}</div>
            <p className="text-xs text-muted-foreground">
              Active on procedures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgReviewTime}</div>
            <p className="text-xs text-muted-foreground">
              days per workpaper
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completion">Program Completion</TabsTrigger>
          <TabsTrigger value="efficiency">Procedure Efficiency</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="workpapers">Workpaper Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="space-y-4">
          <ProgramCompletionChart data={programMetrics} />
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <ProcedureEfficiencyChart data={procedureEfficiency} />
          
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Details</CardTitle>
              <CardDescription>Detailed variance analysis by procedure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {procedureEfficiency.slice(0, 10).map((proc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{proc.procedure_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {proc.completion_count} completions • Avg {proc.avg_days_to_complete} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{proc.variance_percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        {proc.estimated_hours}h est • {proc.actual_hours}h actual
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamPerformanceChart data={teamPerformance} />
          
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
              <CardDescription>Individual performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamPerformance.map((member, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.total_assigned} assigned • {member.completed} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{member.completion_rate}%</p>
                      <p className="text-xs text-muted-foreground">
                        Avg {member.avg_completion_time_days} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workpapers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <WorkpaperReviewChart data={workpaperMetrics} />
            
            <Card>
              <CardHeader>
                <CardTitle>Review Metrics</CardTitle>
                <CardDescription>Average review times by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workpaperMetrics.map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {metric.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {metric.count} workpapers
                        </span>
                      </div>
                      {metric.avg_review_time_days > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Average review: {metric.avg_review_time_days} days
                        </p>
                      )}
                      {metric.oldest_pending_days > 0 && (
                        <p className="text-xs text-destructive">
                          Oldest pending: {metric.oldest_pending_days} days
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
