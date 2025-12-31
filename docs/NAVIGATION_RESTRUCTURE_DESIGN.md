# Navigation Restructure Design Document

## Obsidian Audit Platform - UX Architecture v2.0

**Document Version:** 1.0
**Date:** December 28, 2024
**Author:** Architecture Team

---

## Executive Summary

This document outlines the restructured navigation architecture for the Obsidian Audit Platform. The goal is to reduce cognitive load from 30+ visible items to 6-8 top-level sections using progressive disclosure patterns, while maintaining full functionality and role-based access control.

---

## Section 1: Current State Analysis

### 1.1 Current Navigation Structure (10 Sections, 32 Items)

```
Dashboard (2 items)
├── My Workspace
└── Dashboard

My Work (5 items)
├── My Procedures
├── Task Board
├── Time Tracking
├── Review Queue
└── Approvals

Engagements (2 items)
├── Active Engagements
└── Templates

Audit Execution (5 items)
├── Active Audits
├── Workpapers
├── Findings
├── Evidence Library
└── Information Requests

Audit Tools (9 items)
├── Audit Universe
├── Risk Assessments
├── Audit Plans
├── Program Library
├── Procedure Library
├── Materiality Calculator
├── Sampling Calculator
├── Analytical Procedures
└── Confirmation Tracker

Quality & Review (2 items)
├── QC Dashboard
└── Procedure Review

Analytics (2 items)
├── Audit Analytics
└── Program Analytics

Clients (1 item)
└── Client List

Resources (2 items)
├── Team Directory
└── Scheduler

Administration (3 items)
├── Admin Dashboard
├── User Management
└── Settings
```

### 1.2 Identified Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| 32 visible items cause cognitive overload | High - users can't find features | Critical |
| Flat structure lacks hierarchy | Medium - no logical grouping | High |
| Duplicate items (Review Queue x2) | Low - confusion | Medium |
| Related features scattered | Medium - inefficient workflows | High |
| No progressive disclosure | High - overwhelming for new users | Critical |
| Inconsistent role visibility | Medium - security/UX mismatch | High |

---

## Section 2: Target State Architecture

### 2.1 Design Principles

1. **Progressive Disclosure** - Show less, reveal more on demand
2. **Task-Oriented Grouping** - Group by workflow, not feature type
3. **Role-Based Defaults** - Expand sections relevant to user's role
4. **Consistent Patterns** - Same interaction model throughout
5. **Quick Access** - Most-used items always visible (max 2 clicks)

### 2.2 New Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ OBSIDIAN AUDIT PLATFORM - RESTRUCTURED NAVIGATION              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ○ Dashboard                           [Always Visible]         │
│                                                                 │
│ ▼ My Work                             [Collapsible - Default Open for Staff]
│   ├── My Procedures                                             │
│   ├── Tasks                                                     │
│   ├── Time Tracking                                             │
│   └── Review Queue                    [Senior+ only]            │
│                                                                 │
│ ▼ Engagements                         [Collapsible - Primary Hub]
│   ├── Active Engagements                                        │
│   ├── Clients                                                   │
│   ├── Templates                       [Manager+ only]           │
│   └── Approvals                       [Manager+ only]           │
│                                                                 │
│ ▼ Audit Execution                     [Collapsible]             │
│   ├── Workpapers                                                │
│   ├── Findings                                                  │
│   ├── Evidence                                                  │
│   └── Information Requests                                      │
│                                                                 │
│ ▼ Tools & Libraries                   [Collapsible]             │
│   ├── Program Library                                           │
│   ├── Procedure Library                                         │
│   ├── Materiality Calculator                                    │
│   ├── Sampling Calculator                                       │
│   ├── Analytical Procedures                                     │
│   └── Confirmations                                             │
│                                                                 │
│ ▼ Planning & Risk                     [Collapsible - Manager+]  │
│   ├── Audit Universe                                            │
│   ├── Risk Assessments                                          │
│   └── Audit Plans                                               │
│                                                                 │
│ ▼ Quality & Analytics                 [Collapsible - Senior+]   │
│   ├── QC Dashboard                                              │
│   └── Analytics                                                 │
│                                                                 │
│ ▼ Administration                      [Collapsible - Admin only]│
│   ├── User Management                                           │
│   ├── Team Directory                                            │
│   └── Settings                                                  │
│                                                                 │
│ ─────────────────────────────────────                           │
│ ○ Settings (Quick Access)             [Always Visible]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 3: Detailed Navigation Specification

