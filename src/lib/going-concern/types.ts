/**
 * Going Concern Types
 * Type definitions for the going concern assessment module
 *
 * Implements:
 * - AU-C 570: The Auditor's Consideration of an Entity's Ability to Continue as a Going Concern
 * - ISA 570: Going Concern
 */

// ============================================
// Going Concern Indicator Types
// ============================================

export type IndicatorCategory =
  | 'financial'
  | 'operating'
  | 'other';

export type IndicatorSeverity = 'moderate' | 'significant' | 'severe';

export interface GoingConcernIndicator {
  id: string;
  engagementId: string;
  assessmentId: string;

  // Indicator identification
  category: IndicatorCategory;
  indicatorCode: string;
  description: string;

  // Assessment
  isPresent: boolean;
  severity?: IndicatorSeverity;
  notes?: string;

  // Evidence
  evidenceRefs?: string[];

  // Metadata
  identifiedAt: Date;
  identifiedBy: string;
}

// Pre-defined indicators per AU-C 570
export const FINANCIAL_INDICATORS = [
  {
    code: 'FIN-01',
    description: 'Negative trends (recurring losses, working capital deficiencies, negative cash flows)',
  },
  {
    code: 'FIN-02',
    description: 'Inability to pay creditors on due dates',
  },
  {
    code: 'FIN-03',
    description: 'Inability to comply with loan agreement terms (covenants)',
  },
  {
    code: 'FIN-04',
    description: 'Change from credit to cash-on-delivery transactions with suppliers',
  },
  {
    code: 'FIN-05',
    description: 'Inability to obtain financing for essential new product development or investments',
  },
  {
    code: 'FIN-06',
    description: 'Substantial dependence on short-term borrowings to finance long-term assets',
  },
  {
    code: 'FIN-07',
    description: 'Arrearages in dividends',
  },
  {
    code: 'FIN-08',
    description: 'Denial of usual trade credit from suppliers',
  },
  {
    code: 'FIN-09',
    description: 'Noncompliance with statutory capital requirements',
  },
];

export const OPERATING_INDICATORS = [
  {
    code: 'OPS-01',
    description: 'Loss of key management without replacement',
  },
  {
    code: 'OPS-02',
    description: 'Loss of a major market, key customer(s), franchise, license, or principal supplier(s)',
  },
  {
    code: 'OPS-03',
    description: 'Labor difficulties',
  },
  {
    code: 'OPS-04',
    description: 'Shortages of important supplies',
  },
  {
    code: 'OPS-05',
    description: 'Emergence of a highly successful competitor',
  },
];

export const OTHER_INDICATORS = [
  {
    code: 'OTH-01',
    description: 'Noncompliance with capital or other statutory requirements',
  },
  {
    code: 'OTH-02',
    description: 'Pending legal or regulatory proceedings that may result in claims the entity cannot satisfy',
  },
  {
    code: 'OTH-03',
    description: 'Changes in law or regulation or government policy expected to adversely affect the entity',
  },
  {
    code: 'OTH-04',
    description: 'Uninsured or underinsured catastrophes when they occur',
  },
];

// ============================================
// Management's Plans
// ============================================

export type PlanCategory =
  | 'dispose_assets'
  | 'borrow_money'
  | 'restructure_debt'
  | 'reduce_expenditures'
  | 'increase_ownership_equity'
  | 'other';

export interface ManagementPlan {
  id: string;
  assessmentId: string;

  // Plan identification
  category: PlanCategory;
  description: string;
  expectedOutcome: string;
  expectedTimeline: string;

  // Feasibility assessment
  isFeasible: boolean;
  feasibilityAssessment: string;
  supportingEvidence?: string[];

  // Likelihood assessment
  likelihoodOfSuccess: 'low' | 'moderate' | 'high';
  likelihoodRationale: string;

  // Effect on going concern
  expectedEffect: string;
  mitigatesIndicators: string[]; // Indicator codes

