import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock, DollarSign, Calendar, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ApprovalDashboard() {
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("audits")
        .select(`
          *,
          clients(id, client_name),
          created_by_profile:profiles!audits_created_by_fkey(id, full_name, email),
          requester:profiles!audits_approval_requested_by_fkey(id, full_name, email)
        `)
        .eq("workflow_status", "pending_approval")
        .order("approval_requested_at", { ascending: true });

      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error: any) {
      console.error("Error fetching pending approvals:", error);
      toast({
        title: "Error loading approvals",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleReview = (engagement: any, isApproved: boolean) => {
    setSelectedEngagement(engagement);
    setDecision(isApproved ? "approved" : "rejected");
    setComments("");
    setReviewDialog(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedEngagement || !comments.trim()) {
      toast({
        title: "Comments required",
        description: "Please provide comments for your decision.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const existingComments = selectedEngagement.approval_comments || [];
      const newComment = {
        type: decision,
        user_id: user.id,
        comment: comments,
        timestamp: new Date().toISOString(),
      };

      const updates: any = {
        workflow_status: decision === "approved" ? "approved" : "draft",
        approval_comments: [...existingComments, newComment],
      };

      if (decision === "approved") {
        updates.approved_by = user.id;
        updates.approved_at = new Date().toISOString();
      } else {
        updates.rejection_reason = comments;
        updates.approval_requested_at = null;
        updates.approval_requested_by = null;
      }

      const { error: updateError } = await supabase
        .from("audits")
        .update(updates)
        .eq("id", selectedEngagement.id);

      if (updateError) throw updateError;

      // Create notification for requester
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: selectedEngagement.approval_requested_by,
          type: decision === "approved" ? "approval_granted" : "approval_denied",
          title: `Engagement ${decision === "approved" ? "Approved" : "Rejected"}`,
          message: `${selectedEngagement.audit_title} has been ${decision}`,
          metadata: {
            engagement_id: selectedEngagement.id,
            engagement_title: selectedEngagement.audit_title,
            approver_id: user.id,
            comments: comments,
          },
        });

      if (notifError) console.error("Error creating notification:", notifError);

      toast({
        title: `Engagement ${decision}`,
        description: `Successfully ${decision} the engagement.`,
      });

      setReviewDialog(false);
      fetchPendingApprovals();
    } catch (error: any) {
      console.error("Error submitting decision:", error);
      toast({
        title: "Error submitting decision",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Engagement Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve pending engagement requests
          </p>
        </div>

        {pendingApprovals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm text-muted-foreground">All engagements are up to date</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingApprovals.map((engagement) => (
              <Card key={engagement.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{engagement.audit_title}</CardTitle>
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Approval
                        </Badge>
                      </div>
                      <CardDescription>
                        {engagement.clients?.client_name} • {engagement.audit_number}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/engagements/${engagement.id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(engagement, false)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReview(engagement, true)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-medium">${engagement.budget_allocated?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Hours</p>
                        <p className="font-medium">{engagement.hours_allocated || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">
                          {engagement.planned_start_date 
                            ? format(new Date(engagement.planned_start_date), "MMM d, yyyy")
                            : "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Requested By</p>
                        <p className="font-medium">{engagement.requester?.full_name || "Unknown"}</p>
                      </div>
                    </div>
                  </div>

                  {engagement.approval_comments && engagement.approval_comments.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Request Justification:</p>
                      <p className="text-sm text-muted-foreground">
                        {engagement.approval_comments[engagement.approval_comments.length - 1].comment}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Requested {format(new Date(engagement.approval_requested_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {decision === "approved" ? "Approve" : "Reject"} Engagement
            </DialogTitle>
            <DialogDescription>
              {selectedEngagement?.audit_title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decision-comments">
                {decision === "approved" ? "Approval" : "Rejection"} Comments *
              </Label>
              <Textarea
                id="decision-comments"
                placeholder={`Provide ${decision === "approved" ? "approval notes" : "reason for rejection"}...`}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDecision}
              disabled={submitting || !comments.trim()}
              variant={decision === "approved" ? "default" : "destructive"}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decision === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
