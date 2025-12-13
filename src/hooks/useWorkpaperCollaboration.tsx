import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CollaboratorPresence {
  user_id: string;
  user_name: string;
  user_email: string;
  cursor_position?: number;
  selection?: { from: number; to: number };
  color: string;
  last_seen: string;
}

interface UseWorkpaperCollaborationProps {
  workpaperId: string;
  onPresenceChange?: (collaborators: CollaboratorPresence[]) => void;
}

const PRESENCE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function useWorkpaperCollaboration({
  workpaperId,
  onPresenceChange,
}: UseWorkpaperCollaborationProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [myColor] = useState(() => 
    PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)]
  );

  useEffect(() => {
    if (!workpaperId) return;

    let mounted = true;
    const setupCollaboration = async () => {
      if (!mounted) return;

      const mockUserId = 'anonymous-' + Math.random().toString(36).substring(7);
      const collaborationChannel = supabase.channel(`workpaper:${workpaperId}`, {
        config: {
          presence: {
            key: mockUserId,
          },
        },
      });

      collaborationChannel
        .on('presence', { event: 'sync' }, () => {
          const state = collaborationChannel.presenceState();
          const activeCollaborators: CollaboratorPresence[] = [];

          Object.keys(state).forEach((presenceId) => {
            const presences = state[presenceId] as any[];
            if (presences && presences[0]) {
              const presence = presences[0];
              if (presence.user_id && presence.user_name && presence.user_email && presence.color) {
                activeCollaborators.push(presence as CollaboratorPresence);
              }
            }
          });

          setCollaborators(activeCollaborators);
          onPresenceChange?.(activeCollaborators);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('User left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await collaborationChannel.track({
              user_id: mockUserId,
              user_name: 'Anonymous User',
              user_email: 'anonymous@example.com',
              color: myColor,
              last_seen: new Date().toISOString(),
            });
          }
        });

      setChannel(collaborationChannel);
    };

    setupCollaboration();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [workpaperId, myColor, onPresenceChange]);

  const updateCursorPosition = useCallback(async (position: number) => {
    if (!channel) return;

    await channel.track({
      user_id: 'anonymous',
      user_name: 'Anonymous User',
      user_email: 'anonymous@example.com',
      cursor_position: position,
      color: myColor,
      last_seen: new Date().toISOString(),
    });
  }, [channel, myColor]);

  const updateSelection = useCallback(async (from: number, to: number) => {
    if (!channel) return;

    await channel.track({
      user_id: 'anonymous',
      user_name: 'Anonymous User',
      user_email: 'anonymous@example.com',
      selection: { from, to },
      color: myColor,
      last_seen: new Date().toISOString(),
    });
  }, [channel, myColor]);

  return {
    collaborators,
    myColor,
    updateCursorPosition,
    updateSelection,
  };
}
