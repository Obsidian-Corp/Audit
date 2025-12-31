/**
 * TCWG Communications Types (AU-C 260 & AU-C 265)
 * Type definitions for communications with those charged with governance
 */

// ============================================
// Core Types
// ============================================

export type CommunicationType =
  | 'planning'
  | 'significant_findings'
  | 'control_deficiencies'
  | 'fraud'
  | 'noncompliance'
  | 'other_matters'
  | 'independence'
  | 'engagement_completion';

export type CommunicationMethod = 'written' | 'verbal' | 'meeting';

export type CommunicationStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'communicated'
  | 'acknowledged';

export interface TCWGCommunication {
  id: string;
  engagementId: string;

  // Communication details
  communicationType: CommunicationType;
  subject: string;
  description: string;

  // Timing
  communicationDate: Date;
  method: CommunicationMethod;
  meetingDate?: Date;

  // Recipients
  recipients: TCWGRecipient[];

  // Content
  content: CommunicationContent[];
  attachments?: string[];

  // Response
  tcwgResponse?: string;
  responseDate?: Date;
  acknowledgmentReceived: boolean;

  // Status
  status: CommunicationStatus;

  // Sign-off
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  partnerApproval?: string;
  partnerApprovalDate?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TCWGRecipient {
  id: string;
  name: string;
  title: string;
  role: 'board_member' | 'audit_committee' | 'management' | 'other';
  email?: string;
  acknowledged?: boolean;
  acknowledgedDate?: Date;
}

export interface CommunicationContent {
  id: string;
  communicationId: string;
  topic: CommunicationTopic;
  matter: string;
  details: string;
  auditImplication?: string;
  managementResponse?: string;
  orderNumber: number;
}

export type CommunicationTopic =
  | 'auditor_responsibilities'
  | 'planned_scope_timing'
  | 'significant_risks'
  | 'accounting_policies'
  | 'accounting_estimates'
  | 'financial_statement_disclosures'
  | 'audit_adjustments'
  | 'unadjusted_misstatements'
  | 'material_weaknesses'
  | 'significant_deficiencies'
  | 'fraud'
  | 'noncompliance'
  | 'going_concern'
  | 'related_parties'
  | 'subsequent_events'
  | 'disagreements_management'
  | 'difficulties_encountered'
  | 'written_representations'
  | 'independence'
  | 'other';

// ============================================
// Standard Communication Requirements
// ============================================

export const REQUIRED_COMMUNICATIONS: Record<
  CommunicationType,
  Array<{
    topic: CommunicationTopic;
    description: string;
    timing: string;
    source: string;
    required: boolean;
  }>
> = {
  planning: [
    {
      topic: 'auditor_responsibilities',
      description: 'The auditor\'s responsibilities in relation to the financial statement audit',
      timing: 'Before commencing the audit',
      source: 'AU-C 260.14',
      required: true,
    },
    {
      topic: 'planned_scope_timing',
      description: 'An overview of the planned scope and timing of the audit',
      timing: 'Before commencing fieldwork',
      source: 'AU-C 260.14',
      required: true,
    },
    {
      topic: 'significant_risks',
      description: 'Significant risks identified during planning',
      timing: 'During planning',
      source: 'AU-C 260.15',
      required: true,
    },
  ],
  significant_findings: [
    {
      topic: 'accounting_policies',
      description: 'Significant accounting policies, including the initial selection and changes',
      timing: 'Before issuing the report',
      source: 'AU-C 260.15',
      required: true,
    },
    {
      topic: 'accounting_estimates',
      description: 'Significant accounting estimates and related management judgments',
      timing: 'Before issuing the report',
      source: 'AU-C 260.15',
      required: true,
    },
    {
      topic: 'financial_statement_disclosures',
      description: 'Significant financial statement disclosures',
      timing: 'Before issuing the report',
      source: 'AU-C 260.15',
      required: true,
    },
    {
      topic: 'audit_adjustments',
      description: 'Audit adjustments recorded by the entity',
      timing: 'Before issuing the report',
      source: 'AU-C 260.15',
      required: true,
    },
    {
      topic: 'unadjusted_misstatements',
      description: 'Uncorrected misstatements and the effect on the auditor\'s opinion',
      timing: 'Before issuing the report',
      source: 'AU-C 260.15',
      required: true,
    },
    {
      topic: 'disagreements_management',
      description: 'Any disagreements with management',
      timing: 'When they occur',
      source: 'AU-C 260.16',
      required: true,
    },
    {
      topic: 'difficulties_encountered',
      description: 'Significant difficulties encountered during the audit',
      timing: 'When they occur',
      source: 'AU-C 260.16',
      required: true,
    },
  ],
  control_deficiencies: [
    {
      topic: 'material_weaknesses',
      description: 'Material weaknesses in internal control identified during the audit',
      timing: 'In writing, before issuing the report',
      source: 'AU-C 265.10',
      required: true,
    },
    {
      topic: 'significant_deficiencies',
      description: 'Significant deficiencies in internal control identified during the audit',
      timing: 'In writing, before issuing the report',
      source: 'AU-C 265.11',
      required: true,
    },
  ],
  fraud: [
    {
      topic: 'fraud',
      description: 'Fraud involving management, employees with significant internal control roles, or resulting in material misstatement',
      timing: 'As soon as practicable',
      source: 'AU-C 240.40',
      required: true,
    },
  ],
  noncompliance: [
    {
      topic: 'noncompliance',
      description: 'Identified or suspected noncompliance with laws and regulations',
      timing: 'As soon as practicable',
      source: 'AU-C 250.15',
      required: true,
    },
  ],
  independence: [
    {
      topic: 'independence',
      description: 'All relationships between the firm and the entity that may reasonably be thought to bear on independence',
      timing: 'At least annually',
      source: 'AU-C 260.17',
      required: true,
    },
  ],
  other_matters: [
    {
      topic: 'going_concern',
      description: 'Conditions and events that raise substantial doubt about going concern',
      timing: 'When identified',
      source: 'AU-C 570',
      required: false,
    },
    {
      topic: 'related_parties',
      description: 'Significant related party transactions outside normal business',
      timing: 'When identified',
      source: 'AU-C 550',
      required: false,
    },
    {
      topic: 'subsequent_events',
      description: 'Subsequent events that require adjustment or disclosure',
      timing: 'When identified',
      source: 'AU-C 560',
      required: false,
    },
    {
      topic: 'written_representations',
      description: 'An overview of the written representations requested',
      timing: 'Before issuing the report',
      source: 'AU-C 580',
      required: false,
    },
  ],
  engagement_completion: [
    {
      topic: 'other',
      description: 'Other matters arising from the audit that are significant to governance',
      timing: 'Before issuing the report',
      source: 'AU-C 260.16',
      required: false,
    },
  ],
};

// ============================================
// Helper Functions
// ============================================

export function getCommunicationTypeLabel(type: CommunicationType): string {
  const labels: Record<CommunicationType, string> = {
    planning: 'Planning Communication',
    significant_findings: 'Significant Findings',
    control_deficiencies: 'Control Deficiencies',
    fraud: 'Fraud Communication',
    noncompliance: 'Noncompliance Communication',
    other_matters: 'Other Matters',
    independence: 'Independence Communication',
    engagement_completion: 'Engagement Completion',
  };
  return labels[type];
}

export function getTopicLabel(topic: CommunicationTopic): string {
  const labels: Record<CommunicationTopic, string> = {
    auditor_responsibilities: 'Auditor\'s Responsibilities',
    planned_scope_timing: 'Planned Scope and Timing',
    significant_risks: 'Significant Risks',
    accounting_policies: 'Accounting Policies',
    accounting_estimates: 'Accounting Estimates',
    financial_statement_disclosures: 'Financial Statement Disclosures',
    audit_adjustments: 'Audit Adjustments',
    unadjusted_misstatements: 'Unadjusted Misstatements',
    material_weaknesses: 'Material Weaknesses',
    significant_deficiencies: 'Significant Deficiencies',
    fraud: 'Fraud',
    noncompliance: 'Noncompliance',
    going_concern: 'Going Concern',
    related_parties: 'Related Parties',
    subsequent_events: 'Subsequent Events',
    disagreements_management: 'Disagreements with Management',
    difficulties_encountered: 'Difficulties Encountered',
    written_representations: 'Written Representations',
    independence: 'Independence',
    other: 'Other Matters',
  };
  return labels[topic];
}

export function getCommunicationStatusLabel(status: CommunicationStatus): string {
  const labels: Record<CommunicationStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    communicated: 'Communicated',
    acknowledged: 'Acknowledged',
  };
  return labels[status];
}

