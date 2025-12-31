/**
 * useEngagementRealtime Hook
 * Ticket: FEAT-006
 *
 * Provides real-time subscriptions for engagement data changes.
 * Listens to workpapers, procedures, findings, and notifications
 * and triggers cache invalidations for React Query.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Event types for external consumption
export type RealtimeEventType =
  | 'workpaper_created'
  | 'workpaper_updated'
  | 'workpaper_deleted'
  | 'procedure_created'
  | 'procedure_updated'
  | 'procedure_deleted'
  | 'finding_created'
  | 'finding_updated'
  | 'finding_deleted'
  | 'signoff_created'
  | 'signoff_revoked'
  | 'review_note_created'
  | 'review_note_updated'
  | 'notification_received';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: Record<string, any>;
  timestamp: Date;
}

interface UseEngagementRealtimeOptions {
  /** Engagement ID to subscribe to */
  engagementId: string | undefined;
  /** Enable/disable the subscription */
  enabled?: boolean;
  /** Show toast notifications for certain events */
  showNotifications?: boolean;
  /** Callback for all events */
  onEvent?: (event: RealtimeEvent) => void;
  /** Callback for specific event types */
  onWorkpaperChange?: (payload: Record<string, any>) => void;
  onProcedureChange?: (payload: Record<string, any>) => void;
  onFindingChange?: (payload: Record<string, any>) => void;
  onSignoffChange?: (payload: Record<string, any>) => void;
  onReviewNoteChange?: (payload: Record<string, any>) => void;
  onNotification?: (payload: Record<string, any>) => void;
}

/**
 * Hook for subscribing to real-time engagement updates
 */
