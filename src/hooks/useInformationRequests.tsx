import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InformationRequest {
  id: string;
  engagement_id: string;
  request_title: string;
  description: string;
  items_requested: string[];
  requested_by: string;
  assigned_to?: string; // Client user
  due_date: string;
  status: 'draft' | 'sent' | 'acknowledged' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_response?: string;
  response_date?: string;
  created_at: string;
  updated_at: string;
}

export interface InformationRequestFilters {
  engagement_id?: string;
  status?: string;
  assigned_to?: string;
}

export const useInformationRequests = (filters?: InformationRequestFilters) => {
  return useQuery({
    queryKey: ['information-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('information_requests')
        .select(`
          *,
          engagement:audits!information_requests_engagement_id_fkey(id, audit_title, audit_number, clients(client_name)),
          requester:profiles!information_requests_requested_by_fkey(id, full_name),
          assignee:profiles!information_requests_assigned_to_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.engagement_id) {
        query = query.eq('engagement_id', filters.engagement_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InformationRequest[];
    },
  });
};

export const useRequestDetails = (requestId: string) => {
  return useQuery({
    queryKey: ['information-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('information_requests')
        .select(`
          *,
          engagement:audits!information_requests_engagement_id_fkey(*),
          requester:profiles!information_requests_requested_by_fkey(*),
          assignee:profiles!information_requests_assigned_to_fkey(*),
          documents:information_request_documents(*)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });
};

export const useCreateInformationRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newRequest: Partial<InformationRequest>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('information_requests')
        .insert([{
          ...newRequest,
          requested_by: user.id,
          status: newRequest.status || 'draft',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
      toast({
        title: 'Request created',
        description: 'Information request has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create information request.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateInformationRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InformationRequest> }) => {
      const { data, error } = await supabase
        .from('information_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
      queryClient.invalidateQueries({ queryKey: ['information-request', variables.id] });
      toast({
        title: 'Request updated',
        description: 'Information request has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update information request.',
        variant: 'destructive',
      });
    },
  });
};

export const useSendRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('information_requests')
        .update({ status: 'sent' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Send notification to assigned client user

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
      toast({
        title: 'Request sent',
        description: 'The information request has been sent to the client.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send request.',
        variant: 'destructive',
      });
    },
  });
};

export const useClientAcknowledgeRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase
        .from('information_requests')
        .update({ status: 'acknowledged' })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
      toast({
        title: 'Request acknowledged',
        description: 'You have acknowledged this information request.',
      });
    },
  });
};

export const useClientRespondToRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: string }) => {
      const { data, error } = await supabase
        .from('information_requests')
        .update({
          status: 'completed',
          client_response: response,
          response_date: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
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

export const useDeleteInformationRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('information_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['information-requests'] });
      toast({
        title: 'Request deleted',
        description: 'The information request has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete information request.',
        variant: 'destructive',
      });
    },
  });
};
