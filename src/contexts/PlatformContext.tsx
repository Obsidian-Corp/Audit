import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Safe hook to use organization context only when available (not on platform admin routes)
const useSafeOrganization = () => {
  try {
    // Only import and use if we're not on platform admin route
    if (window.location.pathname.startsWith('/platform-admin')) {
      return { currentOrg: null };
    }
    
    // Dynamic import to avoid circular dependency issues
    const { useOrganization } = require('./OrganizationContext');
    return useOrganization();
  } catch {
    return { currentOrg: null };
  }
};

interface App {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  route_prefix: string;
  category: string;
  is_active: boolean;
  requires_setup: boolean;
  sort_order: number;
}

interface PlatformContextType {
  apps: App[];
  isLoading: boolean;
  trackAppAccess: (appId: string) => Promise<void>;
  toggleFavorite: (appId: string) => Promise<void>;
  favorites: Set<string>;
  recentApps: App[];
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<App[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [recentApps, setRecentApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // CRITICAL: Do not fetch anything if on platform admin routes
    if (window.location.pathname.startsWith('/platform-admin')) {
      setIsLoading(false);
      return;
    }
    
    // No apps/preferences loading for now - all pages render without them
    setIsLoading(false);
  }, []);

  const fetchApps = async () => {
    // No-op - auth/org disabled
    setIsLoading(false);
  };

  const fetchUserPreferences = async () => {
    // No-op - auth/org disabled
  };

  const trackAppAccess = async (appId: string) => {
    // No-op - auth disabled
  };

  const toggleFavorite = async (appId: string) => {
    // No-op - auth disabled
  };

  return (
    <PlatformContext.Provider value={{
      apps,
      isLoading,
      trackAppAccess,
      toggleFavorite,
      favorites,
      recentApps
    }}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}
