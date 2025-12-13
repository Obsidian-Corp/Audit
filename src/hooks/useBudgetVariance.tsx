import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BudgetVarianceLog {
  id: string;
  engagement_id: string;
  firm_id: string;
  variance_date: string;
  variance_type: 'hours' | 'cost' | 'scope';
  budgeted_amount?: number;
  actual_amount?: number;
  variance_amount?: number;
  variance_percent?: number;
  variance_category?: 'staffing' | 'scope_change' | 'efficiency' | 'rate';
  explanation?: string;
  corrective_action?: string;
  action_owner?: string;
  action_due_date?: string;
  action_status: 'planned' | 'in_progress' | 'completed';
  created_by?: string;
  created_at: string;
}

export const useBudgetVariance = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: variances, isLoading } = useQuery({
    queryKey: ["budget-variances", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_variance_logs")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("variance_date", { ascending: false });

      if (error) throw error;
      return data as BudgetVarianceLog[];
    },
  });

  const createVarianceLog = useMutation({
    mutationFn: async (variance: Omit<BudgetVarianceLog, "id" | "created_at">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("budget_variance_logs")
        .insert({
          ...variance,
          firm_id: profile?.firm_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-variances", engagementId] });
      toast({ title: "Variance logged" });
    },
    onError: (error: Error) => {
      toast({ title: "Error logging variance", description: error.message, variant: "destructive" });
    },
  });

  const updateVarianceLog = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BudgetVarianceLog> }) => {
      const { data, error } = await supabase
        .from("budget_variance_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-variances", engagementId] });
      toast({ title: "Variance updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating variance", description: error.message, variant: "destructive" });
    },
  });

  return {
    variances,
    isLoading,
    createVarianceLog,
    updateVarianceLog,
  };
};
