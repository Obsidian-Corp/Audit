import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementTemplate {
  id: string;
  template_name: string;
  engagement_type: string;
  industry?: string;
  description?: string;
  default_scope: any;
  default_milestones: any;
  default_team_structure: any;
  estimated_hours_by_role: any;
  budget_range_min?: number;
  budget_range_max?: number;
  deliverables_checklist?: string[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useEngagementTemplates = () => {
  const [templates, setTemplates] = useState<EngagementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("engagement_templates")
        .select("*")
        .eq("is_active", true)
        .order("template_name", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (template: Partial<EngagementTemplate>) => {
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
        .from("engagement_templates")
        .insert([{
          firm_id: profile.firm_id,
          template_name: template.template_name || '',
          engagement_type: template.engagement_type || '',
          industry: template.industry,
          description: template.description,
          default_scope: template.default_scope || {},
          default_milestones: template.default_milestones || [],
          default_team_structure: template.default_team_structure || [],
          estimated_hours_by_role: template.estimated_hours_by_role || {},
          budget_range_min: template.budget_range_min,
          budget_range_max: template.budget_range_max,
          deliverables_checklist: template.deliverables_checklist,
          is_active: template.is_active ?? true,
          is_default: template.is_default ?? false,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Template created",
        description: "The engagement template has been created successfully.",
      });

      await fetchTemplates();
      return data;
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<EngagementTemplate>) => {
    try {
      const { error } = await supabase
        .from("engagement_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Template updated",
        description: "The engagement template has been updated successfully.",
      });

      await fetchTemplates();
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("engagement_templates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Template deleted",
        description: "The engagement template has been deactivated.",
      });

      await fetchTemplates();
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates,
  };
};
