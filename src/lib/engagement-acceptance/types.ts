/**
 * Engagement Acceptance Types
 * Type definitions for the engagement acceptance module
 *
 * Implements:
 * - AU-C 210: Terms of Engagement
 * - AU-C 220: Quality Control for an Engagement
 * - ISQM 1: Quality Management for Firms
 */

// ============================================
// Independence Types (AU-C 220, ET Section 1.200)
// ============================================

export type IndependenceThreatType =
  | 'self_interest'
  | 'self_review'
  | 'advocacy'
  | 'familiarity'
  | 'intimidation';

export type IndependenceThreatLevel = 'none' | 'low' | 'moderate' | 'high' | 'unacceptable';

export interface IndependenceThreat {
  type: IndependenceThreatType;
  description: string;
  level: IndependenceThreatLevel;
  safeguards?: string[];
  residualRisk?: IndependenceThreatLevel;
}

export interface FinancialRelationship {
  type: 'direct_investment' | 'indirect_investment' | 'loan' | 'deposit' | 'insurance' | 'other';
  description: string;
  amount?: number;
  isProblem: boolean;
  resolution?: string;
}

export interface PersonalRelationship {
  teamMember: string;
  clientPerson: string;
  relationship: 'family_member' | 'close_friend' | 'business_partner' | 'former_employer' | 'other';
  description: string;
  isProblem: boolean;
  resolution?: string;
}

export interface ServiceConflict {
  serviceType: string;
  description: string;
  threatType: IndependenceThreatType;
  isProblem: boolean;
  resolution?: string;
}

export interface IndependenceDeclaration {
  id: string;
  engagementId: string;
  teamMemberId: string;
  teamMemberName: string;
  teamMemberRole: string;

  // Declarations
  hasFinancialInterest: boolean;
  financialRelationships: FinancialRelationship[];

  hasPersonalRelationship: boolean;
  personalRelationships: PersonalRelationship[];

  hasServiceConflict: boolean;
  serviceConflicts: ServiceConflict[];

  hasFeeArrangementIssue: boolean;
  feeArrangementDescription?: string;

  hasOtherThreat: boolean;
  otherThreats?: string;

  // Assessment
  threats: IndependenceThreat[];
  overallAssessment: IndependenceThreatLevel;
  safeguardsApplied: string[];

  // Certification
  isCertified: boolean;
  certifiedAt?: Date;
  certificationStatement?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Client Risk Assessment Types (ISQM 1)
// ============================================

export type RiskCategory = 'low' | 'moderate' | 'high' | 'unacceptable';

export interface ManagementIntegrityAssessment {
  // Factors affecting integrity assessment
  reputationInMarket: RiskCategory;
  priorAuditExperience?: RiskCategory;
  regulatoryHistory: RiskCategory;
  litigationHistory: RiskCategory;
  relatedPartyComplexity: RiskCategory;
  ownershipStructure: RiskCategory;

  // Supporting information
  notes: string;
  redFlags: string[];
  overallAssessment: RiskCategory;
}

export interface FinancialStabilityAssessment {
  goingConcernIndicators: boolean;
  goingConcernDescription?: string;
  profitabilityTrend: 'improving' | 'stable' | 'declining';
  liquidityPosition: RiskCategory;
  debtLevels: RiskCategory;

  notes: string;
  overallAssessment: RiskCategory;
}

export interface EngagementRiskAssessment {
  // Complexity factors
  industryComplexity: RiskCategory;
  operationalComplexity: RiskCategory;
  accountingComplexity: RiskCategory;
  itEnvironmentComplexity: RiskCategory;

  // Risk factors
  fraudRisk: RiskCategory;
  regulatoryRisk: RiskCategory;
  publicInterestRisk: RiskCategory;

  // Resource considerations
  specialistRequired: boolean;
  specialistTypes?: string[];

  notes: string;
  overallAssessment: RiskCategory;
}

export interface ClientRiskAssessment {
  id: string;
  engagementId: string;
  clientId: string;

  // Assessment components
  managementIntegrity: ManagementIntegrityAssessment;
  financialStability: FinancialStabilityAssessment;
  engagementRisk: EngagementRiskAssessment;

  // Overall determination
  overallRiskRating: RiskCategory;
  acceptanceRecommendation: 'accept' | 'accept_with_conditions' | 'decline';
  conditions?: string[];
  declineReason?: string;

  // Approvals
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;

  // Partner approval required for high-risk
  partnerApprovalRequired: boolean;
  partnerApprovedBy?: string;
  partnerApprovedAt?: Date;

  // Metadata
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Engagement Letter Types (AU-C 210)
// ============================================

export type EngagementType =
  | 'audit_financial_statements'
  | 'review_financial_statements'
  | 'compilation_financial_statements'
  | 'agreed_upon_procedures'
  | 'attestation_examination'
  | 'attestation_review'
  | 'internal_control_audit'
  | 'compliance_audit'
  | 'benefit_plan_audit'
  | 'government_audit';

export interface EngagementScope {
  engagementType: EngagementType;
  financialStatements: string[];
  periodCovered: {
    startDate: Date;
    endDate: Date;
  };

