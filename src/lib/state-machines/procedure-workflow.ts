// =====================================================
// OBSIDIAN AUDIT - PROCEDURE WORKFLOW STATE MACHINE
// Enforces procedure execution and sign-off workflow
// Standards: AU-C 230, AU-C 330, AS 1215
// =====================================================

import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export type ProcedureState =
  | 'not_started'
  | 'in_progress'
  | 'pending_evidence'
  | 'pending_conclusion'
  | 'pending_review'
  | 'in_review'
  | 'review_notes'
  | 'complete'
  | 'signed_off'
  | 'not_applicable';

export type ProcedureAction =
  | 'start'
  | 'add_evidence'
  | 'add_conclusion'
  | 'submit_for_review'
  | 'begin_review'
  | 'approve'
  | 'request_revision'
  | 'signoff'
  | 'mark_not_applicable'
  | 'reopen';

export type SignoffRole = 'preparer' | 'reviewer' | 'senior_reviewer' | 'manager' | 'partner';

export interface ProcedureContext {
  procedureId: string;
  engagementId: string;
  firmId: string;

  // Procedure details
  riskLevel?: 'low' | 'medium' | 'high' | 'significant';
  isKeyProcedure?: boolean;

  // Execution status
  hasEvidence?: boolean;
  evidenceCount?: number;
  hasConclusion?: boolean;
  conclusionText?: string;
  hasExceptions?: boolean;
  exceptionsResolved?: boolean;

  // Work product
  workpaperId?: string;
  workpaperComplete?: boolean;
  contentHash?: string;

  // Review status
  reviewNotesCount?: number;
  reviewNotesResolved?: boolean;

  // Sign-offs
  preparerSignoff?: boolean;
  preparerSignoffBy?: string;
  preparerSignoffAt?: string;
  reviewerSignoff?: boolean;
  reviewerSignoffBy?: string;
  reviewerSignoffAt?: string;
  managerSignoff?: boolean;
  managerSignoffBy?: string;
  managerSignoffAt?: string;
  partnerSignoff?: boolean;
  partnerSignoffBy?: string;
  partnerSignoffAt?: string;

  // User context
  currentUserId?: string;
  currentUserRole?: SignoffRole | 'staff' | 'admin';

  // Time tracking
  estimatedHours?: number;
  actualHours?: number;
}

export interface ProcedureTransitionResult {
  success: boolean;
  newState?: ProcedureState;
  blockedBy?: string[];
  message: string;
  requiresSignoff?: SignoffRole;
}

// =====================================================
// STATE MACHINE DEFINITION
// =====================================================

const STATE_TRANSITIONS: Record<ProcedureState, Partial<Record<ProcedureAction, ProcedureState>>> = {
  not_started: {
    start: 'in_progress',
    mark_not_applicable: 'not_applicable',
  },
  in_progress: {
    add_evidence: 'in_progress',
    add_conclusion: 'pending_review',
    submit_for_review: 'pending_review',
    mark_not_applicable: 'not_applicable',
  },
  pending_evidence: {
    add_evidence: 'in_progress',
    mark_not_applicable: 'not_applicable',
  },
  pending_conclusion: {
    add_conclusion: 'pending_review',
    mark_not_applicable: 'not_applicable',
  },
  pending_review: {
    begin_review: 'in_review',
  },
  in_review: {
    approve: 'complete',
    request_revision: 'review_notes',
  },
  review_notes: {
    submit_for_review: 'pending_review',
  },
  complete: {
    signoff: 'signed_off',
    reopen: 'in_progress',
  },
  signed_off: {
    reopen: 'in_progress', // Only with proper authorization
  },
  not_applicable: {
    reopen: 'not_started',
  },
};

// =====================================================
// SIGN-OFF REQUIREMENTS BY RISK LEVEL
// =====================================================

interface SignoffRequirement {
  role: SignoffRole;
  required: boolean;
  description: string;
}

