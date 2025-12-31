/**
 * Related Parties Types (AU-C 550)
 * Type definitions for related party identification and transaction testing
 */

// ============================================
// Core Types
// ============================================

export type RelationshipType =
  | 'parent_company'
  | 'subsidiary'
  | 'affiliate'
  | 'joint_venture'
  | 'key_management'
  | 'board_member'
  | 'significant_shareholder'
  | 'family_member'
  | 'trust_beneficiary'
  | 'pension_plan'
  | 'other';

export type TransactionType =
  | 'sales'
  | 'purchases'
  | 'loans'
  | 'guarantees'
  | 'lease'
  | 'management_fees'
  | 'royalties'
  | 'transfer_assets'
  | 'compensation'
  | 'services'
  | 'other';

export type TransactionStatus =
  | 'identified'
  | 'under_review'
  | 'tested'
  | 'documented'
  | 'disclosed';

export interface RelatedParty {
  id: string;
  engagementId: string;

  // Identification
  partyName: string;
  relationshipType: RelationshipType;
  relationshipDescription: string;

  // Ownership/Control
  ownershipPercentage?: number;
  votingPercentage?: number;
  controlIndicators?: string[];

  // Contact
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;

  // Risk assessment
  isHighRisk: boolean;
  riskFactors?: string[];

  // Source of identification
  identificationSource: 'management_inquiry' | 'prior_year' | 'audit_procedures' | 'public_records' | 'other';
  identificationDate: Date;

  // Verification
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationMethod?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface RelatedPartyTransaction {
  id: string;
  engagementId: string;
  relatedPartyId: string;

  // Transaction details
  transactionType: TransactionType;
  transactionDescription: string;
  transactionDate: Date;
  transactionAmount: number;

  // Terms
  terms: string;
  isAtArmLength: boolean;
  armLengthAssessment?: string;
  pricingMethodology?: string;

  // Business purpose
  businessPurpose: string;
  economicSubstance: boolean;
  economicSubstanceAssessment?: string;

  // Authorization
  authorizedBy?: string;
  approvalDate?: Date;
  boardApproval: boolean;

  // Balance
  outstandingBalance?: number;
  balanceDate?: Date;

  // Accounting treatment
  accountingTreatment?: string;
  financialStatementLineItem?: string;

  // Testing
  status: TransactionStatus;
  testingProcedures?: string;
  testingConclusion?: string;
  exceptionsNoted?: string;

  // Disclosure
  disclosureRequired: boolean;
  disclosureAdequate?: boolean;
  disclosureReview?: string;

  // Sign-off
  testedBy?: string;
  testedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Inquiry Checklist
// ============================================

export interface RelatedPartyInquiry {
  id: string;
  engagementId: string;

  // Inquiry details
  inquiryArea: RelatedPartyInquiryArea;
  question: string;
  response: string;
  respondent: string;
  responseDate: Date;

  // Follow-up
  followUpRequired: boolean;
  followUpNotes?: string;
  followUpCompleted?: boolean;

  // Sign-off
  documentedBy: string;
  documentedAt: Date;
}

export type RelatedPartyInquiryArea =
  | 'ownership_structure'
  | 'management_relationships'
  | 'board_relationships'
  | 'significant_transactions'
  | 'unusual_terms'
  | 'guarantees'
  | 'consulting_agreements'
  | 'compensation_arrangements'
  | 'loans_advances'
  | 'other';

export const RELATED_PARTY_INQUIRY_QUESTIONS: Record<RelatedPartyInquiryArea, string[]> = {
  ownership_structure: [
    'Who are the owners/shareholders of the entity?',
    'Are there any affiliated entities?',
    'Have there been any changes in ownership during the period?',
  ],
  management_relationships: [
    'Do any members of management have relationships with other entities?',
    'Are there any side agreements with management?',
    'Does management have any outside business interests?',
  ],
  board_relationships: [
    'Do any board members serve on boards of other entities?',
    'Are there any family relationships among board members?',
    'Do board members have interests in entities that do business with the company?',
  ],
  significant_transactions: [
    'Were there any significant transactions with related parties during the period?',
    'Were any transactions conducted outside the normal course of business?',
    'Were any transactions at terms different from market terms?',
  ],
  unusual_terms: [
    'Were any transactions conducted with unusual terms or conditions?',
    'Were any transactions conducted at prices significantly different from fair value?',
    'Were there any transactions without apparent business rationale?',
  ],
  guarantees: [
    'Has the entity provided any guarantees for related parties?',
    'Has the entity received any guarantees from related parties?',
    'Are there any contingent liabilities related to related parties?',
  ],
  consulting_agreements: [
    'Are there any consulting agreements with related parties?',
    'What services are provided under these agreements?',
    'How are fees determined under these agreements?',
  ],
  compensation_arrangements: [
    'Are there any special compensation arrangements with related parties?',
    'Are there any loans to officers or directors?',
    'Are there any employment agreements with related parties?',
  ],
  loans_advances: [
    'Has the entity made any loans or advances to related parties?',
    'Has the entity received any loans or advances from related parties?',
    'What are the terms of any outstanding loans?',
  ],
  other: [
    'Are there any other related party relationships or transactions not previously discussed?',
    'Are you aware of any related party relationships that should be disclosed?',
  ],
};

// ============================================
// Helper Functions
// ============================================

export function getRelationshipTypeLabel(type: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    parent_company: 'Parent Company',
    subsidiary: 'Subsidiary',
    affiliate: 'Affiliate',
    joint_venture: 'Joint Venture',
    key_management: 'Key Management Personnel',
    board_member: 'Board Member',
    significant_shareholder: 'Significant Shareholder',
    family_member: 'Family Member of Key Personnel',
    trust_beneficiary: 'Trust/Beneficiary',
    pension_plan: 'Pension Plan',
    other: 'Other',
  };
  return labels[type];
}

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    sales: 'Sales of Goods/Services',
    purchases: 'Purchases of Goods/Services',
    loans: 'Loans or Advances',
    guarantees: 'Guarantees',
    lease: 'Lease Arrangements',
    management_fees: 'Management Fees',
    royalties: 'Royalties',
    transfer_assets: 'Transfer of Assets',
    compensation: 'Compensation',
    services: 'Services',
    other: 'Other',
  };
  return labels[type];
}

