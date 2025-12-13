import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePlatformAdmin = () => {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPlatformAdmin = async () => {
      try {
        // Check for admin session in localStorage
        const sessionData = localStorage.getItem('obsidian_admin_session');
        if (!sessionData) {
          setIsPlatformAdmin(false);
          setIsLoading(false);
          return;
        }

        const session = JSON.parse(sessionData);

        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
          setIsPlatformAdmin(false);
          setIsLoading(false);
          localStorage.removeItem('obsidian_admin_session');
          return;
        }

        // Verify token with edge function
        const { data, error } = await supabase.functions.invoke('admin-auth-verify', {
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        });

        if (error || !data || !data.valid) {
          setIsPlatformAdmin(false);
          localStorage.removeItem('obsidian_admin_session');
        } else {
          setIsPlatformAdmin(true);
        }
      } catch (error) {
        console.error('Error checking platform admin:', error);
        setIsPlatformAdmin(false);
        localStorage.removeItem('obsidian_admin_session');
      } finally {
        setIsLoading(false);
      }
    };

    checkPlatformAdmin();
  }, []);

  return { isPlatformAdmin, isLoading };
};
