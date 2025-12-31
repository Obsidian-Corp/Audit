/**
 * Audit Sampling Types
 * Type definitions for audit sampling per AU-C 530
 *
 * Implements:
 * - Statistical and non-statistical sampling
 * - Sample selection methods (MUS, random, systematic, haphazard)
 * - Sample size determination
 * - Error projection
 * - Sampling risk assessment
 */

// ============================================
// Core Sampling Types
// ============================================

export type SamplingMethod =
  | 'monetary_unit'        // MUS - Monetary Unit Sampling
  | 'classical_variable'   // Mean-per-unit, difference, ratio estimation
  | 'attributes'           // For testing controls
  | 'random'               // Simple random sampling
  | 'systematic'           // Every nth item
  | 'haphazard'            // Non-statistical judgmental
  | 'block'                // Consecutive items
  | 'targeted';            // Specific high-risk items

export type SamplingPurpose = 'test_of_controls' | 'substantive_test' | 'dual_purpose';

export type SampleStatus =
  | 'planned'
  | 'selected'
  | 'in_progress'
  | 'tested'
  | 'evaluated'
  | 'concluded';

export type ItemTestResult = 'no_exception' | 'exception' | 'not_applicable' | 'pending';

export interface AuditSample {
  id: string;
  engagementId: string;
  leadScheduleId?: string;
  procedureId?: string;

  // Sample identification
  sampleName: string;
  description: string;
  purpose: SamplingPurpose;
  assertion: AuditAssertion;

  // Population
  populationDescription: string;
  populationSize: number;
  populationValue: number;
  stratificationApplied: boolean;
  strata?: PopulationStratum[];

  // Sampling parameters
  method: SamplingMethod;
  isStatistical: boolean;
  confidenceLevel: number;        // e.g., 95, 90
  expectedErrorRate?: number;     // For attributes sampling
  tolerableErrorRate?: number;    // For attributes sampling
  tolerableError?: number;        // For substantive tests (dollars)
  expectedMisstatement?: number;  // For substantive tests

  // Sample size
  calculatedSampleSize: number;
  actualSampleSize: number;
  sampleSizeRationale?: string;

  // Selection
  selectionSeed?: number;        // For reproducibility
  selectionInterval?: number;    // For systematic sampling
  selectionStartPoint?: number;

  // Results
  exceptionsFound: number;
  totalExceptionAmount: number;
  projectedMisstatement?: number;
  upperErrorLimit?: number;
  samplingRisk?: number;

  // Status
  status: SampleStatus;
  testingStartDate?: Date;
  testingEndDate?: Date;

  // Items
  items: SampleItem[];

