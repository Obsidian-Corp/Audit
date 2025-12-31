/**
 * ==================================================================
 * REALTIME SUBSCRIPTION HOOKS
 * ==================================================================
 * Supabase real-time subscriptions for collaborative editing
 * and live updates across the audit platform
 * ==================================================================
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

type TableName =
  | 'review_notes'
  | 'audit_procedures'
  | 'signoffs'
  | 'audit_adjustments'
  | 'tcwg_communications'
  | 'subsequent_events'
  | 'related_parties'
  | 'trial_balance_accounts'
  | 'audit_findings';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeConfig {
  table: TableName;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  invalidateQueries?: string[];
  showNotifications?: boolean;
}

interface UseRealtimeOptions {
  enabled?: boolean;
  engagementId?: string;
}

// ============================================
// Core Hook: useRealtimeSubscription
// ============================================

/**
 * Subscribe to real-time changes for a specific table
 */
export function useRealtimeSubscription(
  config: RealtimeConfig,
  options: UseRealtimeOptions = {}
) {
  const { enabled = true, engagementId } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<any>) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // Call specific handlers
      switch (eventType) {
        case 'INSERT':
          config.onInsert?.(newRecord);
          break;
        case 'UPDATE':
          config.onUpdate?.(newRecord);
          break;
        case 'DELETE':
          config.onDelete?.(oldRecord);
          break;
      }

      // Invalidate queries to refresh data
      if (config.invalidateQueries) {
        config.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }

      // Show notification if enabled
      if (config.showNotifications) {
        const actionMessages: Record<ChangeEvent, string> = {
          INSERT: 'New item added',
          UPDATE: 'Item updated',
          DELETE: 'Item removed',
        };
        toast({
          title: `${config.table.replace(/_/g, ' ')}`,
          description: actionMessages[eventType as ChangeEvent],
        });
      }
    },
    [config, queryClient, toast]
  );

  useEffect(() => {
    if (!enabled) return;

    // Build filter based on engagement
    const filter = engagementId
      ? `engagement_id=eq.${engagementId}`
      : config.filter;

    // Create channel
    const channel = supabase
      .channel(`${config.table}-changes-${engagementId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.table,
          filter,
        },
        handleChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${config.table} changes`);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [enabled, engagementId, config.table, config.filter, handleChange]);

  return {
    unsubscribe: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    },
  };
}

// ============================================
// Specialized Hooks
// ============================================

/**
 * Subscribe to review notes updates
 */
export function useRealtimeReviewNotes(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  const queryClient = useQueryClient();

  return useRealtimeSubscription(
    {
      table: 'review_notes',
      invalidateQueries: ['review-notes', engagementId],
      showNotifications: options?.showNotifications ?? true,
      onInsert: (note) => {
        // Optimistically add to cache
        queryClient.setQueryData(
          ['review-notes', engagementId],
          (old: any[] = []) => [...old, note]
        );
      },
      onUpdate: (note) => {
        // Update in cache
        queryClient.setQueryData(
          ['review-notes', engagementId],
          (old: any[] = []) =>
            old.map((n) => (n.id === note.id ? note : n))
        );
      },
      onDelete: (note) => {
        // Remove from cache
        queryClient.setQueryData(
          ['review-notes', engagementId],
          (old: any[] = []) => old.filter((n) => n.id !== note.id)
        );
      },
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to audit procedure updates
 */
export function useRealtimeProcedures(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'audit_procedures',
      invalidateQueries: ['audit-procedures', engagementId],
      showNotifications: options?.showNotifications,
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to signoff updates
 */
export function useRealtimeSignoffs(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'signoffs',
      invalidateQueries: ['signoffs', engagementId],
      showNotifications: options?.showNotifications ?? true,
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to audit adjustment updates
 */
export function useRealtimeAdjustments(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'audit_adjustments',
      invalidateQueries: ['audit-adjustments', engagementId, 'sum', engagementId],
      showNotifications: options?.showNotifications ?? true,
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to TCWG communication updates
 */
export function useRealtimeTCWG(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'tcwg_communications',
      invalidateQueries: ['tcwg-communications', engagementId],
      showNotifications: options?.showNotifications,
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to subsequent events updates
 */
export function useRealtimeSubsequentEvents(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'subsequent_events',
      invalidateQueries: ['subsequent-events', engagementId],
      showNotifications: options?.showNotifications ?? true,
    },
    { enabled: !!engagementId, engagementId }
  );
}

/**
 * Subscribe to audit findings updates
 */
export function useRealtimeFindings(
  engagementId: string,
  options?: { showNotifications?: boolean }
) {
  return useRealtimeSubscription(
    {
      table: 'audit_findings',
      invalidateQueries: ['audit-findings', engagementId],
      showNotifications: options?.showNotifications ?? true,
    },
    { enabled: !!engagementId, engagementId }
  );
}

// ============================================
// Presence Hook for Collaborative Editing
// ============================================

interface PresenceState {
  oderId: string;
  userName: string;
  userEmail: string;
  currentLocation: string;
  joinedAt: string;
}

/**
 * Track user presence for real-time collaboration
 */
export function usePresence(engagementId: string, user: { id: string; name: string; email: string }) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceRef = useRef<Record<string, PresenceState[]>>({});

  useEffect(() => {
    if (!engagementId || !user?.id) return;

    const channel = supabase.channel(`presence-${engagementId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        presenceRef.current = state;
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            oderId: user.id,
            userName: user.name,
            userEmail: user.email,
            currentLocation: window.location.pathname,
            joinedAt: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [engagementId, user?.id, user?.name, user?.email]);

  const updateLocation = useCallback(
    async (location: string) => {
      if (channelRef.current && user?.id) {
        await channelRef.current.track({
          oderId: user.id,
          userName: user.name,
          userEmail: user.email,
          currentLocation: location,
          joinedAt: new Date().toISOString(),
        });
      }
    },
    [user]
  );

  return {
    presence: presenceRef.current,
    updateLocation,
  };
}

// ============================================
// Combined Hook for Engagement
// ============================================

/**
 * Subscribe to all relevant real-time updates for an engagement
 */
export function useEngagementRealtime(
  engagementId: string,
  options?: {
    showNotifications?: boolean;
    enablePresence?: boolean;
    user?: { id: string; name: string; email: string };
  }
) {
  const { showNotifications = false, enablePresence = false, user } = options || {};

  // Subscribe to all relevant tables
  useRealtimeReviewNotes(engagementId, { showNotifications });
  useRealtimeProcedures(engagementId, { showNotifications });
  useRealtimeSignoffs(engagementId, { showNotifications });
  useRealtimeAdjustments(engagementId, { showNotifications });
  useRealtimeTCWG(engagementId, { showNotifications });
  useRealtimeSubsequentEvents(engagementId, { showNotifications });
  useRealtimeFindings(engagementId, { showNotifications });

  // Optional presence tracking
  const presence = enablePresence && user
    ? usePresence(engagementId, user)
    : null;

  return { presence };
}
