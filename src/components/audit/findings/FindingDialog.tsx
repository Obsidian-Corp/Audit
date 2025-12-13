// Finding Dialog Component
// Phase 3: Execution & Findings - Create and manage audit findings

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save } from 'lucide-react';
import type {
  AuditFinding,
  FindingType,
  SeverityLevel,
  MaterialityImpact,
  FindingFormData
} from '@/types/findings';
import {
  getSeverityColor,
  getSeverityLabel,
  getFindingTypeLabel,
  getMaterialityImpactColor,
  assessMaterialityImpact
} from '@/types/findings';

interface FindingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (finding: FindingFormData) => Promise<void>;
  engagementId: string;
  procedureId?: string;
  existingFinding?: AuditFinding;
  planningMateriality?: number;
  performanceMateriality?: number;
  trivialThreshold?: number;
}

const FINDING_TYPES: { value: FindingType; label: string }[] = [
  { value: 'control_deficiency', label: 'Control Deficiency' },
  { value: 'misstatement', label: 'Misstatement' },
  { value: 'exception', label: 'Exception' },
  { value: 'observation', label: 'Observation' },
  { value: 'other', label: 'Other' }
];

const SEVERITY_LEVELS: { value: SeverityLevel; label: string; description: string }[] = [
  { value: 'trivial', label: 'Trivial', description: 'Below trivial threshold' },
  { value: 'immaterial', label: 'Immaterial', description: 'Below performance materiality' },
  { value: 'material', label: 'Material', description: 'Exceeds performance materiality' },
  { value: 'significant_deficiency', label: 'Significant Deficiency', description: 'Important control weakness' },
  { value: 'material_weakness', label: 'Material Weakness', description: 'Severe control failure' }
];

const COMMON_ACCOUNTS = [
  'Cash',
  'Accounts Receivable',
  'Inventory',
  'Fixed Assets',
  'Accounts Payable',
  'Revenue',
  'Expenses',
  'Equity'
];

const COMMON_AREAS = [
  'cash',
  'accounts_receivable',
  'inventory',
  'revenue',
  'expenses',
  'controls',
  'it_systems'
];

export const FindingDialog: React.FC<FindingDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  engagementId,
  procedureId,
  existingFinding,
  planningMateriality = 100000,
  performanceMateriality = 75000,
  trivialThreshold = 5000
}) => {
  const [formData, setFormData] = useState<FindingFormData>({
    finding_title: existingFinding?.finding_title || '',
    finding_description: existingFinding?.finding_description || '',
    finding_type: existingFinding?.finding_type || 'exception',
    severity: existingFinding?.severity || 'immaterial',
    quantified_amount: existingFinding?.quantified_amount,
    affected_accounts: existingFinding?.affected_accounts || [],
    affected_areas: existingFinding?.affected_areas || [],
    management_response: existingFinding?.management_response || '',
    corrective_action_plan: existingFinding?.corrective_action_plan || '',
    remediation_deadline: existingFinding?.remediation_deadline || '',
    requires_follow_up: existingFinding?.requires_follow_up ?? true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Calculate materiality impact
  const materialityImpact = formData.quantified_amount
    ? assessMaterialityImpact(
        formData.quantified_amount,
        planningMateriality,
        performanceMateriality,
        trivialThreshold
      )
    : 'none';

  const handleAddAccount = () => {
    if (selectedAccount && !formData.affected_accounts.includes(selectedAccount)) {
      setFormData({
        ...formData,
        affected_accounts: [...formData.affected_accounts, selectedAccount]
      });
      setSelectedAccount('');
    }
  };

  const handleRemoveAccount = (account: string) => {
    setFormData({
      ...formData,
      affected_accounts: formData.affected_accounts.filter(a => a !== account)
    });
  };

  const handleAddArea = () => {
    if (selectedArea && !formData.affected_areas.includes(selectedArea)) {
      setFormData({
        ...formData,
        affected_areas: [...formData.affected_areas, selectedArea]
      });
      setSelectedArea('');
    }
  };

  const handleRemoveArea = (area: string) => {
    setFormData({
      ...formData,
      affected_areas: formData.affected_areas.filter(a => a !== area)
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving finding:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = formData.finding_title.trim() && formData.finding_description.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingFinding ? 'Edit Finding' : 'New Finding'}
          </DialogTitle>
          <DialogDescription>
            Document an issue, exception, or observation identified during the audit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Finding Type & Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Finding Type *</Label>
              <Select
                value={formData.finding_type}
                onValueChange={(value) => setFormData({ ...formData, finding_type: value as FindingType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINDING_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData({ ...formData, severity: value as SeverityLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map(({ value, label, description }) => (
                    <SelectItem key={value} value={value}>
                      <div>
                        <div>{label}</div>
                        <div className="text-xs text-gray-500">{description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Finding Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the finding..."
              value={formData.finding_title}
              onChange={(e) => setFormData({ ...formData, finding_title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Finding Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of what was found, the criteria, condition, cause, and effect..."
              value={formData.finding_description}
              onChange={(e) => setFormData({ ...formData, finding_description: e.target.value })}
              rows={5}
            />
          </div>

          {/* Quantified Amount & Materiality */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Quantified Amount (if applicable)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={formData.quantified_amount || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  quantified_amount: e.target.value ? parseFloat(e.target.value) : undefined
                })}
              />
            </div>

            {formData.quantified_amount && formData.quantified_amount > 0 && (
              <Alert className={getMaterialityImpactColor(materialityImpact).includes('red') ? 'border-red-500' : ''}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Materiality Impact:</strong> {materialityImpact.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-sm">
                      Planning Materiality: ${planningMateriality.toLocaleString()} |
                      Performance: ${performanceMateriality.toLocaleString()} |
                      Trivial: ${trivialThreshold.toLocaleString()}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Affected Accounts */}
          <div className="space-y-2">
            <Label>Affected Accounts</Label>
            <div className="flex gap-2">
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ACCOUNTS.map((account) => (
                    <SelectItem key={account} value={account}>{account}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleAddAccount}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.affected_accounts.map((account) => (
                <Badge key={account} variant="secondary">
                  {account}
                  <button
                    className="ml-2 hover:text-red-600"
                    onClick={() => handleRemoveAccount(account)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Affected Areas */}
          <div className="space-y-2">
            <Label>Affected Risk Areas</Label>
            <div className="flex gap-2">
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select risk area" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={handleAddArea}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.affected_areas.map((area) => (
                <Badge key={area} variant="secondary">
                  {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <button
                    className="ml-2 hover:text-red-600"
                    onClick={() => handleRemoveArea(area)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Management Response */}
          <div className="space-y-2">
            <Label htmlFor="management_response">Management Response (Optional)</Label>
            <Textarea
              id="management_response"
              placeholder="Management's response to the finding..."
              value={formData.management_response || ''}
              onChange={(e) => setFormData({ ...formData, management_response: e.target.value })}
              rows={3}
            />
          </div>

          {/* Corrective Action Plan */}
          <div className="space-y-2">
            <Label htmlFor="action_plan">Corrective Action Plan (Optional)</Label>
            <Textarea
              id="action_plan"
              placeholder="Planned corrective actions..."
              value={formData.corrective_action_plan || ''}
              onChange={(e) => setFormData({ ...formData, corrective_action_plan: e.target.value })}
              rows={3}
            />
          </div>

          {/* Remediation Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Remediation Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.remediation_deadline || ''}
              onChange={(e) => setFormData({ ...formData, remediation_deadline: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Finding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FindingDialog;
