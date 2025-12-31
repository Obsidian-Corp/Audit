/**
 * Navigation Type Definitions
 *
 * Defines the structure for the collapsible navigation system
 * with role-based visibility and badge support.
 */

import { LucideIcon } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

/** Application roles from database enum */
export type AppRole = Database['public']['Enums']['app_role'];

/**
 * Individual navigation item within a section
 */
export interface NavigationItem {
  /** Unique identifier for the item */
  id: string;
  /** Display title */
  title: string;
  /** Route path */
  url: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Roles that can see this item (undefined = all authenticated) */
  roles?: AppRole[];
  /** Badge type: 'count' shows number, 'dot' shows indicator */
  badge?: 'count' | 'dot';
  /** Nested children (for future use) */
  children?: NavigationItem[];
}

/**
 * Navigation section containing multiple items
 */
export interface NavigationSection {
  /** Unique identifier for the section */
  id: string;
  /** Section header label */
  label: string;
  /** Whether section can be collapsed */
  collapsible: boolean;
  /** Default expanded state: true, false, or 'role-based' for smart defaults */
  defaultExpanded?: boolean | 'role-based';
  /** Roles that can see this section (undefined = all authenticated) */
  roles?: AppRole[];
  /** Navigation items in this section */
  items: NavigationItem[];
}

/**
 * Role hierarchy for permission checks
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  'client_user': 0,
  'client_administrator': 1,
  'staff_auditor': 10,
  'senior_auditor': 20,
  'business_development': 25,
  'engagement_manager': 30,
  'partner': 40,
  'practice_leader': 40,
  'firm_administrator': 50,
};

/**
 * Check if user has at least the required role level
 */
export function hasMinimumRole(userRoles: AppRole[], minimumRole: AppRole): boolean {
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userRoles.some(role => ROLE_HIERARCHY[role] >= requiredLevel);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRoles: AppRole[], allowedRoles: AppRole[]): boolean {
  return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * Internal audit roles (excludes client roles)
 */
export const INTERNAL_ROLES: AppRole[] = [
  'staff_auditor',
  'senior_auditor',
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
  'business_development',
];

/**
 * Senior+ roles for review capabilities
 */
export const SENIOR_PLUS_ROLES: AppRole[] = [
  'senior_auditor',
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
];

/**
 * Manager+ roles for approvals and planning
 */
export const MANAGER_PLUS_ROLES: AppRole[] = [
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
];

/**
 * Admin roles for administration section
 */
export const ADMIN_ROLES: AppRole[] = [
  'firm_administrator',
];
