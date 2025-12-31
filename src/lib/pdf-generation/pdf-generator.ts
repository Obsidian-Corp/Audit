/**
 * ==================================================================
 * PDF GENERATOR
 * ==================================================================
 * Proper PDF generation using jsPDF for audit documents
 * Generates professional audit reports, workpapers, and letters
 * ==================================================================
 */

import jsPDF from 'jspdf';
import {
  DocumentMetadata,
  PDFGenerationOptions,
  DEFAULT_PDF_OPTIONS,
  AuditReportTemplate,
  ManagementLetterTemplate,
  EngagementLetterTemplate,
  WorkpaperTemplate,
  LeadScheduleTemplate,
  TrialBalanceTemplate,
  SummaryOfAdjustmentsTemplate,
  formatCurrency,
  formatDate,
  getDocumentTypeLabel,
} from './types';

// ============================================
// PDF Document Class
// ============================================

interface TextOptions {
  align?: 'left' | 'center' | 'right' | 'justify';
  maxWidth?: number;
}

class AuditPDFDocument {
  private doc: jsPDF;
  private options: PDFGenerationOptions;
  private metadata: DocumentMetadata;
  private currentY: number = 72;
  private pageNumber: number = 1;
  private pageWidth: number;
  private pageHeight: number;
  private contentWidth: number;
  private leftMargin: number;
  private rightMargin: number;

  constructor(metadata: DocumentMetadata, options: PDFGenerationOptions = DEFAULT_PDF_OPTIONS) {
    this.options = options;
    this.metadata = metadata;

    // Create PDF with specified options
    this.doc = new jsPDF({
      orientation: options.orientation,
      unit: 'pt',
      format: options.pageSize,
    });

    // Calculate dimensions
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.leftMargin = options.margins.left;
    this.rightMargin = options.margins.right;
    this.contentWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    this.currentY = options.margins.top;

    // Set default font
    this.doc.setFont(options.font.family === 'Times-Roman' ? 'times' : 'helvetica', 'normal');
    this.doc.setFontSize(options.font.size);
  }

  // ============================================
  // Core Methods
  // ============================================

  private checkPageBreak(requiredSpace: number = 50): void {
    const bottomMargin = this.pageHeight - this.options.margins.bottom;
    if (this.currentY + requiredSpace > bottomMargin) {
      this.addPage();
    }
  }

  private addPage(): void {
    if (this.options.includeFooter) {
      this.addFooter();
    }
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.options.margins.top;
    if (this.options.includeHeader) {
      this.addHeader();
    }
  }

  private addHeader(): void {
    const headerY = 30;
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);

    // Client name on left
    this.doc.text(this.metadata.clientName, this.leftMargin, headerY);

    // Document type on right
    const docTypeLabel = getDocumentTypeLabel(this.metadata.documentType);
    this.doc.text(docTypeLabel, this.pageWidth - this.rightMargin, headerY, { align: 'right' });

