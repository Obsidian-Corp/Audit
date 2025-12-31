/**
 * useGoingConcern Hook
 * React hook for managing going concern assessments
 *
 * Implements requirements from:
 * - AU-C 570: The Auditor's Consideration of an Entity's Ability to Continue as a Going Concern
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  GoingConcernAssessment,
  GoingConcernIndicator,
  ManagementPlan,
  AssessmentConclusion,
  ReportModification,
  FINANCIAL_INDICATORS,
  OPERATING_INDICATORS,
  OTHER_INDICATORS,
  determineReportModification,
  calculateOverallSeverity,
} from '@/lib/going-concern';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// Going Concern Assessment Hook
// ============================================

export function useGoingConcernAssessment(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch assessment
  const {
    data: assessment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['going-concern-assessment', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('going_concern_assessments')
        .select(`
          *,
          indicators:going_concern_indicators(*),
          management_plans:going_concern_management_plans(*)
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as GoingConcernAssessment | null;
    },
    enabled: !!engagementId,
  });

  // Create assessment
  const createMutation = useMutation({
    mutationFn: async (data: Partial<GoingConcernAssessment>) => {
      // Create assessment
      const { data: newAssessment, error } = await supabase
        .from('going_concern_assessments')
        .insert({
          engagement_id: engagementId,
          assessment_period_start: data.assessmentPeriodStart || new Date().toISOString(),
          assessment_period_end: data.assessmentPeriodEnd,
          look_forward_period: data.lookForwardPeriod || 12,
          has_indicators_present: false,
          management_plans_obtained: false,
          management_plans_adequate: false,
          status: 'draft',
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize indicators
      const allIndicators = [
        ...FINANCIAL_INDICATORS.map((i) => ({ ...i, category: 'financial' })),
        ...OPERATING_INDICATORS.map((i) => ({ ...i, category: 'operating' })),
        ...OTHER_INDICATORS.map((i) => ({ ...i, category: 'other' })),
      ];

      const indicatorInserts = allIndicators.map((indicator) => ({
        engagement_id: engagementId,
        assessment_id: newAssessment.id,
        category: indicator.category,
        indicator_code: indicator.code,
        description: indicator.description,
        is_present: false,
        identified_by: user?.id,
        identified_at: new Date().toISOString(),
      }));

      const { error: indicatorError } = await supabase
        .from('going_concern_indicators')
        .insert(indicatorInserts);

      if (indicatorError) {
        console.warn('Failed to create indicators:', indicatorError);
      }

      return newAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Going concern assessment created');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create assessment');
    },
  });

  // Update assessment
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<GoingConcernAssessment>) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('going_concern_assessments')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Assessment updated');
    },
  });

  // Update indicator
  const updateIndicatorMutation = useMutation({
    mutationFn: async ({
      indicatorId,
      ...updates
    }: Partial<GoingConcernIndicator> & { indicatorId: string }) => {
      const { error } = await supabase
        .from('going_concern_indicators')
        .update(updates)
        .eq('id', indicatorId);

      if (error) throw error;

      // Update has_indicators_present on assessment
      const { data: indicators } = await supabase
        .from('going_concern_indicators')
        .select('is_present')
        .eq('assessment_id', assessment?.id);

      const hasIndicators = indicators?.some((i) => i.is_present) || false;

      await supabase
        .from('going_concern_assessments')
        .update({
          has_indicators_present: hasIndicators,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
    },
  });

  // Add management plan
  const addPlanMutation = useMutation({
    mutationFn: async (plan: Partial<ManagementPlan>) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { data, error } = await supabase
        .from('going_concern_management_plans')
        .insert({
          ...plan,
          assessment_id: assessment.id,
          evaluated_by: user?.id,
          evaluated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update management_plans_obtained
      await supabase
        .from('going_concern_assessments')
        .update({
          management_plans_obtained: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Management plan added');
    },
  });

  // Update management plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, ...updates }: Partial<ManagementPlan> & { planId: string }) => {
      const { error } = await supabase
        .from('going_concern_management_plans')
        .update(updates)
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Plan updated');
    },
  });

  // Complete initial evaluation
  const completeInitialEvaluationMutation = useMutation({
    mutationFn: async ({
      substantialDoubtRaised,
      evaluationNotes,
    }: {
      substantialDoubtRaised: boolean;
      evaluationNotes: string;
    }) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('going_concern_assessments')
        .update({
          initial_evaluation: {
            substantialDoubtRaised,
            evaluationNotes,
            evaluatedBy: user?.id,
            evaluatedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Initial evaluation completed');
    },
  });

  // Finalize conclusion
  const finalizeConclusion = useMutation({
    mutationFn: async ({
      conclusion,
      conclusionRationale,
      disclosuresAdequate,
    }: {
      conclusion: AssessmentConclusion;
      conclusionRationale: string;
      disclosuresAdequate: boolean;
    }) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const reportModification = determineReportModification(conclusion, disclosuresAdequate);

      const { error } = await supabase
        .from('going_concern_assessments')
        .update({
          conclusion,
          conclusion_rationale: conclusionRationale,
          disclosure_assessment: {
            disclosuresAdequate,
            requirement: disclosuresAdequate ? 'adequate_disclosure_exists' : 'disclosure_inadequate',
          },
          report_modification: reportModification,
          status: 'in_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Conclusion finalized');
    },
  });

  // Approve assessment (partner)
  const approveAssessmentMutation = useMutation({
    mutationFn: async (notes?: string) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('going_concern_assessments')
        .update({
          partner_approval: {
            approvedBy: user?.id,
            approvedAt: new Date().toISOString(),
            notes,
          },
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-assessment', engagementId] });
      toast.success('Assessment approved');
    },
  });

  // Calculate summary
  const summary = useMemo(() => {
    if (!assessment) return null;

    const indicators = assessment.indicators || [];
    const presentIndicators = indicators.filter((i) => i.isPresent);
    const plans = assessment.managementPlans || [];
    const adequatePlans = plans.filter((p) => p.auditorConclusion === 'adequate');

    return {
      totalIndicators: indicators.length,
      presentIndicators: presentIndicators.length,
      financialIndicators: presentIndicators.filter((i) => i.category === 'financial').length,
      operatingIndicators: presentIndicators.filter((i) => i.category === 'operating').length,
      otherIndicators: presentIndicators.filter((i) => i.category === 'other').length,
      overallSeverity: calculateOverallSeverity(presentIndicators),
      totalPlans: plans.length,
      adequatePlans: adequatePlans.length,
      hasSubstantialDoubt: assessment.initialEvaluation?.substantialDoubtRaised || false,
      conclusion: assessment.conclusion,
      reportModification: assessment.reportModification,
      status: assessment.status,
    };
  }, [assessment]);

  return {
    assessment,
    summary,
    isLoading,
    error,
    createAssessment: createMutation.mutateAsync,
    updateAssessment: updateMutation.mutateAsync,
    updateIndicator: updateIndicatorMutation.mutateAsync,
    addManagementPlan: addPlanMutation.mutateAsync,
    updateManagementPlan: updatePlanMutation.mutateAsync,
    completeInitialEvaluation: completeInitialEvaluationMutation.mutateAsync,
    finalizeConclusion: finalizeConclusion.mutateAsync,
    approveAssessment: approveAssessmentMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSaving:
      updateMutation.isPending ||
      updateIndicatorMutation.isPending ||
      addPlanMutation.isPending ||
      updatePlanMutation.isPending,
    refetch,
  };
}

// ============================================
// Going Concern Checklist Hook
// ============================================

export function useGoingConcernChecklist(assessmentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch checklist items
  const {
    data: checklistItems,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['going-concern-checklist', assessmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('going_concern_checklist_items')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!assessmentId,
  });

  // Update checklist item
  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      response,
      explanation,
      workpaperRef,
    }: {
      itemId: string;
      response: 'yes' | 'no' | 'na' | 'pending';
      explanation?: string;
      workpaperRef?: string;
    }) => {
      const { error } = await supabase
        .from('going_concern_checklist_items')
        .update({
          response,
          explanation,
          workpaper_ref: workpaperRef,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['going-concern-checklist', assessmentId] });
    },
  });

  // Calculate completion
  const completion = useMemo(() => {
    if (!checklistItems) return { total: 0, completed: 0, percentage: 0 };

    const total = checklistItems.length;
    const completed = checklistItems.filter(
      (item) => item.response && item.response !== 'pending'
    ).length;

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [checklistItems]);

  return {
    checklistItems,
    completion,
    isLoading,
    updateItem: updateItemMutation.mutateAsync,
    refetch,
  };
}
