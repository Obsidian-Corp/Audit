/**
 * Analytical Procedures Types
 * Type definitions for analytical procedures per AU-C 520
 *
 * Implements:
 * - Risk assessment analytics (planning)
 * - Substantive analytical procedures
 * - Overall review analytics (conclusion)
 * - Trend analysis, ratio analysis, regression
 */

// ============================================
// Core Types
// ============================================

export type AnalyticalProcedurePhase =
  | 'planning'           // Risk assessment - required
  | 'substantive'        // Substantive testing - optional
  | 'overall_review';    // Final review - required

export type AnalyticalMethod =
  | 'trend_analysis'
  | 'ratio_analysis'
  | 'reasonableness_test'
  | 'regression'
  | 'comparison_to_budget'
  | 'comparison_to_prior'
  | 'comparison_to_industry'
  | 'scanning';

export type AnalyticalStatus =
  | 'draft'
  | 'in_progress'
  | 'documented'
  | 'reviewed'
  | 'concluded';

export type InvestigationStatus =
  | 'not_required'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'explained';

export interface AnalyticalProcedure {
  id: string;
  engagementId: string;
  leadScheduleId?: string;

  // Identification
  procedureNumber: string;
  procedureName: string;
  phase: AnalyticalProcedurePhase;
  method: AnalyticalMethod;

  // Account/Area
  accountArea: string;
  assertion?: string;
  relatedRisks?: string[];

  // Expectation
  expectationDescription: string;
  expectationBasis: string;
  expectedValue?: number;
  expectedRange?: {
    min: number;
    max: number;
  };
  thresholdForInvestigation: number;

  // Actual Results
  actualValue?: number;
  varianceAmount?: number;
  variancePercentage?: number;

  // Analysis Data
  dataPoints?: AnalyticalDataPoint[];
  ratios?: RatioCalculation[];
  trendData?: TrendAnalysisData;
  regressionResult?: RegressionResult;

  // Investigation
  investigationRequired: boolean;
  investigationStatus: InvestigationStatus;
  investigationExplanation?: string;
  corroboratingEvidence?: string;
  managementExplanation?: string;

  // Conclusion
  conclusionReached: boolean;
  conclusionDescription?: string;
  riskImplications?: string;
  furtherProceduresRequired: boolean;
  furtherProceduresDescription?: string;

  // Status
  status: AnalyticalStatus;

  // Sign-off
  preparedBy?: string;
  preparedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticalDataPoint {
  period: string;
  label: string;
  actualValue: number;
  expectedValue?: number;
  budgetValue?: number;
  priorYearValue?: number;
  industryValue?: number;
  variance?: number;
  variancePercentage?: number;
}

export interface RatioCalculation {
  ratioName: string;
  numerator: string;
  numeratorValue: number;
  denominator: string;
  denominatorValue: number;
  calculatedRatio: number;
  priorYearRatio?: number;
  industryBenchmark?: number;
  variance?: number;
  interpretation?: string;
}

export interface TrendAnalysisData {
  periods: string[];
  values: number[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  percentageChange: number;
  averageValue: number;
  standardDeviation: number;
}

export interface RegressionResult {
  equation: string;
  rSquared: number;
  slope: number;
  intercept: number;
  predictedValue: number;
  residual: number;
  standardError: number;
  isSignificant: boolean;
}

// ============================================
// Standard Financial Ratios
// ============================================

export interface FinancialRatios {
  // Liquidity
  currentRatio?: number;
  quickRatio?: number;
  cashRatio?: number;
  workingCapital?: number;

  // Profitability
  grossProfitMargin?: number;
  operatingMargin?: number;
  netProfitMargin?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;

  // Activity/Efficiency
  inventoryTurnover?: number;
  daysInventory?: number;
  receivablesTurnover?: number;
  daysReceivables?: number;
  payablesTurnover?: number;
  daysPayables?: number;
  assetTurnover?: number;

  // Leverage
  debtToEquity?: number;
  debtToAssets?: number;
  interestCoverage?: number;
  equityMultiplier?: number;

