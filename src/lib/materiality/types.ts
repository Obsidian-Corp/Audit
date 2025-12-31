/**
 * Materiality Types
 * Type definitions for materiality calculation and approval workflow
 *
 * Implements AU-C 320: Materiality in Planning and Performing an Audit
 * - Overall materiality determination
 * - Performance materiality calculation
 * - Clearly trivial threshold
 * - Multi-level approval workflow
 */

// ============================================
// Materiality Calculation Types
// ============================================

export type MaterialityBenchmark =
  | 'total_assets'
  | 'total_revenue'
  | 'net_income'
  | 'gross_profit'
  | 'total_equity'
  | 'total_expenses';

export type MaterialityStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_partner_approval'
  | 'approved'
  | 'revised';

export interface MaterialityCalculation {
  id: string;
  engagementId: string;

  // Benchmark selection
  primaryBenchmark: MaterialityBenchmark;
  benchmarkAmount: number;
  benchmarkPercentage: number;

  // Calculated values
  overallMateriality: number;
  performanceMateriality: number;
  performanceMaterialityPercentage: number;
  clearlyTrivialThreshold: number;
  clearlyTrivialPercentage: number;

  // Risk-based adjustments
  riskAdjustmentFactor: number;
  riskAdjustmentRationale?: string;

  // Prior year comparison
  priorYearMateriality?: number;
  priorYearPercentageChange?: number;

  // Rationale and documentation
  benchmarkRationale: string;
  qualitativeFactors: QualitativeFactorAssessment[];

  // Approval workflow
  status: MaterialityStatus;
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  approvalComments?: string;

  // Version control
  version: number;
  isCurrentVersion: boolean;
  previousVersionId?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface QualitativeFactorAssessment {
  id: string;
  factor: QualitativeFactor;
  assessment: 'increases' | 'decreases' | 'no_impact';
  description: string;
  impact?: number; // Percentage adjustment
}

export type QualitativeFactor =
  | 'debt_covenants'
  | 'regulatory_requirements'
  | 'related_party_transactions'
  | 'management_integrity'
  | 'industry_volatility'
  | 'first_year_engagement'
  | 'public_interest'
  | 'fraud_risk'
  | 'control_deficiencies'
  | 'prior_year_adjustments';

// ============================================
// Benchmark Configuration
// ============================================

export interface BenchmarkConfig {
  benchmark: MaterialityBenchmark;
  label: string;
  description: string;
  typicalRange: {
    min: number;
    max: number;
  };
  applicableEntities: string[];
}

export const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  {
    benchmark: 'total_revenue',
    label: 'Total Revenue',
    description: 'Appropriate for commercial entities where revenue is the primary driver',
    typicalRange: { min: 0.5, max: 2.0 },
    applicableEntities: ['Commercial', 'Manufacturing', 'Service'],
  },
  {
    benchmark: 'net_income',
    label: 'Net Income (Pre-tax)',
    description: 'Appropriate for mature, profitable entities with stable earnings',
    typicalRange: { min: 3.0, max: 7.0 },
    applicableEntities: ['Commercial', 'Manufacturing'],
  },
  {
    benchmark: 'total_assets',
    label: 'Total Assets',
    description: 'Appropriate for asset-intensive entities or entities with volatile earnings',
    typicalRange: { min: 0.5, max: 2.0 },
    applicableEntities: ['Asset-intensive', 'Financial Services', 'Not-for-profit'],
  },
  {
    benchmark: 'gross_profit',
    label: 'Gross Profit',
    description: 'Appropriate for retail and distribution entities',
    typicalRange: { min: 1.0, max: 3.0 },
    applicableEntities: ['Retail', 'Distribution'],
  },
  {
    benchmark: 'total_equity',
    label: 'Total Equity',
    description: 'Appropriate for entities where equity is the primary measure',
    typicalRange: { min: 1.0, max: 3.0 },
    applicableEntities: ['Investment Companies', 'Holding Companies'],
  },
  {
    benchmark: 'total_expenses',
    label: 'Total Expenses',
    description: 'Appropriate for not-for-profit entities',
    typicalRange: { min: 0.5, max: 2.0 },
    applicableEntities: ['Not-for-profit', 'Government'],
  },
];

// ============================================
// Qualitative Factor Configuration
// ============================================

export interface QualitativeFactorConfig {
  factor: QualitativeFactor;
  label: string;
  description: string;
  defaultImpact: 'increases' | 'decreases';
  suggestedAdjustment: number;
}

export const QUALITATIVE_FACTOR_CONFIGS: QualitativeFactorConfig[] = [
  {
    factor: 'debt_covenants',
    label: 'Debt Covenants',
    description: 'Entity has significant debt covenants that could be affected by misstatements',
    defaultImpact: 'decreases',
    suggestedAdjustment: 10,
  },
  {
    factor: 'regulatory_requirements',
    label: 'Regulatory Requirements',
    description: 'Entity is subject to regulatory reporting requirements',
    defaultImpact: 'decreases',
    suggestedAdjustment: 15,
  },
  {
    factor: 'related_party_transactions',
    label: 'Related Party Transactions',
    description: 'Significant related party transactions exist',
    defaultImpact: 'decreases',
    suggestedAdjustment: 10,
  },
  {
    factor: 'management_integrity',
    label: 'Management Integrity Concerns',
    description: 'Concerns about management integrity or competence',
    defaultImpact: 'decreases',
    suggestedAdjustment: 20,
  },
  {
    factor: 'industry_volatility',
    label: 'Industry Volatility',
    description: 'Entity operates in a volatile or declining industry',
    defaultImpact: 'decreases',
    suggestedAdjustment: 10,
  },
  {
    factor: 'first_year_engagement',
    label: 'First Year Engagement',
    description: 'This is the first year of the audit engagement',
    defaultImpact: 'decreases',
    suggestedAdjustment: 10,
  },
  {
    factor: 'public_interest',
    label: 'Public Interest',
    description: 'Entity is of significant public interest',
    defaultImpact: 'decreases',
    suggestedAdjustment: 15,
  },
  {
    factor: 'fraud_risk',
    label: 'Elevated Fraud Risk',
    description: 'Elevated risk of fraud has been identified',
    defaultImpact: 'decreases',
    suggestedAdjustment: 20,
  },
  {
    factor: 'control_deficiencies',
    label: 'Known Control Deficiencies',
    description: 'Significant deficiencies or material weaknesses identified',
    defaultImpact: 'decreases',
    suggestedAdjustment: 15,
  },
  {
    factor: 'prior_year_adjustments',
    label: 'Prior Year Adjustments',
    description: 'Significant adjustments were proposed in prior year',
    defaultImpact: 'decreases',
    suggestedAdjustment: 10,
  },
];

