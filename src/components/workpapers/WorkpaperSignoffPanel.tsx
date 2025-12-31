/**
 * WorkpaperSignoffPanel Component
 * Ticket: UI-004
 *
 * Panel for displaying and managing workpaper sign-offs.
 * Shows sign-off chain progress and allows signing at appropriate level.
 */

import { useState } from 'react';
import {
  useWorkpaperSignoffs,
  SignoffType,
  WorkpaperSignoff,
  SignoffRequirement,
} from '@/hooks/useWorkpaperSignoffs';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Pen,
  AlertTriangle,
  ChevronRight,
  Shield,
  User,
  Users,
  Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Icon and label mapping for sign-off types
const signoffTypeConfig: Record<
  SignoffType,
  { icon: React.ElementType; label: string; description: string }
> = {
  preparer: {
    icon: User,
    label: 'Preparer',
    description: 'Staff who prepared the workpaper',
  },
  reviewer: {
    icon: Users,
    label: 'Reviewer',
    description: 'Senior who reviewed the work',
  },
  manager: {
    icon: Shield,
    label: 'Manager',
    description: 'Manager approval',
  },
  partner: {
    icon: Crown,
    label: 'Partner',
    description: 'Partner final sign-off',
  },
};

interface SignoffStepProps {
  requirement: SignoffRequirement;
  isNext: boolean;
  canSign: boolean;
  onSign: () => void;
  isLast: boolean;
}

function SignoffStep({
  requirement,
  isNext,
  canSign,
  onSign,
  isLast,
}: SignoffStepProps) {
  const config = signoffTypeConfig[requirement.type];
  const Icon = config.icon;

  const getStepStatus = () => {
    if (requirement.completed) return 'completed';
    if (isNext) return 'current';
    return 'pending';
  };

  const status = getStepStatus();

  return (
    <div className="flex items-start gap-3">
      {/* Step indicator */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
            status === 'completed' &&
              'bg-green-500 border-green-500 text-white',
            status === 'current' &&
              'bg-primary/10 border-primary text-primary animate-pulse',
            status === 'pending' && 'bg-muted border-muted-foreground/30 text-muted-foreground'
          )}
        >
          {status === 'completed' ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 h-8 mt-2',
              status === 'completed' ? 'bg-green-500' : 'bg-muted-foreground/30'
            )}
          />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h4
              className={cn(
                'font-medium',
                status === 'completed' && 'text-green-600',
                status === 'current' && 'text-primary',
                status === 'pending' && 'text-muted-foreground'
              )}
            >
              {config.label}
            </h4>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>

          {status === 'current' && canSign && (
            <Button size="sm" onClick={onSign}>
              <Pen className="h-4 w-4 mr-1" />
              Sign Off
            </Button>
          )}
        </div>

        {/* Signed info */}
        {requirement.completed && requirement.signoff && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src={requirement.signoff.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {requirement.signoff.profiles?.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              {requirement.signoff.profiles?.full_name || 'Unknown'}
            </span>
            <span className="text-muted-foreground">•</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground cursor-help">
                    {formatDistanceToNow(new Date(requirement.signoff.signed_at), {
                      addSuffix: true,
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(requirement.signoff.signed_at), 'PPpp')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Comments */}
        {requirement.signoff?.comments && (
          <p className="mt-1 text-sm text-muted-foreground italic">
            "{requirement.signoff.comments}"
          </p>
        )}
      </div>
    </div>
  );
}

interface SignoffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comments: string) => void;
  signoffType: SignoffType;
  isSubmitting: boolean;
}