    // Line under header
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.leftMargin, headerY + 10, this.pageWidth - this.rightMargin, headerY + 10);

    // Reset
    this.doc.setFontSize(this.options.font.size);
    this.doc.setTextColor(0, 0, 0);
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 30;
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);

    // Line above footer
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.leftMargin, footerY - 10, this.pageWidth - this.rightMargin, footerY - 10);

    // Reference number on left
    if (this.metadata.referenceNumber) {
      this.doc.text(`Ref: ${this.metadata.referenceNumber}`, this.leftMargin, footerY);
    }

    // Page number on right
    this.doc.text(`Page ${this.pageNumber}`, this.pageWidth - this.rightMargin, footerY, { align: 'right' });

    // Reset
    this.doc.setFontSize(this.options.font.size);
    this.doc.setTextColor(0, 0, 0);
  }

  private addWatermark(): void {
    if (!this.options.includeWatermark || !this.options.watermarkText) return;

    const text = this.options.watermarkText;
    this.doc.setFontSize(60);
    this.doc.setTextColor(230, 230, 230);

    // Rotate and center watermark
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;

    this.doc.text(text, centerX, centerY, {
      align: 'center',
      angle: 45,
    });

    // Reset
    this.doc.setFontSize(this.options.font.size);
    this.doc.setTextColor(0, 0, 0);
  }

  // ============================================
  // Text Methods
  // ============================================

  addTitle(text: string): void {
    this.checkPageBreak(40);
    this.doc.setFontSize(16);
    this.doc.setFont('times', 'bold');
    this.doc.text(text.toUpperCase(), this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 30;
    this.doc.setFontSize(this.options.font.size);
    this.doc.setFont('times', 'normal');
  }

  addHeading(text: string, level: 1 | 2 | 3 = 1): void {
    const sizes = { 1: 14, 2: 12, 3: 11 };
    const spacing = { 1: 25, 2: 20, 3: 18 };

    this.checkPageBreak(40);
    this.currentY += 10;
    this.doc.setFontSize(sizes[level]);
    this.doc.setFont('times', 'bold');
    this.doc.text(text, this.leftMargin, this.currentY);
    this.currentY += spacing[level];
    this.doc.setFontSize(this.options.font.size);
    this.doc.setFont('times', 'normal');
  }

  addParagraph(text: string, options: TextOptions = {}): void {
    const maxWidth = options.maxWidth || this.contentWidth;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    const lineHeight = this.options.font.size * 1.5;

    lines.forEach((line: string) => {
      this.checkPageBreak(lineHeight);
      const x = options.align === 'center' ? this.pageWidth / 2 :
                options.align === 'right' ? this.pageWidth - this.rightMargin :
                this.leftMargin;
      this.doc.text(line, x, this.currentY, { align: options.align || 'left' });
      this.currentY += lineHeight;
    });
    this.currentY += 10;
  }

  addBoldParagraph(text: string, options: TextOptions = {}): void {
    this.doc.setFont('times', 'bold');
    this.addParagraph(text, options);
    this.doc.setFont('times', 'normal');
  }

  addBulletList(items: string[]): void {
    const lineHeight = this.options.font.size * 1.5;
    const bulletIndent = 20;

    items.forEach((item) => {
      this.checkPageBreak(lineHeight);
      this.doc.text('•', this.leftMargin, this.currentY);
      const lines = this.doc.splitTextToSize(item, this.contentWidth - bulletIndent);
      lines.forEach((line: string, index: number) => {
        if (index > 0) {
          this.checkPageBreak(lineHeight);
        }
        this.doc.text(line, this.leftMargin + bulletIndent, this.currentY);
        this.currentY += lineHeight;
      });
    });
    this.currentY += 5;
  }

  addNumberedList(items: string[]): void {
    const lineHeight = this.options.font.size * 1.5;
    const numberIndent = 25;

    items.forEach((item, index) => {
      this.checkPageBreak(lineHeight);
      this.doc.text(`${index + 1}.`, this.leftMargin, this.currentY);
      const lines = this.doc.splitTextToSize(item, this.contentWidth - numberIndent);
      lines.forEach((line: string, lineIndex: number) => {
        if (lineIndex > 0) {
          this.checkPageBreak(lineHeight);
        }
        this.doc.text(line, this.leftMargin + numberIndent, this.currentY);
        this.currentY += lineHeight;
      });
    });
    this.currentY += 5;
  }

  addSpace(points: number = 20): void {
    this.currentY += points;
    this.checkPageBreak();
  }

  addLine(): void {
    this.checkPageBreak(5);
    this.doc.setDrawColor(150, 150, 150);
    this.doc.line(this.leftMargin, this.currentY, this.pageWidth - this.rightMargin, this.currentY);
    this.currentY += 10;
  }

  // ============================================
  // Table Methods
  // ============================================

  addTable(headers: string[], rows: string[][], columnWidths?: number[]): void {
    const cellPadding = 5;
    const rowHeight = 20;
    const headerHeight = 25;

    // Calculate column widths if not provided
    const totalWidth = this.contentWidth;
    const widths = columnWidths || headers.map(() => totalWidth / headers.length);

    // Draw header
    this.checkPageBreak(headerHeight + rowHeight * Math.min(rows.length, 3));
    let x = this.leftMargin;

    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.leftMargin, this.currentY - 15, totalWidth, headerHeight, 'F');

    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(10);

    headers.forEach((header, i) => {
      this.doc.text(header, x + cellPadding, this.currentY);
      x += widths[i];
    });

    this.currentY += headerHeight - 5;
    this.doc.setFont('times', 'normal');

    // Draw rows
    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);

      // Alternate row colors
      if (rowIndex % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.leftMargin, this.currentY - 12, totalWidth, rowHeight, 'F');
      }

      x = this.leftMargin;
      row.forEach((cell, i) => {
        // Truncate if too long
        let displayText = cell;
        const maxCellWidth = widths[i] - cellPadding * 2;
        while (this.doc.getTextWidth(displayText) > maxCellWidth && displayText.length > 3) {
          displayText = displayText.slice(0, -4) + '...';
        }
        this.doc.text(displayText, x + cellPadding, this.currentY);
        x += widths[i];
      });

      this.currentY += rowHeight;
    });

    // Draw border
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.leftMargin, this.currentY - rowHeight * rows.length - headerHeight, totalWidth, rowHeight * rows.length + headerHeight);

    this.currentY += 10;
    this.doc.setFontSize(this.options.font.size);
  }

  // ============================================
  // Signature Block
  // ============================================

  addSignatureBlock(firmName: string, city: string, state: string, date: Date, partnerName?: string): void {
    this.checkPageBreak(100);
    this.currentY += 30;

    this.doc.setFont('times', 'bold');
    this.addParagraph(firmName);
    this.doc.setFont('times', 'normal');

    if (partnerName) {
      this.addParagraph(partnerName);
    }

    this.addParagraph(`${city}, ${state}`);
    this.addParagraph(formatDate(date));
  }

  // ============================================
  // Prepared By Block
  // ============================================

  addPreparedByBlock(): void {
    this.checkPageBreak(60);
    this.currentY += 20;
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.leftMargin, this.currentY, this.leftMargin + 200, this.currentY);
    this.currentY += 15;

    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    this.addParagraph(`Prepared by: ${this.metadata.preparedBy} | ${formatDate(this.metadata.preparedDate)}`);

    if (this.metadata.reviewedBy && this.metadata.reviewedDate) {
      this.addParagraph(`Reviewed by: ${this.metadata.reviewedBy} | ${formatDate(this.metadata.reviewedDate)}`);
    }

    this.doc.setFontSize(this.options.font.size);
    this.doc.setTextColor(0, 0, 0);
  }

  // ============================================
  // Finalize & Export
  // ============================================

  finalize(): jsPDF {
    // Add watermark to all pages if enabled
    if (this.options.includeWatermark) {
      const totalPages = this.doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        this.doc.setPage(i);
        this.addWatermark();
      }
    }

    // Add footer to last page
    if (this.options.includeFooter) {
      this.addFooter();
    }

    return this.doc;
  }

  download(filename: string): void {
    this.finalize();
    this.doc.save(filename);
  }

  getBlob(): Blob {
    this.finalize();
    return this.doc.output('blob');
  }

  getBase64(): string {
    this.finalize();
    return this.doc.output('datauristring');
  }
}

