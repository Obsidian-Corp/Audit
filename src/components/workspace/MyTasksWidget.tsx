/**
 * ==================================================================
 * MY TASKS WIDGET
 * ==================================================================
 * Shows pending tasks sorted by priority and due date
 * Per System Design Document Section 9.2
 * ==================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function MyTasksWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch my tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(
          `
          id,
          title,
          description,
          priority,
          due_date,
          status,
          project_id
        `
        )
        .or(`assigned_to.eq.${user?.id},created_by.eq.${user?.id}`)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })
        .limit(12);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Complete task mutation
  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks-stats', user?.id] });
      toast({
        title: 'Task completed',
        description: 'The task has been marked as complete.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete task.',
        variant: 'destructive',
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDueLabel = (dueDate: string | null) => {
    const days = getDaysUntilDue(dueDate);
    if (days === null) return 'No due date';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    if (days <= 7) return `Due in ${days} days`;
    return new Date(dueDate).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
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
            <CardTitle>My Tasks - Next 7 Days</CardTitle>
            <CardDescription>
              Sorted by priority and due date • Showing {tasks?.length || 0} pending tasks
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No pending tasks</p>
            <p className="text-sm text-muted-foreground mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const daysUntilDue = getDaysUntilDue(task.due_date);
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
              const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2;

              return (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => completeTask.mutate(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`} />
                            <Badge variant={getPriorityVariant(task.priority)} className="uppercase text-xs">
                              {task.priority}
                            </Badge>
                            <span className="font-medium">{task.title}</span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : isDueSoon ? 'text-orange-600 font-medium' : ''}>
                            {getDueLabel(task.due_date)}
                          </span>
                        </div>
                        {task.project_id && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span>Project task</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
