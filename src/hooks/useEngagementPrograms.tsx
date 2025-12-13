import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EngagementProgram {
  id: string;
  engagement_id: string;
  program_template_id: string | null;
  program_name: string;
  status: string;
  total_procedures: number;
  completed_procedures: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useEngagementPrograms = (engagementId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['engagement-programs', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagement_programs')
        .select(`
          *,
          audit_program_templates(template_name, audit_type)
        `);

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!engagementId,
  });

  const applyProgramToEngagement = useMutation({
    mutationFn: async ({
      engagementId,
      programTemplateId,
      programName,
    }: {
      engagementId: string;
      programTemplateId: string;
      programName: string;
    }) => {
      // Create engagement program
      const { data: program, error: programError } = await supabase
        .from('engagement_programs')
        .insert({
          engagement_id: engagementId,
          program_template_id: programTemplateId,
          program_name: programName,
          status: 'draft',
        })
        .select()
        .single();

      if (programError) throw programError;

      // Get procedures from template
      const { data: templateProcedures, error: proceduresError } = await supabase
        .from('program_procedures')
        .select(`
          *,
          audit_procedures(*)
        `)
        .eq('program_template_id', programTemplateId)
        .order('sequence_order');

      if (proceduresError) throw proceduresError;

      // Copy procedures to engagement
      if (templateProcedures && templateProcedures.length > 0) {
        const engagementProcedures = templateProcedures.map((tp: any) => ({
          engagement_program_id: program.id,
          procedure_id: tp.procedure_id,
          engagement_id: engagementId,
          procedure_name: tp.audit_procedures.procedure_name,
          instructions: tp.audit_procedures.instructions,
          estimated_hours: tp.audit_procedures.estimated_hours,
          status: 'not_started',
          priority: tp.audit_procedures.risk_level === 'high' ? 'high' : 'medium',
        }));

        const { error: insertError } = await supabase
          .from('engagement_procedures')
          .insert(engagementProcedures);

        if (insertError) throw insertError;

        // Update total procedures count
        await supabase
          .from('engagement_programs')
          .update({ total_procedures: engagementProcedures.length })
          .eq('id', program.id);
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-programs'] });
      queryClient.invalidateQueries({ queryKey: ['engagement-procedures'] });
      toast({
        title: 'Program applied',
        description: 'The audit program has been applied to this engagement.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error applying program',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    programs,
    isLoading,
    applyProgramToEngagement: applyProgramToEngagement.mutate,
  };
};
