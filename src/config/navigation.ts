/**
 * Navigation Configuration
 * Ticket: NAV-001
 *
 * Centralized navigation structure for both global and engagement-scoped navigation.
 * Supports role-based filtering, badge counts, collapsible sections, and nested menu items.
 *
 * @see docs/NAVIGATION_RESTRUCTURE_DESIGN.md for architecture details
 */

import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  Inbox,
  Briefcase,
  Building2,
  Library,
  Layers,
  ListChecks,
  Wrench,
  Calculator,
  BarChart,
  BarChart3,
  Settings,
  Users,
  UserCog,
  Calendar,
  AlertTriangle,
  FileText,
  PlayCircle,
  FileSearch,
  Paperclip,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Eye,
  DollarSign,
  MessageSquare,
  Home,
  ClipboardList,
  Scale,
  Target,
  Shield,
  ShieldCheck,
  TrendingUp,
  FolderKanban,
  Clock,
  Globe,
  Database,
  Send,
  BookOpen,
} from 'lucide-react';
import { Database as SupabaseDatabase } from '@/integrations/supabase/types';

type AppRole = SupabaseDatabase['public']['Enums']['app_role'];

// ============================================================================
// ROLE CONSTANTS
// ============================================================================

/** Internal audit roles (excludes client roles) */
export const INTERNAL_ROLES: AppRole[] = [
  'staff_auditor',
  'senior_auditor',
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
  'business_development',
];

/** Senior+ roles for review capabilities */
export const SENIOR_PLUS_ROLES: AppRole[] = [
  'senior_auditor',
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
];

/** Manager+ roles for approvals and planning */
export const MANAGER_PLUS_ROLES: AppRole[] = [
  'engagement_manager',
  'partner',
  'practice_leader',
  'firm_administrator',
];

/** Admin roles for administration section */
export const ADMIN_ROLES: AppRole[] = [
  'firm_administrator',
];

// ============================================================================
// NEW COLLAPSIBLE SECTION TYPES
// ============================================================================

/**
 * Navigation section item for collapsible navigation
 */
export interface NavSectionItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: AppRole[];
  badge?: 'count' | 'dot';
}

/**
 * Navigation section with collapsible support
 */
export interface NavigationSection {
  id: string;
  label: string;
  collapsible: boolean;
  defaultExpanded?: boolean | 'role-based';
  roles?: AppRole[];
  items: NavSectionItem[];
}

// ============================================================================
// COLLAPSIBLE SIDEBAR NAVIGATION
// ============================================================================

/**
 * New collapsible section-based navigation
 * Used by the refactored AppSidebar component
 */
