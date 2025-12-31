/**
 * Control Testing Types
 * Type definitions for the control testing module
 *
 * Implements:
 * - AU-C 330: Performing Audit Procedures in Response to Assessed Risks
 * - AU-C 315: Understanding the Entity and Its Environment
 * - AS 2201: An Audit of Internal Control Over Financial Reporting (PCAOB)
 */

// ============================================
// Control Types
// ============================================

export type ControlType = 'preventive' | 'detective' | 'corrective';

export type ControlNature = 'manual' | 'automated' | 'it_dependent_manual';

export type ControlFrequency =
  | 'continuous'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually'
  | 'ad_hoc';

export type ControlAssertion =
  | 'existence_occurrence'
  | 'completeness'
  | 'accuracy_valuation'
  | 'cutoff'
  | 'classification'
  | 'rights_obligations'
  | 'presentation_disclosure';

export type ControlRiskLevel = 'low' | 'moderate' | 'high';

export type ControlEffectiveness = 'effective' | 'effective_with_exceptions' | 'ineffective';

export type TestingApproach = 'inquiry' | 'observation' | 'inspection' | 'reperformance' | 'walkthrough';

export type DeviationType = 'design' | 'operating' | 'both';

// ============================================
// Control Definition
// ============================================

export interface Control {
  id: string;
  engagementId: string;
  processId?: string;
  accountId?: string;

  // Control identification
  controlNumber: string;
  controlName: string;
  controlDescription: string;
  controlObjective: string;

  // Control characteristics
  type: ControlType;
  nature: ControlNature;
  frequency: ControlFrequency;
  assertions: ControlAssertion[];

  // Risk and reliance
  isKeyControl: boolean;
  riskLevel: ControlRiskLevel;
  reliesOnItGeneral: boolean;
  itApplications?: string[];

  // Control owner
  controlOwnerId?: string;
  controlOwnerName?: string;
  department?: string;

  // Design assessment
  designAssessment?: DesignAssessment;

  // Testing status
  testingStatus: 'not_tested' | 'in_progress' | 'tested';
  testingConclusion?: ControlEffectiveness;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================
// Design Assessment
// ============================================

export interface DesignAssessment {
  id: string;
  controlId: string;

  // Design evaluation
  isDesignEffective: boolean;
  designConclusion: string;

  // Evaluation criteria
  addressesRisk: boolean;
  addressesAssertion: boolean;
  appropriateLevel: boolean;
  adequateDocumentation: boolean;

  // Gap identification
  designGaps: DesignGap[];

