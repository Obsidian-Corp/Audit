/**
 * ==================================================================
 * ENGAGEMENT HEADER COMPONENT
 * ==================================================================
 * Header component for engagement detail page showing key metadata,
 * status, progress, and budget variance per System Design Document
 * Section 5.1.3
 * ==================================================================
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Calendar,
  User,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Edit,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EngagementHeaderProps {
  engagement: any;
}

export function EngagementHeader({ engagement }: EngagementHeaderProps) {
  // Calculate budget variance
  const budgetHours = engagement?.budget_hours || 0;
  const hoursSpent = engagement?.hours_spent || 87; // TODO: Get actual from time entries
  const budgetVariancePercentage =
    budgetHours > 0 ? ((hoursSpent - budgetHours) / budgetHours) * 100 : 0;

  // Calculate progress percentage
  const progressPercentage = budgetHours > 0 ? Math.min((hoursSpent / budgetHours) * 100, 100) : 0;

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'complete':
        return 'default';
      case 'in_progress':
        return 'default';
      case 'planning':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get budget status variant
  const getBudgetVariant = () => {
    if (budgetVariancePercentage > 10) return 'destructive';
    if (budgetVariancePercentage > 0) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Title Row */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{engagement?.audit_title || 'Untitled Engagement'}</h1>
                <Badge variant={getStatusVariant(engagement?.status)}>
                  {engagement?.current_phase || engagement?.status?.replace('_', ' ') || 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {engagement?.client?.client_name || 'No client'}
                </span>
                <span>•</span>
                <span>{engagement?.audit_number || 'No number'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  FYE {engagement?.year_end_date ? new Date(engagement.year_end_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Engagement
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Update Dates
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Update Budget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            {/* Partner */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Partner
              </div>
              <div className="font-medium text-sm">
                {engagement?.partner?.full_name || 'Not assigned'}
              </div>
            </div>

            {/* Manager */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Manager
              </div>
              <div className="font-medium text-sm">
                {engagement?.manager?.full_name || 'Not assigned'}
              </div>
            </div>

            {/* Period */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Period
              </div>
              <div className="font-medium text-sm">
                {engagement?.planned_start_date && engagement?.planned_end_date
                  ? `${new Date(engagement.planned_start_date).toLocaleDateString()} - ${new Date(engagement.planned_end_date).toLocaleDateString()}`
                  : 'Not set'}
              </div>
            </div>

            {/* Days to Deadline */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Days to Deadline
              </div>
              <div className="font-medium text-sm">
                {engagement?.planned_end_date
                  ? (() => {
                      const days = Math.ceil(
                        (new Date(engagement.planned_end_date).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return days > 0 ? `${days} days` : 'Overdue';
                    })()
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Progress and Budget Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            {/* Progress Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <Target className="h-4 w-4" />
                  Completion Progress
                </span>
                <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Based on hours logged ({hoursSpent} / {budgetHours} hours)
              </div>
            </div>

            {/* Budget Variance Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="h-4 w-4" />
                  Budget Variance
                </span>
                <Badge variant={getBudgetVariant()}>
                  {budgetVariancePercentage > 0 ? (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{budgetVariancePercentage.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {budgetVariancePercentage.toFixed(1)}%
                    </span>
                  )}
                </Badge>
              </div>
              <Progress
                value={Math.abs(budgetVariancePercentage)}
                className={`h-2 ${budgetVariancePercentage > 10 ? 'bg-red-100' : ''}`}
              />
              <div className="text-xs text-muted-foreground">
                {budgetVariancePercentage > 10
                  ? 'Over budget - review resource allocation'
                  : budgetVariancePercentage > 0
                  ? 'Approaching budget limit'
                  : 'Within budget'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
