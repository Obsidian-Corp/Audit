/**
 * ==================================================================
 * MY ENGAGEMENTS WIDGET
 * ==================================================================
 * Shows active engagements where user is assigned (partner, manager, or team member)
 * Per System Design Document Section 9.2
 * ==================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertCircle, ArrowRight, ChevronDown, FileText, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MyEngagementsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch my engagements
  const { data: engagements, isLoading } = useQuery({
    queryKey: ['my-engagements', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(
          `
          id,
          audit_title,
          audit_number,
          status,
          current_phase,
          budget_hours,
          hours_spent,
          planned_end_date,
          lead_auditor_id,
          manager_id,
          client:clients(id, client_name)
        `
        )
        .or(`lead_auditor_id.eq.${user?.id},manager_id.eq.${user?.id}`)
        .in('status', ['planning', 'fieldwork', 'review', 'in_progress', 'active'])
        .order('planned_end_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'planning':
        return 'secondary';
      case 'fieldwork':
      case 'in_progress':
      case 'active':
        return 'default';
      case 'review':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getRole = (engagement: any) => {
    if (engagement.lead_auditor_id === user?.id) return 'Partner';
    if (engagement.manager_id === user?.id) return 'Manager';
    return 'Team Member';
  };

  const getBudgetStatus = (engagement: any) => {
    const budgetHours = engagement.budget_hours || 0;
    const hoursSpent = engagement.hours_spent || 0;
    if (budgetHours === 0) return { percent: 0, variant: 'default' };

    const percent = (hoursSpent / budgetHours) * 100;
    if (percent > 100) return { percent, variant: 'destructive' };
    if (percent > 90) return { percent, variant: 'warning' };
    return { percent, variant: 'default' };
  };

  const getDaysToDeadline = (date: string | null) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Active Engagements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>My Active Engagements</CardTitle>
            <CardDescription>
              Showing {engagements?.length || 0} of your assigned engagements
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('/engagements')}>
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!engagements || engagements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active engagements assigned to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {engagements.map((engagement) => {
              const budgetStatus = getBudgetStatus(engagement);
              const daysToDeadline = getDaysToDeadline(engagement.planned_end_date);

              return (
                <Card key={engagement.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{engagement.audit_title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{engagement.client?.client_name || 'No client'}</span>
                            <span>•</span>
                            <span>{engagement.audit_number}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Quick Actions
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/engagements/${engagement.id}/audit`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Open Engagement
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Add Finding
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Email Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Status Row */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={getStatusVariant(engagement.status)}>
                            {engagement.current_phase || engagement.status?.replace('_', ' ') || 'Active'}
                          </Badge>
                        </div>
                        {daysToDeadline !== null && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Due:</span>
                              <span
                                className={
                                  daysToDeadline < 0
                                    ? 'text-red-600 font-medium'
                                    : daysToDeadline < 7
                                    ? 'text-orange-600 font-medium'
                                    : ''
                                }
                              >
                                {daysToDeadline < 0
                                  ? `${Math.abs(daysToDeadline)} days overdue`
                                  : `${daysToDeadline} days`}
                              </span>
                            </div>
                          </>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Role:</span>
                          <span className="font-medium">{getRole(engagement)}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Budget Progress</span>
                          <span className="font-medium">
                            {engagement.hours_spent || 0} / {engagement.budget_hours || 0} hrs (
                            {Math.round(budgetStatus.percent)}%)
                          </span>
                        </div>
                        <Progress
                          value={Math.min(budgetStatus.percent, 100)}
                          className={`h-2 ${budgetStatus.percent > 100 ? '[&>div]:bg-red-500' : ''}`}
                        />
                      </div>

                      {/* Alerts */}
                      <div className="flex items-center gap-4 text-sm">
                        {budgetStatus.percent > 90 && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Budget at risk</span>
                          </div>
                        )}
                        {/* Add more alerts as needed */}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/engagements/${engagement.id}/audit`)}
                        >
                          Open Engagement
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
