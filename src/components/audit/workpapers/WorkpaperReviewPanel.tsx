import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Send, FileCheck } from 'lucide-react';
import { useState } from 'react';
import { Workpaper } from '@/hooks/useWorkpapers';
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

interface WorkpaperReviewPanelProps {
  workpaper: Workpaper;
  onSubmitForReview: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  canReview: boolean;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In Review', color: 'bg-warning/20 text-warning border-warning' },
  approved: { label: 'Approved', color: 'bg-success/20 text-success border-success' },
  rejected: { label: 'Rejected', color: 'bg-destructive/20 text-destructive border-destructive' },
};

export function WorkpaperReviewPanel({
  workpaper,
  onSubmitForReview,
  onApprove,
  onReject,
  canReview,
}: WorkpaperReviewPanelProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

  const status = statusConfig[workpaper.status as keyof typeof statusConfig];

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Review Status</CardTitle>
            <Badge variant="outline" className={status.color}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Information */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prepared By:</span>
              <span className="font-medium">
                {workpaper.prepared_by ? 'User' : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prepared Date:</span>
              <span className="font-medium">{workpaper.prepared_date}</span>
            </div>
            {workpaper.reviewed_by && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed By:</span>
                  <span className="font-medium">Reviewer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviewed Date:</span>
                  <span className="font-medium">{workpaper.reviewed_date}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-border pt-4">
            {/* Draft Status Actions */}
            {workpaper.status === 'draft' && (
              <Button
                className="w-full"
                onClick={onSubmitForReview}
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </Button>
            )}

            {/* In Review Status - Reviewer Actions */}
            {workpaper.status === 'in_review' && canReview && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={onApprove}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Workpaper
                </Button>
                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject & Return
                </Button>
              </div>
            )}

            {/* In Review Status - Preparer View */}
            {workpaper.status === 'in_review' && !canReview && (
              <div className="text-center p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <FileCheck className="w-8 h-8 text-warning mx-auto mb-2" />
                <p className="text-sm font-medium text-warning">
                  Awaiting Review
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This workpaper has been submitted for review
                </p>
              </div>
            )}

            {/* Approved Status */}
            {workpaper.status === 'approved' && (
              <div className="text-center p-4 bg-success/10 border border-success/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm font-medium text-success">
                  Approved
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This workpaper has been reviewed and approved
                </p>
              </div>
            )}

            {/* Rejected Status */}
            {workpaper.status === 'rejected' && (
              <div className="space-y-3">
                <div className="text-center p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm font-medium text-destructive">
                    Rejected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revisions required
                  </p>
                </div>
                {workpaper.content?.rejection_reason && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Rejection Reason:
                    </p>
                    <p className="text-sm">{workpaper.content.rejection_reason}</p>
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={onSubmitForReview}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Resubmit for Review
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Workpaper</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this workpaper. This will help the preparer understand what needs to be revised.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Describe what needs to be corrected or improved..."
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reject Workpaper
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
