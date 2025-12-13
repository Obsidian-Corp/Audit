import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, Filter, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  type: 'finding' | 'workpaper' | 'program' | 'report';
  audit_title: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  assigned_to?: string;
}

export function TaskInbox() {
  const { currentOrg } = useOrganization();
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['audit-tasks', currentOrg?.id, filter],
    queryFn: async () => {
      if (!currentOrg) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const allTasks: Task[] = [];

      // Get findings assigned to user
      const { data: findings } = await supabase
        .from('audit_findings')
        .select('id, finding_title, target_completion_date, severity, status, audit_id')
        .eq('firm_id', currentOrg.id)
        .eq('responsible_party', user.id)
        .in('status', ['open', 'in_progress'])
        .order('target_completion_date', { ascending: true });

      if (findings) {
        for (const finding of findings) {
          const { data: audit } = await supabase
            .from('audits')
            .select('audit_title')
            .eq('id', finding.audit_id)
            .single();

          allTasks.push({
            id: finding.id,
            title: finding.finding_title,
            type: 'finding',
            audit_title: audit?.audit_title || 'Unknown Audit',
            due_date: finding.target_completion_date,
            priority: finding.severity as any,
            status: finding.status,
          });
        }
      }

      // Get workpapers assigned to user
      const { data: workpapers } = await supabase
        .from('audit_workpapers')
        .select('id, title, status, audit_id')
        .eq('firm_id', currentOrg.id)
        .or(`prepared_by.eq.${user.id},reviewed_by.eq.${user.id}`)
        .in('status', ['draft', 'review'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (workpapers) {
        for (const wp of workpapers) {
          const { data: audit } = await supabase
            .from('audits')
            .select('audit_title')
            .eq('id', wp.audit_id)
            .single();

          allTasks.push({
            id: wp.id,
            title: wp.title,
            type: 'workpaper',
            audit_title: audit?.audit_title || 'Unknown Audit',
            due_date: null,
            priority: 'medium',
            status: wp.status,
          });
        }
      }

      // Get audit programs assigned to user
      const { data: programs } = await supabase
        .from('audit_programs')
        .select('id, program_name, due_date, status, audit_id')
        .eq('firm_id', currentOrg.id)
        .eq('assigned_to', user.id)
        .in('status', ['not_started', 'in_progress'])
        .order('due_date', { ascending: true });

      if (programs) {
        for (const program of programs) {
          const { data: audit } = await supabase
            .from('audits')
            .select('audit_title')
            .eq('id', program.audit_id)
            .single();

          allTasks.push({
            id: program.id,
            title: program.program_name,
            type: 'program',
            audit_title: audit?.audit_title || 'Unknown Audit',
            due_date: program.due_date,
            priority: 'medium',
            status: program.status,
          });
        }
      }

      // Apply filter
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      return allTasks.filter(task => {
        if (filter === 'all') return true;
        if (!task.due_date) return false;
        
        const dueDate = new Date(task.due_date);
        if (filter === 'overdue') return dueDate < today;
        if (filter === 'today') return dueDate.toDateString() === today.toDateString();
        if (filter === 'week') return dueDate >= today && dueDate <= weekFromNow;
        return true;
      });
    },
    enabled: !!currentOrg
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'finding': return <AlertCircle className="h-4 w-4" />;
      case 'workpaper': return <CheckCircle2 className="h-4 w-4" />;
      case 'program': return <Clock className="h-4 w-4" />;
      default: return <Inbox className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            Task Inbox
            {tasks && <Badge variant="secondary">{tasks.length}</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('today')}
            >
              Today
            </Button>
            <Button
              variant={filter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('week')}
            >
              This Week
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">{getTypeIcon(task.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{task.audit_title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Badge variant={getPriorityColor(task.priority)} className="capitalize">
                    {task.priority}
                  </Badge>
                  {task.due_date && (
                    <div className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(task.due_date), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tasks found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