  // Framework
  applicableFramework: string; // e.g., "GAAP", "IFRS", "GASB"
  frameworkDescription?: string;

  // Scope limitations (if any)
  hasLimitations: boolean;
  limitations?: string[];
}

export interface ResponsibilityAllocation {
  // Management responsibilities
  managementResponsibilities: string[];

  // Auditor responsibilities
  auditorResponsibilities: string[];

  // Those charged with governance
  tcwgResponsibilities?: string[];
}

export interface EngagementTerms {
  // Fee arrangement
  feeStructure: 'fixed' | 'hourly' | 'contingent' | 'combination';
  estimatedFee?: number;
  feeDescription: string;
  billingSchedule?: string;

  // Timeline
  plannedStartDate: Date;
  expectedCompletionDate: Date;
  reportDeliveryDate?: Date;

  // Team
  engagementPartner: string;
  keyTeamMembers?: string[];

  // Other terms
  otherTerms?: string[];
}

export interface EngagementLetter {
  id: string;
  engagementId: string;
  clientId: string;

  // Letter content
  scope: EngagementScope;
  responsibilities: ResponsibilityAllocation;
  terms: EngagementTerms;

  // Additional provisions
  additionalServices?: string[];
  specialConsiderations?: string[];

  // Signatures
  auditorSignature?: {
    signedBy: string;
    signedAt: Date;
    title: string;
  };
  clientSignature?: {
    signedBy: string;
    signedAt: Date;
    title: string;
    organization: string;
  };

  // Document management
  version: number;
  status: 'draft' | 'pending_client' | 'signed' | 'expired' | 'superseded';
  generatedAt: Date;
  sentAt?: Date;
  signedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Acceptance Workflow Types
// ============================================

export type AcceptanceStage =
  | 'independence_check'
  | 'risk_assessment'
  | 'engagement_letter'
  | 'partner_approval'
  | 'complete';

export interface AcceptanceWorkflow {
  id: string;
  engagementId: string;

  // Stage tracking
  currentStage: AcceptanceStage;
  completedStages: AcceptanceStage[];

  // Component references
  independenceDeclarations: string[]; // Declaration IDs
  clientRiskAssessmentId?: string;
  engagementLetterId?: string;

  // Validation status
  isIndependenceConfirmed: boolean;
  isRiskAssessmentComplete: boolean;
  isEngagementLetterSigned: boolean;

  // Partner approval
  requiresPartnerApproval: boolean;
  partnerApprovalStatus: 'not_required' | 'pending' | 'approved' | 'rejected';
  partnerApprovalNotes?: string;

  // Overall status
  isComplete: boolean;
  completedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Form Validation Types
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================
// Helper Functions
// ============================================

export function getThreatTypeLabel(type: IndependenceThreatType): string {
  const labels: Record<IndependenceThreatType, string> = {
    self_interest: 'Self-Interest Threat',
    self_review: 'Self-Review Threat',
    advocacy: 'Advocacy Threat',
    familiarity: 'Familiarity Threat',
    intimidation: 'Intimidation Threat',
  };
  return labels[type];
}

export function getRiskCategoryLabel(category: RiskCategory): string {
  const labels: Record<RiskCategory, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    unacceptable: 'Unacceptable',
  };
  return labels[category];
}

export function getEngagementTypeLabel(type: EngagementType): string {
  const labels: Record<EngagementType, string> = {
    audit_financial_statements: 'Audit of Financial Statements',
    review_financial_statements: 'Review of Financial Statements',
    compilation_financial_statements: 'Compilation of Financial Statements',
    agreed_upon_procedures: 'Agreed-Upon Procedures',
    attestation_examination: 'Attestation Examination',
    attestation_review: 'Attestation Review',
    internal_control_audit: 'Internal Control Audit (ICFR)',
    compliance_audit: 'Compliance Audit',
    benefit_plan_audit: 'Employee Benefit Plan Audit',
    government_audit: 'Government Audit',
  };
  return labels[type];
}

export function calculateOverallRiskRating(
  management: RiskCategory,
  financial: RiskCategory,
  engagement: RiskCategory
): RiskCategory {
  const riskLevels: RiskCategory[] = ['low', 'moderate', 'high', 'unacceptable'];
  const scores = [management, financial, engagement].map((r) => riskLevels.indexOf(r));
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // If any component is unacceptable, overall is unacceptable
  if (maxScore === 3) return 'unacceptable';

  // If any component is high or average is moderate+, overall is high
  if (maxScore === 2 || avgScore >= 1.5) return 'high';

  // If average is between low and moderate, overall is moderate
  if (avgScore >= 0.5) return 'moderate';

  return 'low';
}
