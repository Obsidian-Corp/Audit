/**
 * ProcedureExecutionView Component
 * Ticket: UI-006
 *
 * View for executing a single procedure with workpaper linking,
 * time logging, and submission workflow.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useProcedureExecution,
  ProcedureExecution,
  ProcedureWorkflowStatus,
} from '@/hooks/useProcedureExecution';
import { useWorkpapers } from '@/hooks/useWorkpapers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Play,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Send,
  XCircle,
  Undo2,
  Timer,
  Link2,
  Plus,
  ChevronLeft,
  AlertCircle,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

// Status badge config
const statusConfig: Record<
  ProcedureWorkflowStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }
> = {
  not_started: { label: 'Not Started', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: Play },
  pending_review: { label: 'Pending Review', variant: 'outline', icon: Send },
  in_review: { label: 'In Review', variant: 'outline', icon: Clock },
  changes_requested: { label: 'Changes Requested', variant: 'destructive', icon: Undo2 },
  approved: { label: 'Approved', variant: 'default', icon: CheckCircle },
  signed_off: { label: 'Signed Off', variant: 'default', icon: CheckCircle },
  not_applicable: { label: 'N/A', variant: 'secondary', icon: XCircle },
};

interface ProcedureDetailViewProps {
  procedure: ProcedureExecution;
  engagementId: string;
}

function ProcedureDetailView({ procedure, engagementId }: ProcedureDetailViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [conclusion, setConclusion] = useState(procedure.conclusion || '');
  const [exceptions, setExceptions] = useState(procedure.exceptions_noted || '');
  const [hoursToLog, setHoursToLog] = useState('');
  const [logTimeDialogOpen, setLogTimeDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);

  const {
    startProcedure,
    completeProcedure,
    submitForReview,
    markNotApplicable,
    updateProcedure,
    logTime,
    isStarting,
    isCompleting,
    isSubmitting,
    isLoggingTime,
  } = useProcedureExecution(engagementId);

  const { workpapers } = useWorkpapers(engagementId);

  const isAssignedToMe = procedure.assigned_to === user?.id;
  const status = statusConfig[procedure.workflow_status];
  const StatusIcon = status.icon;

  const handleStart = () => {
    startProcedure({ procedureId: procedure.id });
    setStartConfirmOpen(false);
  };

  const handleSaveWork = () => {
    updateProcedure({
      procedureId: procedure.id,
      updates: {
        conclusion,
        exceptions_noted: exceptions,
      },
    });
  };

  const handleSubmitForReview = () => {
    completeProcedure({
      procedureId: procedure.id,
      conclusion,
      exceptionsNoted: exceptions,
    });
    submitForReview({ procedureId: procedure.id });
    setSubmitDialogOpen(false);
  };

  const handleLogTime = () => {
    const hours = parseFloat(hoursToLog);
    if (isNaN(hours) || hours <= 0) return;

    logTime({ procedureId: procedure.id, hours });
    setHoursToLog('');
    setLogTimeDialogOpen(false);
  };

  const handleMarkNA = () => {
    markNotApplicable(procedure.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/engagements/${engagementId}/procedures`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {procedure.procedure_reference || 'No Ref'}
              </Badge>
              <Badge variant={status.variant}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold mt-1">{procedure.name}</h1>
          </div>
        </div>

        {/* Action buttons based on status */}
        <div className="flex items-center gap-2">
          {procedure.workflow_status === 'not_started' && isAssignedToMe && (
            <>
              <Button variant="outline" onClick={handleMarkNA}>
                Mark N/A
              </Button>
              <Button onClick={() => setStartConfirmOpen(true)} disabled={isStarting}>
                <Play className="h-4 w-4 mr-2" />
                Start Procedure
              </Button>
            </>
          )}

          {['in_progress', 'changes_requested'].includes(procedure.workflow_status) &&
            isAssignedToMe && (
              <>
                <Button variant="outline" onClick={() => setLogTimeDialogOpen(true)}>
                  <Timer className="h-4 w-4 mr-2" />
                  Log Time
                </Button>
                <Button variant="outline" onClick={handleSaveWork}>
                  Save Work
                </Button>
                <Button
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={!conclusion.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              </>
            )}

          {['pending_review', 'in_review'].includes(procedure.workflow_status) && (
            <Badge variant="outline" className="text-sm px-3 py-1.5">
              <Clock className="h-4 w-4 mr-2" />
              Awaiting Review
            </Badge>
          )}

          {procedure.workflow_status === 'approved' && (
            <Badge
              variant="default"
              className="text-sm px-3 py-1.5 bg-green-500"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </Badge>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  {procedure.description ? (
                    <div className="prose prose-sm max-w-none">
                      {procedure.description}
                    </div>
                  ) : procedure.instructions ? (
                    <div className="prose prose-sm max-w-none">
                      {typeof procedure.instructions === 'object'
                        ? JSON.stringify(procedure.instructions, null, 2)
                        : procedure.instructions}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No instructions provided for this procedure.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Rollforward info */}
              {procedure.is_rolled_forward && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Undo2 className="h-5 w-5" />
                      Rolled Forward
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      This procedure was rolled forward from the prior year engagement.
                    </p>
                    {procedure.rollforward_notes && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm">{procedure.rollforward_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="work" className="space-y-4">
              {/* Conclusion */}
              <Card>
                <CardHeader>
                  <CardTitle>Conclusion</CardTitle>
                  <CardDescription>
                    Document your conclusion based on the work performed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter your conclusion..."
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    className="min-h-[150px]"
                    disabled={
                      !['in_progress', 'changes_requested'].includes(procedure.workflow_status) ||
                      !isAssignedToMe
                    }
                  />
                </CardContent>
              </Card>

              {/* Exceptions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Exceptions Noted
                  </CardTitle>
                  <CardDescription>
                    Document any exceptions or issues found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Enter any exceptions noted, or leave blank if none..."
                    value={exceptions}
                    onChange={(e) => setExceptions(e.target.value)}
                    className="min-h-[100px]"
                    disabled={
                      !['in_progress', 'changes_requested'].includes(procedure.workflow_status) ||
                      !isAssignedToMe
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Evidence Collected
                  </CardTitle>
                  <CardDescription>
                    Attach supporting documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {procedure.evidence_collected && procedure.evidence_collected.length > 0 ? (
                    <div className="space-y-2">
                      {procedure.evidence_collected.map((evidence, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 rounded border"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{evidence}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>No evidence attached yet</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Attach Evidence
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Meta info */}
        <div className="space-y-6">
          {/* Assignment info */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assigned to */}
              <div>
                <Label className="text-xs text-muted-foreground">Assigned To</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={procedure.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {procedure.profiles?.full_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {procedure.profiles?.full_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Due date */}
              {procedure.due_date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(procedure.due_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}

              {/* Priority */}
              <div>
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Badge
                  variant={
                    procedure.priority === 'critical'
                      ? 'destructive'
                      : procedure.priority === 'high'
                      ? 'default'
                      : 'secondary'
                  }
                  className="mt-1 capitalize"
                >
                  {procedure.priority || 'Normal'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Time tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated</span>
                <span className="text-sm font-medium">
                  {procedure.estimated_hours || 0} hours
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actual</span>
                <span className="text-sm font-medium">
                  {procedure.actual_hours || 0} hours
                </span>
              </div>
              {procedure.estimated_hours && procedure.actual_hours && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Variance</span>
                  <Badge
                    variant={
                      procedure.actual_hours > procedure.estimated_hours
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {procedure.actual_hours > procedure.estimated_hours ? '+' : ''}
                    {(procedure.actual_hours - procedure.estimated_hours).toFixed(1)}h
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked workpaper */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Linked Workpaper
              </CardTitle>
            </CardHeader>
            <CardContent>
              {procedure.primary_workpaper ? (
                <div
                  className="p-3 rounded-lg border cursor-pointer hover:bg-muted"
                  onClick={() =>
                    navigate(
                      `/engagements/${engagementId}/workpapers/${procedure.primary_workpaper_id}`
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {procedure.primary_workpaper.title}
                    </span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {procedure.primary_workpaper.review_status}
                  </Badge>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No workpaper linked</p>
                  {isAssignedToMe &&
                    ['in_progress', 'changes_requested'].includes(
                      procedure.workflow_status
                    ) && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Link Workpaper
                      </Button>
                    )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {procedure.started_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{format(new Date(procedure.started_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
              {procedure.completed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span>{format(new Date(procedure.completed_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
              {procedure.prepared_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{format(new Date(procedure.prepared_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
              {procedure.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span>{format(new Date(procedure.reviewed_at), 'MMM d, h:mm a')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {/* Start confirmation */}
      <AlertDialog open={startConfirmOpen} onOpenChange={setStartConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Procedure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the procedure as "In Progress" and record the start
              time. You can then document your work and submit for review when
              complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart} disabled={isStarting}>
              {isStarting ? 'Starting...' : 'Start Procedure'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log time dialog */}
      <Dialog open={logTimeDialogOpen} onOpenChange={setLogTimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>
              Record time spent on this procedure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hours</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                placeholder="0.00"
                value={hoursToLog}
                onChange={(e) => setHoursToLog(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Current total: {procedure.actual_hours || 0} hours
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogTimeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogTime} disabled={isLoggingTime || !hoursToLog}>
              {isLoggingTime ? 'Logging...' : 'Log Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit for review dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit your work for review. Make sure you have:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Documented your conclusion</li>
                <li>Attached all relevant evidence</li>
                <li>Noted any exceptions found</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForReview} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProcedureExecutionViewProps {
  procedureId?: string;
  engagementId: string;
}

export function ProcedureExecutionView({
  procedureId,
  engagementId,
}: ProcedureExecutionViewProps) {
  const { procedures, isLoading, error } = useProcedureExecution(engagementId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-semibold">Failed to load procedure</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const procedure = procedures.find((p) => p.id === procedureId);

  if (!procedure) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Procedure not found</h2>
        <p className="text-muted-foreground">
          The procedure you're looking for doesn't exist or you don't have access.
        </p>
      </div>
    );
  }

  return <ProcedureDetailView procedure={procedure} engagementId={engagementId} />;
}

export default ProcedureExecutionView;
