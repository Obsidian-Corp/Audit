// Professional Standards Types
// Comprehensive types for all Phase 1-5 database tables
// Standards: PCAOB AS, AU-C, ISA, ISQM, COSO

// ============================================================================
// PHASE 1: WORKFLOW & DOCUMENTATION INTEGRITY
// ============================================================================

// Procedure Status for state machine
export type ProcedureStatusEnum =
  | 'not_started'
  | 'in_progress'
  | 'pending_evidence'
  | 'pending_review'
  | 'in_review'
  | 'review_notes'
  | 'complete'
  | 'signed_off'
  | 'not_applicable';

// Sign-off role hierarchy
export type SignoffRole = 'preparer' | 'reviewer' | 'senior_reviewer' | 'manager' | 'partner';

// Workpaper version
export interface WorkpaperVersion {
  id: string;
  workpaper_id: string;
  version_number: number;
  content_hash: string;
  content_snapshot: any; // JSONB
  change_summary?: string;
  created_by?: string;
  created_at: string;
  is_current: boolean;
  previous_version_id?: string;
}

// Sign-off record with content integrity
export interface SignoffRecord {
  id: string;
  firm_id: string;
  engagement_id: string;
  workpaper_id?: string;
  procedure_id?: string;
  signoff_type: 'workpaper' | 'procedure' | 'section' | 'engagement';
  signoff_role: SignoffRole;
  signed_by: string;
  signed_at: string;
  content_hash_at_signoff: string;
  is_valid: boolean;
  invalidated_at?: string;
  invalidated_reason?: string;
  comments?: string;
  hours_spent?: number;
  created_at: string;
}

