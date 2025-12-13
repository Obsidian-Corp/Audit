import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementCommunication {
  id: string;
  engagement_id: string;
  firm_id: string;
  communication_type: 'meeting' | 'email' | 'phone_call' | 'status_update' | 'decision';
  subject: string;
  summary?: string;
  participants: Array<{ user_id: string; name: string; role?: string }>;
  communication_date: string;
  duration_minutes?: number;
  attachments?: Array<{ name: string; url: string }>;
  action_items?: Array<{ title: string; assigned_to?: string }>;
  decisions_made?: Array<{ decision: string; made_by?: string }>;
  next_steps?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useEngagementCommunications = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: communications, isLoading } = useQuery({
    queryKey: ["engagement-communications", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_communications")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("communication_date", { ascending: false });

      if (error) throw error;
      return data as EngagementCommunication[];
    },
  });

  const createCommunication = useMutation({
    mutationFn: async (communication: Omit<EngagementCommunication, "id" | "created_at" | "updated_at">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_communications")
        .insert({
          ...communication,
          firm_id: profile?.firm_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-communications", engagementId] });
      toast({ title: "Communication logged successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error logging communication", description: error.message, variant: "destructive" });
    },
  });

  const updateCommunication = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EngagementCommunication> }) => {
      const { data, error } = await supabase
        .from("engagement_communications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-communications", engagementId] });
      toast({ title: "Communication updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating communication", description: error.message, variant: "destructive" });
    },
  });

  const deleteCommunication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("engagement_communications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-communications", engagementId] });
      toast({ title: "Communication deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting communication", description: error.message, variant: "destructive" });
    },
  });

  return {
    communications,
    isLoading,
    createCommunication,
    updateCommunication,
    deleteCommunication,
  };
};