  // Assessment details
  assessedBy: string;
  assessedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface DesignGap {
  description: string;
  impact: 'low' | 'moderate' | 'high';
  recommendation: string;
  managementResponse?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

// ============================================
// Test of Controls
// ============================================

export interface TestOfControls {
  id: string;
  controlId: string;
  engagementId: string;

  // Test identification
  testNumber: string;
  testObjective: string;
  testDescription: string;

  // Testing approach
  testingApproaches: TestingApproach[];
  populationDescription: string;
  populationSize: number;
  sampleSize: number;
  samplingMethod: 'random' | 'haphazard' | 'systematic' | 'block' | 'judgmental';
  samplingRationale?: string;

  // Sample selection
  selectionCriteria: string;
  testingPeriod: {
    startDate: Date;
    endDate: Date;
  };

  // Test results
  itemsTested: number;
  deviationsFound: number;
  deviations: ControlDeviation[];

  // Conclusions
  operatingEffectiveness: ControlEffectiveness;
  conclusionNarrative: string;

  // Documentation
  workpaperRef: string;
  evidenceRefs: string[];

  // Sign-off
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Control Deviation
// ============================================

export interface ControlDeviation {
  id: string;
  testId: string;
  controlId: string;

  // Deviation details
  itemReference: string;
  deviationType: DeviationType;
  deviationDescription: string;
  rootCause?: string;

  // Impact assessment
  isIsolated: boolean;
  affectsOtherControls: boolean;
  affectedControls?: string[];

  // Risk implications
  riskImplication: 'low' | 'moderate' | 'high';
  potentialMisstatementImpact?: string;

  // Resolution
  managementResponse?: string;
  compensatingControl?: string;
  resolved: boolean;
  resolvedAt?: Date;

  // Metadata
  identifiedAt: Date;
  identifiedBy: string;
}

// ============================================
// Sample Size Determination
// ============================================

export interface SampleSizeParameters {
  controlFrequency: ControlFrequency;
  populationSize: number;
  riskOfOverreliance: 'low' | 'moderate' | 'high';
  expectedDeviationRate: number;
  tolerableDeviationRate: number;
  isKeyControl: boolean;
  priorYearResults?: ControlEffectiveness;
}

export interface SampleSizeResult {
  recommendedSampleSize: number;
  minimumSampleSize: number;
  rationale: string;
  auditStandard: string;
}

// ============================================
// Control Deficiency Evaluation
// ============================================

export type DeficiencyClassification =
  | 'control_deficiency'
  | 'significant_deficiency'
  | 'material_weakness';

export interface ControlDeficiency {
  id: string;
  engagementId: string;
  controlIds: string[];

  // Deficiency identification
  deficiencyNumber: string;
  deficiencyTitle: string;
  deficiencyDescription: string;

  // Classification
  classification: DeficiencyClassification;
  classificationRationale: string;

  // Impact
  affectedAccounts: string[];
  affectedAssertions: ControlAssertion[];
  quantitativeImpact?: number;
  qualitativeFactors: string[];

  // Root cause analysis
  rootCause: string;
  isSystemic: boolean;

  // Remediation
  managementRemediationPlan?: string;
  expectedRemediationDate?: Date;
  compensatingControls?: string[];

  // Communication
  communicateToManagement: boolean;
  communicatedToManagementAt?: Date;
  communicateToTCWG: boolean;
  communicatedToTCWGAt?: Date;

  // Status
  status: 'identified' | 'communicated' | 'remediated' | 'accepted';

  // Documentation
  preparedBy: string;
  preparedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
}

// ============================================
// IT General Controls
// ============================================

export type ITGCDomain =
  | 'access_security'
  | 'change_management'
  | 'computer_operations'
  | 'program_development';

export interface ITGeneralControl {
  id: string;
  engagementId: string;

  // Control identification
  domain: ITGCDomain;
  controlNumber: string;
  controlName: string;
  controlDescription: string;

  // Scope
  applicationsInScope: string[];
  systemsInScope: string[];

  // Assessment
  designEffective: boolean;
  operatingEffective: boolean;
  overallEffectiveness: ControlEffectiveness;

  // Reliance
  applicationControlsRelying: string[];

  // Testing
  testingStatus: 'not_tested' | 'in_progress' | 'tested';
  testWorkpaperRef?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Control Testing Summary
// ============================================

export interface ControlTestingSummary {
  engagementId: string;

  // Counts
  totalControls: number;
  keyControls: number;

  // Testing status
  controlsTested: number;
  controlsNotTested: number;
  controlsInProgress: number;

  // Results
  effectiveControls: number;
  effectiveWithExceptions: number;
  ineffectiveControls: number;

  // Deviations
  totalDeviations: number;
  isolatedDeviations: number;
  systemicDeviations: number;

  // Deficiencies
  controlDeficiencies: number;
  significantDeficiencies: number;
  materialWeaknesses: number;

  // ITGC
  itgcEffective: boolean;
  itgcExceptions: number;
}

// ============================================
// Helper Functions
// ============================================

export function getControlTypeLabel(type: ControlType): string {
  const labels: Record<ControlType, string> = {
    preventive: 'Preventive',
    detective: 'Detective',
    corrective: 'Corrective',
  };
  return labels[type];
}

export function getControlNatureLabel(nature: ControlNature): string {
  const labels: Record<ControlNature, string> = {
    manual: 'Manual',
    automated: 'Automated',
    it_dependent_manual: 'IT-Dependent Manual',
  };
  return labels[nature];
}

export function getControlFrequencyLabel(frequency: ControlFrequency): string {
  const labels: Record<ControlFrequency, string> = {
    continuous: 'Continuous',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annually: 'Annually',
    ad_hoc: 'Ad Hoc',
  };
  return labels[frequency];
}

export function getAssertionLabel(assertion: ControlAssertion): string {
  const labels: Record<ControlAssertion, string> = {
    existence_occurrence: 'Existence/Occurrence',
    completeness: 'Completeness',
    accuracy_valuation: 'Accuracy/Valuation',
    cutoff: 'Cutoff',
    classification: 'Classification',
    rights_obligations: 'Rights & Obligations',
    presentation_disclosure: 'Presentation & Disclosure',
  };
  return labels[assertion];
}

export function getDeficiencyClassificationLabel(
  classification: DeficiencyClassification
): string {
  const labels: Record<DeficiencyClassification, string> = {
    control_deficiency: 'Control Deficiency',
    significant_deficiency: 'Significant Deficiency',
    material_weakness: 'Material Weakness',
  };
  return labels[classification];
}

export function getITGCDomainLabel(domain: ITGCDomain): string {
  const labels: Record<ITGCDomain, string> = {
    access_security: 'Access & Security',
    change_management: 'Change Management',
    computer_operations: 'Computer Operations',
    program_development: 'Program Development',
  };
  return labels[domain];
}

/**
 * Calculate recommended sample size based on AU-C 530 guidance
 */
export function calculateSampleSize(params: SampleSizeParameters): SampleSizeResult {
  let baseSize: number;
  let rationale: string;

  // Base sample size by frequency
  const frequencySamples: Record<ControlFrequency, number> = {
    continuous: 25,
    daily: 25,
    weekly: 10,
    monthly: 3,
    quarterly: 2,
    annually: 1,
    ad_hoc: 5,
  };

  baseSize = frequencySamples[params.controlFrequency];

  // Adjust for risk of overreliance
  if (params.riskOfOverreliance === 'low') {
    baseSize = Math.ceil(baseSize * 0.8);
  } else if (params.riskOfOverreliance === 'high') {
    baseSize = Math.ceil(baseSize * 1.5);
  }

  // Adjust for key controls
  if (params.isKeyControl) {
    baseSize = Math.ceil(baseSize * 1.25);
  }

  // Adjust for prior year results
  if (params.priorYearResults === 'ineffective') {
    baseSize = Math.ceil(baseSize * 1.5);
  } else if (params.priorYearResults === 'effective_with_exceptions') {
    baseSize = Math.ceil(baseSize * 1.25);
  }

  // Minimum sample sizes
  const minimumSamples: Record<ControlFrequency, number> = {
    continuous: 20,
    daily: 20,
    weekly: 5,
    monthly: 2,
    quarterly: 2,
    annually: 1,
    ad_hoc: 3,
  };

  const minimumSampleSize = minimumSamples[params.controlFrequency];
  const recommendedSampleSize = Math.max(baseSize, minimumSampleSize);

  // Cap at population size
  const finalSize = Math.min(recommendedSampleSize, params.populationSize);

  rationale = `Sample size of ${finalSize} determined based on control frequency (${params.controlFrequency}), `;
  rationale += `risk of overreliance (${params.riskOfOverreliance}), `;
  if (params.isKeyControl) rationale += 'key control designation, ';
  if (params.priorYearResults) rationale += `prior year results (${params.priorYearResults}), `;
  rationale += 'per AU-C 530 guidance.';

  return {
    recommendedSampleSize: finalSize,
    minimumSampleSize,
    rationale,
    auditStandard: 'AU-C 530',
  };
}

/**
 * Evaluate deficiency classification based on likelihood and magnitude
 */
export function evaluateDeficiencyClassification(
  likelihood: 'remote' | 'reasonably_possible' | 'probable',
  magnitude: 'inconsequential' | 'more_than_inconsequential' | 'material'
): DeficiencyClassification {
  if (magnitude === 'material' && likelihood === 'probable') {
    return 'material_weakness';
  }

  if (
    magnitude === 'material' ||
    (magnitude === 'more_than_inconsequential' && likelihood !== 'remote')
  ) {
    return 'significant_deficiency';
  }

  return 'control_deficiency';
}
