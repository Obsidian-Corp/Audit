/**
 * useProcedureWorkflow Hook
 * React hook for managing audit procedure execution and sign-off workflow
 *
 * Integrates:
 * - Procedure state machine (AU-C 330)
 * - Sign-off hierarchy enforcement
 * - Content hash verification for integrity
 * - Real-time updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ProcedureStateMachine,
  ProcedureState,
  ProcedureAction,
  ProcedureContext,
  SignoffRole,
  SignoffRequirement,
  RiskLevel,
  PROCEDURE_STATE_DISPLAY,
  SIGNOFF_ROLE_HIERARCHY,
  createTransitionLog,
} from '@/lib/state-machines';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProcedureWorkflowData {
  id: string;
  engagement_id: string;
  name: string;
  status: ProcedureState;
  risk_level: RiskLevel;
  assigned_to: string | null;
  reviewer_id: string | null;
  work_performed: string | null;
  conclusion: string | null;
  content_hash: string | null;
  // Sign-off tracking
  preparer_signoff: string | null;
  preparer_signoff_at: string | null;
  reviewer_signoff: string | null;
  reviewer_signoff_at: string | null;
  senior_reviewer_signoff: string | null;
  senior_reviewer_signoff_at: string | null;
  manager_signoff: string | null;
  manager_signoff_at: string | null;
  partner_signoff: string | null;
  partner_signoff_at: string | null;
  // Metadata
  created_at: string;
  updated_at: string;
}

interface UseProcedureWorkflowOptions {
  procedureId: string;
  onTransitionSuccess?: (action: ProcedureAction, newState: ProcedureState) => void;
  onTransitionError?: (action: ProcedureAction, error: string) => void;
  onSignoffSuccess?: (role: SignoffRole) => void;
}

interface UseProcedureWorkflowReturn {
  // State
  procedure: ProcedureWorkflowData | null;
  currentState: ProcedureState | null;
  isLoading: boolean;
  error: Error | null;

  // State machine
  stateMachine: ProcedureStateMachine | null;
  availableActions: ProcedureAction[];
  stateDisplay: { label: string; description: string; color: string } | null;

  // Sign-off
  requiredSignoffs: SignoffRequirement[];
  canUserSignoff: boolean;
  nextRequiredSignoff: SignoffRequirement | null;
  signoffProgress: number;

  // Actions
  performAction: (action: ProcedureAction) => Promise<boolean>;
  canPerformAction: (action: ProcedureAction) => { allowed: boolean; reason?: string };
  recordSignoff: () => Promise<boolean>;

  // Content integrity
  computeContentHash: () => Promise<string>;
  validateContentIntegrity: () => Promise<boolean>;

  // Utilities
  refreshProcedure: () => Promise<void>;
}

/**
 * Compute SHA-256 hash of procedure content
 */
