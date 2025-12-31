/**
 * PDF Generation Module Index
 * Exports for PDF report generation functionality
 */

export * from './types';
export * from './pdf-generator';

export type {
  DocumentType,
  DocumentMetadata,
  PDFGenerationOptions,
  AuditReportTemplate,
  ManagementLetterTemplate,
  EngagementLetterTemplate,
  WorkpaperTemplate,
  LeadScheduleTemplate,
  TrialBalanceTemplate,
  SummaryOfAdjustmentsTemplate,
} from './types';

export {
  DEFAULT_PDF_OPTIONS,
  getDocumentTypeLabel,
  formatCurrency,
  formatDate,
  generateHTMLReport,
  generateLeadScheduleHTML,
} from './types';

// PDF Generator exports
export {
  AuditPDFDocument,
  generateAuditReportPDF,
  generateManagementLetterPDF,
  generateEngagementLetterPDF,
  generateLeadSchedulePDF,
  generateTrialBalancePDF,
  generateSummaryOfAdjustmentsPDF,
  generateWorkpaperPDF,
} from './pdf-generator';