  // Auditor evaluation
  auditorConclusion: 'adequate' | 'inadequate' | 'requires_further_evaluation';
  auditorNotes?: string;

  // Metadata
  evaluatedBy: string;
  evaluatedAt: Date;
}

// ============================================
// Going Concern Assessment
// ============================================

export type AssessmentConclusion =
  | 'no_substantial_doubt'
  | 'substantial_doubt_mitigated'
  | 'substantial_doubt_exists';

export type DisclosureRequirement =
  | 'none_required'
  | 'adequate_disclosure_exists'
  | 'disclosure_inadequate'
  | 'disclosure_omitted';

export type ReportModification =
  | 'none_required'
  | 'emphasis_of_matter'
  | 'qualified_opinion'
  | 'adverse_opinion'
  | 'disclaimer_of_opinion';

export interface GoingConcernAssessment {
  id: string;
  engagementId: string;

  // Assessment period
  assessmentPeriodStart: Date;
  assessmentPeriodEnd: Date;
  lookForwardPeriod: number; // months (typically 12)

  // Indicators
  indicators: GoingConcernIndicator[];
  hasIndicatorsPresent: boolean;

  // Initial evaluation
  initialEvaluation: {
    substantialDoubtRaised: boolean;
    evaluationNotes: string;
    evaluatedBy: string;
    evaluatedAt: Date;
  };

  // Management's plans
  managementPlans: ManagementPlan[];
  managementPlansObtained: boolean;
  managementPlansAdequate: boolean;

  // Final conclusion
  conclusion: AssessmentConclusion;
  conclusionRationale: string;

  // Disclosure assessment
  disclosureAssessment: {
    requirement: DisclosureRequirement;
    disclosuresAdequate: boolean;
    requiredDisclosures?: string[];
    missingDisclosures?: string[];
  };

  // Report impact
  reportModification: ReportModification;
  reportLanguage?: string;

  // Documentation
  workpaperRefs: string[];
  evidenceRefs: string[];

  // Sign-off
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  partnerApproval?: {
    approvedBy: string;
    approvedAt: Date;
    notes?: string;
  };

  // Status
  status: 'draft' | 'in_review' | 'approved' | 'finalized';

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Going Concern Checklist
// ============================================

export interface GoingConcernChecklistItem {
  id: string;
  assessmentId: string;

  // Item details
  category: string;
  requirement: string;
  guidance?: string;

  // Response
  response: 'yes' | 'no' | 'na' | 'pending';
  explanation?: string;
  workpaperRef?: string;

