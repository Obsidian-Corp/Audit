import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientHealthScore {
  id: string;
  client_id: string;
  firm_id: string;
  engagement_score: number;
  payment_score: number;
  satisfaction_score: number;
  communication_score: number;
  overall_score: number;
  health_status: 'excellent' | 'good' | 'fair' | 'at-risk' | 'critical';
  last_calculated: string;
  calculation_factors: any;
  created_at: string;
  updated_at: string;
}

export const useClientHealth = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-health', clientId],
    queryFn: async () => {
      if (clientId) {
        const { data, error } = await supabase
          .from('client_health_scores')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) throw error;
        return data as ClientHealthScore;
      } else {
        const { data, error } = await supabase
          .from('client_health_scores')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data as ClientHealthScore[];
      }
    },
  });
};

export const useCalculateClientHealth = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Fetch client data
      const { data: client } = await supabase
        .from('clients')
        .select('*, opportunities(stage, estimated_value)')
        .eq('id', clientId)
        .single();

      if (!client) throw new Error('Client not found');

      // Calculate engagement score (based on last engagement date)
      const lastEngagementDate = client.last_engagement_date 
        ? new Date(client.last_engagement_date) 
        : null;
      const daysSinceLastEngagement = lastEngagementDate
        ? Math.floor((new Date().getTime() - lastEngagementDate.getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      const engagementScore = 
        daysSinceLastEngagement < 30 ? 100 :
        daysSinceLastEngagement < 60 ? 75 :
        daysSinceLastEngagement < 90 ? 50 : 25;

      // Payment score (placeholder - would integrate with billing)
      const paymentScore = 100; // Default to excellent

      // Satisfaction score (from surveys)
      const { data: surveys } = await supabase
        .from('client_satisfaction_surveys')
        .select('csat_score, nps_score')
        .eq('client_id', clientId)
        .not('csat_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      const avgCsat = surveys && surveys.length > 0
        ? surveys.reduce((sum, s) => sum + (s.csat_score || 0), 0) / surveys.length
        : 3;
      const satisfactionScore = Math.round((avgCsat / 5) * 100);

      // Communication score (based on response rate - placeholder)
      const communicationScore = 75; // Default

      // Calculate overall weighted score
      const overallScore = Math.round(
        engagementScore * 0.30 +
        paymentScore * 0.25 +
        satisfactionScore * 0.25 +
        communicationScore * 0.20
      );

      // Determine health status
      const healthStatus = 
        overallScore >= 85 ? 'excellent' :
        overallScore >= 70 ? 'good' :
        overallScore >= 50 ? 'fair' :
        overallScore >= 30 ? 'at-risk' : 'critical';

      // Upsert health score
      const { data, error } = await supabase
        .from('client_health_scores')
        .upsert({
          client_id: clientId,
          firm_id: client.firm_id,
          engagement_score: engagementScore,
          payment_score: paymentScore,
          satisfaction_score: satisfactionScore,
          communication_score: communicationScore,
          overall_score: overallScore,
          health_status: healthStatus,
          last_calculated: new Date().toISOString(),
          calculation_factors: {
            days_since_last_engagement: daysSinceLastEngagement,
            recent_surveys_count: surveys?.length || 0,
          },
        }, {
          onConflict: 'client_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-health'] });
      toast({
        title: 'Health score calculated',
        description: 'Client health score has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate health score.',
        variant: 'destructive',
      });
    },
  });
};
