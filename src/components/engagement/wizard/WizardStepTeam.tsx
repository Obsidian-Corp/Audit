import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface WizardStepTeamProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const WizardStepTeam = ({ formData, updateFormData }: WizardStepTeamProps) => {
  const [newMember, setNewMember] = useState({
    user_id: "",
    role: "",
    allocated_hours: 0,
    start_date: "",
    end_date: "",
  });

  // Mock users - in real app, would fetch from Supabase
  const availableUsers = [
    { id: "1", name: "John Smith", title: "Senior Auditor" },
    { id: "2", name: "Sarah Johnson", title: "Auditor" },
    { id: "3", name: "Mike Chen", title: "Senior Auditor" },
  ];

  const roles = ["Lead", "Manager", "Senior", "Staff", "Specialist"];

  const addTeamMember = () => {
    if (newMember.user_id && newMember.role && newMember.allocated_hours > 0) {
      updateFormData({
        team_members: [...(formData.team_members || []), { ...newMember }],
      });
      setNewMember({
        user_id: "",
        role: "",
        allocated_hours: 0,
        start_date: "",
        end_date: "",
      });
    }
  };

  const removeMember = (index: number) => {
    updateFormData({
      team_members: formData.team_members.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label>Team Member</Label>
            <Select value={newMember.user_id} onValueChange={(value) => setNewMember({ ...newMember, user_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role on Engagement</Label>
              <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allocated Hours</Label>
              <Input
                type="number"
                placeholder="80"
                value={newMember.allocated_hours || ""}
                onChange={(e) => setNewMember({ ...newMember, allocated_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={newMember.start_date}
                onChange={(e) => setNewMember({ ...newMember, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={newMember.end_date}
                onChange={(e) => setNewMember({ ...newMember, end_date: e.target.value })}
              />
            </div>
          </div>

          <Button type="button" onClick={addTeamMember} className="w-full">
            Add Team Member
          </Button>
        </CardContent>
      </Card>

      {(formData.team_members || []).length > 0 && (
        <div className="space-y-3">
          <Label>Assigned Team Members</Label>
          {formData.team_members.map((member: any, index: number) => {
            const user = availableUsers.find(u => u.id === member.user_id);
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {member.role} • {member.allocated_hours}h allocated
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
