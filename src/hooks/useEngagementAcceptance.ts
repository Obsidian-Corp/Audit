/**
 * useEngagementAcceptance Hook
 * React hook for managing the engagement acceptance workflow
 *
 * Provides functionality for:
 * - Independence declarations
 * - Client risk assessment
 * - Engagement letter generation
 * - Partner approval workflow
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  IndependenceDeclaration,
  ClientRiskAssessment,
  EngagementLetter,
  AcceptanceWorkflow,
  AcceptanceStage,
  validateIndependenceDeclaration,
  validateClientRiskAssessment,
  validateEngagementLetter,
  assessOverallIndependence,
  determinePartnerApprovalRequired,
  canCompleteAcceptance,
  calculateOverallRiskRating,
} from '@/lib/engagement-acceptance';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// Independence Declarations Hook
// ============================================

export function useIndependenceDeclarations(engagementId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Fetch all declarations for the engagement
  const {
    data: declarations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['independence-declarations', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('independence_declarations')
        .select(`
          *,
          team_member:profiles!team_member_id(id, full_name, role)
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as IndependenceDeclaration[];
    },
    enabled: !!engagementId,
  });

  // Get current user's declaration
  const myDeclaration = useMemo(() => {
    if (!declarations || !user) return null;
    return declarations.find((d) => d.teamMemberId === user.id);
  }, [declarations, user]);

  // Create/update declaration
  const saveMutation = useMutation({
    mutationFn: async (declaration: Partial<IndependenceDeclaration>) => {
      const validation = validateIndependenceDeclaration(declaration);
      if (!validation.isValid) {
        throw new Error(validation.errors[0].message);
      }

      const payload = {
        ...declaration,
        engagement_id: engagementId,
        team_member_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (declaration.id) {
        const { data, error } = await supabase
          .from('independence_declarations')
          .update(payload)
          .eq('id', declaration.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('independence_declarations')
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['independence-declarations', engagementId],
      });
      toast.success('Independence declaration saved');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save declaration');
    },
  });

  // Certify declaration
  const certifyMutation = useMutation({
    mutationFn: async (declarationId: string) => {
      const { data, error } = await supabase
        .from('independence_declarations')
        .update({
          is_certified: true,
          certified_at: new Date().toISOString(),
          certification_statement: `I certify that I have no known independence impairments that would preclude me from serving on this engagement.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', declarationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['independence-declarations', engagementId],
      });
      toast.success('Independence certified successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to certify independence');
    },
  });

  // Overall independence assessment
  const overallIndependence = useMemo(() => {
    if (!declarations) return null;
    return assessOverallIndependence(declarations);
  }, [declarations]);

  return {
    declarations,
    myDeclaration,
    isLoading,
    error,
    overallIndependence,
    saveDeclaration: saveMutation.mutateAsync,
    certifyIndependence: certifyMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isCertifying: certifyMutation.isPending,
    refetch,
  };
}

// ============================================
// Client Risk Assessment Hook
// ============================================

export function useClientRiskAssessment(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch risk assessment
  const {
    data: assessment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['client-risk-assessment', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_risk_assessments')
        .select('*')
        .eq('engagement_id', engagementId)
        .maybeSingle();

      if (error) throw error;
      return data as ClientRiskAssessment | null;
    },
    enabled: !!engagementId,
  });

  // Save assessment
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ClientRiskAssessment>) => {
      const validation = validateClientRiskAssessment(data);
      if (!validation.isValid) {
        throw new Error(validation.errors[0].message);
      }

      // Calculate overall risk rating
      const overallRating = calculateOverallRiskRating(
        data.managementIntegrity?.overallAssessment || 'low',
        data.financialStability?.overallAssessment || 'low',
        data.engagementRisk?.overallAssessment || 'low'
      );

      const payload = {
        ...data,
        engagement_id: engagementId,
        overall_risk_rating: overallRating,
        partner_approval_required: determinePartnerApprovalRequired(data as ClientRiskAssessment),
        updated_at: new Date().toISOString(),
      };

      if (assessment?.id) {
        const { data: result, error } = await supabase
          .from('client_risk_assessments')
          .update(payload)
          .eq('id', assessment.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('client_risk_assessments')
          .insert({
            ...payload,
            prepared_by: user?.id,
            prepared_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client-risk-assessment', engagementId],
      });
      toast.success('Risk assessment saved');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save assessment');
    },
  });

  // Submit for review
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('client_risk_assessments')
        .update({
          is_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client-risk-assessment', engagementId],
      });
      toast.success('Risk assessment submitted for review');
    },
  });

  // Partner approval
  const approvalMutation = useMutation({
    mutationFn: async ({ approved, notes }: { approved: boolean; notes?: string }) => {
      if (!assessment?.id) throw new Error('Assessment not found');

      const { error } = await supabase
        .from('client_risk_assessments')
        .update({
          partner_approved_by: user?.id,
          partner_approved_at: new Date().toISOString(),
          partner_approval_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({
        queryKey: ['client-risk-assessment', engagementId],
      });
      toast.success(approved ? 'Engagement approved by partner' : 'Engagement rejected');
    },
  });

  return {
    assessment,
    isLoading,
    error,
    saveAssessment: saveMutation.mutateAsync,
    submitForReview: submitMutation.mutateAsync,
    approveAsPartner: approvalMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isSubmitting: submitMutation.isPending,
    refetch,
  };
}

// ============================================
// Engagement Letter Hook
// ============================================

export function useEngagementLetter(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch engagement letter
  const {
    data: letter,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['engagement-letter', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_letters')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('status', 'draft')
        .or('status.eq.pending_client,status.eq.signed')
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as EngagementLetter | null;
    },
    enabled: !!engagementId,
  });

  // Save letter
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<EngagementLetter>) => {
      const validation = validateEngagementLetter(data);
      if (!validation.isValid) {
        throw new Error(validation.errors[0].message);
      }

      const payload = {
        ...data,
        engagement_id: engagementId,
        updated_at: new Date().toISOString(),
      };

      if (letter?.id) {
        const { data: result, error } = await supabase
          .from('engagement_letters')
          .update(payload)
          .eq('id', letter.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('engagement_letters')
          .insert({
            ...payload,
            version: 1,
            status: 'draft',
            generated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-letter', engagementId],
      });
      toast.success('Engagement letter saved');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save letter');
    },
  });

  // Send to client
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!letter?.id) throw new Error('Letter not found');

      // Sign as auditor
      const { error } = await supabase
        .from('engagement_letters')
        .update({
          status: 'pending_client',
          auditor_signature: {
            signed_by: user?.id,
            signed_at: new Date().toISOString(),
            title: 'Engagement Partner',
          },
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', letter.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-letter', engagementId],
      });
      toast.success('Engagement letter sent to client');
    },
  });

  // Record client signature
  const recordClientSignatureMutation = useMutation({
    mutationFn: async ({
      signedBy,
      title,
      organization,
    }: {
      signedBy: string;
      title: string;
      organization: string;
    }) => {
      if (!letter?.id) throw new Error('Letter not found');

      const { error } = await supabase
        .from('engagement_letters')
        .update({
          status: 'signed',
          client_signature: {
            signed_by: signedBy,
            signed_at: new Date().toISOString(),
            title,
            organization,
          },
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', letter.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-letter', engagementId],
      });
      toast.success('Client signature recorded');
    },
  });

  return {
    letter,
    isLoading,
    error,
    saveLetter: saveMutation.mutateAsync,
    sendToClient: sendMutation.mutateAsync,
    recordClientSignature: recordClientSignatureMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isSending: sendMutation.isPending,
    refetch,
  };
}

// ============================================
// Acceptance Workflow Hook (Main)
// ============================================

export function useEngagementAcceptance(engagementId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  // Get all sub-hooks data
  const independence = useIndependenceDeclarations(engagementId);
  const riskAssessment = useClientRiskAssessment(engagementId);
  const engagementLetter = useEngagementLetter(engagementId);

  // Fetch acceptance workflow state
  const {
    data: workflow,
    isLoading: workflowLoading,
    refetch: refetchWorkflow,
  } = useQuery({
    queryKey: ['acceptance-workflow', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('acceptance_workflows')
        .select('*')
        .eq('engagement_id', engagementId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create initial workflow
        const { data: newWorkflow, error: createError } = await supabase
          .from('acceptance_workflows')
          .insert({
            engagement_id: engagementId,
            current_stage: 'independence_check',
            completed_stages: [],
            is_independence_confirmed: false,
            is_risk_assessment_complete: false,
            is_engagement_letter_signed: false,
            requires_partner_approval: false,
            partner_approval_status: 'not_required',
            is_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) throw createError;
        return newWorkflow as AcceptanceWorkflow;
      }

      return data as AcceptanceWorkflow;
    },
    enabled: !!engagementId,
  });

  // Calculate current stage
  const currentStage = useMemo((): AcceptanceStage => {
    if (!workflow) return 'independence_check';

    if (!workflow.isIndependenceConfirmed) return 'independence_check';
    if (!workflow.isRiskAssessmentComplete) return 'risk_assessment';
    if (!workflow.isEngagementLetterSigned) return 'engagement_letter';
    if (workflow.requiresPartnerApproval && workflow.partnerApprovalStatus === 'pending') {
      return 'partner_approval';
    }

    return 'complete';
  }, [workflow]);

  // Stage completion status
  const stageStatus = useMemo(() => {
    return {
      independence_check: {
        complete: workflow?.isIndependenceConfirmed || false,
        current: currentStage === 'independence_check',
        data: independence.overallIndependence,
      },
      risk_assessment: {
        complete: workflow?.isRiskAssessmentComplete || false,
        current: currentStage === 'risk_assessment',
        data: riskAssessment.assessment,
      },
      engagement_letter: {
        complete: workflow?.isEngagementLetterSigned || false,
        current: currentStage === 'engagement_letter',
        data: engagementLetter.letter,
      },
      partner_approval: {
        complete: workflow?.partnerApprovalStatus === 'approved',
        current: currentStage === 'partner_approval',
        required: workflow?.requiresPartnerApproval || false,
      },
    };
  }, [workflow, currentStage, independence, riskAssessment, engagementLetter]);

  // Update workflow stage
  const updateWorkflowMutation = useMutation({
    mutationFn: async (updates: Partial<AcceptanceWorkflow>) => {
      if (!workflow?.id) throw new Error('Workflow not found');

      const { error } = await supabase
        .from('acceptance_workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['acceptance-workflow', engagementId],
      });
    },
  });

  // Complete independence stage
  const completeIndependence = useCallback(async () => {
    if (!independence.overallIndependence?.isIndependent) {
      toast.error('Cannot confirm independence - issues remain');
      return;
    }

    await updateWorkflowMutation.mutateAsync({
      isIndependenceConfirmed: true,
      completedStages: [...(workflow?.completedStages || []), 'independence_check'],
      currentStage: 'risk_assessment',
    });

    toast.success('Independence confirmed');
  }, [independence.overallIndependence, workflow, updateWorkflowMutation]);

  // Complete risk assessment stage
  const completeRiskAssessment = useCallback(async () => {
    if (!riskAssessment.assessment?.isComplete) {
      toast.error('Risk assessment is not complete');
      return;
    }

    const requiresPartnerApproval = determinePartnerApprovalRequired(riskAssessment.assessment);

    await updateWorkflowMutation.mutateAsync({
      isRiskAssessmentComplete: true,
      completedStages: [...(workflow?.completedStages || []), 'risk_assessment'],
      currentStage: 'engagement_letter',
      requiresPartnerApproval,
      partnerApprovalStatus: requiresPartnerApproval ? 'pending' : 'not_required',
    });

    toast.success('Risk assessment completed');
  }, [riskAssessment.assessment, workflow, updateWorkflowMutation]);

  // Complete engagement letter stage
  const completeEngagementLetter = useCallback(async () => {
    if (engagementLetter.letter?.status !== 'signed') {
      toast.error('Engagement letter has not been signed');
      return;
    }

    await updateWorkflowMutation.mutateAsync({
      isEngagementLetterSigned: true,
      completedStages: [...(workflow?.completedStages || []), 'engagement_letter'],
      currentStage: workflow?.requiresPartnerApproval ? 'partner_approval' : 'complete',
    });

    toast.success('Engagement letter signed');
  }, [engagementLetter.letter, workflow, updateWorkflowMutation]);

  // Complete acceptance (final step)
  const completeAcceptance = useCallback(async () => {
    if (!workflow) return;

    const completion = canCompleteAcceptance(workflow);
    if (!completion.canComplete) {
      toast.error(completion.blockers[0]);
      return;
    }

    // Update engagement status
    const { error: engagementError } = await supabase
      .from('engagements')
      .update({
        status: 'accepted',
        independence_confirmed: true,
        client_accepted: true,
        engagement_letter_signed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', engagementId);

    if (engagementError) throw engagementError;

    // Mark workflow complete
    await updateWorkflowMutation.mutateAsync({
      isComplete: true,
      completedAt: new Date(),
      completedStages: [...(workflow.completedStages || []), 'complete'],
      currentStage: 'complete',
    });

    toast.success('Engagement accepted successfully');
  }, [workflow, engagementId, updateWorkflowMutation]);

  // Check if user is partner
  const isPartner = profile?.role === 'partner' || profile?.role === 'admin';

  return {
    // Sub-module data
    independence,
    riskAssessment,
    engagementLetter,

    // Workflow state
    workflow,
    currentStage,
    stageStatus,
    isLoading:
      workflowLoading ||
      independence.isLoading ||
      riskAssessment.isLoading ||
      engagementLetter.isLoading,

    // Actions
    completeIndependence,
    completeRiskAssessment,
    completeEngagementLetter,
    completeAcceptance,

    // Permissions
    isPartner,
    canCompleteAcceptance: workflow ? canCompleteAcceptance(workflow) : { canComplete: false, blockers: [] },

    // Refresh
    refetch: async () => {
      await Promise.all([
        refetchWorkflow(),
        independence.refetch(),
        riskAssessment.refetch(),
        engagementLetter.refetch(),
      ]);
    },
  };
}
