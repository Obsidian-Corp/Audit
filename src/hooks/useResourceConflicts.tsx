import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useResourceConflicts = (engagementId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['engagement-resource-conflicts', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_resource_conflicts')
        .select('*')
        .eq('resolution_status', 'unresolved');

      if (error) throw error;
      return data || [];
    }
  });

  const resolveConflict = useMutation({
    mutationFn: async ({ id, resolution_notes }: { id: string; resolution_notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('engagement_resource_conflicts')
        .update({
          resolution_status: 'resolved',
          resolution_notes,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-resource-conflicts'] });
      toast({ title: "Conflict resolved successfully" });
    }
  });

  return {
    conflicts: conflicts || [],
    isLoading,
    resolveConflict: resolveConflict.mutate,
    isResolving: resolveConflict.isPending
  };
};
