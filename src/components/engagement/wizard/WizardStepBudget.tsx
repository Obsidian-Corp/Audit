import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface WizardStepBudgetProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const WizardStepBudget = ({ formData, updateFormData }: WizardStepBudgetProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pricing_model">Pricing Model *</Label>
        <Select value={formData.pricing_model} onValueChange={(value) => updateFormData({ pricing_model: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select pricing model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed_fee">Fixed Fee</SelectItem>
            <SelectItem value="time_and_materials">Time & Materials</SelectItem>
            <SelectItem value="blended_rate">Blended Rate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.pricing_model === "blended_rate" && (
        <div className="space-y-2">
          <Label htmlFor="blended_rate">Blended Rate ($/hour)</Label>
          <Input
            id="blended_rate"
            type="number"
            placeholder="150"
            value={formData.blended_rate}
            onChange={(e) => updateFormData({ blended_rate: parseFloat(e.target.value) })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="budget_allocated">Total Budget ($) *</Label>
        <Input
          id="budget_allocated"
          type="number"
          placeholder="50000"
          value={formData.budget_allocated}
          onChange={(e) => updateFormData({ budget_allocated: parseFloat(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hours_allocated">Estimated Hours *</Label>
        <Input
          id="hours_allocated"
          type="number"
          placeholder="300"
          value={formData.hours_allocated}
          onChange={(e) => updateFormData({ hours_allocated: parseInt(e.target.value) })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contingency_percentage">Contingency (%)</Label>
        <Input
          id="contingency_percentage"
          type="number"
          placeholder="10"
          value={formData.contingency_percentage}
          onChange={(e) => updateFormData({ contingency_percentage: parseFloat(e.target.value) })}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Budget:</span>
              <span className="font-medium">${formData.budget_allocated?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Contingency ({formData.contingency_percentage || 0}%):</span>
              <span className="font-medium">
                ${((formData.budget_allocated || 0) * (formData.contingency_percentage || 0) / 100).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total with Contingency:</span>
              <span>
                ${((formData.budget_allocated || 0) * (1 + (formData.contingency_percentage || 0) / 100)).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
