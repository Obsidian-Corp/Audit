import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface WizardStepScheduleProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const WizardStepSchedule = ({ formData, updateFormData }: WizardStepScheduleProps) => {
  const [newMilestone, setNewMilestone] = useState({
    name: "",
    type: "",
    date: "",
    is_critical: false,
  });

  const milestoneTypes = [
    "kickoff",
    "fieldwork_start",
    "interim_review",
    "fieldwork_complete",
    "draft_report",
    "final_report",
    "client_acceptance",
  ];

  const addMilestone = () => {
    if (newMilestone.name && newMilestone.type && newMilestone.date) {
      updateFormData({
        milestones: [...(formData.milestones || []), { ...newMilestone }],
      });
      setNewMilestone({
        name: "",
        type: "",
        date: "",
        is_critical: false,
      });
    }
  };

  const removeMilestone = (index: number) => {
    updateFormData({
      milestones: formData.milestones.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="planned_start_date">Planned Start Date *</Label>
          <Input
            id="planned_start_date"
            type="date"
            value={formData.planned_start_date}
            onChange={(e) => updateFormData({ planned_start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="planned_end_date">Planned End Date *</Label>
          <Input
            id="planned_end_date"
            type="date"
            value={formData.planned_end_date}
            onChange={(e) => updateFormData({ planned_end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <Label className="text-lg">Milestones</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Define key dates and deliverables for this engagement
        </p>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Milestone Name</Label>
              <Input
                placeholder="e.g., Kickoff Meeting"
                value={newMilestone.name}
                onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newMilestone.type} onValueChange={(value) => setNewMilestone({ ...newMilestone, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestoneTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newMilestone.date}
                  onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_critical"
                checked={newMilestone.is_critical}
                onCheckedChange={(checked) => setNewMilestone({ ...newMilestone, is_critical: checked as boolean })}
              />
              <Label htmlFor="is_critical" className="text-sm font-normal cursor-pointer">
                This is a critical milestone
              </Label>
            </div>

            <Button type="button" onClick={addMilestone} className="w-full">
              Add Milestone
            </Button>
          </CardContent>
        </Card>
      </div>

      {(formData.milestones || []).length > 0 && (
        <div className="space-y-3">
          <Label>Planned Milestones</Label>
          {formData.milestones.map((milestone: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {milestone.type.replace(/_/g, " ")} • {new Date(milestone.date).toLocaleDateString()}
                      {milestone.is_critical && " • Critical"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMilestone(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
