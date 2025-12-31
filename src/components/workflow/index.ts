/**
 * Workflow Components Index
 * Export all workflow-related UI components
 */

export { EngagementWorkflowStatus } from './EngagementWorkflowStatus';
export { ProcedureSignoffPanel } from './ProcedureSignoffPanel';

// Re-export hooks for convenience
export { useEngagementWorkflow, useEngagementWorkflowSummary } from '@/hooks/useEngagementWorkflow';
export {
  useProcedureWorkflow,
  useEngagementProcedures,
  useEngagementProcedureCompletion,
} from '@/hooks/useProcedureWorkflow';

// Re-export state machine types
export type {
  EngagementState,
  EngagementAction,
  ProcedureState,
  ProcedureAction,
  SignoffRole,
  RiskLevel,
} from '@/lib/state-machines';
