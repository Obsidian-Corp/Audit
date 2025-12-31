/**
 * ProcedureSignoffPanel Component
 * Displays procedure sign-off status and allows authorized users to sign off
 *
 * Features:
 * - Sign-off hierarchy visualization
 * - Role-based sign-off authorization
 * - Content integrity verification
 * - Sign-off history
 */

import React from 'react';
import { useProcedureWorkflow } from '@/hooks/useProcedureWorkflow';
import {
  SignoffRole,
  SIGNOFF_ROLE_HIERARCHY,
  PROCEDURE_STATE_DISPLAY,
} from '@/lib/state-machines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  PenLine,
  Shield,
  Lock,
  User,
  Clock,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ProcedureSignoffPanelProps {
  procedureId: string;
  showActions?: boolean;
  onSignoffComplete?: () => void;
}

const ROLE_ORDER: SignoffRole[] = ['preparer', 'reviewer', 'senior_reviewer', 'manager', 'partner'];

export function ProcedureSignoffPanel({
  procedureId,
  showActions = true,
  onSignoffComplete,
}: ProcedureSignoffPanelProps) {
  const {
    procedure,
    currentState,
    isLoading,
    error,
    stateDisplay,
    requiredSignoffs,
    canUserSignoff,
    nextRequiredSignoff,
    signoffProgress,
    recordSignoff,
    validateContentIntegrity,
    availableActions,
    performAction,
  } = useProcedureWorkflow({
    procedureId,
    onSignoffSuccess: () => {
      onSignoffComplete?.();
    },
  });

  const [isSigningOff, setIsSigningOff] = React.useState(false);
  const [isIntegrityValid, setIsIntegrityValid] = React.useState<boolean | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  // Validate content integrity when component mounts or procedure changes
  React.useEffect(() => {
    if (procedure?.content_hash) {
      setIsValidating(true);
      validateContentIntegrity()
        .then(setIsIntegrityValid)
        .finally(() => setIsValidating(false));
    }
  }, [procedure?.content_hash, validateContentIntegrity]);

  const handleSignoff = async () => {
    setIsSigningOff(true);
    try {
      const success = await recordSignoff();
      if (success) {
        onSignoffComplete?.();
      }
    } finally {
      setIsSigningOff(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !procedure) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load procedure</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sign-off Status</CardTitle>
            <CardDescription>
              {procedure.risk_level.charAt(0).toUpperCase() + procedure.risk_level.slice(1)} risk
              procedure
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1',
              stateDisplay?.color === 'gray' && 'border-gray-500 bg-gray-50 text-gray-700',
              stateDisplay?.color === 'blue' && 'border-blue-500 bg-blue-50 text-blue-700',
              stateDisplay?.color === 'yellow' && 'border-yellow-500 bg-yellow-50 text-yellow-700',
              stateDisplay?.color === 'green' && 'border-green-500 bg-green-50 text-green-700',
              stateDisplay?.color === 'purple' && 'border-purple-500 bg-purple-50 text-purple-700'
            )}
          >
            {stateDisplay?.label || currentState}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sign-off Progress</span>
            <span className="font-medium">{signoffProgress}%</span>
          </div>
          <Progress value={signoffProgress} className="h-2" />
        </div>

        {/* Content Integrity Warning */}
        {isIntegrityValid === false && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <FileWarning className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Content Modified</h4>
                <p className="text-sm text-red-700">
                  The procedure content has been modified since the last sign-off. Previous
                  sign-offs may need to be re-verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign-off Hierarchy */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Required Sign-offs</h4>
          <div className="space-y-2">
            {requiredSignoffs.map((signoff, index) => {
              const roleConfig = SIGNOFF_ROLE_HIERARCHY[signoff.role];
              const isComplete = signoff.completedAt !== null;
              const isNext = nextRequiredSignoff?.role === signoff.role;
              const isPending = !isComplete && !isNext;

              return (
                <div
                  key={signoff.role}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    isComplete && 'bg-green-50 border-green-200',
                    isNext && 'bg-blue-50 border-blue-200',
                    isPending && 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        isComplete && 'bg-green-500 text-white',
                        isNext && 'bg-blue-500 text-white',
                        isPending && 'bg-gray-300 text-gray-500'
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isNext ? (
                        <PenLine className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{roleConfig?.label || signoff.role}</p>
                      <p className="text-xs text-muted-foreground">Level {roleConfig?.level}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isComplete && signoff.completedAt && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-green-700">
                              <Clock className="h-3 w-3" />
                              {format(signoff.completedAt, 'MMM d, yyyy')}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Signed {format(signoff.completedAt, "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {isNext && (
                      <Badge variant="outline" className="text-xs bg-blue-100 border-blue-300">
                        Next
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign-off Action */}
        {showActions && canUserSignoff && nextRequiredSignoff && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full" disabled={isSigningOff}>
                {isSigningOff ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Sign Off as {SIGNOFF_ROLE_HIERARCHY[nextRequiredSignoff.role]?.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Sign-off</AlertDialogTitle>
                <AlertDialogDescription>
                  By signing off on this procedure, you confirm that:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>You have reviewed the work performed</li>
                    <li>The documentation is complete and accurate</li>
                    <li>The conclusion is appropriate based on the evidence</li>
                    <li>The work complies with applicable professional standards</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignoff}>
                  Confirm Sign-off
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Status Actions */}
        {showActions && availableActions.length > 0 && !canUserSignoff && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Actions</h4>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => performAction(action)}
                >
                  {action.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Authorization Message */}
        {!canUserSignoff && nextRequiredSignoff && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  The next sign-off requires a{' '}
                  <strong>{SIGNOFF_ROLE_HIERARCHY[nextRequiredSignoff.role]?.label}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  You are not authorized to sign off at this level
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProcedureSignoffPanel;
