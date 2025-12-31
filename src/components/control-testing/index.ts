/**
 * Control Testing Components Index
 * Export all control testing UI components
 */

export { ControlTestingDashboard } from './ControlTestingDashboard';

// Re-export hooks
export {
  useControls,
  useTestOfControls,
  useControlDeficiencies,
  useITGeneralControls,
  useControlTestingSummary,
} from '@/hooks/useControlTesting';

// Re-export types
export type {
  Control,
  ControlType,
  ControlNature,
  ControlFrequency,
  ControlAssertion,
  ControlEffectiveness,
  TestOfControls,
  ControlDeviation,
  ControlDeficiency,
  DeficiencyClassification,
  ITGeneralControl,
  ControlTestingSummary,
} from '@/lib/control-testing';

export {
  getControlTypeLabel,
  getControlNatureLabel,
  getControlFrequencyLabel,
  getAssertionLabel,
  getDeficiencyClassificationLabel,
  calculateSampleSize,
  evaluateDeficiencyClassification,
} from '@/lib/control-testing';
