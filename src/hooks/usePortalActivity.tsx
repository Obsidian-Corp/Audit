import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PortalActivity {
  id: string;
  client_id: string;
  user_id: string;
  firm_id: string;
  activity_type: 'login' | 'document_view' | 'document_download' | 'message_sent' | 'report_access';
  resource_type?: string;
  resource_id?: string;
  activity_metadata: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const usePortalActivity = (clientId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['portal-activity', clientId, days],
    queryFn: async () => {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const { data, error } = await supabase
        .from('client_portal_activity')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalActivity[];
    },
    enabled: !!clientId,
  });
};

export const usePortalActivityByUser = (userId: string, days: number = 30) => {
  return useQuery({
    queryKey: ['portal-activity-user', userId, days],
    queryFn: async () => {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const { data, error } = await supabase
        .from('client_portal_activity')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PortalActivity[];
    },
    enabled: !!userId,
  });
};
