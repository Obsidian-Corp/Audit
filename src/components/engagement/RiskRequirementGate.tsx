/**
 * ==================================================================
 * RISK REQUIREMENT GATE COMPONENT
 * ==================================================================
 * Enforces AU-C 315 requirement that risk assessment must be
 * completed before selecting audit procedures
 * Issue #2: Risk-First Workflow Enforcement
 * ==================================================================
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRiskRequirement,
  useRiskRequirementDetails,
  useOverrideRiskRequirement,
} from '@/hooks/useRiskRequirement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RiskRequirementGateProps {
  engagementId: string;
  engagementName?: string;
  children: React.ReactNode;
  /** If true, shows a softer warning instead of hard block */
  softGate?: boolean;
}

/**
 * RiskRequirementGate Component
 *
 * Blocks access to child content (typically program builder) until:
 * 1. Risk assessment is completed AND approved, OR
 * 2. Partner provides override with justification
 *
 * Per AU-C 315, risk assessment MUST precede procedure selection
 */
export function RiskRequirementGate({
  engagementId,
  engagementName = 'this engagement',
  children,
  softGate = false,
}: RiskRequirementGateProps) {
  const navigate = useNavigate();
  const { data: isComplete, isLoading } = useRiskRequirement(engagementId);
  const { data: requirementDetails } = useRiskRequirementDetails(engagementId);
  const overrideMutation = useOverrideRiskRequirement();

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [justification, setJustification] = useState('');

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Risk assessment complete - render children
  if (isComplete) {
    // Show success banner if override was used
    if (requirementDetails?.override_allowed) {
      return (
        <div className="space-y-6">
          <Alert className="border-orange-500 bg-orange-50">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              Partner Override Active
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              <p className="mb-2">
                Risk assessment requirement was overridden by partner. This engagement is
                flagged for quality control review.
              </p>
              <p className="text-sm">
                <strong>Justification:</strong> {requirementDetails.override_justification || 'None provided'}
              </p>
            </AlertDescription>
          </Alert>
          {children}
        </div>
      );
    }

    // Normal completion - just render children
    return <>{children}</>;
  }

  // Risk assessment NOT complete - show gate
  const handleOverride = async () => {
    if (!justification || justification.trim().length < 20) {
      return;
    }

    await overrideMutation.mutateAsync({
      engagementId,
      justification: justification.trim(),
    });

    setOverrideDialogOpen(false);
    setJustification('');
  };

  const handleStartRiskAssessment = () => {
    // Navigate to risk assessment wizard
    navigate(`/engagements/${engagementId}?tab=planning&wizard=risk`);
  };

  if (softGate) {
    // Soft gate: show warning but allow access
    return (
      <div className="space-y-6">
        <Alert variant="default" className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900 font-semibold">
            Risk Assessment Recommended
          </AlertTitle>
          <AlertDescription className="text-yellow-800">
            <p className="mb-3">
              Best practice recommends completing a risk assessment before building your audit
              program. This ensures procedures are properly tailored to identified risks.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartRiskAssessment}
              className="bg-white"
            >
              Complete Risk Assessment
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  // Hard gate: block access until requirement met
  return (
    <div className="space-y-6">
      {/* Requirement Alert */}
      <Alert variant="destructive" className="border-red-500 bg-red-50">
        <Lock className="h-6 w-6 text-red-600" />
        <AlertTitle className="text-lg font-semibold text-red-900 flex items-center gap-2">
          Risk Assessment Required
          <Badge variant="destructive" className="ml-2">
            AU-C 315
          </Badge>
        </AlertTitle>
        <AlertDescription className="space-y-4 text-red-800">
          <div className="space-y-2">
            <p className="font-medium">
              Professional auditing standards <strong>require</strong> a risk assessment to be
              completed before selecting audit procedures.
            </p>
            <p className="text-sm">
              <strong>Why this matters:</strong> Risk assessment ensures that audit procedures
              are appropriately tailored to the specific risks identified in the engagement. This
              prevents:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Over-testing of low-risk areas (inefficiency)</li>
              <li>Under-testing of high-risk areas (quality deficiency)</li>
              <li>Inappropriate procedure selection (audit failure risk)</li>
              <li>Non-compliance with professional standards (regulatory issue)</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleStartRiskAssessment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Risk Assessment Now
            </Button>
            <Button
              variant="outline"
              onClick={() => setOverrideDialogOpen(true)}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Partner Override (Not Recommended)
            </Button>
          </div>

          <div className="mt-4 p-3 bg-white rounded-md border border-red-200">
            <p className="text-xs text-red-700">
              <strong>Note for Partners:</strong> Overriding this requirement should only be done
              in exceptional circumstances (e.g., interim review where full risk assessment was
              completed for year-end audit). All overrides are logged and flagged for quality
              control review.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Blurred Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white z-10 flex items-center justify-center">
          <div className="bg-white border border-red-300 rounded-lg p-6 shadow-xl max-w-md text-center">
            <Lock className="h-12 w-12 mx-auto text-red-500 mb-3" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Content Locked</h3>
            <p className="text-sm text-red-700">
              Complete the risk assessment to unlock audit program features
            </p>
          </div>
        </div>
        <div className="pointer-events-none blur-sm opacity-40">{children}</div>
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-600" />
              Override Risk Assessment Requirement
            </DialogTitle>
            <DialogDescription>
              This action requires partner authority and will be logged for quality control
              review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Overriding this requirement may result in audit quality
                deficiencies and regulatory non-compliance. Only exercise this override if you
                have documented justification for why a risk assessment is not necessary for{' '}
                {engagementName}.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="justification" className="text-base font-semibold">
                Override Justification <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                Provide a detailed explanation for why the risk assessment requirement should be
                bypassed for this engagement. Minimum 20 characters required.
              </p>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Example: This is an interim review engagement where a comprehensive risk assessment was completed for the December 31, 2024 year-end audit. The risk environment has not changed materially since that assessment was performed."
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {justification.length} / 20 minimum
              </p>
            </div>

            <div className="bg-muted p-4 rounded-md">
              <h4 className="font-semibold text-sm mb-2">This override will be logged with:</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Your user ID and timestamp</li>
                <li>Engagement ID and name</li>
                <li>Override justification (shown above)</li>
                <li>Automatic notification to quality control team</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!justification || justification.trim().length < 20 || overrideMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {overrideMutation.isPending ? 'Processing...' : 'Confirm Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
