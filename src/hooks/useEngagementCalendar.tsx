import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useEngagementCalendar = (engagementId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ['engagement-calendar', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('engagement_calendar_events')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  const createEvent = useMutation({
    mutationFn: async (eventData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('engagement_calendar_events')
        .insert({
          ...eventData,
          engagement_id: engagementId,
          firm_id: profile?.firm_id,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-calendar', engagementId] });
      toast({ title: "Event created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating event",
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await supabase
        .from('engagement_calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-calendar', engagementId] });
      toast({ title: "Event updated successfully" });
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('engagement_calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagement-calendar', engagementId] });
      toast({ title: "Event deleted successfully" });
    }
  });

  return {
    events,
    isLoading,
    createEvent: createEvent.mutate,
    isCreating: createEvent.isPending,
    updateEvent: updateEvent.mutate,
    isUpdating: updateEvent.isPending,
    deleteEvent: deleteEvent.mutate,
    isDeleting: deleteEvent.isPending
  };
};
