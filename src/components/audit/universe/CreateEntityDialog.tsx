import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface CreateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateEntityDialog({ open, onOpenChange, onSuccess }: CreateEntityDialogProps) {
  const { user, currentFirm } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    entity_code: '',
    entity_name: '',
    entity_type: 'department',
    description: '',
    audit_frequency: 'annual',
    risk_score: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !currentFirm?.id) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please sign in to create an entity'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('audit_entities')
        .insert({
          ...formData,
          firm_id: currentFirm.id,
          created_by: user.id,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Entity Created',
        description: 'Audit entity has been successfully created.',
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        entity_code: '',
        entity_name: '',
        entity_type: 'department',
        description: '',
        audit_frequency: 'annual',
        risk_score: 0
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
          <DialogTitle>Add Auditable Entity</DialogTitle>
          <DialogDescription>
            Create a new entity in the audit universe (department, process, account, or system)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entity_code">Entity Code *</Label>
                <Input
                  id="entity_code"
                  placeholder="e.g., FIN-001"
                  value={formData.entity_code}
                  onChange={(e) => setFormData({ ...formData, entity_code: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity_type">Entity Type *</Label>
                <Select
                  value={formData.entity_type}
                  onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="process">Process</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity_name">Entity Name *</Label>
              <Input
                id="entity_name"
                placeholder="e.g., Finance Department"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the entity..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audit_frequency">Audit Frequency *</Label>
                <Select
                  value={formData.audit_frequency}
                  onValueChange={(value) => setFormData({ ...formData, audit_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="biannual">Biannual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk_score">Initial Risk Score (0-100)</Label>
                <Input
                  id="risk_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.risk_score}
                  onChange={(e) => setFormData({ ...formData, risk_score: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Entity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
