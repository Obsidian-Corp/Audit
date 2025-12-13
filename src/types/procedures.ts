// Enhanced Procedure Types with Risk Intelligence
// Phase 1: Foundation - Risk-based procedure recommendations

import { RiskLevel } from './risk-assessment';

// ============================================================================
// DYNAMIC PROCEDURE PARAMETERS
// ============================================================================

export interface RiskLevelParameters {
  sample_size: string;
  depth: 'limited' | 'standard' | 'enhanced' | 'extensive';
  estimated_hours: number;
  additional_guidance?: string;
}

export interface DynamicProcedureParameters {
  low_risk?: RiskLevelParameters;
  medium_risk?: RiskLevelParameters;
  high_risk?: RiskLevelParameters;
  significant_risk?: RiskLevelParameters;
}

// ============================================================================
// TRIGGER CONDITIONS
// ============================================================================

export type TriggerConditionType = 'engagement_attribute' | 'risk_score' | 'finding' | 'custom';

export interface TriggerCondition {
  type: TriggerConditionType;
  field?: string; // For engagement_attribute type
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value?: any;
  area?: string; // For risk_score type
  description: string;
}

// ============================================================================
// ENHANCED AUDIT PROCEDURE
// ============================================================================

export interface AuditProcedure {
  id: string;
  firm_id: string;
  procedure_name: string;
  procedure_code: string;
  category: string;
  objective?: string;
  instructions?: any; // Rich text/JSONB
  sample_size_guidance?: string;
  evidence_requirements?: string[];
  expected_outcomes?: string;
  estimated_hours: number;
  risk_level: string;
  control_objectives?: string[];
  procedure_type: 'standard' | 'custom';
  is_active: boolean;

  // Enhanced Risk Intelligence Fields
  applicable_risk_levels?: RiskLevel[];
  applicable_industries?: string[];
  trigger_conditions?: TriggerCondition[];
  risk_area_tags?: string[];
  procedure_rationale?: string;
  dynamic_parameters?: DynamicProcedureParameters;

  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROCEDURE RISK MAPPINGS
// ============================================================================

export interface ProcedureRiskMapping {
  id: string;
  procedure_id: string;

  // Risk Context
  risk_area: string;
  risk_level_required: RiskLevel;

  // Recommendation Logic
  is_recommended: boolean;
  is_required: boolean;
  recommendation_priority: number; // Lower = higher priority

  // Risk-Adjusted Parameters
  sample_size_override?: string;
  estimated_hours_override?: number;
  depth_guidance?: 'limited' | 'standard' | 'enhanced' | 'extensive';

  // Conditional Logic
  conditional_logic?: any;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROCEDURE RECOMMENDATIONS
// ============================================================================

export type RecommendationPriority = 'required' | 'recommended' | 'optional';

export interface ProcedureRecommendation {
  procedure: AuditProcedure;
  recommendation_reason: string;
  is_auto_recommended: boolean;
  risk_areas: string[];
  priority: RecommendationPriority;

  // Risk-adjusted parameters
  adjusted_sample_size?: string;
  adjusted_hours?: number;
  depth_guidance?: string;

  // Additional context
  coverage_percentage?: number;
  is_industry_specific?: boolean;
}

export interface RecommendationContext {
  engagement_id: string;
  risk_assessment_id: string;
  industry: string;
  company_size: string;
  engagement_type: string;
  overall_risk: RiskLevel;
}

export interface RecommendationResult {
  recommendations: ProcedureRecommendation[];
  coverage_analysis: CoverageAnalysis;
  total_estimated_hours: number;
}

export interface CoverageAnalysis {
  areas_covered: string[];
  areas_missing: string[];
  coverage_percentage: number;
  risk_gaps: RiskGap[];
}

export interface RiskGap {
  area_name: string;
  risk_level: RiskLevel;
  reason: string;
  suggested_procedures: string[];
}

// ============================================================================
// PROCEDURE DEPENDENCIES
// ============================================================================

export type DependencyType = 'must_complete' | 'must_start' | 'should_complete' | 'informational';

export interface ProcedureDependency {
  id: string;
  procedure_id: string;
  depends_on_procedure_id: string;
  dependency_type: DependencyType;
  dependency_description?: string;
  created_at: string;
}

// ============================================================================
// ENGAGEMENT PROCEDURES (Enhanced)
// ============================================================================

export type ProcedureStatus = 'not_started' | 'in_progress' | 'in_review' | 'complete' | 'not_applicable';
export type ReviewStatus = 'pending_review' | 'reviewed' | 'approved' | 'requires_revision';

export interface EngagementProcedure {
  id: string;
  engagement_program_id: string;
  procedure_id?: string;
  engagement_id: string;

  // Assignment
  assigned_to?: string;
  assigned_by?: string;

  // Procedure Details (can be customized from template)
  procedure_name: string;
  procedure_code?: string;
  instructions?: any;

