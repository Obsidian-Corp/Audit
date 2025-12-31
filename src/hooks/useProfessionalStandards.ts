// =====================================================
// OBSIDIAN AUDIT - PROFESSIONAL STANDARDS HOOKS
// React Query hooks for Phase 1-5 database tables
// =====================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type {
  // Phase 1
  WorkpaperVersion,
  SignoffRecord,
  TickMarkDefinition,
  TickMarkUsage,
  WorkpaperCrossReference,
  EvidenceAccessLog,
  ProcedureStatusHistory,
  ImmutableAuditLog,
  // Phase 2
  IndependenceDeclaration,
  ConflictOfInterestRegister,
  ClientRiskAssessment,
  EngagementLetter,
  PredecessorCommunication,
  ClientAMLRecord,
  EngagementAcceptanceChecklist,
  // Phase 3
  InternalControl,
  ControlWalkthrough,
  ControlTestResult,
  ControlDeficiency,
  EQCRReview,
  ConsultationRecord,
  GoingConcernAssessment,
  RelatedParty,
  RelatedPartyTransaction,
  // Phase 4
  SpecialistEngagement,
  GroupAuditComponent,
  GroupInstructions,
  AccountingEstimate,
  LitigationClaim,
  AttorneyLetter,
  SubsequentEvent,
  // Phase 5
  AuditOpinion,
  KeyAuditMatter,
  EmphasisOfMatter,
  OtherMatterParagraph,
  ManagementRepresentation,
  RepresentationItem,
  TCWGCommunication,
  ControlDeficiencyCommunication,
  AuditReportTemplate,
  AuditReport,
  ReportIssuanceChecklist,
} from '@/types/professional-standards';

// =====================================================
// QUERY KEYS
// =====================================================

export const professionalStandardsKeys = {
  // Phase 1
  workpaperVersions: (workpaperId: string) => ['workpaper-versions', workpaperId] as const,
  signoffRecords: (engagementId: string) => ['signoff-records', engagementId] as const,
  tickMarkDefinitions: (firmId: string) => ['tick-mark-definitions', firmId] as const,
  tickMarkUsages: (workpaperId: string) => ['tick-mark-usages', workpaperId] as const,
  crossReferences: (workpaperId: string) => ['cross-references', workpaperId] as const,
  evidenceAccessLog: (evidenceId: string) => ['evidence-access-log', evidenceId] as const,
  procedureStatusHistory: (procedureId: string) => ['procedure-status-history', procedureId] as const,
  auditLog: (engagementId: string) => ['audit-log', engagementId] as const,

  // Phase 2
  independenceDeclarations: (engagementId: string) => ['independence-declarations', engagementId] as const,
  conflictRegister: (firmId: string) => ['conflict-register', firmId] as const,
  clientRiskAssessment: (clientId: string) => ['client-risk-assessment', clientId] as const,
  engagementLetter: (engagementId: string) => ['engagement-letter', engagementId] as const,
  predecessorCommunications: (engagementId: string) => ['predecessor-communications', engagementId] as const,
  amlRecords: (clientId: string) => ['aml-records', clientId] as const,
  acceptanceChecklist: (engagementId: string) => ['acceptance-checklist', engagementId] as const,

  // Phase 3
  internalControls: (engagementId: string) => ['internal-controls', engagementId] as const,
  controlWalkthroughs: (controlId: string) => ['control-walkthroughs', controlId] as const,
  controlTestResults: (controlId: string) => ['control-test-results', controlId] as const,
  controlDeficiencies: (engagementId: string) => ['control-deficiencies', engagementId] as const,
  eqcrReview: (engagementId: string) => ['eqcr-review', engagementId] as const,
  consultations: (engagementId: string) => ['consultations', engagementId] as const,
  goingConcern: (engagementId: string) => ['going-concern', engagementId] as const,
  relatedParties: (engagementId: string) => ['related-parties', engagementId] as const,
  relatedPartyTransactions: (partyId: string) => ['related-party-transactions', partyId] as const,

  // Phase 4
  specialists: (engagementId: string) => ['specialists', engagementId] as const,
  groupComponents: (engagementId: string) => ['group-components', engagementId] as const,
  groupInstructions: (componentId: string) => ['group-instructions', componentId] as const,
  accountingEstimates: (engagementId: string) => ['accounting-estimates', engagementId] as const,
  litigationClaims: (engagementId: string) => ['litigation-claims', engagementId] as const,
  attorneyLetters: (engagementId: string) => ['attorney-letters', engagementId] as const,
  subsequentEvents: (engagementId: string) => ['subsequent-events', engagementId] as const,

  // Phase 5
  auditOpinion: (engagementId: string) => ['audit-opinion', engagementId] as const,
  keyAuditMatters: (opinionId: string) => ['key-audit-matters', opinionId] as const,
  emphasisOfMatters: (opinionId: string) => ['emphasis-of-matters', opinionId] as const,
  otherMatters: (opinionId: string) => ['other-matters', opinionId] as const,
  managementRepresentations: (engagementId: string) => ['management-representations', engagementId] as const,
  tcwgCommunications: (engagementId: string) => ['tcwg-communications', engagementId] as const,
  reportTemplates: (firmId: string) => ['report-templates', firmId] as const,
  auditReports: (engagementId: string) => ['audit-reports', engagementId] as const,
  issuanceChecklist: (reportId: string) => ['issuance-checklist', reportId] as const,
};

