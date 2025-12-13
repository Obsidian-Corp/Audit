import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ApprovalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  engagementTitle: string;
  onSuccess: () => void;
}

export function ApprovalRequestDialog({
  open,
  onOpenChange,
  engagementId,
  engagementTitle,
  onSuccess,
}: ApprovalRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [approverId, setApproverId] = useState("");
  const [justification, setJustification] = useState("");
  const [approvers, setApprovers] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch potential approvers (partners and managers)
  useState(() => {
    const fetchApprovers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .or("role.eq.partner,role.eq.manager")
        .order("full_name");
      
      if (data) setApprovers(data);
    };
    if (open) fetchApprovers();
  });

  const handleSubmit = async () => {
    if (!approverId || !justification.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please select an approver and provide justification.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update engagement with approval request
      const { error: updateError } = await supabase
        .from("audits")
        .update({
          workflow_status: "pending_approval",
          approval_requested_at: new Date().toISOString(),
          approval_requested_by: user.id,
          approval_comments: [
            {
              type: "request",
              user_id: user.id,
              approver_id: approverId,
              comment: justification,
              timestamp: new Date().toISOString(),
            },
          ],
        })
        .eq("id", engagementId);

      if (updateError) throw updateError;

      // Create notification for approver
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: approverId,
          type: "approval_request",
          title: "Engagement Approval Required",
          message: `${engagementTitle} requires your approval`,
          metadata: {
            engagement_id: engagementId,
            engagement_title: engagementTitle,
            requested_by: user.id,
          },
        });

      if (notifError) console.error("Error creating notification:", notifError);

      toast({
        title: "Approval requested",
        description: "The engagement has been submitted for approval.",
      });

      onSuccess();
      onOpenChange(false);
      setJustification("");
      setApproverId("");
    } catch (error: any) {
      console.error("Error requesting approval:", error);
      toast({
        title: "Error requesting approval",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Engagement Approval</DialogTitle>
          <DialogDescription>
            Submit {engagementTitle} for partner/manager approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="approver">Select Approver *</Label>
            <Select value={approverId} onValueChange={setApproverId}>
              <SelectTrigger id="approver">
                <SelectValue placeholder="Choose approver" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    {approver.full_name} ({approver.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification *</Label>
            <Textarea
              id="justification"
              placeholder="Explain why this engagement should be approved..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters required
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !approverId || justification.length < 20}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
