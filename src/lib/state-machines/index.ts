/**
 * State Machines Index
 * Central export for all workflow state machines
 *
 * These state machines enforce professional audit standards:
 * - AU-C 300: Planning an Audit
 * - AU-C 330: Performing Audit Procedures
 * - ISQM 1: Quality Management for Firms
 * - ISQM 2: Engagement Quality Reviews
 */

// Engagement Lifecycle State Machine
export {
  EngagementStateMachine,
  type EngagementState,
  type EngagementAction,
  type EngagementContext,
  type TransitionResult,
  type TransitionRequirement,
  ENGAGEMENT_STATE_CONFIG,
  ENGAGEMENT_STATE_DISPLAY,
} from './engagement-lifecycle';

// Procedure Workflow State Machine
export {
  ProcedureStateMachine,
  type ProcedureState,
  type ProcedureAction,
  type ProcedureContext,
  type SignoffRole,
  type SignoffRequirement,
  type RiskLevel,
  PROCEDURE_STATE_CONFIG,
  PROCEDURE_STATE_DISPLAY,
  SIGNOFF_ROLE_HIERARCHY,
} from './procedure-workflow';

// Re-export common types
export type WorkflowState = EngagementState | ProcedureState;
export type WorkflowAction = EngagementAction | ProcedureAction;

/**
 * Factory function to create appropriate state machine
 */
import { EngagementStateMachine, EngagementContext } from './engagement-lifecycle';
import { ProcedureStateMachine, ProcedureContext } from './procedure-workflow';

export function createEngagementWorkflow(context: EngagementContext): EngagementStateMachine {
  return new EngagementStateMachine(context);
}

export function createProcedureWorkflow(context: ProcedureContext): ProcedureStateMachine {
  return new ProcedureStateMachine(context);
}

/**
 * Workflow validation utilities
 */
export const WorkflowValidation = {
  /**
   * Check if an engagement can progress to the next phase
   */
  canProgressEngagement(
    machine: EngagementStateMachine,
    targetState: EngagementState
  ): { canProgress: boolean; blockers: string[] } {
    const actions: EngagementAction[] = [
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

    for (const action of actions) {
      const result = machine.canPerformAction(action);
      if (result.success && result.newState === targetState) {
        return { canProgress: true, blockers: [] };
      }
    }

    // Find what's blocking progress
    const blockers: string[] = [];
    for (const action of actions) {
      const result = machine.canPerformAction(action);
      if (!result.success && result.missingRequirements) {
        blockers.push(...result.missingRequirements.map(r => r.description));
      }
    }

    return { canProgress: false, blockers: [...new Set(blockers)] };
  },

  /**
   * Get completion percentage for a procedure based on sign-offs
   */
  getProcedureCompletion(machine: ProcedureStateMachine): number {
    const required = machine.getRequiredSignoffs();
    if (required.length === 0) return 100;

    const completed = required.filter(s => s.completedAt !== null).length;
    return Math.round((completed / required.length) * 100);
  },

  /**
   * Validate content hash for sign-off integrity
   */
  validateContentHash(originalHash: string, currentHash: string): boolean {
    return originalHash === currentHash;
  },
};

/**
 * Audit trail helper for state transitions
 */
export interface StateTransitionLog {
  id: string;
  entityType: 'engagement' | 'procedure';
  entityId: string;
  fromState: WorkflowState;
  toState: WorkflowState;
  action: WorkflowAction;
  performedBy: string;
  performedAt: Date;
  contentHash?: string;
  metadata?: Record<string, unknown>;
}

export function createTransitionLog(
  entityType: 'engagement' | 'procedure',
  entityId: string,
  fromState: WorkflowState,
  toState: WorkflowState,
  action: WorkflowAction,
  performedBy: string,
  contentHash?: string,
  metadata?: Record<string, unknown>
): StateTransitionLog {
  return {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    fromState,
    toState,
    action,
    performedBy,
    performedAt: new Date(),
    contentHash,
    metadata,
  };
}
