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

interface CreateAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAuditDialog({ open, onOpenChange, onSuccess }: CreateAuditDialogProps) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['audit-plans-dropdown', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('audit_plans')
        .select('id, plan_name, plan_year')
        .eq('firm_id', currentOrg.id)
        .order('plan_year', { ascending: false });
      return data || [];
    },
    enabled: !!currentOrg && open
  });

  const { data: entities } = useQuery({
    queryKey: ['audit-entities-dropdown', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];
      const { data } = await supabase
        .from('audit_entities')
        .select('id, entity_name, entity_code')
        .eq('firm_id', currentOrg.id)
        .eq('status', 'active')
        .order('entity_name');
      return data || [];
    },
    enabled: !!currentOrg && open
  });

  const [formData, setFormData] = useState({
    audit_plan_id: '',
    audit_number: '',
    audit_title: '',
    audit_type: 'financial',
    entity_id: '',
    objective: '',
    scope: '',
    planned_start_date: '',
    planned_end_date: '',
    priority: 'medium',
    budget_allocated: '',
    hours_allocated: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audits')
        .insert({
          ...formData,
          entity_id: formData.entity_id || null,
          budget_allocated: formData.budget_allocated ? Number(formData.budget_allocated) : null,
          hours_allocated: formData.hours_allocated ? Number(formData.hours_allocated) : null,
          firm_id: currentOrg.id,
          created_by: user.id,
          lead_auditor_id: user.id,
          status: 'planned'
        });

      if (error) throw error;

      toast({
        title: 'Audit Created',
        description: 'The audit engagement has been successfully created.',
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Audit</DialogTitle>
          <DialogDescription>
            Set up a new audit engagement with scope, timeline, and resources
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audit_number">Audit Number *</Label>
                <Input
                  id="audit_number"
                  placeholder="e.g., AUD-2025-001"
                  value={formData.audit_number}
                  onChange={(e) => setFormData({ ...formData, audit_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audit_plan_id">Audit Plan</Label>
                <Select
                  value={formData.audit_plan_id}
                  onValueChange={(value) => setFormData({ ...formData, audit_plan_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.plan_year} - {plan.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audit_title">Audit Title *</Label>
              <Input
                id="audit_title"
                placeholder="e.g., Financial Statement Audit FY2025"
                value={formData.audit_title}
                onChange={(e) => setFormData({ ...formData, audit_title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audit_type">Audit Type *</Label>
                <Select
                  value={formData.audit_type}
                  onValueChange={(value) => setFormData({ ...formData, audit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="it">IT</SelectItem>
                    <SelectItem value="integrated">Integrated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_id">Entity</Label>
                <Select
                  value={formData.entity_id}
                  onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an entity (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {entities?.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.entity_code} - {entity.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Textarea
                id="objective"
                placeholder="Audit objectives..."
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Textarea
                id="scope"
                placeholder="Audit scope and boundaries..."
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned_start_date">Planned Start Date</Label>
                <Input
                  id="planned_start_date"
                  type="date"
                  value={formData.planned_start_date}
                  onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planned_end_date">Planned End Date</Label>
                <Input
                  id="planned_end_date"
                  type="date"
                  value={formData.planned_end_date}
                  onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                <Label htmlFor="budget_allocated">Budget ($)</Label>
                <Input
                  id="budget_allocated"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.budget_allocated}
                  onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours_allocated">Hours</Label>
                <Input
                  id="hours_allocated"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.hours_allocated}
                  onChange={(e) => setFormData({ ...formData, hours_allocated: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Audit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