const SIGNOFF_REQUIREMENTS_BY_RISK: Record<string, SignoffRequirement[]> = {
  low: [
    { role: 'preparer', required: true, description: 'Preparer sign-off' },
    { role: 'reviewer', required: true, description: 'Reviewer sign-off' },
  ],
  medium: [
    { role: 'preparer', required: true, description: 'Preparer sign-off' },
    { role: 'reviewer', required: true, description: 'Reviewer sign-off' },
    { role: 'senior_reviewer', required: false, description: 'Senior reviewer sign-off (optional)' },
  ],
  high: [
    { role: 'preparer', required: true, description: 'Preparer sign-off' },
    { role: 'reviewer', required: true, description: 'Reviewer sign-off' },
    { role: 'manager', required: true, description: 'Manager sign-off' },
  ],
  significant: [
    { role: 'preparer', required: true, description: 'Preparer sign-off' },
    { role: 'reviewer', required: true, description: 'Reviewer sign-off' },
    { role: 'manager', required: true, description: 'Manager sign-off' },
    { role: 'partner', required: true, description: 'Partner sign-off' },
  ],
};

// =====================================================
// ROLE HIERARCHY
// =====================================================

const ROLE_HIERARCHY: Record<SignoffRole | 'staff' | 'admin', number> = {
  staff: 0,
  preparer: 1,
  reviewer: 2,
  senior_reviewer: 3,
  manager: 4,
  partner: 5,
  admin: 6,
};

// =====================================================
// PROCEDURE STATE MACHINE CLASS
// =====================================================

export class ProcedureStateMachine {
  private state: ProcedureState;
  private context: ProcedureContext;

  constructor(initialState: ProcedureState, context: ProcedureContext) {
    this.state = initialState;
    this.context = context;
  }

  /**
   * Get current state
   */
  getState(): ProcedureState {
    return this.state;
  }

  /**
   * Get current context
   */
  getContext(): ProcedureContext {
    return this.context;
  }

