/**
 * PDF Generation Types
 * Type definitions for generating audit workpapers and reports
 */

// ============================================
// Core Types
// ============================================

export type DocumentType =
  | 'audit_report'
  | 'management_letter'
  | 'engagement_letter'
  | 'independence_letter'
  | 'representation_letter'
  | 'tcwg_communication'
  | 'workpaper'
  | 'lead_schedule'
  | 'trial_balance'
  | 'summary_of_adjustments'
  | 'control_deficiency_letter';

export interface DocumentMetadata {
  documentType: DocumentType;
  engagementId: string;
  clientName: string;
  periodEndDate: Date;
  preparedBy: string;
  preparedDate: Date;
  reviewedBy?: string;
  reviewedDate?: Date;
  version: number;
  referenceNumber?: string;
}

export interface PDFGenerationOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includeWatermark: boolean;
  watermarkText?: string;
  pageSize: 'letter' | 'legal' | 'a4';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  font: {
    family: string;
    size: number;
  };
}

export const DEFAULT_PDF_OPTIONS: PDFGenerationOptions = {
  includeHeader: true,
  includeFooter: true,
  includeWatermark: false,
  pageSize: 'letter',
  orientation: 'portrait',
  margins: {
    top: 72,
    right: 72,
    bottom: 72,
    left: 72,
  },
  font: {
    family: 'Times-Roman',
    size: 12,
  },
};

// ============================================
// Report Templates
// ============================================

export interface AuditReportTemplate {
  title: string;
  addressee: string;
  opinionParagraph: string;
  basisParagraph?: string;
  keyAuditMatters?: Array<{
    title: string;
    description: string;
    response: string;
  }>;
  emphasisOfMatter?: Array<{
    title: string;
    paragraph: string;
  }>;
  otherMatter?: Array<{
    title: string;
    paragraph: string;
  }>;
  responsibilitiesParagraphs: {
    management: string;
    auditor: string;
  };
  signature: {
    firmName: string;
    partnerName?: string;
    date: Date;
    city: string;
    state: string;
  };
}

export interface ManagementLetterTemplate {
  date: Date;
  addressee: string;
  clientName: string;
  periodEndDate: Date;
  introduction: string;
  findings: Array<{
    title: string;
    condition: string;
    criteria: string;
    cause: string;
    effect: string;
    recommendation: string;
    managementResponse?: string;
  }>;
  conclusion: string;
  signature: {
    firmName: string;
    partnerName?: string;
  };
}

export interface EngagementLetterTemplate {
  date: Date;
  clientName: string;
  addressee: string;
  engagementObjective: string;
  scope: string;
  managementResponsibilities: string[];
  auditorResponsibilities: string[];
  limitations: string[];
  fees: {
    estimatedFees: number;
    billingTerms: string;
    additionalCharges?: string;
  };
  timing: {
    fieldworkStart: Date;
    fieldworkEnd: Date;
    reportDelivery: Date;
  };
  acceptanceBlock: {
    clientSignature: boolean;
    firmSignature: boolean;
  };
}

// ============================================
// Workpaper Templates
// ============================================

export interface WorkpaperTemplate {
  referenceNumber: string;
  title: string;
  objective: string;
  procedure: string;
  population: string;
  sampleSize?: number;
  testingProcedures: string[];
  results: string;
  exceptions: Array<{
    description: string;
    disposition: string;
  }>;
  conclusion: string;
  tickMarks?: Array<{
    symbol: string;
    meaning: string;
  }>;
}

export interface LeadScheduleTemplate {
  scheduleNumber: string;
  scheduleName: string;
  periodEndDate: Date;
  accounts: Array<{
    accountNumber: string;
    accountName: string;
    priorYear: number;
    currentYear: number;
    adjustments: number;
    reclassifications: number;
    finalBalance: number;
    reference: string;
  }>;
  totals: {
    priorYear: number;
    currentYear: number;
    adjustments: number;
    reclassifications: number;
    finalBalance: number;
  };
  conclusion: string;
}

export interface TrialBalanceTemplate {
  periodEndDate: Date;
  periodType: 'year_end' | 'interim' | 'prior_year';
  accounts: Array<{
    accountNumber: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
  totals: {
    totalDebits: number;
    totalCredits: number;
    variance: number;
  };
}

export interface SummaryOfAdjustmentsTemplate {
  periodEndDate: Date;
  adjustments: Array<{
    ajeNumber: string;
    description: string;
    debitAccount: string;
    debitAmount: number;
    creditAccount: string;
    creditAmount: number;
    status: string;
  }>;
  totals: {
    totalDebits: number;
    totalCredits: number;
    netEffect: number;
  };
  conclusion: string;
}

// ============================================
// Helper Functions
// ============================================

export function getDocumentTypeLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    audit_report: 'Independent Auditor\'s Report',
    management_letter: 'Management Letter',
    engagement_letter: 'Engagement Letter',
    independence_letter: 'Independence Confirmation',
    representation_letter: 'Management Representation Letter',
    tcwg_communication: 'Communication with Those Charged with Governance',
    workpaper: 'Audit Workpaper',
    lead_schedule: 'Lead Schedule',
    trial_balance: 'Trial Balance',
    summary_of_adjustments: 'Summary of Audit Adjustments',
    control_deficiency_letter: 'Internal Control Deficiency Letter',
  };
  return labels[type];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate HTML content for browser-based PDF generation
 * This can be used with html2pdf.js or similar libraries
 */
