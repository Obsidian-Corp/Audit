/**
 * Subsequent Events Types (AU-C 560)
 * Type definitions for subsequent events evaluation
 */

// ============================================
// Core Types
// ============================================

export type SubsequentEventType =
  | 'type_1'   // Adjusting - conditions existed at balance sheet date
  | 'type_2';  // Non-adjusting - conditions arose after balance sheet date

export type EventStatus =
  | 'identified'
  | 'under_evaluation'
  | 'evaluated'
  | 'disclosed'
  | 'adjusted'
  | 'no_action_required';

export type EventCategory =
  | 'litigation'
  | 'asset_impairment'
  | 'inventory_obsolescence'
  | 'receivable_collectability'
  | 'business_combination'
  | 'restructuring'
  | 'debt_default'
  | 'stock_issuance'
  | 'natural_disaster'
  | 'regulatory_change'
  | 'key_personnel'
  | 'customer_supplier'
  | 'going_concern'
  | 'other';

export interface SubsequentEvent {
  id: string;
  engagementId: string;

  // Event identification
  eventDescription: string;
  eventCategory: EventCategory;
  eventDate: Date;
  identificationDate: Date;

  // Classification
  eventType: SubsequentEventType;
  typeJustification: string;

  // Financial impact
  estimatedImpact?: number;
  impactAssessment: string;
  isMaterial: boolean;

  // Accounting treatment
  requiresAdjustment: boolean;
  adjustmentDescription?: string;
  ajeId?: string;

  // Disclosure
  requiresDisclosure: boolean;
  disclosureDescription?: string;
  disclosureAdequate?: boolean;

  // Management assessment
  managementAssessment?: string;
  managementAssessmentDate?: Date;

  // Audit procedures
  proceduresPerformed: string;
  evidenceObtained: string;
  conclusion: string;

  // Status
  status: EventStatus;

  // Sign-off
  evaluatedBy?: string;
  evaluatedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Review Checklist
// ============================================

export interface SubsequentEventsProcedure {
  id: string;
  engagementId: string;

  // Procedure
  procedureArea: SubsequentEventsProcedureArea;
  procedureDescription: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;

