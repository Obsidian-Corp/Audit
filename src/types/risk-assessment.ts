// Risk Assessment Domain Types
// Phase 1: Foundation - Risk-based audit methodology types

export type RiskLevel = 'low' | 'medium' | 'high' | 'significant';
export type CompanySize = 'small' | 'medium' | 'large' | 'enterprise';
export type EngagementType = 'first_year' | 'recurring' | 'special_purpose';
export type ReviewStatus = 'draft' | 'reviewed' | 'approved';
export type AreaCategory = 'balance_sheet' | 'income_statement' | 'control_environment' | 'other';
export type RecommendedApproach = 'substantive' | 'controls_reliance' | 'combined';
export type TestingLevel = 'minimal' | 'standard' | 'enhanced' | 'extensive';

// ============================================================================
// BUSINESS PROFILE
// ============================================================================

export interface BusinessProfile {
  industry: string;
  company_size: CompanySize;
  revenue_range?: string;
  complexity_factors: ComplexityFactor[];
}

export interface ComplexityFactor {
  factor: string;
  description: string;
  impact_on_risk: 'increases' | 'decreases' | 'neutral';
  is_selected: boolean;
}

// Pre-defined complexity factors
export const COMPLEXITY_FACTORS: Omit<ComplexityFactor, 'is_selected'>[] = [
  {
    factor: 'multi_entity',
    description: 'Multiple legal entities or consolidated operations',
    impact_on_risk: 'increases'
  },
  {
    factor: 'international',
    description: 'International operations or foreign subsidiaries',
    impact_on_risk: 'increases'
  },
  {
    factor: 'complex_instruments',
    description: 'Complex financial instruments or derivatives',
    impact_on_risk: 'increases'
  },
  {
    factor: 'recent_acquisition',
    description: 'Significant acquisitions or disposals in current year',
    impact_on_risk: 'increases'
  },
  {
    factor: 'new_systems',
    description: 'New accounting or IT systems implemented',
    impact_on_risk: 'increases'
  },
  {
    factor: 'regulatory_changes',
    description: 'Significant regulatory or accounting standard changes',
    impact_on_risk: 'increases'
  },
  {
    factor: 'management_turnover',
    description: 'Recent turnover in key management or accounting personnel',
    impact_on_risk: 'increases'
  },
  {
    factor: 'strong_controls',
    description: 'Well-established, tested internal controls',
    impact_on_risk: 'decreases'
  }
];

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

export interface EngagementRiskAssessment {
  id: string;
  engagement_id: string;
  firm_id: string;

  // Business Understanding
  industry: string;
  company_size: CompanySize;
  revenue_range?: string;
  complexity_factors: ComplexityFactor[];

  // Engagement Context
  engagement_type: EngagementType;
  prior_year_opinion?: 'clean' | 'qualified' | 'adverse' | 'disclaimer' | 'n/a';
  years_as_client: number;

  // Overall Risk Ratings
  overall_risk_rating: RiskLevel;
  fraud_risk_rating: RiskLevel;
  it_dependency_rating: RiskLevel;

  // Assessment Metadata
  assessment_date: string;
  assessed_by?: string;
  reviewed_by?: string;
  review_status: ReviewStatus;

  // Versioning
  version: number;
  is_current: boolean;

  created_at: string;
  updated_at: string;
}

export interface RiskAreaAssessment {
  id: string;
  risk_assessment_id: string;

  // Area Identification
  area_name: string;
  area_category: AreaCategory;

  // Risk Scoring
  inherent_risk: RiskLevel;
  control_risk: RiskLevel;
  combined_risk: RiskLevel;
  fraud_risk_factors: string[];

  // Risk Justification
  risk_rationale?: string;
  key_risk_factors: string[];

  // Materiality Context
  materiality_threshold?: number;
  is_material_area: boolean;

