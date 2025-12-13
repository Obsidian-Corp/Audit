// Risk Assessment Wizard Component
// Phase 1: Foundation - Multi-step risk assessment wizard

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCreateRiskAssessment } from '@/hooks/useRiskAssessment';
import { RiskHeatMap } from './RiskHeatMap';
import type {
  BusinessProfile,
  RiskAreaAssessment,
  FraudRiskAssessment,
  ITRiskAssessment,
  RiskLevel,
  ComplexityFactor,
  AreaCategory
} from '@/types/risk-assessment';
import {
  COMPLEXITY_FACTORS,
  FRAUD_RISK_FACTORS,
  INDUSTRIES,
  INDUSTRY_LABELS,
  COMPANY_SIZES,
  RISK_LEVELS,
  calculateCombinedRisk,
  calculateOverallRisk
} from '@/types/risk-assessment';

interface RiskAssessmentWizardProps {
  engagementId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (assessmentId: string) => void;
}

const TOTAL_STEPS = 5;

export const RiskAssessmentWizard: React.FC<RiskAssessmentWizardProps> = ({
  engagementId,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const createAssessment = useCreateRiskAssessment();

  // Step 1: Business Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    industry: '',
    company_size: 'medium',
    revenue_range: '',
    complexity_factors: COMPLEXITY_FACTORS.map(f => ({ ...f, is_selected: false }))
  });

  // Step 2: Risk Areas
  const [riskAreas, setRiskAreas] = useState<Partial<RiskAreaAssessment>[]>([
    { area_name: 'Cash', area_category: 'balance_sheet', inherent_risk: 'medium', control_risk: 'medium', combined_risk: 'medium', is_material_area: true, key_risk_factors: [], fraud_risk_factors: [] },
    { area_name: 'Accounts Receivable', area_category: 'balance_sheet', inherent_risk: 'medium', control_risk: 'medium', combined_risk: 'medium', is_material_area: true, key_risk_factors: [], fraud_risk_factors: [] },
    { area_name: 'Inventory', area_category: 'balance_sheet', inherent_risk: 'medium', control_risk: 'medium', combined_risk: 'medium', is_material_area: true, key_risk_factors: [], fraud_risk_factors: [] },
    { area_name: 'Revenue', area_category: 'income_statement', inherent_risk: 'high', control_risk: 'medium', combined_risk: 'high', is_material_area: true, key_risk_factors: [], fraud_risk_factors: [] },
    { area_name: 'Expenses', area_category: 'income_statement', inherent_risk: 'low', control_risk: 'medium', combined_risk: 'medium', is_material_area: true, key_risk_factors: [], fraud_risk_factors: [] }
  ]);

  // Step 3: Fraud Risk
  const [fraudRisk, setFraudRisk] = useState<FraudRiskAssessment>({
    overall_fraud_risk: 'medium',
    fraud_factors: FRAUD_RISK_FACTORS.map(f => ({ ...f, is_present: false })),
    specific_fraud_risks: [],
    fraud_procedures_required: false
  });

  // Step 4: IT Risk
  const [itRisk, setItRisk] = useState<ITRiskAssessment>({
    overall_it_dependency: 'medium',
    systems: [],
    control_environment_rating: 'medium',
    cybersecurity_risk: 'medium',
    data_integrity_risk: 'medium',
    it_general_controls_tested: false
  });

  const updateRiskArea = (index: number, updates: Partial<RiskAreaAssessment>) => {
    const updated = [...riskAreas];
    updated[index] = { ...updated[index], ...updates };

    // Auto-calculate combined risk if inherent or control changed
    if (updates.inherent_risk || updates.control_risk) {
      const inherent = updates.inherent_risk || updated[index].inherent_risk!;
      const control = updates.control_risk || updated[index].control_risk!;
      updated[index].combined_risk = calculateCombinedRisk(inherent, control);
    }

    setRiskAreas(updated);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await createAssessment.mutateAsync({
        engagementId,
        businessProfile,
        riskAreas: riskAreas as Omit<RiskAreaAssessment, 'id' | 'risk_assessment_id' | 'created_at' | 'updated_at'>[],
        fraudRisk,
        itRisk
      });

      onComplete?.(result.id);
      onClose();
    } catch (error) {
      console.error('Error creating risk assessment:', error);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessProfileStep profile={businessProfile} onChange={setBusinessProfile} />;
      case 2:
        return <RiskAreasStep areas={riskAreas} onUpdate={updateRiskArea} />;
      case 3:
        return <FraudRiskStep fraudRisk={fraudRisk} onChange={setFraudRisk} />;
      case 4:
        return <ITRiskStep itRisk={itRisk} onChange={setItRisk} />;
      case 5:
        return (
          <ReviewStep
            businessProfile={businessProfile}
            riskAreas={riskAreas as RiskAreaAssessment[]}
            fraudRisk={fraudRisk}
            itRisk={itRisk}
          />
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    'Business Understanding',
    'Risk Scoring',
    'Fraud Risk Assessment',
    'IT Risk Assessment',
    'Review & Submit'
  ];

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Risk Assessment Wizard</DialogTitle>
          <DialogDescription>
            Step {currentStep} of {TOTAL_STEPS}: {stepTitles[currentStep - 1]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="w-full" />

          <div className="min-h-[400px]">{renderStep()}</div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createAssessment.isPending}
              >
                {createAssessment.isPending ? 'Saving...' : 'Complete Assessment'}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Step Components
const BusinessProfileStep: React.FC<{
  profile: BusinessProfile;
  onChange: (profile: BusinessProfile) => void;
}> = ({ profile, onChange }) => {
  const toggleComplexityFactor = (index: number) => {
    const updated = [...profile.complexity_factors];
    updated[index].is_selected = !updated[index].is_selected;
    onChange({ ...profile, complexity_factors: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="industry">Industry *</Label>
        <Select value={profile.industry} onValueChange={(value) => onChange({ ...profile, industry: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {INDUSTRY_LABELS[industry]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Company Size *</Label>
        <RadioGroup value={profile.company_size} onValueChange={(value: any) => onChange({ ...profile, company_size: value })}>
          {COMPANY_SIZES.map(({ value, label, description }) => (
            <div key={value} className="flex items-center space-x-2">
              <RadioGroupItem value={value} id={value} />
              <Label htmlFor={value} className="cursor-pointer">
                {label} <span className="text-sm text-gray-500">({description})</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="revenue">Revenue Range (Optional)</Label>
        <Input
          id="revenue"
          placeholder="e.g., $10M - $25M"
          value={profile.revenue_range || ''}
          onChange={(e) => onChange({ ...profile, revenue_range: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Complexity Factors</Label>
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {profile.complexity_factors.map((factor, index) => (
                <div key={factor.factor} className="flex items-start space-x-2">
                  <Checkbox
                    id={factor.factor}
                    checked={factor.is_selected}
                    onCheckedChange={() => toggleComplexityFactor(index)}
                  />
                  <Label htmlFor={factor.factor} className="cursor-pointer flex-1">
                    <div className="font-medium">{factor.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Impact: {factor.impact_on_risk === 'increases' ? '↑ Increases' : factor.impact_on_risk === 'decreases' ? '↓ Decreases' : '→ Neutral'} risk
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RiskAreasStep: React.FC<{
  areas: Partial<RiskAreaAssessment>[];
  onUpdate: (index: number, updates: Partial<RiskAreaAssessment>) => void;
}> = ({ areas, onUpdate }) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Rate each financial statement area based on inherent risk (before controls) and control risk (controls won't prevent/detect).
          Combined risk is calculated automatically.
        </AlertDescription>
      </Alert>

      {areas.map((area, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{area.area_name}</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`material-${index}`}
                  checked={area.is_material_area}
                  onCheckedChange={(checked) => onUpdate(index, { is_material_area: !!checked })}
                />
                <Label htmlFor={`material-${index}`} className="cursor-pointer">Material</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Inherent Risk</Label>
                <Select
                  value={area.inherent_risk}
                  onValueChange={(value) => onUpdate(index, { inherent_risk: value as RiskLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Control Risk</Label>
                <Select
                  value={area.control_risk}
                  onValueChange={(value) => onUpdate(index, { control_risk: value as RiskLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_LEVELS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Combined Risk</Label>
                <Badge variant={area.combined_risk === 'significant' || area.combined_risk === 'high' ? 'destructive' : 'outline'} className="w-full justify-center py-2">
                  {area.combined_risk?.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Risk Rationale (Optional)</Label>
              <Textarea
                placeholder="Explain the risk assessment for this area..."
                value={area.risk_rationale || ''}
                onChange={(e) => onUpdate(index, { risk_rationale: e.target.value })}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const FraudRiskStep: React.FC<{
  fraudRisk: FraudRiskAssessment;
  onChange: (fraudRisk: FraudRiskAssessment) => void;
}> = ({ fraudRisk, onChange }) => {
  const toggleFraudFactor = (index: number) => {
    const updated = [...fraudRisk.fraud_factors];
    updated[index].is_present = !updated[index].is_present;
    onChange({ ...fraudRisk, fraud_factors: updated });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Assess fraud risk factors based on the Fraud Triangle: Incentive/Pressure, Opportunity, and Rationalization.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {['incentive', 'opportunity', 'rationalization'].map((category) => {
          const factors = fraudRisk.fraud_factors.filter(f => f.category === category);
          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {factors.map((factor, globalIndex) => {
                  const index = fraudRisk.fraud_factors.indexOf(factor);
                  return (
                    <div key={factor.factor} className="flex items-start space-x-2">
                      <Checkbox
                        id={factor.factor}
                        checked={factor.is_present}
                        onCheckedChange={() => toggleFraudFactor(index)}
                      />
                      <Label htmlFor={factor.factor} className="cursor-pointer flex-1">
                        {factor.description}
                      </Label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label>Overall Fraud Risk</Label>
        <Select
          value={fraudRisk.overall_fraud_risk}
          onValueChange={(value) => onChange({ ...fraudRisk, overall_fraud_risk: value as RiskLevel })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RISK_LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

const ITRiskStep: React.FC<{
  itRisk: ITRiskAssessment;
  onChange: (itRisk: ITRiskAssessment) => void;
}> = ({ itRisk, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Overall IT Dependency</Label>
        <Select
          value={itRisk.overall_it_dependency}
          onValueChange={(value) => onChange({ ...itRisk, overall_it_dependency: value as RiskLevel })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RISK_LEVELS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Control Environment</Label>
          <Select
            value={itRisk.control_environment_rating}
            onValueChange={(value) => onChange({ ...itRisk, control_environment_rating: value as RiskLevel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cybersecurity Risk</Label>
          <Select
            value={itRisk.cybersecurity_risk}
            onValueChange={(value) => onChange({ ...itRisk, cybersecurity_risk: value as RiskLevel })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RISK_LEVELS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          placeholder="Additional IT risk notes..."
          value={itRisk.notes || ''}
          onChange={(e) => onChange({ ...itRisk, notes: e.target.value })}
          rows={4}
        />
      </div>
    </div>
  );
};

const ReviewStep: React.FC<{
  businessProfile: BusinessProfile;
  riskAreas: RiskAreaAssessment[];
  fraudRisk: FraudRiskAssessment;
  itRisk: ITRiskAssessment;
}> = ({ businessProfile, riskAreas, fraudRisk, itRisk }) => {
  const overallRisk = calculateOverallRisk(riskAreas, fraudRisk.overall_fraud_risk, itRisk.overall_it_dependency);
  const selectedComplexity = businessProfile.complexity_factors.filter(f => f.is_selected);
  const selectedFraudFactors = fraudRisk.fraud_factors.filter(f => f.is_present);

  return (
    <div className="space-y-6">
      <Alert className={overallRisk === 'significant' || overallRisk === 'high' ? 'border-red-500' : ''}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Overall Engagement Risk: <strong className="uppercase">{overallRisk}</strong>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Industry:</strong> {INDUSTRY_LABELS[businessProfile.industry]}</div>
          <div><strong>Company Size:</strong> {businessProfile.company_size}</div>
          {selectedComplexity.length > 0 && (
            <div>
              <strong>Complexity Factors:</strong>
              <ul className="list-disc list-inside ml-4 mt-1">
                {selectedComplexity.map(f => (
                  <li key={f.factor}>{f.description}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <RiskHeatMap riskAreas={riskAreas} />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fraud Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div><strong>Overall:</strong> {fraudRisk.overall_fraud_risk.toUpperCase()}</div>
            {selectedFraudFactors.length > 0 && (
              <div className="mt-2 text-sm">
                {selectedFraudFactors.length} fraud risk factor(s) identified
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">IT Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div><strong>Overall:</strong> {itRisk.overall_it_dependency.toUpperCase()}</div>
            <div className="text-sm mt-2">Cybersecurity: {itRisk.cybersecurity_risk}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskAssessmentWizard;
