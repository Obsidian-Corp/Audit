/**
 * ==================================================================
 * USE RISK REQUIREMENT HOOK
 * ==================================================================
 * Manages risk assessment requirement enforcement for AU-C 315 compliance
 * Issue #2: Risk-First Workflow Enforcement
 * ==================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Risk Requirement Status
 */
export interface RiskRequirement {
  id: string;
  engagement_id: string;
  firm_id: string;
  is_complete: boolean;
  completed_at: string | null;
  completed_by: string | null;
  override_allowed: boolean;
  override_justification: string | null;
  override_by: string | null;
  override_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook: Check if risk assessment is complete for engagement
 * Returns true if engagement has completed risk assessment OR has partner override
 */
export function useRiskRequirement(engagementId: string | undefined) {
  return useQuery({
    queryKey: ['risk-requirement', engagementId],
    queryFn: async (): Promise<boolean> => {
      if (!engagementId) return false;

      const { data, error } = await supabase.rpc('check_risk_assessment_complete', {
        engagement_id_param: engagementId,
      });

      if (error) {
        console.error('Error checking risk requirement:', error);
        throw error;
      }

      return data as boolean;
    },
    enabled: !!engagementId,
    staleTime: 2 * 60 * 1000, // 2 minutes (requirements don't change often)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook: Fetch full risk requirement details
 */
export function useRiskRequirementDetails(engagementId: string | undefined) {
  return useQuery({
    queryKey: ['risk-requirement-details', engagementId],
    queryFn: async (): Promise<RiskRequirement | null> => {
      if (!engagementId) return null;

      const { data, error } = await supabase
        .from('risk_assessment_requirements')
        .select('*')
        .eq('engagement_id', engagementId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!engagementId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook: Override risk requirement (partner-only)
 */
export function useOverrideRiskRequirement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagementId,
      justification,
    }: {
      engagementId: string;
      justification: string;
    }) => {
      if (!justification || justification.trim().length < 20) {
        throw new Error('Override justification must be at least 20 characters');
      }

      // Fetch current user info
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upsert risk requirement with override
      const { data, error } = await supabase
        .from('risk_assessment_requirements')
        .upsert(
          {
            engagement_id: engagementId,
            override_allowed: true,
            override_justification: justification,
            override_by: user.id,
            override_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'engagement_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as RiskRequirement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risk-requirement', variables.engagementId] });
      queryClient.invalidateQueries({
        queryKey: ['risk-requirement-details', variables.engagementId],
      });
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.engagementId] });
      toast({
        title: 'Risk Requirement Overridden',
        description:
          'The risk assessment requirement has been overridden. This action has been logged for quality control review.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Override Failed',
        description: error.message || 'Failed to override risk requirement. You may not have sufficient permissions.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Remove override (restore requirement)
 */
export function useRemoveRiskOverride() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ engagementId }: { engagementId: string }) => {
      const { data, error } = await supabase
        .from('risk_assessment_requirements')
        .update({
          override_allowed: false,
          override_justification: null,
          updated_at: new Date().toISOString(),
        })
        .eq('engagement_id', engagementId)
        .select()
        .single();

      if (error) throw error;
      return data as RiskRequirement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risk-requirement', variables.engagementId] });
      queryClient.invalidateQueries({
        queryKey: ['risk-requirement-details', variables.engagementId],
      });
      toast({
        title: 'Override Removed',
        description: 'Risk assessment requirement has been restored.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove override.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Manually mark risk requirement as complete (for migration/testing)
 */
export function useMarkRiskComplete() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ engagementId }: { engagementId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('risk_assessment_requirements')
        .upsert(
          {
            engagement_id: engagementId,
            is_complete: true,
            completed_at: new Date().toISOString(),
            completed_by: user.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'engagement_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as RiskRequirement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risk-requirement', variables.engagementId] });
      queryClient.invalidateQueries({
        queryKey: ['risk-requirement-details', variables.engagementId],
      });
      toast({
        title: 'Risk Requirement Completed',
        description: 'Risk assessment requirement marked as complete.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark requirement complete.',
        variant: 'destructive',
      });
    },
  });
}
