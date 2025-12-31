/**
 * Materiality Module Index
 * Central export for all materiality functionality
 */

export * from './types';

export type {
  MaterialityCalculation,
  MaterialityBenchmark,
  MaterialityStatus,
  MaterialityAllocation,
  QualitativeFactorAssessment,
  QualitativeFactor,
  BenchmarkConfig,
  QualitativeFactorConfig,
} from './types';

export {
  BENCHMARK_CONFIGS,
  QUALITATIVE_FACTOR_CONFIGS,
  getBenchmarkLabel,
  getBenchmarkTypicalRange,
  getQualitativeFactorLabel,
  getMaterialityStatusLabel,
  calculateOverallMateriality,
  calculatePerformanceMateriality,
  calculateClearlyTrivialThreshold,
  applyQualitativeAdjustments,
  validateMaterialityCalculation,
  shouldReviseMateriality,
} from './types';