export const sidebarNavigation: NavigationSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    collapsible: false,
    items: [
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    ],
  },
  {
    id: 'my-work',
    label: 'My Work',
    collapsible: true,
    defaultExpanded: 'role-based',
    roles: INTERNAL_ROLES,
    items: [
      { id: 'my-procedures', title: 'My Procedures', url: '/my-procedures', icon: ListChecks, badge: 'count' },
      { id: 'tasks', title: 'Tasks', url: '/tasks', icon: LayoutList, badge: 'count' },
      { id: 'time-tracking', title: 'Time Tracking', url: '/time-tracking', icon: Clock },
      { id: 'review-queue', title: 'Review Queue', url: '/review-queue', icon: Eye, roles: SENIOR_PLUS_ROLES, badge: 'count' },
    ],
  },
  {
    id: 'engagements',
    label: 'Engagements',
    collapsible: true,
    defaultExpanded: true,
    items: [
      { id: 'active-engagements', title: 'Active Engagements', url: '/engagements', icon: Briefcase },
      { id: 'clients', title: 'Clients', url: '/clients', icon: Building2 },
      { id: 'templates', title: 'Templates', url: '/engagements/templates', icon: FolderKanban, roles: MANAGER_PLUS_ROLES },
      { id: 'approvals', title: 'Approvals', url: '/engagements/approvals', icon: CheckCircle2, roles: MANAGER_PLUS_ROLES, badge: 'count' },
    ],
  },
  {
    id: 'audit-execution',
    label: 'Audit Execution',
    collapsible: true,
    defaultExpanded: false,
    roles: INTERNAL_ROLES,
    items: [
      { id: 'workpapers', title: 'Workpapers', url: '/workpapers', icon: FileSearch },
      { id: 'findings', title: 'Findings', url: '/findings', icon: AlertTriangle, badge: 'count' },
      { id: 'evidence', title: 'Evidence', url: '/evidence', icon: Database },
      { id: 'information-requests', title: 'Info Requests', url: '/information-requests', icon: Send, badge: 'count' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Libraries',
    collapsible: true,
    defaultExpanded: false,
    roles: INTERNAL_ROLES,
    items: [
      { id: 'programs', title: 'Program Library', url: '/programs', icon: Layers },
      { id: 'procedures', title: 'Procedure Library', url: '/procedures', icon: BookOpen },
      { id: 'materiality', title: 'Materiality', url: '/tools/materiality', icon: Calculator, roles: SENIOR_PLUS_ROLES },
      { id: 'sampling', title: 'Sampling', url: '/tools/sampling', icon: Scale },
      { id: 'analytical', title: 'Analytical Procedures', url: '/tools/analytical-procedures', icon: TrendingUp },
      { id: 'confirmations', title: 'Confirmations', url: '/tools/confirmations', icon: MessageSquare, badge: 'count' },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & Risk',
    collapsible: true,
    defaultExpanded: false,
    roles: MANAGER_PLUS_ROLES,
    items: [
      { id: 'universe', title: 'Audit Universe', url: '/universe', icon: Globe },
      { id: 'risks', title: 'Risk Assessments', url: '/risks', icon: Target },
      { id: 'plans', title: 'Audit Plans', url: '/plans', icon: FileText },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Analytics',
    collapsible: true,
    defaultExpanded: false,
    roles: SENIOR_PLUS_ROLES,
    items: [
      { id: 'qc-dashboard', title: 'QC Dashboard', url: '/quality-control', icon: ShieldCheck, badge: 'dot' },
      { id: 'analytics', title: 'Analytics', url: '/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    collapsible: true,
    defaultExpanded: false,
    roles: ADMIN_ROLES,
    items: [
      { id: 'user-management', title: 'User Management', url: '/admin/users', icon: UserCog },
      { id: 'team', title: 'Team Directory', url: '/admin/users', icon: Users }, // Points to User Management
      { id: 'admin-settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];

/**
 * Get all item IDs that have badges (for badge count fetching)
 */
export function getBadgeItemIds(): string[] {
  const ids: string[] = [];
  for (const section of sidebarNavigation) {
    for (const item of section.items) {
      if (item.badge) {
        ids.push(item.id);
      }
    }
  }
  return ids;
}

// ============================================================================
// LEGACY NAVIGATION ITEM INTERFACE (for backward compatibility)
// ============================================================================

/**
 * Navigation item interface
 */
export interface NavigationItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Route path (relative for engagement-scoped, absolute for global) */
  path: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Roles allowed to see this item (empty = all) */
  requiredRoles?: AppRole[];
  /** Badge type: 'count' for numbers, 'status' for status indicators */
  badge?: 'count' | 'status';
  /** Nested menu items */
  children?: NavigationItem[];
  /** Description for tooltips */
  description?: string;
  /** Whether this is a divider (for visual separation) */
  isDivider?: boolean;
}

/**
 * Engagement-scoped navigation
 * These items appear in the engagement sidebar when viewing /engagements/:id/*
 */
export const ENGAGEMENT_NAVIGATION: NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '',
    icon: LayoutDashboard,
    description: 'Engagement dashboard with key metrics',
  },
  {
    id: 'planning',
    label: 'Planning',
    path: '',
    icon: ClipboardList,
    children: [
      {
        id: 'team',
        label: 'Team',
        path: 'team',
        icon: Users,
        description: 'Manage engagement team members',
      },
      {
        id: 'timeline',
        label: 'Timeline',
        path: 'timeline',
        icon: Calendar,
        description: 'Project timeline and milestones',
      },
      {
        id: 'risk',
        label: 'Risk Assessment',
        path: 'risk',
        icon: AlertTriangle,
        description: 'Identify and assess audit risks',
      },
      {
        id: 'materiality',
        label: 'Materiality',
        path: 'materiality',
        icon: Calculator,
        description: 'Calculate materiality thresholds',
      },
      {
        id: 'plan',
        label: 'Audit Plan',
        path: 'plan',
        icon: FileText,
        description: 'Develop the audit plan',
      },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    path: '',
    icon: PlayCircle,
    children: [
      {
        id: 'programs',
        label: 'Programs',
        path: 'programs',
        icon: Layers,
        description: 'Assigned audit programs',
      },
      {
        id: 'procedures',
        label: 'Procedures',
        path: 'procedures',
        icon: ListChecks,
        badge: 'count',
        description: 'Execute audit procedures',
      },
      {
        id: 'workpapers',
        label: 'Workpapers',
        path: 'workpapers',
        icon: FileSearch,
        description: 'Working paper documentation',
      },
      {
        id: 'evidence',
        label: 'Evidence',
        path: 'evidence',
        icon: Paperclip,
        description: 'Supporting evidence library',
      },
    ],
  },
  {
    id: 'results',
    label: 'Results',
    path: '',
    icon: CheckCircle,
    children: [
      {
        id: 'findings',
        label: 'Findings',
        path: 'findings',
        icon: AlertCircle,
        badge: 'count',
        description: 'Document audit findings',
      },
      {
        id: 'review',
        label: 'Review Status',
        path: 'review',
        icon: Eye,
        description: 'Track review and approval status',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '',
    icon: Settings,
    children: [
      {
        id: 'budget',
        label: 'Time & Budget',
        path: 'budget',
        icon: DollarSign,
        description: 'Track time and budget',
      },
      {
        id: 'requests',
        label: 'Info Requests',
        path: 'requests',
        icon: MessageSquare,
        description: 'Client information requests',
      },
      {
        id: 'settings',
        label: 'Settings',
        path: 'settings',
        icon: Settings,
        description: 'Engagement settings',
        requiredRoles: ['engagement_manager', 'partner', 'firm_administrator'],
      },
    ],
  },
];

/**
 * Global navigation
 * These items appear in the main sidebar when not in an engagement context
 */
export const GLOBAL_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: Home,
    description: 'Personal workspace',
  },
  {
    id: 'inbox',
    label: 'Inbox',
    path: '/inbox',
    icon: Inbox,
    badge: 'count',
    description: 'Notifications and action items',
  },
  {
    id: 'engagements',
    label: 'Engagements',
    path: '/engagements',
    icon: Briefcase,
    description: 'Active engagements',
  },
  {
    id: 'clients',
    label: 'Clients',
    path: '/clients',
    icon: Building2,
    description: 'Manage clients',
  },
  {
    id: 'my-work',
    label: 'My Work',
    path: '',
    icon: ListChecks,
    children: [
      {
        id: 'my-procedures',
        label: 'My Procedures',
        path: '/my-procedures',
        icon: ListChecks,
        badge: 'count',
        description: 'Assigned procedures',
      },
      {
        id: 'review-queue',
        label: 'Review Queue',
        path: '/review-queue',
        icon: Eye,
        badge: 'count',
        description: 'Items pending your review',
        requiredRoles: ['senior_auditor', 'engagement_manager', 'partner', 'quality_control_reviewer'],
      },
      {
        id: 'tasks',
        label: 'Task Board',
        path: '/tasks',
        icon: ClipboardList,
        description: 'Task management',
      },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    path: '',
    icon: Library,
    children: [
      {
        id: 'programs-library',
        label: 'Programs',
        path: '/programs',
        icon: Layers,
        description: 'Audit program templates',
      },
      {
        id: 'procedures-library',
        label: 'Procedures',
        path: '/procedures',
        icon: ListChecks,
        description: 'Procedure templates',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    path: '',
    icon: Wrench,
    children: [
      {
        id: 'materiality-tool',
        label: 'Materiality',
        path: '/tools/materiality',
        icon: Calculator,
        description: 'Materiality calculator',
      },
      {
        id: 'sampling-tool',
        label: 'Sampling',
        path: '/tools/sampling',
        icon: Scale,
        description: 'Sampling calculator',
      },
      {
        id: 'analytics-tool',
        label: 'Analytics',
        path: '/tools/analytical-procedures',
        icon: TrendingUp,
        description: 'Analytical procedures',
      },
    ],
  },
  {
    id: 'quality',
    label: 'Quality',
    path: '',
    icon: Shield,
    requiredRoles: ['senior_auditor', 'engagement_manager', 'partner', 'quality_control_reviewer', 'firm_administrator'],
    children: [
      {
        id: 'qc-dashboard',
        label: 'QC Dashboard',
        path: '/quality-control',
        icon: Shield,
        description: 'Quality control overview',
      },
      {
        id: 'risk-register',
        label: 'Risk Register',
        path: '/risks',
        icon: Target,
        description: 'Firm-wide risk register',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart,
    requiredRoles: ['engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
    description: 'Reports and analytics',
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '',
    icon: Settings,
    requiredRoles: ['firm_administrator', 'partner'],
    children: [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        path: '/admin',
        icon: Settings,
        description: 'Administration overview',
      },
      {
        id: 'user-management',
        label: 'User Management',
        path: '/admin/users',
        icon: Users,
        description: 'Manage users and roles',
      },
      {
        id: 'templates',
        label: 'Templates',
        path: '/engagements/templates',
        icon: FolderKanban,
        description: 'Engagement templates',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'User settings',
  },
];

/**
 * Filter navigation items by user roles
 * @param items Navigation items to filter
 * @param userRoles User's assigned roles
 * @returns Filtered navigation items
 */
export function filterNavigationByRole(
  items: NavigationItem[],
  userRoles: AppRole[]
): NavigationItem[] {
  return items
    .filter((item) => {
      // If no required roles, item is visible to all
      if (!item.requiredRoles || item.requiredRoles.length === 0) {
        return true;
      }
      // Check if user has at least one of the required roles
      return item.requiredRoles.some((role) => userRoles.includes(role));
    })
    .map((item) => {
      // Recursively filter children
      if (item.children) {
        return {
          ...item,
          children: filterNavigationByRole(item.children, userRoles),
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove items with empty children after filtering
      if (item.children && item.children.length === 0) {
        return false;
      }
      return true;
    });
}

/**
 * Get flat list of all navigation paths (for validation)
 * @param items Navigation items
 * @param basePath Base path prefix
 * @returns Array of all paths
 */
export function getAllNavigationPaths(
  items: NavigationItem[],
  basePath = ''
): string[] {
  const paths: string[] = [];

  for (const item of items) {
    const fullPath = item.path.startsWith('/')
      ? item.path
      : `${basePath}/${item.path}`.replace('//', '/');

    if (item.path) {
      paths.push(fullPath);
    }

    if (item.children) {
      paths.push(...getAllNavigationPaths(item.children, fullPath));
    }
  }

  return paths;
}

/**
 * Find navigation item by ID
 * @param items Navigation items to search
 * @param id Item ID to find
 * @returns Navigation item or undefined
 */
export function findNavigationItemById(
  items: NavigationItem[],
  id: string
): NavigationItem | undefined {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }
    if (item.children) {
      const found = findNavigationItemById(item.children, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Build breadcrumb trail for a given path
 * @param items Navigation items
 * @param currentPath Current route path
 * @param basePath Base path prefix
 * @returns Array of breadcrumb items
 */
export function buildBreadcrumbs(
  items: NavigationItem[],
  currentPath: string,
  basePath = ''
): Array<{ label: string; path: string }> {
  const breadcrumbs: Array<{ label: string; path: string }> = [];

  function findPath(
    navItems: NavigationItem[],
    targetPath: string,
    parentPath: string
  ): boolean {
    for (const item of navItems) {
      const fullPath = item.path.startsWith('/')
        ? item.path
        : `${parentPath}/${item.path}`.replace('//', '/');

      if (fullPath === targetPath || targetPath.startsWith(fullPath + '/')) {
        breadcrumbs.push({ label: item.label, path: fullPath });

        if (item.children) {
          findPath(item.children, targetPath, fullPath);
        }

        return true;
      }
    }
    return false;
  }

  findPath(items, currentPath, basePath);
  return breadcrumbs;
}

export default {
  ENGAGEMENT_NAVIGATION,
  GLOBAL_NAVIGATION,
  filterNavigationByRole,
  getAllNavigationPaths,
  findNavigationItemById,
  buildBreadcrumbs,
};
