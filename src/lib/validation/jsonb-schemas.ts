/**
 * JSONB schema validation for flexible database fields
 * Addresses ISSUE-044: JSONB columns have no schema validation
 */

import { z } from 'zod';

// =============================================================================
// Engagement Settings Schema
// =============================================================================

export const engagementSettingsSchema = z.object({
  // Audit approach configuration
  audit_approach: z.enum(['substantive', 'controls_reliance', 'mixed']).optional(),
  reporting_framework: z.enum(['us_gaap', 'ifrs', 'tax_basis', 'regulatory', 'other']).optional(),

  // Team configuration
  use_specialists: z.boolean().optional(),
  specialist_areas: z.array(z.string()).optional(),

  // Group audit settings
  group_audit: z.boolean().optional(),
  significant_components: z.array(
    z.object({
      name: z.string(),
      location: z.string().optional(),
      auditor: z.string().optional(),
    })
  ).optional(),

  // Risk thresholds
  materiality_threshold: z.number().positive().optional(),
  performance_materiality_percentage: z.number().min(50).max(90).optional(),

  // Documentation requirements
  documentation_level: z.enum(['standard', 'enhanced', 'minimal']).optional(),
  require_second_partner_review: z.boolean().optional(),

  // Custom fields for firm-specific needs
  custom_fields: z.record(z.string(), z.any()).optional(),
});

// =============================================================================
// Business Profile Schema (Risk Assessment)
// =============================================================================

export const businessProfileSchema = z.object({
  // Financial metrics
  revenue: z.number().positive().optional(),
  total_assets: z.number().positive().optional(),
  total_liabilities: z.number().positive().optional(),
  net_income: z.number().optional(),
  ebitda: z.number().optional(),

  // Operational metrics
  employees: z.number().int().positive().optional(),
  locations: z.array(
    z.object({
      name: z.string(),
      address: z.string().optional(),
      type: z.enum(['headquarters', 'branch', 'warehouse', 'manufacturing', 'retail']).optional(),
      employee_count: z.number().int().positive().optional(),
    })
  ).optional(),

  // Industry and regulatory
  regulatory_environment: z.enum(['low', 'moderate', 'high', 'highly_regulated']).optional(),
  regulatory_bodies: z.array(z.string()).optional(),
  licenses_required: z.array(z.string()).optional(),

  // Complexity indicators
  complexity: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
  complexity_factors: z.array(
    z.enum([
      'multiple_locations',
      'foreign_operations',
      'complex_transactions',
      'related_parties',
      'regulatory_compliance',
      'significant_estimates',
      'it_dependency'
    ])
  ).optional(),

  // Going concern indicators
  going_concern_indicators: z.array(
    z.enum([
      'recurring_losses',
      'negative_cash_flows',
      'loan_defaults',
      'litigation',
      'loss_of_key_customer',
      'loss_of_key_management',
      'labor_difficulties',
      'regulatory_sanctions'
    ])
  ).optional(),

  // Ownership and governance
  ownership_structure: z.enum(['public', 'private', 'family_owned', 'private_equity', 'government']).optional(),
  board_size: z.number().int().positive().optional(),
  audit_committee_exists: z.boolean().optional(),
  internal_audit_function: z.boolean().optional(),
});

// =============================================================================
// Risk Areas Schema
// =============================================================================

export const riskAreasSchema = z.array(
  z.object({
    // Core risk attributes
    area: z.string().min(1),
    account_or_process: z.string().optional(),

    // Risk ratings
    inherent_risk: z.enum(['low', 'moderate', 'high']),
    control_risk: z.enum(['low', 'moderate', 'high']),
    fraud_risk: z.enum(['low', 'moderate', 'high']),
    detection_risk: z.enum(['low', 'moderate', 'high']).optional(),
    combined_risk: z.enum(['low', 'moderate', 'high', 'very_high']),

    // Risk factors
    risk_factors: z.array(z.string()).optional(),

    // Assertions affected
    assertions: z.array(
      z.enum([
        'existence',
        'completeness',
        'valuation',
        'rights',
        'presentation',
        'accuracy',
        'cutoff',
        'classification'
      ])
    ).optional(),

    // Response planning
    planned_response: z.enum(['basic', 'moderate', 'extensive']).optional(),
    key_controls: z.array(z.string()).optional(),
    planned_procedures: z.array(z.string()).optional(),

    // Additional context
    rationale: z.string().optional(),
    prior_year_findings: z.boolean().optional(),
    material_weakness: z.boolean().optional(),
    significant_deficiency: z.boolean().optional(),
  })
);

// =============================================================================
// Fraud Assessment Schema
// =============================================================================

