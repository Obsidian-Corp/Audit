/**
 * Audit Reporting Types
 * Type definitions for the audit reporting module
 *
 * Implements:
 * - AU-C 700: Forming an Opinion and Reporting on Financial Statements
 * - AU-C 705: Modifications to the Opinion in the Independent Auditor's Report
 * - AU-C 706: Emphasis-of-Matter Paragraphs and Other-Matter Paragraphs
 * - AU-C 701: Communicating Key Audit Matters
 */

// ============================================
// Audit Opinion Types
// ============================================

export type OpinionType =
  | 'unmodified'
  | 'qualified'
  | 'adverse'
  | 'disclaimer';

export type ModificationBasis =
  | 'material_misstatement'
  | 'inability_to_obtain_evidence'
  | 'scope_limitation'
  | 'departure_from_framework'
  | 'inadequate_disclosure';

export type OpinionScope =
  | 'financial_statements'
  | 'internal_control'
  | 'combined';

export interface AuditOpinion {
  id: string;
  engagementId: string;

  // Opinion details
  opinionType: OpinionType;
  opinionScope: OpinionScope;
  opinionDate?: Date;

  // Modification details (if not unmodified)
  isModified: boolean;
  modificationBasis?: ModificationBasis;
  modificationDescription?: string;
  modifiedAccounts?: string[];
  modifiedAssertions?: string[];

  // Financial reporting framework
  framework: string; // e.g., "US GAAP", "IFRS"
  frameworkType: 'general_purpose' | 'special_purpose';

  // Report elements
  basisForOpinion: string;
  keyAuditMatters: KeyAuditMatter[];
  emphasisOfMatter: EmphasisOfMatter[];
  otherMatter: OtherMatter[];

  // Going concern
  goingConcernIncluded: boolean;
  goingConcernParagraph?: string;

  // Other information
  otherInformationIncluded: boolean;
  otherInformationConclusion?: string;

  // Responsibilities
  managementResponsibilities: string[];
  auditorResponsibilities: string[];
  tcwgResponsibilities?: string[];

  // Sign-off
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  partnerApprovedBy?: string;
  partnerApprovedAt?: Date;

  // Status
  status: 'draft' | 'review' | 'approved' | 'issued';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Key Audit Matters (AU-C 701)
// ============================================

export interface KeyAuditMatter {
  id: string;
  opinionId: string;
  engagementId: string;

  // Matter identification
  matterTitle: string;
  matterDescription: string;

  // Why it's a KAM
  significanceRationale: string;
  areasOfSignificantRisk: string[];
  relatedAccounts: string[];
  relatedAssertions: string[];

  // How it was addressed
  auditResponseSummary: string;
  keyObservations?: string;

  // References
  workpaperRefs: string[];

  // Status
  isIncludedInReport: boolean;
  exclusionReason?: string;

  // Review
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================
// Emphasis-of-Matter (AU-C 706)
// ============================================

export type EmphasisType =
  | 'going_concern'
  | 'significant_uncertainty'
  | 'subsequent_event'
  | 'accounting_change'
  | 'related_party'
  | 'other';

export interface EmphasisOfMatter {
  id: string;
  opinionId: string;
  engagementId: string;

  // Matter details
  emphasisType: EmphasisType;
  title: string;
  description: string;

  // Financial statement reference
  noteReference?: string;
  affectedAccounts?: string[];

  // Rationale
  inclusionRationale: string;

  // Review
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================
// Other-Matter Paragraphs (AU-C 706)
// ============================================

export type OtherMatterType =
  | 'predecessor_auditor'
  | 'supplementary_information'
  | 'other_auditor'
  | 'restricted_use'
  | 'other';

export interface OtherMatter {
  id: string;
  opinionId: string;
  engagementId: string;

  // Matter details
  matterType: OtherMatterType;
  title: string;
  description: string;

  // Rationale
  inclusionRationale: string;

