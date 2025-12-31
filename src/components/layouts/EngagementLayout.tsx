/**
 * EngagementLayout
 * Ticket: UI-001
 *
 * Layout wrapper for all engagement-scoped routes.
 * Provides sidebar navigation, header with engagement info, and content outlet.
 */

import { ReactNode } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EngagementProvider,
  useEngagementContext,
} from '@/contexts/EngagementContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Building2,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ENGAGEMENT_NAVIGATION, NavigationItem } from '@/config/navigation';
import { useState } from 'react';

/**
 * Loading skeleton for engagement layout
 */
function EngagementSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-muted/30 p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-2 w-full mt-4" />
        <div className="space-y-2 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Error state for engagement
 */
function EngagementError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load engagement</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

/**
 * Engagement sidebar navigation item
 */
function SidebarNavItem({
  item,
  basePath,
  isCollapsed,
}: {
  item: NavigationItem;
  basePath: string;
  isCollapsed: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const fullPath = item.path
    ? `${basePath}/${item.path}`.replace('//', '/')
    : basePath;
  const isActive =
    item.path === ''
      ? location.pathname === basePath
      : location.pathname.startsWith(fullPath);

  const Icon = item.icon;

  // If has children, render as collapsible
  if (item.children && item.children.length > 0) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between',
              isCollapsed && 'justify-center'
            )}
          >
            <span className="flex items-center">
              <Icon className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">{item.label}</span>}
            </span>
            {!isCollapsed && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform',
                  isOpen && 'rotate-90'
                )}
              />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className={cn('ml-4 space-y-1', isCollapsed && 'ml-0')}>
            {item.children.map((child) => (
              <SidebarNavItem
                key={child.id}
                item={child}
                basePath={basePath}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // Render as button
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'w-full',
              isCollapsed ? 'justify-center' : 'justify-start'
            )}
            onClick={() => navigate(fullPath)}
          >
            <Icon className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">{item.label}</span>}
            {!isCollapsed && item.badge === 'count' && (
              <Badge variant="secondary" className="ml-auto">
                0
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <p>{item.label}</p>
            {item.description && (
              <p className="text-xs text-muted-foreground">{item.description}</p>
            )}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Engagement sidebar component
 */
function EngagementSidebarContent() {
  const { engagement, client, completionPercentage, daysUntilDue } =
    useEngagementContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const basePath = `/engagements/${id}`;

  return (
    <div
      className={cn(
        'flex flex-col h-full border-r bg-background transition-all',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/engagements')}
            className={isCollapsed ? 'w-full justify-center' : ''}
          >
            <ChevronLeft className="h-4 w-4" />
            {!isCollapsed && <span className="ml-1">Back</span>}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            {/* Client name */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">
                {client?.client_name || 'Unknown Client'}
              </span>
            </div>

            {/* Engagement title */}
            <p className="text-sm text-muted-foreground truncate">
              {engagement?.audit_title || 'Loading...'}
            </p>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {/* Days until due */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {daysUntilDue > 0
                  ? `${daysUntilDue} days remaining`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : `${Math.abs(daysUntilDue)} days overdue`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          {ENGAGEMENT_NAVIGATION.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              basePath={basePath}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

/**
 * Engagement header component
 */
function EngagementHeader() {
  const {
    engagement,
    client,
    isRefreshing,
    refreshEngagement,
    procedureStats,
    findingStats,
  } = useEngagementContext();

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    accepted: 'bg-blue-500',
    planning: 'bg-yellow-500',
    fieldwork: 'bg-orange-500',
    review: 'bg-purple-500',
    reporting: 'bg-indigo-500',
    complete: 'bg-green-500',
    on_hold: 'bg-gray-400',
    cancelled: 'bg-red-500',
  };

  const status = engagement?.workflow_status || engagement?.engagement_phase || 'draft';

  return (
    <header className="border-b bg-background px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold">
              {engagement?.audit_title || 'Loading...'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {client?.client_name || 'Unknown Client'}
            </p>
          </div>
          <Badge
            className={cn('capitalize', statusColors[status] || 'bg-gray-500')}
          >
            {status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {procedureStats.complete}/{procedureStats.total} procedures
            </span>
            <span>{findingStats.open} open findings</span>
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshEngagement}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Content area with loading gate
 */
function EngagementContent({ children }: { children: ReactNode }) {
  const { isLoading, error, refreshEngagement } = useEngagementContext();

  if (isLoading) {
    return <EngagementSkeleton />;
  }

  if (error) {
    return <EngagementError error={error} onRetry={refreshEngagement} />;
  }

  return <>{children}</>;
}

/**
 * Main EngagementLayout component
 * Wraps all engagement routes with context, sidebar, and header
 */
export function EngagementLayout() {
  return (
    <EngagementProvider>
      <div className="flex h-screen overflow-hidden">
        <EngagementSidebarContent />
        <div className="flex-1 flex flex-col overflow-hidden">
          <EngagementHeader />
          <main className="flex-1 overflow-auto p-6">
            <EngagementContent>
              <Outlet />
            </EngagementContent>
          </main>
        </div>
      </div>
    </EngagementProvider>
  );
}

export default EngagementLayout;
