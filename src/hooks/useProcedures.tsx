import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuditProcedure {
  id: string;
  firm_id: string;
  procedure_name: string;
  procedure_code: string;
  category: string;
  objective: string | null;
  instructions: any;
  sample_size_guidance: string | null;
  evidence_requirements: any;
  expected_outcomes: string | null;
  estimated_hours: number;
  risk_level: string;
  control_objectives: any;
  procedure_type: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useProcedures = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: procedures, isLoading } = useQuery({
    queryKey: ['audit-procedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .select('*')
        .eq('is_active', true)
        .order('procedure_code');

      if (error) throw error;
      return data || [];
    },
  });

  const createProcedure = useMutation({
    mutationFn: async (procedure: Partial<AuditProcedure>) => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .insert([procedure as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-procedures'] });
      toast({
        title: 'Procedure created',
        description: 'The audit procedure has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AuditProcedure> & { id: string }) => {
      const { data, error } = await supabase
        .from('audit_procedures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-procedures'] });
      toast({
        title: 'Procedure updated',
        description: 'The audit procedure has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProcedure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audit_procedures')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-procedures'] });
      toast({
        title: 'Procedure archived',
        description: 'The audit procedure has been archived.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error archiving procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    procedures,
    isLoading,
    createProcedure: createProcedure.mutate,
    updateProcedure: updateProcedure.mutate,
    deleteProcedure: deleteProcedure.mutate,
  };
};
