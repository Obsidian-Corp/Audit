import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface WizardStepScopeProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const WizardStepScope = ({ formData, updateFormData }: WizardStepScopeProps) => {
  const [objectiveInput, setObjectiveInput] = useState("");
  const [riskInput, setRiskInput] = useState("");

  const addObjective = () => {
    if (objectiveInput.trim()) {
      updateFormData({
        objectives: [...(formData.objectives || []), objectiveInput.trim()],
      });
      setObjectiveInput("");
    }
  };

  const removeObjective = (index: number) => {
    updateFormData({
      objectives: formData.objectives.filter((_: string, i: number) => i !== index),
    });
  };

  const addRisk = () => {
    if (riskInput.trim()) {
      updateFormData({
        key_risks: [...(formData.key_risks || []), riskInput.trim()],
      });
      setRiskInput("");
    }
  };

  const removeRisk = (index: number) => {
    updateFormData({
      key_risks: formData.key_risks.filter((_: string, i: number) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Objectives</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add an objective..."
            value={objectiveInput}
            onChange={(e) => setObjectiveInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addObjective()}
          />
          <Button type="button" onClick={addObjective}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(formData.objectives || []).map((obj: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-2">
              {obj}
              <button onClick={() => removeObjective(index)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scope_boundaries">Scope Boundaries</Label>
        <Textarea
          id="scope_boundaries"
          placeholder="What is included in this engagement..."
          value={formData.scope_boundaries}
          onChange={(e) => updateFormData({ scope_boundaries: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusions">Exclusions</Label>
        <Textarea
          id="exclusions"
          placeholder="What is NOT included in this engagement..."
          value={formData.exclusions}
          onChange={(e) => updateFormData({ exclusions: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Key Risk Areas</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a risk area..."
            value={riskInput}
            onChange={(e) => setRiskInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addRisk()}
          />
          <Button type="button" onClick={addRisk}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {(formData.key_risks || []).map((risk: string, index: number) => (
            <Badge key={index} variant="secondary" className="gap-2">
              {risk}
              <button onClick={() => removeRisk(index)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="materiality_threshold">Materiality Threshold</Label>
        <Input
          id="materiality_threshold"
          type="number"
          placeholder="0"
          value={formData.materiality_threshold}
          onChange={(e) => updateFormData({ materiality_threshold: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
};