// =====================================================
// PHASE 1: WORKFLOW & DOCUMENTATION HOOKS
// =====================================================

// Workpaper Versions
export function useWorkpaperVersions(workpaperId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.workpaperVersions(workpaperId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workpaper_versions')
        .select('*')
        .eq('workpaper_id', workpaperId)
        .order('version_number', { ascending: false });

      if (error) {
        logger.error('Failed to fetch workpaper versions', error);
        throw error;
      }
      return data as WorkpaperVersion[];
    },
    enabled: !!workpaperId,
  });
}

export function useCreateWorkpaperVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { workpaperId: string; content: any; changeSummary?: string }) => {
      const { data, error } = await supabase.rpc('create_workpaper_version', {
        p_workpaper_id: params.workpaperId,
        p_content: params.content,
        p_change_summary: params.changeSummary,
      });

      if (error) {
        logger.error('Failed to create workpaper version', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: professionalStandardsKeys.workpaperVersions(variables.workpaperId),
      });
    },
  });
}

// Sign-off Records
export function useSignoffRecords(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.signoffRecords(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('signoff_records')
        .select('*, signed_by_profile:profiles!signed_by(full_name, email)')
        .eq('engagement_id', engagementId)
        .order('signed_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch signoff records', error);
        throw error;
      }
      return data as SignoffRecord[];
    },
    enabled: !!engagementId,
  });
}

export function useCreateSignoff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      workpaperId?: string;
      procedureId?: string;
      signoffType: string;
      signoffRole: string;
      comments?: string;
      hoursSpent?: number;
    }) => {
      const { data, error } = await supabase.rpc('create_signoff', {
        p_workpaper_id: params.workpaperId,
        p_procedure_id: params.procedureId,
        p_signoff_type: params.signoffType,
        p_signoff_role: params.signoffRole,
        p_comments: params.comments,
        p_hours_spent: params.hoursSpent,
      });

      if (error) {
        logger.error('Failed to create signoff', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signoff-records'] });
    },
  });
}

// Tick Mark Definitions
export function useTickMarkDefinitions(firmId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.tickMarkDefinitions(firmId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tick_mark_definitions')
        .select('*')
        .eq('firm_id', firmId)
        .eq('is_active', true)
        .order('symbol');

      if (error) {
        logger.error('Failed to fetch tick mark definitions', error);
        throw error;
      }
      return data as TickMarkDefinition[];
    },
    enabled: !!firmId,
  });
}

// Procedure Status History
export function useProcedureStatusHistory(procedureId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.procedureStatusHistory(procedureId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedure_status_history')
        .select('*, changed_by_profile:profiles!changed_by(full_name)')
        .eq('procedure_id', procedureId)
        .order('changed_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch procedure status history', error);
        throw error;
      }
      return data as ProcedureStatusHistory[];
    },
    enabled: !!procedureId,
  });
}

// =====================================================
// PHASE 2: INDEPENDENCE & ENGAGEMENT ACCEPTANCE HOOKS
// =====================================================

// Independence Declarations
export function useIndependenceDeclarations(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.independenceDeclarations(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('independence_declarations')
        .select('*, user:profiles!user_id(full_name, email)')
        .eq('engagement_id', engagementId)
        .order('declaration_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch independence declarations', error);
        throw error;
      }
      return data as IndependenceDeclaration[];
    },
    enabled: !!engagementId,
  });
}

export function useCreateIndependenceDeclaration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (declaration: Partial<IndependenceDeclaration>) => {
      const { data, error } = await supabase
        .from('independence_declarations')
        .insert(declaration)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create independence declaration', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: professionalStandardsKeys.independenceDeclarations(variables.engagement_id),
        });
      }
    },
  });
}

// Client Risk Assessment
export function useClientRiskAssessment(clientId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.clientRiskAssessment(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_risk_assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch client risk assessment', error);
        throw error;
      }
      return data as ClientRiskAssessment | null;
    },
    enabled: !!clientId,
  });
}

