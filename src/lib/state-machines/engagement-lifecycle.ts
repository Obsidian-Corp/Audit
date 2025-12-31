// =====================================================
// OBSIDIAN AUDIT - ENGAGEMENT LIFECYCLE STATE MACHINE
// Enforces professional standards workflow for audits
// Standards: AU-C 300, ISQM 1
// =====================================================

import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export type EngagementState =
  | 'draft'
  | 'acceptance_pending'
  | 'accepted'
  | 'planning'
  | 'planning_review'
  | 'fieldwork'
  | 'fieldwork_review'
  | 'wrap_up'
  | 'reporting'
  | 'partner_review'
  | 'issued'
  | 'archived';

export type EngagementAction =
  | 'submit_for_acceptance'
  | 'approve_acceptance'
  | 'reject_acceptance'
  | 'begin_planning'
  | 'submit_planning'
  | 'approve_planning'
  | 'request_planning_revision'
  | 'begin_fieldwork'
  | 'submit_fieldwork'
  | 'approve_fieldwork'
  | 'request_fieldwork_revision'
  | 'begin_wrap_up'
  | 'begin_reporting'
  | 'submit_for_partner_review'
  | 'approve_report'
  | 'request_report_revision'
  | 'issue_report'
  | 'archive';

export interface TransitionRequirement {
  field: string;
  description: string;
  validator: (context: EngagementContext) => boolean;
  errorMessage: string;
}

export interface EngagementContext {
  engagementId: string;
  firmId: string;

  // Acceptance requirements
  independenceDeclarationsComplete?: boolean;
  clientRiskAssessmentComplete?: boolean;
  clientRiskLevel?: 'low' | 'moderate' | 'high' | 'unacceptable';
  predecessorCommunicationComplete?: boolean;
  engagementLetterSigned?: boolean;
  partnerApprovalGranted?: boolean;
  amlKycComplete?: boolean;

  // Planning requirements
  teamAssigned?: boolean;
  materialityApproved?: boolean;
  riskAssessmentComplete?: boolean;
  auditStrategyDocumented?: boolean;
  auditProgramsCreated?: boolean;

  // Fieldwork requirements
  allProceduresComplete?: boolean;
  allFindingsDocumented?: boolean;
  allWorkpapersReviewed?: boolean;
  controlTestingComplete?: boolean;
  substantiveTestingComplete?: boolean;

  // Wrap-up requirements
  goingConcernAssessed?: boolean;
  subsequentEventsReviewed?: boolean;
  relatedPartiesEvaluated?: boolean;
  litigationReviewed?: boolean;
  estimatesEvaluated?: boolean;

  // Review requirements
  managerReviewComplete?: boolean;
  partnerReviewComplete?: boolean;
  eqcrRequired?: boolean;
  eqcrComplete?: boolean;

  // Reporting requirements
  opinionDetermined?: boolean;
  reportDrafted?: boolean;
  managementRepresentationReceived?: boolean;
  tcwgCommunicationsComplete?: boolean;
  partnerSignoffComplete?: boolean;

  // User context
  currentUserId?: string;
  currentUserRole?: 'staff' | 'senior' | 'manager' | 'partner' | 'admin';
}

export interface TransitionResult {
  success: boolean;
  newState?: EngagementState;
  blockedBy?: TransitionRequirement[];
  message: string;
}

// =====================================================
// STATE MACHINE DEFINITION
// =====================================================

const STATE_TRANSITIONS: Record<EngagementState, Partial<Record<EngagementAction, EngagementState>>> = {
  draft: {
    submit_for_acceptance: 'acceptance_pending',
  },
  acceptance_pending: {
    approve_acceptance: 'accepted',
    reject_acceptance: 'draft',
  },
  accepted: {
    begin_planning: 'planning',
  },
  planning: {
    submit_planning: 'planning_review',
  },
  planning_review: {
    approve_planning: 'fieldwork',
    request_planning_revision: 'planning',
  },
  fieldwork: {
    submit_fieldwork: 'fieldwork_review',
  },
  fieldwork_review: {
    approve_fieldwork: 'wrap_up',
    request_fieldwork_revision: 'fieldwork',
  },
  wrap_up: {
    begin_reporting: 'reporting',
  },
  reporting: {
    submit_for_partner_review: 'partner_review',
  },
  partner_review: {
    approve_report: 'issued',
    request_report_revision: 'reporting',
  },
  issued: {
    archive: 'archived',
  },
  archived: {},
};

