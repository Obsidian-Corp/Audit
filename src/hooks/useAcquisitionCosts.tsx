import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AcquisitionCost {
  id: string;
  firm_id: string;
  client_id?: string;
  opportunity_id?: string;
  cost_type: 'marketing' | 'sales' | 'travel' | 'proposal' | 'entertainment' | 'other';
  cost_amount: number;
  cost_date: string;
  description?: string;
  attributed_to?: string;
  created_at: string;
  updated_at: string;
}

export const useAcquisitionCosts = (filters?: { clientId?: string; opportunityId?: string }) => {
  return useQuery({
    queryKey: ['acquisition-costs', filters],
    queryFn: async () => {
      let query = supabase
        .from('client_acquisition_costs')
        .select('*')
        .order('cost_date', { ascending: false });

      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters?.opportunityId) {
        query = query.eq('opportunity_id', filters.opportunityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcquisitionCost[];
    },
  });
};

export const useCreateAcquisitionCost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (cost: Partial<AcquisitionCost>) => {
      const { data, error } = await supabase
        .from('client_acquisition_costs')
        .insert([cost as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acquisition-costs'] });
      toast({
        title: 'Cost recorded',
        description: 'Acquisition cost has been added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record cost.',
        variant: 'destructive',
      });
    },
  });
};
