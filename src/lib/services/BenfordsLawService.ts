/**
 * Benford's Law Service
 * Addresses BUG-019: Implement Benford's Law calculation
 *
 * Benford's Law is a statistical phenomenon where the leading digits of many
 * naturally occurring datasets follow a predictable distribution. It's used
 * in auditing to detect potential fraud or data manipulation.
 */

export interface BenfordsLawResult {
  digit: number;
  expectedFrequency: number;
  actualFrequency: number;
  actualCount: number;
  expectedCount: number;
  deviation: number;
  deviationPercentage: number;
  chiSquareContribution: number;
}

export interface BenfordsLawAnalysis {
  results: BenfordsLawResult[];
  totalRecords: number;
  chiSquareStatistic: number;
  degreesOfFreedom: number;
  criticalValue: number;
  passedTest: boolean;
  significanceLevel: number;
  suspiciousDigits: number[];
  overallDeviation: number;
  recommendation: string;
}

/**
 * Benford's Law Service
 * Provides statistical analysis using Benford's Law for fraud detection
 */
export class BenfordsLawService {
  /**
   * Expected frequencies for first digits according to Benford's Law
   * P(d) = log10(1 + 1/d) where d is the first digit (1-9)
   */
  private static readonly EXPECTED_FREQUENCIES: Record<number, number> = {
    1: 0.301, // 30.1%
    2: 0.176, // 17.6%
    3: 0.125, // 12.5%
    4: 0.097, // 9.7%
    5: 0.079, // 7.9%
    6: 0.067, // 6.7%
    7: 0.058, // 5.8%
    8: 0.051, // 5.1%
    9: 0.046, // 4.6%
  };

  /**
   * Chi-square critical values at 95% confidence (α = 0.05) for 8 degrees of freedom
   */
  private static readonly CHI_SQUARE_CRITICAL_095 = 15.507;

  /**
   * Extract the first digit from a number
   */
  private static getFirstDigit(value: number): number | null {
    const absValue = Math.abs(value);
    if (absValue === 0) return null;

    // Convert to string and find first non-zero digit
    const str = absValue.toString().replace('.', '');
    for (const char of str) {
      const digit = parseInt(char, 10);
      if (digit > 0) return digit;
    }

    return null;
  }

  /**
   * Analyze a dataset using Benford's Law
   *
   * @param data - Array of numerical values to analyze
   * @param significanceLevel - Statistical significance level (default 0.05 for 95% confidence)
   * @returns Comprehensive Benford's Law analysis
   */
  static analyze(
    data: number[],
    significanceLevel: number = 0.05
  ): BenfordsLawAnalysis {
    // Filter valid numbers and count first digits
    const digitCounts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    };

    let validRecords = 0;

    for (const value of data) {
      const firstDigit = this.getFirstDigit(value);
      if (firstDigit !== null) {
        digitCounts[firstDigit]++;
        validRecords++;
      }
    }

    if (validRecords === 0) {
      throw new Error('No valid records found for Benford\'s Law analysis');
    }

    // Calculate chi-square statistic and build results
    const results: BenfordsLawResult[] = [];
    let chiSquareStatistic = 0;
    let totalDeviation = 0;
    const suspiciousDigits: number[] = [];

    for (let digit = 1; digit <= 9; digit++) {
      const expectedFrequency = this.EXPECTED_FREQUENCIES[digit];
      const expectedCount = validRecords * expectedFrequency;
      const actualCount = digitCounts[digit];
      const actualFrequency = actualCount / validRecords;
      const deviation = actualFrequency - expectedFrequency;
      const deviationPercentage = (deviation / expectedFrequency) * 100;

      // Chi-square contribution: (observed - expected)² / expected
      const chiSquareContribution = Math.pow(actualCount - expectedCount, 2) / expectedCount;
      chiSquareStatistic += chiSquareContribution;

      totalDeviation += Math.abs(deviation);

      // Flag suspicious digits (deviation > 30% from expected)
      if (Math.abs(deviationPercentage) > 30) {
        suspiciousDigits.push(digit);
      }

      results.push({
        digit,
        expectedFrequency,
        actualFrequency,
        actualCount,
        expectedCount,
        deviation,
        deviationPercentage,
        chiSquareContribution,
      });
    }

    // Degrees of freedom = number of categories - 1 = 9 - 1 = 8
    const degreesOfFreedom = 8;

    // Get critical value for significance level
    // For simplicity, we'll use the 0.05 critical value
    // In production, you'd want a lookup table for different significance levels
    const criticalValue = this.CHI_SQUARE_CRITICAL_095;

    // Test passes if chi-square statistic < critical value
    const passedTest = chiSquareStatistic < criticalValue;

    // Overall deviation (Mean Absolute Deviation)
    const overallDeviation = totalDeviation / 9;

