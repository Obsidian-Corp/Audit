import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementDeliverable {
  id: string;
  engagement_id: string;
  firm_id: string;
  deliverable_name: string;
  deliverable_type: 'report' | 'letter' | 'presentation' | 'workpaper' | 'recommendation' | 'other';
  description?: string;
  due_date: string;
  delivered_date?: string;
  status: 'pending' | 'in_progress' | 'review' | 'delivered' | 'accepted' | 'rejected';
  assigned_to?: string;
  reviewed_by?: string;
  client_accepted_by?: string;
  client_accepted_at?: string;
  rejection_reason?: string;
  file_url?: string;
  version: number;
  parent_deliverable_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useEngagementDeliverables = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliverables, isLoading } = useQuery({
    queryKey: ["engagement-deliverables", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_deliverables")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as EngagementDeliverable[];
    },
  });

  const createDeliverable = useMutation({
    mutationFn: async (deliverable: Omit<EngagementDeliverable, "id" | "created_at" | "updated_at" | "version">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_deliverables")
        .insert({
          ...deliverable,
          firm_id: profile?.firm_id,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-deliverables", engagementId] });
      toast({ title: "Deliverable created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating deliverable", description: error.message, variant: "destructive" });
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EngagementDeliverable> }) => {
      const { data, error } = await supabase
        .from("engagement_deliverables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-deliverables", engagementId] });
      toast({ title: "Deliverable updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating deliverable", description: error.message, variant: "destructive" });
    },
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("engagement_deliverables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-deliverables", engagementId] });
      toast({ title: "Deliverable deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting deliverable", description: error.message, variant: "destructive" });
    },
  });

  return {
    deliverables,
    isLoading,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
};
