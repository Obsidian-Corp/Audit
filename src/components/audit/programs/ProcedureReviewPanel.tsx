import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { CheckCircle2, XCircle, AlertCircle, FileText, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProcedureReviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procedure: any;
}

export function ProcedureReviewPanel({ open, onOpenChange, procedure }: ProcedureReviewPanelProps) {
  const navigate = useNavigate();
  const { updateProcedure } = useEngagementProcedures();
  const [reviewComments, setReviewComments] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [qualityChecks, setQualityChecks] = useState({
    evidenceAdequate: false,
    procedureComplete: false,
    documentationClear: false,
    conclusionsSupported: false,
    exceptionsDocumented: false
  });

  const handleApprove = async () => {
    const allChecked = Object.values(qualityChecks).every(v => v);
    
    if (!allChecked) {
      toast.error('Please complete all quality control checks before approving');
      return;
    }

    try {
      updateProcedure({
        id: procedure.id,
        status: 'completed',
        reviewed_at: new Date().toISOString(),
        review_notes: reviewComments || null
      });

      toast.success('Procedure approved successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to approve procedure');
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please provide revision notes');
      return;
    }

    try {
      updateProcedure({
        id: procedure.id,
        status: 'revision_requested',
        reviewed_at: new Date().toISOString(),
        review_notes: revisionNotes
      });

      toast.success('Revision requested');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to request revision');
    }
  };

  const handleReject = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      updateProcedure({
        id: procedure.id,
        status: 'not_started',
        reviewed_at: new Date().toISOString(),
        review_notes: revisionNotes,
        started_at: null,
        completed_at: null
      });

      toast.success('Procedure rejected');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to reject procedure');
    }
  };

  const handleViewWorkpaper = () => {
    if (procedure.workpaper_id) {
      navigate(`/audit/workpapers/${procedure.workpaper_id}`);
    }
  };

  const getRiskBadgeColor = (risk: string | undefined) => {
    if (!risk) return 'outline';
    switch (risk.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Review Procedure</SheetTitle>
          <SheetDescription>
            Review the completed procedure and provide feedback
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Procedure Info */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{procedure.procedure_name}</h3>
              <p className="text-sm text-muted-foreground">
                {procedure.engagement_programs?.engagement_code}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{procedure.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Completed by</div>
                  <div className="font-medium">{procedure.profiles?.full_name || 'Unknown'}</div>
                </div>
              </div>
              {procedure.completed_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Submitted</div>
                    <div className="font-medium">
                      {format(new Date(procedure.completed_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Time Tracking */}
          {procedure.started_at && procedure.completed_at && (
            <div>
              <h4 className="font-semibold mb-2">Time Tracking</h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span className="font-medium">{procedure.estimated_hours || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual:</span>
                  <span className="font-medium">
                    {((new Date(procedure.completed_at).getTime() - new Date(procedure.started_at).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Linked Workpaper */}
          {procedure.workpaper_id && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Workpaper documentation available</span>
                <Button variant="link" size="sm" onClick={handleViewWorkpaper}>
                  View Workpaper
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Quality Control Checklist */}
          <div className="space-y-4">
            <h4 className="font-semibold">Quality Control Checklist</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="evidenceAdequate"
                  checked={qualityChecks.evidenceAdequate}
                  onCheckedChange={(checked) =>
                    setQualityChecks({ ...qualityChecks, evidenceAdequate: checked as boolean })
                  }
                />
                <Label htmlFor="evidenceAdequate" className="cursor-pointer font-normal">
                  Evidence collected is adequate and appropriate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="procedureComplete"
                  checked={qualityChecks.procedureComplete}
                  onCheckedChange={(checked) =>
                    setQualityChecks({ ...qualityChecks, procedureComplete: checked as boolean })
                  }
                />
                <Label htmlFor="procedureComplete" className="cursor-pointer font-normal">
                  All procedure steps have been completed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="documentationClear"
                  checked={qualityChecks.documentationClear}
                  onCheckedChange={(checked) =>
                    setQualityChecks({ ...qualityChecks, documentationClear: checked as boolean })
                  }
                />
                <Label htmlFor="documentationClear" className="cursor-pointer font-normal">
                  Documentation is clear and well-organized
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="conclusionsSupported"
                  checked={qualityChecks.conclusionsSupported}
                  onCheckedChange={(checked) =>
                    setQualityChecks({ ...qualityChecks, conclusionsSupported: checked as boolean })
                  }
                />
                <Label htmlFor="conclusionsSupported" className="cursor-pointer font-normal">
                  Conclusions are supported by evidence
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exceptionsDocumented"
                  checked={qualityChecks.exceptionsDocumented}
                  onCheckedChange={(checked) =>
                    setQualityChecks({ ...qualityChecks, exceptionsDocumented: checked as boolean })
                  }
                />
                <Label htmlFor="exceptionsDocumented" className="cursor-pointer font-normal">
                  Exceptions or issues are properly documented
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Review Comments */}
          <div className="space-y-2">
            <Label htmlFor="reviewComments">Review Comments (Optional)</Label>
            <Textarea
              id="reviewComments"
              placeholder="Add any comments or feedback for the team member..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows={3}
            />
          </div>

          {/* Revision/Rejection Notes */}
          <div className="space-y-2">
            <Label htmlFor="revisionNotes">
              Revision/Rejection Notes
              <span className="text-muted-foreground text-sm ml-1">(Required for revision or rejection)</span>
            </Label>
            <Textarea
              id="revisionNotes"
              placeholder="Specify what needs to be corrected or why this is being rejected..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleApprove}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve & Complete
            </Button>
            <Button
              onClick={handleRequestRevision}
              variant="outline"
              className="w-full"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Request Revision
            </Button>
            <Button
              onClick={handleReject}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
