/**
 * PDF Generation Service
 * Addresses ISSUE-022: No PDF export for reports
 *
 * Provides PDF generation capabilities for audit reports and other documents
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export interface PDFOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  margin?: number;
  includeTimestamp?: boolean;
  includePageNumbers?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
}

export class PDFGenerationService {
  /**
   * Generate PDF from HTML element
   */
  static async generateFromElement(
    element: HTMLElement,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const {
      orientation = 'portrait',
      format = 'letter',
      margin = 10,
      includeTimestamp = true,
      includePageNumbers = true,
      includeWatermark = false,
      watermarkText = 'DRAFT'
    } = options;

    // Convert HTML to canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Calculate PDF dimensions
    const imgWidth = format === 'a4' ? 210 : 216; // mm
    const pageHeight = format === 'a4' ? 297 : 279; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const imgData = canvas.toDataURL('image/png');
    let heightLeft = imgHeight;
    let position = margin;

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth - 2 * margin, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth - 2 * margin, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add watermark if requested
    if (includeWatermark) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(60);
        pdf.setTextColor(200, 200, 200);
        pdf.text(watermarkText, imgWidth / 2, pageHeight / 2, {
          align: 'center',
          angle: 45,
        });
      }
    }

    // Add page numbers
    if (includePageNumbers) {
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          imgWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }
    }

    // Add timestamp
    if (includeTimestamp) {
      pdf.setPage(1);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 5
      );
    }

    return pdf.output('blob');
  }

  /**
   * Generate audit report PDF
   */
  static async generateAuditReport(
    reportId: string,
    options: PDFOptions = {}
  ): Promise<{ blob: Blob; documentId: string }> {
    // Fetch report data
    const { data: report, error } = await supabase
      .from('audit_reports')
      .select(`
        *,
        engagement:engagements(
          *,
          client:clients(*)
        )
      `)
      .eq('id', reportId)
      .single();

    if (error || !report) {
      throw new Error(`Failed to fetch report: ${error?.message || 'Not found'}`);
    }

    // Create temporary DOM element with report content
    const element = this.createReportElement(report);
    document.body.appendChild(element);

    try {
      // Generate PDF
      const blob = await this.generateFromElement(element, {
        ...options,
        filename: `audit-report-${report.engagement?.client?.client_name || 'unknown'}.pdf`,
      });

      // Upload to storage if we have engagement and organization info
      let storagePath = '';
      let documentId = '';

      if (report.firm_id && report.engagement_id) {
        storagePath = `${report.firm_id}/reports/${reportId}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from('audit-documents')
          .upload(storagePath, blob, { upsert: true });

        if (uploadError) {
          console.error('Upload failed:', uploadError.message);
        }

        // Create document record
        try {
          const { data: document } = await supabase
            .from('documents')
            .insert({
              organization_id: report.firm_id,
              engagement_id: report.engagement_id,
              name: `Audit Report - ${report.engagement?.client?.client_name || 'Unknown'}.pdf`,
              file_type: 'application/pdf',
              file_size: blob.size,
              storage_bucket: 'audit-documents',
              storage_path: storagePath,
              category: 'report',
            })
            .select()
            .single();

          if (document) {
            documentId = document.id;

            // Update report with PDF reference
            await supabase
              .from('audit_reports')
              .update({ pdf_url: storagePath })
              .eq('id', reportId);
          }
        } catch (docError) {
          console.error('Failed to create document record:', docError);
        }
      }

      return { blob, documentId };
    } finally {
      // Cleanup temporary element
      document.body.removeChild(element);
    }
  }

  /**
   * Create HTML element for report
   */
  private static createReportElement(report: any): HTMLElement {
    const div = document.createElement('div');
    div.style.width = '8.5in';
    div.style.padding = '1in';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '12pt';
    div.style.lineHeight = '1.5';
    div.style.backgroundColor = '#ffffff';

    const clientName = report.engagement?.client?.client_name || 'Unknown Client';
    const firmName = report.firm_name || 'Audit Firm';
    const reportDate = report.report_date ? new Date(report.report_date).toLocaleDateString() : 'N/A';

    div.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 2em; font-size: 18pt; font-weight: bold;">
        Independent Auditor's Report
      </h1>

      <p style="margin-bottom: 1em;">
        <strong>To the Board of Directors and Shareholders of</strong><br>
        ${clientName}
      </p>

      <h2 style="margin-top: 2em; font-size: 14pt; font-weight: bold;">Opinion</h2>
      <p style="text-align: justify;">
        ${report.opinion_paragraph || 'We have audited the accompanying financial statements...'}
      </p>

      <h2 style="margin-top: 2em; font-size: 14pt; font-weight: bold;">Basis for Opinion</h2>
      <p style="text-align: justify;">
        ${report.basis_paragraph || 'We conducted our audit in accordance with auditing standards...'}
      </p>

      ${report.key_audit_matters ? `
        <h2 style="margin-top: 2em; font-size: 14pt; font-weight: bold;">Key Audit Matters</h2>
        <p style="text-align: justify;">${report.key_audit_matters}</p>
      ` : ''}

      ${report.emphasis_of_matter ? `
        <h2 style="margin-top: 2em; font-size: 14pt; font-weight: bold;">Emphasis of Matter</h2>
        <p style="text-align: justify;">${report.emphasis_of_matter}</p>
      ` : ''}

      <div style="margin-top: 4em;">
        <p>
          <strong>${firmName}</strong><br>
          ${reportDate}
        </p>
      </div>
    `;

    return div;
  }

  /**
   * Generate engagement letter PDF
   */
  static async generateEngagementLetter(
    engagementId: string,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const { data: engagement, error } = await supabase
      .from('engagements')
      .select(`
        *,
        client:clients(*),
        firm:firms(*)
      `)
      .eq('id', engagementId)
      .single();

    if (error || !engagement) {
      throw new Error(`Failed to fetch engagement: ${error?.message || 'Not found'}`);
    }

    const element = this.createEngagementLetterElement(engagement);
    document.body.appendChild(element);

    try {
      return await this.generateFromElement(element, options);
    } finally {
      document.body.removeChild(element);
    }
  }

  /**
   * Create HTML element for engagement letter
   */
  private static createEngagementLetterElement(engagement: any): HTMLElement {
    const div = document.createElement('div');
    div.style.width = '8.5in';
    div.style.padding = '1in';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '11pt';
    div.style.lineHeight = '1.6';
    div.style.backgroundColor = '#ffffff';

    const clientName = engagement.client?.client_name || 'Client';
    const firmName = engagement.firm?.name || 'Firm';
    const engagementType = engagement.engagement_type || 'audit';
    const fiscalYearEnd = engagement.fiscal_year_end ? new Date(engagement.fiscal_year_end).toLocaleDateString() : 'N/A';

    div.innerHTML = `
      <div style="text-align: right; margin-bottom: 2em;">
        ${new Date().toLocaleDateString()}
      </div>

      <p style="margin-bottom: 1em;">
        ${clientName}<br>
        [Client Address]
      </p>

      <p style="margin-bottom: 1em;">Dear [Client Contact],</p>

      <p style="margin-bottom: 1em; text-align: justify;">
        This letter is to confirm our understanding of the terms and objectives of our engagement and the nature and limitations of the services we will provide.
      </p>

      <h3 style="font-size: 12pt; font-weight: bold; margin-top: 1.5em;">Engagement Objectives</h3>
      <p style="text-align: justify;">
        We will perform a ${engagementType} of your financial statements for the period ending ${fiscalYearEnd}.
      </p>

      <h3 style="font-size: 12pt; font-weight: bold; margin-top: 1.5em;">Our Responsibilities</h3>
      <p style="text-align: justify;">
        We will conduct our ${engagementType} in accordance with professional standards...
      </p>

      <h3 style="font-size: 12pt; font-weight: bold; margin-top: 1.5em;">Your Responsibilities</h3>
      <p style="text-align: justify;">
        The financial statements are the responsibility of management. You are responsible for...
      </p>

      <div style="margin-top: 3em;">
        <p>Please sign and return a copy of this letter to indicate your acknowledgment and agreement with the arrangements.</p>
      </div>

      <div style="margin-top: 3em;">
        <p>
          Sincerely,<br><br><br>
          ${firmName}<br>
        </p>
      </div>

      <div style="margin-top: 2em; border-top: 1px solid #ccc; padding-top: 1em;">
        <p>
          ACKNOWLEDGED AND AGREED:<br><br>
          Signature: ___________________________<br><br>
          Name: ___________________________<br><br>
          Title: ___________________________<br><br>
          Date: ___________________________
        </p>
      </div>
    `;

    return div;
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate PDF from any text content (simple reports)
   */
  static generateTextPDF(
    title: string,
    content: string,
    options: PDFOptions = {}
  ): Blob {
    const {
      orientation = 'portrait',
      format = 'letter',
      margin = 20,
    } = options;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - 2 * margin;

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, margin, margin, { maxWidth });

    // Add content
    pdf.setFontSize(11);
    const splitContent = pdf.splitTextToSize(content, maxWidth);
    pdf.text(splitContent, margin, margin + 15);

    return pdf.output('blob');
  }
}
