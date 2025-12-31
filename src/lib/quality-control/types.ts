/**
 * Quality Control Types
 * Type definitions for the quality control and EQCR module
 *
 * Implements:
 * - ISQM 1: Quality Management for Firms
 * - ISQM 2: Engagement Quality Reviews
 * - AU-C 220: Quality Control for an Engagement
 */

// ============================================
// Engagement Quality Review Types
// ============================================

export type EQCRStatus =
  | 'not_required'
  | 'pending_assignment'
  | 'assigned'
  | 'in_progress'
  | 'findings_raised'
  | 'findings_resolved'
  | 'approved'
  | 'completed';

export type EQCRTrigger =
  | 'public_interest_entity'
  | 'high_risk_engagement'
  | 'first_year_engagement'
  | 'complex_transactions'
  | 'partner_request'
  | 'quality_concern'
  | 'regulatory_requirement'
  | 'firm_policy';

export type FindingSeverity = 'observation' | 'minor' | 'significant' | 'critical';

export type FindingStatus = 'open' | 'pending_response' | 'resolved' | 'closed';

// ============================================
// EQCR Assessment
// ============================================

export interface EQCRAssessment {
  id: string;
  engagementId: string;

  // Assignment
  isRequired: boolean;
  triggers: EQCRTrigger[];
  eqcrReviewerId?: string;
  eqcrReviewerName?: string;
  assignedAt?: Date;

  // Review scope
  scope: {
    planningPhase: boolean;
    riskAssessment: boolean;
    significantJudgments: boolean;
    auditEvidence: boolean;
    conclusions: boolean;
    reportDraft: boolean;
    documentation: boolean;
  };

  // Review progress
  status: EQCRStatus;
  reviewStartedAt?: Date;
  reviewCompletedAt?: Date;

  // Findings
  findings: EQCRFinding[];
  totalFindings: number;
  openFindings: number;

  // Sign-off
  eqcrConclusion?: 'approved' | 'approved_with_comments' | 'not_approved';
  conclusionRationale?: string;
  signedOffAt?: Date;
  signedOffBy?: string;

  // Documentation
  workpaperRefs: string[];
  notes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// EQCR Finding
// ============================================

export interface EQCRFinding {
  id: string;
  assessmentId: string;
  engagementId: string;

  // Finding identification
  findingNumber: string;
  findingTitle: string;
  findingDescription: string;

  // Classification
  severity: FindingSeverity;
  category: string;
  relatedArea: string;
  workpaperRef?: string;

  // Impact
  affectsConclusion: boolean;
  affectsReport: boolean;
  requiresAdditionalWork: boolean;

  // Status tracking
  status: FindingStatus;
  raisedAt: Date;
  raisedBy: string;

  // Response
  engagementTeamResponse?: string;
  respondedAt?: Date;
  respondedBy?: string;

  // Resolution
  resolutionDescription?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  eqcrAcceptedResolution?: boolean;

  // Communication
  communicatedToPartner: boolean;
  communicatedAt?: Date;
}

// ============================================
// Quality Checklist
// ============================================

export interface QualityChecklistItem {
  id: string;
  engagementId: string;
  phase: 'planning' | 'fieldwork' | 'wrap_up' | 'reporting';

  // Item details
  requirement: string;
  guidance?: string;
  standard?: string; // e.g., "AU-C 300.08"

  // Response
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
  workpaperRef?: string;

