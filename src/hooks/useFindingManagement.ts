/**
 * useFindingManagement Hook
 * Ticket: FEAT-005
 *
 * Enhanced finding management with source linking (procedure/workpaper),
 * repeat finding detection, and management response tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo, useCallback } from 'react';

// Type definitions
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'observation';
export type FindingStatus = 'identified' | 'open' | 'discussed' | 'resolved' | 'closed';
export type RemediationStatus = 'pending' | 'in_progress' | 'implemented' | 'verified' | 'not_remediated';

export interface Finding {
  id: string;
  engagement_id: string;
  firm_id: string;

  // Identification
  title: string;
  finding_reference: string | null;
  description: string | null;
  severity: FindingSeverity;
  status: FindingStatus;

  // Source linking
  source_procedure_id: string | null;
  source_workpaper_id: string | null;

  // Details
  criteria: string | null;
  condition: string | null;
  cause: string | null;
  effect: string | null;
  recommendation: string | null;

  // Repeat finding
  is_repeat_finding: boolean;
  prior_year_finding_id: string | null;

  // Management response
  management_response: string | null;
  management_response_date: string | null;
  management_response_by: string | null;

  // Remediation
  remediation_deadline: string | null;
  remediation_status: RemediationStatus;

  // Metadata
  identified_by: string | null;
  identified_date: string | null;
  owner_id: string | null;
  category: string | null;

  created_at: string;
  updated_at: string;

  // Joined data
  identifier_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  owner_profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  source_procedure?: {
    id: string;
    name: string;
    procedure_reference: string | null;
  } | null;
  source_workpaper?: {
    id: string;
    title: string;
    workpaper_reference: string | null;
  } | null;
  prior_year_finding?: {
    id: string;
    title: string;
    finding_reference: string | null;
  } | null;
}

export interface FindingStats {
  total: number;
  bySeverity: Record<FindingSeverity, number>;
  byStatus: Record<FindingStatus, number>;
  repeatFindings: number;
  pendingRemediation: number;
  overdueRemediation: number;
}

interface CreateFindingParams {
  engagementId: string;
  title: string;
  severity: FindingSeverity;
  description?: string;
  sourceProcedureId?: string;
  sourceWorkpaperId?: string;
  criteria?: string;
  condition?: string;
  cause?: string;
  effect?: string;
  recommendation?: string;
  category?: string;
  ownerId?: string;
}

interface UpdateFindingParams {
  findingId: string;
  updates: Partial<{
    title: string;
    description: string;
    severity: FindingSeverity;
    status: FindingStatus;
    criteria: string;
    condition: string;
    cause: string;
    effect: string;
    recommendation: string;
    category: string;
    owner_id: string;
    remediation_deadline: string;
    remediation_status: RemediationStatus;
  }>;
}

interface SubmitManagementResponseParams {
  findingId: string;
  response: string;
  remediationDeadline?: string;
}

interface VerifyRemediationParams {
  findingId: string;
  verified: boolean;
  notes?: string;
}

/**
 * Hook for managing audit findings
 * @param engagementId - The engagement to fetch findings for
 * @param options - Additional options
 */
