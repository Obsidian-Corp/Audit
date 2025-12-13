import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface ImpersonationSession {
  session_id: string;
  token: string;
  expires_at: string;
  target_type: 'organization' | 'user';
  target_name: string;
}

interface ImpersonationStore {
  session: ImpersonationSession | null;
  isImpersonating: boolean;
  isStarting: boolean;
  startImpersonation: (params: {
    targetType: 'organization' | 'user';
    targetOrganizationId?: string;
    targetUserId?: string;
    targetName: string;
  }) => Promise<void>;
  endImpersonation: (reason: string) => Promise<void>;
  logAction: (action: {
    actionType: string;
    resourceType?: string;
    resourceId?: string;
    details?: any;
  }) => Promise<void>;
}

export const useImpersonation = create<ImpersonationStore>()(
  persist(
    (set, get) => ({
      session: null,
      isImpersonating: false,
      isStarting: false,

      startImpersonation: async (params) => {
        set({ isStarting: true });

        try {
          const { data, error } = await supabase.functions.invoke('admin-start-impersonation', {
            body: {
              targetType: params.targetType,
              targetOrganizationId: params.targetOrganizationId,
              targetUserId: params.targetUserId,
            },
          });

          if (error) throw error;

          set({
            session: {
              ...data,
              target_type: params.targetType,
              target_name: params.targetName,
            },
            isImpersonating: true,
            isStarting: false,
          });

          // Reload the page to apply impersonation context
          window.location.reload();
        } catch (error) {
          console.error('Failed to start impersonation:', error);
          set({ isStarting: false });
          throw error;
        }
      },

      endImpersonation: async (reason) => {
        const session = get().session;
        if (!session) return;

        try {
          await supabase.functions.invoke('admin-end-impersonation', {
            body: {
              sessionId: session.session_id,
              reason,
            },
          });

          set({
            session: null,
            isImpersonating: false,
          });

          // Reload to clear impersonation context
          window.location.reload();
        } catch (error) {
          console.error('Failed to end impersonation:', error);
          throw error;
        }
      },

      logAction: async (action) => {
        const session = get().session;
        if (!session) return;

        try {
          await supabase.functions.invoke('admin-log-impersonation-action', {
            body: {
              sessionId: session.session_id,
              ...action,
            },
          });
        } catch (error) {
          console.error('Failed to log action:', error);
        }
      },
    }),
    {
      name: 'impersonation-storage',
    }
  )
);
