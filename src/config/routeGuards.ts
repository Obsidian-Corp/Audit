/**
 * Route Guards Configuration
 * Ticket: NAV-004
 *
 * Defines role-based access control for all application routes.
 * Used by RequireRole guard to enforce consistent access policies.
 *
 * @see docs/NAVIGATION_RESTRUCTURE_DESIGN.md
 */

import {
  INTERNAL_ROLES,
  SENIOR_PLUS_ROLES,
  MANAGER_PLUS_ROLES,
  ADMIN_ROLES,
} from './navigation';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

/**
 * Route guard configuration
 */
export interface RouteGuard {
  /** Route pattern (supports wildcards like /engagements/*) */
  path: string;
  /** Roles allowed to access this route */
  allowedRoles: AppRole[];
  /** Redirect path if access denied */
  fallbackPath?: string;
  /** Show unauthorized page instead of redirecting */
  showUnauthorized?: boolean;
}

/**
 * Route guards configuration
 * More specific routes should come before wildcard routes
 */
export const routeGuards: RouteGuard[] = [
  // ========== Admin Routes (most restrictive) ==========
  {
    path: '/admin/users',
    allowedRoles: [...ADMIN_ROLES, 'partner'],
    fallbackPath: '/workspace',
  },
  {
    path: '/admin',
    allowedRoles: [...ADMIN_ROLES, 'partner'],
    fallbackPath: '/workspace',
  },

  // ========== Manager+ Routes ==========
  {
    path: '/universe',
    allowedRoles: MANAGER_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/risks',
    allowedRoles: MANAGER_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/plans',
    allowedRoles: MANAGER_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/engagements/templates',
    allowedRoles: MANAGER_PLUS_ROLES,
    fallbackPath: '/engagements',
  },
  {
    path: '/engagements/approvals',
    allowedRoles: MANAGER_PLUS_ROLES,
    fallbackPath: '/engagements',
  },

  // ========== Senior+ Routes ==========
  {
    path: '/review-queue',
    allowedRoles: SENIOR_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/quality-control',
    allowedRoles: SENIOR_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/analytics',
    allowedRoles: SENIOR_PLUS_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/tools/materiality',
    allowedRoles: SENIOR_PLUS_ROLES,
    fallbackPath: '/workspace',
  },

  // ========== Internal Audit Routes ==========
  {
    path: '/my-procedures',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/tasks',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/time-tracking',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/workpapers',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/findings',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/evidence',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/information-requests',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/programs',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/procedures',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/tools/sampling',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/tools/analytical-procedures',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/tools/confirmations',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },
  {
    path: '/audits',
    allowedRoles: INTERNAL_ROLES,
    fallbackPath: '/workspace',
  },

  // ========== Open Routes (no role restriction) ==========
  // These routes are accessible to all authenticated users
  // and are NOT listed here (fallthrough to RequireAuth only)
];

/**
 * Find the guard configuration for a given path
 * @param path Current route path
 * @returns RouteGuard if found, undefined otherwise
 */
export function findRouteGuard(path: string): RouteGuard | undefined {
  // Normalize path (remove trailing slash, query params)
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';

  // First try exact match
  const exactMatch = routeGuards.find(guard => guard.path === normalizedPath);
  if (exactMatch) return exactMatch;

  // Then try prefix match (for nested routes)
  // Sort by path length descending to match most specific first
  const sortedGuards = [...routeGuards].sort(
    (a, b) => b.path.length - a.path.length
  );

  for (const guard of sortedGuards) {
    // Handle wildcard patterns
    if (guard.path.endsWith('/*')) {
      const basePath = guard.path.slice(0, -2);
      if (normalizedPath.startsWith(basePath + '/') || normalizedPath === basePath) {
        return guard;
      }
    }
    // Handle prefix match for nested routes
    if (normalizedPath.startsWith(guard.path + '/')) {
      return guard;
    }
  }

  return undefined;
}

/**
 * Check if a user has access to a given path
 * @param path Route path
 * @param userRoles User's assigned roles
 * @returns true if user has access, false otherwise
 */
export function hasRouteAccess(path: string, userRoles: AppRole[]): boolean {
  const guard = findRouteGuard(path);

  // No guard = open route
  if (!guard) return true;

  // Check if user has at least one allowed role
  return guard.allowedRoles.some(role => userRoles.includes(role));
}

/**
 * Get roles required for a given path
 * @param path Route path
 * @returns Array of required roles, empty if open route
 */
export function getRequiredRoles(path: string): AppRole[] {
  const guard = findRouteGuard(path);
  return guard?.allowedRoles || [];
}

export default {
  routeGuards,
  findRouteGuard,
  hasRouteAccess,
  getRequiredRoles,
};
