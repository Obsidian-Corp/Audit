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
import { CheckSquare, Briefcase, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function QuickStatsBar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Fetch my tasks count - includes both tasks and engagement_procedures assigned to user
  const { data: tasksStats } = useQuery({
    queryKey: ['my-tasks-stats', user?.id, profile?.firm_id],
    queryFn: async () => {
      // Fetch tasks assigned to or created by user
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('id, priority, due_date', { count: 'exact' })
        .or(`assigned_to.eq.${user?.id},created_by.eq.${user?.id}`)
        .eq('status', 'pending');

      // Also fetch engagement procedures assigned to user (these show in sidebar as "My Procedures")
      const { data: proceduresData, error: proceduresError } = await supabase
        .from('engagement_procedures')
        .select('id, priority, status')
        .eq('assigned_to', user?.id)
        .neq('status', 'completed');

      const tasks = tasksData || [];
      const procedures = proceduresData || [];

      // Combine both for total count
      const totalCount = tasks.length + procedures.length;
      const criticalTasks = tasks.filter((t) => t.priority === 'critical').length;
      const criticalProcedures = procedures.filter((p) => p.priority === 'high').length;

      return {
        total: totalCount,
        critical: criticalTasks + criticalProcedures,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch my engagements count - audits where user is assigned or firm audits
  const { data: engagementsStats } = useQuery({
    queryKey: ['my-engagements-stats', user?.id, profile?.firm_id],
    queryFn: async () => {
      // First try to get audits where user is directly assigned
      let query = supabase
        .from('audits')
        .select('id, status, budget_hours, hours_spent', { count: 'exact' })
        .in('status', ['planning', 'fieldwork', 'review', 'in_progress', 'active']);

      // If user has firm_id, also include firm's audits
      if (profile?.firm_id) {
        query = query.eq('firm_id', profile.firm_id);
      } else {
        // Fallback: filter by user assignment if no firm
        query = query.or(`lead_auditor_id.eq.${user?.id},manager_id.eq.${user?.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const atRisk = data?.filter((e) => {
        const budgetHours = e.budget_hours || 0;
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

  // Fetch overdue PBC items from client_pbc_items table
  const { data: pbcStats } = useQuery({
    queryKey: ['overdue-pbc-stats', user?.id, profile?.firm_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_pbc_items')
        .select('id, priority, due_date, status')
        .neq('status', 'received')
        .lt('due_date', new Date().toISOString());

      if (error) {
        console.warn('Could not fetch PBC items:', error.message);
        return { total: 0, critical: 0 };
      }

      const overdue = data || [];
      const critical = overdue.filter((p) => p.priority === 'high').length;

      return {
        total: overdue.length,
        critical,
      };
    },
    enabled: !!user?.id,
  });

  // Fetch review notes from review_notes table
  const { data: reviewNotesStats } = useQuery({
    queryKey: ['review-notes-stats', user?.id, profile?.firm_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_notes')
        .select('id, status, priority')
        .neq('status', 'resolved');

      if (error) {
        console.warn('Could not fetch review notes:', error.message);
        return { total: 0, open: 0 };
      }

      const notes = data || [];
      const open = notes.filter((n) => n.status === 'open').length;

      return {
        total: notes.length,
        open,
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
      href: '/tasks',
    },
    {
      title: 'My Audits',
      count: engagementsStats?.total || 0,
      detail: `${engagementsStats?.atRisk || 0} at risk`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/engagements',
    },
    {
      title: 'Overdue PBC',
      count: pbcStats?.total || 0,
      detail: `${pbcStats?.critical || 0} critical`,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/audit/pbc',
    },
    {
      title: 'Review Notes',
      count: reviewNotesStats?.total || 0,
      detail: `${reviewNotesStats?.open || 0} open`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/audit/review-notes',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
          onClick={() => navigate(stat.href)}
        >
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
              <div className="flex flex-col items-center gap-2">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
