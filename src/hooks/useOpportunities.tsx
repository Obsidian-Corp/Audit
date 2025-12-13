import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Opportunity {
  id: string;
  firm_id: string;
  client_id?: string;
  opportunity_name: string;
  opportunity_type?: string;
  description?: string;
  stage: string;
  stage_changed_at: string;
  estimated_value?: number;
  probability?: number;
  expected_close_date?: string;
  owner_id?: string;
  won_date?: string;
  lost_date?: string;
  lost_reason?: string;
  competitor?: string;
  proposal_sent_date?: string;
  proposal_document_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useOpportunities = (stage?: string) => {
  return useQuery({
    queryKey: ['opportunities', stage],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select(`
          *,
          client:clients(id, client_name),
          owner:profiles!opportunities_owner_id_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useClientOpportunities = (clientId: string) => {
  return useQuery({
    queryKey: ['opportunities', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Opportunity[];
    },
    enabled: !!clientId,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newOpportunity: Partial<Opportunity>) => {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([newOpportunity as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({
        title: 'Opportunity created',
        description: 'The opportunity has been successfully added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create opportunity.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Opportunity> }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({
        title: 'Opportunity updated',
        description: 'The opportunity has been successfully updated.',
      });
    },
  });
};

export const useDeleteOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({
        title: 'Opportunity deleted',
        description: 'The opportunity has been successfully removed.',
      });
    },
  });
};
