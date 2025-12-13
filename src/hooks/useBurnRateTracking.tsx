import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BurnRateSnapshot {
  id: string;
  engagement_id: string;
  firm_id: string;
  snapshot_date: string;
  hours_spent?: number;
  cost_spent?: number;
  days_elapsed?: number;
  daily_burn_rate_hours?: number;
  daily_burn_rate_cost?: number;
  projected_completion_date?: string;
  projected_total_hours?: number;
  projected_total_cost?: number;
  burn_rate_status?: 'under' | 'on_track' | 'over' | 'critical';
  created_at: string;
}

export const useBurnRateTracking = (engagementId: string) => {
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["burn-rate-snapshots", engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("burn_rate_snapshots")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("snapshot_date", { ascending: false })
        .limit(30);

      if (error) throw error;
      return data as BurnRateSnapshot[];
    },
  });

  const calculateBurnRate = (engagement: any) => {
    if (!engagement?.planned_start_date || !engagement?.hours_spent) {
      return null;
    }

    const startDate = new Date(engagement.planned_start_date);
    const today = new Date();
    const daysElapsed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const dailyBurnRate = engagement.hours_spent / daysElapsed;
    const projectedTotalHours = dailyBurnRate * Math.max(
      daysElapsed,
      engagement.planned_end_date ? Math.floor((new Date(engagement.planned_end_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : daysElapsed * 2
    );

    let status: 'under' | 'on_track' | 'over' | 'critical' = 'on_track';
    if (engagement.hours_allocated) {
      const percentUsed = (projectedTotalHours / engagement.hours_allocated) * 100;
      if (percentUsed < 90) status = 'under';
      else if (percentUsed <= 105) status = 'on_track';
      else if (percentUsed <= 120) status = 'over';
      else status = 'critical';
    }

    return {
      dailyBurnRate,
      projectedTotalHours,
      status,
      daysElapsed,
    };
  };

  return {
    snapshots,
    isLoading,
    latestSnapshot: snapshots?.[0],
    calculateBurnRate,
  };
};
