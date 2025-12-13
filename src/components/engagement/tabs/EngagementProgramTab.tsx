import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useEngagementPrograms } from '@/hooks/useEngagementPrograms';
import { useEngagementProcedures } from '@/hooks/useEngagementProcedures';
import { useRiskAssessment } from '@/hooks/useRiskAssessment';
import { ApplyProgramDialog } from '@/components/audit/programs/ApplyProgramDialog';
import { EnhancedProgramBuilderWizard } from '@/components/audit/program/EnhancedProgramBuilderWizard';
import { RiskAssessmentRequiredView } from '@/components/audit/EmptyStates/RiskAssessmentRequiredView';
import { RiskAssessmentSummaryCard } from '@/components/audit/risk/RiskAssessmentSummaryCard';
import { RiskCoverageStatusCard } from '@/components/audit/risk/RiskCoverageStatusCard';
import { RiskAssessmentWizard } from '@/components/audit/risk/RiskAssessmentWizard';
import { RiskRequirementGate } from '@/components/engagement/RiskRequirementGate';
import { Plus, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SamplingCalculator } from '@/components/audit-tools/SamplingCalculator';
import { Separator } from '@/components/ui/separator';

interface EngagementProgramTabProps {
  engagementId: string;
  engagementName: string;
}

export function EngagementProgramTab({ engagementId, engagementName }: EngagementProgramTabProps) {
  const navigate = useNavigate();
  const { programs, isLoading: programsLoading } = useEngagementPrograms(engagementId);
  const { procedures, isLoading: proceduresLoading } = useEngagementProcedures(engagementId);
  const { data: riskAssessment, isLoading: riskLoading } = useRiskAssessment(engagementId);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [riskWizardOpen, setRiskWizardOpen] = useState(false);

  const activeProgram = programs?.[0];

  const proceduresByStatus = {
    not_started: procedures?.filter(p => p.status === 'not_started').length || 0,
    in_progress: procedures?.filter(p => p.status === 'in_progress').length || 0,
    in_review: procedures?.filter(p => p.status === 'in_review').length || 0,
    complete: procedures?.filter(p => p.status === 'complete').length || 0,
  };

  const completionRate = procedures?.length
    ? Math.round((proceduresByStatus.complete / procedures.length) * 100)
    : 0;

  const unassignedCount = procedures?.filter(p => !p.assigned_to).length || 0;
  const assignedCount = procedures?.filter(p => p.assigned_to).length || 0;

  if (programsLoading || proceduresLoading || riskLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // STATE 1: No Risk Assessment → Show Risk Assessment Required View
  if (!riskAssessment) {
    return (
      <>
        <RiskAssessmentRequiredView
          onStartRiskAssessment={() => setRiskWizardOpen(true)}
          onSkipToManual={() => setApplyDialogOpen(true)}
        />

        <RiskAssessmentWizard
          engagementId={engagementId}
          open={riskWizardOpen}
          onOpenChange={setRiskWizardOpen}
          onComplete={() => {
            setRiskWizardOpen(false);
          }}
        />

        <ApplyProgramDialog
          engagementId={engagementId}
          engagementName={engagementName}
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
        />
      </>
    );
  }

  // STATE 2: Risk Assessment exists but no program → Show Build Program CTA
  // Wrapped in RiskRequirementGate to enforce AU-C 315 compliance
  if (!activeProgram) {
    return (
      <RiskRequirementGate engagementId={engagementId} engagementName={engagementName}>
        <div className="space-y-6">
          <RiskAssessmentSummaryCard
            assessment={riskAssessment}
            mode="full"
            onReassess={() => setRiskWizardOpen(true)}
            onBuildProgram={() => setApplyDialogOpen(true)}
          />

          <RiskAssessmentWizard
            engagementId={engagementId}
            open={riskWizardOpen}
            onOpenChange={setRiskWizardOpen}
            onComplete={() => {
              setRiskWizardOpen(false);
            }}
          />

          <EnhancedProgramBuilderWizard
            engagementId={engagementId}
            riskAssessmentId={riskAssessment.id}
            open={applyDialogOpen}
            onOpenChange={setApplyDialogOpen}
            onSuccess={() => {
              setApplyDialogOpen(false);
            }}
          />
        </div>
      </RiskRequirementGate>
    );
  }

  // STATE 3: Program exists → Show Risk Summary (compact) + Program View
  return (
    <div className="space-y-6">
      {/* Risk Assessment Summary (Compact) */}
      <RiskAssessmentSummaryCard
        assessment={riskAssessment}
        mode="compact"
        onReassess={() => setRiskWizardOpen(true)}
      />

      <RiskAssessmentWizard
        engagementId={engagementId}
        open={riskWizardOpen}
        onOpenChange={setRiskWizardOpen}
        onComplete={() => {
          setRiskWizardOpen(false);
        }}
      />

      {/* Risk Coverage Status */}
      {procedures && procedures.length > 0 && (
        <RiskCoverageStatusCard
          assessment={riskAssessment}
          procedures={procedures}
        />
      )}

      {/* Program Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{activeProgram.program_name}</CardTitle>
              <CardDescription>
                Based on {activeProgram.audit_program_templates?.template_name}
              </CardDescription>
            </div>
            <Badge variant={activeProgram.status === 'complete' ? 'default' : 'secondary'}>
              {activeProgram.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Procedures</p>
              <p className="text-2xl font-bold">{activeProgram.total_procedures}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{proceduresByStatus.complete}</p>
              <Progress value={completionRate} className="mt-2" />
              <p className="text-xs text-muted-foreground">{completionRate}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{proceduresByStatus.in_progress}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Not Started</p>
              <p className="text-2xl font-bold">{proceduresByStatus.not_started}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assignment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assigned</span>
                <span className="font-medium">{assignedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unassigned</span>
                <span className="font-medium">{unassignedCount}</span>
              </div>
            </div>
            {unassignedCount > 0 && (
              <Button
                className="w-full mt-4"
                size="sm"
                onClick={() => navigate(`/engagements/${engagementId}/assign-procedures`)}
              >
                Assign Procedures
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated</span>
                <span className="font-medium">
                  {procedures?.reduce((sum, p) => sum + p.estimated_hours, 0) || 0}h
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Actual</span>
                <span className="font-medium">
                  {procedures?.reduce((sum, p) => sum + p.actual_hours, 0) || 0}h
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Quality Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">In Review</span>
                <span className="font-medium">{proceduresByStatus.in_review}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium">{proceduresByStatus.complete}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Procedures List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Procedures</CardTitle>
              <CardDescription>
                View and manage audit test procedures
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/engagements/${engagementId}/assign-procedures`)}
            >
              Manage Assignments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {procedures && procedures.length > 0 ? (
            <div className="space-y-3">
              {procedures.slice(0, 5).map((proc) => (
                <div
                  key={proc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{proc.procedure_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {proc.status.replace('_', ' ')}
                      </Badge>
                      {proc.assigned_to && (
                        <span className="text-xs text-muted-foreground">
                          Assigned to team member
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {proc.estimated_hours}h
                  </div>
                </div>
              ))}
              {procedures.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(`/engagements/${engagementId}/assign-procedures`)}
                >
                  View All {procedures.length} Procedures
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No procedures in this program
            </p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Sampling Calculator - Contextual Tool */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Sampling Calculator</h3>
          <p className="text-sm text-muted-foreground">
            Calculate sample sizes using statistical methods (random, stratified, systematic, monetary unit sampling)
          </p>
        </div>
        <SamplingCalculator engagementId={engagementId} />
      </div>
    </div>
  );
}
