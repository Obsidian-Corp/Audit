/**
 * Centralized Zod validation schemas for input validation
 * Addresses BUG-026 and ISSUE-042
 */

import { z } from 'zod';

// =============================================================================
// Base schemas
// =============================================================================

export const uuidSchema = z.string().uuid();
export const firmIdSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const positiveNumberSchema = z.number().positive();
export const percentageSchema = z.number().min(0).max(100);
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const fiscalYearEndSchema = z.string().regex(/^\d{2}-\d{2}$/); // MM-DD format

// =============================================================================
// Domain schemas
// =============================================================================

// Client schema
export const clientSchema = z.object({
  firm_id: firmIdSchema,
  client_name: z.string().min(2).max(100),
  industry: z.string().optional(),
  fiscal_year_end: fiscalYearEndSchema,
  entity_type: z.enum(['corporation', 'partnership', 'llc', 'nonprofit', 'government']),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  risk_rating: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
  website: urlSchema.optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  contacts: z.array(
    z.object({
      name: z.string(),
      title: z.string().optional(),
      email: emailSchema.optional(),
      phone: z.string().optional(),
    })
  ).optional(),
});

// Engagement schema
export const engagementSchema = z.object({
  firm_id: firmIdSchema,
  client_id: uuidSchema,
  engagement_type: z.enum(['audit', 'review', 'compilation', 'tax', 'consulting', 'other']),
  status: z.enum(['planning', 'fieldwork', 'review', 'reporting', 'completed', 'on_hold']),
  fiscal_year_end: dateSchema,
  engagement_letter_signed: z.boolean().optional(),
  budget_hours: positiveNumberSchema.optional(),
  actual_hours: z.number().min(0).optional(),
  team_members: z.array(
    z.object({
      user_id: uuidSchema,
      role: z.enum(['partner', 'manager', 'senior', 'staff']),
      hours_allocated: positiveNumberSchema.optional(),
    })
  ).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

// Materiality calculation schema
export const materialityCalculationSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(), // Will be set from engagement
  benchmark_type: z.enum([
    'total_assets',
    'total_revenue',
    'gross_profit',
    'net_income',
    'total_equity',
    'custom'
  ]),
  benchmark_amount: positiveNumberSchema,
  percentage: z.number().min(0.1).max(10), // 0.1% to 10%
  custom_benchmark_name: z.string().optional(),
}).refine(
  (data) => data.benchmark_type !== 'custom' || data.custom_benchmark_name,
  { message: "Custom benchmark name required when benchmark_type is 'custom'" }
);

// Sampling plan schema
export const samplingPlanSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(),
  procedure_id: uuidSchema.optional(),
  population_size: z.number().int().positive(),
  confidence_level: z.enum(['90', '95', '99']),
  expected_error_rate: percentageSchema,
  tolerable_error_rate: percentageSchema,
  sampling_method: z.enum(['random', 'systematic', 'haphazard', 'judgmental', 'monetary_unit']),
  sample_size: z.number().int().positive().optional(), // Can be calculated
  selection_method: z.string().optional(),
  stratification: z.array(
    z.object({
      name: z.string(),
      range_min: z.number(),
      range_max: z.number(),
      sample_size: z.number().int().positive(),
    })
  ).optional(),
}).refine(
  (data) => data.expected_error_rate < data.tolerable_error_rate,
  { message: "Expected error rate must be less than tolerable error rate" }
);

// Risk assessment schema
export const riskAssessmentSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(),
  assessment_date: dateSchema,
  status: z.enum(['draft', 'in_progress', 'completed', 'approved']),
  business_profile: z.object({
    revenue: positiveNumberSchema.optional(),
    employees: z.number().int().positive().optional(),
    locations: z.array(z.string()).optional(),
    regulatory_environment: z.enum(['low', 'moderate', 'high']).optional(),
    complexity: z.enum(['low', 'moderate', 'high', 'very_high']).optional(),
    going_concern_indicators: z.array(z.string()).optional(),
  }).optional(),
  risk_areas: z.array(
    z.object({
      area: z.string().min(1),
      inherent_risk: z.enum(['low', 'moderate', 'high']),
      control_risk: z.enum(['low', 'moderate', 'high']),
      fraud_risk: z.enum(['low', 'moderate', 'high']),
      combined_risk: z.enum(['low', 'moderate', 'high', 'very_high']),
      rationale: z.string().optional(),
      assertions: z.array(
        z.enum(['existence', 'completeness', 'valuation', 'rights', 'presentation', 'accuracy', 'cutoff'])
      ).optional(),
      planned_procedures: z.array(z.string()).optional(),
    })
  ),
  fraud_assessment: z.object({
    fraud_risk_factors: z.array(z.string()).optional(),
    management_override_risk: z.enum(['low', 'moderate', 'high']).optional(),
    revenue_recognition_risk: z.enum(['low', 'moderate', 'high']).optional(),
    journal_entry_risk: z.enum(['low', 'moderate', 'high']).optional(),
    related_party_risk: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),
  it_assessment: z.object({
    it_general_controls: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    application_controls: z.enum(['effective', 'partially_effective', 'ineffective']).optional(),
    cyber_security_risk: z.enum(['low', 'moderate', 'high']).optional(),
    data_integrity_risk: z.enum(['low', 'moderate', 'high']).optional(),
  }).optional(),
});

