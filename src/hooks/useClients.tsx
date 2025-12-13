import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Client {
  id: string;
  firm_id: string;
  client_name: string;
  client_code?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  status: string;
  client_type?: string;
  risk_rating?: string;
  retention_status?: string;
  annual_revenue?: number;
  contract_value?: number;
  relationship_manager_id?: string;
  account_manager_id?: string;
  client_since?: string;
  last_engagement_date?: string;
  next_renewal_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFilters {
  status?: string;
  industry?: string;
  risk_rating?: string;
  search?: string;
}

export const useClients = (filters?: ClientFilters) => {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .order('client_name');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.risk_rating) {
        query = query.eq('risk_rating', filters.risk_rating);
      }
      if (filters?.search) {
        query = query.or(`client_name.ilike.%${filters.search}%,client_code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
  });
};

export const useClientDetails = (clientId: string) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          relationship_manager:profiles!clients_relationship_manager_id_fkey(id, full_name, email),
          account_manager:profiles!clients_account_manager_id_fkey(id, full_name, email)
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newClient: Partial<Client>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([newClient as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client created',
        description: 'The client has been successfully added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create client.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      toast({
        title: 'Client updated',
        description: 'The client has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Client deleted',
        description: 'The client has been successfully removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client.',
        variant: 'destructive',
      });
    },
  });
};
