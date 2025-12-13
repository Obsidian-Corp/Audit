// Finding Management Types
// Phase 1: Foundation - Cross-reference and linkage system

import { RiskLevel } from './risk-assessment';
import { ProcedureRecommendation } from './procedures';

// ============================================================================
// FINDING TYPES & SEVERITY
// ============================================================================

export type FindingType =
  | 'control_deficiency'
  | 'misstatement'
  | 'exception'
  | 'observation'
  | 'other';

export type SeverityLevel =
  | 'trivial'
  | 'immaterial'
  | 'material'
  | 'significant_deficiency'
  | 'material_weakness';

export type FindingStatus =
  | 'open'
  | 'in_remediation'
  | 'resolved'
  | 'accepted_risk'
  | 'cleared';

export type MaterialityImpact =
  | 'none'
  | 'below_trivial'
  | 'below_performance'
  | 'performance'
  | 'planning';

export type RemediationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'not_applicable';

// ============================================================================
// AUDIT FINDING
// ============================================================================

export interface AuditFinding {
  id: string;
  engagement_id: string;
  engagement_procedure_id?: string;

  // Finding Details
  finding_title: string;
  finding_description: string;
  finding_type: FindingType;
  severity: SeverityLevel;

  // Financial Impact
  quantified_amount?: number;
  materiality_impact: MaterialityImpact;

  // Related Areas
  affected_accounts: string[];
  affected_areas: string[];

  // Management Response
  management_response?: string;
  corrective_action_plan?: string;
  remediation_deadline?: string;
  remediation_status: RemediationStatus;

  // Status Tracking
  status: FindingStatus;
  identified_date: string;
  resolved_date?: string;
  resolution_notes?: string;

  // Follow-up
  requires_follow_up: boolean;
  follow_up_procedures: string[];

  // Workflow
  identified_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;

  created_at: string;
  updated_at: string;
}

// ============================================================================
// FINDING LINKAGES
// ============================================================================

export type LinkageType = 'originated_from' | 'impacts' | 'triggers_follow_up' | 'related';
export type LinkageStatus = 'active' | 'resolved' | 'not_applicable';

export interface FindingProcedureLinkage {
  id: string;
  finding_id: string;
  procedure_id: string;
  engagement_procedure_id?: string;

  // Linkage Details
  linkage_type: LinkageType;
  impact_description?: string;
  requires_expanded_testing: boolean;
  expanded_testing_details?: string;

  // Status
  linkage_status: LinkageStatus;

  // Metadata
  linked_by?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FINDING IMPACT ANALYSIS
// ============================================================================

export interface FindingImpactAnalysis {
  finding: AuditFinding;
  affected_procedures: AffectedProcedure[];
  materiality_assessment: MaterialityAssessment;
  requires_expanded_testing: boolean;
  recommended_follow_up: ProcedureRecommendation[];
  related_findings: AuditFinding[];
}

export interface AffectedProcedure {
  procedure_id: string;
  procedure_code: string;
  procedure_name: string;
  impact_reason: string;
  requires_expansion: boolean;
  current_status?: string;
}

export interface MaterialityAssessment {
  materiality_impact: MaterialityImpact;
  quantified_amount?: number;
  planning_materiality?: number;
  performance_materiality?: number;
  trivial_threshold?: number;
  exceeds_planning: boolean;
  exceeds_performance: boolean;
  exceeds_trivial: boolean;
  impact_description: string;
}

// ============================================================================
// FINDING EVIDENCE
// ============================================================================

export type EvidenceType =
  | 'document'
  | 'screenshot'
  | 'calculation'
  | 'confirmation'
  | 'communication'
  | 'other';

export interface FindingEvidence {
  id: string;
  finding_id: string;
  evidence_type: EvidenceType;
  evidence_description: string;
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  uploaded_by?: string;
  created_at: string;
}

// ============================================================================
// FINDING COMMENTS
// ============================================================================

export type CommentType = 'general' | 'question' | 'resolution' | 'escalation';

export interface FindingComment {
  id: string;
  finding_id: string;
  comment_text: string;
  comment_type: CommentType;
  parent_comment_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;