  // Sign-off
  preparedBy?: string;
  preparedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface SampleItem {
  id: string;
  sampleId: string;

  // Item identification
  itemNumber: number;
  itemReference: string;      // Document number, transaction ID, etc.
  itemDescription: string;

  // Amounts
  bookValue: number;
  auditedValue?: number;
  difference?: number;

  // Selection info
  selectionMethod: 'random' | 'systematic' | 'targeted' | 'top_stratum';
  stratumNumber?: number;
  cumulativeValue?: number;   // For MUS selection

  // Testing
  testResult: ItemTestResult;
  exceptionType?: ExceptionType;
  exceptionDescription?: string;
  tainting?: number;          // For MUS (exception / book value)

  // Documentation
  workpaperReference?: string;
  testedBy?: string;
  testedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface PopulationStratum {
  stratumNumber: number;
  description: string;
  itemCount: number;
  totalValue: number;
  sampleSize: number;
  method: SamplingMethod;
  is100PercentTested: boolean;
}

// ============================================
// Sampling Parameters
// ============================================

export type AuditAssertion =
  | 'existence'
  | 'occurrence'
  | 'completeness'
  | 'accuracy'
  | 'valuation'
  | 'cutoff'
  | 'classification'
  | 'rights_obligations'
  | 'presentation';

export type ExceptionType =
  | 'overstatement'
  | 'understatement'
  | 'cutoff_error'
  | 'classification_error'
  | 'documentation_missing'
  | 'authorization_missing'
  | 'calculation_error'
  | 'other';

// ============================================
// Sample Size Factors
// ============================================

export interface AttributeSampleSizeFactors {
  confidenceLevel: number;
  expectedDeviationRate: number;
  tolerableDeviationRate: number;
  populationSize: number;
  riskOfOverreliance: number;  // 5%, 10%
}

export interface SubstantiveSampleSizeFactors {
  confidenceLevel: number;
  tolerableMisstatement: number;
  expectedMisstatement: number;
  populationValue: number;
  inherentRisk: 'low' | 'moderate' | 'high';
  controlRisk: 'low' | 'moderate' | 'high';
  otherSubstantiveRisk: 'low' | 'moderate' | 'high';
}

// ============================================
// Projection Results
// ============================================

export interface MUSProjectionResult {
  knownMisstatement: number;
  projectedMisstatement: number;
  basicPrecision: number;
  incrementalAllowance: number;
  upperMisstatementLimit: number;
  conclusion: 'acceptable' | 'unacceptable' | 'requires_expansion';
  conclusionRationale: string;
}

export interface ClassicalProjectionResult {
  projectedMisstatement: number;
  allowanceForSamplingRisk: number;
  upperMisstatementLimit: number;
  lowerMisstatementLimit: number;
  precision: number;
  conclusion: 'acceptable' | 'unacceptable' | 'requires_expansion';
  conclusionRationale: string;
}

export interface AttributesProjectionResult {
  sampleDeviationRate: number;
  upperDeviationLimit: number;
  conclusion: 'reliance_supported' | 'reliance_not_supported';
  conclusionRationale: string;
}

// ============================================
// Reliability Factors (based on confidence)
// ============================================

export const RELIABILITY_FACTORS: Record<number, Record<number, number>> = {
  // Risk of incorrect acceptance percentages -> number of overstatements -> factor
  5: {  // 95% confidence
    0: 3.0,
    1: 4.75,
    2: 6.30,
    3: 7.76,
    4: 9.16,
    5: 10.52,
    6: 11.85,
    7: 13.15,
    8: 14.44,
    9: 15.71,
    10: 16.97,
  },
  10: { // 90% confidence
    0: 2.31,
    1: 3.89,
    2: 5.33,
    3: 6.69,
    4: 8.0,
    5: 9.28,
    6: 10.54,
    7: 11.78,
    8: 13.0,
    9: 14.21,
    10: 15.41,
  },
  15: { // 85% confidence
    0: 1.90,
    1: 3.38,
    2: 4.72,
    3: 6.02,
    4: 7.27,
    5: 8.50,
    6: 9.71,
    7: 10.90,
    8: 12.08,
    9: 13.25,
    10: 14.42,
  },
  20: { // 80% confidence
    0: 1.61,
    1: 2.99,
    2: 4.28,
    3: 5.52,
    4: 6.73,
    5: 7.91,
    6: 9.08,
    7: 10.24,
    8: 11.38,
    9: 12.52,
    10: 13.66,
  },
};

// Attributes sampling tables (risk of overreliance -> expected deviation rate table)
export const ATTRIBUTES_SAMPLE_SIZE_TABLE: Record<
  number,
  Record<number, Record<number, number>>
> = {
  5: { // 5% risk of overreliance (95% confidence)
    // Expected deviation rate -> Tolerable rate -> Sample size
    0: { 2: 149, 3: 99, 4: 74, 5: 59, 6: 49, 7: 42, 8: 36, 9: 32, 10: 29 },
    0.5: { 2: 157, 3: 157, 4: 117, 5: 93, 6: 78, 7: 66, 8: 58, 9: 51, 10: 46 },
    1: { 3: 156, 4: 156, 5: 93, 6: 78, 7: 66, 8: 58, 9: 51, 10: 46 },
    2: { 4: 181, 5: 127, 6: 88, 7: 75, 8: 65, 9: 58, 10: 52 },
    3: { 5: 195, 6: 129, 7: 85, 8: 73, 9: 65, 10: 58 },
  },
  10: { // 10% risk of overreliance (90% confidence)
    0: { 2: 114, 3: 76, 4: 57, 5: 45, 6: 38, 7: 32, 8: 28, 9: 25, 10: 22 },
    0.5: { 2: 194, 3: 129, 4: 96, 5: 77, 6: 64, 7: 55, 8: 48, 9: 42, 10: 38 },
    1: { 3: 176, 4: 96, 5: 77, 6: 64, 7: 55, 8: 48, 9: 42, 10: 38 },
    2: { 4: 132, 5: 88, 6: 73, 7: 62, 8: 54, 9: 48, 10: 43 },
    3: { 5: 124, 6: 103, 7: 68, 8: 58, 9: 51, 10: 46 },
  },
};

// ============================================
// Helper Functions
// ============================================

export function getSamplingMethodLabel(method: SamplingMethod): string {
  const labels: Record<SamplingMethod, string> = {
    monetary_unit: 'Monetary Unit Sampling (MUS)',
    classical_variable: 'Classical Variables Sampling',
    attributes: 'Attributes Sampling',
    random: 'Random Selection',
    systematic: 'Systematic Selection',
    haphazard: 'Haphazard Selection',
    block: 'Block Selection',
    targeted: 'Targeted Selection',
  };
  return labels[method];
}

export function getSampleStatusLabel(status: SampleStatus): string {
  const labels: Record<SampleStatus, string> = {
    planned: 'Planned',
    selected: 'Selected',
    in_progress: 'In Progress',
    tested: 'Tested',
    evaluated: 'Evaluated',
    concluded: 'Concluded',
  };
  return labels[status];
}

export function getAssertionLabel(assertion: AuditAssertion): string {
  const labels: Record<AuditAssertion, string> = {
    existence: 'Existence',
    occurrence: 'Occurrence',
    completeness: 'Completeness',
    accuracy: 'Accuracy',
    valuation: 'Valuation & Allocation',
    cutoff: 'Cutoff',
    classification: 'Classification',
    rights_obligations: 'Rights & Obligations',
    presentation: 'Presentation & Disclosure',
  };
  return labels[assertion];
}

/**
 * Calculate sample size for attributes sampling (test of controls)
 */
export function calculateAttributesSampleSize(
  factors: AttributeSampleSizeFactors
): number {
  const riskLevel = 100 - factors.confidenceLevel;
  const expectedRate = Math.round(factors.expectedDeviationRate * 100) / 100;
  const tolerableRate = Math.round(factors.tolerableDeviationRate * 100);

  // Look up from table or calculate
  const riskTable = ATTRIBUTES_SAMPLE_SIZE_TABLE[riskLevel];
  if (riskTable) {
    const expectedTable = riskTable[expectedRate];
    if (expectedTable && expectedTable[tolerableRate]) {
      let sampleSize = expectedTable[tolerableRate];

      // Adjust for finite population
      if (factors.populationSize < sampleSize * 10) {
        sampleSize = Math.ceil(
          (sampleSize * factors.populationSize) /
            (sampleSize + factors.populationSize - 1)
        );
      }

      return sampleSize;
    }
  }

  // Fallback formula approximation
  const z = factors.confidenceLevel === 95 ? 1.96 : factors.confidenceLevel === 90 ? 1.645 : 1.28;
  const p = factors.expectedDeviationRate;
  const e = factors.tolerableDeviationRate - factors.expectedDeviationRate;

  let n = Math.ceil((z * z * p * (1 - p)) / (e * e));

  // Finite population correction
  if (factors.populationSize < n * 10) {
    n = Math.ceil((n * factors.populationSize) / (n + factors.populationSize - 1));
  }

  return Math.max(n, 25); // Minimum sample size
}

/**
 * Calculate sample size for MUS (substantive testing)
 */
export function calculateMUSSampleSize(
  factors: SubstantiveSampleSizeFactors
): number {
  const riskLevel = 100 - factors.confidenceLevel;
  const reliabilityFactor = RELIABILITY_FACTORS[riskLevel]?.[0] || 3.0;

  // Combined risk assessment
  const riskMultiplier =
    factors.inherentRisk === 'high'
      ? 1.0
      : factors.inherentRisk === 'moderate'
        ? 0.8
        : 0.6;

  const adjustedTolerable =
    factors.tolerableMisstatement * riskMultiplier -
    factors.expectedMisstatement;

  if (adjustedTolerable <= 0) {
    // Cannot use sampling - 100% testing required
    return -1;
  }

  const samplingInterval = adjustedTolerable / reliabilityFactor;
  const sampleSize = Math.ceil(factors.populationValue / samplingInterval);

  return Math.max(sampleSize, 25); // Minimum sample size
}

/**
 * Calculate MUS sampling interval
 */
export function calculateMUSInterval(
  populationValue: number,
  sampleSize: number
): number {
  return Math.floor(populationValue / sampleSize);
}

/**
 * Project misstatement using MUS method
 */
export function projectMUSMisstatement(
  items: SampleItem[],
  samplingInterval: number,
  tolerableMisstatement: number,
  confidenceLevel: number = 95
): MUSProjectionResult {
  const riskLevel = 100 - confidenceLevel;
  const reliabilityFactors = RELIABILITY_FACTORS[riskLevel] || RELIABILITY_FACTORS[5];

  // Separate known errors (items >= interval) from projected errors
  let knownMisstatement = 0;
  const taintings: number[] = [];

  items.forEach((item) => {
    if (item.testResult === 'exception' && item.difference) {
      if (item.bookValue >= samplingInterval) {
        // Known error - use actual misstatement
        knownMisstatement += Math.abs(item.difference);
      } else {
        // Calculate tainting for projection
        const tainting = Math.abs(item.difference) / item.bookValue;
        taintings.push(Math.min(tainting, 1.0)); // Cap at 100%
      }
    }
  });

  // Sort taintings in descending order
  taintings.sort((a, b) => b - a);

  // Calculate basic precision
  const basicPrecision = reliabilityFactors[0] * samplingInterval;

  // Calculate incremental allowance
  let incrementalAllowance = 0;
  let projectedMisstatement = 0;

  taintings.forEach((tainting, index) => {
    projectedMisstatement += tainting * samplingInterval;

    // Incremental factor = (factor at n) - (factor at n-1)
    const factorN = reliabilityFactors[index + 1] || reliabilityFactors[index] + 1.0;
    const factorNMinus1 = reliabilityFactors[index] || 0;
    const incrementalFactor = factorN - factorNMinus1 - 1; // -1 because tainting already counted

    incrementalAllowance += incrementalFactor * tainting * samplingInterval;
  });

  // Upper misstatement limit
  const upperMisstatementLimit =
    knownMisstatement + projectedMisstatement + basicPrecision + incrementalAllowance;

  // Determine conclusion
  let conclusion: MUSProjectionResult['conclusion'];
  let conclusionRationale: string;

  if (upperMisstatementLimit <= tolerableMisstatement) {
    conclusion = 'acceptable';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) is less than tolerable misstatement (${formatCurrency(tolerableMisstatement)}). Sampling results support the conclusion that the account is not materially misstated.`;
  } else if (upperMisstatementLimit <= tolerableMisstatement * 1.5) {
    conclusion = 'requires_expansion';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) exceeds tolerable misstatement (${formatCurrency(tolerableMisstatement)}). Consider expanding sample or performing additional procedures.`;
  } else {
    conclusion = 'unacceptable';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) significantly exceeds tolerable misstatement (${formatCurrency(tolerableMisstatement)}). Material misstatement likely exists. Consider proposing an adjustment.`;
  }

  return {
    knownMisstatement,
    projectedMisstatement,
    basicPrecision,
    incrementalAllowance,
    upperMisstatementLimit,
    conclusion,
    conclusionRationale,
  };
}

/**
 * Project misstatement using ratio estimation (classical)
 */
export function projectClassicalMisstatement(
  items: SampleItem[],
  populationValue: number,
  populationSize: number,
  tolerableMisstatement: number,
  confidenceLevel: number = 95
): ClassicalProjectionResult {
  const testedItems = items.filter((i) => i.auditedValue !== undefined);
  if (testedItems.length === 0) {
    return {
      projectedMisstatement: 0,
      allowanceForSamplingRisk: 0,
      upperMisstatementLimit: 0,
      lowerMisstatementLimit: 0,
      precision: 0,
      conclusion: 'acceptable',
      conclusionRationale: 'No items tested',
    };
  }

  // Calculate sample statistics
  const sampleBookValue = testedItems.reduce((sum, i) => sum + i.bookValue, 0);
  const sampleAuditValue = testedItems.reduce((sum, i) => sum + (i.auditedValue || 0), 0);
  const sampleDifferences = testedItems.map((i) => (i.auditedValue || 0) - i.bookValue);

  // Ratio estimation
  const ratio = sampleAuditValue / sampleBookValue;
  const projectedAuditValue = ratio * populationValue;
  const projectedMisstatement = populationValue - projectedAuditValue;

  // Calculate standard deviation of differences
  const meanDiff = sampleDifferences.reduce((a, b) => a + b, 0) / sampleDifferences.length;
  const variance =
    sampleDifferences.reduce((sum, d) => sum + (d - meanDiff) ** 2, 0) /
    (sampleDifferences.length - 1);
  const stdDev = Math.sqrt(variance);

  // Calculate precision
  const z = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.645 : 1.28;
  const standardError = (stdDev / Math.sqrt(testedItems.length)) * populationSize;
  const precision = z * standardError;

  // Upper and lower limits
  const upperMisstatementLimit = Math.abs(projectedMisstatement) + precision;
  const lowerMisstatementLimit = Math.abs(projectedMisstatement) - precision;

  // Determine conclusion
  let conclusion: ClassicalProjectionResult['conclusion'];
  let conclusionRationale: string;

  if (upperMisstatementLimit <= tolerableMisstatement) {
    conclusion = 'acceptable';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) is within tolerable misstatement (${formatCurrency(tolerableMisstatement)}).`;
  } else if (upperMisstatementLimit <= tolerableMisstatement * 1.5) {
    conclusion = 'requires_expansion';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) exceeds tolerable misstatement (${formatCurrency(tolerableMisstatement)}). Consider additional procedures.`;
  } else {
    conclusion = 'unacceptable';
    conclusionRationale = `Upper misstatement limit (${formatCurrency(upperMisstatementLimit)}) significantly exceeds tolerable misstatement (${formatCurrency(tolerableMisstatement)}).`;
  }

  return {
    projectedMisstatement: Math.abs(projectedMisstatement),
    allowanceForSamplingRisk: precision,
    upperMisstatementLimit,
    lowerMisstatementLimit: Math.max(0, lowerMisstatementLimit),
    precision,
    conclusion,
    conclusionRationale,
  };
}

/**
 * Evaluate attributes sample (test of controls)
 */
export function evaluateAttributesSample(
  items: SampleItem[],
  tolerableDeviationRate: number,
  confidenceLevel: number = 95
): AttributesProjectionResult {
  const totalItems = items.length;
  const exceptions = items.filter((i) => i.testResult === 'exception').length;

  const sampleDeviationRate = exceptions / totalItems;

  // Lookup or calculate upper deviation limit
  // Simplified calculation - in practice would use tables
  const riskLevel = 100 - confidenceLevel;
  const factor = RELIABILITY_FACTORS[riskLevel]?.[exceptions] || (2.3 + exceptions * 1.5);

  const upperDeviationLimit = factor / totalItems;

  // Determine conclusion
  const conclusion: AttributesProjectionResult['conclusion'] =
    upperDeviationLimit <= tolerableDeviationRate
      ? 'reliance_supported'
      : 'reliance_not_supported';

  const conclusionRationale =
    conclusion === 'reliance_supported'
      ? `Upper deviation limit (${(upperDeviationLimit * 100).toFixed(1)}%) does not exceed the tolerable deviation rate (${(tolerableDeviationRate * 100).toFixed(1)}%). The control appears to be operating effectively.`
      : `Upper deviation limit (${(upperDeviationLimit * 100).toFixed(1)}%) exceeds the tolerable deviation rate (${(tolerableDeviationRate * 100).toFixed(1)}%). The control may not be operating effectively. Consider revising the assessed level of control risk.`;

  return {
    sampleDeviationRate,
    upperDeviationLimit,
    conclusion,
    conclusionRationale,
  };
}

/**
 * Generate random sample selection
 */
export function generateRandomSelection(
  populationSize: number,
  sampleSize: number,
  seed?: number
): number[] {
  // Simple seeded random number generator
  const random = (s: number) => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };

  let currentSeed = seed || Date.now();
  const selection: Set<number> = new Set();

  while (selection.size < sampleSize) {
    currentSeed++;
    const index = Math.floor(random(currentSeed) * populationSize) + 1;
    selection.add(index);
  }

  return Array.from(selection).sort((a, b) => a - b);
}

/**
 * Generate systematic sample selection
 */
export function generateSystematicSelection(
  populationSize: number,
  sampleSize: number,
  startPoint?: number
): { items: number[]; interval: number } {
  const interval = Math.floor(populationSize / sampleSize);
  const start = startPoint || Math.floor(Math.random() * interval) + 1;

  const items: number[] = [];
  for (let i = 0; i < sampleSize; i++) {
    const item = start + i * interval;
    if (item <= populationSize) {
      items.push(item);
    }
  }

  return { items, interval };
}

/**
 * Generate MUS selection (cumulative monetary amount)
 */
export function generateMUSSelection(
  population: Array<{ id: string; value: number }>,
  sampleSize: number,
  startPoint?: number
): Array<{ id: string; cumulativeValue: number; selected: boolean }> {
  const totalValue = population.reduce((sum, item) => sum + item.value, 0);
  const interval = totalValue / sampleSize;
  const start = startPoint || Math.random() * interval;

  let cumulative = 0;
  let nextSelection = start;
  const results: Array<{ id: string; cumulativeValue: number; selected: boolean }> = [];

  for (const item of population) {
    cumulative += item.value;
    const selected = cumulative >= nextSelection;

    results.push({
      id: item.id,
      cumulativeValue: cumulative,
      selected,
    });

    while (cumulative >= nextSelection) {
      nextSelection += interval;
    }
  }

  return results;
}

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
