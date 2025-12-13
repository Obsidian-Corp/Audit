import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementScope {
  id: string;
  engagement_id: string;
  objectives: string[];
  scope_boundaries?: string;
  exclusions?: string;
  key_risks: string[];
  materiality_threshold?: number;
  sample_size?: number;
  testing_approach?: string;
  version: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export const useEngagementScope = (engagementId: string) => {
  const [scope, setScope] = useState<EngagementScope | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchScope = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("engagement_scope")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setScope(data);
    } catch (error: any) {
      console.error("Error fetching scope:", error);
      toast({
        title: "Error loading scope",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateScope = async (scopeData: Partial<EngagementScope>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from("engagement_scope")
        .insert({
          ...scopeData,
          engagement_id: engagementId,
          firm_id: profile.firm_id,
          created_by: user.id,
          version: (scope?.version || 0) + 1,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Scope saved",
        description: "The engagement scope has been saved successfully.",
      });

      await fetchScope();
      return data;
    } catch (error: any) {
      console.error("Error saving scope:", error);
      toast({
        title: "Error saving scope",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const approveScope = async () => {
    try {
      if (!scope) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("engagement_scope")
        .update({
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", scope.id);

      if (error) throw error;

      toast({
        title: "Scope approved",
        description: "The engagement scope has been approved.",
      });

      await fetchScope();
    } catch (error: any) {
      console.error("Error approving scope:", error);
      toast({
        title: "Error approving scope",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (engagementId) {
      fetchScope();
    }
  }, [engagementId]);

  return {
    scope,
    loading,
    createOrUpdateScope,
    approveScope,
    refetch: fetchScope,
  };
};
