export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  project_id?: string;
  task_id?: string;
  created_at: string;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_completed'
  | 'project_update'
  | 'deliverable_approved'
  | 'risk_escalated'
  | 'meeting_scheduled'
  | 'comment_added'
  | 'mention'
  | 'system';

export interface NotificationFilter {
  read?: boolean;
  type?: NotificationType;
  projectId?: string;
}
