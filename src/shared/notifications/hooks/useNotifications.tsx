import { useState, useEffect } from 'react';
import { NotificationService } from '../NotificationService';
import { Notification, NotificationFilter } from '../types';
import { supabase } from '@/integrations/supabase/client';

export function useNotifications(filter: NotificationFilter = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    const list = await NotificationService.listNotifications(filter);
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.read).length);
    setIsLoading(false);
  };

  useEffect(() => {
    const setupNotifications = async () => {
      await loadNotifications();

      // Subscribe to real-time notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupNotifications();
  }, [JSON.stringify(filter)]);

  const markAsRead = async (notificationId: string) => {
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const success = await NotificationService.markAllAsRead();
    if (success) {
      loadNotifications();
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const success = await NotificationService.deleteNotification(notificationId);
    if (success) {
      loadNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications,
  };
}