  // Findings
  findingsDescription?: string;
  eventsIdentified: boolean;
  eventIds?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type SubsequentEventsProcedureArea =
  | 'minutes_review'
  | 'interim_financials'
  | 'cash_receipts'
  | 'cash_disbursements'
  | 'litigation_inquiry'
  | 'attorney_letters'
  | 'management_inquiry'
  | 'regulatory_filings'
  | 'debt_agreements'
  | 'cutoff_procedures'
  | 'other';

export const SUBSEQUENT_EVENTS_PROCEDURES: Record<
  SubsequentEventsProcedureArea,
  {
    name: string;
    description: string;
    timing: string;
  }
> = {
  minutes_review: {
    name: 'Minutes Review',
    description: 'Review minutes of board of directors and relevant committee meetings held after period end',
    timing: 'Through date of auditor\'s report',
  },
  interim_financials: {
    name: 'Interim Financial Statements',
    description: 'Read the entity\'s interim financial statements (if available)',
    timing: 'Most recent available',
  },
  cash_receipts: {
    name: 'Cash Receipts Review',
    description: 'Review cash receipts recorded after year end for items received before year end',
    timing: 'First 30-60 days after period end',
  },
  cash_disbursements: {
    name: 'Cash Disbursements Review',
    description: 'Review cash disbursements recorded after year end for items payable before year end',
    timing: 'First 30-60 days after period end',
  },
  litigation_inquiry: {
    name: 'Litigation Inquiry',
    description: 'Inquire of management and legal counsel regarding litigation, claims, and assessments',
    timing: 'As of date of auditor\'s report',
  },
  attorney_letters: {
    name: 'Attorney Letters',
    description: 'Obtain and review attorney response letters',
    timing: 'Dated close to auditor\'s report date',
  },
  management_inquiry: {
    name: 'Management Inquiry',
    description: 'Inquire of management about subsequent events affecting the financial statements',
    timing: 'As of date of auditor\'s report',
  },
  regulatory_filings: {
    name: 'Regulatory Filings',
    description: 'Review regulatory filings made after period end',
    timing: 'Through date of auditor\'s report',
  },
  debt_agreements: {
    name: 'Debt Agreements Review',
    description: 'Review debt agreements for compliance with covenants',
    timing: 'As of most recent measurement date',
  },
  cutoff_procedures: {
    name: 'Cutoff Procedures',
    description: 'Perform cutoff procedures for revenue, purchases, and other transactions',
    timing: 'Around period end',
  },
  other: {
    name: 'Other Procedures',
    description: 'Other subsequent events procedures specific to the engagement',
    timing: 'As applicable',
  },
};

// ============================================
// Date Definitions
// ============================================

export interface SubsequentEventsDates {
  balanceSheetDate: Date;
  fieldworkCompletionDate: Date;
  auditReportDate: Date;
  financialStatementsIssuedDate?: Date;
  reissuanceDate?: Date;
}

// ============================================
// Helper Functions
// ============================================

export function getEventTypeLabel(type: SubsequentEventType): string {
  return type === 'type_1' ? 'Type 1 (Adjusting)' : 'Type 2 (Non-adjusting)';
}

export function getEventCategoryLabel(category: EventCategory): string {
  const labels: Record<EventCategory, string> = {
    litigation: 'Litigation & Claims',
    asset_impairment: 'Asset Impairment',
    inventory_obsolescence: 'Inventory Obsolescence',
    receivable_collectability: 'Receivable Collectability',
    business_combination: 'Business Combination',
    restructuring: 'Restructuring',
    debt_default: 'Debt Default or Renegotiation',
    stock_issuance: 'Stock Issuance or Repurchase',
    natural_disaster: 'Natural Disaster',
    regulatory_change: 'Regulatory Change',
    key_personnel: 'Key Personnel Changes',
    customer_supplier: 'Loss of Major Customer/Supplier',
    going_concern: 'Going Concern',
    other: 'Other',
  };
  return labels[category];
}

export function getEventStatusLabel(status: EventStatus): string {
  const labels: Record<EventStatus, string> = {
    identified: 'Identified',
    under_evaluation: 'Under Evaluation',
    evaluated: 'Evaluated',
    disclosed: 'Disclosed',
    adjusted: 'Adjusted',
    no_action_required: 'No Action Required',
  };
  return labels[status];
}

/**
 * Determine event type based on circumstances
 */
export function determineEventType(
  eventDate: Date,
  balanceSheetDate: Date,
  conditionsExistedAtYearEnd: boolean
): SubsequentEventType {
  if (conditionsExistedAtYearEnd) {
    return 'type_1'; // Adjusting
  }
  return 'type_2'; // Non-adjusting
}

/**
 * Determine required accounting treatment
 */
export function determineAccountingTreatment(
  eventType: SubsequentEventType,
  isMaterial: boolean
): {
  requiresAdjustment: boolean;
  requiresDisclosure: boolean;
  guidance: string;
} {
  if (eventType === 'type_1') {
    return {
      requiresAdjustment: true,
      requiresDisclosure: isMaterial,
      guidance: 'Type 1 events require adjustment to the financial statements as they provide additional evidence about conditions that existed at the balance sheet date.',
    };
  }

  return {
    requiresAdjustment: false,
    requiresDisclosure: isMaterial,
    guidance: 'Type 2 events do not require adjustment but may require disclosure if non-disclosure would make the financial statements misleading.',
  };
}

/**
 * Determine if dual dating is required
 */
export function requiresDualDating(
  eventDate: Date,
  originalReportDate: Date,
  isReissuance: boolean
): boolean {
  // Dual dating is typically used when a subsequent event occurs after the original
  // audit report date but before reissuance
  return isReissuance && eventDate > originalReportDate;
}