  // Review
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================
// Audit Report
// ============================================

export type ReportFormat = 'standard' | 'long_form' | 'short_form';

export interface AuditReport {
  id: string;
  engagementId: string;
  opinionId: string;

  // Report identification
  reportNumber: string;
  reportTitle: string;
  reportDate: Date;

  // Report format
  format: ReportFormat;
  addressee: string;

  // Report content
  reportContent: string; // Full report text
  reportVersion: number;

  // Signatures
  firmName: string;
  firmCity: string;
  engagementPartner: string;
  pcaobId?: string; // For SEC issuers

  // Issuance
  issuanceStatus: 'draft' | 'final' | 'issued' | 'reissued';
  issuedAt?: Date;
  issuedTo?: string[];

  // Document management
  pdfUrl?: string;
  signedCopyUrl?: string;

  // History
  previousVersions: {
    version: number;
    content: string;
    changedAt: Date;
    changedBy: string;
    changeReason: string;
  }[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Report Issuance Checklist
// ============================================

export interface ReportIssuanceChecklistItem {
  id: string;
  reportId: string;

  // Item details
  category: string;
  requirement: string;
  guidance?: string;

  // Response
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

export const REPORT_ISSUANCE_CHECKLIST = [
  {
    category: 'Pre-Issuance Review',
    items: [
      { requirement: 'All audit procedures completed', guidance: 'AU-C 700.10' },
      { requirement: 'All review notes cleared', guidance: 'AU-C 220.19' },
      { requirement: 'Engagement quality review completed (if required)', guidance: 'ISQM 2' },
      { requirement: 'Going concern evaluation finalized', guidance: 'AU-C 570' },
      { requirement: 'Subsequent events procedures completed', guidance: 'AU-C 560' },
      { requirement: 'Management representations obtained', guidance: 'AU-C 580' },
      { requirement: 'Attorney letters received and evaluated', guidance: 'AU-C 501' },
    ],
  },
  {
    category: 'Report Content',
    items: [
      { requirement: 'Opinion paragraph appropriately worded', guidance: 'AU-C 700.23-34' },
      { requirement: 'Basis for opinion paragraph included', guidance: 'AU-C 700.35-36' },
      { requirement: 'Key audit matters properly communicated (if applicable)', guidance: 'AU-C 701' },
      { requirement: 'Going concern paragraph included (if applicable)', guidance: 'AU-C 570' },
      { requirement: 'Emphasis-of-matter paragraphs appropriate', guidance: 'AU-C 706' },
      { requirement: 'Other-matter paragraphs appropriate', guidance: 'AU-C 706' },
      { requirement: 'Management responsibilities described', guidance: 'AU-C 700.37-40' },
      { requirement: 'Auditor responsibilities described', guidance: 'AU-C 700.41-45' },
    ],
  },
  {
    category: 'Format and Dating',
    items: [
      { requirement: 'Report title includes "Independent"', guidance: 'AU-C 700.22' },
      { requirement: 'Appropriate addressee', guidance: 'AU-C 700.21' },
      { requirement: 'Report date is appropriate (sufficient evidence date)', guidance: 'AU-C 700.46-47' },
      { requirement: 'Firm name and city included', guidance: 'AU-C 700.48' },
      { requirement: 'Partner signature (if required)', guidance: 'AU-C 700.48' },
    ],
  },
  {
    category: 'Final Approval',
    items: [
      { requirement: 'Engagement partner approval obtained', guidance: 'AU-C 220.18' },
      { requirement: 'Report reviewed for consistency with financial statements', guidance: 'AU-C 700' },
      { requirement: 'TCWG communication completed', guidance: 'AU-C 260' },
    ],
  },
];

// ============================================
// Helper Functions
// ============================================

export function getOpinionTypeLabel(type: OpinionType): string {
  const labels: Record<OpinionType, string> = {
    unmodified: 'Unmodified Opinion',
    qualified: 'Qualified Opinion',
    adverse: 'Adverse Opinion',
    disclaimer: 'Disclaimer of Opinion',
  };
  return labels[type];
}

export function getOpinionTypeDescription(type: OpinionType): string {
  const descriptions: Record<OpinionType, string> = {
    unmodified: 'The financial statements are presented fairly in all material respects',
    qualified: 'Except for the effects of the matter(s), the financial statements are presented fairly',
    adverse: 'The financial statements are not presented fairly due to material and pervasive misstatement',
    disclaimer: 'Unable to obtain sufficient appropriate audit evidence to form an opinion',
  };
  return descriptions[type];
}

export function getModificationBasisLabel(basis: ModificationBasis): string {
  const labels: Record<ModificationBasis, string> = {
    material_misstatement: 'Material Misstatement',
    inability_to_obtain_evidence: 'Inability to Obtain Sufficient Evidence',
    scope_limitation: 'Scope Limitation',
    departure_from_framework: 'Departure from Financial Reporting Framework',
    inadequate_disclosure: 'Inadequate Disclosure',
  };
  return labels[basis];
}

export function getEmphasisTypeLabel(type: EmphasisType): string {
  const labels: Record<EmphasisType, string> = {
    going_concern: 'Going Concern',
    significant_uncertainty: 'Significant Uncertainty',
    subsequent_event: 'Subsequent Event',
    accounting_change: 'Change in Accounting Principle',
    related_party: 'Related Party Transaction',
    other: 'Other Matter',
  };
  return labels[type];
}

export function getOtherMatterTypeLabel(type: OtherMatterType): string {
  const labels: Record<OtherMatterType, string> = {
    predecessor_auditor: 'Predecessor Auditor',
    supplementary_information: 'Supplementary Information',
    other_auditor: 'Other Auditor',
    restricted_use: 'Restricted Use',
    other: 'Other Matter',
  };
  return labels[type];
}

/**
 * Determine opinion type based on misstatement impact
 */
export function determineOpinionType(
  hasMaterialMisstatement: boolean,
  isPervasive: boolean,
  hasEvidenceLimitation: boolean,
  isPossiblePervasive: boolean
): OpinionType {
  if (hasEvidenceLimitation) {
    return isPossiblePervasive ? 'disclaimer' : 'qualified';
  }

  if (hasMaterialMisstatement) {
    return isPervasive ? 'adverse' : 'qualified';
  }

  return 'unmodified';
}

/**
 * Generate standard opinion paragraph text
 */
export function generateOpinionParagraph(
  opinionType: OpinionType,
  entityName: string,
  framework: string,
  periodEnd: Date,
  modificationDescription?: string
): string {
  const periodEndStr = periodEnd.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const baseStatements = `the consolidated balance sheet of ${entityName} as of ${periodEndStr}, and the related consolidated statements of operations, comprehensive income, stockholders' equity, and cash flows for the year then ended, and the related notes to the consolidated financial statements`;

  switch (opinionType) {
    case 'unmodified':
      return `In our opinion, the financial statements referred to above present fairly, in all material respects, the financial position of ${entityName} as of ${periodEndStr}, and the results of its operations and its cash flows for the year then ended in accordance with ${framework}.`;

    case 'qualified':
      return `In our opinion, except for the effects of the matter described in the Basis for Qualified Opinion section of our report, the financial statements referred to above present fairly, in all material respects, the financial position of ${entityName} as of ${periodEndStr}, and the results of its operations and its cash flows for the year then ended in accordance with ${framework}.`;

    case 'adverse':
      return `In our opinion, because of the significance of the matter discussed in the Basis for Adverse Opinion section of our report, the financial statements referred to above do not present fairly the financial position of ${entityName} as of ${periodEndStr}, or the results of its operations or its cash flows for the year then ended in accordance with ${framework}.`;

    case 'disclaimer':
      return `Because of the significance of the matter described in the Basis for Disclaimer of Opinion section of our report, we have not been able to obtain sufficient appropriate audit evidence to provide a basis for an audit opinion. Accordingly, we do not express an opinion on these financial statements.`;

    default:
      return '';
  }
}
