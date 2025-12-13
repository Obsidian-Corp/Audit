import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { AuditProcedure, useProcedures } from '@/hooks/useProcedures';
import { RichTextEditor } from '@/components/audit/workpapers/RichTextEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProcedureEditorProps {
  procedure?: AuditProcedure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmId: string;
}

export function ProcedureEditor({
  procedure,
  open,
  onOpenChange,
  firmId,
}: ProcedureEditorProps) {
  const { createProcedure, updateProcedure } = useProcedures();
  const [instructions, setInstructions] = useState(procedure?.instructions || null);
  const [evidenceItems, setEvidenceItems] = useState<string[]>(
    procedure?.evidence_requirements?.map((e: any) => typeof e === 'string' ? e : e.description || '') || []
  );
  const [controlObjectives, setControlObjectives] = useState<string[]>(
    procedure?.control_objectives?.map((o: any) => typeof o === 'string' ? o : o.code || '') || []
  );
  const [newEvidence, setNewEvidence] = useState('');
  const [newObjective, setNewObjective] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      procedure_name: procedure?.procedure_name || '',
      procedure_code: procedure?.procedure_code || '',
      category: procedure?.category || 'control_test',
      objective: procedure?.objective || '',
      sample_size_guidance: procedure?.sample_size_guidance || '',
      expected_outcomes: procedure?.expected_outcomes || '',
      estimated_hours: procedure?.estimated_hours || 4,
      risk_level: procedure?.risk_level || 'medium',
      procedure_type: procedure?.procedure_type || 'standard',
    },
  });

  const onSubmit = handleSubmit((data) => {
    const procedureData = {
      ...data,
      firm_id: firmId,
      instructions,
      evidence_requirements: evidenceItems,
      control_objectives: controlObjectives,
    };

    if (procedure?.id) {
      updateProcedure({ id: procedure.id, ...procedureData });
    } else {
      createProcedure(procedureData);
    }

    onOpenChange(false);
  });

  const addEvidenceItem = () => {
    if (newEvidence.trim()) {
      setEvidenceItems([...evidenceItems, newEvidence.trim()]);
      setNewEvidence('');
    }
  };

  const removeEvidenceItem = (index: number) => {
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const addControlObjective = () => {
    if (newObjective.trim()) {
      setControlObjectives([...controlObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const removeControlObjective = (index: number) => {
    setControlObjectives(controlObjectives.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {procedure ? 'Edit Procedure' : 'Create New Procedure'}
          </DialogTitle>
          <DialogDescription>
            {procedure
              ? 'Update the audit procedure details below'
              : 'Create a new audit test procedure for your library'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="procedure_code">Procedure Code *</Label>
                <Input
                  id="procedure_code"
                  placeholder="e.g., AC-001"
                  {...register('procedure_code', { required: true })}
                />
                {errors.procedure_code && (
                  <p className="text-xs text-destructive">Code is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={watch('category')}
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="control_test">Control Test</SelectItem>
                    <SelectItem value="substantive">Substantive Test</SelectItem>
                    <SelectItem value="analytical">Analytical Procedure</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedure_name">Procedure Name *</Label>
              <Input
                id="procedure_name"
                placeholder="e.g., User Access Review Testing"
                {...register('procedure_name', { required: true })}
              />
              {errors.procedure_name && (
                <p className="text-xs text-destructive">Name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective</Label>
              <Textarea
                id="objective"
                placeholder="Describe the objective of this procedure..."
                rows={3}
                {...register('objective')}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label>Step-by-Step Instructions</Label>
              <div className="border rounded-lg">
                <RichTextEditor
                  content={instructions}
                  onChange={setInstructions}
                  placeholder="Enter detailed step-by-step instructions..."
                  editable={true}
                />
              </div>
            </div>

            {/* Time & Risk */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register('estimated_hours', { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_level">Risk Level</Label>
                <Select
                  value={watch('risk_level')}
                  onValueChange={(value) => setValue('risk_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure_type">Type</Label>
                <Select
                  value={watch('procedure_type')}
                  onValueChange={(value) => setValue('procedure_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sample Size & Outcomes */}
            <div className="space-y-2">
              <Label htmlFor="sample_size_guidance">Sample Size Guidance</Label>
              <Input
                id="sample_size_guidance"
                placeholder="e.g., Select 25 users from the population..."
                {...register('sample_size_guidance')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_outcomes">Expected Outcomes</Label>
              <Textarea
                id="expected_outcomes"
                placeholder="Describe what results you expect from this procedure..."
                rows={2}
                {...register('expected_outcomes')}
              />
            </div>

            {/* Evidence Requirements */}
            <div className="space-y-2">
              <Label>Evidence Requirements</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add evidence requirement..."
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEvidenceItem();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addEvidenceItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {evidenceItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {evidenceItems.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeEvidenceItem(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Control Objectives */}
            <div className="space-y-2">
              <Label>Control Objectives</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add control objective (e.g., CC6.1)..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addControlObjective();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addControlObjective}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {controlObjectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {controlObjectives.map((obj, idx) => (
                    <Badge key={idx} variant="outline" className="gap-1">
                      {obj}
                      <button
                        type="button"
                        onClick={() => removeControlObjective(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            {procedure ? 'Update Procedure' : 'Create Procedure'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