// =====================================================
// TRANSITION REQUIREMENTS
// =====================================================

const TRANSITION_REQUIREMENTS: Partial<Record<EngagementAction, TransitionRequirement[]>> = {
  submit_for_acceptance: [
    {
      field: 'independenceDeclarationsComplete',
      description: 'Independence declarations from all team members',
      validator: (ctx) => ctx.independenceDeclarationsComplete === true,
      errorMessage: 'All team members must submit independence declarations (AU-C 220)',
    },
    {
      field: 'clientRiskAssessmentComplete',
      description: 'Client risk assessment',
      validator: (ctx) => ctx.clientRiskAssessmentComplete === true,
      errorMessage: 'Client risk assessment must be completed (ISQM 1)',
    },
    {
      field: 'clientRiskLevel',
      description: 'Acceptable client risk level',
      validator: (ctx) => ctx.clientRiskLevel !== 'unacceptable',
      errorMessage: 'Cannot accept engagement with unacceptable risk level without partner override',
    },
  ],

  approve_acceptance: [
    {
      field: 'predecessorCommunicationComplete',
      description: 'Predecessor auditor communication',
      validator: (ctx) => ctx.predecessorCommunicationComplete === true,
      errorMessage: 'Predecessor auditor communication required (AU-C 210.10)',
    },
    {
      field: 'engagementLetterSigned',
      description: 'Signed engagement letter',
      validator: (ctx) => ctx.engagementLetterSigned === true,
      errorMessage: 'Engagement letter must be signed by client (AU-C 210)',
    },
    {
      field: 'partnerApprovalGranted',
      description: 'Partner approval',
      validator: (ctx) => ctx.partnerApprovalGranted === true,
      errorMessage: 'Partner must approve engagement acceptance',
    },
    {
      field: 'amlKycComplete',
      description: 'AML/KYC verification',
      validator: (ctx) => ctx.amlKycComplete === true,
      errorMessage: 'AML/KYC verification must be completed',
    },
    {
      field: 'currentUserRole',
      description: 'Partner authorization required',
      validator: (ctx) => ctx.currentUserRole === 'partner' || ctx.currentUserRole === 'admin',
      errorMessage: 'Only partners can approve engagement acceptance',
    },
  ],

  begin_planning: [
    {
      field: 'teamAssigned',
      description: 'Audit team assigned',
      validator: (ctx) => ctx.teamAssigned === true,
      errorMessage: 'Audit team must be assigned before planning begins',
    },
  ],

  submit_planning: [
    {
      field: 'materialityApproved',
      description: 'Materiality approved',
      validator: (ctx) => ctx.materialityApproved === true,
      errorMessage: 'Materiality must be approved by manager/partner (AU-C 320)',
    },
    {
      field: 'riskAssessmentComplete',
      description: 'Risk assessment complete',
      validator: (ctx) => ctx.riskAssessmentComplete === true,
      errorMessage: 'Risk assessment must be completed (AU-C 315)',
    },
    {
      field: 'auditStrategyDocumented',
      description: 'Audit strategy documented',
      validator: (ctx) => ctx.auditStrategyDocumented === true,
      errorMessage: 'Overall audit strategy must be documented (AU-C 300)',
    },
    {
      field: 'auditProgramsCreated',
      description: 'Audit programs created',
      validator: (ctx) => ctx.auditProgramsCreated === true,
      errorMessage: 'Audit programs must be created based on risk assessment',
    },
  ],

  approve_planning: [
    {
      field: 'currentUserRole',
      description: 'Manager/Partner authorization',
      validator: (ctx) => ['manager', 'partner', 'admin'].includes(ctx.currentUserRole || ''),
      errorMessage: 'Only managers or partners can approve planning',
    },
  ],

  submit_fieldwork: [
    {
      field: 'allProceduresComplete',
      description: 'All procedures completed',
      validator: (ctx) => ctx.allProceduresComplete === true,
      errorMessage: 'All assigned procedures must be completed',
    },
    {
      field: 'allFindingsDocumented',
      description: 'All findings documented',
      validator: (ctx) => ctx.allFindingsDocumented === true,
      errorMessage: 'All findings must be documented with conclusions',
    },
    {
      field: 'controlTestingComplete',
      description: 'Control testing complete',
      validator: (ctx) => ctx.controlTestingComplete === true,
      errorMessage: 'Control testing must be completed (AU-C 330)',
    },
    {
      field: 'substantiveTestingComplete',
      description: 'Substantive testing complete',
      validator: (ctx) => ctx.substantiveTestingComplete === true,
      errorMessage: 'Substantive procedures must be completed (AU-C 330)',
    },
  ],

  approve_fieldwork: [
    {
      field: 'allWorkpapersReviewed',
      description: 'Workpapers reviewed',
      validator: (ctx) => ctx.allWorkpapersReviewed === true,
      errorMessage: 'All workpapers must be reviewed before fieldwork approval',
    },
    {
      field: 'currentUserRole',
      description: 'Manager/Partner authorization',
      validator: (ctx) => ['manager', 'partner', 'admin'].includes(ctx.currentUserRole || ''),
      errorMessage: 'Only managers or partners can approve fieldwork',
    },
  ],

  begin_reporting: [
    {
      field: 'goingConcernAssessed',
      description: 'Going concern assessed',
      validator: (ctx) => ctx.goingConcernAssessed === true,
      errorMessage: 'Going concern must be assessed (AU-C 570)',
    },
    {
      field: 'subsequentEventsReviewed',
      description: 'Subsequent events reviewed',
      validator: (ctx) => ctx.subsequentEventsReviewed === true,
      errorMessage: 'Subsequent events must be reviewed (AU-C 560)',
    },
    {
      field: 'relatedPartiesEvaluated',
      description: 'Related parties evaluated',
      validator: (ctx) => ctx.relatedPartiesEvaluated === true,
      errorMessage: 'Related party transactions must be evaluated (AU-C 550)',
    },
    {
      field: 'managerReviewComplete',
      description: 'Manager review complete',
      validator: (ctx) => ctx.managerReviewComplete === true,
      errorMessage: 'Manager review must be completed before reporting',
    },
  ],

  submit_for_partner_review: [
    {
      field: 'opinionDetermined',
      description: 'Opinion determined',
      validator: (ctx) => ctx.opinionDetermined === true,
      errorMessage: 'Audit opinion must be determined (AU-C 700)',
    },
    {
      field: 'reportDrafted',
      description: 'Report drafted',
      validator: (ctx) => ctx.reportDrafted === true,
      errorMessage: 'Audit report must be drafted',
    },
    {
      field: 'managementRepresentationReceived',
      description: 'Management representation letter received',
      validator: (ctx) => ctx.managementRepresentationReceived === true,
      errorMessage: 'Management representation letter must be received (AU-C 580)',
    },
    {
      field: 'tcwgCommunicationsComplete',
      description: 'TCWG communications complete',
      validator: (ctx) => ctx.tcwgCommunicationsComplete === true,
      errorMessage: 'Required TCWG communications must be completed (AU-C 260)',
    },
    {
      field: 'eqcrComplete',
      description: 'EQCR complete (if required)',
      validator: (ctx) => !ctx.eqcrRequired || ctx.eqcrComplete === true,
      errorMessage: 'Engagement Quality Control Review must be completed (ISQM 2)',
    },
  ],

  approve_report: [
    {
      field: 'partnerReviewComplete',
      description: 'Partner review complete',
      validator: (ctx) => ctx.partnerReviewComplete === true,
      errorMessage: 'Partner must complete review before approval',
    },
    {
      field: 'currentUserRole',
      description: 'Partner authorization required',
      validator: (ctx) => ctx.currentUserRole === 'partner' || ctx.currentUserRole === 'admin',
      errorMessage: 'Only partners can approve the audit report for issuance',
    },
  ],

  issue_report: [
    {
      field: 'partnerSignoffComplete',
      description: 'Partner sign-off',
      validator: (ctx) => ctx.partnerSignoffComplete === true,
      errorMessage: 'Partner must sign off on the report before issuance',
    },
  ],
};