  // Recommendations
  recommended_approach?: RecommendedApproach;
  recommended_testing_level?: TestingLevel;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// FRAUD RISK ASSESSMENT
// ============================================================================

export type FraudRiskCategory = 'incentive' | 'opportunity' | 'rationalization';

export interface FraudRiskFactor {
  category: FraudRiskCategory;
  factor: string;
  description: string;
  is_present: boolean;
  severity?: RiskLevel;
  notes?: string;
}

export interface FraudRiskAssessment {
  overall_fraud_risk: RiskLevel;
  fraud_factors: FraudRiskFactor[];
  specific_fraud_risks: string[];
  fraud_procedures_required: boolean;
  notes?: string;
}

// Pre-defined fraud risk factors (Fraud Triangle)
export const FRAUD_RISK_FACTORS: Omit<FraudRiskFactor, 'is_present' | 'severity' | 'notes'>[] = [
  // Incentives/Pressures
  {
    category: 'incentive',
    factor: 'financial_performance_pressure',
    description: 'Management under pressure to meet financial targets or debt covenants'
  },
  {
    category: 'incentive',
    factor: 'compensation_based_on_performance',
    description: 'Significant bonuses or compensation tied to financial results'
  },
  {
    category: 'incentive',
    factor: 'going_concern_issues',
    description: 'Company facing going concern or liquidity issues'
  },
  {
    category: 'incentive',
    factor: 'pending_transaction',
    description: 'Pending merger, acquisition, or financing dependent on financial results'
  },

  // Opportunities
  {
    category: 'opportunity',
    factor: 'weak_internal_controls',
    description: 'Weak or ineffective internal controls over financial reporting'
  },
  {
    category: 'opportunity',
    factor: 'management_override',
    description: 'Management ability to override controls or influence accounting'
  },
  {
    category: 'opportunity',
    factor: 'complex_transactions',
    description: 'Complex or unusual transactions near year-end'
  },
  {
    category: 'opportunity',
    factor: 'related_party_transactions',
    description: 'Significant related party transactions or off-balance sheet entities'
  },

  // Rationalization
  {
    category: 'rationalization',
    factor: 'aggressive_accounting',
    description: 'History of aggressive accounting or pushing boundaries'
  },
  {
    category: 'rationalization',
    factor: 'management_tone',
    description: 'Management tone suggests disregard for controls or compliance'
  },
  {
    category: 'rationalization',
    factor: 'disputes_with_auditors',
    description: 'Frequent disputes with auditors or regulators'
  }
];

// ============================================================================
// IT RISK ASSESSMENT
// ============================================================================

export interface ITSystem {
  system_name: string;
  system_type: 'erp' | 'crm' | 'custom' | 'spreadsheet' | 'other';
  criticality: 'high' | 'medium' | 'low';
  integration_complexity: RiskLevel;
  control_effectiveness: RiskLevel;
  automated_controls: boolean;
  manual_interventions_required: boolean;
}

export interface ITRiskAssessment {
  overall_it_dependency: RiskLevel;
  systems: ITSystem[];
  control_environment_rating: RiskLevel;
  cybersecurity_risk: RiskLevel;
  data_integrity_risk: RiskLevel;
  it_general_controls_tested: boolean;
  notes?: string;
}

// ============================================================================
// QUESTIONNAIRE & RESPONSES
// ============================================================================

export type QuestionCategory = 'business' | 'controls' | 'fraud' | 'it' | 'industry' | 'other';
export type ResponseType = 'boolean' | 'text' | 'numeric' | 'multi_select' | 'single_select';
export type RiskImpact = 'increases_risk' | 'decreases_risk' | 'neutral';

export interface RiskQuestion {
  id: string;
  category: QuestionCategory;
  question_text: string;
  response_type: ResponseType;
  options?: string[]; // For select types
  risk_impact: RiskImpact;
  affects_areas?: string[]; // Which risk areas this impacts
  help_text?: string;
}

export interface RiskAssessmentResponse {
  id: string;
  risk_assessment_id: string;
  question_category: QuestionCategory;
  question_id: string;
  question_text: string;
  response_value?: string;
  response_type: ResponseType;
  risk_impact?: RiskImpact;
  answered_by?: string;
  answered_at: string;
}

// ============================================================================
// RISK ASSESSMENT TEMPLATES
// ============================================================================

export interface RiskAssessmentTemplate {
  id: string;
  firm_id?: string;
  template_name: string;
  template_code: string;
  industry?: string; // null = applies to all industries

  // Template Configuration
  questionnaire: RiskQuestion[];
  default_risk_areas: DefaultRiskArea[];
  risk_matrix_config?: RiskMatrixConfig;

