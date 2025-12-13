import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationFilter, NotificationType } from './types';

export class NotificationService {
  static async listNotifications(filter: NotificationFilter = {}): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter.read !== undefined) {
        query = query.eq('read', filter.read);
      }
      if (filter.type) {
        query = query.eq('type', filter.type);
      }
      if (filter.projectId) {
        query = query.eq('project_id', filter.projectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Notification[];
    } catch (error) {
      console.error('Error listing notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          metadata: metadata || {},
          read: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  static getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      task_assigned: '📋',
      task_completed: '✅',
      project_update: '📊',
      deliverable_approved: '✔️',
      risk_escalated: '⚠️',
      meeting_scheduled: '📅',
      comment_added: '💬',
      mention: '👤',
      system: '🔔',
    };
    return icons[type] || '🔔';
  }
}
