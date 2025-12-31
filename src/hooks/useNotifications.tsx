/**
 * useNotifications Hook
 * Ticket: FEAT-003
 *
 * Manages user notifications with real-time updates.
 * Integrates with the notification system for workpaper sign-offs,
 * review notes, task assignments, and deadline reminders.
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Type definitions
export type NotificationType =
  | 'task_assignment'
  | 'review_comment'
  | 'signoff_required'
  | 'approval'
  | 'deadline_reminder'
  | 'finding_created'
  | 'mention'
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  priority: NotificationPriority;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationGroup {
  date: string;
  label: string;
  notifications: Notification[];
}

export interface NotificationFilters {
  type?: NotificationType | NotificationType[];
  priority?: NotificationPriority | NotificationPriority[];
  read?: boolean;
  engagementId?: string;
}

interface UseNotificationsOptions {
  /** Auto-refresh interval in milliseconds (default: 30000) */
  refreshInterval?: number;
  /** Enable real-time updates (default: true) */
  realtime?: boolean;
  /** Maximum notifications to fetch (default: 50) */
  limit?: number;
  /** Initial filters */
  filters?: NotificationFilters;
}

/**
 * Hook for managing user notifications
 * @param options - Configuration options
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    refreshInterval = 30000,
    realtime = true,
    limit = 50,
    filters: initialFilters,
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Get notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notifications', user?.id, initialFilters],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (initialFilters?.type) {
        const types = Array.isArray(initialFilters.type)
          ? initialFilters.type
          : [initialFilters.type];
        query = query.in('type', types);
      }

      if (initialFilters?.priority) {
        const priorities = Array.isArray(initialFilters.priority)
          ? initialFilters.priority
          : [initialFilters.priority];
        query = query.in('priority', priorities);
      }

      if (initialFilters?.read !== undefined) {
        query = query.eq('read', initialFilters.read);
      }

      if (initialFilters?.engagementId) {
        query = query.eq('data->engagement_id', initialFilters.engagementId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: refreshInterval,
  });

  // Computed: Unread count
  const unreadCount = useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  // Computed: Unread by priority
  const unreadByPriority = useMemo(() => {
    const counts: Record<NotificationPriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    };

    notifications?.forEach((n) => {
      if (!n.read) {
        counts[n.priority] = (counts[n.priority] || 0) + 1;
      }
    });

    return counts;
  }, [notifications]);

  // Computed: Group notifications by date
  const groupedNotifications = useMemo((): NotificationGroup[] => {
    if (!notifications || notifications.length === 0) return [];

    const groups: Map<string, Notification[]> = new Map();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at).toDateString();
      const existing = groups.get(date) || [];
      existing.push(notification);
      groups.set(date, existing);
    });

    return Array.from(groups.entries()).map(([date, notifs]) => {
      let label = date;
      if (date === today) label = 'Today';
      else if (date === yesterday) label = 'Yesterday';
      else {
        label = new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      return { date, label, notifications: notifs };
    });
  }, [notifications]);

  // Mutation: Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: (notificationId) => {
      queryClient.setQueryData(
        ['notifications', user?.id, initialFilters],
        (old: Notification[] | undefined) =>
          old?.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
      );
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ['notifications', user?.id, initialFilters],
        (old: Notification[] | undefined) =>
          old?.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      toast({
        title: 'All notifications marked as read',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onSuccess: (notificationId) => {
      queryClient.setQueryData(
        ['notifications', user?.id, initialFilters],
        (old: Notification[] | undefined) => old?.filter((n) => n.id !== notificationId)
      );
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete all read notifications
  const clearReadNotificationsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('read', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ['notifications', user?.id, initialFilters],
        (old: Notification[] | undefined) => old?.filter((n) => !n.read)
      );
      toast({
        title: 'Read notifications cleared',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!realtime || !user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Add to cache
          queryClient.setQueryData(
            ['notifications', user?.id, initialFilters],
            (old: Notification[] | undefined) => {
              if (!old) return [newNotification];
              return [newNotification, ...old].slice(0, limit);
            }
          );

          // Show toast for high/urgent priority
          if (['high', 'urgent'].includes(newNotification.priority)) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.priority === 'urgent' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;

          queryClient.setQueryData(
            ['notifications', user?.id, initialFilters],
            (old: Notification[] | undefined) =>
              old?.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;

          queryClient.setQueryData(
            ['notifications', user?.id, initialFilters],
            (old: Notification[] | undefined) => old?.filter((n) => n.id !== deletedId)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime, user?.id, queryClient, toast, initialFilters, limit]);

  // Helper: Get notification action URL
  const getActionUrl = useCallback((notification: Notification): string | null => {
    return notification.data?.action_url || null;
  }, []);

  // Helper: Filter notifications by type
  const filterByType = useCallback(
    (type: NotificationType | NotificationType[]): Notification[] => {
      const types = Array.isArray(type) ? type : [type];
      return notifications?.filter((n) => types.includes(n.type)) || [];
    },
    [notifications]
  );

  // Helper: Get urgent notifications
  const getUrgentNotifications = useCallback((): Notification[] => {
    return notifications?.filter((n) => n.priority === 'urgent' && !n.read) || [];
  }, [notifications]);

  // Check for urgent unread notifications
  const hasUrgent = unreadByPriority.urgent > 0;

  return {
    // Data
    notifications: notifications || [],
    groupedNotifications,
    unreadCount,
    unreadByPriority,
    hasUrgent,
    isLoading,
    error: error as Error | null,

    // Helpers
    getActionUrl,
    filterByType,
    getUrgentNotifications,

    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadAsync: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutate,
    deleteNotificationAsync: deleteNotificationMutation.mutateAsync,
    clearReadNotifications: clearReadNotificationsMutation.mutate,
    clearReadNotificationsAsync: clearReadNotificationsMutation.mutateAsync,
    refetch,

    // Loading states
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isClearing: clearReadNotificationsMutation.isPending,
  };
}

export default useNotifications;
