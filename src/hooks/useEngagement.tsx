/**
 * useEngagement Hook
 * Comprehensive hook for managing engagement data in the Engagement Detail Page
 * Issue #1: Missing Engagement Detail Page
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Engagement {
  id: string;
  audit_number: string;
  audit_title: string;
  client_id: string;
  firm_id: string;
  workflow_status: string;
  engagement_phase: string;
  progress_percentage: number;
  budget_allocated?: number;
  budget_spent?: number;
  budget_hours?: number;
  actual_hours?: number;
  hours_allocated?: number;
  hours_spent?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  created_by: string;
  clients?: {
    id: string;
    client_name: string;
  };
}

export interface EngagementActivity {
  id: string;
  engagement_id: string;
  user_id: string;
  activity_type: string;
  description: string;
  metadata?: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

/**
 * Hook to fetch engagement details with team and client info
 */
export function useEngagement(engagementId: string) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['engagement', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select(`
          *,
          clients(id, client_name, client_type, industry, entity_type),
          profiles:created_by(full_name, email)
        `)
        .eq('id', engagementId)
        .single();

      if (error) {
        toast({
          title: 'Error loading engagement',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      return data as Engagement;
    },
    enabled: !!engagementId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch engagement activity feed
 */
export function useEngagementActivity(engagementId: string, limit = 20) {
  return useQuery({
    queryKey: ['engagement-activity', engagementId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_activity')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as EngagementActivity[];
    },
    enabled: !!engagementId,
  });
}

/**
 * Hook to calculate and fetch engagement progress
 */
export function useEngagementProgress(engagementId: string) {
  return useQuery({
    queryKey: ['engagement-progress', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('calculate_engagement_progress', {
          engagement_id_param: engagementId,
        });

      if (error) throw error;
      return data as number;
    },
    enabled: !!engagementId,
    refetchInterval: 1000 * 60, // Refresh every minute
  });
}

/**
 * Hook to fetch engagement team members
 */
export function useEngagementTeam(engagementId: string) {
  return useQuery({
    queryKey: ['engagement-team', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_team_members')
        .select(`
          *,
          profiles(id, full_name, email, avatar_url)
        `)
        .eq('engagement_id', engagementId)
        .order('role');

      if (error) throw error;
      return data || [];
    },
    enabled: !!engagementId,
  });
}

/**
 * Hook to update engagement phase
 */
export function useUpdateEngagementPhase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagementId,
      phase,
    }: {
      engagementId: string;
      phase: string;
    }) => {
      const { data, error } = await supabase
        .from('audits')
        .update({ engagement_phase: phase })
        .eq('id', engagementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-activity', variables.engagementId] });
      toast({
        title: 'Phase updated',
        description: 'Engagement phase has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating phase',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update engagement status
 */
export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagementId,
      status,
    }: {
      engagementId: string;
      status: string;
    }) => {
      const { data, error } = await supabase
        .from('audits')
        .update({ workflow_status: status })
        .eq('id', engagementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['engagement', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-activity', variables.engagementId] });
      toast({
        title: 'Status updated',
        description: 'Engagement status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to log engagement activity manually
 */
export function useLogEngagementActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      engagementId,
      activityType,
      description,
      metadata,
    }: {
      engagementId: string;
      activityType: string;
      description: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase.rpc('log_engagement_activity', {
        engagement_id_param: engagementId,
        activity_type_param: activityType,
        description_param: description,
        metadata_param: metadata,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['engagement-activity', variables.engagementId],
      });
    },
  });
}

/**
 * Hook to subscribe to real-time engagement updates
 */
export function useEngagementRealtime(engagementId: string) {
  const queryClient = useQueryClient();

  // Subscribe to engagement changes
  useQuery({
    queryKey: ['engagement-realtime', engagementId],
    queryFn: () => {
      const channel = supabase
        .channel(`engagement-${engagementId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'audits',
            filter: `id=eq.${engagementId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['engagement', engagementId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'engagement_activity',
            filter: `engagement_id=eq.${engagementId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['engagement-activity', engagementId] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    enabled: !!engagementId,
  });
}