  // Review
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// Quality checklists by phase
export const QUALITY_CHECKLISTS = {
  planning: [
    {
      requirement: 'Engagement team has appropriate competence and capabilities',
      guidance: 'Consider industry experience, technical skills, and available resources',
      standard: 'AU-C 220.12',
    },
    {
      requirement: 'Independence requirements have been fulfilled',
      guidance: 'All team members have confirmed independence',
      standard: 'AU-C 220.09',
    },
    {
      requirement: 'Client acceptance/continuance procedures completed',
      guidance: 'Risk assessment and acceptance decision documented',
      standard: 'AU-C 220.10-11',
    },
    {
      requirement: 'Engagement letter signed',
      guidance: 'Terms of engagement agreed and documented',
      standard: 'AU-C 210.06',
    },
    {
      requirement: 'Overall audit strategy established',
      guidance: 'Scope, timing, and direction of audit determined',
      standard: 'AU-C 300.07',
    },
    {
      requirement: 'Materiality determined',
      guidance: 'Planning materiality and performance materiality documented',
      standard: 'AU-C 320.10-11',
    },
    {
      requirement: 'Risk assessment procedures performed',
      guidance: 'Understanding of entity and environment obtained',
      standard: 'AU-C 315',
    },
    {
      requirement: 'Significant risks identified',
      guidance: 'Risks requiring special audit consideration identified',
      standard: 'AU-C 315.28',
    },
  ],
  fieldwork: [
    {
      requirement: 'Audit procedures responsive to assessed risks',
      guidance: 'Procedures address identified risks appropriately',
      standard: 'AU-C 330.06',
    },
    {
      requirement: 'Sufficient appropriate audit evidence obtained',
      guidance: 'Evidence supports conclusions reached',
      standard: 'AU-C 500',
    },
    {
      requirement: 'Control testing completed (if reliance intended)',
      guidance: 'Tests of controls performed and documented',
      standard: 'AU-C 330.08-17',
    },
    {
      requirement: 'Substantive procedures completed',
      guidance: 'Substantive analytical procedures and tests of details performed',
      standard: 'AU-C 330.18-23',
    },
    {
      requirement: 'Work of specialists evaluated',
      guidance: 'Specialist work assessed for adequacy',
      standard: 'AU-C 620',
    },
    {
      requirement: 'Related party procedures performed',
      guidance: 'Related party transactions identified and evaluated',
      standard: 'AU-C 550',
    },
    {
      requirement: 'Going concern evaluation performed',
      guidance: 'Management\'s assessment evaluated',
      standard: 'AU-C 570',
    },
  ],
  wrap_up: [
    {
      requirement: 'All procedures completed per audit plan',
      guidance: 'No open items remain',
      standard: 'AU-C 330.28',
    },
    {
      requirement: 'Uncorrected misstatements evaluated',
      guidance: 'Effect on financial statements and opinion considered',
      standard: 'AU-C 450.11',
    },
    {
      requirement: 'Subsequent events procedures performed',
      guidance: 'Events between balance sheet date and report date evaluated',
      standard: 'AU-C 560',
    },
    {
      requirement: 'Management representations obtained',
      guidance: 'Written representations covering all required matters',
      standard: 'AU-C 580',
    },
    {
      requirement: 'Attorney letters received',
      guidance: 'Legal counsel responses to litigation inquiry received',
      standard: 'AU-C 501',
    },
    {
      requirement: 'Review notes cleared',
      guidance: 'All review comments addressed and resolved',
      standard: 'AU-C 220.19',
    },
    {
      requirement: 'Documentation review completed',
      guidance: 'Workpapers complete and properly cross-referenced',
      standard: 'AU-C 230.08-13',
    },
  ],
  reporting: [
    {
      requirement: 'Opinion formed based on evaluation of evidence',
      guidance: 'Sufficient appropriate evidence supports conclusion',
      standard: 'AU-C 700.10-15',
    },
    {
      requirement: 'Financial statement disclosures adequate',
      guidance: 'Disclosures comply with applicable framework',
      standard: 'AU-C 700.16-19',
    },
    {
      requirement: 'Going concern conclusion reached',
      guidance: 'Appropriate report modification if substantial doubt exists',
      standard: 'AU-C 570',
    },
    {
      requirement: 'EQCR completed (if required)',
      guidance: 'Engagement quality review completed and approved',
      standard: 'ISQM 2',
    },
    {
      requirement: 'Report date appropriate',
      guidance: 'Date when sufficient appropriate evidence obtained',
      standard: 'AU-C 700.46-47',
    },
    {
      requirement: 'TCWG communication completed',
      guidance: 'Required matters communicated to those charged with governance',
      standard: 'AU-C 260',
    },
    {
      requirement: 'Engagement partner approval obtained',
      guidance: 'Partner has approved release of report',
      standard: 'AU-C 220.18',
    },
  ],
};

// ============================================
// Review Notes
// ============================================

export type ReviewNoteStatus = 'open' | 'responded' | 'resolved' | 'withdrawn';

export type ReviewNotePriority = 'low' | 'medium' | 'high' | 'critical';

export interface ReviewNote {
  id: string;
  engagementId: string;
  workpaperId?: string;