export const fraudAssessmentSchema = z.object({
  // Overall fraud risk assessment
  overall_fraud_risk: z.enum(['low', 'moderate', 'high']).optional(),

  // Fraud triangle factors
  fraud_triangle: z.object({
    pressure_factors: z.array(z.string()).optional(),
    opportunity_factors: z.array(z.string()).optional(),
    rationalization_factors: z.array(z.string()).optional(),
  }).optional(),

  // Specific fraud risks
  fraud_risk_factors: z.array(
    z.object({
      factor: z.string(),
      category: z.enum(['pressure', 'opportunity', 'rationalization']),
      risk_level: z.enum(['low', 'moderate', 'high']),
      mitigation_procedures: z.array(z.string()).optional(),
    })
  ).optional(),

  // Common fraud risk areas
  management_override_risk: z.enum(['low', 'moderate', 'high']).optional(),
  revenue_recognition_risk: z.enum(['low', 'moderate', 'high']).optional(),
  journal_entry_risk: z.enum(['low', 'moderate', 'high']).optional(),
  related_party_risk: z.enum(['low', 'moderate', 'high']).optional(),
  expense_manipulation_risk: z.enum(['low', 'moderate', 'high']).optional(),
  asset_misappropriation_risk: z.enum(['low', 'moderate', 'high']).optional(),

  // Fraud response
  fraud_inquiry_performed: z.boolean().optional(),
  fraud_brainstorming_date: z.string().optional(),
  unpredictable_procedures_planned: z.array(z.string()).optional(),
});

// =============================================================================
// IT Assessment Schema
// =============================================================================

export const itAssessmentSchema = z.object({
  // IT environment
  it_environment_complexity: z.enum(['simple', 'moderate', 'complex', 'highly_complex']).optional(),

  // IT general controls (ITGCs)
  it_general_controls: z.enum(['effective', 'partially_effective', 'ineffective', 'not_tested']).optional(),
  itgc_areas: z.object({
    access_controls: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    change_management: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    operations: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    backup_recovery: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
  }).optional(),

  // Application controls
  application_controls: z.enum(['effective', 'partially_effective', 'ineffective', 'not_tested']).optional(),
  key_applications: z.array(
    z.object({
      name: z.string(),
      purpose: z.string().optional(),
      controls_tested: z.boolean().optional(),
      control_effectiveness: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    })
  ).optional(),

  // IT risks
  cyber_security_risk: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  data_integrity_risk: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  system_availability_risk: z.enum(['low', 'moderate', 'high']).optional(),

  // IT audit approach
  use_it_specialist: z.boolean().optional(),
  it_controls_reliance: z.boolean().optional(),
  data_analytics_planned: z.boolean().optional(),
  caat_tools_used: z.array(z.string()).optional(), // Computer-Assisted Audit Techniques
});

// =============================================================================
// Client Address Schema
// =============================================================================

export const clientAddressSchema = z.object({
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  is_primary: z.boolean().optional(),
  address_type: z.enum(['billing', 'shipping', 'headquarters', 'branch']).optional(),
});

// =============================================================================
// Client Contacts Schema
// =============================================================================

export const clientContactsSchema = z.array(
  z.object({
    name: z.string(),
    title: z.string().optional(),
    department: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    is_primary: z.boolean().optional(),
    role: z.enum(['cfo', 'controller', 'treasurer', 'ceo', 'audit_committee', 'other']).optional(),
    notes: z.string().optional(),
  })
);

// =============================================================================
// Heat Map Data Schema
// =============================================================================

export const heatMapDataSchema = z.array(
  z.object({
    area: z.string(),
    likelihood: z.number().min(1).max(5),
    impact: z.number().min(1).max(5),
    risk_score: z.number().min(1).max(25),
    color: z.enum(['green', 'yellow', 'orange', 'red']),
    controls_in_place: z.boolean().optional(),
    residual_risk: z.number().min(1).max(25).optional(),
  })
);

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Validate JSONB data against a schema
 */
export function validateJSONB<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safely parse JSONB data with defaults
 */
export function parseJSONB<T extends z.ZodType>(
  schema: T,
  data: unknown,
  defaultValue: z.infer<T>
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch {
    return defaultValue;
  }
}

/**
 * Partial validation for JSONB updates (allows partial objects)
 */
export function validateJSONBPartial<T extends z.ZodType>(
  schema: T,
  data: unknown
): Partial<z.infer<T>> {
  const partialSchema = schema.partial();
  return partialSchema.parse(data);
}

/**
 * Merge JSONB data with validation
 */
export function mergeJSONB<T extends z.ZodType>(
  schema: T,
  existing: unknown,
  updates: unknown
): z.infer<T> {
  const currentData = parseJSONB(schema, existing, {} as z.infer<T>);
  const newData = validateJSONBPartial(schema, updates);
  const merged = { ...currentData, ...newData };
  return schema.parse(merged);
}