export function useEngagementRealtime(options: UseEngagementRealtimeOptions) {
  const {
    engagementId,
    enabled = true,
    showNotifications = true,
    onEvent,
    onWorkpaperChange,
    onProcedureChange,
    onFindingChange,
    onSignoffChange,
    onReviewNoteChange,
    onNotification,
  } = options;

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  // Emit event helper
  const emitEvent = useCallback(
    (type: RealtimeEventType, payload: Record<string, any>) => {
      const event: RealtimeEvent = {
        type,
        payload,
        timestamp: new Date(),
      };
      setLastEvent(event);
      onEvent?.(event);
    },
    [onEvent]
  );

  // Handle workpaper changes
  const handleWorkpaperChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('workpaper_created', data);
        if (showNotifications && data?.prepared_by !== user?.id) {
          toast({
            title: 'New Workpaper',
            description: `A new workpaper "${data?.title || 'Untitled'}" has been created.`,
          });
        }
      } else if (eventType === 'UPDATE') {
        emitEvent('workpaper_updated', data);
      } else if (eventType === 'DELETE') {
        emitEvent('workpaper_deleted', payload.old);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['audit-workpapers', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['review-queue-workpapers', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-stats', engagementId] });

      onWorkpaperChange?.(data || {});
    },
    [engagementId, queryClient, emitEvent, showNotifications, toast, user?.id, onWorkpaperChange]
  );

  // Handle procedure changes
  const handleProcedureChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('procedure_created', data);
      } else if (eventType === 'UPDATE') {
        emitEvent('procedure_updated', data);
      } else if (eventType === 'DELETE') {
        emitEvent('procedure_deleted', payload.old);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['audit-procedures', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['procedure-execution', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['review-queue-procedures', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-stats', engagementId] });

      onProcedureChange?.(data || {});
    },
    [engagementId, queryClient, emitEvent, onProcedureChange]
  );

  // Handle finding changes
  const handleFindingChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('finding_created', data);
        if (showNotifications && data?.identified_by !== user?.id) {
          const severity = data?.severity || 'medium';
          if (['critical', 'high'].includes(severity)) {
            toast({
              title: `New ${severity.charAt(0).toUpperCase() + severity.slice(1)} Finding`,
              description: data?.title || 'A new finding has been identified.',
              variant: 'destructive',
            });
          }
        }
      } else if (eventType === 'UPDATE') {
        emitEvent('finding_updated', data);
      } else if (eventType === 'DELETE') {
        emitEvent('finding_deleted', payload.old);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-finding-stats', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-stats', engagementId] });

      onFindingChange?.(data || {});
    },
    [engagementId, queryClient, emitEvent, showNotifications, toast, user?.id, onFindingChange]
  );

  // Handle signoff changes
  const handleSignoffChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('signoff_created', data);
        if (showNotifications) {
          toast({
            title: 'Sign-off Added',
            description: `A ${data?.signoff_type || ''} sign-off has been completed.`,
          });
        }
      } else if (eventType === 'DELETE') {
        emitEvent('signoff_revoked', payload.old);
        if (showNotifications) {
          toast({
            title: 'Sign-off Revoked',
            description: 'A sign-off has been revoked.',
            variant: 'destructive',
          });
        }
      }

      // Invalidate signoff queries
      const workpaperId = data?.workpaper_id;
      if (workpaperId) {
        queryClient.invalidateQueries({ queryKey: ['workpaper-signoffs', workpaperId] });
      }
      queryClient.invalidateQueries({ queryKey: ['engagement-stats', engagementId] });

      onSignoffChange?.(data || {});
    },
    [engagementId, queryClient, emitEvent, showNotifications, toast, onSignoffChange]
  );

  // Handle review note changes
  const handleReviewNoteChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('review_note_created', data);
        if (showNotifications && data?.created_by !== user?.id) {
          toast({
            title: 'New Review Note',
            description: 'A new review note has been added.',
          });
        }
      } else if (eventType === 'UPDATE') {
        emitEvent('review_note_updated', data);
      }

      // Invalidate review notes queries
      const workpaperId = data?.workpaper_id;
      if (workpaperId) {
        queryClient.invalidateQueries({ queryKey: ['review-notes', workpaperId] });
      }

      onReviewNoteChange?.(data || {});
    },
    [queryClient, emitEvent, showNotifications, toast, user?.id, onReviewNoteChange]
  );

  // Handle notification changes (user-specific)
  const handleNotificationChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
      const eventType = payload.eventType;
      const data = payload.new || payload.old;

      if (eventType === 'INSERT') {
        emitEvent('notification_received', data);

        // Show browser notification if not focused
        if (showNotifications && document.hidden) {
          if (Notification.permission === 'granted') {
            new Notification(data?.title || 'New Notification', {
              body: data?.message || '',
              icon: '/favicon.ico',
            });
          }
        }
      }

      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });

      onNotification?.(data || {});
    },
    [queryClient, emitEvent, showNotifications, onNotification]
  );

  // Set up subscriptions
  useEffect(() => {
    if (!enabled || !engagementId || !user?.id) {
      return;
    }

    const channels: RealtimeChannel[] = [];

    // Subscribe to workpapers channel
    const workpapersChannel = supabase
      .channel(`workpapers:${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_workpapers',
          filter: `engagement_id=eq.${engagementId}`,
        },
        handleWorkpaperChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });
    channels.push(workpapersChannel);

    // Subscribe to procedures channel
    const proceduresChannel = supabase
      .channel(`procedures:${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_procedures',
          filter: `engagement_id=eq.${engagementId}`,
        },
        handleProcedureChange
      )
      .subscribe();
    channels.push(proceduresChannel);

    // Subscribe to findings channel
    const findingsChannel = supabase
      .channel(`findings:${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_findings',
          filter: `engagement_id=eq.${engagementId}`,
        },
        handleFindingChange
      )
      .subscribe();
    channels.push(findingsChannel);

    // Subscribe to signoffs channel (no engagement filter - uses workpaper_id)
    const signoffsChannel = supabase
      .channel(`signoffs:${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workpaper_signoffs',
        },
        handleSignoffChange
      )
      .subscribe();
    channels.push(signoffsChannel);

    // Subscribe to review notes channel
    const reviewNotesChannel = supabase
      .channel(`review_notes:${engagementId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_notes',
        },
        handleReviewNoteChange
      )
      .subscribe();
    channels.push(reviewNotesChannel);

    // Subscribe to user notifications
    const notificationsChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        handleNotificationChange
      )
      .subscribe();
    channels.push(notificationsChannel);

    channelsRef.current = channels;

    // Cleanup
    return () => {
      setIsConnected(false);
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [
    enabled,
    engagementId,
    user?.id,
    handleWorkpaperChange,
    handleProcedureChange,
    handleFindingChange,
    handleSignoffChange,
    handleReviewNoteChange,
    handleNotificationChange,
  ]);

  // Request browser notification permission
  useEffect(() => {
    if (showNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [showNotifications]);

  // Manual refresh function
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audit-workpapers', engagementId] });
    queryClient.invalidateQueries({ queryKey: ['audit-procedures', engagementId] });
    queryClient.invalidateQueries({ queryKey: ['finding-management', engagementId] });
    queryClient.invalidateQueries({ queryKey: ['engagement-stats', engagementId] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient, engagementId]);

  // Reconnect function
  const reconnect = useCallback(() => {
    // Remove existing channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    setIsConnected(false);

    // The useEffect will re-subscribe
    // Force a re-render to trigger the effect
    setLastEvent({ type: 'workpaper_updated', payload: {}, timestamp: new Date() });
  }, []);

  return {
    isConnected,
    lastEvent,
    refresh,
    reconnect,
  };
}

export default useEngagementRealtime;