// Tick mark definition
export interface TickMarkDefinition {
  id: string;
  firm_id: string;
  symbol: string;
  description: string;
  meaning: string;
  category?: string;
  color?: string;
  is_system_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tick mark usage
export interface TickMarkUsage {
  id: string;
  tick_mark_id: string;
  workpaper_id: string;
  location_reference: string;
  cell_reference?: string;
  applied_by?: string;
  applied_at: string;
  notes?: string;
}

// Workpaper cross-reference
export type CrossReferenceType = 'supports' | 'supported_by' | 'relates_to' | 'contradicts' | 'supersedes';

export interface WorkpaperCrossReference {
  id: string;
  firm_id: string;
  source_workpaper_id: string;
  target_workpaper_id: string;
  reference_type: CrossReferenceType;
  reference_description?: string;
  source_location?: string;
  target_location?: string;
  created_by?: string;
  created_at: string;
  is_active: boolean;
}

// Evidence access log (chain of custody)
export type EvidenceAccessType = 'view' | 'download' | 'print' | 'export' | 'share';

export interface EvidenceAccessLog {
  id: string;
  evidence_id: string;
  engagement_id: string;
  accessed_by: string;
  access_type: EvidenceAccessType;
  access_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  access_reason?: string;
}

// Procedure status transition (state machine rules)
export interface ProcedureStatusTransition {
  id: string;
  from_status: ProcedureStatusEnum;
  to_status: ProcedureStatusEnum;
  required_role?: SignoffRole;
  requires_evidence: boolean;
  requires_conclusion: boolean;
  requires_review: boolean;
  requires_signoff: boolean;
  transition_description?: string;
  is_active: boolean;
}

// Procedure status history
export interface ProcedureStatusHistory {
  id: string;
  procedure_id: string;
  engagement_id: string;
  from_status?: ProcedureStatusEnum;
  to_status: ProcedureStatusEnum;
  changed_by?: string;
  changed_at: string;
  change_reason?: string;
  content_hash_at_change?: string;
}

// Immutable audit log
export type AuditLogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'signoff'
  | 'status_change'
  | 'access'
  | 'export'
  | 'archive';

export interface ImmutableAuditLog {
  id: string;
  firm_id: string;
  engagement_id?: string;
  table_name: string;
  record_id: string;
  action: AuditLogAction;
  old_values?: any;
  new_values?: any;
  performed_by?: string;
  performed_at: string;
  ip_address?: string;
  user_agent?: string;
  entry_hash: string;
  previous_entry_hash?: string;
}

// ============================================================================
// PHASE 2: INDEPENDENCE & ENGAGEMENT ACCEPTANCE
// ============================================================================

// Independence declaration
export type IndependenceStatus = 'confirmed' | 'potential_issue' | 'issue_identified' | 'waiver_granted';

export interface IndependenceDeclaration {
  id: string;
  firm_id: string;
  user_id: string;
  engagement_id?: string;
  declaration_date: string;
  period_start: string;
  period_end: string;
  is_independent: boolean;
  independence_status: IndependenceStatus;
  financial_interests_disclosed: boolean;
  financial_interests_details?: string;
  family_relationships_disclosed: boolean;
  family_relationships_details?: string;
  business_relationships_disclosed: boolean;
  business_relationships_details?: string;
  non_audit_services_disclosed: boolean;
  non_audit_services_details?: string;
  other_matters_disclosed: boolean;
  other_matters_details?: string;
  safeguards_applied?: string;
  declaration_text: string;
  electronic_signature: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

// Conflict of interest
export type ConflictStatus = 'identified' | 'under_review' | 'resolved' | 'waived' | 'unresolved';
export type ConflictType =
  | 'financial_interest'
  | 'family_relationship'
  | 'business_relationship'
  | 'prior_employment'
  | 'non_audit_service'
  | 'other';

export interface ConflictOfInterestRegister {
  id: string;
  firm_id: string;
  engagement_id?: string;
  client_id?: string;
  reported_by: string;
  reported_date: string;
  conflict_type: ConflictType;
  description: string;
  parties_involved: any; // JSONB
  potential_impact?: string;
  status: ConflictStatus;
  resolution_description?: string;
  resolution_date?: string;
  resolved_by?: string;
  safeguards_implemented?: string;
  documentation_path?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Client risk assessment
export type ClientRiskLevel = 'low' | 'moderate' | 'high' | 'unacceptable';
export type AssessmentStatus = 'draft' | 'in_review' | 'approved' | 'declined';

export interface ClientRiskAssessment {
  id: string;
  firm_id: string;
  client_id: string;
  assessment_date: string;
  assessment_type: 'initial' | 'annual' | 'triggered';
  assessor_id?: string;
  integrity_of_management: ClientRiskLevel;
  integrity_notes?: string;
  financial_stability: ClientRiskLevel;
  financial_stability_notes?: string;
  industry_risk: ClientRiskLevel;
  industry_risk_notes?: string;
  regulatory_environment: ClientRiskLevel;
  regulatory_notes?: string;
  litigation_history: ClientRiskLevel;
  litigation_notes?: string;
  prior_auditor_issues: ClientRiskLevel;
  prior_auditor_notes?: string;
  related_party_complexity: ClientRiskLevel;
  related_party_notes?: string;
  overall_risk_level: ClientRiskLevel;
  risk_factors: any; // JSONB
  mitigating_factors?: string;
  recommendation: 'accept' | 'accept_with_conditions' | 'decline' | 'withdraw';
  conditions?: string;
  status: AssessmentStatus;
  approved_by?: string;
  approved_at?: string;
  decline_reason?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

// Engagement letter
export type EngagementLetterStatus = 'draft' | 'sent' | 'pending_signature' | 'signed' | 'expired' | 'superseded';

export interface EngagementLetter {
  id: string;
  firm_id: string;
  engagement_id: string;
  client_id: string;
  letter_date: string;
  effective_date: string;
  expiration_date?: string;
  engagement_type: string;
  scope_description: string;
  services_to_be_provided: any; // JSONB
  management_responsibilities: string;
  auditor_responsibilities: string;
  fee_arrangement: any; // JSONB
  billing_terms?: string;
  reporting_deadlines: any; // JSONB
  special_terms?: string;
  limitations?: string;
  status: EngagementLetterStatus;
  client_signatory_name?: string;
  client_signatory_title?: string;
  client_signed_date?: string;
  firm_signatory_id?: string;
  firm_signed_date?: string;
  document_storage_path?: string;
  document_hash?: string;
  supersedes_letter_id?: string;
  superseded_by_letter_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Predecessor communications
export type PredecessorCommunicationType =
  | 'inquiry_letter'
  | 'response_letter'
  | 'workpaper_review'
  | 'meeting_notes'
  | 'other';

export interface PredecessorCommunication {
  id: string;
  firm_id: string;
  engagement_id: string;
  client_id: string;
  predecessor_firm_name: string;
  predecessor_contact_name?: string;
  predecessor_contact_email?: string;
  communication_type: PredecessorCommunicationType;
  communication_date: string;
  initiated_by?: string;
  inquiry_topics: any; // JSONB
  response_received: boolean;
  response_date?: string;
  response_summary?: string;
  disagreements_noted: boolean;
  disagreement_details?: string;
  restrictions_on_review: boolean;
  restriction_details?: string;
  matters_affecting_acceptance: boolean;
  matters_details?: string;
  workpapers_reviewed: boolean;
  workpapers_reviewed_list?: string[];
  document_storage_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// AML/KYC records
export type AMLRiskLevel = 'low' | 'medium' | 'high';
export type AMLStatus = 'pending' | 'in_progress' | 'complete' | 'failed' | 'requires_update';

export interface ClientAMLRecord {
  id: string;
  firm_id: string;
  client_id: string;
  assessment_date: string;
  assessed_by?: string;
  beneficial_owners: any; // JSONB
  ownership_structure?: string;
  source_of_funds?: string;
  nature_of_business?: string;
  geographic_risk: AMLRiskLevel;
  geographic_risk_factors?: string;
  industry_risk: AMLRiskLevel;
  industry_risk_factors?: string;
  client_risk: AMLRiskLevel;
  client_risk_factors?: string;
  overall_aml_risk: AMLRiskLevel;
  pep_check_completed: boolean;
  pep_check_date?: string;
  pep_identified: boolean;
  pep_details?: string;
  sanctions_check_completed: boolean;
  sanctions_check_date?: string;
  sanctions_hit: boolean;
  sanctions_details?: string;
  adverse_media_check: boolean;
  adverse_media_date?: string;
  adverse_media_findings?: string;
  enhanced_due_diligence_required: boolean;
  edd_details?: string;
  status: AMLStatus;
  next_review_date?: string;
  documentation_path?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Engagement acceptance checklist
export type AcceptanceChecklistStatus = 'not_started' | 'in_progress' | 'complete' | 'blocked';

export interface EngagementAcceptanceChecklist {
  id: string;
  firm_id: string;
  engagement_id: string;
  client_id: string;
  status: AcceptanceChecklistStatus;
  client_risk_assessment_complete: boolean;
  client_risk_assessment_id?: string;
  independence_confirmed: boolean;
  independence_declaration_ids?: string[];
  conflicts_cleared: boolean;
  conflict_register_ids?: string[];
  predecessor_communication_complete: boolean;
  predecessor_communication_id?: string;
  aml_kyc_complete: boolean;
  aml_record_id?: string;
  engagement_letter_signed: boolean;
  engagement_letter_id?: string;
  resources_available: boolean;
  resource_notes?: string;
  competence_confirmed: boolean;
  competence_notes?: string;
  fee_agreed: boolean;
  fee_notes?: string;
  partner_approval: boolean;
  partner_approval_by?: string;
  partner_approval_at?: string;
  partner_approval_notes?: string;
  ethics_partner_consultation: boolean;
  ethics_consultation_notes?: string;
  risk_management_approval: boolean;
  risk_management_by?: string;
  risk_management_at?: string;
  overall_decision: 'accept' | 'accept_with_conditions' | 'decline' | 'pending';
  decision_date?: string;
  decision_by?: string;
  conditions?: string;
  decline_reason?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PHASE 3: INTERNAL CONTROLS, EQCR, GOING CONCERN, RELATED PARTIES
// ============================================================================

// COSO control component
export type COSOComponent =
  | 'control_environment'
  | 'risk_assessment'
  | 'control_activities'
  | 'information_communication'
  | 'monitoring';

// Control type
export type ControlType = 'preventive' | 'detective' | 'corrective';
export type ControlFrequency = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'ad_hoc';
export type ControlNature = 'manual' | 'automated' | 'it_dependent_manual';
export type ControlAssertionLevel = 'entity_level' | 'transaction_level' | 'it_general';
export type DesignEffectiveness = 'effective' | 'effective_with_issues' | 'not_effective' | 'not_evaluated';
export type OperatingEffectiveness = 'effective' | 'deviation_noted' | 'not_effective' | 'not_tested';

export interface InternalControl {
  id: string;
  firm_id: string;
  engagement_id: string;
  control_id_code: string;
  control_name: string;
  control_description: string;
  control_objective?: string;
  coso_component: COSOComponent;
  control_type: ControlType;
  frequency: ControlFrequency;
  control_nature: ControlNature;
  assertion_level: ControlAssertionLevel;
  related_assertions: string[];
  related_accounts?: string[];
  related_disclosures?: string[];
  process_area?: string;
  sub_process?: string;
  control_owner?: string;
  control_performer?: string;
  it_application?: string;
  key_control: boolean;
  compensating_control: boolean;
  compensating_for_control_id?: string;
  design_effectiveness: DesignEffectiveness;
  design_evaluated_by?: string;
  design_evaluated_at?: string;
  design_evaluation_notes?: string;
  operating_effectiveness: OperatingEffectiveness;
  operating_tested_by?: string;
  operating_tested_at?: string;
  operating_test_notes?: string;
  test_sample_size?: number;
  deviations_found?: number;
  deviation_rate?: number;
  management_review_control: boolean;
  precision_level?: string;
  status: 'identified' | 'documented' | 'tested' | 'concluded';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Control walkthrough
export interface ControlWalkthrough {
  id: string;
  firm_id: string;
  control_id: string;
  engagement_id: string;
  walkthrough_date: string;
  performed_by?: string;
  walkthrough_description: string;
  personnel_interviewed: any; // JSONB
  documents_inspected: any; // JSONB
  systems_observed?: string[];
  transaction_selected?: string;
  transaction_details?: any; // JSONB
  initiation_point_verified: boolean;
  initiation_notes?: string;
  authorization_verified: boolean;
  authorization_notes?: string;
  processing_verified: boolean;
  processing_notes?: string;
  recording_verified: boolean;
  recording_notes?: string;
  reporting_verified: boolean;
  reporting_notes?: string;
  control_performed_as_designed: boolean;
  exceptions_noted?: string;
  it_controls_relevant: boolean;
  it_controls_notes?: string;
  segregation_of_duties_adequate: boolean;
  sod_notes?: string;
  conclusion: 'design_effective' | 'design_issue' | 'further_work_needed';
  conclusion_notes?: string;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Control test result
export type TestingApproach = 'inquiry' | 'observation' | 'inspection' | 'reperformance' | 'combination';

export interface ControlTestResult {
  id: string;
  firm_id: string;
  control_id: string;
  engagement_id: string;
  test_date: string;
  tested_by?: string;
  testing_approach: TestingApproach;
  testing_period_start: string;
  testing_period_end: string;
  population_size?: number;
  sample_size: number;
  sample_selection_method: 'random' | 'haphazard' | 'systematic' | 'judgmental' | 'block';
  items_tested: any; // JSONB
  test_procedures_performed: string;
  deviations_found: number;
  deviation_details?: any; // JSONB
  deviation_rate?: number;
  tolerable_deviation_rate?: number;
  root_cause_analysis?: string;
  is_systemic_deviation: boolean;
  operating_effectiveness: OperatingEffectiveness;
  conclusion: string;
  impact_on_audit_approach?: string;
  compensating_controls_tested?: boolean;
  compensating_controls_effective?: boolean;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Control deficiency
export type DeficiencyClassification = 'deficiency' | 'significant_deficiency' | 'material_weakness';

export interface ControlDeficiency {
  id: string;
  firm_id: string;
  engagement_id: string;
  control_id?: string;
  deficiency_title: string;
  deficiency_description: string;
  identified_date: string;
  identified_by?: string;
  deficiency_type: 'design' | 'operating' | 'both';
  affected_assertions: string[];
  affected_accounts?: string[];
  affected_financial_statement_areas?: string[];
  likelihood_of_misstatement: 'remote' | 'reasonably_possible' | 'probable';
  magnitude_of_misstatement: 'inconsequential' | 'more_than_inconsequential' | 'material';
  classification: DeficiencyClassification;
  classification_rationale: string;
  compensating_controls_exist: boolean;
  compensating_controls_description?: string;
  compensating_controls_effective: boolean;
  root_cause?: string;
  management_response?: string;
  remediation_plan?: string;
  remediation_deadline?: string;
  remediation_status: 'not_started' | 'in_progress' | 'completed' | 'not_remediated';
  communicate_to_management: boolean;
  communicated_to_management_date?: string;
  communicate_to_tcwg: boolean;
  communicated_to_tcwg_date?: string;
  prior_year_deficiency: boolean;
  prior_year_deficiency_id?: string;
  status: 'open' | 'remediated' | 'closed' | 'accepted';
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// EQCR Review
export type EQCRStatus = 'not_started' | 'in_progress' | 'issues_identified' | 'issues_resolved' | 'complete';

export interface EQCRReview {
  id: string;
  firm_id: string;
  engagement_id: string;
  eqcr_partner_id: string;
  review_start_date: string;
  review_completion_date?: string;
  status: EQCRStatus;
  independence_verified: boolean;
  independence_notes?: string;
  significant_risks_reviewed: boolean;
  significant_risks_notes?: string;
  significant_judgments_reviewed: boolean;
  significant_judgments_notes?: string;
  consultation_reviewed: boolean;
  consultation_notes?: string;
  financial_statements_reviewed: boolean;
  financial_statements_notes?: string;
  report_reviewed: boolean;
  report_notes?: string;
  documentation_adequate: boolean;
  documentation_notes?: string;
  issues_identified: any; // JSONB
  issues_resolved: boolean;
  resolution_summary?: string;
  overall_conclusion?: string;
  concurring_approval: boolean;
  concurring_approval_date?: string;
  concurring_approval_notes?: string;
  hours_spent?: number;
  created_at: string;
  updated_at: string;
}

// Consultation record
export type ConsultationType =
  | 'accounting'
  | 'auditing'
  | 'independence'
  | 'ethics'
  | 'regulatory'
  | 'industry_specific'
  | 'other';

export interface ConsultationRecord {
  id: string;
  firm_id: string;
  engagement_id: string;
  consultation_date: string;
  consultation_type: ConsultationType;
  consulted_with: string;
  consulted_with_title?: string;
  is_external_consultation: boolean;
  external_firm_name?: string;
  matter_description: string;
  relevant_facts: string;
  relevant_standards?: string[];
  alternatives_considered?: string;
  conclusion_reached: string;
  rationale_for_conclusion: string;
  documentation_of_consultation?: string;
  follow_up_required: boolean;
  follow_up_description?: string;
  follow_up_completed: boolean;
  follow_up_completed_date?: string;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  workpaper_reference?: string;
  created_at: string;
  updated_at: string;
}

// Going concern assessment
export type GoingConcernConclusion =
  | 'no_substantial_doubt'
  | 'substantial_doubt_mitigated'
  | 'substantial_doubt_unmitigated'
  | 'going_concern_issue';

export interface GoingConcernAssessment {
  id: string;
  firm_id: string;
  engagement_id: string;
  assessment_date: string;
  assessed_by?: string;
  assessment_period_months: number;
  negative_financial_trends: boolean;
  negative_financial_details?: string;
  internal_matters_indicators: boolean;
  internal_matters_details?: string;
  external_matters_indicators: boolean;
  external_matters_details?: string;
  conditions_events_identified: any; // JSONB
  management_plans_obtained: boolean;
  management_plans_description?: string;
  management_plans_feasible: boolean;
  management_plans_evaluation?: string;
  additional_procedures_performed?: string;
  mitigating_factors?: string;
  conclusion: GoingConcernConclusion;
  conclusion_rationale: string;
  substantial_doubt_exists: boolean;
  disclosure_adequate: boolean;
  disclosure_notes?: string;
  report_modification_required: boolean;
  modification_type?: 'emphasis_of_matter' | 'going_concern_paragraph' | 'qualified' | 'adverse';
  management_representations_obtained: boolean;
  subsequent_events_considered: boolean;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Related party
export type RelatedPartyType =
  | 'parent_company'
  | 'subsidiary'
  | 'affiliate'
  | 'joint_venture'
  | 'key_management'
  | 'close_family'
  | 'entity_with_common_key_management'
  | 'significant_investor'
  | 'post_employment_benefit_plan'
  | 'other';

export interface RelatedParty {
  id: string;
  firm_id: string;
  engagement_id: string;
  party_name: string;
  party_type: RelatedPartyType;
  relationship_description: string;
  relationship_nature?: string;
  ownership_percentage?: number;
  common_ownership?: boolean;
  common_management?: boolean;
  economic_dependence?: boolean;
  identified_date: string;
  identified_by?: string;
  identification_source: 'management' | 'inquiry' | 'analytical' | 'external' | 'prior_year' | 'other';
  management_disclosed: boolean;
  previously_undisclosed: boolean;
  transactions_exist: boolean;
  controls_over_rpt: boolean;
  controls_description?: string;
  arm_length_terms: boolean;
  arm_length_evaluation?: string;
  business_rationale_understood: boolean;
  business_rationale?: string;
  fraud_risk_indicator: boolean;
  fraud_risk_description?: string;
  disclosure_complete: boolean;
  disclosure_notes?: string;
  status: 'identified' | 'evaluated' | 'concluded';
  workpaper_reference?: string;
  created_at: string;
  updated_at: string;
}

// Related party transaction
export interface RelatedPartyTransaction {
  id: string;
  firm_id: string;
  related_party_id: string;
  engagement_id: string;
  transaction_date: string;
  transaction_type: string;
  transaction_description: string;
  amount: number;
  currency: string;
  is_material: boolean;
  outside_normal_business: boolean;
  business_rationale?: string;
  terms_and_conditions?: string;
  arm_length_comparison?: string;
  is_arm_length: boolean;
  authorization_obtained: boolean;
  authorization_details?: string;
  board_approval_required: boolean;
  board_approved: boolean;
  board_approval_date?: string;
  disclosure_required: boolean;
  properly_disclosed: boolean;
  disclosure_reference?: string;
  procedures_performed?: string;
  conclusion?: string;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PHASE 4: SPECIALISTS, GROUP AUDITS, ESTIMATES, LITIGATION
// ============================================================================

// Specialist engagement
export type SpecialistType =
  | 'valuation'
  | 'actuarial'
  | 'tax'
  | 'legal'
  | 'it'
  | 'environmental'
  | 'engineering'
  | 'other';

export type SpecialistRelationship = 'auditor_specialist' | 'management_specialist' | 'external_expert';

export interface SpecialistEngagement {
  id: string;
  firm_id: string;
  engagement_id: string;
  specialist_name: string;
  specialist_firm?: string;
  specialist_type: SpecialistType;
  relationship_type: SpecialistRelationship;
  area_of_expertise: string;
  competence_evaluated: boolean;
  competence_evaluation_date?: string;
  competence_evaluation_notes?: string;
  capabilities_appropriate: boolean;
  objectivity_evaluated: boolean;
  objectivity_evaluation_notes?: string;
  objectivity_threats_identified?: string;
  safeguards_applied?: string;
  scope_of_work: string;
  work_to_be_performed?: string;
  deliverables_expected?: string;
  engagement_date: string;
  expected_completion_date?: string;
  actual_completion_date?: string;
  fee_arrangement?: string;
  fee_amount?: number;
  report_received: boolean;
  report_date?: string;
  report_storage_path?: string;
  findings_summary?: string;
  assumptions_reviewed: boolean;
  assumptions_appropriate: boolean;
  assumptions_notes?: string;
  methods_reviewed: boolean;
  methods_appropriate: boolean;
  methods_notes?: string;
  data_reviewed: boolean;
  data_appropriate: boolean;
  data_notes?: string;
  work_adequate_for_purposes: boolean;
  adequacy_notes?: string;
  conclusions_consistent: boolean;
  consistency_notes?: string;
  reference_in_report: boolean;
  reference_type?: 'not_referenced' | 'referenced' | 'referenced_with_modification';
  status: 'planned' | 'engaged' | 'in_progress' | 'complete' | 'report_evaluated';
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Group audit component
export type ComponentType = 'significant' | 'not_significant_but_material' | 'not_significant';
export type ComponentWorkType = 'full_scope' | 'specified_procedures' | 'analytical_only' | 'none';
export type ComponentAuditorType = 'group_team' | 'network_firm' | 'non_network_firm';

export interface GroupAuditComponent {
  id: string;
  firm_id: string;
  engagement_id: string;
  component_name: string;
  component_location?: string;
  component_type: ComponentType;
  financial_significance_percentage?: number;
  risk_significance?: string;
  component_auditor_type: ComponentAuditorType;
  component_auditor_firm?: string;
  component_auditor_contact?: string;
  component_auditor_email?: string;
  work_type: ComponentWorkType;
  work_scope_description?: string;
  competence_evaluated: boolean;
  competence_evaluation_date?: string;
  competence_notes?: string;
  independence_confirmed: boolean;
  independence_confirmation_date?: string;
  independence_notes?: string;
  ethical_requirements_met: boolean;
  understanding_of_component?: string;
  significant_risks_at_component?: string[];
  instructions_sent: boolean;
  instructions_sent_date?: string;
  instructions_id?: string;
  reporting_deadline?: string;
  report_received: boolean;
  report_received_date?: string;
  matters_to_communicate?: string;
  work_reviewed: boolean;
  work_review_date?: string;
  work_review_notes?: string;
  additional_procedures_required: boolean;
  additional_procedures_description?: string;
  sufficient_appropriate_evidence: boolean;
  conclusion?: string;
  status: 'planning' | 'instructions_sent' | 'in_progress' | 'work_received' | 'reviewed' | 'concluded';
  workpaper_reference?: string;
  created_at: string;
  updated_at: string;
}

// Group instructions
export interface GroupInstructions {
  id: string;
  firm_id: string;
  engagement_id: string;
  component_id: string;
  instruction_date: string;
  issued_by?: string;
  instruction_version: number;
  group_materiality?: number;
  component_materiality?: number;
  clearly_trivial_threshold?: number;
  significant_risks_to_address: any; // JSONB
  procedures_to_perform: any; // JSONB
  reporting_requirements: any; // JSONB
  reporting_deadline: string;
  communication_requirements?: string;
  fraud_considerations?: string;
  related_party_considerations?: string;
  going_concern_considerations?: string;
  subsequent_events_requirements?: string;
  access_to_workpapers_required: boolean;
  meetings_required: boolean;
  specific_instructions?: string;
  acknowledgment_received: boolean;
  acknowledgment_date?: string;
  acknowledgment_by?: string;
  questions_raised?: string;
  clarifications_provided?: string;
  document_storage_path?: string;
  created_at: string;
  updated_at: string;
}

// Accounting estimate
export type EstimateComplexity = 'simple' | 'moderate' | 'complex';

export interface AccountingEstimate {
  id: string;
  firm_id: string;
  engagement_id: string;
  estimate_name: string;
  estimate_description: string;
  financial_statement_line_item: string;
  amount_recorded: number;
  estimation_method?: string;
  complexity: EstimateComplexity;
  degree_of_estimation_uncertainty: 'low' | 'moderate' | 'high';
  is_significant_risk: boolean;
  inherent_risk_factors: any; // JSONB
  management_point_estimate: number;
  auditor_point_estimate?: number;
  auditor_range_low?: number;
  auditor_range_high?: number;
  management_bias_indicators?: string;
  retrospective_review_performed: boolean;
  retrospective_review_results?: string;
  key_assumptions: any; // JSONB
  assumptions_reasonable: boolean;
  assumptions_evaluation?: string;
  data_used?: string;
  data_complete_accurate: boolean;
  data_evaluation?: string;
  method_appropriate: boolean;
  method_evaluation?: string;
  specialist_used: boolean;
  specialist_engagement_id?: string;
  sensitivity_analysis_performed: boolean;
  sensitivity_analysis_results?: string;
  disclosure_adequate: boolean;
  disclosure_evaluation?: string;
  misstatement_identified: boolean;
  misstatement_amount?: number;
  conclusion?: string;
  status: 'identified' | 'risk_assessed' | 'tested' | 'concluded';
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Litigation and claims
export type LitigationStatus = 'pending' | 'active' | 'settled' | 'dismissed' | 'on_appeal';
export type LitigationClassification = 'probable' | 'reasonably_possible' | 'remote';

export interface LitigationClaim {
  id: string;
  firm_id: string;
  engagement_id: string;
  matter_name: string;
  matter_description: string;
  matter_type: 'litigation' | 'claim' | 'assessment' | 'unasserted_claim';
  date_identified: string;
  identified_by?: string;
  identification_source: 'management' | 'attorney_letter' | 'inquiry' | 'other';
  plaintiff_claimant?: string;
  defendant?: string;
  jurisdiction?: string;
  amount_claimed?: number;
  currency: string;
  status: LitigationStatus;
  management_evaluation?: string;
  management_estimated_loss?: number;
  management_estimated_range_low?: number;
  management_estimated_range_high?: number;
  management_classification: LitigationClassification;
  auditor_evaluation?: string;
  auditor_classification?: LitigationClassification;
  attorney_letter_sent: boolean;
  attorney_letter_id?: string;
  attorney_response_received: boolean;
  attorney_response_date?: string;
  attorney_response_summary?: string;
  attorney_limitations?: string;
  accrual_required: boolean;
  accrual_amount?: number;
  accrual_recorded: boolean;
  disclosure_required: boolean;
  disclosure_adequate: boolean;
  disclosure_notes?: string;
  subsequent_events_update?: string;
  conclusion?: string;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Attorney letter
export interface AttorneyLetter {
  id: string;
  firm_id: string;
  engagement_id: string;
  attorney_firm_name: string;
  attorney_contact_name?: string;
  attorney_address?: string;
  attorney_email?: string;
  letter_date: string;
  sent_date?: string;
  sent_by?: string;
  inquiry_scope: string;
  matters_listed: any; // JSONB
  response_deadline: string;
  response_received: boolean;
  response_date?: string;
  response_summary?: string;
  response_complete: boolean;
  limitations_noted: boolean;
  limitations_description?: string;
  unasserted_claims_mentioned: boolean;
  unasserted_claims_details?: string;
  materially_consistent: boolean;
  inconsistencies_noted?: string;
  follow_up_required: boolean;
  follow_up_description?: string;
  follow_up_completed: boolean;
  document_storage_path?: string;
  response_storage_path?: string;
  status: 'draft' | 'sent' | 'pending_response' | 'response_received' | 'evaluated';
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Subsequent events
export type SubsequentEventType = 'type_1' | 'type_2';
export type SubsequentEventClassification = 'recognized' | 'non_recognized' | 'disclosure_only' | 'no_action';

export interface SubsequentEvent {
  id: string;
  firm_id: string;
  engagement_id: string;
  event_date: string;
  identified_date: string;
  identified_by?: string;
  event_description: string;
  event_type: SubsequentEventType;
  classification: SubsequentEventClassification;
  classification_rationale?: string;
  financial_impact?: number;
  is_material: boolean;
  adjustment_required: boolean;
  adjustment_amount?: number;
  adjustment_recorded: boolean;
  disclosure_required: boolean;
  disclosure_adequate: boolean;
  disclosure_text?: string;
  management_representations_updated: boolean;
  dual_dating_required: boolean;
  dual_date?: string;
  procedures_performed?: string;
  conclusion?: string;
  status: 'identified' | 'evaluated' | 'concluded';
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PHASE 5: AUDIT REPORTING
// ============================================================================

// Audit opinion type
export type AuditOpinionType = 'unmodified' | 'qualified' | 'adverse' | 'disclaimer';

// Opinion modification reason
export type OpinionModificationReason =
  | 'material_misstatement_not_pervasive'
  | 'material_misstatement_pervasive'
  | 'scope_limitation_not_pervasive'
  | 'scope_limitation_pervasive'
  | 'multiple_uncertainties'
  | 'inability_to_obtain_evidence';

// KAM category
export type KAMCategory =
  | 'significant_risk'
  | 'significant_judgment'
  | 'significant_transaction'
  | 'complex_accounting_estimate'
  | 'related_party_transaction'
  | 'going_concern'
  | 'revenue_recognition'
  | 'impairment_assessment'
  | 'complex_financial_instrument'
  | 'acquisition_or_disposal'
  | 'other_significant_matter';

// Emphasis of matter type
export type EmphasisMatterType =
  | 'going_concern_uncertainty'
  | 'significant_subsequent_event'
  | 'early_application_standard'
  | 'major_catastrophe'
  | 'significant_related_party'
  | 'unusual_legal_proceeding'
  | 'other_matter';

// Other matter type
export type OtherMatterType =
  | 'restriction_on_distribution'
  | 'prior_period_financial_statements'
  | 'supplementary_information'
  | 'other_auditor_involved'
  | 'component_auditor_reliance'
  | 'required_supplementary_information'
  | 'other';

// Audit opinion
export type OpinionStatus = 'draft' | 'review' | 'partner_review' | 'approved' | 'issued' | 'superseded';

export interface AuditOpinion {
  id: string;
  firm_id: string;
  engagement_id: string;
  opinion_type: AuditOpinionType;
  opinion_date?: string;
  report_date?: string;
  modification_reason?: OpinionModificationReason;
  modification_description?: string;
  material_misstatement_description?: string;
  scope_limitation_description?: string;
  basis_for_opinion: string;
  auditor_responsibilities: string;
  management_responsibilities: string;
  tcwg_responsibilities?: string;
  applicable_framework: string;
  fair_presentation_framework: boolean;
  compliance_framework: boolean;
  engagement_partner_id?: string;
  signing_partner_id?: string;
  firm_signature_name?: string;
  firm_location?: string;
  status: OpinionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  issued_at?: string;
  version_number: number;
  prior_version_id?: string;
  superseded_by?: string;
  superseded_at?: string;
  superseded_reason?: string;
  report_content_hash?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Key Audit Matter
export interface KeyAuditMatter {
  id: string;
  firm_id: string;
  audit_opinion_id: string;
  engagement_id: string;
  matter_title: string;
  category: KAMCategory;
  why_matter_is_kam: string;
  how_matter_addressed: string;
  financial_statement_reference?: string;
  related_disclosures?: string;
  related_risk_id?: string;
  related_finding_id?: string;
  related_workpaper_ids?: string[];
  display_order: number;
  included_in_report: boolean;
  exclusion_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Emphasis of Matter
export interface EmphasisOfMatter {
  id: string;
  firm_id: string;
  audit_opinion_id: string;
  matter_type: EmphasisMatterType;
  matter_title: string;
  paragraph_text: string;
  financial_statement_reference: string;
  disclosure_reference?: string;
  display_order: number;
  position_in_report: 'after_basis' | 'after_kam' | 'after_other_matter';
  rationale_for_inclusion: string;
  related_workpaper_ids?: string[];
  created_at: string;
  created_by?: string;
}

// Other Matter paragraph
export interface OtherMatterParagraph {
  id: string;
  firm_id: string;
  audit_opinion_id: string;
  matter_type: OtherMatterType;
  matter_title: string;
  paragraph_text: string;
  display_order: number;
  rationale_for_inclusion: string;
  created_at: string;
  created_by?: string;
}

// Representation category
export type RepresentationCategory =
  | 'general'
  | 'fair_presentation'
  | 'completeness'
  | 'recognition_measurement'
  | 'disclosure'
  | 'subsequent_events'
  | 'fraud'
  | 'laws_regulations'
  | 'litigation_claims'
  | 'related_parties'
  | 'estimates'
  | 'going_concern'
  | 'internal_control'
  | 'specific_assertions';

// Management representation letter status
export type ManagementRepLetterStatus = 'draft' | 'sent' | 'pending_signature' | 'signed' | 'received';

export interface ManagementRepresentation {
  id: string;
  firm_id: string;
  engagement_id: string;
  letter_date: string;
  period_covered_start: string;
  period_covered_end: string;
  addressed_to: string;
  ceo_name?: string;
  ceo_title?: string;
  ceo_signed: boolean;
  ceo_signed_at?: string;
  cfo_name?: string;
  cfo_title?: string;
  cfo_signed: boolean;
  cfo_signed_at?: string;
  other_signatories?: any; // JSONB
  status: ManagementRepLetterStatus;
  sent_date?: string;
  received_date?: string;
  document_storage_path?: string;
  document_hash?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Representation item
export interface RepresentationItem {
  id: string;
  representation_letter_id: string;
  firm_id: string;
  category: RepresentationCategory;
  representation_text: string;
  is_standard_representation: boolean;
  standard_reference?: string;
  display_order: number;
  included: boolean;
  exclusion_reason?: string;
  management_confirmed?: boolean;
  management_comments?: string;
  auditor_evaluation?: string;
  contradictory_evidence_noted: boolean;
  contradictory_evidence_description?: string;
  created_at: string;
}

// TCWG communication type
export type TCWGCommunicationType =
  | 'planning'
  | 'audit_scope_timing'
  | 'significant_findings'
  | 'auditor_independence'
  | 'internal_control_matters'
  | 'fraud_related'
  | 'going_concern'
  | 'noncompliance_laws'
  | 'engagement_letter_matters'
  | 'disagreements_with_management'
  | 'significant_difficulties'
  | 'other_matters'
  | 'final_communication';

export type TCWGCommunicationStatus = 'draft' | 'pending_review' | 'approved' | 'sent' | 'acknowledged';

export interface TCWGCommunication {
  id: string;
  firm_id: string;
  engagement_id: string;
  communication_type: TCWGCommunicationType;
  communication_date: string;
  communication_method: 'written' | 'oral' | 'written_and_oral';
  subject: string;
  summary: string;
  detailed_content?: string;
  recipients: any; // JSONB
  document_storage_path?: string;
  document_hash?: string;
  meeting_date?: string;
  meeting_attendees?: any; // JSONB
  meeting_minutes_path?: string;
  response_received: boolean;
  response_date?: string;
  response_summary?: string;
  response_document_path?: string;
  follow_up_required: boolean;
  follow_up_description?: string;
  follow_up_due_date?: string;
  follow_up_completed: boolean;
  follow_up_completed_date?: string;
  related_finding_ids?: string[];
  related_control_deficiency_ids?: string[];
  related_fraud_matter_ids?: string[];
  status: TCWGCommunicationStatus;
  approved_by?: string;
  approved_at?: string;
  sent_by?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Control deficiency communication
export type ControlDeficiencyCommunicationStatus = 'draft' | 'review' | 'approved' | 'sent' | 'acknowledged';

export interface ControlDeficiencyCommunication {
  id: string;
  firm_id: string;
  engagement_id: string;
  tcwg_communication_id?: string;
  letter_type: 'material_weakness' | 'significant_deficiency' | 'other_deficiency';
  letter_date: string;
  addressed_to_tcwg: boolean;
  addressed_to_management: boolean;
  recipient_names: any; // JSONB
  introduction: string;
  deficiencies_section: string;
  conclusion: string;
  related_control_deficiency_ids: string[];
  status: ControlDeficiencyCommunicationStatus;
  sent_date?: string;
  acknowledged_date?: string;
  acknowledged_by?: string;
  document_storage_path?: string;
  document_hash?: string;
  management_response_received: boolean;
  management_response_date?: string;
  management_response_summary?: string;
  management_response_document_path?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Audit report template
export interface AuditReportTemplate {
  id: string;
  firm_id?: string;
  template_name: string;
  template_code: string;
  description?: string;
  opinion_type?: AuditOpinionType;
  engagement_type?: string;
  applicable_framework?: string;
  template_content: any; // JSONB
  is_active: boolean;
  is_system_template: boolean;
  version_number: number;
  effective_date?: string;
  superseded_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Audit report status
export type AuditReportStatus =
  | 'draft'
  | 'manager_review'
  | 'partner_review'
  | 'eqcr_review'
  | 'final_review'
  | 'approved'
  | 'issued'
  | 'superseded';

export interface AuditReport {
  id: string;
  firm_id: string;
  engagement_id: string;
  audit_opinion_id: string;
  template_id?: string;
  report_title: string;
  report_date: string;
  report_content: string;
  report_content_html?: string;
  report_content_pdf_path?: string;
  content_hash: string;
  status: AuditReportStatus;
  manager_reviewed_by?: string;
  manager_reviewed_at?: string;
  manager_comments?: string;
  partner_reviewed_by?: string;
  partner_reviewed_at?: string;
  partner_comments?: string;
  eqcr_reviewed_by?: string;
  eqcr_reviewed_at?: string;
  eqcr_comments?: string;
  approved_by?: string;
  approved_at?: string;
  issued_at?: string;
  issued_to?: any; // JSONB
  superseded_by?: string;
  superseded_at?: string;
  superseded_reason?: string;
  version_number: number;
  prior_version_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Audit report history
export type ReportChangeType = 'created' | 'edited' | 'status_change' | 'reviewed' | 'approved' | 'issued' | 'superseded';

export interface AuditReportHistory {
  id: string;
  report_id: string;
  changed_at: string;
  changed_by?: string;
  change_type: ReportChangeType;
  previous_status?: string;
  new_status?: string;
  previous_content_hash?: string;
  new_content_hash?: string;
  change_description?: string;
  content_snapshot?: string;
}

// Report issuance checklist
export type IssuanceChecklistStatus = 'in_progress' | 'complete' | 'blocked';

export interface ReportIssuanceChecklist {
  id: string;
  firm_id: string;
  audit_report_id: string;
  engagement_id: string;
  status: IssuanceChecklistStatus;
  all_workpapers_complete: boolean;
  all_workpapers_reviewed: boolean;
  all_review_notes_cleared: boolean;
  all_findings_resolved: boolean;
  uncorrected_misstatements_evaluated: boolean;
  sod_immaterial_confirmed: boolean;
  tcwg_communications_complete: boolean;
  management_rep_letter_received: boolean;
  attorney_letters_received: boolean;
  partner_review_complete: boolean;
  eqcr_complete: boolean;
  eqcr_issues_resolved: boolean;
  independence_confirmed: boolean;
  independence_documentation_complete: boolean;
  going_concern_evaluation_complete: boolean;
  subsequent_events_review_complete: boolean;
  subsequent_events_review_date?: string;
  report_format_reviewed: boolean;
  report_dates_verified: boolean;
  financial_statement_tie_out: boolean;
  disclosure_checklist_complete: boolean;
  engagement_partner_signoff: boolean;
  engagement_partner_signoff_at?: string;
  concurring_partner_signoff: boolean;
  concurring_partner_signoff_at?: string;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  blocking_issues?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getOpinionTypeLabel(type: AuditOpinionType): string {
  const labels: Record<AuditOpinionType, string> = {
    unmodified: 'Unmodified',
    qualified: 'Qualified',
    adverse: 'Adverse',
    disclaimer: 'Disclaimer of Opinion'
  };
  return labels[type];
}

export function getOpinionTypeColor(type: AuditOpinionType): string {
  const colors: Record<AuditOpinionType, string> = {
    unmodified: 'text-green-600 bg-green-50',
    qualified: 'text-yellow-600 bg-yellow-50',
    adverse: 'text-red-600 bg-red-50',
    disclaimer: 'text-red-800 bg-red-100'
  };
  return colors[type];
}

export function getDeficiencyClassificationLabel(classification: DeficiencyClassification): string {
  const labels: Record<DeficiencyClassification, string> = {
    deficiency: 'Control Deficiency',
    significant_deficiency: 'Significant Deficiency',
    material_weakness: 'Material Weakness'
  };
  return labels[classification];
}

export function getDeficiencyClassificationColor(classification: DeficiencyClassification): string {
  const colors: Record<DeficiencyClassification, string> = {
    deficiency: 'text-blue-600 bg-blue-50',
    significant_deficiency: 'text-orange-600 bg-orange-50',
    material_weakness: 'text-red-600 bg-red-50'
  };
  return colors[classification];
}

export function getControlEffectivenessColor(effectiveness: DesignEffectiveness | OperatingEffectiveness): string {
  const colors: Record<string, string> = {
    effective: 'text-green-600 bg-green-50',
    effective_with_issues: 'text-yellow-600 bg-yellow-50',
    deviation_noted: 'text-orange-600 bg-orange-50',
    not_effective: 'text-red-600 bg-red-50',
    not_evaluated: 'text-gray-600 bg-gray-50',
    not_tested: 'text-gray-600 bg-gray-50'
  };
  return colors[effectiveness] || 'text-gray-600 bg-gray-50';
}

export function getGoingConcernColor(conclusion: GoingConcernConclusion): string {
  const colors: Record<GoingConcernConclusion, string> = {
    no_substantial_doubt: 'text-green-600 bg-green-50',
    substantial_doubt_mitigated: 'text-yellow-600 bg-yellow-50',
    substantial_doubt_unmitigated: 'text-orange-600 bg-orange-50',
    going_concern_issue: 'text-red-600 bg-red-50'
  };
  return colors[conclusion];
}

export function getRiskLevelColor(level: ClientRiskLevel | AMLRiskLevel): string {
  const colors: Record<string, string> = {
    low: 'text-green-600 bg-green-50',
    moderate: 'text-yellow-600 bg-yellow-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-red-600 bg-red-50',
    unacceptable: 'text-red-800 bg-red-100'
  };
  return colors[level] || 'text-gray-600 bg-gray-50';
}

export function getEQCRStatusColor(status: EQCRStatus): string {
  const colors: Record<EQCRStatus, string> = {
    not_started: 'text-gray-600 bg-gray-50',
    in_progress: 'text-blue-600 bg-blue-50',
    issues_identified: 'text-orange-600 bg-orange-50',
    issues_resolved: 'text-yellow-600 bg-yellow-50',
    complete: 'text-green-600 bg-green-50'
  };
  return colors[status];
}

export function getCOSOComponentLabel(component: COSOComponent): string {
  const labels: Record<COSOComponent, string> = {
    control_environment: 'Control Environment',
    risk_assessment: 'Risk Assessment',
    control_activities: 'Control Activities',
    information_communication: 'Information & Communication',
    monitoring: 'Monitoring Activities'
  };
  return labels[component];
}

export function getReportStatusLabel(status: AuditReportStatus): string {
  const labels: Record<AuditReportStatus, string> = {
    draft: 'Draft',
    manager_review: 'Manager Review',
    partner_review: 'Partner Review',
    eqcr_review: 'EQCR Review',
    final_review: 'Final Review',
    approved: 'Approved',
    issued: 'Issued',
    superseded: 'Superseded'
  };
  return labels[status];
}

export function getReportStatusColor(status: AuditReportStatus): string {
  const colors: Record<AuditReportStatus, string> = {
    draft: 'text-gray-600 bg-gray-50',
    manager_review: 'text-blue-600 bg-blue-50',
    partner_review: 'text-purple-600 bg-purple-50',
    eqcr_review: 'text-indigo-600 bg-indigo-50',
    final_review: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    issued: 'text-green-800 bg-green-100',
    superseded: 'text-gray-400 bg-gray-50'
  };
  return colors[status];
}
