/**
 * Engagement Acceptance Module Index
 * Central export for all engagement acceptance functionality
 */

// Types
export * from './types';

// Validation
export * from './validation';

// Re-export commonly used types for convenience
export type {
  IndependenceDeclaration,
  IndependenceThreat,
  IndependenceThreatType,
  IndependenceThreatLevel,
  FinancialRelationship,
  PersonalRelationship,
  ServiceConflict,
  ClientRiskAssessment,
  ManagementIntegrityAssessment,
  FinancialStabilityAssessment,
  EngagementRiskAssessment,
  RiskCategory,
  EngagementLetter,
  EngagementScope,
  ResponsibilityAllocation,
  EngagementTerms,
  EngagementType,
  AcceptanceWorkflow,
  AcceptanceStage,
  ValidationResult,
  ValidationError,
} from './types';
