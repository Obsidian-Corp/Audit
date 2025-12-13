/**
 * Tenant Context - Multi-Tenant Firm Detection
 * Automatically detects firm from subdomain or custom domain
 * Provides firm information throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  detectTenantFromHostname,
  applyFirmBranding,
  isPlatformAdminContext,
  isClientPortalContext,
  TenantInfo
} from '@/lib/tenant';

interface TenantContextValue extends TenantInfo {
  isLoading: boolean;
  error: string | null;
  refetchTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    firmId: null,
    firmSlug: null,
    firmName: null,
    logoUrl: null,
    primaryColor: null,
    portalType: null,
    isCustomDomain: false,
    hostname: window.location.hostname,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantInfo = async () => {
    // CRITICAL: Skip all tenant detection for platform admin routes
    if (isPlatformAdminContext()) {
      setTenantInfo({
        firmId: null,
        firmSlug: null,
        firmName: null,
        logoUrl: null,
        primaryColor: null,
        portalType: 'admin',
        isCustomDomain: false,
        hostname: window.location.hostname,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const detection = detectTenantFromHostname();

      // For localhost development, skip tenant lookup
      if (detection.isLocalhost) {
        setTenantInfo({
          firmId: null,
          firmSlug: null,
          firmName: 'Development Mode',
          logoUrl: null,
          primaryColor: '#0066CC',
          portalType: isClientPortalContext() ? 'client' : 'app',
          isCustomDomain: false,
          hostname: detection.hostname,
        });
        setIsLoading(false);
        return;
      }

      // Fetch firm information from database using hostname
      const { data, error: dbError } = await supabase
        .rpc('get_firm_by_domain', { hostname: detection.hostname });

      if (dbError) {
        console.error('Failed to fetch tenant info:', dbError);
        setError('Failed to load organization information');
        setIsLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError('Organization not found for this domain');
        setIsLoading(false);
        return;
      }

      const firm = data[0];

      const newTenantInfo: TenantInfo = {
        firmId: firm.id,
        firmSlug: firm.slug,
        firmName: firm.name,
        logoUrl: firm.logo_url,
        primaryColor: firm.primary_color || '#0066CC',
        portalType: detection.portalType || 'app',
        isCustomDomain: detection.isCustomDomain,
        hostname: detection.hostname,
      };

      setTenantInfo(newTenantInfo);

      // Apply branding
      applyFirmBranding(newTenantInfo);

      setIsLoading(false);
    } catch (err) {
      console.error('Tenant detection error:', err);
      setError('Failed to detect organization');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const value: TenantContextValue = {
    ...tenantInfo,
    isLoading,
    error,
    refetchTenant: fetchTenantInfo,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Hook to check if user is in correct firm context
 * Useful for verifying access control
 */
export function useRequireTenant(requiredFirmId?: string) {
  const { firmId, isLoading, error } = useTenant();

  const isValid = !isLoading && !error && (
    !requiredFirmId || firmId === requiredFirmId
  );

  return {
    firmId,
    isValid,
    isLoading,
    error,
  };
}
