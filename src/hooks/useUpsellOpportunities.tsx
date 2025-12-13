import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UpsellOpportunity {
  id: string;
  firm_id: string;
  client_id: string;
  opportunity_type: 'upsell' | 'cross-sell' | 'renewal_expansion';
  service_suggested: string;
  estimated_value?: number;
  identified_by: 'manual' | 'ai_suggestion' | 'pattern_detection';
  identification_reason?: string;
  confidence_score?: number;
  status: 'identified' | 'contacted' | 'proposal_sent' | 'won' | 'lost' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useUpsellOpportunities = (clientId?: string) => {
  return useQuery({
    queryKey: ['upsell-opportunities', clientId],
    queryFn: async () => {
      let query = supabase
        .from('upsell_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UpsellOpportunity[];
    },
  });
};

export const useCreateUpsellOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (opportunity: Partial<UpsellOpportunity>) => {
      const { data, error } = await supabase
        .from('upsell_opportunities')
        .insert([opportunity as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-opportunities'] });
      toast({
        title: 'Upsell opportunity created',
        description: 'Growth opportunity has been added.',
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

export const useUpdateUpsellOpportunity = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UpsellOpportunity> }) => {
      const { data, error } = await supabase
        .from('upsell_opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell-opportunities'] });
      toast({
        title: 'Opportunity updated',
        description: 'Growth opportunity has been updated.',
      });
    },
  });
};
