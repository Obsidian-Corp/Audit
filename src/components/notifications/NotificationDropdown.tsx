/**
 * NotificationDropdown Component
 * Ticket: UI-002
 *
 * Dropdown component for viewing and managing notifications.
 * Shows grouped notifications with mark as read and navigation actions.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useNotifications,
  Notification,
  NotificationType,
} from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  MessageSquare,
  FileCheck,
  UserPlus,
  AlertCircle,
  Trash2,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ElementType> = {
  task_assignment: UserPlus,
  review_comment: MessageSquare,
  signoff_required: FileCheck,
  approval: Check,
  deadline_reminder: Clock,
  finding_created: AlertCircle,
  mention: MessageSquare,
  system: Bell,
};

// Color mapping for notification types
const notificationColors: Record<NotificationType, string> = {
  task_assignment: 'text-blue-500',
  review_comment: 'text-purple-500',
  signoff_required: 'text-orange-500',
  approval: 'text-green-500',
  deadline_reminder: 'text-yellow-500',
  finding_created: 'text-red-500',
  mention: 'text-indigo-500',
  system: 'text-gray-500',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (url: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;
  const iconColor = notificationColors[notification.type] || 'text-gray-500';
  const actionUrl = notification.data?.action_url;

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (actionUrl) {
      onNavigate(actionUrl);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        notification.read
          ? 'bg-background hover:bg-muted/50'
          : 'bg-muted/30 hover:bg-muted/50'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          notification.priority === 'urgent'
            ? 'bg-red-100 dark:bg-red-900/20'
            : notification.priority === 'high'
            ? 'bg-orange-100 dark:bg-orange-900/20'
            : 'bg-muted'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            notification.priority === 'urgent'
              ? 'text-red-500'
              : notification.priority === 'high'
              ? 'text-orange-500'
              : iconColor
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p
              className={cn(
                'text-sm font-medium line-clamp-1',
                !notification.read && 'text-foreground'
              )}
            >
              {notification.title}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator */}
          {!notification.read && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
          )}
        </div>

        {/* Timestamp and actions */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </span>

          <div className="flex items-center gap-1">
            {actionUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(actionUrl);
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationDropdownProps {
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Align dropdown relative to trigger */
  align?: 'start' | 'center' | 'end';
  /** Side of trigger to show dropdown */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function NotificationDropdown({
  trigger,
  align = 'end',
  side = 'bottom',
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    groupedNotifications,
    unreadCount,
    hasUrgent,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    isMarkingAllRead,
    isClearing,
  } = useNotifications();

  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="relative">
            {hasUrgent ? (
              <BellRing className="h-5 w-5 animate-pulse text-red-500" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className={cn(
                  'absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs',
                  unreadCount > 9 && 'px-1'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        side={side}
        className="w-[380px] max-w-[calc(100vw-2rem)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-base font-semibold">
            Notifications
          </DropdownMenuLabel>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllRead}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Notifications list */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2">
              {groupedNotifications.map((group) => (
                <div key={group.date} className="mb-4 last:mb-0">
                  <h4 className="text-xs font-medium text-muted-foreground px-2 py-1 sticky top-0 bg-popover">
                    {group.label}
                  </h4>
                  <div className="space-y-1">
                    {group.notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-3 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => clearReadNotifications()}
                disabled={isClearing || notifications.every((n) => !n.read)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate('/settings/notifications');
                }}
              >
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationDropdown;
