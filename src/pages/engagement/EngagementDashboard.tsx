/**
 * EngagementDashboard Page
 * Ticket: UI-005
 *
 * Main dashboard for an engagement showing key metrics, progress,
 * recent activity, and quick actions.
 */

import { useEngagementContext } from '@/contexts/EngagementContext';
import { useProcedureExecution } from '@/hooks/useProcedureExecution';
import { useFindingManagement } from '@/hooks/useFindingManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  ListChecks,
  FileSearch,
  Target,
  DollarSign,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

// Metric card component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  onClick?: () => void;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  onClick,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs mt-2',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                <TrendingUp
                  className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')}
                />
                <span>{trend.value}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center bg-muted',
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick action button
interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

function QuickAction({
  label,
  description,
  icon: Icon,
  onClick,
  badge,
  badgeVariant = 'secondary',
}: QuickActionProps) {
  return (
    <Button
      variant="outline"
      className="h-auto p-4 justify-start text-left flex-col items-start"
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <Icon className="h-5 w-5 text-primary" />
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Button>
  );
}

// Team member item
interface TeamMemberItemProps {
  member: {
    user_id: string;
    role: string;
    hours_allocated: number;
    hours_actual: number;
    profiles: {
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
  };
}

function TeamMemberItem({ member }: TeamMemberItemProps) {
  const initials =
    member.profiles?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';

  const utilizationPercent =
    member.hours_allocated > 0
      ? Math.round((member.hours_actual / member.hours_allocated) * 100)
      : 0;

  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={member.profiles?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {member.profiles?.full_name || member.profiles?.email || 'Unknown'}
        </p>
        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant={
                utilizationPercent > 100
                  ? 'destructive'
                  : utilizationPercent > 80
                  ? 'default'
                  : 'secondary'
              }
            >
              {member.hours_actual}/{member.hours_allocated}h
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {utilizationPercent}% utilization
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function EngagementDashboard() {
  const navigate = useNavigate();
  const {
    engagement,
    client,
    team,
    completionPercentage,
    daysUntilDue,
    hoursRemaining,
    budgetVariance,
    procedureStats,
    findingStats,
    workpaperStats,
    materiality,
  } = useEngagementContext();

  const { procedures, stats: procStats } = useProcedureExecution(engagement?.id);
  const { findings, stats: findStats } = useFindingManagement(engagement?.id);

  const basePath = `/engagements/${engagement?.id}`;

  // Get overdue/due soon counts
  const overdueCount = procStats?.overdue || 0;
  const dueSoonCount = procStats?.dueSoon || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{engagement?.audit_title || 'Engagement'}</h1>
          <p className="text-muted-foreground">
            {client?.client_name} • {engagement?.audit_number || 'No number'}
          </p>
        </div>
        <Badge
          variant={
            daysUntilDue < 0
              ? 'destructive'
              : daysUntilDue <= 7
              ? 'default'
              : 'secondary'
          }
          className="text-sm"
        >
          {daysUntilDue < 0
            ? `${Math.abs(daysUntilDue)} days overdue`
            : daysUntilDue === 0
            ? 'Due today'
            : `${daysUntilDue} days remaining`}
        </Badge>
      </div>

      {/* Progress section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{procedureStats.complete} complete</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>{procedureStats.in_progress + procedureStats.in_review} in progress</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>{procedureStats.not_started} not started</span>
              </div>
            </div>
            {overdueCount > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {overdueCount} overdue
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Procedures"
          value={`${procedureStats.complete}/${procedureStats.total}`}
          subtitle={`${procStats?.pending_review || 0} pending review`}
          icon={ListChecks}
          onClick={() => navigate(`${basePath}/procedures`)}
        />
        <MetricCard
          title="Findings"
          value={findingStats.total}
          subtitle={`${findingStats.open} open`}
          icon={AlertCircle}
          iconColor={findingStats.open > 0 ? 'text-orange-500' : 'text-primary'}
          onClick={() => navigate(`${basePath}/findings`)}
        />
        <MetricCard
          title="Workpapers"
          value={workpaperStats.total}
          subtitle={`${workpaperStats.pending_review} pending review`}
          icon={FileSearch}
          onClick={() => navigate(`${basePath}/workpapers`)}
        />
        <MetricCard
          title="Hours Remaining"
          value={hoursRemaining}
          subtitle={
            budgetVariance > 0
              ? `${budgetVariance.toFixed(1)}% over budget`
              : `${Math.abs(budgetVariance).toFixed(1)}% under budget`
          }
          icon={Timer}
          iconColor={budgetVariance > 10 ? 'text-red-500' : 'text-primary'}
          onClick={() => navigate(`${basePath}/budget`)}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Quick actions and findings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for this engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickAction
                  label="My Procedures"
                  description="View assigned tasks"
                  icon={ListChecks}
                  onClick={() => navigate(`${basePath}/procedures?assignedToMe=true`)}
                  badge={String(procStats?.in_progress || 0)}
                />
                <QuickAction
                  label="Add Finding"
                  description="Document an issue"
                  icon={AlertCircle}
                  onClick={() => navigate(`${basePath}/findings/new`)}
                />
                <QuickAction
                  label="Create Workpaper"
                  description="New documentation"
                  icon={FileText}
                  onClick={() => navigate(`${basePath}/workpapers/new`)}
                />
                <QuickAction
                  label="Review Queue"
                  description="Items to review"
                  icon={CheckCircle2}
                  onClick={() => navigate(`${basePath}/review`)}
                  badge={String(workpaperStats.pending_review)}
                  badgeVariant={workpaperStats.pending_review > 0 ? 'destructive' : 'secondary'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Findings summary */}
          {findingStats.total > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>Findings Summary</CardTitle>
                  <CardDescription>Issues identified during the audit</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/findings`)}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Critical', count: findStats?.bySeverity.critical || 0, color: 'bg-red-500' },
                    { label: 'High', count: findStats?.bySeverity.high || 0, color: 'bg-orange-500' },
                    { label: 'Medium', count: findStats?.bySeverity.medium || 0, color: 'bg-yellow-500' },
                    { label: 'Low', count: findStats?.bySeverity.low || 0, color: 'bg-blue-500' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div
                        className={cn(
                          'h-12 w-12 rounded-full flex items-center justify-center mx-auto text-white font-bold',
                          item.color
                        )}
                      >
                        {item.count}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent findings */}
                {findings && findings.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-medium">Recent Findings</h4>
                    {findings.slice(0, 3).map((finding) => (
                      <div
                        key={finding.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => navigate(`${basePath}/findings/${finding.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              finding.severity === 'critical' && 'border-red-500 text-red-500',
                              finding.severity === 'high' && 'border-orange-500 text-orange-500',
                              finding.severity === 'medium' && 'border-yellow-500 text-yellow-500',
                              finding.severity === 'low' && 'border-blue-500 text-blue-500'
                            )}
                          >
                            {finding.finding_reference}
                          </Badge>
                          <span className="text-sm truncate max-w-[200px]">{finding.title}</span>
                        </div>
                        <Badge variant="secondary" className="capitalize">
                          {finding.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Materiality */}
          {materiality && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Materiality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Materiality</p>
                    <p className="text-xl font-bold">
                      ${materiality.overall_materiality.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Performance Materiality</p>
                    <p className="text-xl font-bold">
                      ${materiality.performance_materiality.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clearly Trivial</p>
                    <p className="text-xl font-bold">
                      ${materiality.clearly_trivial_threshold.toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Based on {materiality.benchmark_type} of $
                  {materiality.benchmark_amount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Team and timeline */}
        <div className="space-y-6">
          {/* Team */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team
                </CardTitle>
                <CardDescription>{team.length} members</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`${basePath}/team`)}>
                Manage
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {team.slice(0, 5).map((member) => (
                  <TeamMemberItem key={member.id} member={member} />
                ))}
              </div>
              {team.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => navigate(`${basePath}/team`)}
                >
                  View all {team.length} members
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Key dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {engagement?.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="text-sm font-medium">
                      {format(new Date(engagement.start_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {engagement?.end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Target Completion</span>
                    <span className="text-sm font-medium">
                      {format(new Date(engagement.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {engagement?.reporting_deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Report Deadline</span>
                    <span className="text-sm font-medium">
                      {format(new Date(engagement.reporting_deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Hours Used</span>
                    <span className="text-sm">
                      {team.reduce((sum, m) => sum + (m.hours_actual || 0), 0)} /{' '}
                      {team.reduce((sum, m) => sum + (m.hours_allocated || 0), 0)}
                    </span>
                  </div>
                  <Progress
                    value={
                      team.reduce((sum, m) => sum + (m.hours_allocated || 0), 0) > 0
                        ? (team.reduce((sum, m) => sum + (m.hours_actual || 0), 0) /
                            team.reduce((sum, m) => sum + (m.hours_allocated || 0), 0)) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Variance</span>
                  <Badge variant={budgetVariance > 0 ? 'destructive' : 'secondary'}>
                    {budgetVariance > 0 ? '+' : ''}
                    {budgetVariance.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default EngagementDashboard;