### 3.1 Complete Navigation Tree

```typescript
interface NavigationItem {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: AppRole[];        // If undefined, visible to all authenticated users
  children?: NavigationItem[];
  defaultExpanded?: boolean;
  badge?: 'count' | 'dot';  // Dynamic badge type
}

interface NavigationSection {
  id: string;
  label: string;
  collapsible: boolean;
  defaultExpanded?: boolean | 'role-based';
  roles?: AppRole[];
  items: NavigationItem[];
}
```

### 3.2 Navigation Configuration

| Section | Route | Component | Roles | Parent | Badge |
|---------|-------|-----------|-------|--------|-------|
| **Dashboard** | | | | | |
| Dashboard | `/dashboard` | `DashboardPage` | All | - | - |
| **My Work** | | | | | |
| My Procedures | `/my-procedures` | `MyProcedures` | All | My Work | Count |
| Tasks | `/tasks` | `TaskBoard` | All | My Work | Count |
| Time Tracking | `/time-tracking` | `TimeTracking` | All | My Work | - |
| Review Queue | `/review-queue` | `ProcedureReviewQueue` | Senior+ | My Work | Count |
| **Engagements** | | | | | |
| Active Engagements | `/engagements` | `EngagementsPage` | All | Engagements | - |
| Clients | `/clients` | `ClientsPage` | All | Engagements | - |
| Templates | `/engagements/templates` | `EngagementTemplates` | Manager+ | Engagements | - |
| Approvals | `/engagements/approvals` | `ApprovalsPage` | Manager+ | Engagements | Count |
| **Audit Execution** | | | | | |
| Workpapers | `/workpapers` | `WorkpapersPage` | All | Audit Execution | - |
| Findings | `/findings` | `FindingsManagement` | All | Audit Execution | Count |
| Evidence | `/evidence` | `EvidenceLibrary` | All | Audit Execution | - |
| Info Requests | `/information-requests` | `InformationRequests` | All | Audit Execution | Count |
| **Tools & Libraries** | | | | | |
| Program Library | `/programs` | `ProgramLibrary` | All | Tools | - |
| Procedure Library | `/procedures` | `ProcedureLibrary` | All | Tools | - |
| Materiality | `/tools/materiality` | `MaterialityCalculator` | Senior+ | Tools | - |
| Sampling | `/tools/sampling` | `SamplingCalculator` | All | Tools | - |
| Analytical | `/tools/analytical-procedures` | `AnalyticalProcedures` | All | Tools | - |
| Confirmations | `/tools/confirmations` | `ConfirmationTracker` | All | Tools | Count |
| **Planning & Risk** | | | | | |
| Audit Universe | `/universe` | `AuditUniverse` | Manager+ | Planning | - |
| Risk Assessments | `/risks` | `RiskAssessments` | Manager+ | Planning | - |
| Audit Plans | `/plans` | `AuditPlans` | Manager+ | Planning | - |
| **Quality & Analytics** | | | | | |
| QC Dashboard | `/quality-control` | `QualityControl` | Senior+ | Quality | Dot |
| Analytics | `/analytics` | `AnalyticsDashboard` | Senior+ | Quality | - |
| **Administration** | | | | | |
| User Management | `/admin/users` | `UserManagement` | Admin | Admin | - |
| Team Directory | `/admin/team` | `TeamDirectory` | Admin | Admin | - |
| Settings | `/settings` | `SettingsPage` | All | - | - |

### 3.3 Role Definitions

