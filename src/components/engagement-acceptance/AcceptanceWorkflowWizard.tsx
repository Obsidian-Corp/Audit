/**
 * AcceptanceWorkflowWizard Component
 * Main wizard component for the engagement acceptance workflow
 *
 * Guides users through:
 * 1. Independence declarations
 * 2. Client risk assessment
 * 3. Engagement letter
 * 4. Partner approval (if required)
 */

import React, { useState } from 'react';
import { useEngagementAcceptance } from '@/hooks/useEngagementAcceptance';
import { AcceptanceStage } from '@/lib/engagement-acceptance';
import { IndependenceDeclarationForm } from './IndependenceDeclarationForm';
import { ClientRiskAssessmentForm } from './ClientRiskAssessmentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  Circle,
  Lock,
  Shield,
  FileSearch,
  FileText,
  Users,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcceptanceWorkflowWizardProps {
  engagementId: string;
  onComplete?: () => void;
}

interface StageConfig {
  stage: AcceptanceStage;
  label: string;
  description: string;
  icon: React.ElementType;
}

const STAGES: StageConfig[] = [
  {
    stage: 'independence_check',
    label: 'Independence',
    description: 'Team independence declarations',
    icon: Shield,
  },
  {
    stage: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Client acceptance risk assessment',
    icon: FileSearch,
  },
  {
    stage: 'engagement_letter',
    label: 'Engagement Letter',
    description: 'Prepare and sign engagement letter',
    icon: FileText,
  },
  {
    stage: 'partner_approval',
    label: 'Partner Approval',
    description: 'Partner review and approval',
    icon: Users,
  },
];

