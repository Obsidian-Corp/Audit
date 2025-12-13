/**
 * Multi-Tenant Subdomain & Custom Domain Detection
 * Supports all 4 phases of enterprise architecture
 */

export interface TenantInfo {
  firmId: string | null;
  firmSlug: string | null;
  firmName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  portalType: 'app' | 'client' | 'admin' | null;
  isCustomDomain: boolean;
  hostname: string;
}

/**
 * Detects tenant (firm) from current hostname
 * Supports:
 * - Phase 1: localhost development (no subdomain)
 * - Phase 2: Path-based routing (obsidian-corp.com/deloitte)
 * - Phase 3: Subdomain routing (app.deloitte.obsidian-corp.com)
 * - Phase 4: Custom domains (audit.deloitte.com)
 */
export function detectTenantFromHostname(): {
  hostname: string;
  portalType: 'app' | 'client' | 'admin' | null;
  firmSlug: string | null;
  isCustomDomain: boolean;
  isLocalhost: boolean;
} {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  // localhost or 127.0.0.1 (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return {
      hostname,
      portalType: null,
      firmSlug: null,
      isCustomDomain: false,
      isLocalhost: true,
    };
  }

  // Platform admin (admin.obsidian-corp.com)
  if (parts[0] === 'admin' && parts.length >= 2) {
    return {
      hostname,
      portalType: 'admin',
      firmSlug: null,
      isCustomDomain: false,
      isLocalhost: false,
    };
  }

  // Subdomain routing (Phase 3)
  // Format: app.firmslug.obsidian-corp.com or clients.firmslug.obsidian-corp.com
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const firmSlug = parts[1];
    const baseDomain = parts.slice(2).join('.');

    // Check if it's our base domain
    if (baseDomain === 'obsidian-corp.com' || baseDomain.endsWith('.obsidian-corp.com')) {
      if (subdomain === 'app') {
        return {
          hostname,
          portalType: 'app',
          firmSlug,
          isCustomDomain: false,
          isLocalhost: false,
        };
      }

      if (subdomain === 'clients') {
        return {
          hostname,
          portalType: 'client',
          firmSlug,
          isCustomDomain: false,
          isLocalhost: false,
        };
      }
    }
  }

  // Custom domain (Phase 4)
  // Any other domain is assumed to be a custom domain
  // We'll lookup in database to determine if it's app or client portal
  return {
    hostname,
    portalType: null, // Will be determined by database lookup
    firmSlug: null,   // Will be determined by database lookup
    isCustomDomain: true,
    isLocalhost: false,
  };
}

/**
 * Get firm slug from URL path (fallback for Phase 1/2)
 * Used when subdomain routing is not available
 */
export function getFirmSlugFromPath(): string | null {
  const path = window.location.pathname;

  // Check for path-based firm routing: /firm/deloitte/...
  const firmMatch = path.match(/^\/firm\/([^\/]+)/);
  if (firmMatch) {
    return firmMatch[1];
  }

  return null;
}

/**
 * Builds the correct portal URL for a firm
 * Adapts based on current environment
 */
export function buildPortalUrl(
  firmSlug: string,
  portalType: 'app' | 'client',
  path: string = '/'
): string {
  const { isLocalhost } = detectTenantFromHostname();

  if (isLocalhost) {
    // Development: use paths
    const portalBase = portalType === 'client' ? '/client-portal' : '';
    return `${portalBase}${path}`;
  }

  // Production: use subdomains
  const subdomain = portalType === 'client' ? 'clients' : 'app';
  return `https://${subdomain}.${firmSlug}.obsidian-corp.com${path}`;
}

/**
 * Check if current context is platform admin
 */
export function isPlatformAdminContext(): boolean {
  const path = window.location.pathname;
  const { portalType } = detectTenantFromHostname();

  return portalType === 'admin' || path.startsWith('/platform-admin');
}

/**
 * Check if current context is client portal
 */
export function isClientPortalContext(): boolean {
  const path = window.location.pathname;
  const { portalType } = detectTenantFromHostname();

  return portalType === 'client' || path.startsWith('/client-portal');
}

/**
 * Apply firm branding to document
 */
export function applyFirmBranding(tenantInfo: TenantInfo) {
  if (!tenantInfo.firmId) return;

  // Update page title
  if (tenantInfo.firmName) {
    document.title = `${tenantInfo.firmName} Audit Platform`;
  }

  // Update primary color CSS variable
  if (tenantInfo.primaryColor) {
    document.documentElement.style.setProperty('--primary', tenantInfo.primaryColor);
  }

  // Update favicon if logo available
  if (tenantInfo.logoUrl) {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = tenantInfo.logoUrl;
    }
  }
}