```typescript
type AppRole =
  | 'staff_auditor'        // Entry level - My Work, basic Audit Execution
  | 'senior_auditor'       // + Review Queue, Materiality, Quality
  | 'engagement_manager'   // + Templates, Approvals, Planning, Full Analytics
  | 'partner'              // + All features, firm-wide visibility
  | 'practice_leader'      // Same as partner
  | 'firm_administrator'   // + Administration section
  | 'business_development' // + Clients, limited audit features
  | 'client_user'          // External - very limited
  | 'client_administrator';// External - client admin

const ROLE_HIERARCHY: Record<AppRole, number> = {
  'client_user': 0,
  'client_administrator': 1,
  'staff_auditor': 10,
  'senior_auditor': 20,
  'engagement_manager': 30,
  'business_development': 25,
  'partner': 40,
  'practice_leader': 40,
  'firm_administrator': 50,
};
```

### 3.4 Role-Based Visibility Matrix

| Section/Item | Staff | Senior | Manager | Partner | Admin | BD | Client |
|--------------|-------|--------|---------|---------|-------|-----|--------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **My Work** | | | | | | | |
| My Procedures | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Time Tracking | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Review Queue | - | ✓ | ✓ | ✓ | ✓ | - | - |
| **Engagements** | | | | | | | |
| Active | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clients | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| Templates | - | - | ✓ | ✓ | ✓ | - | - |
| Approvals | - | - | ✓ | ✓ | ✓ | - | - |
| **Audit Execution** | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| **Tools & Libraries** | ✓ | ✓ | ✓ | ✓ | ✓ | - | - |
| Materiality | - | ✓ | ✓ | ✓ | ✓ | - | - |
| **Planning & Risk** | - | - | ✓ | ✓ | ✓ | - | - |
| **Quality & Analytics** | - | ✓ | ✓ | ✓ | ✓ | - | - |
| **Administration** | - | - | - | - | ✓ | - | - |
| Settings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Section 4: Implementation Specification

### 4.1 Navigation Configuration Object