// ============================================
// Report Generators
// ============================================

/**
 * Generate Audit Report PDF
 */
export function generateAuditReportPDF(
  template: AuditReportTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const doc = new AuditPDFDocument(metadata, { ...DEFAULT_PDF_OPTIONS, ...options });

  doc.addTitle(template.title);
  doc.addSpace(20);

  // Addressee
  doc.addParagraph(template.addressee);
  doc.addSpace(10);

  // Opinion
  doc.addHeading('Opinion', 2);
  doc.addParagraph(template.opinionParagraph);

  // Basis for Opinion
  if (template.basisParagraph) {
    doc.addHeading('Basis for Opinion', 2);
    doc.addParagraph(template.basisParagraph);
  }

  // Key Audit Matters
  if (template.keyAuditMatters && template.keyAuditMatters.length > 0) {
    doc.addHeading('Key Audit Matters', 2);
    template.keyAuditMatters.forEach((kam) => {
      doc.addHeading(kam.title, 3);
      doc.addParagraph(kam.description);
      doc.addBoldParagraph('How We Addressed the Matter:');
      doc.addParagraph(kam.response);
    });
  }

  // Emphasis of Matter
  if (template.emphasisOfMatter && template.emphasisOfMatter.length > 0) {
    template.emphasisOfMatter.forEach((eom) => {
      doc.addHeading(`Emphasis of Matter - ${eom.title}`, 2);
      doc.addParagraph(eom.paragraph);
    });
  }

  // Other Matter
  if (template.otherMatter && template.otherMatter.length > 0) {
    template.otherMatter.forEach((om) => {
      doc.addHeading(`Other Matter - ${om.title}`, 2);
      doc.addParagraph(om.paragraph);
    });
  }

  // Responsibilities
  doc.addHeading("Responsibilities of Management for the Financial Statements", 2);
  doc.addParagraph(template.responsibilitiesParagraphs.management);

  doc.addHeading("Auditor's Responsibilities for the Audit of the Financial Statements", 2);
  doc.addParagraph(template.responsibilitiesParagraphs.auditor);

  // Signature
  doc.addSignatureBlock(
    template.signature.firmName,
    template.signature.city,
    template.signature.state,
    template.signature.date,
    template.signature.partnerName
  );

  return doc;
}