function SignoffDialog({
  isOpen,
  onClose,
  onConfirm,
  signoffType,
  isSubmitting,
}: SignoffDialogProps) {
  const [comments, setComments] = useState('');
  const config = signoffTypeConfig[signoffType];

  const handleConfirm = () => {
    onConfirm(comments);
    setComments('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            {config.label} Sign-Off
          </DialogTitle>
          <DialogDescription>
            You are about to sign off on this workpaper as {config.label.toLowerCase()}.
            This action will be logged with a timestamp and your identity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Electronic Signature
                </p>
                <p className="text-amber-600 dark:text-amber-500">
                  By clicking "Sign Off", you confirm that you have reviewed this
                  workpaper and approve its contents. This constitutes your electronic
                  signature.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Comments (optional)</label>
            <Textarea
              placeholder="Add any comments or notes about your review..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <Pen className="h-4 w-4 mr-2" />
                Sign Off
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkpaperSignoffPanelProps {
  workpaperId: string;
  /** Compact mode for sidebar display */
  compact?: boolean;
  /** Callback when workpaper is fully signed and locked */
  onLocked?: () => void;
}

export function WorkpaperSignoffPanel({
  workpaperId,
  compact = false,
  onLocked,
}: WorkpaperSignoffPanelProps) {
  const { user } = useAuth();
  const [signoffDialogOpen, setSignoffDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [signoffToRevoke, setSignoffToRevoke] = useState<WorkpaperSignoff | null>(null);

  const {
    signoffs,
    signoffStatus,
    requirements,
    isLoading,
    error,
    userRole,
    createSignoff,
    revokeSignoff,
    isCreating,
    isRevoking,
  } = useWorkpaperSignoffs(workpaperId);

  const handleSignoff = (comments: string) => {
    if (!signoffStatus.nextRequiredType) return;

    createSignoff(
      {
        workpaperId,
        signoffType: signoffStatus.nextRequiredType,
        comments: comments || undefined,
      },
      {
        onSuccess: () => {
          setSignoffDialogOpen(false);
          // Check if this was the final sign-off
          if (signoffStatus.nextRequiredType === 'partner') {
            onLocked?.();
          }
        },
      }
    );
  };

  const handleRevokeConfirm = () => {
    if (!signoffToRevoke) return;

    revokeSignoff(
      { signoffId: signoffToRevoke.id, reason: 'Revoked by user' },
      {
        onSuccess: () => {
          setRevokeDialogOpen(false);
          setSignoffToRevoke(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load sign-off status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className={compact ? 'pb-2' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {signoffStatus.isLocked ? (
                  <>
                    <Lock className="h-5 w-5 text-green-500" />
                    Locked
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Sign-Off Chain
                  </>
                )}
              </CardTitle>
              {!compact && (
                <CardDescription>
                  {signoffStatus.isFullySigned
                    ? 'All required sign-offs have been completed'
                    : `${signoffStatus.completedTypes.length} of 4 sign-offs completed`}
                </CardDescription>
              )}
            </div>

            {/* Progress badge */}
            <Badge
              variant={signoffStatus.isFullySigned ? 'default' : 'secondary'}
              className={cn(
                signoffStatus.isFullySigned && 'bg-green-500 hover:bg-green-600'
              )}
            >
              {signoffStatus.completedTypes.length}/4
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Sign-off steps */}
          <div className="mt-2">
            {requirements.map((req, index) => (
              <SignoffStep
                key={req.type}
                requirement={req}
                isNext={signoffStatus.nextRequiredType === req.type}
                canSign={signoffStatus.canSign && signoffStatus.nextRequiredType === req.type}
                onSign={() => setSignoffDialogOpen(true)}
                isLast={index === requirements.length - 1}
              />
            ))}
          </div>

          {/* Locked status */}
          {signoffStatus.isLocked && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Lock className="h-4 w-4" />
                <span className="font-medium">Workpaper Locked</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                This workpaper has been fully signed off and is now locked for editing.
              </p>
            </div>
          )}

          {/* Can't sign message */}
          {!signoffStatus.canSign &&
            !signoffStatus.isFullySigned &&
            signoffStatus.nextRequiredType && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {!userRole ? (
                    'You are not assigned to this engagement.'
                  ) : (
                    <>
                      Waiting for{' '}
                      <span className="font-medium">
                        {signoffTypeConfig[signoffStatus.nextRequiredType].label}
                      </span>{' '}
                      sign-off.
                    </>
                  )}
                </p>
              </div>
            )}

          {/* Admin actions */}
          {['manager', 'partner'].includes(userRole || '') &&
            signoffStatus.completedTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    const lastSignoff = signoffs[signoffs.length - 1];
                    if (lastSignoff) {
                      setSignoffToRevoke(lastSignoff);
                      setRevokeDialogOpen(true);
                    }
                  }}
                >
                  Revoke Last Sign-Off
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Sign-off dialog */}
      {signoffStatus.nextRequiredType && (
        <SignoffDialog
          isOpen={signoffDialogOpen}
          onClose={() => setSignoffDialogOpen(false)}
          onConfirm={handleSignoff}
          signoffType={signoffStatus.nextRequiredType}
          isSubmitting={isCreating}
        />
      )}

      {/* Revoke confirmation dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Sign-Off?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the{' '}
              {signoffToRevoke &&
                signoffTypeConfig[signoffToRevoke.signoff_type].label.toLowerCase()}{' '}
              sign-off and return the workpaper to draft status. This action will be
              logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Sign-Off'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default WorkpaperSignoffPanel;