  // Metadata
  is_standard: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DefaultRiskArea {
  name: string;
  category: AreaCategory;
  default_inherent: RiskLevel;
  default_control?: RiskLevel;
}

export interface RiskMatrixConfig {
  matrix?: { [inherent: string]: { [control: string]: RiskLevel } };
  custom_rules?: any;
}

// ============================================================================
// HEAT MAP DATA
// ============================================================================

export interface HeatMapDataPoint {
  area_name: string;
  inherent_risk: RiskLevel;
  control_risk: RiskLevel;
  combined_risk: RiskLevel;
  is_material: boolean;
  materiality_threshold?: number;
}

export interface RiskHeatMapData {
  data_points: HeatMapDataPoint[];
  overall_risk: RiskLevel;
  high_risk_areas: string[];
  low_risk_areas: string[];
}

// ============================================================================
// WIZARD STATE
// ============================================================================

export interface RiskAssessmentWizardState {
  currentStep: number;
  totalSteps: number;

  // Step 1: Business Profile
  businessProfile?: BusinessProfile;

  // Step 2: Risk Areas
  riskAreas: RiskAreaAssessment[];

  // Step 3: Fraud Risk
  fraudRiskAssessment?: FraudRiskAssessment;

  // Step 4: IT Risk
  itRiskAssessment?: ITRiskAssessment;

  // Step 5: Review
  overallRiskRating?: RiskLevel;
  assessmentComplete: boolean;
}

// ============================================================================
// HELPER FUNCTIONS & CONSTANTS
// ============================================================================

export const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'green' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'significant', label: 'Significant', color: 'red' }
];

export const COMPANY_SIZES: { value: CompanySize; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: 'Revenue < $10M' },
  { value: 'medium', label: 'Medium', description: 'Revenue $10M - $100M' },
  { value: 'large', label: 'Large', description: 'Revenue $100M - $1B' },
  { value: 'enterprise', label: 'Enterprise', description: 'Revenue > $1B' }
];

export const INDUSTRIES = [
  'healthcare',
  'financial_services',
  'technology',
  'manufacturing',
  'retail',
  'real_estate',
  'construction',
  'professional_services',
  'nonprofit',
  'government',
  'other'
];

export const INDUSTRY_LABELS: { [key: string]: string } = {
  healthcare: 'Healthcare',
  financial_services: 'Financial Services',
  technology: 'Technology/SaaS',
  manufacturing: 'Manufacturing',
  retail: 'Retail/E-commerce',
  real_estate: 'Real Estate',
  construction: 'Construction',
  professional_services: 'Professional Services',
  nonprofit: 'Non-Profit',
  government: 'Government',
  other: 'Other'
};

// Risk calculation helper
export function calculateCombinedRisk(inherent: RiskLevel, control: RiskLevel): RiskLevel {
  const riskMatrix: { [key in RiskLevel]: { [key in RiskLevel]: RiskLevel } } = {
    low: {
      low: 'low',
      medium: 'medium',
      high: 'high',
      significant: 'high'
    },
    medium: {
      low: 'medium',
      medium: 'medium',
      high: 'high',
      significant: 'significant'
    },
    high: {
      low: 'high',
      medium: 'high',
      high: 'significant',
      significant: 'significant'
    },
    significant: {
      low: 'high',
      medium: 'significant',
      high: 'significant',
      significant: 'significant'
    }
  };

  return riskMatrix[inherent][control];
}

// Overall engagement risk calculation
export function calculateOverallRisk(
  riskAreas: RiskAreaAssessment[],
  fraudRisk: RiskLevel,
  itRisk: RiskLevel
): RiskLevel {
  const materialAreas = riskAreas.filter(a => a.is_material_area);

  if (materialAreas.length === 0) {
    return 'medium'; // Default
  }

  const significantCount = materialAreas.filter(a => a.combined_risk === 'significant').length;
  const highCount = materialAreas.filter(a => a.combined_risk === 'high').length;

  // Fraud risk or significant risks elevate overall risk
  if (fraudRisk === 'significant' || significantCount > 0) {
    return 'significant';
  }

  if (fraudRisk === 'high' || highCount >= 2 || itRisk === 'high') {
    return 'high';
  }

  if (highCount === 1 || itRisk === 'medium') {
    return 'medium';
  }

  return 'low';
}

// Get risk color class for UI
export function getRiskColor(risk: RiskLevel): string {
  const colors = {
    low: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    significant: 'text-red-600 bg-red-50'
  };
  return colors[risk];
}

// Get risk badge variant
export function getRiskBadgeVariant(risk: RiskLevel): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants = {
    low: 'outline' as const,
    medium: 'secondary' as const,
    high: 'default' as const,
    significant: 'destructive' as const
  };
  return variants[risk];
}
