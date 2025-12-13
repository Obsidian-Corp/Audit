import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WizardStepTemplate } from "./wizard/WizardStepTemplate";
import { WizardStepClient } from "./wizard/WizardStepClient";
import { WizardStepScope } from "./wizard/WizardStepScope";
import { WizardStepBudget } from "./wizard/WizardStepBudget";
import { WizardStepTeam } from "./wizard/WizardStepTeam";
import { WizardStepSchedule } from "./wizard/WizardStepSchedule";
import { WizardStepReview } from "./wizard/WizardStepReview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EngagementWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefilledData?: {
    client_id?: string;
    audit_type?: string;
    audit_title?: string;
    budget_allocated?: number;
    planned_start_date?: string;
    scope?: string;
    opportunity_id?: string;
  };
}

const STEPS = [
  { id: "template", name: "Template" },
  { id: "client", name: "Client & Type" },
  { id: "scope", name: "Scope" },
  { id: "budget", name: "Budget & Pricing" },
  { id: "team", name: "Team" },
  { id: "schedule", name: "Schedule" },
  { id: "review", name: "Review" },
];

export const EngagementWizard = ({ open, onOpenChange, prefilledData }: EngagementWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    ...prefilledData,
    client_id: prefilledData?.client_id || "",
    engagement_type: prefilledData?.audit_type || "",
    audit_title: prefilledData?.audit_title || "",
    period_start: "",
    period_end: "",
    objectives: [],
    scope_boundaries: "",
    exclusions: "",
    key_risks: [],
    materiality_threshold: 0,
    pricing_model: "fixed_fee",
    blended_rate: 0,
    budget_allocated: 0,
    hours_allocated: 0,
    contingency_percentage: 10,
    team_members: [],
    planned_start_date: "",
    planned_end_date: "",
    milestones: [],
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setFormData((prev: any) => ({
      ...prev,
      engagement_type: template.engagement_type,
      budget_allocated: template.budget_range_min,
      objectives: template.default_scope?.objectives || [],
      scope_boundaries: template.default_scope?.scope_boundaries || "",
      milestones: template.default_milestones || [],
      team_members: template.default_team_structure?.map((role: any) => ({
        role: role.role,
        required_count: role.required_count,
      })) || [],
    }));
    handleNext();
  };

  const handleSkipTemplate = () => {
    setSelectedTemplate(null);
    handleNext();
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Generate engagement number
      const { count } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("firm_id", profile.firm_id);

      const engagementNumber = `ENG-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Create engagement
      const { data: engagement, error: engagementError } = await supabase
        .from("audits")
        .insert({
          firm_id: profile.firm_id,
          audit_number: engagementNumber,
          audit_title: formData.audit_title,
          audit_type: formData.engagement_type,
          client_id: formData.client_id,
          planned_start_date: formData.planned_start_date,
          planned_end_date: formData.planned_end_date,
          budget_allocated: formData.budget_allocated,
          hours_allocated: formData.hours_allocated,
          pricing_model: formData.pricing_model,
          blended_rate: formData.blended_rate,
          contingency_percentage: formData.contingency_percentage,
          workflow_status: "draft",
          status: "planned",
          created_by: user.id,
        })
        .select()
        .single();

      if (engagementError) throw engagementError;

      // Create scope
      await supabase.from("engagement_scope").insert({
        engagement_id: engagement.id,
        firm_id: profile.firm_id,
        objectives: formData.objectives,
        scope_boundaries: formData.scope_boundaries,
        exclusions: formData.exclusions,
        key_risks: formData.key_risks,
        materiality_threshold: formData.materiality_threshold,
        created_by: user.id,
      });

      // Create team assignments
      if (formData.team_members.length > 0) {
        await supabase.from("audit_team_members").insert(
          formData.team_members.map((member: any) => ({
            audit_id: engagement.id,
            user_id: member.user_id,
            role: member.role,
            allocated_hours: member.allocated_hours,
            start_date: member.start_date,
            end_date: member.end_date,
          }))
        );
      }

      // Create milestones
      if (formData.milestones.length > 0) {
        await supabase.from("engagement_milestones").insert(
          formData.milestones.map((milestone: any) => ({
            engagement_id: engagement.id,
            firm_id: profile.firm_id,
            milestone_name: milestone.name,
            milestone_type: milestone.type,
            planned_date: milestone.date,
            is_critical: milestone.is_critical || false,
            created_by: user.id,
          }))
        );
      }

      toast({
        title: "Engagement created",
        description: `${formData.audit_title} has been created successfully.`,
      });

      onOpenChange(false);
      navigate(`/engagements/${engagement.id}`);
    } catch (error: any) {
      console.error("Error creating engagement:", error);
      toast({
        title: "Error creating engagement",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateFormData = (updates: any) => {
    setFormData({ ...formData, ...updates });
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Engagement</DialogTitle>
          <div className="space-y-2 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="font-medium">{STEPS[currentStep]?.name}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStep === 0 && (
            <WizardStepTemplate 
              onSelectTemplate={handleSelectTemplate}
              onSkip={handleSkipTemplate}
            />
          )}
          {currentStep === 1 && <WizardStepClient formData={formData} updateFormData={updateFormData} />}
          {currentStep === 2 && <WizardStepScope formData={formData} updateFormData={updateFormData} />}
          {currentStep === 3 && <WizardStepBudget formData={formData} updateFormData={updateFormData} />}
          {currentStep === 4 && <WizardStepTeam formData={formData} updateFormData={updateFormData} />}
          {currentStep === 5 && <WizardStepSchedule formData={formData} updateFormData={updateFormData} />}
          {currentStep === 6 && <WizardStepReview formData={formData} />}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep !== 0 && (
            currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                Create Engagement
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
