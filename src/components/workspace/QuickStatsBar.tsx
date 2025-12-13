/**
 * ==================================================================
 * QUICK STATS BAR WIDGET
 * ==================================================================
 * Always-visible stats bar showing key metrics across workspace
 * Per System Design Document Section 9.2
 * ==================================================================
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Briefcase, AlertCircle, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function QuickStatsBar() {
  const { user } = useAuth();

  // Fetch my tasks count
  const { data: tasksStats } = useQuery({
    queryKey: ['my-tasks-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, priority, due_date', { count: 'exact' })
        .or(`assigned_to.eq.${user?.id},created_by.eq.${user?.id}`)
        .eq('status', 'pending');

      if (error) throw error;

      const critical = data?.filter((t) => t.priority === 'critical').length || 0;
      return {
        total: data?.length || 0,
        critical,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch my engagements count
  const { data: engagementsStats } = useQuery({
    queryKey: ['my-engagements-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('id, status, budgeted_hours, hours_spent', { count: 'exact' })
        .or(`lead_auditor_id.eq.${user?.id},manager_id.eq.${user?.id}`)
        .in('status', ['planning', 'fieldwork', 'review', 'in_progress']);

      if (error) throw error;

      const atRisk = data?.filter((e) => {
        const budgetHours = e.budgeted_hours || 0;
        const hoursSpent = e.hours_spent || 0;
        return budgetHours > 0 && (hoursSpent / budgetHours) * 100 > 90;
      }).length || 0;

      return {
        total: data?.length || 0,
        atRisk,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch overdue PBC items (simulated - would come from client_pbc_items table)
  const { data: pbcStats } = useQuery({
    queryKey: ['overdue-pbc-stats', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual query from client_pbc_items table once migrated
      return {
        total: 3,
        critical: 2,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch review notes (simulated - would come from review_notes table)
  const { data: reviewNotesStats } = useQuery({
    queryKey: ['review-notes-stats', user?.id],
    queryFn: async () => {
      // TODO: Replace with actual query from review_notes table once migrated
      return {
        total: 7,
        open: 5,
      };
    },
    enabled: !!user?.id,
  });

  const stats = [
    {
      title: 'My Tasks',
      count: tasksStats?.total || 0,
      detail: `${tasksStats?.critical || 0} critical`,
      icon: CheckSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'My Audits',
      count: engagementsStats?.total || 0,
      detail: `${engagementsStats?.atRisk || 0} at risk`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Overdue PBC',
      count: pbcStats?.total || 0,
      detail: `${pbcStats?.critical || 0} critical`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Review Notes',
      count: reviewNotesStats?.total || 0,
      detail: `${reviewNotesStats?.open || 0} open`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.detail.includes('critical') && stat.detail !== '0 critical' && (
                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                  {stat.detail}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
