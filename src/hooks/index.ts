/**
 * Hooks Index
 * Central export for all custom React hooks
 *
 * Organized by module:
 * - Core hooks (auth, data)
 * - Workflow hooks (state machines)
 * - Engagement Acceptance hooks
 * - Control Testing hooks
 * - Going Concern hooks
 * - Audit Reporting hooks
 * - Quality Control hooks
 * - Professional Standards hooks
 * - Trial Balance hooks
 * - Materiality hooks
 * - Sampling hooks
 */

// ============================================
// Workflow Hooks
// ============================================
export {
  useEngagementWorkflow,
  useEngagementWorkflowSummary,
} from './useEngagementWorkflow';

export {
  useProcedureWorkflow,
  useEngagementProcedures,
  useEngagementProcedureCompletion,
} from './useProcedureWorkflow';

// ============================================
// Engagement Acceptance Hooks
// ============================================
export {
  useEngagementAcceptance,
  useIndependenceDeclarations,
  useClientRiskAssessment,
  useEngagementLetter,
} from './useEngagementAcceptance';

// ============================================
// Control Testing Hooks
// ============================================
export {
  useControls,
  useTestOfControls,
  useControlDeficiencies,
  useITGeneralControls,
  useControlTestingSummary,
} from './useControlTesting';

// ============================================
// Going Concern Hooks
// ============================================
export {
  useGoingConcernAssessment,
  useGoingConcernChecklist,
} from './useGoingConcern';

// ============================================
// Audit Reporting Hooks
// ============================================
export {
  useAuditOpinion,
  useAuditReport,
  useReportIssuanceChecklist,
  useAuditReporting,
} from './useAuditReporting';

// ============================================
// Quality Control Hooks
// ============================================
export {
  useEQCRAssessment,
  useQualityChecklist,
  useReviewNotes,
  useQualityControl,
} from './useQualityControl';

// ============================================
// Trial Balance Hooks
// ============================================
export {
  trialBalanceKeys,
  useTrialBalances,
  useTrialBalance,
  useTrialBalanceAccounts,
  useCreateTrialBalance,
  useImportTrialBalance,
  useUpdateTrialBalanceStatus,
  useUpdateAccountMapping,
  useBulkUpdateAccountMappings,
  useRecordAdjustment,
  useLeadSchedules,
  useLeadSchedule,
  useCreateLeadSchedule,
  useAutoGenerateLeadSchedules,
  useUpdateLeadSchedule,
  useSignOffLeadSchedule,
  useVarianceAnalysis,
  useTrialBalanceSummary,
} from './useTrialBalance';

// ============================================
// Materiality Hooks
// ============================================
export {
  materialityKeys,
  useMaterialityHistory,
  useCurrentMateriality,
  useMaterialityCalculation,
  useMaterialityAllocations,
  useCreateMaterialityCalculation,
  useUpdateMaterialityCalculation,
  useSubmitMaterialityForReview,
  useReviewMateriality,
  useApproveMateriality,
  useReviseMateriality,
  useCreateMaterialityAllocation,
  useMaterialitySummary,
} from './useMateriality';

// ============================================
// Sampling Hooks
// ============================================
export {
  samplingKeys,
  useSamples,
  useSample,
  useSampleItems,
  useCreateSample,
  useSelectSampleItems,
  useRecordItemTestResult,
  useCompleteSampleTesting,
  useSignOffSample,
  useSamplingSummary,
} from './useSampling';

// ============================================
// Professional Standards Hooks
// ============================================
export {
  // Query Keys
  professionalStandardsKeys,

  // Phase 1: Workflow & Documentation
  useWorkpaperVersions,
  useCreateWorkpaperVersion,
  useSignoffRecords,
  useCreateSignoff,
  useTickMarkDefinitions,
  useProcedureStatusHistory,

  // Phase 2: Independence & Engagement Acceptance
  useIndependenceDeclarations as usePSIndependenceDeclarations,
  useCreateIndependenceDeclaration,
  useClientRiskAssessment as usePSClientRiskAssessment,
  useEngagementLetter as usePSEngagementLetter,

  // Phase 3: Internal Controls & Quality
  useInternalControls,
  useControlWalkthroughs,
  useControlTestResults,
  useControlDeficiencies as usePSControlDeficiencies,
  useEQCRReview,
  useGoingConcernAssessment as usePSGoingConcernAssessment,
  useRelatedParties as usePSRelatedParties,
  useRelatedPartyTransactions as usePSRelatedPartyTransactions,

  // Phase 4: Specialists & Group Audits
  useSpecialists,
  useGroupComponents,
  useAccountingEstimates,
  useLitigationClaims,
  useAttorneyLetters,
  useSubsequentEvents,

  // Phase 5: Reporting
  useAuditOpinion as usePSAuditOpinion,
  useKeyAuditMatters,
  useManagementRepresentations,
  useTCWGCommunications,
  useAuditReports,
  useIssuanceChecklist,
} from './useProfessionalStandards';

// ============================================
// Re-export Types for convenience
// ============================================

// Workflow types
export type {
  EngagementState,
  EngagementAction,
  ProcedureState,
  ProcedureAction,
  SignoffRole,
  RiskLevel,
} from '@/lib/state-machines';

// Engagement Acceptance types
export type {
  IndependenceDeclaration,
  ClientRiskAssessment,
  EngagementLetter,
  AcceptanceWorkflow,
  AcceptanceStage,
  RiskCategory,
} from '@/lib/engagement-acceptance';

// Control Testing types
export type {
  Control,
  ControlEffectiveness,
  TestOfControls,
  ControlDeficiency,
  DeficiencyClassification,
} from '@/lib/control-testing';

// Going Concern types
export type {
  GoingConcernAssessment,
  GoingConcernIndicator,
  ManagementPlan,
  AssessmentConclusion,
} from '@/lib/going-concern';

// Audit Reporting types
export type {
  AuditOpinion,
  OpinionType,
  AuditReport,
  KeyAuditMatter,
  EmphasisOfMatter,
} from '@/lib/audit-reporting';

// Quality Control types
export type {
  EQCRAssessment,
  EQCRFinding,
  EQCRStatus,
  ReviewNote,
} from '@/lib/quality-control';

// ============================================
// Real-time Subscription Hooks
// ============================================
export {
  useRealtimeSubscription,
  useRealtimeReviewNotes,
  useRealtimeProcedures,
  useRealtimeSignoffs,
  useRealtimeAdjustments,
  useRealtimeTCWG,
  useRealtimeSubsequentEvents,
  useRealtimeFindings,
  usePresence,
  useEngagementRealtime,
} from './useRealtimeSubscription';

// ============================================
// Excel Import Hooks
// ============================================
export {
  useExcelPreview,
  useTrialBalanceImport,
  useChartOfAccountsImport,
  useAdjustmentsImport,
} from './useExcelImport';

// ============================================
// Document Storage Hooks
// ============================================
export {
  useEngagementDocuments,
  useDocumentVersions,
  useUploadDocument,
  useUploadDocumentVersion,
  useDownloadDocument,
  useDeleteDocument,
  useArchiveDocument,
} from './useDocumentStorage';