/**
 * Generate Management Letter PDF
 */
export function generateManagementLetterPDF(
  template: ManagementLetterTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const doc = new AuditPDFDocument(metadata, { ...DEFAULT_PDF_OPTIONS, ...options });

  // Date and Addressee
  doc.addParagraph(formatDate(template.date), { align: 'right' });
  doc.addSpace(10);
  doc.addParagraph(template.addressee);
  doc.addSpace(10);

  // Introduction
  doc.addParagraph(template.introduction);
  doc.addSpace(10);

  // Findings
  if (template.findings.length > 0) {
    doc.addHeading('Observations and Recommendations', 1);

    template.findings.forEach((finding, index) => {
      doc.addHeading(`${index + 1}. ${finding.title}`, 2);

      doc.addBoldParagraph('Condition:');
      doc.addParagraph(finding.condition);

      doc.addBoldParagraph('Criteria:');
      doc.addParagraph(finding.criteria);

      doc.addBoldParagraph('Cause:');
      doc.addParagraph(finding.cause);

      doc.addBoldParagraph('Effect:');
      doc.addParagraph(finding.effect);

      doc.addBoldParagraph('Recommendation:');
      doc.addParagraph(finding.recommendation);

      if (finding.managementResponse) {
        doc.addBoldParagraph("Management's Response:");
        doc.addParagraph(finding.managementResponse);
      }

      doc.addLine();
    });
  }

  // Conclusion
  doc.addHeading('Conclusion', 1);
  doc.addParagraph(template.conclusion);

  // Signature
  doc.addSignatureBlock(
    template.signature.firmName,
    '', '',
    template.date,
    template.signature.partnerName
  );

  return doc;
}

/**
 * Generate Engagement Letter PDF
 */
export function generateEngagementLetterPDF(
  template: EngagementLetterTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const doc = new AuditPDFDocument(metadata, { ...DEFAULT_PDF_OPTIONS, ...options });

  // Date and Addressee
  doc.addParagraph(formatDate(template.date), { align: 'right' });
  doc.addSpace(10);
  doc.addParagraph(template.addressee);
  doc.addParagraph(template.clientName);
  doc.addSpace(20);

  // Engagement Objective
  doc.addHeading('Engagement Objective', 2);
  doc.addParagraph(template.engagementObjective);

  // Scope
  doc.addHeading('Scope of Services', 2);
  doc.addParagraph(template.scope);

  // Management Responsibilities
  doc.addHeading('Management Responsibilities', 2);
  doc.addBulletList(template.managementResponsibilities);

  // Auditor Responsibilities
  doc.addHeading('Auditor Responsibilities', 2);
  doc.addBulletList(template.auditorResponsibilities);

  // Limitations
  if (template.limitations.length > 0) {
    doc.addHeading('Limitations', 2);
    doc.addBulletList(template.limitations);
  }

  // Timing
  doc.addHeading('Engagement Timeline', 2);
  doc.addTable(
    ['Phase', 'Date'],
    [
      ['Fieldwork Begins', formatDate(template.timing.fieldworkStart)],
      ['Fieldwork Ends', formatDate(template.timing.fieldworkEnd)],
      ['Report Delivery', formatDate(template.timing.reportDelivery)],
    ],
    [300, 200]
  );

  // Fees
  doc.addHeading('Professional Fees', 2);
  doc.addParagraph(`Estimated fees: ${formatCurrency(template.fees.estimatedFees)}`);
  doc.addParagraph(`Billing terms: ${template.fees.billingTerms}`);
  if (template.fees.additionalCharges) {
    doc.addParagraph(`Additional charges: ${template.fees.additionalCharges}`);
  }

  // Acceptance Block
  doc.addSpace(40);
  doc.addLine();
  doc.addParagraph('Please sign below to indicate your acceptance of the terms of this engagement.');
  doc.addSpace(30);

  doc.addParagraph('_______________________________          _______________');
  doc.addParagraph('Client Signature                                           Date');
  doc.addSpace(20);

  doc.addParagraph('_______________________________          _______________');
  doc.addParagraph('Print Name                                                   Title');

  return doc;
}

