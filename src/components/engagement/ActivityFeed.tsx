/**
 * ActivityFeed Component
 * Real-time activity feed for engagement detail page
 * Issue #1: Missing Engagement Detail Page
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEngagementActivity } from '@/hooks/useEngagement';
import { formatActivityType } from '@/utils/engagement';
import {
  FileText,
  Upload,
  Clock,
  GitCommit,
  AlertCircle,
  Users,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityFeedProps {
  engagementId: string;
  limit?: number;
}

const activityIcons: Record<string, any> = {
  workpaper_added: FileText,
  evidence_uploaded: Upload,
  time_logged: Clock,
  status_changed: GitCommit,
  phase_changed: GitCommit,
  procedure_completed: CheckCircle2,
  finding_added: AlertCircle,
  team_member_added: Users,
  team_member_removed: Users,
  milestone_completed: CheckCircle2,
  comment_added: MessageSquare,
};

const activityColors: Record<string, string> = {
  workpaper_added: 'text-blue-500',
  evidence_uploaded: 'text-purple-500',
  time_logged: 'text-green-500',
  status_changed: 'text-orange-500',
  phase_changed: 'text-orange-500',
  procedure_completed: 'text-emerald-500',
  finding_added: 'text-red-500',
  team_member_added: 'text-blue-500',
  team_member_removed: 'text-gray-500',
  milestone_completed: 'text-emerald-500',
  comment_added: 'text-yellow-500',
};

export function ActivityFeed({ engagementId, limit = 20 }: ActivityFeedProps) {
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const { data: activities, isLoading, refetch } = useEngagementActivity(engagementId, limit);

  // Filter activities based on selected filter
  const filteredActivities =
    activityFilter === 'all'
      ? activities
      : activities?.filter((activity) => activity.activity_type === activityFilter);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading activity feed...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Track all actions and updates for this engagement
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="workpaper_added">Workpapers</SelectItem>
                <SelectItem value="evidence_uploaded">Evidence</SelectItem>
                <SelectItem value="procedure_completed">Procedures</SelectItem>
                <SelectItem value="finding_added">Findings</SelectItem>
                <SelectItem value="time_logged">Time Entries</SelectItem>
                <SelectItem value="status_changed">Status Changes</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filteredActivities || filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activityFilter === 'all'
                ? 'Activity will appear here as work progresses'
                : 'No activity of this type found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const Icon = activityIcons[activity.activity_type] || FileText;
              const iconColor = activityColors[activity.activity_type] || 'text-gray-500';

              return (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {activity.profiles?.full_name || 'Unknown user'}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {activity.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {formatActivityType(activity.activity_type)}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredActivities && filteredActivities.length >= limit && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full">
              Load More Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