  // Completion
  completedBy?: string;
  completedAt?: Date;
}

export const GOING_CONCERN_CHECKLIST_ITEMS = [
  {
    category: 'Planning',
    items: [
      {
        requirement: 'Evaluated whether conditions or events exist that raise substantial doubt about going concern',
        guidance: 'AU-C 570.06',
      },
      {
        requirement: 'Considered whether management has already performed a preliminary assessment',
        guidance: 'AU-C 570.07',
      },
      {
        requirement: 'Discussed with management their knowledge of conditions or events beyond the assessment period',
        guidance: 'AU-C 570.08',
      },
    ],
  },
  {
    category: 'Procedures',
    items: [
      {
        requirement: 'Evaluated management\'s assessment of going concern ability',
        guidance: 'AU-C 570.10',
      },
      {
        requirement: 'Considered the same period used by management (at least 12 months from balance sheet date)',
        guidance: 'AU-C 570.11',
      },
      {
        requirement: 'Inquired of management about events or conditions beyond the assessment period',
        guidance: 'AU-C 570.14',
      },
      {
        requirement: 'Evaluated management\'s plans for future actions to mitigate going concern',
        guidance: 'AU-C 570.16',
      },
    ],
  },
  {
    category: 'Evaluation',
    items: [
      {
        requirement: 'Evaluated whether management\'s plans are feasible',
        guidance: 'AU-C 570.17',
      },
      {
        requirement: 'Evaluated whether it is probable that plans will be effectively implemented and will mitigate conditions',
        guidance: 'AU-C 570.17',
      },
      {
        requirement: 'Considered the need for written representations from management',
        guidance: 'AU-C 570.23',
      },
    ],
  },
  {
    category: 'Conclusion and Reporting',
    items: [
      {
        requirement: 'Concluded whether substantial doubt exists or has been alleviated',
        guidance: 'AU-C 570.18-19',
      },
      {
        requirement: 'Evaluated adequacy of disclosure about going concern',
        guidance: 'AU-C 570.20-21',
      },
      {
        requirement: 'Determined appropriate modification to audit report (if applicable)',
        guidance: 'AU-C 570.22',
      },
      {
        requirement: 'Communicated with those charged with governance',
        guidance: 'AU-C 570.24',
      },
    ],
  },
];

// ============================================
// Helper Functions
// ============================================

export function getIndicatorCategoryLabel(category: IndicatorCategory): string {
  const labels: Record<IndicatorCategory, string> = {
    financial: 'Financial Indicators',
    operating: 'Operating Indicators',
    other: 'Other Indicators',
  };
  return labels[category];
}

export function getIndicatorSeverityLabel(severity: IndicatorSeverity): string {
  const labels: Record<IndicatorSeverity, string> = {
    moderate: 'Moderate',
    significant: 'Significant',
    severe: 'Severe',
  };
  return labels[severity];
}

export function getPlanCategoryLabel(category: PlanCategory): string {
  const labels: Record<PlanCategory, string> = {
    dispose_assets: 'Dispose of Assets',
    borrow_money: 'Borrow Money or Restructure Debt',
    restructure_debt: 'Restructure Debt',
    reduce_expenditures: 'Reduce or Delay Expenditures',
    increase_ownership_equity: 'Increase Ownership Equity',
    other: 'Other Plans',
  };
  return labels[category];
}

export function getConclusionLabel(conclusion: AssessmentConclusion): string {
  const labels: Record<AssessmentConclusion, string> = {
    no_substantial_doubt: 'No Substantial Doubt',
    substantial_doubt_mitigated: 'Substantial Doubt Mitigated by Management\'s Plans',
    substantial_doubt_exists: 'Substantial Doubt Exists',
  };
  return labels[conclusion];
}

export function getReportModificationLabel(modification: ReportModification): string {
  const labels: Record<ReportModification, string> = {
    none_required: 'No Modification Required',
    emphasis_of_matter: 'Emphasis-of-Matter Paragraph',
    qualified_opinion: 'Qualified Opinion',
    adverse_opinion: 'Adverse Opinion',
    disclaimer_of_opinion: 'Disclaimer of Opinion',
  };
  return labels[modification];
}

/**
 * Determine report modification based on assessment conclusion
 */
export function determineReportModification(
  conclusion: AssessmentConclusion,
  disclosureAdequate: boolean
): ReportModification {
  if (conclusion === 'no_substantial_doubt') {
    return 'none_required';
  }

  if (conclusion === 'substantial_doubt_mitigated') {
    return disclosureAdequate ? 'emphasis_of_matter' : 'qualified_opinion';
  }

  if (conclusion === 'substantial_doubt_exists') {
    if (!disclosureAdequate) {
      return 'adverse_opinion';
    }
    return 'emphasis_of_matter';
  }

  return 'none_required';
}

/**
 * Calculate severity based on number and types of indicators present
 */
export function calculateOverallSeverity(
  indicators: GoingConcernIndicator[]
): IndicatorSeverity | null {
  const presentIndicators = indicators.filter((i) => i.isPresent);

  if (presentIndicators.length === 0) return null;

  const severeCount = presentIndicators.filter((i) => i.severity === 'severe').length;
  const significantCount = presentIndicators.filter((i) => i.severity === 'significant').length;

  if (severeCount > 0) return 'severe';
  if (significantCount >= 2 || presentIndicators.length >= 4) return 'significant';
  return 'moderate';
}
