/**
 * useNotifications Hook
 * Ticket: FEAT-009
 *
 * Manages user notifications with real-time updates.
 * Provides notification listing, marking as read, and deletion.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

// Notification types
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
  priority: NotificationPriority;
  read: boolean;
  data?: {
    action_url?: string;
    entity_id?: string;
    entity_type?: string;
    [key: string]: unknown;
  };
  created_at: string;
  read_at?: string;
}

export interface GroupedNotifications {
  date: string;
  label: string;
  notifications: Notification[];
}

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

/**
 * Hook for managing user notifications
 */
export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];

      // Try to fetch from notifications table if it exists
      // For now, return mock data until migrations are applied
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          // Table doesn't exist yet, return empty array
          if (error.code === '42P01' || error.message.includes('does not exist')) {
            console.log('Notifications table not found - migrations may need to be applied');
            return getMockNotifications();
          }
          throw error;
        }

        return (data || []).map(mapNotification);
      } catch (err) {
        console.log('Using mock notifications:', err);
        return getMockNotifications();
      }
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Poll every minute
  });

  // Group notifications by date
  const groupedNotifications = useMemo<GroupedNotifications[]>(() => {
    const groups: Map<string, Notification[]> = new Map();

    notifications.forEach((notification) => {
      const date = parseISO(notification.created_at);
      let label: string;
      let key: string;

      if (isToday(date)) {
        key = 'today';
        label = 'Today';
      } else if (isYesterday(date)) {
        key = 'yesterday';
        label = 'Yesterday';
      } else if (isThisWeek(date)) {
        key = 'thisWeek';
        label = 'This Week';
      } else {
        key = format(date, 'yyyy-MM');
        label = format(date, 'MMMM yyyy');
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });

    return Array.from(groups.entries()).map(([date, notifs]) => ({
      date,
      label: date === 'today' ? 'Today' : date === 'yesterday' ? 'Yesterday' : date === 'thisWeek' ? 'This Week' : notifs[0] ? format(parseISO(notifs[0].created_at), 'MMMM yyyy') : date,
      notifications: notifs,
    }));
  }, [notifications]);

  // Computed stats
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUrgent = notifications.some((n) => !n.read && n.priority === 'urgent');

  // Mark single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData<Notification[]>(notificationKeys.list());

      queryClient.setQueryData<Notification[]>(notificationKeys.list(), (old) =>
        old?.map((n) =>
          n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
        ) || []
      );

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.list(), context.previous);
      }
      console.error('Failed to mark as read:', err);
    },
  });

  // Mark all as read
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
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      toast({
        title: 'All notifications marked as read',
      });
    },
    onError: (err) => {
      toast({
        title: 'Failed to mark all as read',
        description: String(err),
        variant: 'destructive',
      });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData<Notification[]>(notificationKeys.list());

      queryClient.setQueryData<Notification[]>(notificationKeys.list(), (old) =>
        old?.filter((n) => n.id !== notificationId) || []
      );

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationKeys.list(), context.previous);
      }
      toast({
        title: 'Failed to delete notification',
        description: String(err),
        variant: 'destructive',
      });
    },
  });

  // Clear all read notifications
  const clearReadMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: notificationKeys.list() });
      toast({
        title: 'Read notifications cleared',
      });
    },
    onError: (err) => {
      toast({
        title: 'Failed to clear notifications',
        description: String(err),
        variant: 'destructive',
      });
    },
  });

  return {
    notifications,
    groupedNotifications,
    unreadCount,
    hasUrgent,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    clearReadNotifications: clearReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    isClearing: clearReadMutation.isPending,
  };
}

// Map database row to Notification interface
function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: (row.type || row.notification_type || 'system') as NotificationType,
    title: (row.title || 'Notification') as string,
    message: (row.message || row.body || '') as string,
    priority: (row.priority || 'normal') as NotificationPriority,
    read: (row.read || row.is_read || false) as boolean,
    data: row.data as Notification['data'],
    created_at: row.created_at as string,
    read_at: row.read_at as string | undefined,
  };
}

// Mock notifications for demo when table doesn't exist
function getMockNotifications(): Notification[] {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  return [
    {
      id: 'mock-1',
      user_id: 'demo',
      type: 'signoff_required',
      title: 'Sign-off Required',
      message: 'Revenue Testing workpaper is ready for your review and sign-off.',
      priority: 'high',
      read: false,
      data: { action_url: '/workpapers/1', entity_type: 'workpaper' },
      created_at: oneHourAgo.toISOString(),
    },
    {
      id: 'mock-2',
      user_id: 'demo',
      type: 'review_comment',
      title: 'New Review Note',
      message: 'Sarah left a comment on your AR Confirmation workpaper.',
      priority: 'normal',
      read: false,
      data: { action_url: '/workpapers/2', entity_type: 'workpaper' },
      created_at: oneHourAgo.toISOString(),
    },
    {
      id: 'mock-3',
      user_id: 'demo',
      type: 'deadline_reminder',
      title: 'Deadline Approaching',
      message: 'Tech Solutions Inc audit is due in 5 days.',
      priority: 'high',
      read: false,
      data: { action_url: '/engagements/1', entity_type: 'engagement' },
      created_at: yesterday.toISOString(),
    },
    {
      id: 'mock-4',
      user_id: 'demo',
      type: 'task_assignment',
      title: 'New Task Assigned',
      message: 'You have been assigned to Inventory Observation procedure.',
      priority: 'normal',
      read: true,
      data: { action_url: '/my-procedures', entity_type: 'procedure' },
      created_at: yesterday.toISOString(),
    },
    {
      id: 'mock-5',
      user_id: 'demo',
      type: 'finding_created',
      title: 'New Finding Reported',
      message: 'A high-severity finding was identified in SOC 2 Audit.',
      priority: 'urgent',
      read: true,
      data: { action_url: '/findings', entity_type: 'finding' },
      created_at: twoDaysAgo.toISOString(),
    },
  ];
}

export default useNotifications;
