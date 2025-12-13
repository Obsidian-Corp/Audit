import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface CreateRiskAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRiskAssessmentDialog({ open, onOpenChange, onSuccess }: CreateRiskAssessmentDialogProps) {
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    entity_id: '',
    likelihood_score: 3,
    impact_score: 3,
    control_effectiveness: 3,
    risk_category: 'financial',
    risk_description: '',
    mitigation_strategy: ''
  });

  const calculateResidualRisk = () => {
    const inherent = formData.likelihood_score * formData.impact_score * 4;
    const control = formData.control_effectiveness;
    return inherent * (1 - (control - 1) / 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('risk_assessments')
        .insert({
          ...formData,
          organization_id: currentOrg.id,
          assessed_by: user.id,
          residual_risk: calculateResidualRisk(),
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: 'Risk Assessment Created',
        description: 'The risk assessment has been successfully created.',
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

  const inherentRisk = formData.likelihood_score * formData.impact_score * 4;
  const residualRisk = calculateResidualRisk();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Risk Assessment</DialogTitle>
          <DialogDescription>
            Assess the likelihood and impact of risks for an entity
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="entity_id">Entity *</Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity" />
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

            <div className="space-y-2">
              <Label htmlFor="risk_category">Risk Category *</Label>
              <Select
                value={formData.risk_category}
                onValueChange={(value) => setFormData({ ...formData, risk_category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_description">Risk Description *</Label>
              <Textarea
                id="risk_description"
                placeholder="Describe the identified risk..."
                value={formData.risk_description}
                onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="likelihood_score">Likelihood (1-5) *</Label>
                <Input
                  id="likelihood_score"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.likelihood_score}
                  onChange={(e) => setFormData({ ...formData, likelihood_score: Number(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">1=Rare, 5=Almost Certain</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact_score">Impact (1-5) *</Label>
                <Input
                  id="impact_score"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.impact_score}
                  onChange={(e) => setFormData({ ...formData, impact_score: Number(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">1=Insignificant, 5=Catastrophic</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="control_effectiveness">Control Effectiveness (1-5) *</Label>
                <Input
                  id="control_effectiveness"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.control_effectiveness}
                  onChange={(e) => setFormData({ ...formData, control_effectiveness: Number(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">1=Poor, 5=Excellent</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm text-muted-foreground">Inherent Risk</Label>
                <div className="text-2xl font-bold">{inherentRisk.toFixed(0)}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Residual Risk</Label>
                <div className="text-2xl font-bold text-green-600">{residualRisk.toFixed(0)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mitigation_strategy">Mitigation Strategy</Label>
              <Textarea
                id="mitigation_strategy"
                placeholder="Describe mitigation measures..."
                value={formData.mitigation_strategy}
                onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Assessment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
