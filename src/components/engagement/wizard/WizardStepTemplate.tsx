import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, DollarSign, Users, Star, ChevronRight } from "lucide-react";
import { useEngagementTemplates } from "@/hooks/useEngagementTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface WizardStepTemplateProps {
  onSelectTemplate: (template: any) => void;
  onSkip: () => void;
}

export function WizardStepTemplate({ onSelectTemplate, onSkip }: WizardStepTemplateProps) {
  const { templates, loading } = useEngagementTemplates();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Choose a Template</h2>
          <p className="text-muted-foreground mt-2">
            Start with a template or create from scratch
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const defaultTemplates = templates.filter((t) => t.is_default);
  const otherTemplates = templates.filter((t) => !t.is_default);

  const TemplateOption = ({ template }: { template: any }) => {
    const totalHours = (Object.values(template.estimated_hours_by_role || {}) as number[]).reduce(
      (sum, hours) => sum + (hours || 0),
      0
    ) as number;

    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => onSelectTemplate(template)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors">
                {template.template_name}
                {template.is_default && (
                  <Star className="h-4 w-4 fill-primary text-primary" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {template.description || "No description"}
              </CardDescription>
            </div>
            <div className="flex-shrink-0">
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Badge variant="secondary">{template.engagement_type}</Badge>
            {template.industry && <Badge variant="outline">{template.industry}</Badge>}
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {totalHours} hours
            </div>
            {template.default_team_structure?.length > 0 && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                {template.default_team_structure.length} roles
              </div>
            )}
            {(template.budget_range_min || template.budget_range_max) && (
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                {template.budget_range_min && template.budget_range_max
                  ? `$${template.budget_range_min.toLocaleString()} - $${template.budget_range_max.toLocaleString()}`
                  : template.budget_range_min
                  ? `From $${template.budget_range_min.toLocaleString()}`
                  : `Up to $${template.budget_range_max.toLocaleString()}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose a Template</h2>
        <p className="text-muted-foreground mt-2">
          Start with a template to pre-fill engagement details, or create from scratch
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="space-y-6 pr-4">
          {/* Default Templates */}
          {defaultTemplates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Recommended Templates</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {defaultTemplates.map((template) => (
                  <TemplateOption key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}

          {/* Other Templates */}
          {otherTemplates.length > 0 && (
            <>
              {defaultTemplates.length > 0 && <Separator />}
              <div className="space-y-3">
                <h3 className="font-semibold">All Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherTemplates.map((template) => (
                    <TemplateOption key={template.id} template={template} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Start from Scratch */}
          <div className="space-y-3">
            <Separator />
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer border-dashed"
              onClick={onSkip}
            >
              <CardHeader>
                <CardTitle className="text-lg">Start from Scratch</CardTitle>
                <CardDescription>
                  Create a custom engagement without using a template
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
