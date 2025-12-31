import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcedureExecutionPanel } from '@/components/audit/programs';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  ExternalLink,
  FileText,
  ClipboardList
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MyProcedures() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { procedures, startProcedure, completeProcedure, isLoading } = useEngagementProcedures(
    undefined,
    profile?.id
  );
  const [selectedTab, setSelectedTab] = useState('all');
  const [executionPanelOpen, setExecutionPanelOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);

  const proceduresByStatus = {
    all: procedures || [],
    not_started: procedures?.filter(p => p.status === 'not_started') || [],
    in_progress: procedures?.filter(p => p.status === 'in_progress') || [],
    in_review: procedures?.filter(p => p.status === 'in_review') || [],
    complete: procedures?.filter(p => p.status === 'complete') || [],
  };

  const proceduresByEngagement = procedures?.reduce((acc: any, proc) => {
    const engId = proc.engagement_id;
    if (!acc[engId]) {
      acc[engId] = {
        engagement: proc.engagement_programs?.[0] || { program_name: 'Unknown' },
        procedures: [],
      };
    }
    acc[engId].procedures.push(proc);
    return acc;
  }, {}) || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'in_review':
        return 'outline';
      case 'complete':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'in_review':
        return <AlertCircle className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Procedures</h1>
        <p className="text-muted-foreground">
          View and manage procedures assigned to you
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{procedures?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proceduresByStatus.not_started.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proceduresByStatus.in_progress.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proceduresByStatus.complete.length}</p>
            {procedures && procedures.length > 0 && (
              <Progress 
                value={(proceduresByStatus.complete.length / procedures.length) * 100} 
                className="mt-2"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All ({proceduresByStatus.all.length})</TabsTrigger>
          <TabsTrigger value="not_started">Not Started ({proceduresByStatus.not_started.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({proceduresByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="in_review">In Review ({proceduresByStatus.in_review.length})</TabsTrigger>
          <TabsTrigger value="complete">Complete ({proceduresByStatus.complete.length})</TabsTrigger>
        </TabsList>

        {Object.entries(proceduresByStatus).map(([status, procs]) => (
          <TabsContent key={status} value={status} className="space-y-6">
            {/* Empty state when no procedures at all */}
            {procedures?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-lg font-medium mb-2">No Procedures Assigned</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any procedures assigned to you yet.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/engagements')}>
                    Browse Engagements
                  </Button>
                </CardContent>
              </Card>
            )}
            {Object.entries(proceduresByEngagement).map(([engId, data]: [string, any]) => {
              const filteredProcs = status === 'all'
                ? data.procedures
                : data.procedures.filter((p: any) => p.status === status);

              if (filteredProcs.length === 0) return null;

              return (
                <div key={engId} className="space-y-3">
                  <h3 className="text-lg font-semibold">
                    {data.engagement.program_name}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredProcs.map((proc: any) => (
                      <Card key={proc.id} className="hover:border-primary transition-colors">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-1">
                              <CardTitle className="text-base">{proc.procedure_name}</CardTitle>
                              <CardDescription>{proc.objective}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(proc.priority)}>
                                {proc.priority}
                              </Badge>
                              <Badge variant={getStatusColor(proc.status)} className="gap-1">
                                {getStatusIcon(proc.status)}
                                {proc.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{proc.estimated_hours}h estimated</span>
                              </div>
                              {proc.due_date && (
                                <div className={cn(
                                  "flex items-center gap-1",
                                  isOverdue(proc.due_date) && proc.status !== 'complete' && "text-destructive"
                                )}>
                                  <CalendarIcon className="h-4 w-4" />
                                  <span>
                                    Due {format(new Date(proc.due_date), 'MMM d, yyyy')}
                                    {isOverdue(proc.due_date) && proc.status !== 'complete' && ' (Overdue)'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {(proc.status === 'not_started' || proc.status === 'in_progress') && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProcedure(proc);
                                    setExecutionPanelOpen(true);
                                  }}
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  {proc.status === 'not_started' ? 'Start' : 'Continue'}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/engagements/${proc.engagement_id}`)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {selectedProcedure && (
        <ProcedureExecutionPanel
          procedure={selectedProcedure}
          open={executionPanelOpen}
          onOpenChange={setExecutionPanelOpen}
        />
      )}
    </div>
  );
}
