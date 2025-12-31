/**
 * Quality Control Module Index
 * Central export for all quality control functionality
 */

export * from './types';

// Re-export commonly used types
export type {
  EQCRAssessment,
  EQCRFinding,
  EQCRStatus,
  EQCRTrigger,
  FindingSeverity,
  FindingStatus,
  QualityChecklistItem,
  ReviewNote,
  ReviewNoteStatus,
  ReviewNotePriority,
} from './types';

export {
  QUALITY_CHECKLISTS,
  getEQCRStatusLabel,
  getEQCRTriggerLabel,
  getFindingSeverityLabel,
  getReviewNoteStatusLabel,
  determineEQCRRequired,
  canCompleteEQCR,
} from './types';
