import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Proposal {
  id: string;
  firm_id: string;
  opportunity_id: string;
  proposal_number: string;
  title: string;
  description?: string;
  template_used?: string;
  status: string;
  sent_date?: string;
  viewed_date?: string;
  view_count: number;
  decision_date?: string;
  document_url?: string;
  estimated_value?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useProposals = (opportunityId?: string) => {
  return useQuery({
    queryKey: ['proposals', opportunityId],
    queryFn: async () => {
      let query = supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Proposal[];
    },
  });
};

export const useCreateProposal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newProposal: Partial<Proposal>) => {
      const { data, error } = await supabase
        .from('proposals')
        .insert([newProposal as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({
        title: 'Proposal created',
        description: 'The proposal has been successfully created.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create proposal.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateProposal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Proposal> }) => {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast({
        title: 'Proposal updated',
        description: 'The proposal has been successfully updated.',
      });
    },
  });
};
