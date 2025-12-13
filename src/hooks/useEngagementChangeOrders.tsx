import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EngagementChangeOrder {
  id: string;
  engagement_id: string;
  change_number: string;
  change_type: string;
  title: string;
  description: string;
  justification?: string;
  impact_hours?: number;
  impact_budget?: number;
  impact_timeline_days?: number;
  status: string;
  requested_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  implemented_at?: string;
  created_at: string;
  updated_at: string;
}

export const useEngagementChangeOrders = (engagementId: string) => {
  const [changeOrders, setChangeOrders] = useState<EngagementChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchChangeOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("engagement_change_orders")
        .select("*")
        .eq("engagement_id", engagementId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChangeOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching change orders:", error);
      toast({
        title: "Error loading change orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createChangeOrder = async (changeOrder: Partial<EngagementChangeOrder>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("firm_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Generate change number
      const count = changeOrders.length + 1;
      const changeNumber = `CO-${engagementId.substring(0, 8).toUpperCase()}-${String(count).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from("engagement_change_orders")
        .insert([{
          engagement_id: engagementId,
          firm_id: profile.firm_id,
          change_number: changeNumber,
          change_type: changeOrder.change_type || '',
          title: changeOrder.title || '',
          description: changeOrder.description || '',
          justification: changeOrder.justification,
          impact_hours: changeOrder.impact_hours,
          impact_budget: changeOrder.impact_budget,
          impact_timeline_days: changeOrder.impact_timeline_days,
          status: changeOrder.status || 'draft',
          requested_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Change order created",
        description: "The change order has been created successfully.",
      });

      await fetchChangeOrders();
      return data;
    } catch (error: any) {
      console.error("Error creating change order:", error);
      toast({
        title: "Error creating change order",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const approveChangeOrder = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("engagement_change_orders")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Change order approved",
        description: "The change order has been approved.",
      });

      await fetchChangeOrders();
    } catch (error: any) {
      console.error("Error approving change order:", error);
      toast({
        title: "Error approving change order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectChangeOrder = async (id: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("engagement_change_orders")
        .update({
          status: "rejected",
          rejection_reason: reason,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Change order rejected",
        description: "The change order has been rejected.",
      });

      await fetchChangeOrders();
    } catch (error: any) {
      console.error("Error rejecting change order:", error);
      toast({
        title: "Error rejecting change order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (engagementId) {
      fetchChangeOrders();
    }
  }, [engagementId]);

  return {
    changeOrders,
    loading,
    createChangeOrder,
    approveChangeOrder,
    rejectChangeOrder,
    refetch: fetchChangeOrders,
  };
};