```typescript
// src/config/navigation.ts

import {
  LayoutGrid, ListChecks, Clock, Eye, Briefcase, Building2,
  FolderKanban, CheckCircle2, FileSearch, AlertTriangle,
  Database, Send, Layers, BookOpen, Calculator, Scale,
  TrendingUp, MessageSquare, Globe, Target, FileText,
  ShieldCheck, BarChart3, Users, UserCog, Settings
} from 'lucide-react';

export const navigationConfig: NavigationSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    collapsible: false,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutGrid,
      },
    ],
  },
  {
    id: 'my-work',
    label: 'My Work',
    collapsible: true,
    defaultExpanded: 'role-based', // Auto-expand for staff/senior
    items: [
      {
        id: 'my-procedures',
        title: 'My Procedures',
        url: '/my-procedures',
        icon: ListChecks,
        badge: 'count',
      },
      {
        id: 'tasks',
        title: 'Tasks',
        url: '/tasks',
        icon: LayoutList,
        badge: 'count',
      },
      {
        id: 'time-tracking',
        title: 'Time Tracking',
        url: '/time-tracking',
        icon: Clock,
      },
      {
        id: 'review-queue',
        title: 'Review Queue',
        url: '/review-queue',
        icon: Eye,
        roles: ['senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
        badge: 'count',
      },
    ],
  },
  {
    id: 'engagements',
    label: 'Engagements',
    collapsible: true,
    defaultExpanded: true,
    items: [
      {
        id: 'active-engagements',
        title: 'Active Engagements',
        url: '/engagements',
        icon: Briefcase,
      },
      {
        id: 'clients',
        title: 'Clients',
        url: '/clients',
        icon: Building2,
      },
      {
        id: 'templates',
        title: 'Templates',
        url: '/engagements/templates',
        icon: FolderKanban,
        roles: ['engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
      },
      {
        id: 'approvals',
        title: 'Approvals',
        url: '/engagements/approvals',
        icon: CheckCircle2,
        roles: ['engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
        badge: 'count',
      },
    ],
  },
  {
    id: 'audit-execution',
    label: 'Audit Execution',
    collapsible: true,
    defaultExpanded: false,
    roles: ['staff_auditor', 'senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
    items: [
      {
        id: 'workpapers',
        title: 'Workpapers',
        url: '/workpapers',
        icon: FileSearch,
      },
      {
        id: 'findings',
        title: 'Findings',
        url: '/findings',
        icon: AlertTriangle,
        badge: 'count',
      },
      {
        id: 'evidence',
        title: 'Evidence',
        url: '/evidence',
        icon: Database,
      },
      {
        id: 'information-requests',
        title: 'Info Requests',
        url: '/information-requests',
        icon: Send,
        badge: 'count',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools & Libraries',
    collapsible: true,
    defaultExpanded: false,
    roles: ['staff_auditor', 'senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
    items: [
      {
        id: 'programs',
        title: 'Program Library',
        url: '/programs',
        icon: Layers,
      },
      {
        id: 'procedures',
        title: 'Procedure Library',
        url: '/procedures',
        icon: BookOpen,
      },
      {
        id: 'materiality',
        title: 'Materiality',
        url: '/tools/materiality',
        icon: Calculator,
        roles: ['senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
      },
      {
        id: 'sampling',
        title: 'Sampling',
        url: '/tools/sampling',
        icon: Scale,
      },
      {
        id: 'analytical',
        title: 'Analytical Procedures',
        url: '/tools/analytical-procedures',
        icon: TrendingUp,
      },
      {
        id: 'confirmations',
        title: 'Confirmations',
        url: '/tools/confirmations',
        icon: MessageSquare,
        badge: 'count',
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & Risk',
    collapsible: true,
    defaultExpanded: false,
    roles: ['engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
    items: [
      {
        id: 'universe',
        title: 'Audit Universe',
        url: '/universe',
        icon: Globe,
      },
      {
        id: 'risks',
        title: 'Risk Assessments',
        url: '/risks',
        icon: Target,
      },
      {
        id: 'plans',
        title: 'Audit Plans',
        url: '/plans',
        icon: FileText,
      },
    ],
  },
  {
    id: 'quality',
    label: 'Quality & Analytics',
    collapsible: true,
    defaultExpanded: false,
    roles: ['senior_auditor', 'engagement_manager', 'partner', 'practice_leader', 'firm_administrator'],
    items: [
      {
        id: 'qc-dashboard',
        title: 'QC Dashboard',
        url: '/quality-control',
        icon: ShieldCheck,
        badge: 'dot',
      },
      {
        id: 'analytics',
        title: 'Analytics',
        url: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    collapsible: true,
    defaultExpanded: false,
    roles: ['firm_administrator'],
    items: [
      {
        id: 'user-management',
        title: 'User Management',
        url: '/admin/users',
        icon: UserCog,
      },
      {
        id: 'team',
        title: 'Team Directory',
        url: '/admin/team',
        icon: Users,
      },
      {
        id: 'settings',
        title: 'Settings',
        url: '/settings',
        icon: Settings,
      },
    ],
  },
];

// Quick access items (always visible at bottom)
export const quickAccessItems: NavigationItem[] = [
  {
    id: 'settings-quick',
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];
```

### 4.2 Collapsible Section Component

