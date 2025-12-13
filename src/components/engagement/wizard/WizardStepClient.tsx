import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/hooks/useClients";

interface WizardStepClientProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

export const WizardStepClient = ({ formData, updateFormData }: WizardStepClientProps) => {
  const { data: clients = [], isLoading: loading } = useClients();

  const engagementTypes = [
    "SOC 2 Type II",
    "Financial Audit",
    "Internal Audit",
    "IT Audit",
    "Operational Audit",
    "Compliance Audit",
    "Risk Assessment",
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="client">Client *</Label>
        <Select value={formData.client_id} onValueChange={(value) => updateFormData({ client_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="engagement_type">Engagement Type *</Label>
        <Select value={formData.engagement_type} onValueChange={(value) => updateFormData({ engagement_type: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select engagement type" />
          </SelectTrigger>
          <SelectContent>
            {engagementTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="audit_title">Engagement Title *</Label>
        <Input
          id="audit_title"
          placeholder="e.g., FY2024 SOC 2 Type II Audit"
          value={formData.audit_title}
          onChange={(e) => updateFormData({ audit_title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period_start">Period Start</Label>
          <Input
            id="period_start"
            type="date"
            value={formData.period_start}
            onChange={(e) => updateFormData({ period_start: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="period_end">Period End</Label>
          <Input
            id="period_end"
            type="date"
            value={formData.period_end}
            onChange={(e) => updateFormData({ period_end: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};