  // Populated from joins
  author_name?: string;
  replies?: FindingComment[];
}

// ============================================================================
// FINDING STATISTICS
// ============================================================================

export interface FindingStatistics {
  total_findings: number;
  open_findings: number;
  material_findings: number;
  control_deficiencies: number;
  avg_resolution_days?: number;
  findings_by_severity: { [key in SeverityLevel]?: number };
  findings_by_type: { [key in FindingType]?: number };
  findings_by_area: { [area: string]: number };
}

// ============================================================================
// FINDING DASHBOARD DATA
// ============================================================================

export interface FindingDashboardData {
  statistics: FindingStatistics;
  recent_findings: AuditFinding[];
  high_priority_findings: AuditFinding[];
  findings_by_area: AreaFindingSummary[];
  materiality_impact_chart: MaterialityImpactData[];
  resolution_timeline: ResolutionTimelineData[];
}

export interface AreaFindingSummary {
  area_name: string;
  total_findings: number;
  open_findings: number;
  material_findings: number;
  average_severity: number; // 1-5 scale
}

export interface MaterialityImpactData {
  impact_level: MaterialityImpact;
  count: number;
  total_amount: number;
}

export interface ResolutionTimelineData {
  date: string;
  identified: number;
  resolved: number;
  cumulative_open: number;
}

// ============================================================================
// FINDING FORM DATA
// ============================================================================

export interface FindingFormData {
  finding_title: string;
  finding_description: string;
  finding_type: FindingType;
  severity: SeverityLevel;
  quantified_amount?: number;
  affected_accounts: string[];
  affected_areas: string[];
  management_response?: string;
  corrective_action_plan?: string;
  remediation_deadline?: string;
  requires_follow_up: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSeverityColor(severity: SeverityLevel): string {
  const colors = {
    trivial: 'text-gray-600 bg-gray-50',
    immaterial: 'text-blue-600 bg-blue-50',
    material: 'text-orange-600 bg-orange-50',
    significant_deficiency: 'text-red-600 bg-red-50',
    material_weakness: 'text-red-800 bg-red-100'
  };
  return colors[severity];
}

export function getSeverityLabel(severity: SeverityLevel): string {
  const labels = {
    trivial: 'Trivial',
    immaterial: 'Immaterial',
    material: 'Material',
    significant_deficiency: 'Significant Deficiency',
    material_weakness: 'Material Weakness'
  };
  return labels[severity];
}

export function getFindingTypeLabel(type: FindingType): string {
  const labels = {
    control_deficiency: 'Control Deficiency',
    misstatement: 'Misstatement',
    exception: 'Exception',
    observation: 'Observation',
    other: 'Other'
  };
  return labels[type];
}

export function getFindingStatusColor(status: FindingStatus): string {
  const colors = {
    open: 'text-red-600 bg-red-50',
    in_remediation: 'text-yellow-600 bg-yellow-50',
    resolved: 'text-green-600 bg-green-50',
    accepted_risk: 'text-blue-600 bg-blue-50',
    cleared: 'text-gray-600 bg-gray-50'
  };
  return colors[status];
}

export function getMaterialityImpactColor(impact: MaterialityImpact): string {
  const colors = {
    none: 'text-gray-600 bg-gray-50',
    below_trivial: 'text-green-600 bg-green-50',
    below_performance: 'text-blue-600 bg-blue-50',
    performance: 'text-orange-600 bg-orange-50',
    planning: 'text-red-600 bg-red-50'
  };
  return colors[impact];
}

export function assessMaterialityImpact(
  amount: number | undefined,
  planningMateriality: number,
  performanceMateriality: number,
  trivialThreshold: number
): MaterialityImpact {
  if (!amount || amount === 0) {
    return 'none';
  }

  if (amount >= planningMateriality) {
    return 'planning';
  }

  if (amount >= performanceMateriality) {
    return 'performance';
  }

  if (amount >= trivialThreshold) {
    return 'below_performance';
  }

  return 'below_trivial';
}

export function calculateSeverityScore(severity: SeverityLevel): number {
  const scores = {
    trivial: 1,
    immaterial: 2,
    material: 3,
    significant_deficiency: 4,
    material_weakness: 5
  };
  return scores[severity];
}

export function sortFindingsBySeverity(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => {
    const scoreA = calculateSeverityScore(a.severity);
    const scoreB = calculateSeverityScore(b.severity);
    return scoreB - scoreA; // Descending (most severe first)
  });
}

export function groupFindingsByArea(findings: AuditFinding[]): Map<string, AuditFinding[]> {
  const grouped = new Map<string, AuditFinding[]>();

  findings.forEach(finding => {
    finding.affected_areas.forEach(area => {
      if (!grouped.has(area)) {
        grouped.set(area, []);
      }
      grouped.get(area)!.push(finding);
    });
  });

  return grouped;
}