// Audit finding schema
export const auditFindingSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(),
  procedure_id: uuidSchema.optional(),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['draft', 'open', 'in_progress', 'resolved', 'closed']),
  category: z.enum([
    'control_deficiency',
    'compliance_violation',
    'financial_misstatement',
    'operational_inefficiency',
    'fraud_indicator',
    'other'
  ]),
  financial_impact: positiveNumberSchema.optional(),
  audit_area: z.string().optional(),
  management_response: z.string().optional(),
  remediation_plan: z.string().optional(),
  target_resolution_date: dateSchema.optional(),
  evidence: z.array(
    z.object({
      document_id: uuidSchema,
      description: z.string().optional(),
    })
  ).optional(),
});

// Audit adjustment schema
export const auditAdjustmentSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(),
  finding_id: uuidSchema.optional(),
  description: z.string().min(5),
  account_name: z.string().min(2),
  debit_amount: z.number().min(0),
  credit_amount: z.number().min(0),
  is_material: z.boolean(),
  is_passed: z.boolean().default(false),
  waived_reason: z.string().optional(),
  effect_on_financial_statements: z.enum([
    'overstatement_assets',
    'understatement_assets',
    'overstatement_liabilities',
    'understatement_liabilities',
    'overstatement_revenue',
    'understatement_revenue',
    'overstatement_expenses',
    'understatement_expenses',
    'other'
  ]).optional(),
}).refine(
  (data) => Math.abs(data.debit_amount - data.credit_amount) < 0.01,
  { message: "Debit and credit amounts must balance" }
);

// Time entry schema
export const timeEntrySchema = z.object({
  firm_id: firmIdSchema.optional(),
  user_id: uuidSchema.optional(), // Will be set from auth
  engagement_id: uuidSchema.optional(),
  client_id: uuidSchema.optional(),
  date: dateSchema,
  hours: z.number().min(0).max(24),
  description: z.string().min(5).max(500),
  billable: z.boolean().default(true),
  rate: positiveNumberSchema.optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'billed']).default('draft'),
  activity_code: z.string().optional(),
});

// Document schema
export const documentSchema = z.object({
  firm_id: firmIdSchema.optional(),
  engagement_id: uuidSchema.optional(),
  procedure_id: uuidSchema.optional(),
  name: z.string().min(1).max(255),
  file_type: z.string(),
  file_size: z.number().int().positive().max(100 * 1024 * 1024), // Max 100MB
  storage_bucket: z.string().optional(),
  storage_path: z.string().optional(),
  category: z.enum(['workpaper', 'evidence', 'report', 'correspondence', 'other']).optional(),
  tags: z.array(z.string()).optional(),
  uploaded_by: uuidSchema.optional(), // Will be set from auth
});

// Review note schema
export const reviewNoteSchema = z.object({
  engagement_id: uuidSchema,
  firm_id: firmIdSchema.optional(),
  procedure_id: uuidSchema.optional(),
  document_id: uuidSchema.optional(),
  note: z.string().min(1),
  note_type: z.enum(['comment', 'question', 'issue', 'action_required']).default('comment'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['open', 'resolved', 'closed']).default('open'),
  assigned_to: uuidSchema.optional(),
  created_by: uuidSchema.optional(), // Will be set from auth
  parent_note_id: uuidSchema.optional(), // For threaded discussions
});

// =============================================================================
// Edge Function Request Schemas
// =============================================================================

// Calculate materiality request
export const calculateMaterialityRequestSchema = z.object({
  engagement_id: uuidSchema,
  benchmark_type: z.enum([
    'total_assets',
    'total_revenue',
    'gross_profit',
    'net_income',
    'total_equity'
  ]),
  benchmark_amount: positiveNumberSchema,
  percentage: z.number().min(0.1).max(10),
});

// Calculate sample size request
export const calculateSampleSizeRequestSchema = z.object({
  engagement_id: uuidSchema,
  population_size: z.number().int().positive(),
  confidence_level: z.enum(['90', '95', '99']),
  expected_error_rate: percentageSchema,
  tolerable_error_rate: percentageSchema,
});

// Global search request
export const globalSearchRequestSchema = z.object({
  query: z.string().min(2).max(100),
  types: z.array(
    z.enum(['clients', 'engagements', 'procedures', 'findings', 'documents'])
  ).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Validate input against a schema and return typed result
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safely validate input with error handling
 */
export function safeValidateInput<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for user-friendly display
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}