  /**
   * Update context
   */
  updateContext(updates: Partial<ProcedureContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get available actions from current state
   */
  getAvailableActions(): ProcedureAction[] {
    const transitions = STATE_TRANSITIONS[this.state];
    const availableActions = Object.keys(transitions) as ProcedureAction[];

    // Filter based on context
    return availableActions.filter(action => {
      const result = this.canPerformAction(action);
      return result.success;
    });
  }

  /**
   * Check if an action can be performed
   */
  canPerformAction(action: ProcedureAction): ProcedureTransitionResult {
    const transitions = STATE_TRANSITIONS[this.state];

    // Check if action is valid for current state
    if (!transitions[action]) {
      return {
        success: false,
        message: `Action '${action}' is not valid from state '${this.state}'`,
      };
    }

    const blockedBy: string[] = [];

    // Action-specific validation
    switch (action) {
      case 'submit_for_review':
        if (!this.context.hasEvidence) {
          blockedBy.push('Evidence must be attached (AU-C 500)');
        }
        if (!this.context.hasConclusion) {
          blockedBy.push('Conclusion must be documented');
        }
        if (this.context.hasExceptions && !this.context.exceptionsResolved) {
          blockedBy.push('All exceptions must be resolved or documented');
        }
        break;

      case 'begin_review':
        // Only reviewer or higher can begin review
        const reviewerLevel = ROLE_HIERARCHY[this.context.currentUserRole || 'staff'];
        if (reviewerLevel < ROLE_HIERARCHY['reviewer']) {
          blockedBy.push('Reviewer role or higher required');
        }
        // Cannot review your own work
        if (this.context.currentUserId === this.context.preparerSignoffBy) {
          blockedBy.push('Cannot review your own work');
        }
        break;

      case 'approve':
        if ((this.context.reviewNotesCount || 0) > 0 && !this.context.reviewNotesResolved) {
          blockedBy.push('All review notes must be resolved');
        }
        break;

      case 'signoff':
        const signoffResult = this.validateSignoffRequirements();
        if (!signoffResult.success) {
          blockedBy.push(...(signoffResult.blockedBy || []));
        }
        break;

      case 'mark_not_applicable':
        // Only manager or higher can mark as N/A
        const naLevel = ROLE_HIERARCHY[this.context.currentUserRole || 'staff'];
        if (naLevel < ROLE_HIERARCHY['manager']) {
          blockedBy.push('Manager authorization required to mark procedure as N/A');
        }
        break;

      case 'reopen':
        // Can only reopen if not already in review by someone else
        if (this.state === 'signed_off') {
          const reopenLevel = ROLE_HIERARCHY[this.context.currentUserRole || 'staff'];
          if (reopenLevel < ROLE_HIERARCHY['manager']) {
            blockedBy.push('Manager authorization required to reopen signed-off procedure');
          }
        }
        break;
    }

    if (blockedBy.length > 0) {
      return {
        success: false,
        blockedBy,
        message: `Cannot perform action: ${blockedBy.join('; ')}`,
      };
    }

    return {
      success: true,
      newState: transitions[action],
      message: `Action '${action}' can be performed`,
    };
  }

  /**
   * Validate sign-off requirements based on risk level
   */
  private validateSignoffRequirements(): ProcedureTransitionResult {
    const riskLevel = this.context.riskLevel || 'medium';
    const requirements = SIGNOFF_REQUIREMENTS_BY_RISK[riskLevel] || SIGNOFF_REQUIREMENTS_BY_RISK['medium'];
    const blockedBy: string[] = [];

    for (const req of requirements) {
      if (!req.required) continue;

      switch (req.role) {
        case 'preparer':
          if (!this.context.preparerSignoff) {
            blockedBy.push('Preparer sign-off required');
          }
          break;
        case 'reviewer':
          if (!this.context.reviewerSignoff) {
            blockedBy.push('Reviewer sign-off required');
          }
          break;
        case 'manager':
          if (!this.context.managerSignoff) {
            blockedBy.push('Manager sign-off required');
          }
          break;
        case 'partner':
          if (!this.context.partnerSignoff) {
            blockedBy.push('Partner sign-off required');
          }
          break;
      }
    }

    return {
      success: blockedBy.length === 0,
      blockedBy,
      message: blockedBy.length > 0 ? 'Missing required sign-offs' : 'All sign-offs complete',
    };
  }

  /**
   * Perform a state transition
   */
  performAction(action: ProcedureAction): ProcedureTransitionResult {
    const canPerform = this.canPerformAction(action);

    if (!canPerform.success) {
      logger.warn('Procedure state transition blocked', undefined, {
        procedureId: this.context.procedureId,
        currentState: this.state,
        action,
        blockedBy: canPerform.blockedBy,
      });
      return canPerform;
    }

    const previousState = this.state;
    this.state = canPerform.newState!;

    logger.info('Procedure state transition', {
      procedureId: this.context.procedureId,
      previousState,
      newState: this.state,
      action,
      userId: this.context.currentUserId,
    });

    return {
      success: true,
      newState: this.state,
      message: `Transitioned from '${previousState}' to '${this.state}'`,
    };
  }

  /**
   * Get required sign-offs for this procedure
   */
  getRequiredSignoffs(): SignoffRequirement[] {
    const riskLevel = this.context.riskLevel || 'medium';
    return SIGNOFF_REQUIREMENTS_BY_RISK[riskLevel] || SIGNOFF_REQUIREMENTS_BY_RISK['medium'];
  }

  /**
   * Get pending sign-offs
   */
  getPendingSignoffs(): SignoffRequirement[] {
    const required = this.getRequiredSignoffs();
    return required.filter(req => {
      if (!req.required) return false;

      switch (req.role) {
        case 'preparer':
          return !this.context.preparerSignoff;
        case 'reviewer':
          return !this.context.reviewerSignoff;
        case 'manager':
          return !this.context.managerSignoff;
        case 'partner':
          return !this.context.partnerSignoff;
        default:
          return false;
      }
    });
  }

  /**
   * Get next required sign-off role
   */
  getNextSignoffRole(): SignoffRole | null {
    const pending = this.getPendingSignoffs();
    if (pending.length === 0) return null;

    // Return the lowest-level pending sign-off
    const roleOrder: SignoffRole[] = ['preparer', 'reviewer', 'senior_reviewer', 'manager', 'partner'];
    for (const role of roleOrder) {
      if (pending.some(p => p.role === role)) {
        return role;
      }
    }
    return null;
  }

  /**
   * Check if user can sign off in their role
   */
  canUserSignoff(userId: string, userRole: SignoffRole): boolean {
    const nextRole = this.getNextSignoffRole();
    if (!nextRole) return false;

    // User must have the required role or higher
    const userLevel = ROLE_HIERARCHY[userRole];
    const requiredLevel = ROLE_HIERARCHY[nextRole];

    if (userLevel < requiredLevel) return false;

    // Cannot sign off on your own work (except as preparer)
    if (nextRole !== 'preparer' && userId === this.context.preparerSignoffBy) {
      return false;
    }

    return true;
  }

  /**
   * Record a sign-off
   */
  recordSignoff(userId: string, userRole: SignoffRole, contentHash: string): boolean {
    if (!this.canUserSignoff(userId, userRole)) {
      return false;
    }

    const now = new Date().toISOString();
    const nextRole = this.getNextSignoffRole();

    switch (nextRole) {
      case 'preparer':
        this.context.preparerSignoff = true;
        this.context.preparerSignoffBy = userId;
        this.context.preparerSignoffAt = now;
        break;
      case 'reviewer':
        this.context.reviewerSignoff = true;
        this.context.reviewerSignoffBy = userId;
        this.context.reviewerSignoffAt = now;
        break;
      case 'manager':
        this.context.managerSignoff = true;
        this.context.managerSignoffBy = userId;
        this.context.managerSignoffAt = now;
        break;
      case 'partner':
        this.context.partnerSignoff = true;
        this.context.partnerSignoffBy = userId;
        this.context.partnerSignoffAt = now;
        break;
    }

    this.context.contentHash = contentHash;

    logger.info('Procedure sign-off recorded', {
      procedureId: this.context.procedureId,
      role: nextRole,
      userId,
      contentHash,
    });

    return true;
  }

  /**
   * Check if procedure is complete
   */
  isComplete(): boolean {
    return this.state === 'complete' || this.state === 'signed_off';
  }

  /**
   * Check if procedure is fully signed off
   */
  isSignedOff(): boolean {
    return this.state === 'signed_off';
  }

  /**
   * Get state display name
   */
  static getStateDisplayName(state: ProcedureState): string {
    const names: Record<ProcedureState, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      pending_evidence: 'Pending Evidence',
      pending_conclusion: 'Pending Conclusion',
      pending_review: 'Pending Review',
      in_review: 'In Review',
      review_notes: 'Review Notes',
      complete: 'Complete',
      signed_off: 'Signed Off',
      not_applicable: 'N/A',
    };
    return names[state];
  }