  // Coverage
  timesInterestEarned?: number;
  fixedChargeCoverage?: number;
}

export const STANDARD_RATIO_DEFINITIONS: Record<
  keyof FinancialRatios,
  {
    name: string;
    formula: string;
    category: string;
    interpretation: string;
  }
> = {
  currentRatio: {
    name: 'Current Ratio',
    formula: 'Current Assets / Current Liabilities',
    category: 'Liquidity',
    interpretation: 'Measures ability to pay short-term obligations',
  },
  quickRatio: {
    name: 'Quick Ratio',
    formula: '(Current Assets - Inventory) / Current Liabilities',
    category: 'Liquidity',
    interpretation: 'Measures ability to pay short-term obligations with liquid assets',
  },
  cashRatio: {
    name: 'Cash Ratio',
    formula: 'Cash & Equivalents / Current Liabilities',
    category: 'Liquidity',
    interpretation: 'Most conservative liquidity measure',
  },
  workingCapital: {
    name: 'Working Capital',
    formula: 'Current Assets - Current Liabilities',
    category: 'Liquidity',
    interpretation: 'Absolute measure of short-term financial health',
  },
  grossProfitMargin: {
    name: 'Gross Profit Margin',
    formula: '(Revenue - COGS) / Revenue',
    category: 'Profitability',
    interpretation: 'Profit remaining after direct costs',
  },
  operatingMargin: {
    name: 'Operating Margin',
    formula: 'Operating Income / Revenue',
    category: 'Profitability',
    interpretation: 'Profit from core operations',
  },
  netProfitMargin: {
    name: 'Net Profit Margin',
    formula: 'Net Income / Revenue',
    category: 'Profitability',
    interpretation: 'Bottom-line profitability',
  },
  returnOnAssets: {
    name: 'Return on Assets (ROA)',
    formula: 'Net Income / Total Assets',
    category: 'Profitability',
    interpretation: 'How efficiently assets generate profit',
  },
  returnOnEquity: {
    name: 'Return on Equity (ROE)',
    formula: 'Net Income / Shareholders Equity',
    category: 'Profitability',
    interpretation: 'Return to shareholders',
  },
  inventoryTurnover: {
    name: 'Inventory Turnover',
    formula: 'COGS / Average Inventory',
    category: 'Activity',
    interpretation: 'How quickly inventory sells',
  },
  daysInventory: {
    name: 'Days Inventory Outstanding',
    formula: '365 / Inventory Turnover',
    category: 'Activity',
    interpretation: 'Average days to sell inventory',
  },
  receivablesTurnover: {
    name: 'Receivables Turnover',
    formula: 'Revenue / Average Receivables',
    category: 'Activity',
    interpretation: 'How quickly receivables are collected',
  },
  daysReceivables: {
    name: 'Days Sales Outstanding',
    formula: '365 / Receivables Turnover',
    category: 'Activity',
    interpretation: 'Average collection period',
  },
  payablesTurnover: {
    name: 'Payables Turnover',
    formula: 'COGS / Average Payables',
    category: 'Activity',
    interpretation: 'How quickly payables are paid',
  },
  daysPayables: {
    name: 'Days Payables Outstanding',
    formula: '365 / Payables Turnover',
    category: 'Activity',
    interpretation: 'Average payment period',
  },
  assetTurnover: {
    name: 'Asset Turnover',
    formula: 'Revenue / Total Assets',
    category: 'Activity',
    interpretation: 'How efficiently assets generate revenue',
  },
  debtToEquity: {
    name: 'Debt to Equity',
    formula: 'Total Debt / Shareholders Equity',
    category: 'Leverage',
    interpretation: 'Financial leverage ratio',
  },
  debtToAssets: {
    name: 'Debt to Assets',
    formula: 'Total Debt / Total Assets',
    category: 'Leverage',
    interpretation: 'Proportion of assets financed by debt',
  },
  interestCoverage: {
    name: 'Interest Coverage',
    formula: 'EBIT / Interest Expense',
    category: 'Coverage',
    interpretation: 'Ability to pay interest obligations',
  },
  equityMultiplier: {
    name: 'Equity Multiplier',
    formula: 'Total Assets / Shareholders Equity',
    category: 'Leverage',
    interpretation: 'Asset to equity leverage',
  },
  timesInterestEarned: {
    name: 'Times Interest Earned',
    formula: 'EBIT / Interest Expense',
    category: 'Coverage',
    interpretation: 'Same as interest coverage',
  },
  fixedChargeCoverage: {
    name: 'Fixed Charge Coverage',
    formula: '(EBIT + Lease Payments) / (Interest + Lease Payments)',
    category: 'Coverage',
    interpretation: 'Ability to cover all fixed charges',
  },
};

// ============================================
// Helper Functions
// ============================================

export function getMethodLabel(method: AnalyticalMethod): string {
  const labels: Record<AnalyticalMethod, string> = {
    trend_analysis: 'Trend Analysis',
    ratio_analysis: 'Ratio Analysis',
    reasonableness_test: 'Reasonableness Test',
    regression: 'Regression Analysis',
    comparison_to_budget: 'Comparison to Budget',
    comparison_to_prior: 'Comparison to Prior Period',
    comparison_to_industry: 'Industry Comparison',
    scanning: 'Scanning',
  };
  return labels[method];
}

export function getPhaseLabel(phase: AnalyticalProcedurePhase): string {
  const labels: Record<AnalyticalProcedurePhase, string> = {
    planning: 'Planning (Risk Assessment)',
    substantive: 'Substantive',
    overall_review: 'Overall Review',
  };
  return labels[phase];
}

export function getStatusLabel(status: AnalyticalStatus): string {
  const labels: Record<AnalyticalStatus, string> = {
    draft: 'Draft',
    in_progress: 'In Progress',
    documented: 'Documented',
    reviewed: 'Reviewed',
    concluded: 'Concluded',
  };
  return labels[status];
}

/**
 * Calculate variance and determine if investigation required
 */
export function calculateVariance(
  actual: number,
  expected: number,
  thresholdPercentage: number
): {
  varianceAmount: number;
  variancePercentage: number;
  investigationRequired: boolean;
} {
  const varianceAmount = actual - expected;
  const variancePercentage = expected !== 0 ? ((actual - expected) / Math.abs(expected)) * 100 : 0;
  const investigationRequired = Math.abs(variancePercentage) > thresholdPercentage;

  return {
    varianceAmount,
    variancePercentage,
    investigationRequired,
  };
}

/**
 * Calculate financial ratios from trial balance data
 */
export function calculateFinancialRatios(data: {
  currentAssets: number;
  inventory: number;
  cashAndEquivalents: number;
  currentLiabilities: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  revenue: number;
  cogs: number;
  operatingIncome: number;
  netIncome: number;
  interestExpense: number;
  averageInventory?: number;
  averageReceivables?: number;
  averagePayables?: number;
}): FinancialRatios {
  return {
    // Liquidity
    currentRatio: data.currentLiabilities ? data.currentAssets / data.currentLiabilities : undefined,
    quickRatio: data.currentLiabilities
      ? (data.currentAssets - data.inventory) / data.currentLiabilities
      : undefined,
    cashRatio: data.currentLiabilities
      ? data.cashAndEquivalents / data.currentLiabilities
      : undefined,
    workingCapital: data.currentAssets - data.currentLiabilities,

    // Profitability
    grossProfitMargin: data.revenue ? (data.revenue - data.cogs) / data.revenue : undefined,
    operatingMargin: data.revenue ? data.operatingIncome / data.revenue : undefined,
    netProfitMargin: data.revenue ? data.netIncome / data.revenue : undefined,
    returnOnAssets: data.totalAssets ? data.netIncome / data.totalAssets : undefined,
    returnOnEquity: data.shareholdersEquity ? data.netIncome / data.shareholdersEquity : undefined,

    // Activity
    inventoryTurnover:
      data.averageInventory && data.averageInventory !== 0
        ? data.cogs / data.averageInventory
        : undefined,
    receivablesTurnover:
      data.averageReceivables && data.averageReceivables !== 0
        ? data.revenue / data.averageReceivables
        : undefined,
    assetTurnover: data.totalAssets ? data.revenue / data.totalAssets : undefined,

    // Leverage
    debtToEquity: data.shareholdersEquity ? data.totalLiabilities / data.shareholdersEquity : undefined,
    debtToAssets: data.totalAssets ? data.totalLiabilities / data.totalAssets : undefined,

    // Coverage
    interestCoverage:
      data.interestExpense && data.interestExpense !== 0
        ? (data.netIncome + data.interestExpense) / data.interestExpense
        : undefined,
  };
}

/**
 * Perform trend analysis on a series of values
 */
export function performTrendAnalysis(
  periods: string[],
  values: number[]
): TrendAnalysisData {
  if (values.length < 2) {
    return {
      periods,
      values,
      trend: 'stable',
      percentageChange: 0,
      averageValue: values[0] || 0,
      standardDeviation: 0,
    };
  }

  const averageValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate standard deviation
  const squaredDiffs = values.map((v) => (v - averageValue) ** 2);
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);

