/**
 * Going Concern Module Index
 * Central export for all going concern assessment functionality
 */

export * from './types';

// Re-export commonly used types and constants
export type {
  GoingConcernIndicator,
  GoingConcernAssessment,
  GoingConcernChecklistItem,
  ManagementPlan,
  IndicatorCategory,
  IndicatorSeverity,
  PlanCategory,
  AssessmentConclusion,
  DisclosureRequirement,
  ReportModification,
} from './types';

export {
  FINANCIAL_INDICATORS,
  OPERATING_INDICATORS,
  OTHER_INDICATORS,
  GOING_CONCERN_CHECKLIST_ITEMS,
  getIndicatorCategoryLabel,
  getIndicatorSeverityLabel,
  getPlanCategoryLabel,
  getConclusionLabel,
  getReportModificationLabel,
  determineReportModification,
  calculateOverallSeverity,
} from './types';
