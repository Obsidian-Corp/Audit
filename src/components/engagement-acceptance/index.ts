/**
 * Engagement Acceptance Components Index
 * Export all engagement acceptance UI components
 */

export { IndependenceDeclarationForm } from './IndependenceDeclarationForm';
export { ClientRiskAssessmentForm } from './ClientRiskAssessmentForm';
export { AcceptanceWorkflowWizard } from './AcceptanceWorkflowWizard';

// Re-export hooks and types for convenience
export {
  useEngagementAcceptance,
  useIndependenceDeclarations,
  useClientRiskAssessment,
  useEngagementLetter,
} from '@/hooks/useEngagementAcceptance';

export type {
  IndependenceDeclaration,
  ClientRiskAssessment,
  EngagementLetter,
  AcceptanceWorkflow,
  AcceptanceStage,
  RiskCategory,
  IndependenceThreatType,
  IndependenceThreatLevel,
} from '@/lib/engagement-acceptance';