// ============================================
// Allocation Types (for specific accounts/assertions)
// ============================================

export interface MaterialityAllocation {
  id: string;
  materialityCalculationId: string;
  leadScheduleId?: string;
  accountArea: string;
  allocatedAmount: number;
  allocationRationale: string;
  riskLevel: 'low' | 'moderate' | 'high';
}

// ============================================
// Helper Functions
// ============================================

export function getBenchmarkLabel(benchmark: MaterialityBenchmark): string {
  const config = BENCHMARK_CONFIGS.find((c) => c.benchmark === benchmark);
  return config?.label || benchmark;
}

export function getBenchmarkTypicalRange(benchmark: MaterialityBenchmark): { min: number; max: number } {
  const config = BENCHMARK_CONFIGS.find((c) => c.benchmark === benchmark);
  return config?.typicalRange || { min: 0.5, max: 2.0 };
}

export function getQualitativeFactorLabel(factor: QualitativeFactor): string {
  const config = QUALITATIVE_FACTOR_CONFIGS.find((c) => c.factor === factor);
  return config?.label || factor;
}

export function getMaterialityStatusLabel(status: MaterialityStatus): string {
  const labels: Record<MaterialityStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    pending_partner_approval: 'Pending Partner Approval',
    approved: 'Approved',
    revised: 'Revised',
  };
  return labels[status];
}

/**
 * Calculate overall materiality based on benchmark
 */
export function calculateOverallMateriality(
  benchmarkAmount: number,
  percentage: number
): number {
  return Math.round(benchmarkAmount * (percentage / 100));
}

/**
 * Calculate performance materiality (typically 50-75% of overall)
 */
export function calculatePerformanceMateriality(
  overallMateriality: number,
  percentage: number = 75
): number {
  return Math.round(overallMateriality * (percentage / 100));
}

/**
 * Calculate clearly trivial threshold (typically 3-5% of overall)
 */
export function calculateClearlyTrivialThreshold(
  overallMateriality: number,
  percentage: number = 5
): number {
  return Math.round(overallMateriality * (percentage / 100));
}

/**
 * Apply qualitative factor adjustments
 */
export function applyQualitativeAdjustments(
  baseMateriality: number,
  factors: QualitativeFactorAssessment[]
): number {
  let totalAdjustment = 0;

  factors.forEach((factor) => {
    if (factor.impact) {
      if (factor.assessment === 'increases') {
        totalAdjustment += factor.impact;
      } else if (factor.assessment === 'decreases') {
        totalAdjustment -= factor.impact;
      }
    }
  });

  // Cap adjustments at +/- 50%
  totalAdjustment = Math.max(-50, Math.min(50, totalAdjustment));

  return Math.round(baseMateriality * (1 + totalAdjustment / 100));
}

/**
 * Validate materiality calculation
 */
export function validateMaterialityCalculation(
  calculation: Partial<MaterialityCalculation>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!calculation.primaryBenchmark) {
    errors.push('Primary benchmark is required');
  }

  if (!calculation.benchmarkAmount || calculation.benchmarkAmount <= 0) {
    errors.push('Benchmark amount must be greater than zero');
  }

  if (!calculation.benchmarkPercentage || calculation.benchmarkPercentage <= 0) {
    errors.push('Benchmark percentage must be greater than zero');
  }

  if (calculation.benchmarkPercentage && calculation.primaryBenchmark) {
    const range = getBenchmarkTypicalRange(calculation.primaryBenchmark);
    if (
      calculation.benchmarkPercentage < range.min ||
      calculation.benchmarkPercentage > range.max * 1.5
    ) {
      errors.push(
        `Benchmark percentage outside typical range (${range.min}% - ${range.max}%). Provide justification.`
      );
    }
  }

  if (!calculation.benchmarkRationale || calculation.benchmarkRationale.length < 50) {
    errors.push('Benchmark rationale must be at least 50 characters');
  }

  if (
    calculation.performanceMaterialityPercentage &&
    (calculation.performanceMaterialityPercentage < 50 ||
      calculation.performanceMaterialityPercentage > 90)
  ) {
    errors.push('Performance materiality should typically be 50-90% of overall materiality');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if materiality revision is needed based on audit findings
 */
export function shouldReviseMateriality(
  currentMateriality: number,
  aggregateMisstatements: number,
  clearlyTrivialThreshold: number
): { shouldRevise: boolean; reason?: string } {
  // If aggregate misstatements approach materiality, consider revision
  if (aggregateMisstatements > currentMateriality * 0.75) {
    return {
      shouldRevise: true,
      reason: 'Aggregate misstatements exceed 75% of overall materiality',
    };
  }

  // If there are many items just below clearly trivial
  // (This would need additional data to properly assess)

  return { shouldRevise: false };
}
