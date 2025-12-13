import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementLetter {
  id: string;
  engagement_id: string;
  firm_id: string;
  template_id?: string;
  letter_content: string;
  version: number;
  status: 'draft' | 'pending_review' | 'approved' | 'sent' | 'signed';
  generated_by?: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  signed_at?: string;
  signature_data?: any;
  created_at: string;
  updated_at: string;
}

export const useEngagementLetters = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: letters, isLoading } = useQuery({
    queryKey: ["engagement-letters", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_letters")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as EngagementLetter[];
    },
  });

  const createLetter = useMutation({
    mutationFn: async (letter: Omit<EngagementLetter, "id" | "created_at" | "updated_at" | "version">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_letters")
        .insert({
          ...letter,
          firm_id: profile?.firm_id,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-letters", engagementId] });
      toast({ title: "Letter generated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error generating letter", description: error.message, variant: "destructive" });
    },
  });

  const updateLetter = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EngagementLetter> }) => {
      const { data, error } = await supabase
        .from("engagement_letters")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-letters", engagementId] });
      toast({ title: "Letter updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating letter", description: error.message, variant: "destructive" });
    },
  });

  return {
    letters: letters || [],
    isLoading,
    createLetter: createLetter.mutate,
    isCreating: createLetter.isPending,
    updateLetter: updateLetter.mutate,
    isUpdating: updateLetter.isPending,
  };
};
