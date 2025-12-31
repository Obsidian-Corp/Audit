/**
 * useProcedureExecution Hook
 * Ticket: FEAT-004
 *
 * Enhanced procedure execution hook with workflow status management,
 * workpaper linking, time tracking, and sign-off integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useCallback } from 'react';

// Type definitions
export type ProcedureWorkflowStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'signed_off'
  | 'not_applicable';

export type ProcedurePriority = 'low' | 'normal' | 'high' | 'critical';

export interface ProcedureExecution {
  id: string;
  engagement_id: string;
  engagement_program_id: string | null;
  procedure_id: string | null;
  name: string;
  description: string | null;
  instructions: Record<string, any> | null;

  // Assignment
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  priority: ProcedurePriority;

  // Workflow status
  status: string; // Legacy status
  workflow_status: ProcedureWorkflowStatus;

  // Timestamps
  started_at: string | null;
  completed_at: string | null;
  prepared_at: string | null;
  reviewed_at: string | null;

  // Sign-off tracking
  prepared_by: string | null;
  reviewed_by: string | null;

  // Workpaper link
  primary_workpaper_id: string | null;
  procedure_reference: string | null;

  // Time tracking
  estimated_hours: number | null;
  actual_hours: number | null;

  // Rollforward
  is_rolled_forward: boolean;
  prior_year_procedure_id: string | null;
  rollforward_notes: string | null;

  // Results
  conclusion: string | null;
  exceptions_noted: string | null;
  evidence_collected: string[] | null;

  created_at: string;
  updated_at: string;

  // Joined data
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  reviewed_by_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  engagement_programs?: {
    id: string;
    program_name: string;
  } | null;
  primary_workpaper?: {
    id: string;
    title: string;
    review_status: string;
  } | null;
}

export interface ProcedureStats {
  total: number;
  not_started: number;
  in_progress: number;
  pending_review: number;
  approved: number;
  signed_off: number;
  not_applicable: number;
  overdue: number;
  dueToday: number;
  dueSoon: number; // Within 3 days
}

interface StartProcedureParams {
  procedureId: string;
  workpaperId?: string;
}

interface CompleteProcedureParams {
  procedureId: string;
  conclusion: string;
  exceptionsNoted?: string;
  actualHours?: number;
}

interface SubmitForReviewParams {
  procedureId: string;
  reviewerId?: string;
}

interface ReviewProcedureParams {
  procedureId: string;
  action: 'approve' | 'request_changes';
  comments?: string;
}

interface UpdateProcedureParams {
  procedureId: string;
  updates: Partial<{
    name: string;
    description: string;
    instructions: Record<string, any>;
    assigned_to: string;
    due_date: string;
    priority: ProcedurePriority;
    estimated_hours: number;
    primary_workpaper_id: string;
    conclusion: string;
    exceptions_noted: string;
    evidence_collected: string[];
  }>;
}

interface LogTimeParams {
  procedureId: string;
  hours: number;
  description?: string;
}

/**
 * Hook for managing procedure execution workflow
 * @param engagementId - The engagement to fetch procedures for
 * @param options - Additional options
 */
