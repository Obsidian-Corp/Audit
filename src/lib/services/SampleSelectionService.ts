/**
 * Sample Selection Service
 * Addresses ISSUE-015: Sample selection algorithm
 *
 * Provides statistical sampling algorithms for audit procedures
 */

export interface SampleItem {
  id: string | number;
  value: number;
  description?: string;
  [key: string]: any;
}

export interface SampleSelectionResult<T> {
  selectedItems: T[];
  selectionMethod: string;
  sampleSize: number;
  populationSize: number;
  samplingInterval?: number;
  confidenceLevel?: string;
  metadata: Record<string, any>;
}

export interface StratificationBand {
  name: string;
  min: number;
  max: number;
  sampleSize: number;
}

/**
 * Sample Selection Service
 * Implements various statistical sampling methods for audit procedures
 */
export class SampleSelectionService {
  /**
   * Simple Random Sampling
   * Each item has an equal probability of selection
   */
  static randomSampling<T extends SampleItem>(
    population: T[],
    sampleSize: number,
    seed?: number
  ): SampleSelectionResult<T> {
    if (sampleSize > population.length) {
      throw new Error('Sample size cannot exceed population size');
    }

    // Use seed for reproducible random selection (if provided)
    const random = seed !== undefined ? this.seededRandom(seed) : Math.random;

    // Fisher-Yates shuffle algorithm
    const shuffled = [...population];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedItems = shuffled.slice(0, sampleSize);

    return {
      selectedItems,
      selectionMethod: 'Simple Random Sampling',
      sampleSize,
      populationSize: population.length,
      metadata: {
        seed: seed || 'none',
        selectionRate: (sampleSize / population.length) * 100,
      },
    };
  }

  /**
   * Systematic Sampling
   * Selects every nth item from the population
   */
  static systematicSampling<T extends SampleItem>(
    population: T[],
    sampleSize: number,
    startIndex?: number
  ): SampleSelectionResult<T> {
    if (sampleSize > population.length) {
      throw new Error('Sample size cannot exceed population size');
    }

    const interval = Math.floor(population.length / sampleSize);
    const start = startIndex !== undefined ? startIndex : Math.floor(Math.random() * interval);

    const selectedItems: T[] = [];
    for (let i = start; selectedItems.length < sampleSize && i < population.length; i += interval) {
      selectedItems.push(population[i]);
    }

    return {
      selectedItems,
      selectionMethod: 'Systematic Sampling',
      sampleSize: selectedItems.length,
      populationSize: population.length,
      samplingInterval: interval,
      metadata: {
        startIndex: start,
        interval,
      },
    };
  }

  /**
   * Stratified Sampling
   * Divides population into strata and samples from each
   */
  static stratifiedSampling<T extends SampleItem>(
    population: T[],
    stratificationBands: StratificationBand[],
    valueKey: keyof T = 'value'
  ): SampleSelectionResult<T> {
    const selectedItems: T[] = [];
    const strataResults: Record<string, number> = {};

    for (const band of stratificationBands) {
      // Filter items in this stratum
      const stratum = population.filter(
        item => {
          const value = Number(item[valueKey]);
          return value >= band.min && value <= band.max;
        }
      );

      // Sample from this stratum
      const stratumSampleSize = Math.min(band.sampleSize, stratum.length);
      const stratumSample = this.randomSampling(stratum, stratumSampleSize);

      selectedItems.push(...stratumSample.selectedItems);
      strataResults[band.name] = stratumSample.selectedItems.length;
    }

    return {
      selectedItems,
      selectionMethod: 'Stratified Sampling',
      sampleSize: selectedItems.length,
      populationSize: population.length,
      metadata: {
        stratificationBands: stratificationBands.length,
        strataResults,
      },
    };
  }

