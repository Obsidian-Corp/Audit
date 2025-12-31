/**
 * IndependenceDeclarationForm Component
 * Form for team members to declare their independence status
 *
 * Implements requirements from:
 * - AU-C 220: Quality Control for an Engagement
 * - AICPA Code of Professional Conduct ET Section 1.200
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  IndependenceDeclaration,
  IndependenceThreat,
  IndependenceThreatType,
  IndependenceThreatLevel,
  FinancialRelationship,
  PersonalRelationship,
  getThreatTypeLabel,
} from '@/lib/engagement-acceptance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Shield,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndependenceDeclarationFormProps {
  declaration?: Partial<IndependenceDeclaration>;
  onSave: (data: Partial<IndependenceDeclaration>) => Promise<void>;
  onCertify: (declarationId: string) => Promise<void>;
  isSaving?: boolean;
  isCertifying?: boolean;
}

interface FormData {
  hasFinancialInterest: boolean;
  financialRelationships: FinancialRelationship[];
  hasPersonalRelationship: boolean;
  personalRelationships: PersonalRelationship[];
  hasServiceConflict: boolean;
  serviceConflicts: { serviceType: string; description: string }[];
  hasFeeArrangementIssue: boolean;
  feeArrangementDescription: string;
  hasOtherThreat: boolean;
  otherThreats: string;
}

const THREAT_LEVEL_COLORS: Record<IndependenceThreatLevel, string> = {
  none: 'bg-green-100 text-green-800',
  low: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  unacceptable: 'bg-red-100 text-red-800',
};

export function IndependenceDeclarationForm({
  declaration,
  onSave,
  onCertify,
  isSaving,
  isCertifying,
}: IndependenceDeclarationFormProps) {
  const [showCertifyDialog, setShowCertifyDialog] = useState(false);

  const {
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      hasFinancialInterest: declaration?.hasFinancialInterest || false,
      financialRelationships: declaration?.financialRelationships || [],
      hasPersonalRelationship: declaration?.hasPersonalRelationship || false,
      personalRelationships: declaration?.personalRelationships || [],
      hasServiceConflict: declaration?.hasServiceConflict || false,
      serviceConflicts: declaration?.serviceConflicts || [],
      hasFeeArrangementIssue: declaration?.hasFeeArrangementIssue || false,
      feeArrangementDescription: declaration?.feeArrangementDescription || '',
      hasOtherThreat: declaration?.hasOtherThreat || false,
      otherThreats: declaration?.otherThreats || '',
    },
  });

  const {
    fields: financialFields,
    append: appendFinancial,
    remove: removeFinancial,
  } = useFieldArray({
    control,
    name: 'financialRelationships',
  });

  const {
    fields: personalFields,
    append: appendPersonal,
    remove: removePersonal,
  } = useFieldArray({
    control,
    name: 'personalRelationships',
  });

  const watchHasFinancial = watch('hasFinancialInterest');
  const watchHasPersonal = watch('hasPersonalRelationship');
  const watchHasService = watch('hasServiceConflict');
  const watchHasFee = watch('hasFeeArrangementIssue');
  const watchHasOther = watch('hasOtherThreat');

  const handleSave = async (data: FormData) => {
    // Assess threats based on responses
    const threats: IndependenceThreat[] = [];

    if (data.hasFinancialInterest && data.financialRelationships.some((r) => r.isProblem)) {
      threats.push({
        type: 'self_interest',
        description: 'Financial relationships that may impair independence',
        level: 'high',
      });
    }

    if (data.hasPersonalRelationship && data.personalRelationships.some((r) => r.isProblem)) {
      threats.push({
        type: 'familiarity',
        description: 'Personal relationships with client personnel',
        level: 'moderate',
      });
    }

    if (data.hasServiceConflict) {
      threats.push({
        type: 'self_review',
        description: 'Services that may create self-review threat',
        level: 'moderate',
      });
    }

    // Determine overall assessment
    let overallAssessment: IndependenceThreatLevel = 'none';
    if (threats.some((t) => t.level === 'unacceptable')) {
      overallAssessment = 'unacceptable';
    } else if (threats.some((t) => t.level === 'high')) {
      overallAssessment = 'high';
    } else if (threats.some((t) => t.level === 'moderate')) {
      overallAssessment = 'moderate';
    } else if (threats.length > 0) {
      overallAssessment = 'low';
    }

    await onSave({
      ...data,
      threats,
      overallAssessment,
    });
  };

  const handleCertify = async () => {
    if (declaration?.id) {
      await onCertify(declaration.id);
      setShowCertifyDialog(false);
    }
  };

  const hasAnyIssues =
    watchHasFinancial || watchHasPersonal || watchHasService || watchHasFee || watchHasOther;

  return (
    <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
      {/* Status Banner */}
      {declaration?.isCertified ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Independence Certified</p>
            <p className="text-sm text-green-700">
              Certified on{' '}
              {declaration.certifiedAt
                ? new Date(declaration.certifiedAt).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      ) : declaration?.overallAssessment === 'high' ||
        declaration?.overallAssessment === 'unacceptable' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Independence Issues Identified</p>
            <p className="text-sm text-red-700">
              Please address the identified threats before certifying
            </p>
          </div>
        </div>
      ) : null}

      {/* Financial Interests Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Checkbox
              checked={watchHasFinancial}
              onCheckedChange={(checked) =>
                setValue('hasFinancialInterest', checked as boolean, { shouldDirty: true })
              }
            />
            Financial Interests
          </CardTitle>
          <CardDescription>
            Do you or any immediate family member have any direct or indirect financial interest
            in the client?
          </CardDescription>
        </CardHeader>
        {watchHasFinancial && (
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Direct financial interests include stocks, bonds, notes, or other securities.
                Indirect interests include mutual funds that invest in the client.
              </p>
            </div>

            {financialFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Financial Relationship #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFinancial(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={watch(`financialRelationships.${index}.type`)}
                      onValueChange={(value) =>
                        setValue(`financialRelationships.${index}.type`, value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct_investment">Direct Investment</SelectItem>
                        <SelectItem value="indirect_investment">Indirect Investment</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Amount (if applicable)</Label>
                    <Input
                      type="number"
                      {...register(`financialRelationships.${index}.amount`)}
                      placeholder="$0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    {...register(`financialRelationships.${index}.description`)}
                    placeholder="Describe the financial relationship"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={watch(`financialRelationships.${index}.isProblem`)}
                    onCheckedChange={(checked) =>
                      setValue(`financialRelationships.${index}.isProblem`, checked as boolean)
                    }
                  />
                  <Label>This relationship may impair independence</Label>
                </div>

                {watch(`financialRelationships.${index}.isProblem`) && (
                  <div>
                    <Label>Resolution/Safeguard</Label>
                    <Textarea
                      {...register(`financialRelationships.${index}.resolution`)}
                      placeholder="Describe how this will be resolved or what safeguards are in place"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendFinancial({
                  type: 'direct_investment',
                  description: '',
                  isProblem: false,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Financial Relationship
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Personal Relationships Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Checkbox
              checked={watchHasPersonal}
              onCheckedChange={(checked) =>
                setValue('hasPersonalRelationship', checked as boolean, { shouldDirty: true })
              }
            />
            Personal Relationships
          </CardTitle>
          <CardDescription>
            Do you have any close personal relationships with client management or those charged
            with governance?
          </CardDescription>
        </CardHeader>
        {watchHasPersonal && (
          <CardContent className="space-y-4">
            {personalFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Personal Relationship #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePersonal(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client Person</Label>
                    <Input
                      {...register(`personalRelationships.${index}.clientPerson`)}
                      placeholder="Name and title"
                    />
                  </div>

                  <div>
                    <Label>Relationship Type</Label>
                    <Select
                      value={watch(`personalRelationships.${index}.relationship`)}
                      onValueChange={(value) =>
                        setValue(`personalRelationships.${index}.relationship`, value as any)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family_member">Family Member</SelectItem>
                        <SelectItem value="close_friend">Close Friend</SelectItem>
                        <SelectItem value="business_partner">Business Partner</SelectItem>
                        <SelectItem value="former_employer">Former Employer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    {...register(`personalRelationships.${index}.description`)}
                    placeholder="Describe the nature of the relationship"
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={watch(`personalRelationships.${index}.isProblem`)}
                    onCheckedChange={(checked) =>
                      setValue(`personalRelationships.${index}.isProblem`, checked as boolean)
                    }
                  />
                  <Label>This relationship may impair independence</Label>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                appendPersonal({
                  teamMember: '',
                  clientPerson: '',
                  relationship: 'other',
                  description: '',
                  isProblem: false,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Personal Relationship
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Service Conflicts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Checkbox
              checked={watchHasService}
              onCheckedChange={(checked) =>
                setValue('hasServiceConflict', checked as boolean, { shouldDirty: true })
              }
            />
            Non-Audit Services
          </CardTitle>
          <CardDescription>
            Has your firm provided any non-audit services to this client that may create a
            self-review or management participation threat?
          </CardDescription>
        </CardHeader>
        {watchHasService && (
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Services such as bookkeeping, financial statement preparation, internal audit
                outsourcing, and certain tax services may create independence threats.
              </p>
            </div>

            <Textarea
              {...register('serviceConflicts.0.description')}
              placeholder="Describe any non-audit services provided and their impact on independence"
              rows={4}
            />
          </CardContent>
        )}
      </Card>

      {/* Fee Arrangements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Checkbox
              checked={watchHasFee}
              onCheckedChange={(checked) =>
                setValue('hasFeeArrangementIssue', checked as boolean, { shouldDirty: true })
              }
            />
            Fee Arrangements
          </CardTitle>
          <CardDescription>
            Are there any fee arrangements (contingent fees, overdue fees, fee disputes) that may
            impair independence?
          </CardDescription>
        </CardHeader>
        {watchHasFee && (
          <CardContent>
            <Textarea
              {...register('feeArrangementDescription')}
              placeholder="Describe the fee arrangement issues"
              rows={3}
            />
          </CardContent>
        )}
      </Card>

      {/* Other Threats Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Checkbox
              checked={watchHasOther}
              onCheckedChange={(checked) =>
                setValue('hasOtherThreat', checked as boolean, { shouldDirty: true })
              }
            />
            Other Independence Matters
          </CardTitle>
          <CardDescription>
            Are there any other matters that may impair your independence?
          </CardDescription>
        </CardHeader>
        {watchHasOther && (
          <CardContent>
            <Textarea
              {...register('otherThreats')}
              placeholder="Describe any other independence concerns"
              rows={3}
            />
          </CardContent>
        )}
      </Card>

      {/* Existing Threats Display */}
      {declaration?.threats && declaration.threats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identified Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {declaration.threats.map((threat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{getThreatTypeLabel(threat.type)}</p>
                    <p className="text-sm text-muted-foreground">{threat.description}</p>
                  </div>
                  <Badge className={THREAT_LEVEL_COLORS[threat.level]}>{threat.level}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          {declaration?.overallAssessment && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Overall Assessment:</span>
              <Badge className={THREAT_LEVEL_COLORS[declaration.overallAssessment]}>
                {declaration.overallAssessment}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="outline" disabled={isSaving || !isDirty}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Draft
          </Button>

          {declaration?.id && !declaration.isCertified && (
            <AlertDialog open={showCertifyDialog} onOpenChange={setShowCertifyDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  disabled={
                    isCertifying ||
                    declaration.overallAssessment === 'unacceptable' ||
                    hasAnyIssues
                  }
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Certify Independence
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Certify Independence</AlertDialogTitle>
                  <AlertDialogDescription>
                    By certifying, you confirm that:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>
                        You have no financial or personal relationships that would impair your
                        objectivity
                      </li>
                      <li>
                        You are not aware of any circumstances that would compromise your
                        independence
                      </li>
                      <li>You have disclosed all potential threats to independence</li>
                      <li>
                        You will notify the engagement partner if any circumstances change during
                        the engagement
                      </li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCertify}>
                    {isCertifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Certify
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </form>
  );
}

export default IndependenceDeclarationForm;