/**
 * Assess risk level of related party
 */
export function assessRelatedPartyRisk(party: Partial<RelatedParty>): {
  isHighRisk: boolean;
  riskFactors: string[];
} {
  const riskFactors: string[] = [];

  // High-risk indicators
  if (party.ownershipPercentage && party.ownershipPercentage >= 50) {
    riskFactors.push('Majority ownership/control');
  }

  if (party.relationshipType === 'key_management') {
    riskFactors.push('Related to key management personnel');
  }

  if (party.relationshipType === 'family_member') {
    riskFactors.push('Family member of key personnel');
  }

  // Additional factors would be added based on transaction analysis

  return {
    isHighRisk: riskFactors.length > 0,
    riskFactors,
  };
}

/**
 * Determine disclosure requirements
 */
export function determineDisclosureRequirements(
  transaction: Partial<RelatedPartyTransaction>,
  materialityThreshold: number
): {
  disclosureRequired: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (transaction.transactionAmount && transaction.transactionAmount >= materialityThreshold) {
    reasons.push('Transaction amount exceeds materiality');
  }

  if (!transaction.isAtArmLength) {
    reasons.push('Transaction not at arm\'s length');
  }

  if (!transaction.economicSubstance) {
    reasons.push('Transaction lacks economic substance');
  }

  if (transaction.transactionType === 'loans' || transaction.transactionType === 'guarantees') {
    reasons.push('Loans and guarantees require disclosure');
  }

  // Key management compensation always requires disclosure
  if (transaction.transactionType === 'compensation') {
    reasons.push('Key management compensation requires disclosure');
  }

  return {
    disclosureRequired: reasons.length > 0,
    reasons,
  };
}