// =====================================================
// ROLE REQUIREMENTS FOR ACTIONS
// =====================================================

const ACTION_ROLE_REQUIREMENTS: Partial<Record<EngagementAction, string[]>> = {
  approve_acceptance: ['partner', 'admin'],
  reject_acceptance: ['partner', 'admin'],
  approve_planning: ['manager', 'partner', 'admin'],
  request_planning_revision: ['manager', 'partner', 'admin'],
  approve_fieldwork: ['manager', 'partner', 'admin'],
  request_fieldwork_revision: ['manager', 'partner', 'admin'],
  approve_report: ['partner', 'admin'],
  request_report_revision: ['partner', 'admin'],
  issue_report: ['partner', 'admin'],
  archive: ['partner', 'admin'],
};

// =====================================================
// STATE MACHINE CLASS
// =====================================================

export class EngagementStateMachine {
  private state: EngagementState;
  private context: EngagementContext;

  constructor(initialState: EngagementState, context: EngagementContext) {
    this.state = initialState;
    this.context = context;
  }

  /**
   * Get current state
   */
  getState(): EngagementState {
    return this.state;
  }

  /**
   * Get current context
   */
  getContext(): EngagementContext {
    return this.context;
  }

  /**
   * Update context
   */
  updateContext(updates: Partial<EngagementContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Get available actions from current state
   */
  getAvailableActions(): EngagementAction[] {
    const transitions = STATE_TRANSITIONS[this.state];
    return Object.keys(transitions) as EngagementAction[];
  }

  /**
   * Check if an action can be performed
   */
  canPerformAction(action: EngagementAction): TransitionResult {
    // Check if action is valid for current state
    const transitions = STATE_TRANSITIONS[this.state];
    if (!transitions[action]) {
      return {
        success: false,
        message: `Action '${action}' is not valid from state '${this.state}'`,
      };
    }

    // Check role requirements
    const requiredRoles = ACTION_ROLE_REQUIREMENTS[action];
    if (requiredRoles && !requiredRoles.includes(this.context.currentUserRole || '')) {
      return {
        success: false,
        message: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`,
      };
    }

    // Check transition requirements
    const requirements = TRANSITION_REQUIREMENTS[action] || [];
    const blockedBy = requirements.filter(req => !req.validator(this.context));

    if (blockedBy.length > 0) {
      return {
        success: false,
        blockedBy,
        message: `Cannot perform action. Missing requirements: ${blockedBy.map(r => r.description).join(', ')}`,
      };
    }

    return {
      success: true,
      newState: transitions[action],
      message: `Action '${action}' can be performed`,
    };
  }

  /**
   * Perform a state transition
   */
  performAction(action: EngagementAction): TransitionResult {
    const canPerform = this.canPerformAction(action);

    if (!canPerform.success) {
      logger.warn('Engagement state transition blocked', undefined, {
        engagementId: this.context.engagementId,
        currentState: this.state,
        action,
        blockedBy: canPerform.blockedBy?.map(r => r.field),
      });
      return canPerform;
    }

    const previousState = this.state;
    this.state = canPerform.newState!;

    logger.info('Engagement state transition', {
      engagementId: this.context.engagementId,
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
   * Get requirements for an action
   */
  getRequirementsForAction(action: EngagementAction): TransitionRequirement[] {
    return TRANSITION_REQUIREMENTS[action] || [];
  }

  /**
   * Get blocking requirements for an action
   */
  getBlockingRequirements(action: EngagementAction): TransitionRequirement[] {
    const requirements = TRANSITION_REQUIREMENTS[action] || [];
    return requirements.filter(req => !req.validator(this.context));
  }

  /**
   * Check if engagement is in a terminal state
   */
  isTerminal(): boolean {
    return this.state === 'archived';
  }

  /**
   * Check if engagement is active (not archived or issued)
   */
  isActive(): boolean {
    return !['issued', 'archived'].includes(this.state);
  }

  /**
   * Get state display name
   */
  static getStateDisplayName(state: EngagementState): string {
    const names: Record<EngagementState, string> = {
      draft: 'Draft',
      acceptance_pending: 'Pending Acceptance',
      accepted: 'Accepted',
      planning: 'Planning',
      planning_review: 'Planning Review',
      fieldwork: 'Fieldwork',
      fieldwork_review: 'Fieldwork Review',
      wrap_up: 'Wrap-Up',
      reporting: 'Reporting',
      partner_review: 'Partner Review',
      issued: 'Issued',
      archived: 'Archived',
    };
    return names[state];
  }

  /**
   * Get state color for UI
   */
  static getStateColor(state: EngagementState): string {
    const colors: Record<EngagementState, string> = {
      draft: 'bg-gray-100 text-gray-700',
      acceptance_pending: 'bg-yellow-100 text-yellow-700',
      accepted: 'bg-blue-100 text-blue-700',
      planning: 'bg-indigo-100 text-indigo-700',
      planning_review: 'bg-purple-100 text-purple-700',
      fieldwork: 'bg-cyan-100 text-cyan-700',
      fieldwork_review: 'bg-purple-100 text-purple-700',
      wrap_up: 'bg-orange-100 text-orange-700',
      reporting: 'bg-pink-100 text-pink-700',
      partner_review: 'bg-purple-100 text-purple-700',
      issued: 'bg-green-100 text-green-700',
      archived: 'bg-gray-100 text-gray-500',
    };
    return colors[state];
  }

  /**
   * Get action display name
   */
  static getActionDisplayName(action: EngagementAction): string {
    const names: Record<EngagementAction, string> = {
      submit_for_acceptance: 'Submit for Acceptance',
      approve_acceptance: 'Approve Acceptance',
      reject_acceptance: 'Reject Acceptance',
      begin_planning: 'Begin Planning',
      submit_planning: 'Submit Planning for Review',
      approve_planning: 'Approve Planning',
      request_planning_revision: 'Request Revision',
      begin_fieldwork: 'Begin Fieldwork',
      submit_fieldwork: 'Submit Fieldwork for Review',
      approve_fieldwork: 'Approve Fieldwork',
      request_fieldwork_revision: 'Request Revision',
      begin_wrap_up: 'Begin Wrap-Up',
      begin_reporting: 'Begin Reporting',
      submit_for_partner_review: 'Submit for Partner Review',
      approve_report: 'Approve Report',
      request_report_revision: 'Request Revision',
      issue_report: 'Issue Report',
      archive: 'Archive Engagement',
    };
    return names[action];
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a new engagement state machine from database record
 */
export function createEngagementStateMachine(
  engagement: {
    id: string;
    firm_id: string;
    status: string;
  },
  context: Partial<EngagementContext>
): EngagementStateMachine {
  return new EngagementStateMachine(
    engagement.status as EngagementState,
    {
      engagementId: engagement.id,
      firmId: engagement.firm_id,
      ...context,
    }
  );
}

/**
 * Get all possible states
 */
export function getAllEngagementStates(): EngagementState[] {
  return Object.keys(STATE_TRANSITIONS) as EngagementState[];
}

/**
 * Get workflow progress percentage
 */
export function getEngagementProgress(state: EngagementState): number {
  const progressMap: Record<EngagementState, number> = {
    draft: 0,
    acceptance_pending: 5,
    accepted: 10,
    planning: 20,
    planning_review: 30,
    fieldwork: 50,
    fieldwork_review: 70,
    wrap_up: 80,
    reporting: 85,
    partner_review: 90,
    issued: 100,
    archived: 100,
  };
  return progressMap[state];
}
