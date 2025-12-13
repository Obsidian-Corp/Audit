import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useEngagementTemplates } from "@/hooks/useEngagementTemplates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any | null;
  onClose: () => void;
}

export function TemplateEditorDialog({ open, onOpenChange, template, onClose }: TemplateEditorDialogProps) {
  const { createTemplate, updateTemplate } = useEngagementTemplates();
  const [formData, setFormData] = useState<any>({
    template_name: "",
    engagement_type: "",
    industry: "",
    description: "",
    default_scope: {},
    default_milestones: [],
    default_team_structure: [],
    estimated_hours_by_role: {},
    budget_range_min: 0,
    budget_range_max: 0,
    deliverables_checklist: [],
    is_default: false,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        template_name: "",
        engagement_type: "",
        industry: "",
        description: "",
        default_scope: {},
        default_milestones: [],
        default_team_structure: [],
        estimated_hours_by_role: {},
        budget_range_min: 0,
        budget_range_max: 0,
        deliverables_checklist: [],
        is_default: false,
      });
    }
  }, [template, open]);

  const handleSave = async () => {
    if (template) {
      await updateTemplate(template.id, formData);
    } else {
      await createTemplate(formData);
    }
    onClose();
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      default_milestones: [
        ...(formData.default_milestones || []),
        { name: "", days_offset: 0, deliverables: [] },
      ],
    });
  };

  const removeMilestone = (index: number) => {
    const milestones = [...formData.default_milestones];
    milestones.splice(index, 1);
    setFormData({ ...formData, default_milestones: milestones });
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    const milestones = [...formData.default_milestones];
    milestones[index] = { ...milestones[index], [field]: value };
    setFormData({ ...formData, default_milestones: milestones });
  };

  const addTeamRole = () => {
    setFormData({
      ...formData,
      default_team_structure: [
        ...(formData.default_team_structure || []),
        { role: "", required_count: 1, skills: [] },
      ],
    });
  };

  const removeTeamRole = (index: number) => {
    const team = [...formData.default_team_structure];
    team.splice(index, 1);
    setFormData({ ...formData, default_team_structure: team });
  };

  const updateTeamRole = (index: number, field: string, value: any) => {
    const team = [...formData.default_team_structure];
    team[index] = { ...team[index], [field]: value };
    setFormData({ ...formData, default_team_structure: team });
  };

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables_checklist: [
        ...(formData.deliverables_checklist || []),
        "",
      ],
    });
  };

  const removeDeliverable = (index: number) => {
    const deliverables = [...formData.deliverables_checklist];
    deliverables.splice(index, 1);
    setFormData({ ...formData, deliverables_checklist: deliverables });
  };

  const updateDeliverable = (index: number, value: string) => {
    const deliverables = [...formData.deliverables_checklist];
    deliverables[index] = value;
    setFormData({ ...formData, deliverables_checklist: deliverables });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            Define a reusable engagement template with scope, milestones, and team structure
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="team">Team Structure</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="basic" className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Template Name *</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) =>
                    setFormData({ ...formData, template_name: e.target.value })
                  }
                  placeholder="e.g., Annual Financial Audit - Manufacturing"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="engagement_type">Engagement Type *</Label>
                  <Select
                    value={formData.engagement_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, engagement_type: value })
                    }
                  >
                    <SelectTrigger id="engagement_type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                      <SelectItem value="advisory">Advisory</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) =>
                      setFormData({ ...formData, industry: value })
                    }
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial_services">Financial Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the purpose and typical use of this template"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget Range Min</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={formData.budget_range_min}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_range_min: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget Range Max</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={formData.budget_range_max}
                    onChange={(e) =>
                      setFormData({ ...formData, budget_range_max: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_default: checked })
                  }
                />
                <Label htmlFor="is_default">Set as default template</Label>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-4 pr-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Define typical milestones for this engagement type
                </p>
                <Button size="sm" onClick={addMilestone}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>

              <div className="space-y-4">
                {formData.default_milestones?.map((milestone: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Milestone name"
                            value={milestone.name}
                            onChange={(e) =>
                              updateMilestone(index, "name", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Days from start"
                            value={milestone.days_offset}
                            onChange={(e) =>
                              updateMilestone(index, "days_offset", parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMilestone(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4 pr-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Define typical team structure and roles
                </p>
                <Button size="sm" onClick={addTeamRole}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </div>

              <div className="space-y-4">
                {formData.default_team_structure?.map((role: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <Input
                            placeholder="Role (e.g., Lead Auditor, Senior Associate)"
                            value={role.role}
                            onChange={(e) =>
                              updateTeamRole(index, "role", e.target.value)
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Required count"
                            value={role.required_count}
                            onChange={(e) =>
                              updateTeamRole(index, "required_count", parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamRole(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="space-y-4 pr-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Define typical deliverables checklist
                </p>
                <Button size="sm" onClick={addDeliverable}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deliverable
                </Button>
              </div>

              <div className="space-y-2">
                {formData.deliverables_checklist?.map((deliverable: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Deliverable name"
                      value={deliverable}
                      onChange={(e) => updateDeliverable(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {template ? "Update" : "Create"} Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
