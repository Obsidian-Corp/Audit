import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { useToast } from '@/hooks/use-toast';
import {
  Clock,
  Play,
  Pause,
  StopCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  Timer,
  AlertTriangle
} from 'lucide-react';

interface ProcedureExecutionPanelProps {
  procedure: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProcedureExecutionPanel({
  procedure,
  open,
  onOpenChange,
}: ProcedureExecutionPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startProcedure, completeProcedure, updateProcedure } = useEngagementProcedures();
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Form state
  const [exceptionNotes, setExceptionNotes] = useState('');
  const [findings, setFindings] = useState('');
  const [evidenceChecklist, setEvidenceChecklist] = useState<{ id: string; text: string; completed: boolean }[]>([]);

  // Initialize evidence checklist from procedure
  useEffect(() => {
    if (procedure?.evidence_requirements) {
      const requirements = Array.isArray(procedure.evidence_requirements)
        ? procedure.evidence_requirements
        : [];
      setEvidenceChecklist(
        requirements.map((req: string, idx: number) => ({
          id: `evidence-${idx}`,
          text: req,
          completed: false,
        }))
      );
    }
  }, [procedure]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (procedure.status === 'not_started') {
      startProcedure(procedure.id);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const handleSubmitForReview = () => {
    if (!findings.trim()) {
      toast({
        title: 'Findings Required',
        description: 'Please document your findings before submitting for review.',
        variant: 'destructive',
      });
      return;
    }

    const allEvidenceCollected = evidenceChecklist.every(item => item.completed);
    if (!allEvidenceCollected) {
      toast({
        title: 'Evidence Incomplete',
        description: 'Please complete all evidence items before submitting.',
        variant: 'destructive',
      });
      return;
    }

    completeProcedure(procedure.id);
    onOpenChange(false);
  };

  const handleCreateWorkpaper = () => {
    navigate(`/audit/workpapers/new?procedureId=${procedure.id}&auditId=${procedure.engagement_programs?.audit_id}`);
    onOpenChange(false);
  };

  const handleCreateFinding = () => {
    // Navigate to findings page with procedure context
    const params = new URLSearchParams({
      procedureId: procedure.id,
      procedureName: procedure.procedure_name || '',
      auditId: procedure.engagement_programs?.audit_id || '',
    });
    navigate(`/findings?create=true&${params.toString()}`);
    onOpenChange(false);
  };

  const toggleEvidence = (id: string) => {
    setEvidenceChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const renderInstructions = () => {
    if (!procedure?.instructions) return null;

    if (typeof procedure.instructions === 'string') {
      return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{procedure.instructions}</p>;
    }

    if (procedure.instructions.type === 'doc' && procedure.instructions.content) {
      return (
        <div className="space-y-2">
          {procedure.instructions.content.map((node: any, idx: number) => {
            if (node.type === 'paragraph') {
              return (
                <p key={idx} className="text-sm text-muted-foreground">
                  {node.content?.map((c: any) => c.text).join('') || ''}
                </p>
              );
            }
            if (node.type === 'bulletList') {
              return (
                <ul key={idx} className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {node.content?.map((item: any, itemIdx: number) => (
                    <li key={itemIdx}>
                      {item.content?.[0]?.content?.[0]?.text || ''}
                    </li>
                  ))}
                </ul>
              );
            }
            return null;
          })}
        </div>
      );
    }

    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-slate-500';
      case 'in_progress': return 'bg-blue-500';
      case 'in_review': return 'bg-amber-500';
      case 'complete': return 'bg-emerald-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{procedure?.procedure_name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {procedure?.engagement_programs?.program_name}
              </p>
            </div>
            <Badge className={getStatusColor(procedure?.status || 'not_started')}>
              {procedure?.status?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Timer Section */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                <span className="font-mono text-2xl font-bold">{formatTime(elapsedSeconds)}</span>
              </div>
              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} size="sm" variant="default">
                    <Play className="h-4 w-4 mr-1" />
                    {procedure?.status === 'not_started' ? 'Start Procedure' : 'Resume'}
                  </Button>
                ) : (
                  <Button onClick={handlePause} size="sm" variant="secondary">
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )}
                {elapsedSeconds > 0 && (
                  <Button onClick={handleStop} size="sm" variant="outline">
                    <StopCircle className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Estimated: {procedure?.estimated_hours || 0} hours
            </p>
          </div>

          <Separator />

          {/* Instructions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Procedure Instructions
            </h3>
            {procedure?.objective && (
              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md mb-3">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Objective: {procedure.objective}
                </p>
              </div>
            )}
            <div className="space-y-2">
              {renderInstructions()}
            </div>
          </div>

          <Separator />

          {/* Evidence Checklist */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Evidence Collection Checklist
            </h3>
            {evidenceChecklist.length > 0 ? (
              <div className="space-y-2">
                {evidenceChecklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => toggleEvidence(item.id)}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer flex-1 ${
                        item.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.text}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No evidence requirements specified</p>
            )}
          </div>

          <Separator />

          {/* Exception Notes */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Exception Notes (Optional)
            </h3>
            <Textarea
              placeholder="Document any exceptions, deviations, or unusual observations..."
              value={exceptionNotes}
              onChange={(e) => setExceptionNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Findings */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Findings / Conclusion <span className="text-destructive">*</span>
            </h3>
            <Textarea
              placeholder="Document your findings, conclusions, and test results..."
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateWorkpaper}
                variant="outline"
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Workpaper
              </Button>
              <Button
                onClick={handleCreateFinding}
                variant="outline"
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Create Finding
              </Button>
            </div>
            <Button
              onClick={handleSubmitForReview}
              className="w-full"
              disabled={procedure?.status === 'in_review' || procedure?.status === 'complete'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
