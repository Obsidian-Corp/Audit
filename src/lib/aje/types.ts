/**
 * Adjusting Journal Entry (AJE) Types
 * Type definitions for audit adjustments tracking
 *
 * Implements:
 * - Adjusting journal entries (AJE)
 * - Reclassification entries (RJE)
 * - Summary of Audit Differences (SAD)
 * - Passed adjustments tracking
 */

// ============================================
// Core Types
// ============================================

export type AJEType =
  | 'adjusting'           // Corrects a misstatement
  | 'reclassifying'       // Corrects classification (no net effect)
  | 'proposed'            // Suggested but not yet approved
  | 'passed';             // Known misstatement, not adjusted

export type AJEStatus =
  | 'draft'
  | 'proposed'
  | 'accepted_by_management'
  | 'rejected_by_management'
  | 'recorded'
  | 'passed';

export type MisstatementType =
  | 'factual'             // Identified with certainty
  | 'judgmental'          // Difference in judgment
  | 'projected';          // From sampling projection

export interface AdjustingJournalEntry {
  id: string;
  engagementId: string;

  // Identification
  ajeNumber: string;
  description: string;
  type: AJEType;
  misstatementType: MisstatementType;

  // Relationship
  leadScheduleId?: string;
  accountArea: string;
  procedureId?: string;

  // Entry details
  lineItems: AJELineItem[];
  totalDebits: number;
  totalCredits: number;
  netEffect: number;

  // Materiality assessment
  isMaterial: boolean;
  materialityImpact: number;
  performanceMaterialityImpact: number;

  // Assertions affected
  assertionsAffected: string[];

  // Rationale
  basisForAdjustment: string;
  auditEvidenceReference?: string;

  // For passed adjustments
  passedReason?: string;
  passedJustification?: string;

  // Management response
  managementResponse?: string;
  managementResponseDate?: Date;
  managementContact?: string;

  // Status
  status: AJEStatus;

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

export interface AJELineItem {
  id: string;
  ajeId: string;

  // Account
  accountNumber: string;
  accountName: string;
  trialBalanceAccountId?: string;

  // Entry
  debitAmount: number;
  creditAmount: number;

  // Description
  lineDescription?: string;

  // Order
  lineNumber: number;
}

// ============================================
// Summary Types
// ============================================

export interface SummaryOfAuditDifferences {
  engagementId: string;
  materialityThreshold: number;
  performanceMateriality: number;

  // Aggregations
  factualMisstatements: MisstatementSummary;
  judgmentalMisstatements: MisstatementSummary;
  projectedMisstatements: MisstatementSummary;

  // Totals
  totalUnadjustedMisstatements: number;
  totalAdjustedMisstatements: number;
  totalPassedAdjustments: number;
  netUnadjustedEffect: number;

  // By account type
  assetOverstatement: number;
  assetUnderstatement: number;
  liabilityOverstatement: number;
  liabilityUnderstatement: number;
  incomeOverstatement: number;
  incomeUnderstatement: number;