/**
 * Generate checklist of required communications
 */
export function generateCommunicationsChecklist(
  existingCommunications: TCWGCommunication[]
): Array<{
  type: CommunicationType;
  topic: CommunicationTopic;
  description: string;
  required: boolean;
  completed: boolean;
  communicationId?: string;
}> {
  const checklist: Array<{
    type: CommunicationType;
    topic: CommunicationTopic;
    description: string;
    required: boolean;
    completed: boolean;
    communicationId?: string;
  }> = [];

  Object.entries(REQUIRED_COMMUNICATIONS).forEach(([type, requirements]) => {
    requirements.forEach((req) => {
      const existingComm = existingCommunications.find(
        (c) =>
          c.communicationType === type &&
          c.content.some((content) => content.topic === req.topic) &&
          c.status === 'communicated'
      );

      checklist.push({
        type: type as CommunicationType,
        topic: req.topic,
        description: req.description,
        required: req.required,
        completed: !!existingComm,
        communicationId: existingComm?.id,
      });
    });
  });

  return checklist;
}

/**
 * Validate all required communications have been made
 */
export function validateRequiredCommunications(
  communications: TCWGCommunication[]
): {
  isComplete: boolean;
  missingRequired: Array<{
    type: CommunicationType;
    topic: CommunicationTopic;
    description: string;
  }>;
} {
  const checklist = generateCommunicationsChecklist(communications);
  const missingRequired = checklist
    .filter((item) => item.required && !item.completed)
    .map((item) => ({
      type: item.type,
      topic: item.topic,
      description: item.description,
    }));

  return {
    isComplete: missingRequired.length === 0,
    missingRequired,
  };
}

/**
 * Determine timing requirements for communication
 */
export function determineCommunicationTiming(
  type: CommunicationType,
  topic: CommunicationTopic
): string {
  const requirements = REQUIRED_COMMUNICATIONS[type];
  const req = requirements?.find((r) => r.topic === topic);
  return req?.timing || 'Before issuing the report';
}
