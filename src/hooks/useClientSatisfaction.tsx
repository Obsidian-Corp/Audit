import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientSatisfactionSurvey {
  id: string;
  firm_id: string;
  client_id: string;
  engagement_id?: string;
  survey_type: 'csat' | 'nps' | 'engagement_feedback';
  survey_date: string;
  csat_score?: number;
  nps_score?: number;
  feedback_text?: string;
  positive_aspects?: string[];
  improvement_areas?: string[];
  requires_follow_up: boolean;
  follow_up_completed: boolean;
  follow_up_notes?: string;
  sent_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export const useClientSatisfaction = (clientId: string) => {
  return useQuery({
    queryKey: ['client-satisfaction', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_satisfaction_surveys')
        .select('*')
        .eq('client_id', clientId)
        .order('survey_date', { ascending: false });

      if (error) throw error;
      return data as ClientSatisfactionSurvey[];
    },
    enabled: !!clientId,
  });
};

export const useCreateSatisfactionSurvey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (survey: Partial<ClientSatisfactionSurvey>) => {
      const { data, error } = await supabase
        .from('client_satisfaction_surveys')
        .insert([survey as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-satisfaction'] });
      toast({
        title: 'Survey created',
        description: 'Satisfaction survey has been recorded.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create survey.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSatisfactionSurvey = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientSatisfactionSurvey> }) => {
      const { data, error } = await supabase
        .from('client_satisfaction_surveys')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-satisfaction'] });
      toast({
        title: 'Survey updated',
        description: 'Satisfaction survey has been updated.',
      });
    },
  });
};
