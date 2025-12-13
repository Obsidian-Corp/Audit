import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LetterTemplate {
  id: string;
  firm_id: string;
  template_name: string;
  engagement_type?: string;
  template_content: string;
  placeholders?: Array<{ key: string; description: string }>;
  is_default: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useLetterTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["letter-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_letter_templates")
        .select("*")
        .eq("is_active", true)
        .order("template_name");

      if (error) throw error;
      return data as LetterTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<LetterTemplate, "id" | "created_at" | "updated_at">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_letter_templates")
        .insert({
          ...template,
          firm_id: profile?.firm_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates"] });
      toast({ title: "Template created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating template", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LetterTemplate> }) => {
      const { data, error } = await supabase
        .from("engagement_letter_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-templates"] });
      toast({ title: "Template updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating template", description: error.message, variant: "destructive" });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
  };
};
