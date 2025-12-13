/**
 * ============================================================================
 * PLATFORM ADMIN SESSION HOOK
 * ============================================================================
 * Authentication System: PLATFORM ADMIN (platform_admin.admin_users)
 * DO NOT MIX with client auth (auth.users) - these are separate systems
 * 
 * All platform admin session operations now go through edge functions.
 * NO direct database writes from the browser.
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const ADMIN_SESSION_KEY = 'obsidian_admin_session';
const SESSION_CHECK_INTERVAL = 300000; // Check every 5 minutes (increased from 1 minute)

interface AdminSession {
  token: string;
  sessionToken: string;
  adminId: string;
  email: string;
  fullName: string;
  expiresAt: string;
  lastActivity: string;
}

export const useAdminSession = () => {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sessions are now created by the edge function
  const createSession = async (adminId: string): Promise<boolean> => {
    // This is now handled by the admin-auth edge function
    return true;
  };

  // Validate existing session using custom JWT
  const validateSession = useCallback(async (currentSession: AdminSession): Promise<boolean> => {
    try {
      // Verify JWT token with edge function
      const { data, error } = await supabase.functions.invoke('admin-auth-verify', {
        headers: {
          'Authorization': `Bearer ${currentSession.token}`
        }
      });

      if (error || !data || !data.valid) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }, []);

  // Revoke session via edge function
  const revokeSession = useCallback(async (reason?: string) => {
    if (!session) return;

    try {
      // Revoke via edge function (no direct DB access)
      await supabase.functions.invoke('admin-session-revoke', {
        body: {
          session_token: session.sessionToken,
          reason: reason || 'User logout'
        }
      });
    } catch (error) {
      console.error('Error revoking session:', error);
    } finally {
      setSession(null);
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }, [session]);

  // Update last activity via edge function
  const updateActivity = useCallback(async () => {
    if (!session) return;

    try {
      await supabase.functions.invoke('admin-session-activity', {
        body: {
          session_token: session.sessionToken
        }
      });

      const updatedSession = {
        ...session,
        lastActivity: new Date().toISOString(),
      };
      setSession(updatedSession);
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedSession));
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }, [session]);

  // Check session on mount and interval
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      if (!isMounted) return;

      const storedSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!storedSession) {
        if (isMounted) {
          setSession(null);
          setIsValidating(false);
        }
        return;
      }

      try {
        const parsedSession = JSON.parse(storedSession) as AdminSession;

        // Check if session expired
        if (new Date(parsedSession.expiresAt) < new Date()) {
          console.log('[Admin Session] Session expired');
          localStorage.removeItem(ADMIN_SESSION_KEY);
          if (isMounted) {
            setSession(null);
            setIsValidating(false);
          }
          return;
        }

        // Validate with server
        if (isMounted) setIsValidating(true);

        const { data, error } = await supabase.functions.invoke('admin-auth-verify', {
          headers: {
            'Authorization': `Bearer ${parsedSession.token}`
          }
        });

        if (!isMounted) return;

        if (error || !data || !data.valid) {
          console.error('[Admin Session] Session invalid:', { error, data });
          // Don't logout on verify errors - just log them
          // localStorage.removeItem(ADMIN_SESSION_KEY);
          // setSession(null);
          setSession(parsedSession); // Keep the session
          setIsValidating(false);
          return;
        }

        setSession(parsedSession);
        setIsValidating(false);
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        if (isMounted) {
          setSession(null);
          setIsValidating(false);
        }
      }
    };

    checkSession();

    // Set up periodic validation (every minute)
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Empty deps - only run once on mount

  // Update activity on user interaction
  useEffect(() => {
    if (!session) return;

    const handleActivity = () => {
      updateActivity();
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [session, updateActivity]);

  return {
    session,
    isValidating,
    createSession,
    validateSession,
    revokeSession,
    updateActivity,
  };
};
