import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface CreateAuditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateAuditPlanDialog({ open, onOpenChange, onSuccess }: CreateAuditPlanDialogProps) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    plan_name: '',
    plan_year: currentYear,
    plan_period: 'Annual',
    start_date: '',
    end_date: '',
    total_budget: '',
    allocated_hours: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audit_plans')
        .insert({
          plan_name: formData.plan_name,
          plan_year: formData.plan_year,
          plan_period: formData.plan_period,
          start_date: formData.start_date,
          end_date: formData.end_date,
          allocated_hours: formData.allocated_hours ? Number(formData.allocated_hours) : null,
          description: formData.description,
          firm_id: currentOrg.id,
          created_by: user.id,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: 'Plan Created',
        description: 'Audit plan has been successfully created.',
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        plan_name: '',
        plan_year: currentYear,
        plan_period: 'Annual',
        start_date: '',
        end_date: '',
        total_budget: '',
        allocated_hours: '',
        description: ''
      });
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Audit Plan</DialogTitle>
          <DialogDescription>
            Define annual or quarterly audit plan with budget and resource allocation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name">Plan Name *</Label>
              <Input
                id="plan_name"
                placeholder="e.g., FY 2025 Annual Audit Plan"
                value={formData.plan_name}
                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan_year">Plan Year *</Label>
                <Input
                  id="plan_year"
                  type="number"
                  min="2020"
                  max="2100"
                  value={formData.plan_year}
                  onChange={(e) => setFormData({ ...formData, plan_year: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_period">Period *</Label>
                <Select
                  value={formData.plan_period}
                  onValueChange={(value) => setFormData({ ...formData, plan_period: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_budget">Total Budget ($)</Label>
                <Input
                  id="total_budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 500000"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allocated_hours">Allocated Hours</Label>
                <Input
                  id="allocated_hours"
                  type="number"
                  min="0"
                  placeholder="e.g., 2000"
                  value={formData.allocated_hours}
                  onChange={(e) => setFormData({ ...formData, allocated_hours: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Plan objectives and scope..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
