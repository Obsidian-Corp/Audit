import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EngagementProcedure {
  id: string;
  engagement_program_id: string;
  procedure_id: string | null;
  engagement_id: string;
  assigned_to: string | null;
  assigned_by: string | null;
  procedure_name: string;
  instructions: any;
  estimated_hours: number;
  actual_hours: number;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  priority: string;
  dependencies: any[];
  workpaper_id: string | null;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  evidence_collected: any[];
  exceptions_noted: string | null;
  conclusion: string | null;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
}

export const useEngagementProcedures = (engagementId?: string, assignedTo?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: procedures, isLoading } = useQuery({
    queryKey: ['engagement-procedures', engagementId, assignedTo],
    queryFn: async () => {
      let query = supabase
        .from('engagement_procedures')
        .select(`
          *,
          engagement_programs(program_name),
          profiles:assigned_to(full_name, email)
        `);

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!(engagementId || assignedTo),
  });

  const updateProcedure = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EngagementProcedure> & { id: string }) => {
      const { data, error } = await supabase
        .from('engagement_procedures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-procedures'] });
      toast({
        title: 'Procedure updated',
        description: 'The procedure has been updated successfully.',
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

  const assignProcedure = useMutation({
    mutationFn: async ({
      procedureId,
      assignedTo,
      dueDate,
    }: {
      procedureId: string;
      assignedTo: string;
      dueDate?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: any = {
        assigned_to: assignedTo,
        assigned_by: user?.id,
      };

      if (dueDate) {
        updates.due_date = dueDate;
      }

      const { data, error } = await supabase
        .from('engagement_procedures')
        .update(updates)
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-procedures'] });
      toast({
        title: 'Procedure assigned',
        description: 'The procedure has been assigned successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error assigning procedure',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const startProcedure = useMutation({
    mutationFn: async (procedureId: string) => {
      const { data, error } = await supabase
        .from('engagement_procedures')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-procedures'] });
    },
  });

  const completeProcedure = useMutation({
    mutationFn: async (procedureId: string) => {
      const { data, error } = await supabase
        .from('engagement_procedures')
        .update({
          status: 'in_review',
          completed_at: new Date().toISOString(),
        })
        .eq('id', procedureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-procedures'] });
      toast({
        title: 'Procedure completed',
        description: 'The procedure has been submitted for review.',
      });
    },
  });

  return {
    procedures,
    isLoading,
    updateProcedure: updateProcedure.mutate,
    assignProcedure: assignProcedure.mutate,
    startProcedure: startProcedure.mutate,
    completeProcedure: completeProcedure.mutate,
  };
};
