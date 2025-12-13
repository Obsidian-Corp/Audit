/**
 * Procedure Status State Machine
 *
 * Defines valid state transitions for audit procedure workflow.
 * Ensures procedures follow proper execution and review cycle.
 */

export type ProcedureStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'reviewed'
  | 'completed'
  | 'not_applicable'
  | 'deferred';

/**
 * State machine definition
 * Maps each status to the list of statuses it can transition to
 */
export const procedureStateMachine: Record<ProcedureStatus, ProcedureStatus[]> = {
  not_started: ['in_progress', 'not_applicable', 'deferred'],
  in_progress: ['not_started', 'pending_review', 'not_applicable', 'deferred'],
  pending_review: ['in_progress', 'reviewed'],
  reviewed: ['in_progress', 'completed'], // Can go back if reviewer requests changes
  completed: [], // Terminal state
  not_applicable: [], // Terminal state
  deferred: ['not_started', 'in_progress'], // Can be reactivated
};

/**
 * Check if a status transition is valid
 */
export function canTransition(from: ProcedureStatus, to: ProcedureStatus): boolean {
  const allowedTransitions = procedureStateMachine[from];
  return allowedTransitions?.includes(to) ?? false;
}

/**
 * Validate a status transition and throw error if invalid
 */
export function validateTransition(from: ProcedureStatus, to: ProcedureStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid procedure status transition: Cannot move from '${from}' to '${to}'`);
  }
}

/**
 * Get all valid next statuses from current status
 */
export function getValidNextStatuses(currentStatus: ProcedureStatus): ProcedureStatus[] {
  return procedureStateMachine[currentStatus] || [];
}

/**
 * Get human-readable labels for statuses
 */
export const statusLabels: Record<ProcedureStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  reviewed: 'Reviewed',
  completed: 'Completed',
  not_applicable: 'Not Applicable',
  deferred: 'Deferred',
};

/**
 * Get status color for UI display
 */
export const statusColors: Record<ProcedureStatus, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  pending_review: 'yellow',
  reviewed: 'purple',
  completed: 'green',
  not_applicable: 'slate',
  deferred: 'orange',
};

/**
 * Check if status is a terminal state
 */
export function isTerminalStatus(status: ProcedureStatus): boolean {
  return procedureStateMachine[status].length === 0;
}

/**
 * Check if procedure requires review based on status
 */
export function requiresReview(status: ProcedureStatus): boolean {
  return status === 'pending_review';
}

/**
 * Check if procedure is complete or not applicable
 */
export function isFinalized(status: ProcedureStatus): boolean {
  return status === 'completed' || status === 'not_applicable';
}

/**
 * Get transition validation rules
 */
export const transitionRules: Record<string, { requiredFields?: string[]; validations?: string[] }> = {
  'in_progress->pending_review': {
    requiredFields: ['workpaper_reference', 'performed_by', 'date_performed'],
    validations: ['Must have at least one workpaper attached', 'All required fields must be completed']
  },
  'pending_review->reviewed': {
    requiredFields: ['reviewed_by', 'review_date', 'review_notes'],
    validations: ['Reviewer must be different from preparer']
  },
  'reviewed->completed': {
    requiredFields: ['conclusion', 'sign_off_by'],
    validations: ['All review comments must be addressed']
  },
  'not_started->not_applicable': {
    requiredFields: ['not_applicable_reason'],
    validations: ['Reason must be provided and approved by engagement partner']
  }
};

/**
 * Get required fields for a transition
 */
export function getTransitionRequirements(from: ProcedureStatus, to: ProcedureStatus): { requiredFields?: string[]; validations?: string[] } {
  const key = `${from}->${to}`;
  return transitionRules[key] || {};
}

/**
 * Validate that required data exists for transition
 */
export function validateTransitionData(
  from: ProcedureStatus,
  to: ProcedureStatus,
  procedureData: Record<string, any>
): { valid: boolean; errors: string[] } {
  const requirements = getTransitionRequirements(from, to);
  const errors: string[] = [];

  // Check required fields
  if (requirements.requiredFields) {
    for (const field of requirements.requiredFields) {
      if (!procedureData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
