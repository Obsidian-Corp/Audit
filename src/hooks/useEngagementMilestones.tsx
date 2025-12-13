import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementMilestone {
  id: string;
  engagement_id: string;
  milestone_name: string;
  milestone_type: string;
  planned_date: string;
  actual_date?: string;
  status: string;
  description?: string;
  dependencies?: any;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
}

export const useEngagementMilestones = (engagementId: string) => {
  const [milestones, setMilestones] = useState<EngagementMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("engagement_milestones")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("planned_date", { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error: any) {
      console.error("Error fetching milestones:", error);
      toast({
        title: "Error loading milestones",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMilestone = async (milestone: Partial<EngagementMilestone>) => {
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
        .from("engagement_milestones")
        .insert([{
          engagement_id: engagementId,
          firm_id: profile.firm_id,
          milestone_name: milestone.milestone_name || '',
          milestone_type: milestone.milestone_type || '',
          planned_date: milestone.planned_date || new Date().toISOString().split('T')[0],
          status: milestone.status || 'pending',
          description: milestone.description,
          dependencies: milestone.dependencies,
          is_critical: milestone.is_critical || false,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Milestone created",
        description: "The milestone has been added successfully.",
      });

      await fetchMilestones();
      return data;
    } catch (error: any) {
      console.error("Error creating milestone:", error);
      toast({
        title: "Error creating milestone",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMilestone = async (id: string, updates: Partial<EngagementMilestone>) => {
    try {
      const { error } = await supabase
        .from("engagement_milestones")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Milestone updated",
        description: "The milestone has been updated successfully.",
      });

      await fetchMilestones();
    } catch (error: any) {
      console.error("Error updating milestone:", error);
      toast({
        title: "Error updating milestone",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from("engagement_milestones")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Milestone deleted",
        description: "The milestone has been removed successfully.",
      });

      await fetchMilestones();
    } catch (error: any) {
      console.error("Error deleting milestone:", error);
      toast({
        title: "Error deleting milestone",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (engagementId) {
      fetchMilestones();
    }
  }, [engagementId]);

  return {
    milestones,
    loading,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    refetch: fetchMilestones,
  };
};