  /**
   * Get state color for UI
   */
  static getStateColor(state: ProcedureState): string {
    const colors: Record<ProcedureState, string> = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      pending_evidence: 'bg-yellow-100 text-yellow-700',
      pending_conclusion: 'bg-yellow-100 text-yellow-700',
      pending_review: 'bg-purple-100 text-purple-700',
      in_review: 'bg-indigo-100 text-indigo-700',
      review_notes: 'bg-orange-100 text-orange-700',
      complete: 'bg-green-100 text-green-700',
      signed_off: 'bg-green-200 text-green-800',
      not_applicable: 'bg-gray-100 text-gray-500',
    };
    return colors[state];
  }

  /**
   * Get progress percentage
   */
  static getProgressPercentage(state: ProcedureState): number {
    const progress: Record<ProcedureState, number> = {
      not_started: 0,
      in_progress: 25,
      pending_evidence: 30,
      pending_conclusion: 40,
      pending_review: 50,
      in_review: 60,
      review_notes: 55,
      complete: 90,
      signed_off: 100,
      not_applicable: 100,
    };
    return progress[state];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create procedure state machine from database record
 */
export function createProcedureStateMachine(
  procedure: {
    id: string;
    engagement_id: string;
    firm_id: string;
    status: string;
    risk_level?: string;
  },
  context: Partial<ProcedureContext>
): ProcedureStateMachine {
  return new ProcedureStateMachine(
    procedure.status as ProcedureState,
    {
      procedureId: procedure.id,
      engagementId: procedure.engagement_id,
      firmId: procedure.firm_id,
      riskLevel: procedure.risk_level as ProcedureContext['riskLevel'],
      ...context,
    }
  );
}

/**
 * Get all possible states
 */
export function getAllProcedureStates(): ProcedureState[] {
  return Object.keys(STATE_TRANSITIONS) as ProcedureState[];
}

/**
 * Validate sign-off content hasn't changed
 */
export function validateSignoffIntegrity(
  currentHash: string,
  signoffHash: string
): boolean {
  return currentHash === signoffHash;
}
