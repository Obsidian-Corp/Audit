import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { KanbanSquare, List, Calendar as CalendarIcon, Plus, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  task_name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  estimated_hours: number;
  actual_hours: number;
  assigned_to: {
    id: string;
    full_name: string;
  };
  audits: {
    audit_number: string;
    audit_title: string;
  };
}

const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_review', label: 'In Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
];

export default function TaskBoard() {
  const { currentOrg } = useOrganization();
  const [engagementFilter, setEngagementFilter] = useState('all');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', currentOrg?.id, engagementFilter],
    queryFn: async () => {
      if (!currentOrg) return [];

      let query = supabase
        .from('engagement_tasks')
        .select(`
          id,
          task_name,
          description,
          status,
          priority,
          due_date,
          estimated_hours,
          actual_hours,
          assigned_to:profiles!engagement_tasks_assigned_to_fkey(id, full_name),
          audits!inner(audit_number, audit_title, firm_id)
        `)
        .eq('audits.firm_id', currentOrg.id)
        .order('due_date', { ascending: true });

      if (engagementFilter !== 'all') {
        query = query.eq('audit_id', engagementFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!currentOrg,
  });

  const { data: engagements } = useQuery({
    queryKey: ['engagements-filter', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('audits')
        .select('id, audit_number, audit_title')
        .eq('firm_id', currentOrg.id)
        .in('status', ['in_preparation', 'fieldwork', 'reporting'])
        .order('audit_number');
      return data || [];
    },
    enabled: !!currentOrg,
  });

  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Task Board</h1>
          <p className="text-muted-foreground">
            Track and manage audit tasks across engagements
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={engagementFilter} onValueChange={setEngagementFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="All Engagements" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engagements</SelectItem>
              {engagements?.map((eng) => (
                <SelectItem key={eng.id} value={eng.id}>
                  {eng.audit_number} - {eng.audit_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Card key={status.value}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{status.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTasksByStatus(status.value).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'list')}>
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanSquare className="h-4 w-4 mr-2" />
            Kanban View
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        {/* Kanban View */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {TASK_STATUSES.map((status) => (
              <div key={status.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{status.label}</h3>
                  <Badge variant="secondary">{getTasksByStatus(status.value).length}</Badge>
                </div>
                <div className="space-y-2 min-h-[500px] p-2 bg-muted/30 rounded-lg">
                  {getTasksByStatus(status.value).map((task) => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{task.task_name}</p>
                            {task.priority && (
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {task.audits?.audit_number}
                          </p>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {task.assigned_to?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">
                              {task.assigned_to?.full_name}
                            </span>
                          </div>
                        </div>

                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-xs ${
                            isOverdue(task.due_date) ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {isOverdue(task.due_date) ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <CalendarIcon className="h-3 w-3" />
                            )}
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}

                        {(task.estimated_hours || task.actual_hours) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {task.actual_hours || 0}h / {task.estimated_hours || 0}h
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {getTasksByStatus(status.value).length === 0 && (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>{tasks?.length || 0} tasks found</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{task.task_name}</p>
                            {task.priority && (
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {task.audits?.audit_number} - {task.audits?.audit_title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {task.assigned_to?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assigned_to?.full_name}</span>
                        </div>
                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-sm ${
                            isOverdue(task.due_date) ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {isOverdue(task.due_date) ? (
                              <AlertCircle className="h-4 w-4" />
                            ) : (
                              <CalendarIcon className="h-4 w-4" />
                            )}
                            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        <Badge className={TASK_STATUSES.find(s => s.value === task.status)?.color}>
                          {TASK_STATUSES.find(s => s.value === task.status)?.label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <KanbanSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No tasks found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
