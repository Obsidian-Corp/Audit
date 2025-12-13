import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateFindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateFindingDialog({ open, onOpenChange, onSuccess }: CreateFindingDialogProps) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: audits } = useQuery({
    queryKey: ['audits-dropdown', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('audits')
        .select('id, audit_number, audit_title')
        .eq('firm_id', currentOrg.id)
        .in('status', ['in_preparation', 'fieldwork', 'reporting'])
        .order('audit_number');
      return data || [];
    },
    enabled: !!currentOrg && open
  });

  const [formData, setFormData] = useState({
    audit_id: '',
    finding_number: '',
    finding_title: '',
    finding_type: 'deficiency',
    severity: 'medium',
    condition_description: '',
    criteria: '',
    cause: '',
    effect: '',
    recommendation: '',
    target_completion_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audit_findings')
        .insert({
          ...formData,
          firm_id: currentOrg.id,
          identified_by: user.id,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: 'Finding Logged',
        description: 'The audit finding has been successfully logged.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Audit Finding</DialogTitle>
          <DialogDescription>
            Document a finding using the 5Cs framework: Condition, Criteria, Cause, Consequence (Effect), Corrective action
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finding_number">Finding Number *</Label>
                <Input
                  id="finding_number"
                  placeholder="e.g., F-2025-001"
                  value={formData.finding_number}
                  onChange={(e) => setFormData({ ...formData, finding_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit_id">Audit *</Label>
                <Select
                  value={formData.audit_id}
                  onValueChange={(value) => setFormData({ ...formData, audit_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {audits?.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id}>
                        {audit.audit_number} - {audit.audit_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finding_title">Finding Title *</Label>
              <Input
                id="finding_title"
                placeholder="Brief description of the finding"
                value={formData.finding_title}
                onChange={(e) => setFormData({ ...formData, finding_title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finding_type">Type *</Label>
                <Select
                  value={formData.finding_type}
                  onValueChange={(value) => setFormData({ ...formData, finding_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deficiency">Deficiency</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                    <SelectItem value="non_compliance">Non-Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_completion_date">Target Date</Label>
                <Input
                  id="target_completion_date"
                  type="date"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({ ...formData, target_completion_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition_description">Condition (What was found) *</Label>
              <Textarea
                id="condition_description"
                placeholder="Describe what you observed..."
                value={formData.condition_description}
                onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria">Criteria (What should be)</Label>
              <Textarea
                id="criteria"
                placeholder="Standards, policies, or regulations that apply..."
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cause">Cause (Why it happened)</Label>
              <Textarea
                id="cause"
                placeholder="Root cause analysis..."
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effect">Effect (Impact/Consequence)</Label>
              <Textarea
                id="effect"
                placeholder="Potential or actual impact..."
                value={formData.effect}
                onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation">Recommendation (Corrective Action)</Label>
              <Textarea
                id="recommendation"
                placeholder="Suggested remediation steps..."
                value={formData.recommendation}
                onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Finding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
