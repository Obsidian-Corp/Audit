import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProposalTemplate {
  id: string;
  firm_id: string;
  template_name: string;
  template_category?: 'audit' | 'tax' | 'consulting' | 'advisory' | 'compliance' | 'other';
  description?: string;
  template_content: any;
  variables: any[];
  default_sections: any[];
  is_active: boolean;
  is_default: boolean;
  created_by?: string;
  last_used_at?: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export const useProposalTemplates = () => {
  return useQuery({
    queryKey: ['proposal-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name', { ascending: true });

      if (error) throw error;
      return data as ProposalTemplate[];
    },
  });
};

export const useProposalTemplateById = (id: string) => {
  return useQuery({
    queryKey: ['proposal-template', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProposalTemplate;
    },
    enabled: !!id,
  });
};

export const useCreateProposalTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (template: Partial<ProposalTemplate>) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .insert([template as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast({
        title: 'Template created',
        description: 'Proposal template has been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateProposalTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProposalTemplate> }) => {
      const { data, error } = await supabase
        .from('proposal_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast({
        title: 'Template updated',
        description: 'Proposal template has been updated.',
      });
    },
  });
};

export const useDeleteProposalTemplate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-templates'] });
      toast({
        title: 'Template deleted',
        description: 'Proposal template has been removed.',
      });
    },
  });
};
