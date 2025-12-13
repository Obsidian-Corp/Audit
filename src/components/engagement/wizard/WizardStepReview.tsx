import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface WizardStepReviewProps {
  formData: any;
}

export const WizardStepReview = ({ formData }: WizardStepReviewProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Engagement Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Engagement Title</p>
              <p className="font-medium">{formData.audit_title || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{formData.engagement_type || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">
                {formData.period_start && formData.period_end
                  ? `${new Date(formData.period_start).toLocaleDateString()} - ${new Date(formData.period_end).toLocaleDateString()}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Schedule</p>
              <p className="font-medium">
                {formData.planned_start_date && formData.planned_end_date
                  ? `${new Date(formData.planned_start_date).toLocaleDateString()} - ${new Date(formData.planned_end_date).toLocaleDateString()}`
                  : "Not set"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Objectives</p>
            <div className="flex flex-wrap gap-2">
              {(formData.objectives || []).map((obj: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {obj}
                </Badge>
              ))}
              {formData.objectives?.length === 0 && (
                <p className="text-sm text-muted-foreground">No objectives defined</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Key Risk Areas</p>
            <div className="flex flex-wrap gap-2">
              {(formData.key_risks || []).map((risk: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {risk}
                </Badge>
              ))}
              {formData.key_risks?.length === 0 && (
                <p className="text-sm text-muted-foreground">No risks defined</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget & Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pricing Model</p>
              <p className="font-medium capitalize">
                {formData.pricing_model?.replace(/_/g, " ") || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-medium">
                ${formData.budget_allocated?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Hours</p>
              <p className="font-medium">{formData.hours_allocated || 0}h</p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Team Members</p>
            <p className="font-medium">
              {formData.team_members?.length || 0} assigned
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {(formData.milestones || []).length > 0 ? (
            <div className="space-y-2">
              {formData.milestones.map((milestone: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {milestone.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(milestone.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No milestones defined</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
