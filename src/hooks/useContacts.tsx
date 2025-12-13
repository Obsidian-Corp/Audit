import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  title?: string;
  department?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary: boolean;
  is_decision_maker: boolean;
  relationship_strength?: string;
  communication_preference?: string;
  birthday?: string;
  work_anniversary?: string;
  notes?: string;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
}

export const useContacts = (clientId: string) => {
  return useQuery({
    queryKey: ['contacts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('last_name');

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!clientId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newContact: Partial<Contact>) => {
      const { data, error } = await supabase
        .from('client_contacts')
        .insert([newContact as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', data.client_id] });
      toast({
        title: 'Contact added',
        description: 'The contact has been successfully added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId, updates }: { id: string; clientId: string; updates: Partial<Contact> }) => {
      const { data, error } = await supabase
        .from('client_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.clientId] });
      toast({
        title: 'Contact updated',
        description: 'The contact has been successfully updated.',
      });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.clientId] });
      toast({
        title: 'Contact deleted',
        description: 'The contact has been successfully removed.',
      });
    },
  });
};
