/**
 * Control Testing Module Index
 * Central export for all control testing functionality
 */

export * from './types';

// Re-export commonly used types and functions
export type {
  Control,
  ControlType,
  ControlNature,
  ControlFrequency,
  ControlAssertion,
  ControlRiskLevel,
  ControlEffectiveness,
  TestingApproach,
  DesignAssessment,
  DesignGap,
  TestOfControls,
  ControlDeviation,
  DeviationType,
  SampleSizeParameters,
  SampleSizeResult,
  ControlDeficiency,
  DeficiencyClassification,
  ITGeneralControl,
  ITGCDomain,
  ControlTestingSummary,
} from './types';

export {
  getControlTypeLabel,
  getControlNatureLabel,
  getControlFrequencyLabel,
  getAssertionLabel,
  getDeficiencyClassificationLabel,
  getITGCDomainLabel,
  calculateSampleSize,
  evaluateDeficiencyClassification,
} from './types';