async function computeSHA256(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useProcedureWorkflow({
  procedureId,
  onTransitionSuccess,
  onTransitionError,
  onSignoffSuccess,
}: UseProcedureWorkflowOptions): UseProcedureWorkflowReturn {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch procedure data
  const {
    data: procedure,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['procedure-workflow', procedureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .select(`
          id,
          engagement_id,
          name,
          status,
          risk_level,
          assigned_to,
          reviewer_id,
          work_performed,
          conclusion,
          content_hash,
          preparer_signoff,
          preparer_signoff_at,
          reviewer_signoff,
          reviewer_signoff_at,
          senior_reviewer_signoff,
          senior_reviewer_signoff_at,
          manager_signoff,
          manager_signoff_at,
          partner_signoff,
          partner_signoff_at,
          created_at,
          updated_at
        `)
        .eq('id', procedureId)
        .single();

      if (error) throw error;
      return data as ProcedureWorkflowData;
    },
    enabled: !!procedureId,
  });

  // Map user role to signoff role
  const userSignoffRole = useMemo((): SignoffRole | null => {
    if (!profile?.role) return null;

    const roleMapping: Record<string, SignoffRole> = {
      staff: 'preparer',
      senior: 'reviewer',
      supervisor: 'senior_reviewer',
      manager: 'manager',
      partner: 'partner',
      admin: 'partner',
    };

    return roleMapping[profile.role] || null;
  }, [profile]);

  // Build context for state machine
  const context = useMemo<ProcedureContext | null>(() => {
    if (!procedure || !user) return null;

    return {
      currentState: procedure.status as ProcedureState,
      procedureId: procedure.id,
      engagementId: procedure.engagement_id,
      riskLevel: (procedure.risk_level as RiskLevel) || 'medium',
      userId: user.id,
      userRole: userSignoffRole || 'preparer',
      isPreparer: procedure.assigned_to === user.id,
      isReviewer: procedure.reviewer_id === user.id,
      signoffs: {
        preparer: procedure.preparer_signoff
          ? {
              userId: procedure.preparer_signoff,
              signedAt: new Date(procedure.preparer_signoff_at!),
              contentHash: procedure.content_hash || '',
            }
          : null,
        reviewer: procedure.reviewer_signoff
          ? {
              userId: procedure.reviewer_signoff,
              signedAt: new Date(procedure.reviewer_signoff_at!),
              contentHash: procedure.content_hash || '',
            }
          : null,
        senior_reviewer: procedure.senior_reviewer_signoff
          ? {
              userId: procedure.senior_reviewer_signoff,
              signedAt: new Date(procedure.senior_reviewer_signoff_at!),
              contentHash: procedure.content_hash || '',
            }
          : null,
        manager: procedure.manager_signoff
          ? {
              userId: procedure.manager_signoff,
              signedAt: new Date(procedure.manager_signoff_at!),
              contentHash: procedure.content_hash || '',
            }
          : null,
        partner: procedure.partner_signoff
          ? {
              userId: procedure.partner_signoff,
              signedAt: new Date(procedure.partner_signoff_at!),
              contentHash: procedure.content_hash || '',
            }
          : null,
      },
      contentHash: procedure.content_hash || '',
      hasWorkPerformed: !!procedure.work_performed,
      hasConclusion: !!procedure.conclusion,
    };
  }, [procedure, user, userSignoffRole]);

  // Create state machine instance
  const stateMachine = useMemo(() => {
    if (!context) return null;
    return new ProcedureStateMachine(context);
  }, [context]);

  // Get available actions
  const availableActions = useMemo(() => {
    if (!stateMachine) return [];
    return stateMachine.getAvailableActions();
  }, [stateMachine]);

  // Get state display info
  const stateDisplay = useMemo(() => {
    if (!procedure) return null;
    return PROCEDURE_STATE_DISPLAY[procedure.status as ProcedureState] || null;
  }, [procedure]);

  // Get required sign-offs
  const requiredSignoffs = useMemo(() => {
    if (!stateMachine) return [];
    return stateMachine.getRequiredSignoffs();
  }, [stateMachine]);

  // Check if current user can sign off
  const canUserSignoff = useMemo(() => {
    if (!stateMachine || !userSignoffRole || !user) return false;
    return stateMachine.canUserSignoff(user.id, userSignoffRole);
  }, [stateMachine, userSignoffRole, user]);

  // Get next required sign-off
  const nextRequiredSignoff = useMemo(() => {
    return requiredSignoffs.find((s) => s.completedAt === null) || null;
  }, [requiredSignoffs]);

  // Calculate sign-off progress
  const signoffProgress = useMemo(() => {
    if (requiredSignoffs.length === 0) return 100;
    const completed = requiredSignoffs.filter((s) => s.completedAt !== null).length;
    return Math.round((completed / requiredSignoffs.length) * 100);
  }, [requiredSignoffs]);

  // Mutation for state transitions
  const transitionMutation = useMutation({
    mutationFn: async ({
      action,
      newState,
    }: {
      action: ProcedureAction;
      newState: ProcedureState;
    }) => {
      const { error: updateError } = await supabase
        .from('audit_procedures')
        .update({
          status: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', procedureId);

      if (updateError) throw updateError;

      // Log transition
      const transitionLog = createTransitionLog(
        'procedure',
        procedureId,
        procedure!.status as ProcedureState,
        newState,
        action,
        user!.id
      );

      await supabase.from('procedure_status_history').insert({
        procedure_id: procedureId,
        from_status: transitionLog.fromState,
        to_status: transitionLog.toState,
        changed_by: transitionLog.performedBy,
        changed_at: transitionLog.performedAt.toISOString(),
        notes: `Action: ${action}`,
      });

      return { action, newState };
    },
    onSuccess: ({ action, newState }) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-workflow', procedureId] });
      queryClient.invalidateQueries({ queryKey: ['audit-procedures'] });

      const display = PROCEDURE_STATE_DISPLAY[newState];
      toast.success(`Procedure moved to ${display?.label || newState}`);

      onTransitionSuccess?.(action, newState);
    },
    onError: (error, { action }) => {
      const message = error instanceof Error ? error.message : 'Transition failed';
      toast.error(message);
      onTransitionError?.(action, message);
    },
  });

  // Mutation for recording sign-offs
  const signoffMutation = useMutation({
    mutationFn: async () => {
      if (!stateMachine || !userSignoffRole || !user || !procedure) {
        throw new Error('Cannot record sign-off');
      }

      // Compute current content hash
      const content = JSON.stringify({
        work_performed: procedure.work_performed,
        conclusion: procedure.conclusion,
      });
      const contentHash = await computeSHA256(content);

      // Update sign-off fields
      const signoffField = `${userSignoffRole}_signoff`;
      const signoffAtField = `${userSignoffRole}_signoff_at`;

      const { error: updateError } = await supabase
        .from('audit_procedures')
        .update({
          [signoffField]: user.id,
          [signoffAtField]: new Date().toISOString(),
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', procedureId);

      if (updateError) throw updateError;

      // Log sign-off
      await supabase.from('procedure_signoffs').insert({
        procedure_id: procedureId,
        user_id: user.id,
        role: userSignoffRole,
        content_hash: contentHash,
        signed_at: new Date().toISOString(),
      });

      return userSignoffRole;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-workflow', procedureId] });
      toast.success(`Sign-off recorded as ${SIGNOFF_ROLE_HIERARCHY[role]?.label || role}`);
      onSignoffSuccess?.(role);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Sign-off failed';
      toast.error(message);
    },
  });

  // Perform action
  const performAction = useCallback(
    async (action: ProcedureAction): Promise<boolean> => {
      if (!stateMachine) return false;

      const result = stateMachine.performAction(action);

      if (result.success && result.newState) {
        await transitionMutation.mutateAsync({
          action,
          newState: result.newState,
        });
        return true;
      }

      if (result.error) {
        toast.error(result.error);
      }

      return false;
    },
    [stateMachine, transitionMutation]
  );

  // Check if action can be performed
  const canPerformAction = useCallback(
    (action: ProcedureAction): { allowed: boolean; reason?: string } => {
      if (!stateMachine) {
        return { allowed: false, reason: 'State machine not initialized' };
      }

      const result = stateMachine.canPerformAction(action);

      if (result.success) {
        return { allowed: true };
      }

      return { allowed: false, reason: result.error };
    },
    [stateMachine]
  );

  // Record sign-off
  const recordSignoff = useCallback(async (): Promise<boolean> => {
    if (!canUserSignoff) {
      toast.error('You are not authorized to sign off on this procedure');
      return false;
    }

    await signoffMutation.mutateAsync();
    return true;
  }, [canUserSignoff, signoffMutation]);

  // Compute content hash
  const computeContentHash = useCallback(async (): Promise<string> => {
    if (!procedure) return '';

    const content = JSON.stringify({
      work_performed: procedure.work_performed,
      conclusion: procedure.conclusion,
    });

    return computeSHA256(content);
  }, [procedure]);

  // Validate content integrity
  const validateContentIntegrity = useCallback(async (): Promise<boolean> => {
    if (!procedure?.content_hash) return true;

    const currentHash = await computeContentHash();
    return currentHash === procedure.content_hash;
  }, [procedure, computeContentHash]);

  // Refresh procedure
  const refreshProcedure = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!procedureId) return;

    const channel = supabase
      .channel(`procedure-${procedureId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'audit_procedures',
          filter: `id=eq.${procedureId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [procedureId, refetch]);

  return {
    procedure,
    currentState: procedure?.status as ProcedureState | null,
    isLoading,
    error: error as Error | null,
    stateMachine,
    availableActions,
    stateDisplay,
    requiredSignoffs,
    canUserSignoff,
    nextRequiredSignoff,
    signoffProgress,
    performAction,
    canPerformAction,
    recordSignoff,
    computeContentHash,
    validateContentIntegrity,
    refreshProcedure,
  };
}

/**
 * Hook to get procedures for an engagement with workflow status
 */
export function useEngagementProcedures(engagementId: string) {
  return useQuery({
    queryKey: ['engagement-procedures-workflow', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .select(`
          id,
          name,
          status,
          risk_level,
          assigned_to,
          preparer_signoff,
          reviewer_signoff,
          manager_signoff,
          partner_signoff
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map((proc) => ({
        ...proc,
        statusDisplay: PROCEDURE_STATE_DISPLAY[proc.status as ProcedureState],
        hasPreparerSignoff: !!proc.preparer_signoff,
        hasReviewerSignoff: !!proc.reviewer_signoff,
        hasManagerSignoff: !!proc.manager_signoff,
        hasPartnerSignoff: !!proc.partner_signoff,
      }));
    },
    enabled: !!engagementId,
  });
}

/**
 * Hook to get overall procedure completion for an engagement
 */
export function useEngagementProcedureCompletion(engagementId: string) {
  const { data: procedures } = useEngagementProcedures(engagementId);

  return useMemo(() => {
    if (!procedures || procedures.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        percentComplete: 0,
      };
    }

    const completed = procedures.filter((p) => p.status === 'signed_off').length;
    const inProgress = procedures.filter((p) =>
      ['in_progress', 'pending_review', 'in_review', 'complete'].includes(p.status)
    ).length;
    const notStarted = procedures.filter((p) => p.status === 'not_started').length;

    return {
      total: procedures.length,
      completed,
      inProgress,
      notStarted,
      percentComplete: Math.round((completed / procedures.length) * 100),
    };
  }, [procedures]);
}