export function useProcedureExecution(
  engagementId: string | undefined,
  options: {
    assignedTo?: string;
    workflowStatus?: ProcedureWorkflowStatus | ProcedureWorkflowStatus[];
    programId?: string;
  } = {}
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { assignedTo, workflowStatus, programId } = options;

  // Query: Get procedures
  const {
    data: procedures,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['procedure-execution', engagementId, assignedTo, workflowStatus, programId],
    queryFn: async () => {
      if (!engagementId) return [];

      let query = supabase
        .from('audit_procedures')
        .select(`
          *,
          profiles:assigned_to (
            id,
            full_name,
            email,
            avatar_url
          ),
          reviewed_by_profile:reviewed_by (
            id,
            full_name,
            email
          ),
          engagement_programs (
            id,
            program_name
          ),
          primary_workpaper:primary_workpaper_id (
            id,
            title,
            review_status
          )
        `)
        .eq('engagement_id', engagementId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      if (workflowStatus) {
        const statuses = Array.isArray(workflowStatus) ? workflowStatus : [workflowStatus];
        query = query.in('workflow_status', statuses);
      }

      if (programId) {
        query = query.eq('engagement_program_id', programId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProcedureExecution[];
    },
    enabled: !!engagementId,
    staleTime: 30 * 1000,
  });

  // Compute statistics
  const stats = useMemo((): ProcedureStats => {
    if (!procedures || procedures.length === 0) {
      return {
        total: 0,
        not_started: 0,
        in_progress: 0,
        pending_review: 0,
        approved: 0,
        signed_off: 0,
        not_applicable: 0,
        overdue: 0,
        dueToday: 0,
        dueSoon: 0,
      };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    return {
      total: procedures.length,
      not_started: procedures.filter((p) => p.workflow_status === 'not_started').length,
      in_progress: procedures.filter((p) =>
        ['in_progress', 'changes_requested'].includes(p.workflow_status)
      ).length,
      pending_review: procedures.filter((p) =>
        ['pending_review', 'in_review'].includes(p.workflow_status)
      ).length,
      approved: procedures.filter((p) => p.workflow_status === 'approved').length,
      signed_off: procedures.filter((p) => p.workflow_status === 'signed_off').length,
      not_applicable: procedures.filter((p) => p.workflow_status === 'not_applicable').length,
      overdue: procedures.filter((p) =>
        p.due_date && p.due_date < today && !['signed_off', 'not_applicable'].includes(p.workflow_status)
      ).length,
      dueToday: procedures.filter((p) => p.due_date === today).length,
      dueSoon: procedures.filter((p) =>
        p.due_date && p.due_date > today && p.due_date <= threeDaysFromNow
      ).length,
    };
  }, [procedures]);

  // Mutation: Start procedure
  const startProcedureMutation = useMutation({
    mutationFn: async ({ procedureId, workpaperId }: StartProcedureParams) => {
      const updates: Record<string, any> = {
        workflow_status: 'in_progress',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      };

      if (workpaperId) {
        updates.primary_workpaper_id = workpaperId;
      }

      const { data, error } = await supabase
        .from('audit_procedures')
        .update(updates)
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-procedure-stats', engagementId] });
      toast({
        title: 'Procedure started',
        description: 'You have started working on this procedure.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Complete procedure (mark work as done, ready for review)
  const completeProcedureMutation = useMutation({
    mutationFn: async ({ procedureId, conclusion, exceptionsNoted, actualHours }: CompleteProcedureParams) => {
      const updates: Record<string, any> = {
        conclusion,
        exceptions_noted: exceptionsNoted || null,
        completed_at: new Date().toISOString(),
      };

      if (actualHours !== undefined) {
        updates.actual_hours = actualHours;
      }

      const { data, error } = await supabase
        .from('audit_procedures')
        .update(updates)
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      toast({
        title: 'Work completed',
        description: 'Your conclusion has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Submit for review
  const submitForReviewMutation = useMutation({
    mutationFn: async ({ procedureId, reviewerId }: SubmitForReviewParams) => {
      const updates: Record<string, any> = {
        workflow_status: 'pending_review',
        status: 'pending_review',
        prepared_at: new Date().toISOString(),
        prepared_by: user?.id,
      };

      // If workpaper is linked, also update its status
      const { data: procedure } = await supabase
        .from('audit_procedures')
        .select('primary_workpaper_id')
        .eq('id', procedureId)
        .single();

      if (procedure?.primary_workpaper_id) {
        await supabase
          .from('audit_workpapers')
          .update({
            review_status: 'pending_review',
            prepared_at: new Date().toISOString(),
            current_reviewer_id: reviewerId || null,
          })
          .eq('id', procedure.primary_workpaper_id);
      }

      const { data, error } = await supabase
        .from('audit_procedures')
        .update(updates)
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-procedure-stats', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['workpapers'] });
      toast({
        title: 'Submitted for review',
        description: 'The procedure has been submitted for review.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit for review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Review procedure (approve or request changes)
  const reviewProcedureMutation = useMutation({
    mutationFn: async ({ procedureId, action, comments }: ReviewProcedureParams) => {
      const updates: Record<string, any> = {
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      };

      if (action === 'approve') {
        updates.workflow_status = 'approved';
        updates.status = 'approved';
      } else {
        updates.workflow_status = 'changes_requested';
        updates.status = 'changes_requested';
      }

      // Get workpaper to update its status too
      const { data: procedure } = await supabase
        .from('audit_procedures')
        .select('primary_workpaper_id')
        .eq('id', procedureId)
        .single();

      if (procedure?.primary_workpaper_id) {
        await supabase
          .from('audit_workpapers')
          .update({
            review_status: action === 'approve' ? 'approved' : 'changes_requested',
            current_reviewer_id: null,
          })
          .eq('id', procedure.primary_workpaper_id);

        // Add review note if comments provided
        if (comments) {
          await supabase.from('review_notes').insert({
            workpaper_id: procedure.primary_workpaper_id,
            created_by: user?.id,
            content: comments,
            note_type: action === 'approve' ? 'comment' : 'issue',
            status: action === 'approve' ? 'resolved' : 'open',
          });
        }
      }

      const { data, error } = await supabase
        .from('audit_procedures')
        .update(updates)
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-procedure-stats', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['workpapers'] });
      queryClient.invalidateQueries({ queryKey: ['review-notes'] });

      toast({
        title: variables.action === 'approve' ? 'Procedure approved' : 'Changes requested',
        description:
          variables.action === 'approve'
            ? 'The procedure has been approved.'
            : 'Changes have been requested from the preparer.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Review failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Mark as not applicable
  const markNotApplicableMutation = useMutation({
    mutationFn: async (procedureId: string) => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .update({
          workflow_status: 'not_applicable',
          status: 'not_applicable',
        })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-procedure-stats', engagementId] });
      toast({
        title: 'Marked as N/A',
        description: 'The procedure has been marked as not applicable.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update procedure
  const updateProcedureMutation = useMutation({
    mutationFn: async ({ procedureId, updates }: UpdateProcedureParams) => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data as ProcedureExecution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      toast({
        title: 'Procedure updated',
        description: 'The procedure has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Log time
  const logTimeMutation = useMutation({
    mutationFn: async ({ procedureId, hours, description }: LogTimeParams) => {
      // Get current actual hours
      const { data: procedure } = await supabase
        .from('audit_procedures')
        .select('actual_hours')
        .eq('id', procedureId)
        .single();

      const currentHours = procedure?.actual_hours || 0;
      const newHours = currentHours + hours;

      const { data, error } = await supabase
        .from('audit_procedures')
        .update({ actual_hours: newHours })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Also create a time entry record for detailed tracking
      // await supabase.from('time_entries').insert({ ... });

      return data as ProcedureExecution;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      toast({
        title: 'Time logged',
        description: `${variables.hours} hour(s) have been logged.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to log time',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Get procedures by status
  const getProceduresByStatus = useCallback(
    (status: ProcedureWorkflowStatus | ProcedureWorkflowStatus[]): ProcedureExecution[] => {
      const statuses = Array.isArray(status) ? status : [status];
      return procedures?.filter((p) => statuses.includes(p.workflow_status)) || [];
    },
    [procedures]
  );

  // Helper: Get my procedures
  const getMyProcedures = useCallback((): ProcedureExecution[] => {
    return procedures?.filter((p) => p.assigned_to === user?.id) || [];
  }, [procedures, user?.id]);

  // Helper: Get overdue procedures
  const getOverdueProcedures = useCallback((): ProcedureExecution[] => {
    const today = new Date().toISOString().split('T')[0];
    return procedures?.filter(
      (p) =>
        p.due_date &&
        p.due_date < today &&
        !['signed_off', 'not_applicable'].includes(p.workflow_status)
    ) || [];
  }, [procedures]);

  // Helper: Get pending review for current user (reviewer)
  const getPendingMyReview = useCallback((): ProcedureExecution[] => {
    // TODO: Add reviewer assignment field to filter
    return procedures?.filter((p) => p.workflow_status === 'pending_review') || [];
  }, [procedures]);

  return {
    // Data
    procedures: procedures || [],
    stats,
    isLoading,
    error: error as Error | null,

    // Helpers
    getProceduresByStatus,
    getMyProcedures,
    getOverdueProcedures,
    getPendingMyReview,

    // Actions
    startProcedure: startProcedureMutation.mutate,
    startProcedureAsync: startProcedureMutation.mutateAsync,
    completeProcedure: completeProcedureMutation.mutate,
    completeProcedureAsync: completeProcedureMutation.mutateAsync,
    submitForReview: submitForReviewMutation.mutate,
    submitForReviewAsync: submitForReviewMutation.mutateAsync,
    reviewProcedure: reviewProcedureMutation.mutate,
    reviewProcedureAsync: reviewProcedureMutation.mutateAsync,
    markNotApplicable: markNotApplicableMutation.mutate,
    markNotApplicableAsync: markNotApplicableMutation.mutateAsync,
    updateProcedure: updateProcedureMutation.mutate,
    updateProcedureAsync: updateProcedureMutation.mutateAsync,
    logTime: logTimeMutation.mutate,
    logTimeAsync: logTimeMutation.mutateAsync,
    refetch,

    // Loading states
    isStarting: startProcedureMutation.isPending,
    isCompleting: completeProcedureMutation.isPending,
    isSubmitting: submitForReviewMutation.isPending,
    isReviewing: reviewProcedureMutation.isPending,
    isUpdating: updateProcedureMutation.isPending,
    isLoggingTime: logTimeMutation.isPending,
  };
}

export default useProcedureExecution;
