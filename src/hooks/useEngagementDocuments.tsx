import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementDocument {
  id: string;
  engagement_id: string;
  firm_id: string;
  document_name: string;
  document_type?: 'contract' | 'proposal' | 'scope' | 'correspondence' | 'workpaper' | 'supporting' | 'other';
  file_url: string;
  file_size?: number;
  file_type?: string;
  category?: string;
  tags?: string[];
  is_client_visible: boolean;
  uploaded_by?: string;
  uploaded_at: string;
  version: number;
  parent_document_id?: string;
}

export const useEngagementDocuments = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["engagement-documents", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_documents")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as EngagementDocument[];
    },
  });

  const createDocument = useMutation({
    mutationFn: async (document: Omit<EngagementDocument, "id" | "uploaded_at" | "version">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_documents")
        .insert({
          ...document,
          firm_id: profile?.firm_id,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast({ title: "Document uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error uploading document", description: error.message, variant: "destructive" });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("engagement_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-documents", engagementId] });
      toast({ title: "Document deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting document", description: error.message, variant: "destructive" });
    },
  });

  return {
    documents,
    isLoading,
    createDocument,
    deleteDocument,
  };
};