  // Calculate overall percentage change
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const percentageChange =
    firstValue !== 0 ? ((lastValue - firstValue) / Math.abs(firstValue)) * 100 : 0;

  // Determine trend direction
  let trend: TrendAnalysisData['trend'];
  const coefficientOfVariation = standardDeviation / averageValue;

  if (coefficientOfVariation > 0.5) {
    trend = 'volatile';
  } else if (percentageChange > 5) {
    trend = 'increasing';
  } else if (percentageChange < -5) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }

  return {
    periods,
    values,
    trend,
    percentageChange,
    averageValue,
    standardDeviation,
  };
}

/**
 * Simple linear regression
 */
export function performRegression(
  independentValues: number[],
  dependentValues: number[]
): RegressionResult {
  const n = independentValues.length;

  if (n !== dependentValues.length || n < 2) {
    throw new Error('Invalid data for regression');
  }

  // Calculate means
  const meanX = independentValues.reduce((a, b) => a + b, 0) / n;
  const meanY = dependentValues.reduce((a, b) => a + b, 0) / n;

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (independentValues[i] - meanX) * (dependentValues[i] - meanY);
    denominator += (independentValues[i] - meanX) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  // Calculate R-squared
  const predictions = independentValues.map((x) => slope * x + intercept);
  const ssRes = dependentValues.reduce(
    (sum, y, i) => sum + (y - predictions[i]) ** 2,
    0
  );
  const ssTot = dependentValues.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  // Calculate standard error
  const residuals = dependentValues.map((y, i) => y - predictions[i]);
  const standardError = Math.sqrt(ssRes / (n - 2));

  // Predict using the last independent value
  const lastX = independentValues[independentValues.length - 1];
  const predictedValue = slope * lastX + intercept;
  const residual = dependentValues[dependentValues.length - 1] - predictedValue;

  return {
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    rSquared,
    slope,
    intercept,
    predictedValue,
    residual,
    standardError,
    isSignificant: rSquared >= 0.7, // Rule of thumb
  };
}
