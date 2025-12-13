import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Finding {
  id: string;
  firm_id: string;
  engagement_id: string;
  finding_number: string;
  finding_title: string;
  issue: string;
  impact: string;
  recommendation: string;
  risk_rating: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  status: 'draft' | 'review' | 'discussed' | 'finalized' | 'included_in_report';
  identified_by: string;
  identified_date: string;
  owner_id?: string;
  client_response?: string;
  client_agreed?: boolean;
  management_response?: string;
  target_resolution_date?: string;
  actual_resolution_date?: string;
  evidence_references?: string[];
  workpaper_references?: string[];
  is_client_facing: boolean;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FindingFilters {
  engagement_id?: string;
  status?: string;
  risk_rating?: string;
  category?: string;
}

export const useFindings = (filters?: FindingFilters) => {
  return useQuery({
    queryKey: ['findings', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select(`
          *,
          engagement:audits!audit_findings_engagement_id_fkey(id, audit_title, audit_number, clients(client_name)),
          identifier:profiles!audit_findings_identified_by_fkey(id, full_name),
          owner:profiles!audit_findings_owner_id_fkey(id, full_name)
        `)
        .order('identified_date', { ascending: false });

      if (filters?.engagement_id) {
        query = query.eq('engagement_id', filters.engagement_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.risk_rating) {
        query = query.eq('risk_rating', filters.risk_rating);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Finding[];
    },
  });
};

export const useFindingDetails = (findingId: string) => {
  return useQuery({
    queryKey: ['finding', findingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select(`
          *,
          engagement:audits!audit_findings_engagement_id_fkey(*),
          identifier:profiles!audit_findings_identified_by_fkey(*),
          owner:profiles!audit_findings_owner_id_fkey(*),
          discussion_history:finding_discussions(*)
        `)
        .eq('id', findingId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!findingId,
  });
};

export const useEngagementFindings = (engagementId: string) => {
  return useQuery({
    queryKey: ['engagement-findings', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select(`
          *,
          identifier:profiles!audit_findings_identified_by_fkey(full_name),
          owner:profiles!audit_findings_owner_id_fkey(full_name)
        `)
        .eq('engagement_id', engagementId)
        .order('risk_rating', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!engagementId,
  });
};

export const useFindingsSummary = (engagementId?: string) => {
  return useQuery({
    queryKey: ['findings-summary', engagementId],
    queryFn: async () => {
      let query = supabase.from('audit_findings').select('risk_rating, status');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const summary = {
        total: data.length,
        critical: data.filter(f => f.risk_rating === 'critical').length,
        high: data.filter(f => f.risk_rating === 'high').length,
        medium: data.filter(f => f.risk_rating === 'medium').length,
        low: data.filter(f => f.risk_rating === 'low').length,
        draft: data.filter(f => f.status === 'draft').length,
        review: data.filter(f => f.status === 'review').length,
        discussed: data.filter(f => f.status === 'discussed').length,
        finalized: data.filter(f => f.status === 'finalized').length,
        in_report: data.filter(f => f.status === 'included_in_report').length,
      };

      return summary;
    },
  });
};

export const useCreateFinding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newFinding: Partial<Finding>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate finding number
      const { data: lastFinding } = await supabase
        .from('audit_findings')
        .select('finding_number')
        .eq('engagement_id', newFinding.engagement_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastFinding ? parseInt(lastFinding.finding_number.split('-')[1]) : 0;
      const findingNumber = `F-${String(lastNumber + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('audit_findings')
        .insert([{
          ...newFinding,
          finding_number: findingNumber,
          identified_by: user.id,
          identified_date: newFinding.identified_date || new Date().toISOString(),
          status: newFinding.status || 'draft',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['findings-summary'] });
      toast({
        title: 'Finding created',
        description: 'The audit finding has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create finding.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFinding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Finding> }) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['finding', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['findings-summary'] });
      toast({
        title: 'Finding updated',
        description: 'The finding has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update finding.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteFinding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_findings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['findings-summary'] });
      toast({
        title: 'Finding deleted',
        description: 'The finding has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete finding.',
        variant: 'destructive',
      });
    },
  });
};

export const useShareFindingWithClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (findingId: string) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update({
          status: 'discussed',
          is_client_facing: true,
        })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Send notification to client

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      toast({
        title: 'Finding shared',
        description: 'The finding has been shared with the client for discussion.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share finding.',
        variant: 'destructive',
      });
    },
  });
};

export const useClientRespondToFinding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      findingId,
      response,
      agreed,
      managementResponse,
      targetDate,
    }: {
      findingId: string;
      response: string;
      agreed: boolean;
      managementResponse?: string;
      targetDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update({
          client_response: response,
          client_agreed: agreed,
          management_response: managementResponse,
          target_resolution_date: targetDate,
        })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      toast({
        title: 'Response submitted',
        description: 'Your response has been submitted to the auditor.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit response.',
        variant: 'destructive',
      });
    },
  });
};

export const useFinalizeFinding = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (findingId: string) => {
      const { data, error } = await supabase
        .from('audit_findings')
        .update({ status: 'finalized' })
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['findings-summary'] });
      toast({
        title: 'Finding finalized',
        description: 'The finding has been finalized and is ready for the report.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to finalize finding.',
        variant: 'destructive',
      });
    },
  });
};