export function AcceptanceWorkflowWizard({
  engagementId,
  onComplete,
}: AcceptanceWorkflowWizardProps) {
  const {
    workflow,
    currentStage,
    stageStatus,
    isLoading,
    independence,
    riskAssessment,
    engagementLetter,
    completeIndependence,
    completeRiskAssessment,
    completeEngagementLetter,
    completeAcceptance,
    isPartner,
    canCompleteAcceptance,
  } = useEngagementAcceptance(engagementId);

  const [activeTab, setActiveTab] = useState<AcceptanceStage>(currentStage);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Calculate overall progress
  const calculateProgress = () => {
    let completed = 0;
    if (stageStatus.independence_check.complete) completed++;
    if (stageStatus.risk_assessment.complete) completed++;
    if (stageStatus.engagement_letter.complete) completed++;
    if (!stageStatus.partner_approval.required || stageStatus.partner_approval.complete) {
      completed++;
    }

    const total = stageStatus.partner_approval.required ? 4 : 3;
    return Math.round((completed / total) * 100);
  };

  const handleCompleteAcceptance = async () => {
    setIsCompleting(true);
    try {
      await completeAcceptance();
      setShowCompleteDialog(false);
      onComplete?.();
    } finally {
      setIsCompleting(false);
    }
  };

  const getStageIcon = (stage: AcceptanceStage) => {
    const status = stageStatus[stage];
    if (status.complete) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (status.current) {
      return <Circle className="h-5 w-5 text-blue-600 fill-blue-100" />;
    }
    return <Lock className="h-5 w-5 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Check if workflow is complete
  if (workflow?.isComplete) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Engagement Accepted</h2>
          <p className="text-muted-foreground mb-6">
            All acceptance requirements have been completed successfully.
          </p>
          <Button onClick={onComplete}>Continue to Planning</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Engagement Acceptance Workflow</CardTitle>
              <CardDescription>
                Complete all required steps to accept this engagement
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-sm px-3 py-1',
                calculateProgress() === 100
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-blue-500 bg-blue-50 text-blue-700'
              )}
            >
              {calculateProgress()}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={calculateProgress()} className="h-2 mb-6" />

          {/* Stage Navigation */}
          <div className="flex items-center justify-between">
            {STAGES.filter(
              (s) =>
                s.stage !== 'partner_approval' ||
                stageStatus.partner_approval.required
            ).map((stage, index, arr) => {
              const status = stageStatus[stage.stage];
              const Icon = stage.icon;
              const isLast = index === arr.length - 1;

              return (
                <React.Fragment key={stage.stage}>
                  <button
                    onClick={() => {
                      if (status.complete || status.current) {
                        setActiveTab(stage.stage);
                      }
                    }}
                    disabled={!status.complete && !status.current}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg transition-colors',
                      status.current && 'bg-blue-50',
                      status.complete && 'hover:bg-gray-50 cursor-pointer',
                      !status.complete && !status.current && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center border-2',
                        status.complete && 'bg-green-100 border-green-500',
                        status.current && 'bg-blue-100 border-blue-500',
                        !status.complete && !status.current && 'bg-gray-100 border-gray-300'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          status.complete && 'text-green-600',
                          status.current && 'text-blue-600',
                          !status.complete && !status.current && 'text-gray-400'
                        )}
                      />
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          'font-medium text-sm',
                          status.current && 'text-blue-700',
                          status.complete && 'text-green-700'
                        )}
                      >
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[100px]">
                        {stage.description}
                      </p>
                    </div>
                  </button>
                  {!isLast && (
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AcceptanceStage)}>
        <TabsList className="hidden">
          {STAGES.map((stage) => (
            <TabsTrigger key={stage.stage} value={stage.stage}>
              {stage.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Independence Tab */}
        <TabsContent value="independence_check" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Independence Declarations
                  </CardTitle>
                  <CardDescription>
                    All engagement team members must certify their independence
                  </CardDescription>
                </div>
                {stageStatus.independence_check.complete && (
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Team Member Declarations Summary */}
              {independence.declarations && independence.declarations.length > 0 && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-medium">Team Members</h4>
                  {independence.declarations.map((decl) => (
                    <div
                      key={decl.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {decl.isCertified ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{decl.teamMemberName}</p>
                          <p className="text-sm text-muted-foreground">{decl.teamMemberRole}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          decl.isCertified
                            ? 'border-green-500 text-green-700'
                            : 'border-yellow-500 text-yellow-700'
                        }
                      >
                        {decl.isCertified ? 'Certified' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* My Declaration Form */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-4">Your Independence Declaration</h4>
                <IndependenceDeclarationForm
                  declaration={independence.myDeclaration || undefined}
                  onSave={independence.saveDeclaration}
                  onCertify={independence.certifyIndependence}
                  isSaving={independence.isSaving}
                  isCertifying={independence.isCertifying}
                />
              </div>

              {/* Complete Stage Button */}
              {independence.overallIndependence?.isIndependent &&
                !stageStatus.independence_check.complete && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={completeIndependence}>
                      Complete Independence Check
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk_assessment" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileSearch className="h-5 w-5" />
                    Client Risk Assessment
                  </CardTitle>
                  <CardDescription>
                    Assess client acceptance/continuance risks per ISQM 1
                  </CardDescription>
                </div>
                {stageStatus.risk_assessment.complete && (
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!stageStatus.independence_check.complete ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Complete the independence check first to unlock this step
                  </p>
                </div>
              ) : (
                <>
                  <ClientRiskAssessmentForm
                    assessment={riskAssessment.assessment}
                    onSave={riskAssessment.saveAssessment}
                    onSubmit={riskAssessment.submitForReview}
                    isSaving={riskAssessment.isSaving}
                    isSubmitting={riskAssessment.isSubmitting}
                  />

                  {riskAssessment.assessment?.isComplete &&
                    !stageStatus.risk_assessment.complete && (
                      <div className="mt-6 flex justify-end">
                        <Button onClick={completeRiskAssessment}>
                          Complete Risk Assessment
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Letter Tab */}
        <TabsContent value="engagement_letter" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Engagement Letter
                  </CardTitle>
                  <CardDescription>
                    Prepare and obtain signed engagement letter per AU-C 210
                  </CardDescription>
                </div>
                {stageStatus.engagement_letter.complete && (
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!stageStatus.risk_assessment.complete ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Complete the risk assessment first to unlock this step
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Letter Status */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Letter Status</h4>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          engagementLetter.letter?.status === 'signed' &&
                            'border-green-500 bg-green-50 text-green-700',
                          engagementLetter.letter?.status === 'pending_client' &&
                            'border-yellow-500 bg-yellow-50 text-yellow-700',
                          engagementLetter.letter?.status === 'draft' &&
                            'border-blue-500 bg-blue-50 text-blue-700'
                        )}
                      >
                        {engagementLetter.letter?.status || 'Not Created'}
                      </Badge>
                      {engagementLetter.letter?.version && (
                        <span className="text-sm text-muted-foreground">
                          Version {engagementLetter.letter.version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TODO: Add Engagement Letter Form */}
                  <div className="text-center py-8 border rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Engagement letter form will be implemented here
                    </p>
                    {engagementLetter.letter?.status === 'draft' && (
                      <Button onClick={() => engagementLetter.sendToClient()}>
                        Send to Client
                      </Button>
                    )}
                    {engagementLetter.letter?.status === 'pending_client' && (
                      <Button
                        onClick={() =>
                          engagementLetter.recordClientSignature({
                            signedBy: 'Client Representative',
                            title: 'CFO',
                            organization: 'Client Company',
                          })
                        }
                      >
                        Record Client Signature
                      </Button>
                    )}
                  </div>

                  {engagementLetter.letter?.status === 'signed' &&
                    !stageStatus.engagement_letter.complete && (
                      <div className="flex justify-end">
                        <Button onClick={completeEngagementLetter}>
                          Complete Engagement Letter
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partner Approval Tab */}
        <TabsContent value="partner_approval" className="mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Partner Approval
                  </CardTitle>
                  <CardDescription>
                    Partner review and approval required for high-risk engagements
                  </CardDescription>
                </div>
                {stageStatus.partner_approval.complete && (
                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!stageStatus.engagement_letter.complete ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Complete the engagement letter first to unlock this step
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Risk Summary */}
                  {riskAssessment.assessment && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            Partner Approval Required
                          </h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            This engagement requires partner approval due to elevated risk
                            factors identified in the risk assessment.
                          </p>
                          <div className="mt-3">
                            <Badge className="bg-yellow-200 text-yellow-800">
                              Overall Risk: {riskAssessment.assessment.overallRiskRating}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partner Actions */}
                  {isPartner ? (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() =>
                          riskAssessment.approveAsPartner({
                            approved: false,
                            notes: 'Engagement declined by partner',
                          })
                        }
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() =>
                          riskAssessment.approveAsPartner({
                            approved: true,
                            notes: 'Approved by engagement partner',
                          })
                        }
                      >
                        Approve Engagement
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        Waiting for partner approval...
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Acceptance Button */}
      {canCompleteAcceptance.canComplete && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Ready to Accept Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  All acceptance requirements have been completed
                </p>
              </div>
              <Button size="lg" onClick={() => setShowCompleteDialog(true)}>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Accept Engagement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockers Display */}
      {!canCompleteAcceptance.canComplete && canCompleteAcceptance.blockers.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <h4 className="font-medium text-yellow-800 mb-2">Requirements to Complete</h4>
            <ul className="space-y-1">
              {canCompleteAcceptance.blockers.map((blocker, i) => (
                <li key={i} className="text-sm text-yellow-700 flex items-center gap-2">
                  <Circle className="h-2 w-2 fill-yellow-500" />
                  {blocker}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Engagement</AlertDialogTitle>
            <AlertDialogDescription>
              By accepting this engagement, you confirm that:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All team members have confirmed independence</li>
                <li>Client risk assessment has been completed and approved</li>
                <li>Engagement letter has been signed by both parties</li>
                <li>
                  The firm has the competence, capabilities, and resources to perform the
                  engagement
                </li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteAcceptance} disabled={isCompleting}>
              {isCompleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Accept Engagement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default AcceptanceWorkflowWizard;
