import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, Users, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EngagementOverviewTab } from "@/components/engagement/tabs/EngagementOverviewTab";
import { EngagementScopeTab } from "@/components/engagement/tabs/EngagementScopeTab";
import { EngagementTeamTab } from "@/components/engagement/tabs/EngagementTeamTab";
import { EngagementMilestonesTab } from "@/components/engagement/tabs/EngagementMilestonesTab";
import { EngagementBudgetTab } from "@/components/engagement/tabs/EngagementBudgetTab";
import { EngagementScheduleTab } from "@/components/engagement/tabs/EngagementScheduleTab";
import { EngagementChangeOrdersTab } from "@/components/engagement/tabs/EngagementChangeOrdersTab";
import { EngagementCommunicationsTab } from "@/components/engagement/tabs/EngagementCommunicationsTab";
import { EngagementDeliverablesTab } from "@/components/engagement/tabs/EngagementDeliverablesTab";
import { EngagementDocumentsTab } from "@/components/engagement/tabs/EngagementDocumentsTab";
import { EngagementCalendar } from "@/components/engagement/calendar/EngagementCalendar";
import { EngagementLetterGenerator } from "@/components/engagement/letters/EngagementLetterGenerator";
import { ApprovalRequestDialog } from "@/components/engagement/ApprovalRequestDialog";
import { EngagementProgramTab } from "@/components/engagement/tabs/EngagementProgramTab";
import { EngagementWorkpapersTab } from "@/components/engagement/tabs/EngagementWorkpapersTab";
import { EngagementRiskAssessmentTab } from "@/components/engagement/tabs/EngagementRiskAssessmentTab";
import { EngagementEvidenceTab } from "@/components/engagement/tabs/EngagementEvidenceTab";
import { EngagementInformationRequestsTab } from "@/components/engagement/tabs/EngagementInformationRequestsTab";
import { EngagementTasksTab } from "@/components/engagement/tabs/EngagementTasksTab";
import { EngagementFindingsTab } from "@/components/engagement/tabs/EngagementFindingsTab";

export default function EngagementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [letterGeneratorOpen, setLetterGeneratorOpen] = useState(false);

  const fetchEngagement = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audits")
        .select(`
          *,
          clients(id, client_name),
          profiles:created_by(full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEngagement(data);
    } catch (error: any) {
      console.error("Error fetching engagement:", error);
      toast({
        title: "Error loading engagement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEngagement();
    }
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!engagement) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Engagement not found</p>
          <Button onClick={() => navigate("/engagements")}>Back to Engagements</Button>
        </div>
      </AppLayout>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-secondary text-secondary-foreground",
      pending_approval: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      fieldwork: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      reporting: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      complete: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    return colors[status] || "bg-secondary text-secondary-foreground";
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/engagements")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{engagement.audit_title}</h1>
              <Badge className={getStatusColor(engagement.workflow_status)}>
                {engagement.workflow_status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {engagement.clients?.client_name} • {engagement.audit_number}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLetterGeneratorOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Generate Letter
            </Button>
            {engagement.workflow_status === "draft" && (
              <Button onClick={() => setApprovalDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Request Approval
              </Button>
            )}
            {engagement.workflow_status === "pending_approval" && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                Pending Approval
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-2xl font-bold">
                    ${engagement.budget_allocated?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${engagement.budget_spent?.toLocaleString() || '0'} spent
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hours</p>
                  <p className="text-2xl font-bold">
                    {engagement.hours_allocated || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {engagement.hours_spent || 0} logged
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">45%</p>
                  <p className="text-xs text-muted-foreground">On track</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Team</p>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Organized by audit workflow phases */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full justify-start flex-wrap h-auto">
            {/* Planning Phase */}
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="scope">Scope & Planning</TabsTrigger>
            <TabsTrigger value="program">Audit Program</TabsTrigger>

            {/* Execution Phase */}
            <TabsTrigger value="team">Team & Resources</TabsTrigger>
            <TabsTrigger value="workpapers">Workpapers</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="requests">Info Requests</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="findings">Findings</TabsTrigger>

            {/* Tracking & Management */}
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="budget">Budget & Time</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>

            {/* Review & Reporting */}
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
          </TabsList>

          {/* Planning Phase Tabs */}
          <TabsContent value="overview">
            <EngagementOverviewTab engagement={engagement} />
          </TabsContent>

          <TabsContent value="risk">
            <EngagementRiskAssessmentTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="scope">
            <EngagementScopeTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="program">
            <EngagementProgramTab engagementId={engagement.id} engagementName={engagement.audit_title} />
          </TabsContent>

          {/* Execution Phase Tabs */}
          <TabsContent value="team">
            <EngagementTeamTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="workpapers">
            <EngagementWorkpapersTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="evidence">
            <EngagementEvidenceTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="requests">
            <EngagementInformationRequestsTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="tasks">
            <EngagementTasksTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="documents">
            <EngagementDocumentsTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="findings">
            <EngagementFindingsTab engagementId={engagement.id} />
          </TabsContent>

          {/* Tracking & Management Tabs */}
          <TabsContent value="milestones">
            <EngagementMilestonesTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="budget">
            <EngagementBudgetTab engagement={engagement} />
          </TabsContent>

          <TabsContent value="schedule">
            <EngagementScheduleTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="calendar">
            <EngagementCalendar engagementId={engagement.id} />
          </TabsContent>

          {/* Review & Reporting Tabs */}
          <TabsContent value="deliverables">
            <EngagementDeliverablesTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="communications">
            <EngagementCommunicationsTab engagementId={engagement.id} />
          </TabsContent>

          <TabsContent value="change-orders">
            <EngagementChangeOrdersTab engagementId={engagement.id} />
          </TabsContent>
        </Tabs>
      </div>

      <ApprovalRequestDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        engagementId={engagement?.id || ""}
        engagementTitle={engagement?.audit_title || ""}
        onSuccess={fetchEngagement}
      />

      <EngagementLetterGenerator
        open={letterGeneratorOpen}
        onOpenChange={setLetterGeneratorOpen}
        engagement={engagement}
      />
    </AppLayout>
  );
}
