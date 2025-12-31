/**
 * EngagementWorkflowStatus Component
 * Displays and controls engagement lifecycle workflow
 *
 * Features:
 * - Visual state progress indicator
 * - Available action buttons
 * - Blocking requirements display
 * - Real-time status updates
 */

import React from 'react';
import { useEngagementWorkflow } from '@/hooks/useEngagementWorkflow';
import {
  EngagementState,
  EngagementAction,
  ENGAGEMENT_STATE_DISPLAY,
} from '@/lib/state-machines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Loader2,
  FileCheck,
  Users,
  ClipboardCheck,
  FileText,
  Send,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngagementWorkflowStatusProps {
  engagementId: string;
  showActions?: boolean;
  compact?: boolean;
}

// Action display configuration
const ACTION_CONFIG: Record<
  EngagementAction,
  { label: string; icon: React.ElementType; variant: 'default' | 'outline' | 'secondary' }
> = {
  submit_for_acceptance: { label: 'Submit for Acceptance', icon: Send, variant: 'default' },
  approve_acceptance: { label: 'Approve Acceptance', icon: CheckCircle2, variant: 'default' },
  reject_acceptance: { label: 'Reject Acceptance', icon: AlertCircle, variant: 'outline' },
  complete_planning: { label: 'Complete Planning', icon: ClipboardCheck, variant: 'default' },
  submit_planning_review: { label: 'Submit for Review', icon: Send, variant: 'default' },
  approve_planning: { label: 'Approve Planning', icon: CheckCircle2, variant: 'default' },
  request_planning_changes: { label: 'Request Changes', icon: AlertCircle, variant: 'outline' },
  complete_fieldwork: { label: 'Complete Fieldwork', icon: FileCheck, variant: 'default' },
  submit_fieldwork_review: { label: 'Submit for Review', icon: Send, variant: 'default' },
  approve_fieldwork: { label: 'Approve Fieldwork', icon: CheckCircle2, variant: 'default' },
  request_fieldwork_changes: { label: 'Request Changes', icon: AlertCircle, variant: 'outline' },
  complete_wrap_up: { label: 'Complete Wrap-Up', icon: ClipboardCheck, variant: 'default' },
  submit_for_partner_review: { label: 'Submit for Partner Review', icon: Users, variant: 'default' },
  issue_report: { label: 'Issue Report', icon: FileText, variant: 'default' },
  archive: { label: 'Archive Engagement', icon: Archive, variant: 'secondary' },
  reopen: { label: 'Reopen Engagement', icon: ArrowRight, variant: 'outline' },
};

// State order for progress visualization
const STATE_ORDER: EngagementState[] = [
  'draft',
  'acceptance_pending',
  'accepted',
  'planning',
  'planning_review',
  'fieldwork',
  'fieldwork_review',
  'wrap_up',
  'reporting',
  'partner_review',
  'issued',
  'archived',
];

export function EngagementWorkflowStatus({
  engagementId,
  showActions = true,
  compact = false,
}: EngagementWorkflowStatusProps) {
  const {
    engagement,
    currentState,
    isLoading,
    error,
    availableActions,
    stateDisplay,
    performAction,
    canPerformAction,
    getBlockingRequirements,
    getProgressPercentage,
    getNextRequiredAction,
  } = useEngagementWorkflow({ engagementId });

  const [isPerformingAction, setIsPerformingAction] = React.useState(false);

  const handleAction = async (action: EngagementAction) => {
    setIsPerformingAction(true);
    try {
      await performAction(action);
    } finally {
      setIsPerformingAction(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'p-2')}>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !engagement) {
    return (
      <Card className={cn(compact && 'p-2')}>
        <CardContent className="flex items-center gap-2 py-6 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load engagement workflow</span>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = getProgressPercentage();
  const nextAction = getNextRequiredAction();
  const currentStateIndex = STATE_ORDER.indexOf(currentState!);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={cn(
            'px-2 py-1',
            stateDisplay?.color === 'blue' && 'border-blue-500 text-blue-700',
            stateDisplay?.color === 'yellow' && 'border-yellow-500 text-yellow-700',
            stateDisplay?.color === 'green' && 'border-green-500 text-green-700',
            stateDisplay?.color === 'purple' && 'border-purple-500 text-purple-700',
            stateDisplay?.color === 'gray' && 'border-gray-500 text-gray-700'
          )}
        >
          {stateDisplay?.label || currentState}
        </Badge>
        <Progress value={progressPercentage} className="w-24 h-2" />
        <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Engagement Workflow</CardTitle>
            <CardDescription>{stateDisplay?.description}</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-sm px-3 py-1',
              stateDisplay?.color === 'blue' && 'border-blue-500 bg-blue-50 text-blue-700',
              stateDisplay?.color === 'yellow' && 'border-yellow-500 bg-yellow-50 text-yellow-700',
              stateDisplay?.color === 'green' && 'border-green-500 bg-green-50 text-green-700',
              stateDisplay?.color === 'purple' && 'border-purple-500 bg-purple-50 text-purple-700',
              stateDisplay?.color === 'gray' && 'border-gray-500 bg-gray-50 text-gray-700'
            )}
          >
            {stateDisplay?.label || currentState}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* State Timeline */}
        <div className="relative">
          <div className="flex justify-between">
            {STATE_ORDER.slice(0, 6).map((state, index) => {
              const isComplete = index < currentStateIndex;
              const isCurrent = index === currentStateIndex;
              const display = ENGAGEMENT_STATE_DISPLAY[state];

              return (
                <TooltipProvider key={state}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center border-2',
                            isComplete && 'bg-green-500 border-green-500 text-white',
                            isCurrent && 'bg-blue-500 border-blue-500 text-white',
                            !isComplete && !isCurrent && 'bg-gray-100 border-gray-300 text-gray-400'
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isCurrent ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-xs mt-1 max-w-[60px] text-center',
                            isCurrent ? 'font-medium' : 'text-muted-foreground'
                          )}
                        >
                          {display?.label.split(' ')[0]}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{display?.label}</p>
                      <p className="text-xs text-muted-foreground">{display?.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          {/* Connection line */}
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (currentStateIndex / 5) * 100)}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        {showActions && availableActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Available Actions</h4>
            <div className="flex flex-wrap gap-2">
              {availableActions.map((action) => {
                const config = ACTION_CONFIG[action];
                const canPerform = canPerformAction(action);
                const blockers = getBlockingRequirements(action);
                const isNextAction = action === nextAction;
                const Icon = config.icon;

                return (
                  <TooltipProvider key={action}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isNextAction ? 'default' : config.variant}
                          size="sm"
                          disabled={!canPerform.success || isPerformingAction}
                          onClick={() => handleAction(action)}
                          className={cn(isNextAction && 'ring-2 ring-offset-2 ring-blue-500')}
                        >
                          {isPerformingAction ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Icon className="h-4 w-4 mr-2" />
                          )}
                          {config.label}
                        </Button>
                      </TooltipTrigger>
                      {blockers.length > 0 && (
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Requirements not met:</p>
                          <ul className="text-xs space-y-1">
                            {blockers.map((blocker, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {blocker}
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        )}

        {/* Blocking Requirements for Next Action */}
        {nextAction && (
          <div className="space-y-2">
            {(() => {
              const blockers = getBlockingRequirements(nextAction);
              if (blockers.length === 0) return null;

              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Requirements to proceed
                  </h4>
                  <ul className="mt-2 space-y-1">
                    {blockers.map((blocker, i) => (
                      <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EngagementWorkflowStatus;
