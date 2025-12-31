/**
 * Engagement Acceptance Validation
 * Business rule validation for the engagement acceptance module
 *
 * Implements validation requirements per:
 * - AU-C 210: Terms of Engagement
 * - AU-C 220: Quality Control for an Engagement
 * - ISQM 1: Quality Management for Firms
 * - AICPA Code of Professional Conduct
 */

import {
  IndependenceDeclaration,
  IndependenceThreat,
  IndependenceThreatLevel,
  ClientRiskAssessment,
  RiskCategory,
  EngagementLetter,
  AcceptanceWorkflow,
  ValidationResult,
  ValidationError,
} from './types';

// ============================================
// Independence Validation
// ============================================

export function validateIndependenceDeclaration(
  declaration: Partial<IndependenceDeclaration>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!declaration.teamMemberId) {
    errors.push({ field: 'teamMemberId', message: 'Team member is required' });
  }

  if (!declaration.engagementId) {
    errors.push({ field: 'engagementId', message: 'Engagement is required' });
  }

  // If has financial interest, must provide details
  if (declaration.hasFinancialInterest) {
    if (!declaration.financialRelationships || declaration.financialRelationships.length === 0) {
      errors.push({
        field: 'financialRelationships',
        message: 'Please provide details of financial relationships',
      });
    }
  }

  // If has personal relationship, must provide details
  if (declaration.hasPersonalRelationship) {
    if (!declaration.personalRelationships || declaration.personalRelationships.length === 0) {
      errors.push({
        field: 'personalRelationships',
        message: 'Please provide details of personal relationships',
      });
    }
  }

  // If has service conflict, must provide details
  if (declaration.hasServiceConflict) {
    if (!declaration.serviceConflicts || declaration.serviceConflicts.length === 0) {
      errors.push({
        field: 'serviceConflicts',
        message: 'Please provide details of service conflicts',
      });
    }
  }

  // Certification validation
  if (declaration.isCertified && !declaration.certifiedAt) {
    errors.push({
      field: 'certifiedAt',
      message: 'Certification date is required when certifying',
    });
  }

  // Check for unacceptable threats
  if (declaration.threats) {
    const unacceptableThreats = declaration.threats.filter(
      (t) => t.level === 'unacceptable' || t.residualRisk === 'unacceptable'
    );

    if (unacceptableThreats.length > 0 && declaration.isCertified) {
      errors.push({
        field: 'threats',
        message: 'Cannot certify independence with unacceptable threat levels',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function assessOverallIndependence(
  declarations: IndependenceDeclaration[]
): {
  isIndependent: boolean;
  overallLevel: IndependenceThreatLevel;
  issues: string[];
} {
  const issues: string[] = [];
  let highestThreatLevel: IndependenceThreatLevel = 'none';

  const threatLevelOrder: IndependenceThreatLevel[] = [
    'none',
    'low',
    'moderate',
    'high',
    'unacceptable',
  ];

  for (const declaration of declarations) {
    // Check if certified
    if (!declaration.isCertified) {
      issues.push(`${declaration.teamMemberName} has not certified independence`);
    }

    // Check overall assessment
    const levelIndex = threatLevelOrder.indexOf(declaration.overallAssessment);
    const currentHighestIndex = threatLevelOrder.indexOf(highestThreatLevel);

    if (levelIndex > currentHighestIndex) {
      highestThreatLevel = declaration.overallAssessment;
    }

    // Check for specific issues
    for (const threat of declaration.threats) {
      if (threat.level === 'high' || threat.level === 'unacceptable') {
        issues.push(
          `${declaration.teamMemberName}: ${threat.description} (${threat.level} threat)`
        );
      }
    }

    // Check unresolved financial relationships
    const unresolvedFinancial = declaration.financialRelationships.filter(
      (r) => r.isProblem && !r.resolution
    );
    for (const rel of unresolvedFinancial) {
      issues.push(`${declaration.teamMemberName}: Unresolved financial relationship - ${rel.description}`);
    }

    // Check unresolved personal relationships
    const unresolvedPersonal = declaration.personalRelationships.filter(
      (r) => r.isProblem && !r.resolution
    );
    for (const rel of unresolvedPersonal) {
      issues.push(`${declaration.teamMemberName}: Unresolved personal relationship - ${rel.description}`);
    }
  }

  const isIndependent =
    highestThreatLevel !== 'unacceptable' &&
    declarations.every((d) => d.isCertified);

  return {
    isIndependent,
    overallLevel: highestThreatLevel,
    issues,
  };
}

// ============================================
// Client Risk Assessment Validation
// ============================================

export function validateClientRiskAssessment(
  assessment: Partial<ClientRiskAssessment>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!assessment.clientId) {
    errors.push({ field: 'clientId', message: 'Client is required' });
  }

  if (!assessment.engagementId) {
    errors.push({ field: 'engagementId', message: 'Engagement is required' });
  }

  // Management Integrity Assessment
  if (!assessment.managementIntegrity) {
    errors.push({
      field: 'managementIntegrity',
      message: 'Management integrity assessment is required',
    });
  } else {
    if (!assessment.managementIntegrity.overallAssessment) {
      errors.push({
        field: 'managementIntegrity.overallAssessment',
        message: 'Management integrity overall assessment is required',
      });
    }
  }

  // Financial Stability Assessment
  if (!assessment.financialStability) {
    errors.push({
      field: 'financialStability',
      message: 'Financial stability assessment is required',
    });
  } else {
    if (!assessment.financialStability.overallAssessment) {
      errors.push({
        field: 'financialStability.overallAssessment',
        message: 'Financial stability overall assessment is required',
      });
    }

    // Going concern indicators require description
    if (
      assessment.financialStability.goingConcernIndicators &&
      !assessment.financialStability.goingConcernDescription
    ) {
      errors.push({
        field: 'financialStability.goingConcernDescription',
        message: 'Going concern indicators require description',
      });
    }
  }

  // Engagement Risk Assessment
  if (!assessment.engagementRisk) {
    errors.push({
      field: 'engagementRisk',
      message: 'Engagement risk assessment is required',
    });
  } else {
    if (!assessment.engagementRisk.overallAssessment) {
      errors.push({
        field: 'engagementRisk.overallAssessment',
        message: 'Engagement risk overall assessment is required',
      });
    }

    // Specialist required must specify types
    if (
      assessment.engagementRisk.specialistRequired &&
      (!assessment.engagementRisk.specialistTypes ||
        assessment.engagementRisk.specialistTypes.length === 0)
    ) {
      errors.push({
        field: 'engagementRisk.specialistTypes',
        message: 'Please specify the types of specialists required',
      });
    }
  }

  // Overall determination
  if (!assessment.overallRiskRating) {
    errors.push({
      field: 'overallRiskRating',
      message: 'Overall risk rating is required',
    });
  }

  if (!assessment.acceptanceRecommendation) {
    errors.push({
      field: 'acceptanceRecommendation',
      message: 'Acceptance recommendation is required',
    });
  }

  // Decline requires reason
  if (
    assessment.acceptanceRecommendation === 'decline' &&
    !assessment.declineReason
  ) {
    errors.push({
      field: 'declineReason',
      message: 'Decline reason is required when recommending to decline',
    });
  }

  // Accept with conditions requires conditions
  if (
    assessment.acceptanceRecommendation === 'accept_with_conditions' &&
    (!assessment.conditions || assessment.conditions.length === 0)
  ) {
    errors.push({
      field: 'conditions',
      message: 'Conditions are required when recommending conditional acceptance',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function determinePartnerApprovalRequired(
  assessment: ClientRiskAssessment
): boolean {
  // Partner approval required for:
  // 1. High or unacceptable overall risk
  // 2. High management integrity risk (red flags)
  // 3. Going concern indicators present
  // 4. Public interest entities
  // 5. First-year engagements with high complexity

  if (
    assessment.overallRiskRating === 'high' ||
    assessment.overallRiskRating === 'unacceptable'
  ) {
    return true;
  }

  if (
    assessment.managementIntegrity.overallAssessment === 'high' ||
    assessment.managementIntegrity.overallAssessment === 'unacceptable'
  ) {
    return true;
  }

  if (assessment.financialStability.goingConcernIndicators) {
    return true;
  }

  if (assessment.engagementRisk.publicInterestRisk === 'high') {
    return true;
  }

  // Management integrity red flags
  if (
    assessment.managementIntegrity.redFlags &&
    assessment.managementIntegrity.redFlags.length > 0
  ) {
    return true;
  }

  return false;
}

// ============================================
// Engagement Letter Validation
// ============================================

export function validateEngagementLetter(
  letter: Partial<EngagementLetter>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Scope validation
  if (!letter.scope) {
    errors.push({ field: 'scope', message: 'Engagement scope is required' });
  } else {
    if (!letter.scope.engagementType) {
      errors.push({
        field: 'scope.engagementType',
        message: 'Engagement type is required',
      });
    }

    if (
      !letter.scope.financialStatements ||
      letter.scope.financialStatements.length === 0
    ) {
      errors.push({
        field: 'scope.financialStatements',
        message: 'Financial statements covered must be specified',
      });
    }

    if (!letter.scope.periodCovered) {
      errors.push({
        field: 'scope.periodCovered',
        message: 'Period covered is required',
      });
    } else {
      if (!letter.scope.periodCovered.startDate) {
        errors.push({
          field: 'scope.periodCovered.startDate',
          message: 'Period start date is required',
        });
      }
      if (!letter.scope.periodCovered.endDate) {
        errors.push({
          field: 'scope.periodCovered.endDate',
          message: 'Period end date is required',
        });
      }
    }

    if (!letter.scope.applicableFramework) {
      errors.push({
        field: 'scope.applicableFramework',
        message: 'Applicable financial reporting framework is required',
      });
    }
  }

  // Responsibilities validation
  if (!letter.responsibilities) {
    errors.push({
      field: 'responsibilities',
      message: 'Responsibility allocation is required',
    });
  } else {
    if (
      !letter.responsibilities.managementResponsibilities ||
      letter.responsibilities.managementResponsibilities.length === 0
    ) {
      errors.push({
        field: 'responsibilities.managementResponsibilities',
        message: 'Management responsibilities must be specified',
      });
    }

    if (
      !letter.responsibilities.auditorResponsibilities ||
      letter.responsibilities.auditorResponsibilities.length === 0
    ) {
      errors.push({
        field: 'responsibilities.auditorResponsibilities',
        message: 'Auditor responsibilities must be specified',
      });
    }
  }

  // Terms validation
  if (!letter.terms) {
    errors.push({ field: 'terms', message: 'Engagement terms are required' });
  } else {
    if (!letter.terms.feeStructure) {
      errors.push({
        field: 'terms.feeStructure',
        message: 'Fee structure is required',
      });
    }

    if (!letter.terms.engagementPartner) {
      errors.push({
        field: 'terms.engagementPartner',
        message: 'Engagement partner is required',
      });
    }

    if (!letter.terms.plannedStartDate) {
      errors.push({
        field: 'terms.plannedStartDate',
        message: 'Planned start date is required',
      });
    }

    if (!letter.terms.expectedCompletionDate) {
      errors.push({
        field: 'terms.expectedCompletionDate',
        message: 'Expected completion date is required',
      });
    }

    // Validate fee if structure is fixed
    if (
      letter.terms.feeStructure === 'fixed' &&
      (letter.terms.estimatedFee === undefined || letter.terms.estimatedFee <= 0)
    ) {
      errors.push({
        field: 'terms.estimatedFee',
        message: 'Estimated fee is required for fixed fee engagements',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// Acceptance Workflow Validation
// ============================================

export function validateAcceptanceWorkflow(
  workflow: AcceptanceWorkflow,
  declarations: IndependenceDeclaration[],
  riskAssessment: ClientRiskAssessment | null,
  engagementLetter: EngagementLetter | null
): ValidationResult {
  const errors: ValidationError[] = [];

  // Independence check
  if (!workflow.isIndependenceConfirmed) {
    const independenceResult = assessOverallIndependence(declarations);
    if (!independenceResult.isIndependent) {
      errors.push({
        field: 'independence',
        message: 'Independence has not been confirmed for all team members',
      });
    }
  }

  // Risk assessment
  if (!workflow.isRiskAssessmentComplete) {
    if (!riskAssessment) {
      errors.push({
        field: 'riskAssessment',
        message: 'Client risk assessment has not been completed',
      });
    } else if (!riskAssessment.isComplete) {
      errors.push({
        field: 'riskAssessment',
        message: 'Client risk assessment is incomplete',
      });
    }
  }

  // Engagement letter
  if (!workflow.isEngagementLetterSigned) {
    if (!engagementLetter) {
      errors.push({
        field: 'engagementLetter',
        message: 'Engagement letter has not been created',
      });
    } else if (engagementLetter.status !== 'signed') {
      errors.push({
        field: 'engagementLetter',
        message: 'Engagement letter has not been signed by the client',
      });
    }
  }

  // Partner approval (if required)
  if (
    workflow.requiresPartnerApproval &&
    workflow.partnerApprovalStatus !== 'approved'
  ) {
    errors.push({
      field: 'partnerApproval',
      message: 'Partner approval is required but has not been obtained',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function canCompleteAcceptance(
  workflow: AcceptanceWorkflow
): { canComplete: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!workflow.isIndependenceConfirmed) {
    blockers.push('Team independence must be confirmed');
  }

  if (!workflow.isRiskAssessmentComplete) {
    blockers.push('Client risk assessment must be completed');
  }

  if (!workflow.isEngagementLetterSigned) {
    blockers.push('Engagement letter must be signed');
  }

  if (
    workflow.requiresPartnerApproval &&
    workflow.partnerApprovalStatus === 'pending'
  ) {
    blockers.push('Partner approval is pending');
  }

  if (
    workflow.requiresPartnerApproval &&
    workflow.partnerApprovalStatus === 'rejected'
  ) {
    blockers.push('Partner has rejected the engagement');
  }

  return {
    canComplete: blockers.length === 0,
    blockers,
  };
}
