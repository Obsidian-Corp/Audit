import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Meeting {
  id: string;
  client_id: string;
  opportunity_id?: string;
  meeting_title: string;
  meeting_type?: string;
  meeting_date: string;
  location?: string;
  internal_attendees?: string[];
  client_attendees?: string[];
  agenda?: string;
  notes?: string;
  outcomes?: string;
  follow_up_items?: any[];
  created_at: string;
  updated_at: string;
}

export const useMeetings = (clientId: string) => {
  return useQuery({
    queryKey: ['meetings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_meetings')
        .select('*')
        .eq('client_id', clientId)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!clientId,
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newMeeting: Partial<Meeting>) => {
      const { data, error } = await supabase
        .from('client_meetings')
        .insert([newMeeting as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', data.client_id] });
      toast({
        title: 'Meeting logged',
        description: 'The meeting has been successfully recorded.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log meeting.',
        variant: 'destructive',
      });
    },
  });
};