// Engagement Acceptance Checklist
export function useEngagementAcceptanceChecklist(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.acceptanceChecklist(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_acceptance_checklists')
        .select('*')
        .eq('engagement_id', engagementId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch acceptance checklist', error);
        throw error;
      }
      return data as EngagementAcceptanceChecklist | null;
    },
    enabled: !!engagementId,
  });
}

export function useUpdateAcceptanceChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; updates: Partial<EngagementAcceptanceChecklist> }) => {
      const { data, error } = await supabase
        .from('engagement_acceptance_checklists')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update acceptance checklist', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: professionalStandardsKeys.acceptanceChecklist(data.engagement_id),
      });
    },
  });
}

// =====================================================
// PHASE 3: INTERNAL CONTROLS, EQCR, GOING CONCERN HOOKS
// =====================================================

// Internal Controls
export function useInternalControls(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.internalControls(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('internal_controls')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('control_id_code');

      if (error) {
        logger.error('Failed to fetch internal controls', error);
        throw error;
      }
      return data as InternalControl[];
    },
    enabled: !!engagementId,
  });
}

export function useCreateInternalControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (control: Partial<InternalControl>) => {
      const { data, error } = await supabase
        .from('internal_controls')
        .insert(control)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create internal control', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.engagement_id) {
        queryClient.invalidateQueries({
          queryKey: professionalStandardsKeys.internalControls(variables.engagement_id),
        });
      }
    },
  });
}

// Control Deficiencies
export function useControlDeficiencies(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.controlDeficiencies(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('control_deficiencies')
        .select('*, control:internal_controls(control_id_code, control_name)')
        .eq('engagement_id', engagementId)
        .order('classification', { ascending: false });

      if (error) {
        logger.error('Failed to fetch control deficiencies', error);
        throw error;
      }
      return data as ControlDeficiency[];
    },
    enabled: !!engagementId,
  });
}

// EQCR Review
export function useEQCRReview(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.eqcrReview(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eqcr_reviews')
        .select('*, eqcr_partner:profiles!eqcr_partner_id(full_name, email)')
        .eq('engagement_id', engagementId)
        .order('review_start_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch EQCR review', error);
        throw error;
      }
      return data as EQCRReview | null;
    },
    enabled: !!engagementId,
  });
}

// Going Concern Assessment
export function useGoingConcernAssessment(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.goingConcern(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('going_concern_assessments')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch going concern assessment', error);
        throw error;
      }
      return data as GoingConcernAssessment | null;
    },
    enabled: !!engagementId,
  });
}

// Related Parties
export function useRelatedParties(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.relatedParties(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('related_parties')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('party_name');

      if (error) {
        logger.error('Failed to fetch related parties', error);
        throw error;
      }
      return data as RelatedParty[];
    },
    enabled: !!engagementId,
  });
}

// =====================================================
// PHASE 4: SPECIALISTS, GROUP AUDITS, ESTIMATES HOOKS
// =====================================================

// Specialist Engagements
export function useSpecialistEngagements(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.specialists(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specialist_engagements')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('engagement_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch specialist engagements', error);
        throw error;
      }
      return data as SpecialistEngagement[];
    },
    enabled: !!engagementId,
  });
}

// Group Audit Components
export function useGroupAuditComponents(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.groupComponents(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_audit_components')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('component_type', { ascending: false });

      if (error) {
        logger.error('Failed to fetch group audit components', error);
        throw error;
      }
      return data as GroupAuditComponent[];
    },
    enabled: !!engagementId,
  });
}

// Accounting Estimates
export function useAccountingEstimates(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.accountingEstimates(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_estimates')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('complexity', { ascending: false });

      if (error) {
        logger.error('Failed to fetch accounting estimates', error);
        throw error;
      }
      return data as AccountingEstimate[];
    },
    enabled: !!engagementId,
  });
}

// Litigation & Claims
export function useLitigationClaims(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.litigationClaims(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('litigation_claims')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('date_identified', { ascending: false });

      if (error) {
        logger.error('Failed to fetch litigation claims', error);
        throw error;
      }
      return data as LitigationClaim[];
    },
    enabled: !!engagementId,
  });
}

// Subsequent Events
export function useSubsequentEvents(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.subsequentEvents(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsequent_events')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('event_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch subsequent events', error);
        throw error;
      }
      return data as SubsequentEvent[];
    },
    enabled: !!engagementId,
  });
}

// =====================================================
// PHASE 5: AUDIT REPORTING HOOKS
// =====================================================

// Audit Opinion
export function useAuditOpinion(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.auditOpinion(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_opinions')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('status', 'issued')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch audit opinion', error);
        throw error;
      }
      return data as AuditOpinion | null;
    },
    enabled: !!engagementId,
  });
}