  // Note details
  noteNumber: string;
  title: string;
  description: string;
  priority: ReviewNotePriority;

  // Classification
  category: string;
  affectedArea: string;

  // Status tracking
  status: ReviewNoteStatus;
  raisedBy: string;
  raisedAt: Date;
  assignedTo?: string;

  // Response
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;

  // Resolution
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Helper Functions
// ============================================

export function getEQCRStatusLabel(status: EQCRStatus): string {
  const labels: Record<EQCRStatus, string> = {
    not_required: 'Not Required',
    pending_assignment: 'Pending Assignment',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    findings_raised: 'Findings Raised',
    findings_resolved: 'Findings Resolved',
    approved: 'Approved',
    completed: 'Completed',
  };
  return labels[status];
}

export function getEQCRTriggerLabel(trigger: EQCRTrigger): string {
  const labels: Record<EQCRTrigger, string> = {
    public_interest_entity: 'Public Interest Entity',
    high_risk_engagement: 'High Risk Engagement',
    first_year_engagement: 'First Year Engagement',
    complex_transactions: 'Complex Transactions',
    partner_request: 'Partner Request',
    quality_concern: 'Quality Concern',
    regulatory_requirement: 'Regulatory Requirement',
    firm_policy: 'Firm Policy',
  };
  return labels[trigger];
}

export function getFindingSeverityLabel(severity: FindingSeverity): string {
  const labels: Record<FindingSeverity, string> = {
    observation: 'Observation',
    minor: 'Minor',
    significant: 'Significant',
    critical: 'Critical',
  };
  return labels[severity];
}

export function getReviewNoteStatusLabel(status: ReviewNoteStatus): string {
  const labels: Record<ReviewNoteStatus, string> = {
    open: 'Open',
    responded: 'Responded',
    resolved: 'Resolved',
    withdrawn: 'Withdrawn',
  };
  return labels[status];
}

/**
 * Determine if EQCR is required based on engagement characteristics
 */
export function determineEQCRRequired(
  isPublicInterestEntity: boolean,
  overallRiskRating: 'low' | 'moderate' | 'high',
  isFirstYear: boolean,
  hasComplexTransactions: boolean,
  hasQualityConcerns: boolean
): { required: boolean; triggers: EQCRTrigger[] } {
  const triggers: EQCRTrigger[] = [];

  if (isPublicInterestEntity) {
    triggers.push('public_interest_entity');
  }

  if (overallRiskRating === 'high') {
    triggers.push('high_risk_engagement');
  }

  if (isFirstYear) {
    triggers.push('first_year_engagement');
  }

  if (hasComplexTransactions) {
    triggers.push('complex_transactions');
  }

  if (hasQualityConcerns) {
    triggers.push('quality_concern');
  }

  return {
    required: triggers.length > 0,
    triggers,
  };
}

/**
 * Check if all findings are resolved for EQCR completion
 */
export function canCompleteEQCR(findings: EQCRFinding[]): {
  canComplete: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  const openFindings = findings.filter((f) => f.status !== 'closed');
  if (openFindings.length > 0) {
    blockers.push(`${openFindings.length} finding(s) still open`);
  }

  const unresolvedCritical = findings.filter(
    (f) => f.severity === 'critical' && f.status !== 'closed'
  );
  if (unresolvedCritical.length > 0) {
    blockers.push(`${unresolvedCritical.length} critical finding(s) unresolved`);
  }

  const unacceptedResolutions = findings.filter(
    (f) => f.status === 'resolved' && !f.eqcrAcceptedResolution
  );
  if (unacceptedResolutions.length > 0) {
    blockers.push(`${unacceptedResolutions.length} resolution(s) pending EQCR acceptance`);
  }

  return {
    canComplete: blockers.length === 0,
    blockers,
  };
}