/**
 * Generate Lead Schedule PDF
 */
export function generateLeadSchedulePDF(
  template: LeadScheduleTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const landscapeOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    orientation: 'landscape' as const
  };
  const doc = new AuditPDFDocument(metadata, landscapeOptions);

  // Title
  doc.addTitle(template.scheduleName);
  doc.addParagraph(`Schedule: ${template.scheduleNumber}`, { align: 'center' });
  doc.addParagraph(`Period End: ${formatDate(template.periodEndDate)}`, { align: 'center' });
  doc.addSpace(20);

  // Accounts Table
  const headers = ['Account #', 'Account Name', 'Prior Year', 'Current Year', 'AJE', 'RJE', 'Final', 'Ref'];
  const rows = template.accounts.map(acc => [
    acc.accountNumber,
    acc.accountName,
    formatCurrency(acc.priorYear),
    formatCurrency(acc.currentYear),
    acc.adjustments !== 0 ? formatCurrency(acc.adjustments) : '-',
    acc.reclassifications !== 0 ? formatCurrency(acc.reclassifications) : '-',
    formatCurrency(acc.finalBalance),
    acc.reference,
  ]);

  // Add totals row
  rows.push([
    'TOTAL',
    '',
    formatCurrency(template.totals.priorYear),
    formatCurrency(template.totals.currentYear),
    formatCurrency(template.totals.adjustments),
    formatCurrency(template.totals.reclassifications),
    formatCurrency(template.totals.finalBalance),
    '',
  ]);

  doc.addTable(headers, rows, [60, 150, 80, 80, 70, 70, 80, 50]);

  // Conclusion
  doc.addSpace(20);
  doc.addHeading('Conclusion', 2);
  doc.addParagraph(template.conclusion);

  // Prepared By
  doc.addPreparedByBlock();

  return doc;
}

/**
 * Generate Trial Balance PDF
 */
export function generateTrialBalancePDF(
  template: TrialBalanceTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const doc = new AuditPDFDocument(metadata, { ...DEFAULT_PDF_OPTIONS, ...options });

  doc.addTitle('Trial Balance');
  doc.addParagraph(`As of ${formatDate(template.periodEndDate)}`, { align: 'center' });
  doc.addParagraph(`Type: ${template.periodType.replace('_', ' ').toUpperCase()}`, { align: 'center' });
  doc.addSpace(20);

  // Accounts Table
  const headers = ['Account #', 'Account Name', 'Debit', 'Credit'];
  const rows = template.accounts.map(acc => [
    acc.accountNumber,
    acc.accountName,
    acc.debit > 0 ? formatCurrency(acc.debit) : '',
    acc.credit > 0 ? formatCurrency(acc.credit) : '',
  ]);

  // Add totals
  rows.push([
    'TOTALS',
    '',
    formatCurrency(template.totals.totalDebits),
    formatCurrency(template.totals.totalCredits),
  ]);

  doc.addTable(headers, rows, [80, 250, 100, 100]);

  // Variance note
  if (Math.abs(template.totals.variance) > 0.01) {
    doc.addSpace(10);
    doc.addBoldParagraph(`⚠️ Variance: ${formatCurrency(template.totals.variance)}`);
  } else {
    doc.addSpace(10);
    doc.addParagraph('✓ Trial balance is in balance.');
  }

  doc.addPreparedByBlock();

  return doc;
}