  // Materiality conclusion
  isMaterial: boolean;
  conclusionRationale: string;
}

export interface MisstatementSummary {
  count: number;
  totalAmount: number;
  overstatements: number;
  understatements: number;
  netEffect: number;
  items: Array<{
    ajeId: string;
    ajeNumber: string;
    description: string;
    amount: number;
    status: AJEStatus;
  }>;
}

// ============================================
// Helper Functions
// ============================================

export function getAJETypeLabel(type: AJEType): string {
  const labels: Record<AJEType, string> = {
    adjusting: 'Adjusting Journal Entry (AJE)',
    reclassifying: 'Reclassifying Journal Entry (RJE)',
    proposed: 'Proposed Adjustment',
    passed: 'Passed Adjustment',
  };
  return labels[type];
}

export function getAJEStatusLabel(status: AJEStatus): string {
  const labels: Record<AJEStatus, string> = {
    draft: 'Draft',
    proposed: 'Proposed to Management',
    accepted_by_management: 'Accepted by Management',
    rejected_by_management: 'Rejected by Management',
    recorded: 'Recorded',
    passed: 'Passed (Not Recorded)',
  };
  return labels[status];
}

export function getMisstatementTypeLabel(type: MisstatementType): string {
  const labels: Record<MisstatementType, string> = {
    factual: 'Factual Misstatement',
    judgmental: 'Judgmental Misstatement',
    projected: 'Projected Misstatement',
  };
  return labels[type];
}

/**
 * Validate AJE entries balance
 */
export function validateAJEBalance(lineItems: AJELineItem[]): {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  variance: number;
} {
  const totalDebits = lineItems.reduce((sum, item) => sum + (item.debitAmount || 0), 0);
  const totalCredits = lineItems.reduce((sum, item) => sum + (item.creditAmount || 0), 0);
  const variance = Math.abs(totalDebits - totalCredits);
  const isBalanced = variance < 0.01; // Allow for rounding

  return {
    isBalanced,
    totalDebits,
    totalCredits,
    variance,
  };
}

/**
 * Calculate net effect of AJE (impact on net income)
 */
export function calculateNetEffect(
  lineItems: AJELineItem[],
  accountTypes: Record<string, 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>
): number {
  let netEffect = 0;

  lineItems.forEach((item) => {
    const accountType = accountTypes[item.accountNumber];
    const amount = item.debitAmount - item.creditAmount;

    switch (accountType) {
      case 'revenue':
        // Credit to revenue = increase income, debit = decrease
        netEffect -= amount;
        break;
      case 'expense':
        // Debit to expense = decrease income, credit = increase
        netEffect -= amount;
        break;
      // Assets, liabilities, equity don't directly affect net income
    }
  });

  return netEffect;
}

/**
 * Determine if aggregate misstatements are material
 */
export function evaluateAggregateMateriality(
  unadjustedMisstatements: number,
  passedAdjustments: number,
  materialityThreshold: number,
  performanceMateriality: number
): {
  isMaterial: boolean;
  riskLevel: 'low' | 'moderate' | 'high';
  conclusionRationale: string;
} {
  const total = unadjustedMisstatements + passedAdjustments;

  if (total >= materialityThreshold) {
    return {
      isMaterial: true,
      riskLevel: 'high',
      conclusionRationale: `Aggregate uncorrected misstatements (${formatCurrency(total)}) exceed overall materiality (${formatCurrency(materialityThreshold)}). The financial statements may be materially misstated.`,
    };
  }

  if (total >= performanceMateriality) {
    return {
      isMaterial: false,
      riskLevel: 'moderate',
      conclusionRationale: `Aggregate uncorrected misstatements (${formatCurrency(total)}) exceed performance materiality (${formatCurrency(performanceMateriality)}) but are below overall materiality. Consider whether additional audit procedures are necessary.`,
    };
  }

  return {
    isMaterial: false,
    riskLevel: 'low',
    conclusionRationale: `Aggregate uncorrected misstatements (${formatCurrency(total)}) are below performance materiality (${formatCurrency(performanceMateriality)}). The misstatements are not material to the financial statements.`,
  };
}

/**
 * Generate AJE number
 */
export function generateAJENumber(existingCount: number, type: AJEType): string {
  const prefix = type === 'reclassifying' ? 'RJE' : type === 'passed' ? 'PASS' : 'AJE';
  return `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
}

/**
 * Create summary of audit differences
 */
export function createSADSummary(
  entries: AdjustingJournalEntry[],
  materialityThreshold: number,
  performanceMateriality: number
): SummaryOfAuditDifferences {
  const factualEntries = entries.filter((e) => e.misstatementType === 'factual');
  const judgmentalEntries = entries.filter((e) => e.misstatementType === 'judgmental');
  const projectedEntries = entries.filter((e) => e.misstatementType === 'projected');

  const createSummary = (items: AdjustingJournalEntry[]): MisstatementSummary => {
    const overstatements = items
      .filter((e) => e.netEffect > 0)
      .reduce((sum, e) => sum + e.netEffect, 0);
    const understatements = items
      .filter((e) => e.netEffect < 0)
      .reduce((sum, e) => sum + Math.abs(e.netEffect), 0);

    return {
      count: items.length,
      totalAmount: items.reduce((sum, e) => sum + Math.abs(e.netEffect), 0),
      overstatements,
      understatements,
      netEffect: overstatements - understatements,
      items: items.map((e) => ({
        ajeId: e.id,
        ajeNumber: e.ajeNumber,
        description: e.description,
        amount: e.netEffect,
        status: e.status,
      })),
    };
  };

  const unadjusted = entries.filter(
    (e) => e.status === 'passed' || e.status === 'rejected_by_management'
  );
  const adjusted = entries.filter((e) => e.status === 'recorded');

  const totalUnadjusted = unadjusted.reduce((sum, e) => sum + Math.abs(e.netEffect), 0);
  const netUnadjusted = unadjusted.reduce((sum, e) => sum + e.netEffect, 0);

  const evaluation = evaluateAggregateMateriality(
    totalUnadjusted,
    0,
    materialityThreshold,
    performanceMateriality
  );

  return {
    engagementId: entries[0]?.engagementId || '',
    materialityThreshold,
    performanceMateriality,
    factualMisstatements: createSummary(factualEntries),
    judgmentalMisstatements: createSummary(judgmentalEntries),
    projectedMisstatements: createSummary(projectedEntries),
    totalUnadjustedMisstatements: totalUnadjusted,
    totalAdjustedMisstatements: adjusted.reduce((sum, e) => sum + Math.abs(e.netEffect), 0),
    totalPassedAdjustments: unadjusted.filter((e) => e.status === 'passed').length,
    netUnadjustedEffect: netUnadjusted,
    assetOverstatement: 0, // Would need account type mapping
    assetUnderstatement: 0,
    liabilityOverstatement: 0,
    liabilityUnderstatement: 0,
    incomeOverstatement: entries.filter((e) => e.netEffect > 0).reduce((sum, e) => sum + e.netEffect, 0),
    incomeUnderstatement: entries.filter((e) => e.netEffect < 0).reduce((sum, e) => sum + Math.abs(e.netEffect), 0),
    isMaterial: evaluation.isMaterial,
    conclusionRationale: evaluation.conclusionRationale,
  };
}

// Helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
}