export function generateHTMLReport(
  template: AuditReportTemplate,
  metadata: DocumentMetadata
): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
    }
    .header {
      text-align: center;
      margin-bottom: 2em;
    }
    .title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 1em;
    }
    .section {
      margin-bottom: 1.5em;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 0.5em;
    }
    .signature-block {
      margin-top: 3em;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${template.title}</div>
  </div>

  <div class="section">
    <p>${template.addressee}</p>
  </div>

  <div class="section">
    <div class="section-title">Opinion</div>
    <p>${template.opinionParagraph}</p>
  </div>
`;

  if (template.basisParagraph) {
    html += `
  <div class="section">
    <div class="section-title">Basis for Opinion</div>
    <p>${template.basisParagraph}</p>
  </div>
`;
  }

  if (template.keyAuditMatters && template.keyAuditMatters.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">Key Audit Matters</div>
`;
    template.keyAuditMatters.forEach((kam) => {
      html += `
    <div style="margin-bottom: 1em;">
      <p><strong>${kam.title}</strong></p>
      <p>${kam.description}</p>
      <p><em>How We Addressed the Matter:</em> ${kam.response}</p>
    </div>
`;
    });
    html += `</div>`;
  }

  if (template.emphasisOfMatter && template.emphasisOfMatter.length > 0) {
    template.emphasisOfMatter.forEach((eom) => {
      html += `
  <div class="section">
    <div class="section-title">Emphasis of Matter - ${eom.title}</div>
    <p>${eom.paragraph}</p>
  </div>
`;
    });
  }

  html += `
  <div class="section">
    <div class="section-title">Responsibilities of Management for the Financial Statements</div>
    <p>${template.responsibilitiesParagraphs.management}</p>
  </div>

  <div class="section">
    <div class="section-title">Auditor's Responsibilities for the Audit of the Financial Statements</div>
    <p>${template.responsibilitiesParagraphs.auditor}</p>
  </div>

  <div class="signature-block">
    <p><strong>${template.signature.firmName}</strong></p>
    ${template.signature.partnerName ? `<p>${template.signature.partnerName}</p>` : ''}
    <p>${template.signature.city}, ${template.signature.state}</p>
    <p>${formatDate(template.signature.date)}</p>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generate HTML for Lead Schedule
 */
export function generateLeadScheduleHTML(
  template: LeadScheduleTemplate,
  metadata: DocumentMetadata
): string {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      margin: 0.5in;
    }
    .header {
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #000;
      padding-bottom: 0.5em;
      margin-bottom: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1em;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 4px 8px;
      text-align: right;
    }
    th {
      background-color: #f0f0f0;
      font-weight: bold;
    }
    td:first-child, td:nth-child(2) {
      text-align: left;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .workpaper-ref {
      font-size: 9pt;
      color: #666;
    }
    .conclusion {
      margin-top: 2em;
      padding: 1em;
      background-color: #f9f9f9;
      border-left: 3px solid #333;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <strong>${metadata.clientName}</strong><br>
      ${template.scheduleName}
    </div>
    <div style="text-align: right;">
      <strong>${template.scheduleNumber}</strong><br>
      ${formatDate(template.periodEndDate)}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Account #</th>
        <th>Account Name</th>
        <th>Prior Year</th>
        <th>Current Year</th>
        <th>AJE</th>
        <th>RJE</th>
        <th>Final</th>
        <th>Ref</th>
      </tr>
    </thead>
    <tbody>
`;

  template.accounts.forEach((account) => {
    html += `
      <tr>
        <td>${account.accountNumber}</td>
        <td>${account.accountName}</td>
        <td>${formatCurrency(account.priorYear)}</td>
        <td>${formatCurrency(account.currentYear)}</td>
        <td>${account.adjustments !== 0 ? formatCurrency(account.adjustments) : '-'}</td>
        <td>${account.reclassifications !== 0 ? formatCurrency(account.reclassifications) : '-'}</td>
        <td>${formatCurrency(account.finalBalance)}</td>
        <td class="workpaper-ref">${account.reference}</td>
      </tr>
`;
  });

  html += `
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td>${formatCurrency(template.totals.priorYear)}</td>
        <td>${formatCurrency(template.totals.currentYear)}</td>
        <td>${formatCurrency(template.totals.adjustments)}</td>
        <td>${formatCurrency(template.totals.reclassifications)}</td>
        <td>${formatCurrency(template.totals.finalBalance)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="conclusion">
    <strong>Conclusion:</strong> ${template.conclusion}
  </div>

  <div style="margin-top: 2em; font-size: 9pt; color: #666;">
    Prepared by: ${metadata.preparedBy} | ${formatDate(metadata.preparedDate)}
    ${metadata.reviewedBy ? `<br>Reviewed by: ${metadata.reviewedBy} | ${metadata.reviewedDate ? formatDate(metadata.reviewedDate) : ''}` : ''}
  </div>
</body>
</html>
`;

  return html;
}
