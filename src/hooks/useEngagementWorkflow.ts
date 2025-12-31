/**
 * useEngagementWorkflow Hook
 * React hook for managing engagement lifecycle state transitions
 *
 * Integrates:
 * - Engagement state machine (AU-C 300, ISQM 1)
 * - Supabase real-time updates
 * - Optimistic UI updates
 * - Audit trail logging
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  EngagementStateMachine,
  EngagementState,
  EngagementAction,
  EngagementContext,
  TransitionResult,
  ENGAGEMENT_STATE_DISPLAY,
  createTransitionLog,
} from '@/lib/state-machines';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EngagementWorkflowData {
  id: string;
  status: EngagementState;
  client_id: string;
  engagement_partner_id: string | null;
  manager_id: string | null;
  engagement_type: string;
  fiscal_year_end: string;
  // Context fields
  independence_confirmed: boolean;
  client_accepted: boolean;
  engagement_letter_signed: boolean;
  planning_memo_approved: boolean;
  risk_assessment_complete: boolean;
  materiality_set: boolean;
  all_procedures_complete: boolean;
  review_notes_cleared: boolean;
  wrap_up_complete: boolean;
  eqcr_complete: boolean;
  partner_signoff: boolean;
  report_approved: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
}

interface UseEngagementWorkflowOptions {
  engagementId: string;
  onTransitionSuccess?: (action: EngagementAction, newState: EngagementState) => void;
  onTransitionError?: (action: EngagementAction, error: string) => void;
}

interface UseEngagementWorkflowReturn {
  // State
  engagement: EngagementWorkflowData | null;
  currentState: EngagementState | null;
  isLoading: boolean;
  error: Error | null;

  // State machine
  stateMachine: EngagementStateMachine | null;
  availableActions: EngagementAction[];
  stateDisplay: { label: string; description: string; color: string } | null;

  // Actions
  performAction: (action: EngagementAction) => Promise<TransitionResult>;
  canPerformAction: (action: EngagementAction) => TransitionResult;
  getBlockingRequirements: (action: EngagementAction) => string[];

  // Utilities
  refreshEngagement: () => Promise<void>;
  getProgressPercentage: () => number;
  getNextRequiredAction: () => EngagementAction | null;
}

export function useEngagementWorkflow({
  engagementId,
  onTransitionSuccess,
  onTransitionError,
}: UseEngagementWorkflowOptions): UseEngagementWorkflowReturn {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch engagement data
  const {
    data: engagement,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['engagement-workflow', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select(`
          id,
          status,
          client_id,
          engagement_partner_id,
          manager_id,
          engagement_type,
          fiscal_year_end,
          independence_confirmed,
          client_accepted,
          engagement_letter_signed,
          planning_memo_approved,
          risk_assessment_complete,
          materiality_set,
          all_procedures_complete,
          review_notes_cleared,
          wrap_up_complete,
          eqcr_complete,
          partner_signoff,
          report_approved,
          created_at,
          updated_at
        `)
        .eq('id', engagementId)
        .single();

      if (error) throw error;
      return data as EngagementWorkflowData;
    },
    enabled: !!engagementId,
  });

  // Build context for state machine
  const context = useMemo<EngagementContext | null>(() => {
    if (!engagement || !user) return null;

    return {
      currentState: engagement.status as EngagementState,
      engagementId: engagement.id,
      userId: user.id,
      userRole: profile?.role || 'staff',
      isEngagementPartner: engagement.engagement_partner_id === user.id,
      isManager: engagement.manager_id === user.id,
      independenceConfirmed: engagement.independence_confirmed ?? false,
      clientAccepted: engagement.client_accepted ?? false,
      engagementLetterSigned: engagement.engagement_letter_signed ?? false,
      planningMemoApproved: engagement.planning_memo_approved ?? false,
      riskAssessmentComplete: engagement.risk_assessment_complete ?? false,
      materialitySet: engagement.materiality_set ?? false,
      allProceduresComplete: engagement.all_procedures_complete ?? false,
      reviewNotesCleared: engagement.review_notes_cleared ?? false,
      wrapUpComplete: engagement.wrap_up_complete ?? false,
      eqcrComplete: engagement.eqcr_complete ?? false,
      partnerSignoff: engagement.partner_signoff ?? false,
      reportApproved: engagement.report_approved ?? false,
    };
  }, [engagement, user, profile]);

  // Create state machine instance
  const stateMachine = useMemo(() => {
    if (!context) return null;
    return new EngagementStateMachine(context);
  }, [context]);

  // Get available actions
  const availableActions = useMemo(() => {
    if (!stateMachine) return [];
    return stateMachine.getAvailableActions();
  }, [stateMachine]);

  // Get state display info
  const stateDisplay = useMemo(() => {
    if (!engagement) return null;
    return ENGAGEMENT_STATE_DISPLAY[engagement.status as EngagementState] || null;
  }, [engagement]);

  // Mutation for performing state transitions
  const transitionMutation = useMutation({
    mutationFn: async ({
      action,
      newState,
    }: {
      action: EngagementAction;
      newState: EngagementState;
    }) => {
      // Update engagement status
      const { error: updateError } = await supabase
        .from('engagements')
        .update({
          status: newState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', engagementId);

      if (updateError) throw updateError;

      // Log the transition
      const transitionLog = createTransitionLog(
        'engagement',
        engagementId,
        engagement!.status as EngagementState,
        newState,
        action,
        user!.id
      );

      const { error: logError } = await supabase
        .from('engagement_status_history')
        .insert({
          engagement_id: engagementId,
          from_status: transitionLog.fromState,
          to_status: transitionLog.toState,
          changed_by: transitionLog.performedBy,
          changed_at: transitionLog.performedAt.toISOString(),
          notes: `Action: ${action}`,
        });

      if (logError) {
        console.warn('Failed to log transition:', logError);
      }

      return { action, newState };
    },
    onSuccess: ({ action, newState }) => {
      queryClient.invalidateQueries({ queryKey: ['engagement-workflow', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagements'] });

      const display = ENGAGEMENT_STATE_DISPLAY[newState];
      toast.success(`Engagement moved to ${display?.label || newState}`);

      onTransitionSuccess?.(action, newState);
    },
    onError: (error, { action }) => {
      const message = error instanceof Error ? error.message : 'Transition failed';
      toast.error(message);
      onTransitionError?.(action, message);
    },
  });

  // Perform action
  const performAction = useCallback(
    async (action: EngagementAction): Promise<TransitionResult> => {
      if (!stateMachine) {
        return {
          success: false,
          error: 'State machine not initialized',
        };
      }

      const result = stateMachine.performAction(action);

      if (result.success && result.newState) {
        await transitionMutation.mutateAsync({
          action,
          newState: result.newState,
        });
      }

      return result;
    },
    [stateMachine, transitionMutation]
  );

  // Check if action can be performed
  const canPerformAction = useCallback(
    (action: EngagementAction): TransitionResult => {
      if (!stateMachine) {
        return {
          success: false,
          error: 'State machine not initialized',
        };
      }
      return stateMachine.canPerformAction(action);
    },
    [stateMachine]
  );

  // Get blocking requirements for an action
  const getBlockingRequirements = useCallback(
    (action: EngagementAction): string[] => {
      if (!stateMachine) return [];
      return stateMachine
        .getBlockingRequirements(action)
        .map((r) => r.description);
    },
    [stateMachine]
  );

  // Refresh engagement data
  const refreshEngagement = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Calculate progress percentage
  const getProgressPercentage = useCallback((): number => {
    if (!engagement) return 0;

    const stateOrder: EngagementState[] = [
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

    const currentIndex = stateOrder.indexOf(engagement.status as EngagementState);
    if (currentIndex === -1) return 0;

    return Math.round((currentIndex / (stateOrder.length - 1)) * 100);
  }, [engagement]);

  // Get next required action
  const getNextRequiredAction = useCallback((): EngagementAction | null => {
    if (availableActions.length === 0) return null;

    // Priority order for actions
    const actionPriority: EngagementAction[] = [
      'submit_for_acceptance',
      'approve_acceptance',
      'complete_planning',
      'submit_planning_review',
      'approve_planning',
      'complete_fieldwork',
      'submit_fieldwork_review',
      'approve_fieldwork',
      'complete_wrap_up',
      'submit_for_partner_review',
      'issue_report',
      'archive',
    ];

    for (const action of actionPriority) {
      if (availableActions.includes(action)) {
        return action;
      }
    }

    return availableActions[0];
  }, [availableActions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!engagementId) return;

    const channel = supabase
      .channel(`engagement-${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'engagements',
          filter: `id=eq.${engagementId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [engagementId, refetch]);

  return {
    engagement,
    currentState: engagement?.status as EngagementState | null,
    isLoading,
    error: error as Error | null,
    stateMachine,
    availableActions,
    stateDisplay,
    performAction,
    canPerformAction,
    getBlockingRequirements,
    refreshEngagement,
    getProgressPercentage,
    getNextRequiredAction,
  };
}

/**
 * Hook to get engagement workflow summary for lists/dashboards
 */
export function useEngagementWorkflowSummary(engagementId: string) {
  return useQuery({
    queryKey: ['engagement-workflow-summary', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagements')
        .select('id, status, engagement_partner_id, manager_id')
        .eq('id', engagementId)
        .single();

      if (error) throw error;

      const display = ENGAGEMENT_STATE_DISPLAY[data.status as EngagementState];

      return {
        id: data.id,
        status: data.status as EngagementState,
        statusLabel: display?.label || data.status,
        statusColor: display?.color || 'gray',
        statusDescription: display?.description || '',
      };
    },
    enabled: !!engagementId,
  });
}
