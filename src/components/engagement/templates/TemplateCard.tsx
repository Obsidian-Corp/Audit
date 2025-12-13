import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, DollarSign, Users, MoreVertical, Pencil, Trash2, Copy, Star } from "lucide-react";
import { useEngagementTemplates } from "@/hooks/useEngagementTemplates";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TemplateCardProps {
  template: any;
  onEdit: () => void;
}

export function TemplateCard({ template, onEdit }: TemplateCardProps) {
  const { deleteTemplate, createTemplate, updateTemplate } = useEngagementTemplates();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    await deleteTemplate(template.id);
    setDeleteDialogOpen(false);
  };

  const handleDuplicate = async () => {
    const duplicate = {
      ...template,
      template_name: `${template.template_name} (Copy)`,
      is_default: false,
    };
    delete duplicate.id;
    delete duplicate.created_at;
    delete duplicate.updated_at;
    
    await createTemplate(duplicate);
    toast({
      title: "Template duplicated",
      description: "A copy has been created successfully.",
    });
  };

  const handleSetDefault = async () => {
    await updateTemplate(template.id, { is_default: !template.is_default });
  };

  const totalHours = (Object.values(template.estimated_hours_by_role || {}) as number[]).reduce(
    (sum, hours) => sum + (hours || 0),
    0
  ) as number;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {template.template_name}
                {template.is_default && (
                  <Star className="h-4 w-4 fill-primary text-primary" />
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {template.description || "No description provided"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSetDefault}>
                  <Star className="h-4 w-4 mr-2" />
                  {template.is_default ? "Remove Default" : "Set as Default"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Badge variant="secondary">{template.engagement_type}</Badge>
            {template.industry && (
              <Badge variant="outline">{template.industry}</Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              {totalHours} estimated hours
            </div>
            {template.default_team_structure?.length > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                {template.default_team_structure.length} team roles
              </div>
            )}
            {(template.budget_range_min || template.budget_range_max) && (
              <div className="flex items-center text-sm text-muted-foreground">
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
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onEdit}>
            View Details
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{template.template_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