```typescript
// src/components/navigation/CollapsibleNavSection.tsx

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';

interface CollapsibleNavSectionProps {
  section: NavigationSection;
  isOpen: boolean;          // Sidebar expanded state
  userRoles: AppRole[];
  badgeCounts?: Record<string, number>;
}

export function CollapsibleNavSection({
  section,
  isOpen,
  userRoles,
  badgeCounts = {},
}: CollapsibleNavSectionProps) {
  const [expanded, setExpanded] = useState(
    section.defaultExpanded === true ||
    (section.defaultExpanded === 'role-based' && shouldAutoExpand(section, userRoles))
  );

  // Filter items by role
  const visibleItems = section.items.filter(item =>
    !item.roles || item.roles.some(role => userRoles.includes(role))
  );

  // Don't render section if no visible items
  if (visibleItems.length === 0) return null;

  // Non-collapsible section (e.g., Dashboard)
  if (!section.collapsible) {
    return (
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {visibleItems.map(item => (
              <NavItem key={item.id} item={item} isOpen={isOpen} badgeCount={badgeCounts[item.id]} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <SidebarGroup className="py-1">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer hover:bg-muted/50 rounded-md flex items-center justify-between text-[10px] uppercase tracking-wider py-1.5 px-2">
            <span>{section.label}</span>
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                expanded && "rotate-90"
              )}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {visibleItems.map(item => (
                <NavItem key={item.id} item={item} isOpen={isOpen} badgeCount={badgeCounts[item.id]} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function NavItem({
  item,
  isOpen,
  badgeCount
}: {
  item: NavigationItem;
  isOpen: boolean;
  badgeCount?: number;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className="h-8">
        <NavLink to={item.url} className="flex items-center justify-between">
          <div className="flex items-center">
            <item.icon className={cn("h-3.5 w-3.5", isOpen && "mr-2")} />
            {isOpen && <span className="text-sm">{item.title}</span>}
          </div>
          {isOpen && item.badge && badgeCount !== undefined && badgeCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 text-xs">
              {item.badge === 'count' ? badgeCount : ''}
            </Badge>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function shouldAutoExpand(section: NavigationSection, userRoles: AppRole[]): boolean {
  // My Work auto-expands for staff and senior auditors
  if (section.id === 'my-work') {
    return userRoles.some(r => ['staff_auditor', 'senior_auditor'].includes(r));
  }
  // Engagements always starts expanded
  if (section.id === 'engagements') {
    return true;
  }
  return false;
}
```

### 4.3 Updated AppSidebar Component

```typescript
// src/components/AppSidebar.tsx (restructured)

import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { navigationConfig, quickAccessItems } from '@/config/navigation';
import { useNavigationBadges } from '@/hooks/useNavigationBadges';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { CollapsibleNavSection } from '@/components/navigation/CollapsibleNavSection';
import { FirmSwitcher } from '@/components/FirmSwitcher';
import { RoleBadge } from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

export function AppSidebar() {
  const { roles, profile, signOut, isLoading } = useAuth();
  const { open } = useSidebar();
  const { badgeCounts } = useNavigationBadges();

  // Filter sections by role
  const visibleSections = navigationConfig.filter(section =>
    !section.roles || section.roles.some(role => roles.includes(role))
  );

  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border px-3 py-2">
        {open ? (
          <div className="space-y-1">
            <FirmSwitcher />
            {profile && roles.length > 0 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground truncate">
                  {profile.first_name} {profile.last_name}
                </span>
                <RoleBadge role={roles[0]} size="sm" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mx-auto">
            {profile?.first_name?.[0] || 'U'}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto py-2">
        {visibleSections.map(section => (
          <CollapsibleNavSection
            key={section.id}
            section={section}
            isOpen={open}
            userRoles={roles}
            badgeCounts={badgeCounts}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start h-8"
            asChild
          >
            <NavLink to="/settings">
              <Settings className="h-3.5 w-3.5 mr-2" />
              {open && <span className="text-sm">Settings</span>}
            </NavLink>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={signOut}
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
```

### 4.4 Badge Counts Hook

```typescript
// src/hooks/useNavigationBadges.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNavigationBadges() {
  const { profile } = useAuth();

  const { data: badgeCounts = {} } = useQuery({
    queryKey: ['navigation-badges', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return {};

      const counts: Record<string, number> = {};

      // My Procedures count
      const { count: proceduresCount } = await supabase
        .from('engagement_procedures')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', profile.id)
        .in('status', ['not_started', 'in_progress']);
      counts['my-procedures'] = proceduresCount || 0;

      // Tasks count
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', profile.id)
        .eq('status', 'pending');
      counts['tasks'] = tasksCount || 0;

      // Review Queue count
      const { count: reviewCount } = await supabase
        .from('engagement_procedures')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_review');
      counts['review-queue'] = reviewCount || 0;

      // Approvals count
      const { count: approvalsCount } = await supabase
        .from('engagements')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_approval');
      counts['approvals'] = approvalsCount || 0;

      // Findings count (open)
      const { count: findingsCount } = await supabase
        .from('audit_findings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      counts['findings'] = findingsCount || 0;

      // Information Requests (pending)
      const { count: irCount } = await supabase
        .from('information_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      counts['information-requests'] = irCount || 0;

      // Confirmations (awaiting response)
      const { count: confirmCount } = await supabase
        .from('confirmations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');
      counts['confirmations'] = confirmCount || 0;

      return counts;
    },
    enabled: !!profile?.id,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  return { badgeCounts };
}
```

