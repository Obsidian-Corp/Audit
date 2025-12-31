/**
 * Audit Reporting Module Index
 * Central export for all audit reporting functionality
 */

export * from './types';

// Re-export commonly used types
export type {
  AuditOpinion,
  OpinionType,
  ModificationBasis,
  OpinionScope,
  KeyAuditMatter,
  EmphasisOfMatter,
  EmphasisType,
  OtherMatter,
  OtherMatterType,
  AuditReport,
  ReportFormat,
  ReportIssuanceChecklistItem,
} from './types';

export {
  REPORT_ISSUANCE_CHECKLIST,
  getOpinionTypeLabel,
  getOpinionTypeDescription,
  getModificationBasisLabel,
  getEmphasisTypeLabel,
  getOtherMatterTypeLabel,
  determineOpinionType,
  generateOpinionParagraph,
} from './types';