  /**
   * Monetary Unit Sampling (MUS)
   * Probability proportional to size sampling
   */
  static monetaryUnitSampling<T extends SampleItem>(
    population: T[],
    sampleSize: number,
    valueKey: keyof T = 'value'
  ): SampleSelectionResult<T> {
    // Calculate cumulative values
    let totalValue = 0;
    const cumulativeItems: Array<{ item: T; cumulativeValue: number }> = [];

    for (const item of population) {
      const value = Number(item[valueKey]);
      if (value < 0) {
        throw new Error('MUS cannot be used with negative values');
      }
      totalValue += value;
      cumulativeItems.push({ item, cumulativeValue: totalValue });
    }

    if (totalValue === 0) {
      throw new Error('Total population value is zero');
    }

    // Calculate sampling interval
    const interval = totalValue / sampleSize;

    // Select items using systematic MUS
    const selectedItems: T[] = [];
    const selectedIds = new Set<string | number>();
    const startPoint = Math.random() * interval;

    for (let i = 0; i < sampleSize; i++) {
      const targetValue = startPoint + (i * interval);

      // Find the item containing this monetary unit
      const selectedCumulative = cumulativeItems.find(
        ci => ci.cumulativeValue >= targetValue
      );

      if (selectedCumulative && !selectedIds.has(selectedCumulative.item.id)) {
        selectedItems.push(selectedCumulative.item);
        selectedIds.add(selectedCumulative.item.id);
      }
    }

    return {
      selectedItems,
      selectionMethod: 'Monetary Unit Sampling (MUS)',
      sampleSize: selectedItems.length,
      populationSize: population.length,
      samplingInterval: interval,
      metadata: {
        totalPopulationValue: totalValue,
        interval,
        startPoint,
      },
    };
  }

  /**
   * Top Stratum Selection
   * Selects all items above a threshold, plus random sample of remaining
   */
  static topStratumSampling<T extends SampleItem>(
    population: T[],
    threshold: number,
    remainingSampleSize: number,
    valueKey: keyof T = 'value'
  ): SampleSelectionResult<T> {
    // Separate into top stratum and remaining
    const topStratum = population.filter(item => Number(item[valueKey]) >= threshold);
    const remaining = population.filter(item => Number(item[valueKey]) < threshold);

    // Sample from remaining items
    const remainingSample = remaining.length > 0
      ? this.randomSampling(remaining, Math.min(remainingSampleSize, remaining.length))
      : { selectedItems: [] };

    const selectedItems = [...topStratum, ...remainingSample.selectedItems];

    return {
      selectedItems,
      selectionMethod: 'Top Stratum Sampling',
      sampleSize: selectedItems.length,
      populationSize: population.length,
      metadata: {
        threshold,
        topStratumSize: topStratum.length,
        remainingSampleSize: remainingSample.selectedItems.length,
        topStratumValue: topStratum.reduce((sum, item) => sum + Number(item[valueKey]), 0),
      },
    };
  }

  /**
   * Calculate required sample size using statistical formulas
   */
  static calculateSampleSize(params: {
    populationSize: number;
    confidenceLevel: 90 | 95 | 99;
    expectedErrorRate: number;
    tolerableErrorRate: number;
  }): number {
    const { populationSize, confidenceLevel, expectedErrorRate, tolerableErrorRate } = params;

    // Z-scores for confidence levels
    const zScores: Record<number, number> = {
      90: 1.645,
      95: 1.96,
      99: 2.576,
    };

    const z = zScores[confidenceLevel];

    // Use attribute sampling formula
    // n = (Z² * p * (1-p)) / e²
    // where p = expected error rate, e = precision (tolerance - expected)
    const p = expectedErrorRate / 100;
    const precision = (tolerableErrorRate - expectedErrorRate) / 100;

    if (precision <= 0) {
      throw new Error('Tolerable error rate must be greater than expected error rate');
    }

    let sampleSize = (z * z * p * (1 - p)) / (precision * precision);

    // Apply finite population correction if population is small
    if (populationSize < 100000) {
      sampleSize = sampleSize / (1 + (sampleSize - 1) / populationSize);
    }

    return Math.ceil(sampleSize);
  }

  /**
   * Seeded random number generator for reproducible sampling
   */
  private static seededRandom(seed: number): () => number {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  }

  /**
   * Export sample selection to CSV
   */
  static exportSampleToCSV<T extends SampleItem>(
    result: SampleSelectionResult<T>,
    columns: Array<keyof T>
  ): string {
    const headers = columns.map(col => String(col));
    const rows = result.selectedItems.map(item =>
      columns.map(col => String(item[col] || ''))
    );

    const csv = [
      `Method: ${result.selectionMethod}`,
      `Sample Size: ${result.sampleSize}`,
      `Population Size: ${result.populationSize}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  }
}