---

## Section 5: Comparison Summary

### 5.1 Before vs After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Top-level sections | 10 | 8 | 20% reduction |
| Visible items (collapsed) | 32 | 8 | 75% reduction |
| Max clicks to feature | 1 | 2 | Acceptable trade-off |
| Role-based filtering | Partial | Complete | Full RBAC |
| Progressive disclosure | No | Yes | Major UX improvement |
| Badge notifications | No | Yes | Improved awareness |
| Keyboard navigation | Basic | Full | Accessibility |

### 5.2 User Journey Improvements

**Staff Auditor (Before):**
1. See 32 items, scan for "My Procedures"
2. Cognitive load: High

**Staff Auditor (After):**
1. See "My Work" section auto-expanded
2. "My Procedures" immediately visible with count badge
3. Cognitive load: Low

**Engagement Manager (Before):**
1. Scroll through 32 items to find Templates
2. No indication of pending approvals

**Engagement Manager (After):**
1. "Engagements" section shows Templates
2. "Approvals" shows count badge for pending items
3. "Planning & Risk" section available

---

## Section 6: Migration Plan

### Phase 1: Configuration Setup (Day 1)
- [ ] Create `src/config/navigation.ts`
- [ ] Create type definitions
- [ ] Create `CollapsibleNavSection` component

### Phase 2: Component Updates (Day 1-2)
- [ ] Refactor `AppSidebar.tsx`
- [ ] Implement `useNavigationBadges` hook
- [ ] Add keyboard navigation support

### Phase 3: Testing (Day 2)
- [ ] Test all role combinations
- [ ] Verify route accessibility
- [ ] Test collapsed/expanded states
- [ ] Mobile responsiveness check

### Phase 4: Polish (Day 3)
- [ ] Animation refinements
- [ ] Tooltip improvements
- [ ] Accessibility audit
- [ ] Documentation update

---

## Section 7: Future Enhancements

1. **Favorites/Pinned Items** - Let users pin frequently used items
2. **Recent Items** - Show recently visited pages
3. **Search** - Quick navigation search (Cmd+K)
4. **Customizable Sections** - Let users reorder sections
5. **Contextual Navigation** - Show relevant items based on current page

---

## Appendix A: Icon Reference

| Item | Icon | Package |
|------|------|---------|
| Dashboard | LayoutGrid | lucide-react |
| My Procedures | ListChecks | lucide-react |
| Tasks | LayoutList | lucide-react |
| Time Tracking | Clock | lucide-react |
| Review Queue | Eye | lucide-react |
| Engagements | Briefcase | lucide-react |
| Clients | Building2 | lucide-react |
| Templates | FolderKanban | lucide-react |
| Approvals | CheckCircle2 | lucide-react |
| Workpapers | FileSearch | lucide-react |
| Findings | AlertTriangle | lucide-react |
| Evidence | Database | lucide-react |
| Info Requests | Send | lucide-react |
| Programs | Layers | lucide-react |
| Procedures | BookOpen | lucide-react |
| Materiality | Calculator | lucide-react |
| Sampling | Scale | lucide-react |
| Analytical | TrendingUp | lucide-react |
| Confirmations | MessageSquare | lucide-react |
| Audit Universe | Globe | lucide-react |
| Risk Assessments | Target | lucide-react |
| Audit Plans | FileText | lucide-react |
| QC Dashboard | ShieldCheck | lucide-react |
| Analytics | BarChart3 | lucide-react |
| User Management | UserCog | lucide-react |
| Team | Users | lucide-react |
| Settings | Settings | lucide-react |

---

*Document End*
