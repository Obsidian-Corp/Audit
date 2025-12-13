import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Permission definitions for the platform
 *
 * Format: 'action_resource': ['required', 'roles']
 */
const PERMISSIONS: Record<string, string[]> = {
  // User Management
  'create_user': ['firm_administrator', 'partner'],
  'assign_roles': ['firm_administrator', 'partner'],
  'deactivate_user': ['firm_administrator', 'partner'],
  'view_all_users': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Client Management
  'create_client': ['firm_administrator', 'partner', 'practice_leader', 'business_development'],
  'edit_client': ['firm_administrator', 'partner', 'practice_leader', 'business_development'],
  'delete_client': ['firm_administrator', 'partner'],
  'manage_opportunities': ['firm_administrator', 'partner', 'practice_leader', 'business_development'],

  // Engagement Management
  'create_engagement': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager', 'business_development'],
  'delete_engagement': ['firm_administrator', 'partner'],
  'assign_team': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
  'view_all_engagements': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Fieldwork
  'create_workpaper': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager', 'senior_auditor', 'staff_auditor'],
  'review_workpaper': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager', 'senior_auditor'],
  'delete_workpaper': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
  'approve_workpaper': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Findings
  'create_finding': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager', 'senior_auditor', 'staff_auditor'],
  'delete_finding': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Reports
  'generate_report': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
  'approve_report': ['firm_administrator', 'partner'],
  'deliver_report': ['firm_administrator', 'partner'],

  // Time & Billing
  'approve_timesheet': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
  'create_invoice': ['firm_administrator', 'partner'],
  'delete_invoice': ['firm_administrator', 'partner'],
  'view_billing': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Analytics
  'view_firm_analytics': ['firm_administrator', 'partner', 'practice_leader'],
  'view_revenue_analytics': ['firm_administrator', 'partner', 'practice_leader'],
  'view_kpi_dashboard': ['firm_administrator', 'partner', 'practice_leader'],
  'view_profitability': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],

  // Resource Management
  'view_utilization': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
  'manage_capacity': ['firm_administrator', 'partner', 'practice_leader', 'engagement_manager'],
};

export const usePermissions = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRoles();
    } else {
      setRoles([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadUserRoles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user roles:', error);
        setRoles([]);
      } else {
        setRoles(data?.map(r => r.role) || []);
      }
    } catch (error) {
      console.error('Error in loadUserRoles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if the current user can perform an action on a resource
   *
   * @param action - The action to perform (e.g., 'create', 'edit', 'delete', 'approve')
   * @param resource - The resource type (e.g., 'user', 'client', 'engagement')
   * @returns boolean - true if user has permission
   *
   * @example
   * const { can } = usePermissions();
   * if (can('delete', 'engagement')) {
   *   // Show delete button
   * }
   */
  const can = (action: string, resource: string): boolean => {
    const permissionKey = `${action}_${resource}`;
    const requiredRoles = PERMISSIONS[permissionKey];

    if (!requiredRoles) {
      // If permission not defined, default to deny
      console.warn(`Permission not defined: ${permissionKey}`);
      return false;
    }

    // Check if user has at least one of the required roles
    return roles.some(role => requiredRoles.includes(role));
  };

  /**
   * Check if the current user has a specific role
   *
   * @param role - The role to check
   * @returns boolean - true if user has the role
   *
   * @example
   * const { hasRole } = usePermissions();
   * if (hasRole('partner')) {
   *   // Show partner-specific content
   * }
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  /**
   * Check if the current user has ANY of the specified roles
   *
   * @param checkRoles - Array of roles to check
   * @returns boolean - true if user has at least one role
   *
   * @example
   * const { hasAnyRole } = usePermissions();
   * if (hasAnyRole(['partner', 'firm_administrator'])) {
   *   // Show admin content
   * }
   */
  const hasAnyRole = (checkRoles: string[]): boolean => {
    return roles.some(role => checkRoles.includes(role));
  };

  /**
   * Check if the current user has ALL of the specified roles
   *
   * @param checkRoles - Array of roles to check
   * @returns boolean - true if user has all roles
   */
  const hasAllRoles = (checkRoles: string[]): boolean => {
    return checkRoles.every(role => roles.includes(role));
  };

  /**
   * Check if the current user is an admin (firm_administrator or partner)
   *
   * @returns boolean - true if user is admin
   */
  const isAdmin = (): boolean => {
    return hasAnyRole(['firm_administrator', 'partner']);
  };

  /**
   * Check if the current user is a manager (partner, practice_leader, or engagement_manager)
   *
   * @returns boolean - true if user is manager
   */
  const isManager = (): boolean => {
    return hasAnyRole(['firm_administrator', 'partner', 'practice_leader', 'engagement_manager']);
  };

  return {
    roles,
    isLoading,
    can,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isManager,
  };
};
