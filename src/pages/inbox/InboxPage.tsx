/**
 * InboxPage Component
 * Ticket: FEAT-009
 *
 * Notification inbox page for viewing and managing all notifications.
 * Includes filtering, bulk actions, and deep linking to related items.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Archive,
  Trash2,
  Search,
  Filter,
  MoreHorizontal,
  MessageSquare,
  AlertCircle,
  Clock,
  FileText,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

// Notification type icons and colors
const notificationTypeConfig: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  review_note: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  signoff_request: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  changes_requested: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  deadline_reminder: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  status_change: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  assignment: {
    icon: ClipboardList,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  mention: {
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  system: {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

// Priority configuration
const priorityConfig = {
  urgent: { color: 'text-red-600 bg-red-100', label: 'Urgent' },
  high: { color: 'text-orange-600 bg-orange-100', label: 'High' },
  medium: { color: 'text-yellow-600 bg-yellow-100', label: 'Medium' },
  low: { color: 'text-gray-600 bg-gray-100', label: 'Low' },
};

export function InboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    isMarkingRead,
    isArchiving,
  } = useNotifications();

  // Filter notifications based on tab and filters
  const filteredNotifications = useMemo(() => {
    let items = notifications || [];

    // Tab filter
    if (activeTab === 'unread') {
      items = items.filter((n) => !n.is_read);
    } else if (activeTab === 'archived') {
      items = items.filter((n) => n.is_archived);
    } else {
      items = items.filter((n) => !n.is_archived);
    }

    // Type filter
    if (typeFilter !== 'all') {
      items = items.filter((n) => n.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
      );
    }

    return items;
  }, [notifications, activeTab, typeFilter, searchQuery]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach((id) => {
      markAsRead(id);
    });
    setSelectedIds(new Set());
  };

  const handleBulkArchive = () => {
    selectedIds.forEach((id) => {
      archiveNotification(id);
    });
    setSelectedIds(new Set());
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const isAllSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.has(n.id));

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium">Failed to load notifications</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Inbox
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  All
                </TabsTrigger>
                <TabsTrigger value="unread" className="gap-2">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(notificationTypeConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4', config.color)} />
                          {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-2 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button variant="ghost" size="sm" onClick={handleBulkMarkRead}>
                <Check className="h-4 w-4 mr-1" />
                Mark Read
              </Button>
              <Button variant="ghost" size="sm" onClick={handleBulkArchive}>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              {activeTab === 'unread' ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-muted-foreground">
                    You have no unread notifications.
                  </p>
                </>
              ) : activeTab === 'archived' ? (
                <>
                  <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No archived notifications</h3>
                  <p className="text-muted-foreground">
                    Archived notifications will appear here.
                  </p>
                </>
              ) : (
                <>
                  <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-muted-foreground">
                    You'll see notifications here when there's activity.
                  </p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              {/* Select All */}
              <div className="flex items-center gap-3 p-2 border-b mb-2">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({filteredNotifications.length})
                </span>
              </div>

              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
                  const TypeIcon = typeConfig.icon;
                  const isSelected = selectedIds.has(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-4 p-4 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50',
                        !notification.is_read && 'bg-primary/5 border-primary/20',
                        isSelected && 'ring-2 ring-primary'
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelect(notification.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div
                        className={cn(
                          'p-2 rounded-full flex-shrink-0',
                          typeConfig.bgColor
                        )}
                      >
                        <TypeIcon className={cn('h-5 w-5', typeConfig.color)} />
                      </div>

                      <div
                        className="flex-1 min-w-0"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4
                              className={cn(
                                'font-medium',
                                !notification.is_read && 'text-primary'
                              )}
                            >
                              {notification.title}
                            </h4>
                            {notification.message && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {notification.message}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notification.priority &&
                              notification.priority !== 'low' && (
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'text-xs',
                                    priorityConfig[notification.priority]?.color
                                  )}
                                >
                                  {priorityConfig[notification.priority]?.label}
                                </Badge>
                              )}

                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {notification.entity_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize">
                                {notification.entity_type}
                              </span>
                            </>
                          )}
                          {notification.action_url && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary">
                                <ExternalLink className="h-3 w-3" />
                                View
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.is_read && (
                            <DropdownMenuItem
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => archiveNotification(notification.id)}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            {notification.is_archived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteNotification(notification.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InboxPage;
