/**
 * useNavigationBadges Hook
 * Ticket: CTX-001, UI-002
 *
 * Fetches badge counts for navigation items that display dynamic counts.
 * Features:
 * - Parallel queries for all badge counts
 * - Real-time subscriptions for instant updates
 * - Optimistic updates with animation triggers
 * - Debounced refetching to prevent excessive updates
 *
 * UI-002 enhancements:
 * - Added real-time subscriptions for key tables
 * - Badge change notifications for animations
 * - Configurable polling and stale times
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BadgeCounts {
  [itemId: string]: number;
}

interface BadgeChange {
  itemId: string;
  oldCount: number;
  newCount: number;
  direction: 'increase' | 'decrease';
}

/** Tables that should trigger badge updates when changed */
// NOTE: 'engagements' and 'information_requests' tables don't exist
// Using 'audits' instead of 'engagements' for approvals
const WATCHED_TABLES = [
  'engagement_procedures',
  'tasks',
  'audits', // Changed from 'engagements' which doesn't exist
  'audit_findings',
  'confirmations',
] as const;

/**
 * Fetch all navigation badge counts in parallel
 */
async function fetchBadgeCounts(userId: string): Promise<BadgeCounts> {
  const counts: BadgeCounts = {};

  try {
    // Run all queries in parallel for performance
    // NOTE: Schema fixes applied:
    // - tasks uses 'assigned_to' not 'assignee_id'
    // - 'engagements' table doesn't exist, using 'audits' with workflow_status
    // - 'information_requests' table doesn't exist, query removed
    const [
      proceduresResult,
      tasksResult,
      reviewResult,
      approvalsResult,
      findingsResult,
      confirmationsResult,
    ] = await Promise.all([
      // My Procedures: assigned to user, not completed
      supabase
        .from('engagement_procedures')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .in('status', ['not_started', 'in_progress']),

      // Tasks: pending tasks assigned to user (fixed: assignee_id -> assigned_to)
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'pending'),

      // Review Queue: procedures awaiting review
      supabase
        .from('engagement_procedures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_review'),

      // Approvals: audits pending approval (using audits table, not engagements)
      supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .eq('workflow_status', 'pending_approval'),

      // Findings: open audit findings
      supabase
        .from('audit_findings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),

      // Confirmations: sent, awaiting response
      supabase
        .from('confirmations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent'),
    ]);

    // Map results to item IDs
    counts['my-procedures'] = proceduresResult.count || 0;
    counts['tasks'] = tasksResult.count || 0;
    counts['review-queue'] = reviewResult.count || 0;
    counts['approvals'] = approvalsResult.count || 0;
    counts['findings'] = findingsResult.count || 0;
    counts['information-requests'] = 0; // Table doesn't exist
    counts['confirmations'] = confirmationsResult.count || 0;

  } catch (error) {
    console.error('Error fetching navigation badge counts:', error);
    // Return zeros on error to prevent UI breakage
  }

  return counts;
}

/**
 * Debounce function for refetch calls
 */
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  return ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface UseNavigationBadgesOptions {
  /** Polling interval in ms (default: 60000) */
  pollingInterval?: number;
  /** Stale time in ms (default: 30000) */
  staleTime?: number;
  /** Enable real-time subscriptions (default: true) */
  enableRealtime?: boolean;
  /** Callback when badge count changes */
  onBadgeChange?: (change: BadgeChange) => void;
}

/**
 * Hook to fetch and maintain navigation badge counts
 *
 * @param options Configuration options
 * @returns Object containing badge counts keyed by navigation item ID
 *
 * @example
 * ```tsx
 * const { badgeCounts, isLoading, recentChanges } = useNavigationBadges({
 *   onBadgeChange: (change) => {
 *     console.log(`${change.itemId}: ${change.oldCount} -> ${change.newCount}`);
 *   }
 * });
 * ```
 */
export function useNavigationBadges(options: UseNavigationBadgesOptions = {}) {
  const {
    pollingInterval = 60000,
    staleTime = 30000,
    enableRealtime = true,
    onBadgeChange,
  } = options;

  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const previousCounts = useRef<BadgeCounts>({});
  const recentChanges = useRef<BadgeChange[]>([]);

  const {
    data: badgeCounts = {},
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['navigation-badges', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};
      return fetchBadgeCounts(profile.id);
    },
    enabled: !!profile?.id,
    refetchInterval: pollingInterval,
    staleTime: staleTime,
    refetchOnWindowFocus: false,
  });

  // Track badge changes for animations
  useEffect(() => {
    if (Object.keys(previousCounts.current).length === 0) {
      previousCounts.current = badgeCounts;
      return;
    }

    const changes: BadgeChange[] = [];
    for (const [itemId, newCount] of Object.entries(badgeCounts)) {
      const oldCount = previousCounts.current[itemId] || 0;
      if (oldCount !== newCount) {
        const change: BadgeChange = {
          itemId,
          oldCount,
          newCount,
          direction: newCount > oldCount ? 'increase' : 'decrease',
        };
        changes.push(change);
        onBadgeChange?.(change);
      }
    }

    if (changes.length > 0) {
      // Keep last 10 changes for animation purposes
      recentChanges.current = [...changes, ...recentChanges.current].slice(0, 10);
    }

    previousCounts.current = badgeCounts;
  }, [badgeCounts, onBadgeChange]);

  // Debounced refetch for real-time updates
  const debouncedRefetch = useCallback(
    debounce(() => {
      queryClient.invalidateQueries({
        queryKey: ['navigation-badges', profile?.id],
      });
    }, 500),
    [queryClient, profile?.id]
  );

  // Set up real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !profile?.id) return;

    const subscriptions = WATCHED_TABLES.map((table) => {
      return supabase
        .channel(`nav-badges-${table}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          () => {
            // Debounce refetch to prevent too many updates
            debouncedRefetch();
          }
        )
        .subscribe();
    });

    return () => {
      subscriptions.forEach((sub) => {
        supabase.removeChannel(sub);
      });
    };
  }, [enableRealtime, profile?.id, debouncedRefetch]);

  return {
    badgeCounts,
    isLoading,
    error,
    refetch,
    /** Recent badge changes for animation triggers */
    recentChanges: recentChanges.current,
    /** Check if a specific badge recently increased */
    hasRecentIncrease: (itemId: string) =>
      recentChanges.current.some(
        (c) => c.itemId === itemId && c.direction === 'increase'
      ),
  };
}

export default useNavigationBadges;