    // Generate recommendation
    let recommendation = '';
    if (passedTest) {
      recommendation = 'The dataset conforms to Benford\'s Law. No significant anomalies detected.';
    } else if (suspiciousDigits.length === 0) {
      recommendation = 'The dataset shows minor deviations from Benford\'s Law. Consider investigating if combined with other red flags.';
    } else if (suspiciousDigits.length <= 2) {
      recommendation = `The dataset shows significant deviations for digit(s): ${suspiciousDigits.join(', ')}. Recommend investigating transactions starting with these digits.`;
    } else {
      recommendation = `The dataset significantly deviates from Benford\'s Law (${suspiciousDigits.length} digits affected). This may indicate data manipulation, rounding, or artificial data generation. Recommend detailed investigation.`;
    }

    return {
      results,
      totalRecords: validRecords,
      chiSquareStatistic,
      degreesOfFreedom,
      criticalValue,
      passedTest,
      significanceLevel,
      suspiciousDigits,
      overallDeviation,
      recommendation,
    };
  }

  /**
   * Analyze accounts receivable balances
   */
  static analyzeAccountsReceivable(balances: number[]): BenfordsLawAnalysis {
    return this.analyze(balances);
  }

  /**
   * Analyze accounts payable balances
   */
  static analyzeAccountsPayable(balances: number[]): BenfordsLawAnalysis {
    return this.analyze(balances);
  }

  /**
   * Analyze expense transactions
   */
  static analyzeExpenses(amounts: number[]): BenfordsLawAnalysis {
    return this.analyze(amounts);
  }

  /**
   * Analyze revenue transactions
   */
  static analyzeRevenue(amounts: number[]): BenfordsLawAnalysis {
    return this.analyze(amounts);
  }

  /**
   * Analyze journal entries
   */
  static analyzeJournalEntries(amounts: number[]): BenfordsLawAnalysis {
    return this.analyze(amounts);
  }

  /**
   * Get interpretation of chi-square statistic
   */
  static interpretChiSquare(
    chiSquare: number,
    criticalValue: number
  ): {
    conformsToLaw: boolean;
    strength: 'strong' | 'moderate' | 'weak' | 'none';
    description: string;
  } {
    const conformsToLaw = chiSquare < criticalValue;

    let strength: 'strong' | 'moderate' | 'weak' | 'none';
    let description: string;

    if (chiSquare < criticalValue * 0.5) {
      strength = 'strong';
      description = 'Data strongly conforms to Benford\'s Law';
    } else if (chiSquare < criticalValue) {
      strength = 'moderate';
      description = 'Data moderately conforms to Benford\'s Law';
    } else if (chiSquare < criticalValue * 1.5) {
      strength = 'weak';
      description = 'Data shows weak conformance to Benford\'s Law - investigate further';
    } else {
      strength = 'none';
      description = 'Data does not conform to Benford\'s Law - high risk of manipulation';
    }

    return { conformsToLaw, strength, description };
  }

  /**
   * Export analysis to CSV format
   */
  static exportToCSV(analysis: BenfordsLawAnalysis): string {
    const headers = [
      'Digit',
      'Expected Frequency (%)',
      'Actual Frequency (%)',
      'Expected Count',
      'Actual Count',
      'Deviation (%)',
      'Chi-Square Contribution'
    ];

    const rows = analysis.results.map(result => [
      result.digit,
      (result.expectedFrequency * 100).toFixed(2),
      (result.actualFrequency * 100).toFixed(2),
      result.expectedCount.toFixed(0),
      result.actualCount,
      result.deviationPercentage.toFixed(2),
      result.chiSquareContribution.toFixed(4)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Records,${analysis.totalRecords}`,
      `Chi-Square Statistic,${analysis.chiSquareStatistic.toFixed(4)}`,
      `Critical Value (α=${analysis.significanceLevel}),${analysis.criticalValue.toFixed(4)}`,
      `Test Result,${analysis.passedTest ? 'PASS' : 'FAIL'}`,
      `Suspicious Digits,"${analysis.suspiciousDigits.join(', ')}"`,
      '',
      `Recommendation,"${analysis.recommendation}"`
    ].join('\n');

    return csv;
  }

  /**
   * Generate visualization data for charting libraries
   */
  static getChartData(analysis: BenfordsLawAnalysis): {
    labels: string[];
    expected: number[];
    actual: number[];
    deviation: number[];
  } {
    return {
      labels: analysis.results.map(r => `Digit ${r.digit}`),
      expected: analysis.results.map(r => r.expectedFrequency * 100),
      actual: analysis.results.map(r => r.actualFrequency * 100),
      deviation: analysis.results.map(r => Math.abs(r.deviationPercentage)),
    };
  }
}