export function useFindingManagement(
  engagementId: string | undefined,
  options: {
    severity?: FindingSeverity | FindingSeverity[];
    status?: FindingStatus | FindingStatus[];
    includeRepeatOnly?: boolean;
  } = {}
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { severity, status, includeRepeatOnly } = options;

  // Query: Get findings
  const {
    data: findings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['finding-management', engagementId, severity, status, includeRepeatOnly],
    queryFn: async () => {
      if (!engagementId) return [];

      let query = supabase
        .from('audit_findings')
        .select(`
          *,
          identifier_profile:identified_by (
            id,
            full_name,
            email
          ),
          owner_profile:owner_id (
            id,
            full_name,
            email
          ),
          source_procedure:source_procedure_id (
            id,
            name,
            procedure_reference
          ),
          source_workpaper:source_workpaper_id (
            id,
            title,
            workpaper_reference
          ),
          prior_year_finding:prior_year_finding_id (
            id,
            title,
            finding_reference
          )
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (severity) {
        const severities = Array.isArray(severity) ? severity : [severity];
        query = query.in('severity', severities);
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        query = query.in('status', statuses);
      }

      if (includeRepeatOnly) {
        query = query.eq('is_repeat_finding', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Finding[];
    },
    enabled: !!engagementId,
    staleTime: 30 * 1000,
  });

  // Compute statistics
  const stats = useMemo((): FindingStats => {
    if (!findings || findings.length === 0) {
      return {
        total: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, observation: 0 },
        byStatus: { identified: 0, open: 0, discussed: 0, resolved: 0, closed: 0 },
        repeatFindings: 0,
        pendingRemediation: 0,
        overdueRemediation: 0,
      };
    }

    const today = new Date().toISOString().split('T')[0];

    const bySeverity: Record<FindingSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      observation: 0,
    };

    const byStatus: Record<FindingStatus, number> = {
      identified: 0,
      open: 0,
      discussed: 0,
      resolved: 0,
      closed: 0,
    };

    let repeatFindings = 0;
    let pendingRemediation = 0;
    let overdueRemediation = 0;

    findings.forEach((f) => {
      bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;

      if (f.is_repeat_finding) repeatFindings++;

      if (['pending', 'in_progress'].includes(f.remediation_status)) {
        pendingRemediation++;
        if (f.remediation_deadline && f.remediation_deadline < today) {
          overdueRemediation++;
        }
      }
    });

    return {
      total: findings.length,
      bySeverity,
      byStatus,
      repeatFindings,
      pendingRemediation,
      overdueRemediation,
    };
  }, [findings]);

  // Mutation: Create finding
  const createFindingMutation = useMutation({
    mutationFn: async (params: CreateFindingParams) => {
      const { data: userData } = await supabase.auth.getUser();

      // Get firm_id from engagement
      const { data: engagement } = await supabase
        .from('audits')
        .select('firm_id')
        .eq('id', params.engagementId)
        .single();

      const insertData: Record<string, any> = {
        engagement_id: params.engagementId,
        firm_id: engagement?.firm_id,
        title: params.title,
        severity: params.severity,
        description: params.description || null,
        source_procedure_id: params.sourceProcedureId || null,
        source_workpaper_id: params.sourceWorkpaperId || null,
        criteria: params.criteria || null,
        condition: params.condition || null,
        cause: params.cause || null,
        effect: params.effect || null,
        recommendation: params.recommendation || null,
        category: params.category || null,
        owner_id: params.ownerId || null,
        identified_by: userData?.user?.id,
        identified_date: new Date().toISOString(),
        status: 'identified',
        remediation_status: 'pending',
      };

      const { data, error } = await supabase
        .from('audit_findings')
        .insert(insertData)
        .select(`
          *,
          identifier_profile:identified_by (
            id,
            full_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      return data as Finding;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      toast({
        title: 'Finding created',
        description: `Finding ${data.finding_reference || ''} has been created.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create finding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update finding
  const updateFindingMutation = useMutation({
    mutationFn: async ({ findingId, updates }: UpdateFindingParams) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data as Finding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      toast({
        title: 'Finding updated',
        description: 'The finding has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update finding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Submit management response
  const submitResponseMutation = useMutation({
    mutationFn: async ({ findingId, response, remediationDeadline }: SubmitManagementResponseParams) => {
      const updates: Record<string, any> = {
        management_response: response,
        management_response_date: new Date().toISOString(),
        management_response_by: user?.id,
        status: 'discussed',
        remediation_status: 'in_progress',
      };

      if (remediationDeadline) {
        updates.remediation_deadline = remediationDeadline;
      }

      const { data, error } = await supabase
        .from('audit_findings')
        .update(updates)
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data as Finding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      toast({
        title: 'Response submitted',
        description: 'Management response has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to submit response',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Verify remediation
  const verifyRemediationMutation = useMutation({
    mutationFn: async ({ findingId, verified, notes }: VerifyRemediationParams) => {
      const updates: Record<string, any> = {
        remediation_status: verified ? 'verified' : 'not_remediated',
        status: verified ? 'resolved' : 'open',
      };

      const { data, error } = await supabase
        .from('audit_findings')
        .update(updates)
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data as Finding;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      toast({
        title: variables.verified ? 'Remediation verified' : 'Remediation failed',
        description: variables.verified
          ? 'The finding has been marked as resolved.'
          : 'The finding requires further remediation.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to verify remediation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Close finding
  const closeFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update({ status: 'closed' })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data as Finding;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      toast({
        title: 'Finding closed',
        description: 'The finding has been closed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to close finding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete finding
  const deleteFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const { error } = await supabase
        .from('audit_findings')
        .delete()
        .eq('id', findingId);

      if (error) throw error;
      return findingId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      toast({
        title: 'Finding deleted',
        description: 'The finding has been deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete finding',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper: Get findings by severity
  const getFindingsBySeverity = useCallback(
    (sev: FindingSeverity | FindingSeverity[]): Finding[] => {
      const severities = Array.isArray(sev) ? sev : [sev];
      return findings?.filter((f) => severities.includes(f.severity)) || [];
    },
    [findings]
  );

  // Helper: Get critical/high findings
  const getCriticalFindings = useCallback((): Finding[] => {
    return getFindingsBySeverity(['critical', 'high']);
  }, [getFindingsBySeverity]);

  // Helper: Get findings needing response
  const getAwaitingResponse = useCallback((): Finding[] => {
    return findings?.filter(
      (f) => f.status === 'identified' && !f.management_response
    ) || [];
  }, [findings]);

  // Helper: Get findings from a specific procedure
  const getFindingsForProcedure = useCallback(
    (procedureId: string): Finding[] => {
      return findings?.filter((f) => f.source_procedure_id === procedureId) || [];
    },
    [findings]
  );

  // Helper: Get repeat findings
  const getRepeatFindings = useCallback((): Finding[] => {
    return findings?.filter((f) => f.is_repeat_finding) || [];
  }, [findings]);

  return {
    // Data
    findings: findings || [],
    stats,
    isLoading,
    error: error as Error | null,

    // Helpers
    getFindingsBySeverity,
    getCriticalFindings,
    getAwaitingResponse,
    getFindingsForProcedure,
    getRepeatFindings,

    // Actions
    createFinding: createFindingMutation.mutate,
    createFindingAsync: createFindingMutation.mutateAsync,
    updateFinding: updateFindingMutation.mutate,
    updateFindingAsync: updateFindingMutation.mutateAsync,
    submitManagementResponse: submitResponseMutation.mutate,
    submitManagementResponseAsync: submitResponseMutation.mutateAsync,
    verifyRemediation: verifyRemediationMutation.mutate,
    verifyRemediationAsync: verifyRemediationMutation.mutateAsync,
    closeFinding: closeFindingMutation.mutate,
    closeFindingAsync: closeFindingMutation.mutateAsync,
    deleteFinding: deleteFindingMutation.mutate,
    deleteFindingAsync: deleteFindingMutation.mutateAsync,
    refetch,

    // Loading states
    isCreating: createFindingMutation.isPending,
    isUpdating: updateFindingMutation.isPending,
    isSubmittingResponse: submitResponseMutation.isPending,
    isVerifying: verifyRemediationMutation.isPending,
    isClosing: closeFindingMutation.isPending,
    isDeleting: deleteFindingMutation.isPending,
  };
}

export default useFindingManagement;
