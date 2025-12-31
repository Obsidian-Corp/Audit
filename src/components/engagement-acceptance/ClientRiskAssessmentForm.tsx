/**
 * ClientRiskAssessmentForm Component
 * Form for assessing client acceptance/continuance risk
 *
 * Implements requirements from:
 * - ISQM 1: Quality Management for Firms
 * - AU-C 220: Quality Control for an Engagement
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import {
  ClientRiskAssessment,
  RiskCategory,
  getRiskCategoryLabel,
} from '@/lib/engagement-acceptance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientRiskAssessmentFormProps {
  assessment?: Partial<ClientRiskAssessment> | null;
  onSave: (data: Partial<ClientRiskAssessment>) => Promise<void>;
  onSubmit: () => Promise<void>;
  isSaving?: boolean;
  isSubmitting?: boolean;
}

type RiskField = {
  key: string;
  label: string;
  description: string;
};

const RISK_COLORS: Record<RiskCategory, string> = {
  low: 'bg-green-100 text-green-800 border-green-300',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  unacceptable: 'bg-red-100 text-red-800 border-red-300',
};

const MANAGEMENT_INTEGRITY_FIELDS: RiskField[] = [
  {
    key: 'reputationInMarket',
    label: 'Reputation in Market',
    description: 'General reputation of management and key owners in the business community',
  },
  {
    key: 'regulatoryHistory',
    label: 'Regulatory History',
    description: 'History of regulatory violations, sanctions, or investigations',
  },
  {
    key: 'litigationHistory',
    label: 'Litigation History',
    description: 'History of litigation, especially fraud-related or shareholder lawsuits',
  },
  {
    key: 'relatedPartyComplexity',
    label: 'Related Party Complexity',
    description: 'Extent and complexity of related party transactions and relationships',
  },
  {
    key: 'ownershipStructure',
    label: 'Ownership Structure',
    description: 'Complexity of ownership structure (shell companies, offshore entities, etc.)',
  },
];

const ENGAGEMENT_RISK_FIELDS: RiskField[] = [
  {
    key: 'industryComplexity',
    label: 'Industry Complexity',
    description: 'Inherent complexity and risk of the client\'s industry',
  },
  {
    key: 'operationalComplexity',
    label: 'Operational Complexity',
    description: 'Complexity of operations (multiple locations, segments, international)',
  },
  {
    key: 'accountingComplexity',
    label: 'Accounting Complexity',
    description: 'Complexity of accounting policies and estimates',
  },
  {
    key: 'itEnvironmentComplexity',
    label: 'IT Environment',
    description: 'Complexity and reliability of IT systems and controls',
  },
  {
    key: 'fraudRisk',
    label: 'Fraud Risk',
    description: 'Susceptibility to fraud based on incentives, opportunities, and rationalization',
  },
  {
    key: 'regulatoryRisk',
    label: 'Regulatory Risk',
    description: 'Level of regulatory scrutiny and compliance requirements',
  },
  {
    key: 'publicInterestRisk',
    label: 'Public Interest',
    description: 'Is this a public interest entity or subject to significant public scrutiny?',
  },
];

export function ClientRiskAssessmentForm({
  assessment,
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
}: ClientRiskAssessmentFormProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      // Management Integrity
      managementIntegrity: {
        reputationInMarket: assessment?.managementIntegrity?.reputationInMarket || 'moderate',
        priorAuditExperience: assessment?.managementIntegrity?.priorAuditExperience || undefined,
        regulatoryHistory: assessment?.managementIntegrity?.regulatoryHistory || 'low',
        litigationHistory: assessment?.managementIntegrity?.litigationHistory || 'low',
        relatedPartyComplexity: assessment?.managementIntegrity?.relatedPartyComplexity || 'moderate',
        ownershipStructure: assessment?.managementIntegrity?.ownershipStructure || 'low',
        notes: assessment?.managementIntegrity?.notes || '',
        redFlags: assessment?.managementIntegrity?.redFlags || [],
        overallAssessment: assessment?.managementIntegrity?.overallAssessment || 'moderate',
      },
      // Financial Stability
      financialStability: {
        goingConcernIndicators: assessment?.financialStability?.goingConcernIndicators || false,
        goingConcernDescription: assessment?.financialStability?.goingConcernDescription || '',
        profitabilityTrend: assessment?.financialStability?.profitabilityTrend || 'stable',
        liquidityPosition: assessment?.financialStability?.liquidityPosition || 'moderate',
        debtLevels: assessment?.financialStability?.debtLevels || 'moderate',
        notes: assessment?.financialStability?.notes || '',
        overallAssessment: assessment?.financialStability?.overallAssessment || 'moderate',
      },
      // Engagement Risk
      engagementRisk: {
        industryComplexity: assessment?.engagementRisk?.industryComplexity || 'moderate',
        operationalComplexity: assessment?.engagementRisk?.operationalComplexity || 'moderate',
        accountingComplexity: assessment?.engagementRisk?.accountingComplexity || 'moderate',
        itEnvironmentComplexity: assessment?.engagementRisk?.itEnvironmentComplexity || 'moderate',
        fraudRisk: assessment?.engagementRisk?.fraudRisk || 'moderate',
        regulatoryRisk: assessment?.engagementRisk?.regulatoryRisk || 'low',
        publicInterestRisk: assessment?.engagementRisk?.publicInterestRisk || 'low',
        specialistRequired: assessment?.engagementRisk?.specialistRequired || false,
        specialistTypes: assessment?.engagementRisk?.specialistTypes || [],
        notes: assessment?.engagementRisk?.notes || '',
        overallAssessment: assessment?.engagementRisk?.overallAssessment || 'moderate',
      },
      // Overall
      acceptanceRecommendation: assessment?.acceptanceRecommendation || 'accept',
      conditions: assessment?.conditions?.join('\n') || '',
      declineReason: assessment?.declineReason || '',
    },
  });

  const watchGoingConcern = watch('financialStability.goingConcernIndicators');
  const watchSpecialist = watch('engagementRisk.specialistRequired');
  const watchRecommendation = watch('acceptanceRecommendation');

  const handleSaveForm = async (data: any) => {
    // Calculate overall assessments for each section
    const managementRisks = [
      data.managementIntegrity.reputationInMarket,
      data.managementIntegrity.regulatoryHistory,
      data.managementIntegrity.litigationHistory,
      data.managementIntegrity.relatedPartyComplexity,
      data.managementIntegrity.ownershipStructure,
    ];
    data.managementIntegrity.overallAssessment = calculateSectionRisk(managementRisks);

    const financialRisks = [
      data.financialStability.liquidityPosition,
      data.financialStability.debtLevels,
    ];
    if (data.financialStability.goingConcernIndicators) {
      financialRisks.push('high');
    }
    data.financialStability.overallAssessment = calculateSectionRisk(financialRisks);

    const engagementRisks = [
      data.engagementRisk.industryComplexity,
      data.engagementRisk.operationalComplexity,
      data.engagementRisk.accountingComplexity,
      data.engagementRisk.itEnvironmentComplexity,
      data.engagementRisk.fraudRisk,
      data.engagementRisk.regulatoryRisk,
      data.engagementRisk.publicInterestRisk,
    ];
    data.engagementRisk.overallAssessment = calculateSectionRisk(engagementRisks);

    // Process conditions
    const conditions = data.conditions
      ? data.conditions.split('\n').filter((c: string) => c.trim())
      : [];

    await onSave({
      ...data,
      conditions,
    });
  };

  const calculateSectionRisk = (risks: RiskCategory[]): RiskCategory => {
    const riskOrder: RiskCategory[] = ['low', 'moderate', 'high', 'unacceptable'];
    const scores = risks.map((r) => riskOrder.indexOf(r));
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (maxScore === 3) return 'unacceptable';
    if (maxScore === 2 || avgScore >= 1.5) return 'high';
    if (avgScore >= 0.5) return 'moderate';
    return 'low';
  };

  const RiskSelector = ({
    name,
    label,
    description,
  }: {
    name: string;
    label: string;
    description: string;
  }) => {
    const value = watch(name as any) as RiskCategory;

    return (
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <Label className="text-sm font-medium">{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Badge className={cn('ml-2', RISK_COLORS[value])}>{getRiskCategoryLabel(value)}</Badge>
        </div>
        <RadioGroup
          value={value}
          onValueChange={(v) => setValue(name as any, v as RiskCategory, { shouldDirty: true })}
          className="flex gap-4"
        >
          {(['low', 'moderate', 'high', 'unacceptable'] as RiskCategory[]).map((risk) => (
            <div key={risk} className="flex items-center space-x-2">
              <RadioGroupItem value={risk} id={`${name}-${risk}`} />
              <Label htmlFor={`${name}-${risk}`} className="text-sm cursor-pointer">
                {getRiskCategoryLabel(risk)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  // Calculate progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 15; // Total number of required fields

    // Count filled management integrity fields
    const mi = watch('managementIntegrity');
    if (mi.reputationInMarket) completed++;
    if (mi.regulatoryHistory) completed++;
    if (mi.litigationHistory) completed++;
    if (mi.relatedPartyComplexity) completed++;
    if (mi.ownershipStructure) completed++;

    // Count filled financial stability fields
    const fs = watch('financialStability');
    if (fs.liquidityPosition) completed++;
    if (fs.debtLevels) completed++;
    if (fs.profitabilityTrend) completed++;

    // Count filled engagement risk fields
    const er = watch('engagementRisk');
    if (er.industryComplexity) completed++;
    if (er.operationalComplexity) completed++;
    if (er.accountingComplexity) completed++;
    if (er.itEnvironmentComplexity) completed++;
    if (er.fraudRisk) completed++;
    if (er.regulatoryRisk) completed++;
    if (er.publicInterestRisk) completed++;

    return Math.round((completed / total) * 100);
  };

  return (
    <form onSubmit={handleSubmit(handleSaveForm)} className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Assessment Progress</span>
          <span className="font-medium">{calculateProgress()}%</span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>

      {/* Management Integrity Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Management Integrity Assessment
          </CardTitle>
          <CardDescription>
            Assess the integrity and ethical values of management and those charged with
            governance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MANAGEMENT_INTEGRITY_FIELDS.map((field) => (
            <RiskSelector
              key={field.key}
              name={`managementIntegrity.${field.key}`}
              label={field.label}
              description={field.description}
            />
          ))}

          <div>
            <Label>Red Flags Identified</Label>
            <Textarea
              {...register('managementIntegrity.notes')}
              placeholder="Document any red flags or concerns about management integrity..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Stability Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Stability Assessment
          </CardTitle>
          <CardDescription>
            Assess the client's financial condition and ability to continue as a going concern
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Going Concern */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="goingConcern"
                checked={watchGoingConcern}
                onCheckedChange={(checked) =>
                  setValue('financialStability.goingConcernIndicators', checked as boolean, {
                    shouldDirty: true,
                  })
                }
              />
              <Label htmlFor="goingConcern" className="font-medium">
                Going Concern Indicators Present
              </Label>
            </div>
            {watchGoingConcern && (
              <Textarea
                {...register('financialStability.goingConcernDescription')}
                placeholder="Describe the going concern indicators..."
                rows={3}
              />
            )}
          </div>

          {/* Profitability Trend */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <Label>Profitability Trend</Label>
            <RadioGroup
              value={watch('financialStability.profitabilityTrend')}
              onValueChange={(v) =>
                setValue('financialStability.profitabilityTrend', v as any, { shouldDirty: true })
              }
              className="flex gap-4"
            >
              {['improving', 'stable', 'declining'].map((trend) => (
                <div key={trend} className="flex items-center space-x-2">
                  <RadioGroupItem value={trend} id={`profitability-${trend}`} />
                  <Label htmlFor={`profitability-${trend}`} className="capitalize cursor-pointer">
                    {trend}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <RiskSelector
            name="financialStability.liquidityPosition"
            label="Liquidity Position"
            description="Current ratio, quick ratio, and working capital adequacy"
          />

          <RiskSelector
            name="financialStability.debtLevels"
            label="Debt Levels"
            description="Leverage ratios and debt covenant compliance"
          />

          <div>
            <Label>Financial Stability Notes</Label>
            <Textarea
              {...register('financialStability.notes')}
              placeholder="Additional notes on financial stability..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Engagement Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Engagement Risk Assessment
          </CardTitle>
          <CardDescription>
            Assess the inherent and control risks associated with the engagement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ENGAGEMENT_RISK_FIELDS.map((field) => (
            <RiskSelector
              key={field.key}
              name={`engagementRisk.${field.key}`}
              label={field.label}
              description={field.description}
            />
          ))}

          {/* Specialist Required */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="specialist"
                checked={watchSpecialist}
                onCheckedChange={(checked) =>
                  setValue('engagementRisk.specialistRequired', checked as boolean, {
                    shouldDirty: true,
                  })
                }
              />
              <Label htmlFor="specialist" className="font-medium">
                Specialist Required (AU-C 620)
              </Label>
            </div>
            {watchSpecialist && (
              <div>
                <Label>Types of Specialists Needed</Label>
                <Textarea
                  placeholder="e.g., Valuation specialist, IT auditor, Actuary..."
                  rows={2}
                  onChange={(e) =>
                    setValue(
                      'engagementRisk.specialistTypes',
                      e.target.value.split(',').map((s) => s.trim()),
                      { shouldDirty: true }
                    )
                  }
                  defaultValue={watch('engagementRisk.specialistTypes')?.join(', ')}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Engagement Risk Notes</Label>
            <Textarea
              {...register('engagementRisk.notes')}
              placeholder="Additional notes on engagement risks..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Acceptance Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acceptance Recommendation</CardTitle>
          <CardDescription>
            Based on the assessment above, provide your recommendation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={watchRecommendation}
            onValueChange={(v) => setValue('acceptanceRecommendation', v as any, { shouldDirty: true })}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="accept" id="accept" className="mt-1" />
              <div>
                <Label htmlFor="accept" className="font-medium cursor-pointer">
                  <CheckCircle2 className="h-4 w-4 inline mr-2 text-green-600" />
                  Accept Engagement
                </Label>
                <p className="text-sm text-muted-foreground">
                  No significant concerns identified. Proceed with engagement.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="accept_with_conditions" id="conditions" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="conditions" className="font-medium cursor-pointer">
                  <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-600" />
                  Accept with Conditions
                </Label>
                <p className="text-sm text-muted-foreground">
                  Concerns exist that require specific conditions or safeguards.
                </p>
                {watchRecommendation === 'accept_with_conditions' && (
                  <Textarea
                    {...register('conditions')}
                    placeholder="Enter conditions (one per line)..."
                    rows={3}
                    className="mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg border-red-200 bg-red-50">
              <RadioGroupItem value="decline" id="decline" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="decline" className="font-medium cursor-pointer text-red-800">
                  <AlertCircle className="h-4 w-4 inline mr-2 text-red-600" />
                  Decline Engagement
                </Label>
                <p className="text-sm text-red-700">
                  Significant concerns that preclude acceptance of the engagement.
                </p>
                {watchRecommendation === 'decline' && (
                  <Textarea
                    {...register('declineReason')}
                    placeholder="Document the reasons for declining..."
                    rows={3}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="submit" variant="outline" disabled={isSaving || !isDirty}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || calculateProgress() < 100}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit for Review
        </Button>
      </div>
    </form>
  );
}

export default ClientRiskAssessmentForm;
