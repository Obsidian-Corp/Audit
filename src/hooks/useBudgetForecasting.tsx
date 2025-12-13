import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BudgetForecast {
  id: string;
  engagement_id: string;
  firm_id: string;
  forecast_date: string;
  forecast_method: 'linear' | 'earned_value' | 'manual';
  percent_complete?: number;
  actual_hours_to_date?: number;
  actual_cost_to_date?: number;
  estimated_hours_to_complete?: number;
  estimated_cost_to_complete?: number;
  forecast_total_hours?: number;
  forecast_total_cost?: number;
  variance_hours?: number;
  variance_cost?: number;
  variance_percent?: number;
  confidence_level: 'low' | 'medium' | 'high';
  assumptions?: string;
  risk_factors?: Array<{ factor: string; impact: string }>;
  created_by?: string;
  created_at: string;
}

export const useBudgetForecasting = (engagementId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ["budget-forecasts", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_budget_forecasts")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("forecast_date", { ascending: false });

      if (error) throw error;
      return data as BudgetForecast[];
    },
  });

  const createForecast = useMutation({
    mutationFn: async (forecast: Omit<BudgetForecast, "id" | "created_at">) => {
      const { data: profile } = await supabase.from("profiles").select("firm_id").single();
      
      const { data, error } = await supabase
        .from("engagement_budget_forecasts")
        .insert({
          ...forecast,
          firm_id: profile?.firm_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-forecasts", engagementId] });
      toast({ title: "Forecast created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error creating forecast", description: error.message, variant: "destructive" });
    },
  });

  return {
    forecasts,
    isLoading,
    createForecast,
    latestForecast: forecasts?.[0],
  };
};
