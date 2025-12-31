/**
 * ==================================================================
 * AUDIT OVERVIEW TAB
 * ==================================================================
 * Engagement-centric view showing high-level audit status, KPIs,
 * risk indicators, and recent activity per the System Design Document
 * ==================================================================
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';

interface AuditOverviewTabProps {
  engagementId: string;
  engagement: any;
}

export function AuditOverviewTab({ engagementId, engagement }: AuditOverviewTabProps) {
  // Calculate progress percentage based on engagement status
  const getProgressPercent = () => {
    const statusProgress: Record<string, number> = {
      'planning': 15,
      'fieldwork': 50,
      'review': 75,
      'reporting': 90,
      'complete': 100,
    };
    return statusProgress[engagement?.current_phase || engagement?.status] || 0;
  };

  const getBudgetStatus = () => {
    if (!engagement?.budget_hours) return 'Unknown';
    // This would come from actual time entries in production
    const hoursUsed = 87; // Mock data
    const percentage = (hoursUsed / engagement.budget_hours) * 100;

    if (percentage > 110) return 'Over Budget';
    if (percentage > 90) return 'At Risk';
    return 'On Track';
  };

  const getBudgetVariant = (status: string) => {
    if (status === 'Over Budget') return 'destructive';
    if (status === 'At Risk') return 'secondary';
    return 'default';
  };

  const progressPercent = getProgressPercent();
  const budgetStatus = getBudgetStatus();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Engagement Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Engagement Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={engagement?.status === 'in_progress' ? 'default' : 'secondary'}>
              {engagement?.current_phase || engagement?.status?.replace('_', ' ') || 'Draft'}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Hours Logged</span>
            <span className="text-sm font-medium">
              87 / {engagement?.budget_hours || 0}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Budget Status</span>
            <Badge variant={getBudgetVariant(budgetStatus)}>
              {budgetStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Days to Deadline</span>
            <span className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {engagement?.planned_end_date
                ? Math.max(0, Math.ceil((new Date(engagement.planned_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                : 'N/A'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Risk Heatmap Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Risk Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {[
              { account: 'Cash', risk: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
              { account: 'AR', risk: 'High', color: 'bg-red-100 text-red-800 border-red-200' },
              { account: 'Inventory', risk: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
              { account: 'Revenue', risk: 'High', color: 'bg-red-100 text-red-800 border-red-200' },
              { account: 'Payroll', risk: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
              { account: 'AP', risk: 'Medium', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border text-center ${item.color}`}
              >
                <div className="font-semibold text-sm">{item.account}</div>
                <div className="text-xs mt-1">{item.risk}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Account-level risk assessment for planning and scoping
          </p>
        </CardContent>
      </Card>

      {/* Open Findings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Open Findings (12)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm">Critical</span>
            </div>
            <span className="text-sm font-medium">2</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span className="text-sm">High</span>
            </div>
            <span className="text-sm font-medium">5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <span className="text-sm">Medium</span>
            </div>
            <span className="text-sm font-medium">5</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-sm">Low</span>
            </div>
            <span className="text-sm font-medium">0</span>
          </div>
        </CardContent>
      </Card>

      {/* Team Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Partner', hours: 10, budgeted: 15, percent: 67 },
              { name: 'Manager', hours: 35, budgeted: 40, percent: 88 },
              { name: 'Senior', hours: 42, budgeted: 50, percent: 84 },
            ].map((member, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{member.name}</span>
                  <span className="text-muted-foreground">
                    {member.hours}/{member.budgeted} hrs ({member.percent}%)
                  </span>
                </div>
                <Progress value={member.percent} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity - Full Width */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: 'Bob uploaded AR confirmation responses',
                time: '2 hours ago',
                icon: FileText,
              },
              {
                action: 'Jane reviewed materiality calculation',
                time: '5 hours ago',
                icon: DollarSign,
              },
              {
                action: 'John approved finding F-001',
                time: '1 day ago',
                icon: AlertCircle,
              },
              {
                action: 'Team meeting scheduled for planning phase review',
                time: '2 days ago',
                icon: Calendar,
              },
            ].map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="mt-1 text-muted-foreground">
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Key Dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Planning Start</div>
              <div className="font-medium mt-1">
                {engagement?.planning_start_date ? new Date(engagement.planning_start_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fieldwork Start</div>
              <div className="font-medium mt-1">
                {engagement?.fieldwork_start_date ? new Date(engagement.fieldwork_start_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Report Due</div>
              <div className="font-medium mt-1">
                {engagement?.planned_end_date ? new Date(engagement.planned_end_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Year End</div>
              <div className="font-medium mt-1">
                {engagement?.year_end_date ? new Date(engagement.year_end_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