/**
 * Generate Summary of Adjustments PDF
 */
export function generateSummaryOfAdjustmentsPDF(
  template: SummaryOfAdjustmentsTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const landscapeOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    orientation: 'landscape' as const
  };
  const doc = new AuditPDFDocument(metadata, landscapeOptions);

  doc.addTitle('Summary of Audit Adjustments');
  doc.addParagraph(`Period Ending: ${formatDate(template.periodEndDate)}`, { align: 'center' });
  doc.addSpace(20);

  // Adjustments Table
  const headers = ['AJE #', 'Description', 'Debit Account', 'Debit', 'Credit Account', 'Credit', 'Status'];
  const rows = template.adjustments.map(adj => [
    adj.ajeNumber,
    adj.description,
    adj.debitAccount,
    formatCurrency(adj.debitAmount),
    adj.creditAccount,
    formatCurrency(adj.creditAmount),
    adj.status,
  ]);

  // Add totals
  rows.push([
    'TOTALS',
    '',
    '',
    formatCurrency(template.totals.totalDebits),
    '',
    formatCurrency(template.totals.totalCredits),
    '',
  ]);

  doc.addTable(headers, rows, [50, 150, 100, 70, 100, 70, 60]);

  // Net Effect
  doc.addSpace(10);
  doc.addBoldParagraph(`Net Effect on Financial Statements: ${formatCurrency(template.totals.netEffect)}`);

  // Conclusion
  doc.addSpace(20);
  doc.addHeading('Conclusion', 2);
  doc.addParagraph(template.conclusion);

  doc.addPreparedByBlock();

  return doc;
}

/**
 * Generate Workpaper PDF
 */
export function generateWorkpaperPDF(
  template: WorkpaperTemplate,
  metadata: DocumentMetadata,
  options?: Partial<PDFGenerationOptions>
): AuditPDFDocument {
  const doc = new AuditPDFDocument(metadata, { ...DEFAULT_PDF_OPTIONS, ...options });

  // Header with reference
  doc.addTitle(template.title);
  doc.addParagraph(`Reference: ${template.referenceNumber}`, { align: 'center' });
  doc.addSpace(20);

  // Objective
  doc.addHeading('Objective', 2);
  doc.addParagraph(template.objective);

  // Procedure
  doc.addHeading('Procedure', 2);
  doc.addParagraph(template.procedure);

  // Population & Sample
  doc.addHeading('Population', 2);
  doc.addParagraph(template.population);
  if (template.sampleSize) {
    doc.addParagraph(`Sample Size: ${template.sampleSize}`);
  }

  // Testing Procedures
  doc.addHeading('Testing Procedures Performed', 2);
  doc.addNumberedList(template.testingProcedures);

  // Results
  doc.addHeading('Results', 2);
  doc.addParagraph(template.results);

  // Exceptions
  if (template.exceptions.length > 0) {
    doc.addHeading('Exceptions Noted', 2);
    template.exceptions.forEach((exception, index) => {
      doc.addBoldParagraph(`Exception ${index + 1}: ${exception.description}`);
      doc.addParagraph(`Disposition: ${exception.disposition}`);
    });
  } else {
    doc.addHeading('Exceptions Noted', 2);
    doc.addParagraph('No exceptions were noted during testing.');
  }

  // Tick Marks Legend
  if (template.tickMarks && template.tickMarks.length > 0) {
    doc.addHeading('Tick Mark Legend', 2);
    const tickRows = template.tickMarks.map(tm => [tm.symbol, tm.meaning]);
    doc.addTable(['Symbol', 'Meaning'], tickRows, [50, 450]);
  }

  // Conclusion
  doc.addHeading('Conclusion', 2);
  doc.addParagraph(template.conclusion);

  doc.addPreparedByBlock();

  return doc;
}

// ============================================
// Export
// ============================================

export { AuditPDFDocument };
