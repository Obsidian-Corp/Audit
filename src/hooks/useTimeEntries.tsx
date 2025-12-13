import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimeEntry {
  id: string;
  firm_id: string;
  user_id: string;
  engagement_id: string;
  task_description?: string;
  entry_date: string;
  hours: number;
  is_billable: boolean;
  billable_amount?: number;
  hourly_rate?: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeEntryFilters {
  user_id?: string;
  engagement_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export const useTimeEntries = (filters?: TimeEntryFilters) => {
  return useQuery({
    queryKey: ['time-entries', filters],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          user:profiles!time_entries_user_id_fkey(id, full_name, email),
          engagement:audits!time_entries_engagement_id_fkey(id, audit_title, audit_number),
          approver:profiles!time_entries_approved_by_fkey(id, full_name)
        `)
        .order('entry_date', { ascending: false });

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.engagement_id) {
        query = query.eq('engagement_id', filters.engagement_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date) {
        query = query.gte('entry_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('entry_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeEntry[];
    },
  });
};

export const useMyTimeEntries = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['my-time-entries', startDate, endDate],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('time_entries')
        .select(`
          *,
          engagement:audits!time_entries_engagement_id_fkey(id, audit_title, audit_number, clients(client_name))
        `)
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useEngagementTimeEntries = (engagementId: string) => {
  return useQuery({
    queryKey: ['engagement-time-entries', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          user:profiles!time_entries_user_id_fkey(id, full_name, email)
        `)
        .eq('engagement_id', engagementId)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!engagementId,
  });
};

export const useTimeSummary = (engagementId?: string) => {
  return useQuery({
    queryKey: ['time-summary', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select('hours, is_billable, billable_amount, status');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const summary = {
        total_hours: data.reduce((sum, entry) => sum + entry.hours, 0),
        billable_hours: data.filter(e => e.is_billable).reduce((sum, e) => sum + e.hours, 0),
        non_billable_hours: data.filter(e => !e.is_billable).reduce((sum, e) => sum + e.hours, 0),
        total_billable_amount: data.reduce((sum, e) => sum + (e.billable_amount || 0), 0),
        approved_hours: data.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.hours, 0),
        pending_hours: data.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.hours, 0),
        draft_hours: data.filter(e => e.status === 'draft').reduce((sum, e) => sum + e.hours, 0),
      };

      return summary;
    },
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newEntry: Partial<TimeEntry>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('time_entries')
        .insert([{
          ...newEntry,
          user_id: user.id,
          status: newEntry.status || 'draft',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      toast({
        title: 'Time entry created',
        description: 'Your time entry has been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create time entry.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TimeEntry> }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['engagement-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      toast({
        title: 'Time entry updated',
        description: 'Your time entry has been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update time entry.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      toast({
        title: 'Time entry deleted',
        description: 'The time entry has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete time entry.',
        variant: 'destructive',
      });
    },
  });
};

export const useSubmitTimesheet = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryIds: string[]) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({ status: 'submitted' })
        .in('id', entryIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['my-time-entries'] });
      toast({
        title: 'Timesheet submitted',
        description: `${data.length} time entries submitted for approval.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit timesheet.',
        variant: 'destructive',
      });
    },
  });
};

export const useApproveTimeEntries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entryIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .in('id', entryIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      toast({
        title: 'Time entries approved',
        description: `${data.length} time entries have been approved.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve time entries.',
        variant: 'destructive',
      });
    },
  });
};

export const useRejectTimeEntries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entryIds, reason }: { entryIds: string[]; reason: string }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .in('id', entryIds)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({
        title: 'Time entries rejected',
        description: `${data.length} time entries have been rejected.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject time entries.',
        variant: 'destructive',
      });
    },
  });
};