export function useAuditOpinionDraft(engagementId: string) {
  return useQuery({
    queryKey: [...professionalStandardsKeys.auditOpinion(engagementId), 'draft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_opinions')
        .select('*')
        .eq('engagement_id', engagementId)
        .neq('status', 'issued')
        .neq('status', 'superseded')
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch audit opinion draft', error);
        throw error;
      }
      return data as AuditOpinion | null;
    },
    enabled: !!engagementId,
  });
}

// Key Audit Matters
export function useKeyAuditMatters(opinionId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.keyAuditMatters(opinionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_audit_matters')
        .select('*')
        .eq('audit_opinion_id', opinionId)
        .order('display_order');

      if (error) {
        logger.error('Failed to fetch key audit matters', error);
        throw error;
      }
      return data as KeyAuditMatter[];
    },
    enabled: !!opinionId,
  });
}

// Management Representations
export function useManagementRepresentations(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.managementRepresentations(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('management_representations')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('letter_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch management representations', error);
        throw error;
      }
      return data as ManagementRepresentation[];
    },
    enabled: !!engagementId,
  });
}

// TCWG Communications
export function useTCWGCommunications(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.tcwgCommunications(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tcwg_communications')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('communication_date', { ascending: false });

      if (error) {
        logger.error('Failed to fetch TCWG communications', error);
        throw error;
      }
      return data as TCWGCommunication[];
    },
    enabled: !!engagementId,
  });
}

// Audit Reports
export function useAuditReports(engagementId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.auditReports(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*, template:audit_report_templates(template_name)')
        .eq('engagement_id', engagementId)
        .order('version_number', { ascending: false });

      if (error) {
        logger.error('Failed to fetch audit reports', error);
        throw error;
      }
      return data as AuditReport[];
    },
    enabled: !!engagementId,
  });
}

// Report Issuance Checklist
export function useReportIssuanceChecklist(reportId: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.issuanceChecklist(reportId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_issuance_checklists')
        .select('*')
        .eq('audit_report_id', reportId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to fetch issuance checklist', error);
        throw error;
      }
      return data as ReportIssuanceChecklist | null;
    },
    enabled: !!reportId,
  });
}

// Check if report can be issued
export function useCheckReportIssuanceReady(reportId: string) {
  return useQuery({
    queryKey: [...professionalStandardsKeys.issuanceChecklist(reportId), 'ready'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_report_issuance_ready', {
        p_report_id: reportId,
      });

      if (error) {
        logger.error('Failed to check report issuance readiness', error);
        throw error;
      }
      return data as { is_ready: boolean; blocking_items: string[] };
    },
    enabled: !!reportId,
  });
}

// Report Templates
export function useReportTemplates(firmId?: string) {
  return useQuery({
    queryKey: professionalStandardsKeys.reportTemplates(firmId || 'system'),
    queryFn: async () => {
      let query = supabase
        .from('audit_report_templates')
        .select('*')
        .eq('is_active', true);

      if (firmId) {
        query = query.or(`firm_id.eq.${firmId},firm_id.is.null`);
      } else {
        query = query.is('firm_id', null);
      }

      const { data, error } = await query.order('template_name');

      if (error) {
        logger.error('Failed to fetch report templates', error);
        throw error;
      }
      return data as AuditReportTemplate[];
    },
  });
}

// =====================================================
// UTILITY HOOKS
// =====================================================

// Check team independence for engagement
export function useCheckTeamIndependence(engagementId: string) {
  return useQuery({
    queryKey: ['team-independence', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('check_team_independence', {
        p_engagement_id: engagementId,
      });

      if (error) {
        logger.error('Failed to check team independence', error);
        throw error;
      }
      return data as { is_independent: boolean; issues: string[] };
    },
    enabled: !!engagementId,
  });
}

// Determine suggested opinion type
export function useDetermineOpinionType(engagementId: string) {
  return useQuery({
    queryKey: ['suggested-opinion-type', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('determine_opinion_type', {
        p_engagement_id: engagementId,
      });

      if (error) {
        logger.error('Failed to determine opinion type', error);
        throw error;
      }
      return data as string;
    },
    enabled: !!engagementId,
  });
}

// Log evidence access (for chain of custody)
export function useLogEvidenceAccess() {
  return useMutation({
    mutationFn: async (params: {
      evidenceId: string;
      accessType: string;
      accessReason?: string;
    }) => {
      const { data, error } = await supabase.rpc('log_evidence_access', {
        p_evidence_id: params.evidenceId,
        p_access_type: params.accessType,
        p_access_reason: params.accessReason,
      });

      if (error) {
        logger.error('Failed to log evidence access', error);
        throw error;
      }
      return data;
    },
  });
}
