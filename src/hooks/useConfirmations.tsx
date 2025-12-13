/**
 * ==================================================================
 * USE CONFIRMATIONS HOOK
 * ==================================================================
 * Manages audit confirmation tracking (AR, AP, Bank, Legal, etc.)
 * Issue #9: Confirmation Tracker
 * ==================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  Confirmation,
  ConfirmationStats,
  CreateConfirmationInput,
  UpdateConfirmationInput,
} from '@/types/confirmations';

/**
 * Hook: Fetch all confirmations for an engagement
 */
export function useConfirmations(engagementId: string | undefined) {
  return useQuery({
    queryKey: ['confirmations', engagementId],
    queryFn: async (): Promise<Confirmation[]> => {
      if (!engagementId) return [];

      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('request_date', { ascending: false });

      if (error) throw error;
      return (data as Confirmation[]) || [];
    },
    enabled: !!engagementId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook: Fetch confirmation statistics for an engagement
 */
export function useConfirmationStats(engagementId: string | undefined) {
  return useQuery({
    queryKey: ['confirmation-stats', engagementId],
    queryFn: async (): Promise<ConfirmationStats | null> => {
      if (!engagementId) return null;

      const { data, error } = await supabase.rpc('get_confirmation_stats', {
        engagement_id_param: engagementId,
      });

      if (error) throw error;

      // RPC returns array with single row
      if (data && data.length > 0) {
        return data[0] as ConfirmationStats;
      }

      // Return empty stats if no data
      return {
        total_confirmations: 0,
        pending_count: 0,
        received_count: 0,
        exception_count: 0,
        not_responded_count: 0,
        response_rate: 0,
        overdue_count: 0,
      };
    },
    enabled: !!engagementId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Fetch single confirmation by ID
 */
export function useConfirmation(confirmationId: string | undefined) {
  return useQuery({
    queryKey: ['confirmation', confirmationId],
    queryFn: async (): Promise<Confirmation | null> => {
      if (!confirmationId) return null;

      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .eq('id', confirmationId)
        .maybeSingle();

      if (error) throw error;
      return data as Confirmation | null;
    },
    enabled: !!confirmationId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook: Fetch confirmations assigned to current user
 */
export function useMyConfirmations() {
  return useQuery({
    queryKey: ['my-confirmations'],
    queryFn: async (): Promise<Confirmation[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'exception'])
        .order('request_date', { ascending: true });

      if (error) throw error;
      return (data as Confirmation[]) || [];
    },
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook: Create new confirmation
 */
export function useCreateConfirmation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateConfirmationInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get firm_id from user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single();

      if (!profile?.firm_id) throw new Error('User firm not found');

      const { data, error } = await supabase
        .from('confirmations')
        .insert({
          ...input,
          firm_id: profile.firm_id,
          created_by: user.id,
          prepared_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as Confirmation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmations', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-stats', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['my-confirmations'] });
      toast({
        title: 'Confirmation Created',
        description: `Confirmation request for ${data.entity_name} has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Creating Confirmation',
        description: error.message || 'Failed to create confirmation.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Update existing confirmation
 */
export function useUpdateConfirmation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      confirmationId,
      updates,
    }: {
      confirmationId: string;
      updates: UpdateConfirmationInput;
    }) => {
      const { data, error } = await supabase
        .from('confirmations')
        .update(updates)
        .eq('id', confirmationId)
        .select()
        .single();

      if (error) throw error;
      return data as Confirmation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['confirmations', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-stats', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['my-confirmations'] });
      toast({
        title: 'Confirmation Updated',
        description: `Confirmation for ${data.entity_name} has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Updating Confirmation',
        description: error.message || 'Failed to update confirmation.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Delete confirmation
 */
export function useDeleteConfirmation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      confirmationId,
      engagementId,
    }: {
      confirmationId: string;
      engagementId: string;
    }) => {
      const { error } = await supabase.from('confirmations').delete().eq('id', confirmationId);

      if (error) throw error;
      return { confirmationId, engagementId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['confirmations', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-stats', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['my-confirmations'] });
      toast({
        title: 'Confirmation Deleted',
        description: 'The confirmation has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Deleting Confirmation',
        description: error.message || 'Failed to delete confirmation.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook: Mark confirmation as received
 */
export function useMarkConfirmationReceived() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      confirmationId,
      responseDate,
      responseMethod,
      hasException,
      exceptionNotes,
      exceptionAmount,
    }: {
      confirmationId: string;
      responseDate: string;
      responseMethod: string;
      hasException?: boolean;
      exceptionNotes?: string;
      exceptionAmount?: number;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('confirmations')
        .update({
          response_date: responseDate,
          response_method: responseMethod,
          status: hasException ? 'exception' : 'received',
          has_exception: hasException || false,
          exception_notes: exceptionNotes,
          exception_amount: exceptionAmount,
          reviewed_by: user?.id,
        })
        .eq('id', confirmationId)
        .select()
        .single();

      if (error) throw error;
      return data as Confirmation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['confirmations', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['confirmation-stats', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['my-confirmations'] });
      toast({
        title: 'Confirmation Marked as Received',
        description: data.has_exception
          ? `Exception noted for ${data.entity_name}.`
          : `Response received from ${data.entity_name}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update confirmation.',
        variant: 'destructive',
      });
    },
  });
}
