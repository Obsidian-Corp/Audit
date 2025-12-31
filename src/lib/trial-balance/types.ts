/**
 * Trial Balance & Lead Schedule Types
 * Type definitions for trial balance management
 *
 * Implements core audit execution functionality:
 * - Trial balance import and mapping
 * - Lead schedule generation
 * - Account grouping and classification
 */

// ============================================
// Trial Balance Types
// ============================================

export type PeriodType = 'year_end' | 'interim' | 'prior_year';

export type TrialBalanceStatus = 'draft' | 'imported' | 'mapped' | 'reviewed' | 'finalized';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type FinancialStatement = 'balance_sheet' | 'income_statement' | 'cash_flow' | 'equity';

export interface TrialBalance {
  id: string;
  engagementId: string;

  // Period
  periodType: PeriodType;
  periodEndDate: Date;

  // Import
  sourceSystem?: string;
  importDate: Date;
  importedBy: string;

  // Status
  status: TrialBalanceStatus;
  isLocked: boolean;
  lockedAt?: Date;
  lockedBy?: string;

  // Totals
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;

  // Accounts
  accounts: TrialBalanceAccount[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TrialBalanceAccount {
  id: string;
  trialBalanceId: string;
  engagementId: string;

  // Identification
  accountNumber: string;
  accountName: string;

  // Classification
  accountType: AccountType;
  financialStatement: FinancialStatement;
  groupingCategory?: string;

  // Balances
  beginningBalance: number;
  endingBalance: number;

  // Adjustments
  auditAdjustments: number;
  reclassifications: number;
  finalBalance: number;

  // Prior year
  priorYearBalance?: number;

  // Mapping
  leadScheduleId?: string;
  isMapped: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Lead Schedule Types
// ============================================

export type RiskLevel = 'low' | 'moderate' | 'high';

export interface LeadSchedule {
  id: string;
  engagementId: string;

  // Identification
  scheduleNumber: string;
  scheduleName: string;
  financialStatementArea: string;

  // Balances
  beginningBalance: number;
  endingBalance: number;
  auditAdjustments: number;
  reclassifications: number;
  finalBalance: number;
  priorYearBalance?: number;

  // Materiality
  isMaterial: boolean;
  materialityThreshold?: number;

  // Risk
  riskLevel: RiskLevel;
  significantAccount: boolean;

  // Testing
  testingStrategy?: string;
  proceduresCompleted: boolean;

  // Linked accounts
  accounts: TrialBalanceAccount[];

  // Sign-off
  preparedBy?: string;
  preparedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Import Types
// ============================================

export interface TrialBalanceImport {
  accounts: ImportedAccount[];
  sourceSystem: string;
  periodEndDate: Date;
  totalDebits: number;
  totalCredits: number;
}

export interface ImportedAccount {
  accountNumber: string;
  accountName: string;
  debitBalance?: number;
  creditBalance?: number;
  accountType?: AccountType;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: {
    totalAccounts: number;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    variance: number;
  };
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

// ============================================
// Account Mapping Types
// ============================================

export interface AccountMapping {
  accountNumber: string;
  accountName: string;
  suggestedType: AccountType;
  suggestedStatement: FinancialStatement;
  suggestedCategory: string;
  confidence: number;
  leadScheduleId?: string;
}

export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  mappings: {
    pattern: string;
    accountType: AccountType;
    financialStatement: FinancialStatement;
    category: string;
    leadSchedule: string;
  }[];
}

// Standard chart of accounts categories
export const STANDARD_CATEGORIES: Record<AccountType, string[]> = {
  asset: [
    'Cash and Cash Equivalents',
    'Accounts Receivable',
    'Inventory',
    'Prepaid Expenses',
    'Property, Plant & Equipment',
    'Intangible Assets',
    'Investments',
    'Other Assets',
  ],
  liability: [
    'Accounts Payable',
    'Accrued Liabilities',
    'Short-term Debt',
    'Long-term Debt',
    'Deferred Revenue',
    'Other Liabilities',
  ],
  equity: [
    'Common Stock',
    'Retained Earnings',
    'Additional Paid-in Capital',
    'Treasury Stock',
    'Other Comprehensive Income',
  ],
  revenue: [
    'Sales Revenue',
    'Service Revenue',
    'Interest Income',
    'Other Income',
  ],
  expense: [
    'Cost of Goods Sold',
    'Salaries and Wages',
    'Rent Expense',
    'Depreciation',
    'Interest Expense',
    'Other Expenses',
  ],
};

// ============================================
// Variance Analysis Types
// ============================================

export interface VarianceAnalysis {
  accountId: string;
  accountNumber: string;
  accountName: string;
  currentBalance: number;
  priorBalance: number;
  variance: number;
  variancePercentage: number;
  isSignificant: boolean;
  requiresInvestigation: boolean;
  investigationNotes?: string;
}

export interface FluxAnalysisResult {
  totalAccounts: number;
  significantVariances: number;
  investigationRequired: number;
  variances: VarianceAnalysis[];
}

// ============================================
// Helper Functions
// ============================================

export function getAccountTypeLabel(type: AccountType): string {
  const labels: Record<AccountType, string> = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expense',
  };
  return labels[type];
}

export function getFinancialStatementLabel(statement: FinancialStatement): string {
  const labels: Record<FinancialStatement, string> = {
    balance_sheet: 'Balance Sheet',
    income_statement: 'Income Statement',
    cash_flow: 'Statement of Cash Flows',
    equity: 'Statement of Equity',
  };
  return labels[statement];
}

export function getPeriodTypeLabel(type: PeriodType): string {
  const labels: Record<PeriodType, string> = {
    year_end: 'Year End',
    interim: 'Interim',
    prior_year: 'Prior Year',
  };
  return labels[type];
}

export function getTrialBalanceStatusLabel(status: TrialBalanceStatus): string {
  const labels: Record<TrialBalanceStatus, string> = {
    draft: 'Draft',
    imported: 'Imported',
    mapped: 'Mapped',
    reviewed: 'Reviewed',
    finalized: 'Finalized',
  };
  return labels[status];
}

/**
 * Validate trial balance import data
 */
export function validateTrialBalanceImport(
  data: TrialBalanceImport
): ImportValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  let totalDebits = 0;
  let totalCredits = 0;

  data.accounts.forEach((account, index) => {
    const row = index + 1;

    // Required fields
    if (!account.accountNumber) {
      errors.push({ row, field: 'accountNumber', message: 'Account number is required' });
    }

    if (!account.accountName) {
      errors.push({ row, field: 'accountName', message: 'Account name is required' });
    }

    // Balance validation
    const debit = account.debitBalance || 0;
    const credit = account.creditBalance || 0;

    if (debit < 0) {
      errors.push({ row, field: 'debitBalance', message: 'Debit balance cannot be negative' });
    }

    if (credit < 0) {
      errors.push({ row, field: 'creditBalance', message: 'Credit balance cannot be negative' });
    }

    if (debit > 0 && credit > 0) {
      warnings.push({ row, field: 'balance', message: 'Account has both debit and credit balance' });
    }

    totalDebits += debit;
    totalCredits += credit;
  });

  const variance = Math.abs(totalDebits - totalCredits);
  const isBalanced = variance < 0.01; // Allow for rounding

  if (!isBalanced) {
    errors.push({
      row: 0,
      field: 'total',
      message: `Trial balance does not balance. Variance: ${variance.toFixed(2)}`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalAccounts: data.accounts.length,
      totalDebits,
      totalCredits,
      isBalanced,
      variance,
    },
  };
}

/**
 * Auto-classify account based on account number/name patterns
 */
export function autoClassifyAccount(
  accountNumber: string,
  accountName: string
): AccountMapping {
  const nameLower = accountName.toLowerCase();
  const numPrefix = accountNumber.substring(0, 1);

  let suggestedType: AccountType = 'asset';
  let suggestedStatement: FinancialStatement = 'balance_sheet';
  let suggestedCategory = 'Other Assets';
  let confidence = 0.5;

  // Number-based classification (common COA patterns)
  if (numPrefix === '1') {
    suggestedType = 'asset';
    suggestedStatement = 'balance_sheet';
    confidence = 0.7;
  } else if (numPrefix === '2') {
    suggestedType = 'liability';
    suggestedStatement = 'balance_sheet';
    confidence = 0.7;
  } else if (numPrefix === '3') {
    suggestedType = 'equity';
    suggestedStatement = 'balance_sheet';
    confidence = 0.7;
  } else if (numPrefix === '4') {
    suggestedType = 'revenue';
    suggestedStatement = 'income_statement';
    confidence = 0.7;
  } else if (numPrefix === '5' || numPrefix === '6' || numPrefix === '7') {
    suggestedType = 'expense';
    suggestedStatement = 'income_statement';
    confidence = 0.7;
  }

  // Name-based refinement
  if (nameLower.includes('cash') || nameLower.includes('bank')) {
    suggestedType = 'asset';
    suggestedCategory = 'Cash and Cash Equivalents';
    confidence = 0.9;
  } else if (nameLower.includes('receivable')) {
    suggestedType = 'asset';
    suggestedCategory = 'Accounts Receivable';
    confidence = 0.9;
  } else if (nameLower.includes('inventory')) {
    suggestedType = 'asset';
    suggestedCategory = 'Inventory';
    confidence = 0.9;
  } else if (nameLower.includes('prepaid')) {
    suggestedType = 'asset';
    suggestedCategory = 'Prepaid Expenses';
    confidence = 0.85;
  } else if (nameLower.includes('property') || nameLower.includes('equipment') || nameLower.includes('ppe')) {
    suggestedType = 'asset';
    suggestedCategory = 'Property, Plant & Equipment';
    confidence = 0.85;
  } else if (nameLower.includes('payable')) {
    suggestedType = 'liability';
    suggestedCategory = 'Accounts Payable';
    confidence = 0.9;
  } else if (nameLower.includes('accrued')) {
    suggestedType = 'liability';
    suggestedCategory = 'Accrued Liabilities';
    confidence = 0.85;
  } else if (nameLower.includes('debt') || nameLower.includes('loan') || nameLower.includes('note')) {
    suggestedType = 'liability';
    suggestedCategory = nameLower.includes('long') ? 'Long-term Debt' : 'Short-term Debt';
    confidence = 0.8;
  } else if (nameLower.includes('capital') || nameLower.includes('stock')) {
    suggestedType = 'equity';
    suggestedCategory = 'Common Stock';
    confidence = 0.8;
  } else if (nameLower.includes('retained')) {
    suggestedType = 'equity';
    suggestedCategory = 'Retained Earnings';
    confidence = 0.9;
  } else if (nameLower.includes('sales') || nameLower.includes('revenue')) {
    suggestedType = 'revenue';
    suggestedCategory = 'Sales Revenue';
    confidence = 0.9;
  } else if (nameLower.includes('cost of') || nameLower.includes('cogs')) {
    suggestedType = 'expense';
    suggestedCategory = 'Cost of Goods Sold';
    confidence = 0.9;
  } else if (nameLower.includes('salary') || nameLower.includes('wage') || nameLower.includes('payroll')) {
    suggestedType = 'expense';
    suggestedCategory = 'Salaries and Wages';
    confidence = 0.85;
  } else if (nameLower.includes('depreciation') || nameLower.includes('amortization')) {
    suggestedType = 'expense';
    suggestedCategory = 'Depreciation';
    confidence = 0.9;
  } else if (nameLower.includes('interest')) {
    if (nameLower.includes('income')) {
      suggestedType = 'revenue';
      suggestedCategory = 'Interest Income';
    } else {
      suggestedType = 'expense';
      suggestedCategory = 'Interest Expense';
    }
    confidence = 0.85;
  }

  return {
    accountNumber,
    accountName,
    suggestedType,
    suggestedStatement,
    suggestedCategory,
    confidence,
  };
}

/**
 * Calculate variance percentage
 */
export function calculateVariancePercentage(
  current: number,
  prior: number
): number {
  if (prior === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - prior) / Math.abs(prior)) * 100;
}

/**
 * Determine if variance is significant
 */
export function isSignificantVariance(
  variance: number,
  variancePercentage: number,
  materialityThreshold: number
): boolean {
  // Significant if:
  // 1. Absolute variance exceeds materiality, OR
  // 2. Percentage change exceeds 10%
  return Math.abs(variance) > materialityThreshold || Math.abs(variancePercentage) > 10;
}
