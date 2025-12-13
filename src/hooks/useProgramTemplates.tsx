import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProgramTemplate {
  id: string;
  firm_id: string;
  template_name: string;
  audit_type: string;
  industry: string | null;
  description: string | null;
  is_standard: boolean;
  is_active: boolean;
  metadata: any;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  procedure_count?: number;
}

export const useProgramTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['program-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_program_templates')
        .select(`
          *,
          program_procedures(count)
        `)
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;

      return (data || []).map(t => ({
        ...t,
        procedure_count: t.program_procedures?.[0]?.count || 0
      }));
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Partial<ProgramTemplate>) => {
      const { data, error } = await supabase
        .from('audit_program_templates')
        .insert([template as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-templates'] });
      toast({
        title: 'Program template created',
        description: 'The program template has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProgramTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('audit_program_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-templates'] });
      toast({
        title: 'Program template updated',
        description: 'The program template has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_program_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-templates'] });
      toast({
        title: 'Program template archived',
        description: 'The program template has been archived.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error archiving template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
  };
};
