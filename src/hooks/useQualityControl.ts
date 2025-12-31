/**
 * useQualityControl Hook
 * React hook for managing quality control and EQCR workflows
 *
 * Implements requirements from:
 * - ISQM 1: Quality Management for Firms
 * - ISQM 2: Engagement Quality Reviews
 * - AU-C 220: Quality Control for an Engagement
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  EQCRAssessment,
  EQCRFinding,
  EQCRStatus,
  EQCRTrigger,
  FindingSeverity,
  QualityChecklistItem,
  ReviewNote,
  ReviewNoteStatus,
  QUALITY_CHECKLISTS,
  determineEQCRRequired,
  canCompleteEQCR,
} from '@/lib/quality-control';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// EQCR Assessment Hook
// ============================================

export function useEQCRAssessment(engagementId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch EQCR assessment
  const {
    data: assessment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['eqcr-assessment', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eqcr_assessments')
        .select(`
          *,
          findings:eqcr_findings(*)
        `)
        .eq('engagement_id', engagementId)
        .maybeSingle();

      if (error) throw error;
      return data as EQCRAssessment | null;
    },
    enabled: !!engagementId,
  });

  // Initialize EQCR assessment
  const initializeMutation = useMutation({
    mutationFn: async ({
      isPublicInterestEntity,
      overallRiskRating,
      isFirstYear,
      hasComplexTransactions,
      hasQualityConcerns,
    }: {
      isPublicInterestEntity: boolean;
      overallRiskRating: 'low' | 'moderate' | 'high';
      isFirstYear: boolean;
      hasComplexTransactions: boolean;
      hasQualityConcerns: boolean;
    }) => {
      const { required, triggers } = determineEQCRRequired(
        isPublicInterestEntity,
        overallRiskRating,
        isFirstYear,
        hasComplexTransactions,
        hasQualityConcerns
      );

      const { data, error } = await supabase
        .from('eqcr_assessments')
        .insert({
          engagement_id: engagementId,
          is_required: required,
          triggers,
          status: required ? 'pending_assignment' : 'not_required',
          scope: {
            planningPhase: true,
            riskAssessment: true,
            significantJudgments: true,
            auditEvidence: true,
            conclusions: true,
            reportDraft: true,
            documentation: true,
          },
          total_findings: 0,
          open_findings: 0,
          workpaper_refs: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('EQCR assessment initialized');
    },
  });

  // Assign EQCR reviewer
  const assignReviewerMutation = useMutation({
    mutationFn: async ({
      reviewerId,
      reviewerName,
    }: {
      reviewerId: string;
      reviewerName: string;
    }) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('eqcr_assessments')
        .update({
          eqcr_reviewer_id: reviewerId,
          eqcr_reviewer_name: reviewerName,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('EQCR reviewer assigned');
    },
  });

  // Start review
  const startReviewMutation = useMutation({
    mutationFn: async () => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('eqcr_assessments')
        .update({
          status: 'in_progress',
          review_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('EQCR review started');
    },
  });

  // Raise finding
  const raiseFindingMutation = useMutation({
    mutationFn: async (finding: Partial<EQCRFinding>) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const findingNumber = `EQCR-${engagementId.slice(0, 4)}-${(assessment.totalFindings || 0) + 1}`;

      const { data, error } = await supabase
        .from('eqcr_findings')
        .insert({
          assessment_id: assessment.id,
          engagement_id: engagementId,
          finding_number: findingNumber,
          finding_title: finding.findingTitle,
          finding_description: finding.findingDescription,
          severity: finding.severity || 'minor',
          category: finding.category || 'General',
          related_area: finding.relatedArea || '',
          workpaper_ref: finding.workpaperRef,
          affects_conclusion: finding.affectsConclusion || false,
          affects_report: finding.affectsReport || false,
          requires_additional_work: finding.requiresAdditionalWork || false,
          status: 'open',
          raised_at: new Date().toISOString(),
          raised_by: user?.id,
          communicated_to_partner: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update counts on assessment
      await supabase
        .from('eqcr_assessments')
        .update({
          total_findings: (assessment.totalFindings || 0) + 1,
          open_findings: (assessment.openFindings || 0) + 1,
          status: 'findings_raised',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('Finding raised');
    },
  });

  // Respond to finding
  const respondToFindingMutation = useMutation({
    mutationFn: async ({
      findingId,
      response,
    }: {
      findingId: string;
      response: string;
    }) => {
      const { error } = await supabase
        .from('eqcr_findings')
        .update({
          engagement_team_response: response,
          responded_at: new Date().toISOString(),
          responded_by: user?.id,
          status: 'pending_response',
        })
        .eq('id', findingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('Response submitted');
    },
  });

  // Resolve finding
  const resolveFindingMutation = useMutation({
    mutationFn: async ({
      findingId,
      resolution,
    }: {
      findingId: string;
      resolution: string;
    }) => {
      const { error } = await supabase
        .from('eqcr_findings')
        .update({
          resolution_description: resolution,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          status: 'resolved',
        })
        .eq('id', findingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('Finding resolved');
    },
  });

  // Accept resolution (EQCR reviewer)
  const acceptResolutionMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const { error } = await supabase
        .from('eqcr_findings')
        .update({
          eqcr_accepted_resolution: true,
          status: 'closed',
        })
        .eq('id', findingId);

      if (error) throw error;

      // Update open findings count
      if (assessment) {
        await supabase
          .from('eqcr_assessments')
          .update({
            open_findings: Math.max(0, (assessment.openFindings || 0) - 1),
            updated_at: new Date().toISOString(),
          })
          .eq('id', assessment.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      toast.success('Resolution accepted');
    },
  });

  // Complete EQCR
  const completeMutation = useMutation({
    mutationFn: async ({
      conclusion,
      rationale,
    }: {
      conclusion: 'approved' | 'approved_with_comments' | 'not_approved';
      rationale: string;
    }) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const findings = assessment.findings || [];
      const { canComplete, blockers } = canCompleteEQCR(findings);

      if (!canComplete) {
        throw new Error(blockers[0]);
      }

      const { error } = await supabase
        .from('eqcr_assessments')
        .update({
          status: conclusion === 'not_approved' ? 'findings_raised' : 'completed',
          eqcr_conclusion: conclusion,
          conclusion_rationale: rationale,
          signed_off_at: new Date().toISOString(),
          signed_off_by: user?.id,
          review_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;

      // Update audit EQCR status
      // NOTE: Using 'audits' table instead of 'engagements' which doesn't exist
      if (conclusion !== 'not_approved') {
        await supabase
          .from('audits')
          .update({
            eqcr_complete: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', engagementId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eqcr-assessment', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('EQCR completed');
    },
  });

  // Summary
  const summary = useMemo(() => {
    if (!assessment) return null;

    const findings = assessment.findings || [];
    return {
      isRequired: assessment.isRequired,
      status: assessment.status,
      triggers: assessment.triggers || [],
      totalFindings: findings.length,
      openFindings: findings.filter((f) => f.status !== 'closed').length,
      criticalFindings: findings.filter((f) => f.severity === 'critical').length,
      canComplete: canCompleteEQCR(findings).canComplete,
      blockers: canCompleteEQCR(findings).blockers,
    };
  }, [assessment]);

  // Check if current user is the EQCR reviewer
  const isEQCRReviewer = assessment?.eqcrReviewerId === user?.id;

  return {
    assessment,
    summary,
    isLoading,
    error,
    isEQCRReviewer,
    initialize: initializeMutation.mutateAsync,
    assignReviewer: assignReviewerMutation.mutateAsync,
    startReview: startReviewMutation.mutateAsync,
    raiseFinding: raiseFindingMutation.mutateAsync,
    respondToFinding: respondToFindingMutation.mutateAsync,
    resolveFinding: resolveFindingMutation.mutateAsync,
    acceptResolution: acceptResolutionMutation.mutateAsync,
    complete: completeMutation.mutateAsync,
    refetch,
  };
}

// ============================================
// Quality Checklist Hook
// ============================================

export function useQualityChecklist(
  engagementId: string,
  phase: 'planning' | 'fieldwork' | 'wrap_up' | 'reporting'
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch checklist items
  const {
    data: items,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['quality-checklist', engagementId, phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quality_checklist_items')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('phase', phase)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as QualityChecklistItem[];
    },
    enabled: !!engagementId,
  });

  // Initialize checklist
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const checklistItems = QUALITY_CHECKLISTS[phase];
      const insertData = checklistItems.map((item) => ({
        engagement_id: engagementId,
        phase,
        requirement: item.requirement,
        guidance: item.guidance,
        standard: item.standard,
        is_completed: false,
        is_reviewed: false,
      }));

      const { error } = await supabase.from('quality_checklist_items').insert(insertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklist', engagementId, phase] });
      toast.success('Checklist initialized');
    },
  });

  // Complete item
  const completeItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      notes,
      workpaperRef,
    }: {
      itemId: string;
      notes?: string;
      workpaperRef?: string;
    }) => {
      const { error } = await supabase
        .from('quality_checklist_items')
        .update({
          is_completed: true,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
          notes,
          workpaper_ref: workpaperRef,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklist', engagementId, phase] });
    },
  });

  // Review item
  const reviewItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('quality_checklist_items')
        .update({
          is_reviewed: true,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checklist', engagementId, phase] });
    },
  });

  // Calculate completion
  const completion = useMemo(() => {
    if (!items) return { total: 0, completed: 0, reviewed: 0, percentage: 0 };

    const total = items.length;
    const completed = items.filter((i) => i.isCompleted).length;
    const reviewed = items.filter((i) => i.isReviewed).length;

    return {
      total,
      completed,
      reviewed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [items]);

  return {
    items,
    completion,
    isLoading,
    initialize: initializeMutation.mutateAsync,
    completeItem: completeItemMutation.mutateAsync,
    reviewItem: reviewItemMutation.mutateAsync,
    refetch,
  };
}

// ============================================
// Review Notes Hook
// ============================================

export function useReviewNotes(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch review notes
  const {
    data: notes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review-notes', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_notes')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReviewNote[];
    },
    enabled: !!engagementId,
  });

  // Create note
  const createMutation = useMutation({
    mutationFn: async (note: Partial<ReviewNote>) => {
      const noteNumber = `RN-${engagementId.slice(0, 4)}-${(notes?.length || 0) + 1}`;

      const { data, error } = await supabase
        .from('review_notes')
        .insert({
          engagement_id: engagementId,
          note_number: noteNumber,
          title: note.title,
          description: note.description,
          priority: note.priority || 'medium',
          category: note.category || 'General',
          affected_area: note.affectedArea || '',
          workpaper_id: note.workpaperId,
          status: 'open',
          raised_by: user?.id,
          raised_at: new Date().toISOString(),
          assigned_to: note.assignedTo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', engagementId] });
      toast.success('Review note created');
    },
  });

  // Respond to note
  const respondMutation = useMutation({
    mutationFn: async ({
      noteId,
      response,
    }: {
      noteId: string;
      response: string;
    }) => {
      const { error } = await supabase
        .from('review_notes')
        .update({
          response,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          status: 'responded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', engagementId] });
      toast.success('Response submitted');
    },
  });

  // Resolve note
  const resolveMutation = useMutation({
    mutationFn: async ({
      noteId,
      resolution,
    }: {
      noteId: string;
      resolution: string;
    }) => {
      const { error } = await supabase
        .from('review_notes')
        .update({
          resolution,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          status: 'resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-notes', engagementId] });
      toast.success('Note resolved');
    },
  });

  // Summary
  const summary = useMemo(() => {
    if (!notes) return { total: 0, open: 0, critical: 0, resolved: 0 };

    return {
      total: notes.length,
      open: notes.filter((n) => n.status === 'open' || n.status === 'responded').length,
      critical: notes.filter((n) => n.priority === 'critical' && n.status !== 'resolved').length,
      resolved: notes.filter((n) => n.status === 'resolved').length,
    };
  }, [notes]);

  return {
    notes,
    summary,
    isLoading,
    error,
    createNote: createMutation.mutateAsync,
    respondToNote: respondMutation.mutateAsync,
    resolveNote: resolveMutation.mutateAsync,
    refetch,
  };
}

// ============================================
// Combined Quality Control Hook
// ============================================

export function useQualityControl(engagementId: string) {
  const eqcr = useEQCRAssessment(engagementId);
  const reviewNotes = useReviewNotes(engagementId);
  const planningChecklist = useQualityChecklist(engagementId, 'planning');
  const fieldworkChecklist = useQualityChecklist(engagementId, 'fieldwork');
  const wrapUpChecklist = useQualityChecklist(engagementId, 'wrap_up');
  const reportingChecklist = useQualityChecklist(engagementId, 'reporting');

  const overallStatus = useMemo(() => {
    const hasOpenNotes = (reviewNotes.summary?.open || 0) > 0;
    const eqcrComplete = eqcr.assessment?.status === 'completed' || !eqcr.assessment?.isRequired;
    const allChecklistsComplete =
      planningChecklist.completion.percentage === 100 &&
      fieldworkChecklist.completion.percentage === 100 &&
      wrapUpChecklist.completion.percentage === 100 &&
      reportingChecklist.completion.percentage === 100;

    return {
      isReadyForIssuance: !hasOpenNotes && eqcrComplete && allChecklistsComplete,
      hasOpenReviewNotes: hasOpenNotes,
      eqcrComplete,
      checklistProgress: {
        planning: planningChecklist.completion.percentage,
        fieldwork: fieldworkChecklist.completion.percentage,
        wrap_up: wrapUpChecklist.completion.percentage,
        reporting: reportingChecklist.completion.percentage,
      },
    };
  }, [eqcr.assessment, reviewNotes.summary, planningChecklist, fieldworkChecklist, wrapUpChecklist, reportingChecklist]);

  return {
    eqcr,
    reviewNotes,
    checklists: {
      planning: planningChecklist,
      fieldwork: fieldworkChecklist,
      wrapUp: wrapUpChecklist,
      reporting: reportingChecklist,
    },
    overallStatus,
    isLoading:
      eqcr.isLoading ||
      reviewNotes.isLoading ||
      planningChecklist.isLoading ||
      fieldworkChecklist.isLoading ||
      wrapUpChecklist.isLoading ||
      reportingChecklist.isLoading,
  };
}
