/**
 * ==================================================================
 * FIRM OVERVIEW WIDGET
 * ==================================================================
 * Shows team capacity and engagement health
 * Visible to: Partners, Practice Leaders, Engagement Managers, Firm Administrators
 * Per System Design Document Section 9.2
 * ==================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Users, Briefcase, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function FirmOverviewWidget() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Fetch firm-wide engagement stats
  const { data: engagementHealth, isLoading: engagementLoading } = useQuery({
    queryKey: ['firm-engagement-health', profile?.firm_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('id, status, budget_hours, hours_spent')
        .eq('firm_id', profile?.firm_id)
        .in('status', ['planning', 'fieldwork', 'review', 'in_progress', 'active']);

      if (error) throw error;

      const atRisk = data.filter((e) => {
        const budgetHours = e.budget_hours || 0;
        const hoursSpent = e.hours_spent || 0;
        return budgetHours > 0 && (hoursSpent / budgetHours) * 100 > 90;
      }).length;

      const onTrack = data.filter((e) => {
        const budgetHours = e.budget_hours || 0;
        const hoursSpent = e.hours_spent || 0;
        const percent = budgetHours > 0 ? (hoursSpent / budgetHours) * 100 : 0;
        return percent >= 50 && percent <= 90;
      }).length;

      const ahead = data.filter((e) => {
        const budgetHours = e.budget_hours || 0;
        const hoursSpent = e.hours_spent || 0;
        const percent = budgetHours > 0 ? (hoursSpent / budgetHours) * 100 : 0;
        return percent < 50;
      }).length;

      return {
        total: data.length,
        atRisk,
        onTrack,
        ahead,
      };
    },
    enabled: !!profile?.firm_id,
  });

  // Fetch team capacity (simulated - would come from resource planning tables)
  const { data: teamCapacity, isLoading: capacityLoading } = useQuery({
    queryKey: ['firm-team-capacity', profile?.firm_id],
    queryFn: async () => {
      // TODO: Replace with actual capacity calculation from resource planning
      return {
        overallUtilization: 78,
        availableThisWeek: 5,
        overallocated: 2,
      };
    },
    enabled: !!profile?.firm_id,
  });

  if (engagementLoading || capacityLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Firm Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
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
            <CardTitle>Firm Overview</CardTitle>
            <CardDescription>Team capacity and engagement health</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Leadership Only
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Capacity */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Utilization */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Overall Utilization</span>
                  <span className="font-medium">{teamCapacity?.overallUtilization || 0}%</span>
                </div>
                <Progress value={teamCapacity?.overallUtilization || 0} className="h-2" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {teamCapacity?.availableThisWeek || 0}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Available this week</div>
                </div>
                <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {teamCapacity?.overallocated || 0}
                  </div>
                  <div className="text-xs text-orange-700 mt-1">Overallocated</div>
                </div>
              </div>

              {/* Action Button */}
              <Button variant="outline" size="sm" className="w-full mt-2">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Resource Scheduler
              </Button>
            </CardContent>
          </Card>

          {/* Engagement Health */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Engagement Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Health Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm">At Risk</span>
                  </div>
                  <Badge variant="destructive">{engagementHealth?.atRisk || 0}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                    <span className="text-sm">On Track</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {engagementHealth?.onTrack || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                    <span className="text-sm">Ahead</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {engagementHealth?.ahead || 0}
                  </Badge>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Active</span>
                  <span className="text-2xl font-bold">{engagementHealth?.total || 0}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate('/engagements')}
              >
                View All Engagements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Alert if there are at-risk engagements */}
        {engagementHealth && engagementHealth.atRisk > 0 && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 font-medium mb-1">
              <AlertTriangle className="h-5 w-5" />
              {engagementHealth.atRisk} Engagement{engagementHealth.atRisk > 1 ? 's' : ''} Need Attention
            </div>
            <p className="text-sm text-orange-700">
              These engagements are over 90% of budget. Review resource allocation and consider
              reallocating team members.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