  // Time Tracking
  estimated_hours: number;
  actual_hours: number;
  due_date?: string;
  started_at?: string;
  completed_at?: string;

  // Status
  status: ProcedureStatus;
  priority: 'low' | 'medium' | 'high';

  // Dependencies & Sequencing
  dependencies?: string[]; // Array of procedure IDs
  sequence_order?: number;

  // Workpaper & Evidence
  workpaper_id?: string;
  evidence_collected?: string[];
  exceptions_noted?: string;
  conclusion?: string;

  // Review
  review_status: ReviewStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  quality_score?: number; // 1-5

  created_at: string;
  updated_at: string;
}

// ============================================================================
// PROCEDURE EXECUTION WORKSPACE
// ============================================================================

export interface ProcedureStep {
  step_number: number;
  description: string;
  is_complete: boolean;
  notes?: string;
  evidence_attached?: string[];
  completed_by?: string;
  completed_at?: string;
}

export interface ProcedureWorkspace {
  engagement_procedure: EngagementProcedure;
  steps: ProcedureStep[];
  workpaper?: WorkpaperData;
  evidence: EvidenceItem[];
  review_notes: ReviewNote[];
  time_entries: TimeEntry[];
  related_procedures: RelatedProcedure[];
}

export interface WorkpaperData {
  workpaper_id: string;
  template_id?: string;
  template_name?: string;
  workpaper_data: any; // JSONB structure from template
  calculated_fields?: any;
  exceptions?: Exception[];
  tick_marks?: TickMark[];
}

export interface Exception {
  id: string;
  description: string;
  amount?: number;
  resolution?: string;
  is_resolved: boolean;
  created_at: string;
}

export interface TickMark {
  id: string;
  symbol: string;
  description: string;
  locations: string[]; // Where in workpaper it's used
}

export interface EvidenceItem {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description?: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ReviewNote {
  id: string;
  note_text: string;
  note_type: 'comment' | 'question' | 'issue' | 'approval';
  created_by: string;
  created_at: string;
  is_resolved?: boolean;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  hours: number;
  description?: string;
  entry_date: string;
  created_at: string;
}

export interface RelatedProcedure {
  id: string;
  procedure_code: string;
  procedure_name: string;
  relationship: 'prerequisite' | 'follow_up' | 'related';
  status: ProcedureStatus;
}

// ============================================================================
// SIGN-OFF WORKFLOW
// ============================================================================

export interface SignOff {
  role: 'preparer' | 'reviewer' | 'manager' | 'partner';
  user_id?: string;
  user_name?: string;
  signed_date?: string;
  hours_worked?: number;
  status: 'pending' | 'completed' | 'not_required';
  comments?: string;
}

export interface ProcedureSignOffWorkflow {
  procedure_id: string;
  sign_offs: SignOff[];
  current_step: number;
  is_complete: boolean;
}

// ============================================================================
// PROCEDURE EXECUTION HISTORY
// ============================================================================

export type ProcedureEventType =
  | 'created'
  | 'assigned'
  | 'started'
  | 'status_changed'
  | 'hours_updated'
  | 'evidence_added'
  | 'review_requested'
  | 'reviewed'
  | 'completed'
  | 'reopened';

export interface ProcedureExecutionEvent {
  id: string;
  engagement_procedure_id: string;
  event_type: ProcedureEventType;
  event_timestamp: string;
  old_value?: any;
  new_value?: any;
  change_description?: string;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getProcedureStatusColor(status: ProcedureStatus): string {
  const colors = {
    not_started: 'text-gray-600 bg-gray-50',
    in_progress: 'text-blue-600 bg-blue-50',
    in_review: 'text-yellow-600 bg-yellow-50',
    complete: 'text-green-600 bg-green-50',
    not_applicable: 'text-gray-400 bg-gray-50'
  };
  return colors[status];
}

export function getReviewStatusColor(status: ReviewStatus): string {
  const colors = {
    pending_review: 'text-yellow-600 bg-yellow-50',
    reviewed: 'text-blue-600 bg-blue-50',
    approved: 'text-green-600 bg-green-50',
    requires_revision: 'text-red-600 bg-red-50'
  };
  return colors[status];
}

export function calculateProcedureProgress(steps: ProcedureStep[]): number {
  if (steps.length === 0) return 0;
  const completedSteps = steps.filter(s => s.is_complete).length;
  return Math.round((completedSteps / steps.length) * 100);
}

export function getPriorityLabel(priority: RecommendationPriority): string {
  const labels = {
    required: 'Required',
    recommended: 'Recommended',
    optional: 'Optional'
  };
  return labels[priority];
}

export function getPriorityColor(priority: RecommendationPriority): string {
  const colors = {
    required: 'text-red-600 bg-red-50',
    recommended: 'text-blue-600 bg-blue-50',
    optional: 'text-gray-600 bg-gray-50'
  };
  return colors[priority];
}
