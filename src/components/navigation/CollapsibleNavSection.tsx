/**
 * CollapsibleNavSection
 * Ticket: NAV-002, UI-001
 *
 * A collapsible navigation section component for the sidebar.
 * Supports role-based filtering, badges, smooth animations, and keyboard navigation.
 *
 * UI-001 enhancements:
 * - Smoother expand/collapse animations
 * - Better hover and focus states
 * - Active item highlighting with left border indicator
 * - Section header badge summaries when collapsed
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NavLink } from '@/components/NavLink';
import { Badge } from '@/components/ui/badge';
import type { NavigationSection, NavSectionItem } from '@/config/navigation';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface CollapsibleNavSectionProps {
  /** The navigation section configuration */
  section: NavigationSection;
  /** Whether the sidebar is expanded */
  isSidebarOpen: boolean;
  /** User's assigned roles */
  userRoles: AppRole[];
  /** Badge counts keyed by item ID */
  badgeCounts?: Record<string, number>;
}

/**
 * Determine if a section should auto-expand based on user role
 */
function shouldAutoExpand(sectionId: string, userRoles: AppRole[]): boolean {
  // My Work auto-expands for staff and senior auditors
  if (sectionId === 'my-work') {
    return userRoles.some(r => ['staff_auditor', 'senior_auditor'].includes(r));
  }
  // Engagements always starts expanded
  if (sectionId === 'engagements') {
    return true;
  }
  return false;
}

/**
 * Check if an item's path matches the current route
 * Handles special cases like dashboard/workspace redirects
 */
function isItemActive(itemUrl: string, pathname: string): boolean {
  // Handle dashboard/workspace equivalence
  if (itemUrl === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/workspace';
  }
  if (itemUrl === '/workspace') {
    return pathname === '/workspace' || pathname === '/dashboard';
  }

  // Exact match
  if (pathname === itemUrl) return true;

  // Prefix match for nested routes (e.g., /engagements/123 matches /engagements)
  // But only if the next character after the url is a slash
  if (pathname.startsWith(itemUrl + '/')) return true;

  return false;
}

export function CollapsibleNavSection({
  section,
  isSidebarOpen,
  userRoles,
  badgeCounts = {},
}: CollapsibleNavSectionProps) {
  const location = useLocation();

  // Determine initial expanded state
  const getInitialExpanded = useCallback(() => {
    if (section.defaultExpanded === true) return true;
    if (section.defaultExpanded === false) return false;
    if (section.defaultExpanded === 'role-based') {
      return shouldAutoExpand(section.id, userRoles);
    }
    return false;
  }, [section.defaultExpanded, section.id, userRoles]);

  const [expanded, setExpanded] = useState(getInitialExpanded);

  // Filter items by role (memoized for performance)
  const visibleItems = useMemo(() =>
    section.items.filter(item =>
      !item.roles || item.roles.some(role => userRoles.includes(role))
    ),
    [section.items, userRoles]
  );

  // Calculate total badge count for section header (when collapsed)
  const sectionBadgeTotal = useMemo(() => {
    return visibleItems.reduce((sum, item) => {
      if (item.badge === 'count') {
        return sum + (badgeCounts[item.id] || 0);
      }
      return sum;
    }, 0);
  }, [visibleItems, badgeCounts]);

  // Check if section has any active item
  const hasActiveItem = useMemo(() =>
    visibleItems.some(item => isItemActive(item.url, location.pathname)),
    [visibleItems, location.pathname]
  );

  // Auto-expand section if it contains the active route
  useEffect(() => {
    if (hasActiveItem && !expanded) {
      setExpanded(true);
    }
  }, [hasActiveItem]);

  // Don't render section if no visible items
  if (visibleItems.length === 0) return null;

  // Non-collapsible section (e.g., Dashboard)
  if (!section.collapsible) {
    return (
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarMenu className="gap-0.5">
            {visibleItems.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isSidebarOpen={isSidebarOpen}
                badgeCount={badgeCounts[item.id]}
                isActive={isItemActive(item.url, location.pathname)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Collapsible section
  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <SidebarGroup className={cn(
        "py-1 transition-all duration-200",
        hasActiveItem && !expanded && "border-l-2 border-primary ml-0.5"
      )}>
        {isSidebarOpen ? (
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel
              className={cn(
                "cursor-pointer rounded-md flex items-center justify-between",
                "text-[10px] uppercase tracking-wider py-1.5 px-2",
                "transition-all duration-150 ease-out",
                "hover:bg-muted/50 focus-visible:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                hasActiveItem && "text-primary font-semibold"
              )}
            >
              <span className="flex items-center gap-2">
                {section.label}
                {/* Show badge summary when section is collapsed */}
                {!expanded && sectionBadgeTotal > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 min-w-4 px-1 text-[10px] font-medium animate-in fade-in-0 zoom-in-95 duration-200"
                  >
                    {sectionBadgeTotal > 99 ? '99+' : sectionBadgeTotal}
                  </Badge>
                )}
              </span>
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform duration-200 ease-out",
                  expanded && "rotate-90"
                )}
              />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
        ) : (
          // When sidebar is collapsed, show section divider with optional badge indicator
          <div className="relative mx-2 my-1">
            <div className="h-px bg-border" />
            {sectionBadgeTotal > 0 && (
              <span className="absolute right-0 -top-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
        )}
        <CollapsibleContent
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1"
          )}
        >
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {visibleItems.map((item, index) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isSidebarOpen={isSidebarOpen}
                  badgeCount={badgeCounts[item.id]}
                  isActive={isItemActive(item.url, location.pathname)}
                  animationDelay={index * 30}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

interface NavItemProps {
  item: NavSectionItem;
  isSidebarOpen: boolean;
  badgeCount?: number;
  isActive: boolean;
  /** Animation delay in ms for staggered entrance */
  animationDelay?: number;
}

function NavItem({
  item,
  isSidebarOpen,
  badgeCount,
  isActive,
  animationDelay = 0,
}: NavItemProps) {
  const Icon = item.icon;

  const content = (
    <SidebarMenuButton
      asChild
      className={cn(
        "h-8 transition-all duration-150 ease-out group/navitem",
        !isSidebarOpen && "justify-center",
        // Enhanced active state with left border indicator
        isActive && [
          "bg-primary/10 text-primary font-medium",
          "border-l-2 border-primary -ml-0.5 pl-[calc(0.5rem+2px)]",
          "hover:bg-primary/15"
        ],
        // Hover state for non-active items
        !isActive && "hover:bg-muted/80"
      )}
      style={{
        // Staggered animation delay
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <NavLink to={item.url} className="flex items-center justify-between w-full" data-nav-item data-active={isActive}>
        <div className="flex items-center min-w-0">
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
              isSidebarOpen && "mr-2",
              // Subtle icon animation on hover
              "group-hover/navitem:scale-110",
              isActive && "text-primary"
            )}
          />
          {isSidebarOpen && (
            <span className="text-sm truncate">{item.title}</span>
          )}
        </div>
        {isSidebarOpen && item.badge && (
          <NavBadge type={item.badge} count={badgeCount} isActive={isActive} />
        )}
      </NavLink>
    </SidebarMenuButton>
  );

  // Wrap with tooltip when sidebar is collapsed
  if (!isSidebarOpen) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className={cn(
              "flex items-center gap-2",
              isActive && "border-primary"
            )}
          >
            <span className={cn(isActive && "font-medium")}>{item.title}</span>
            {item.badge && <NavBadge type={item.badge} count={badgeCount} isActive={isActive} />}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return <SidebarMenuItem>{content}</SidebarMenuItem>;
}

interface NavBadgeProps {
  type: 'count' | 'dot';
  count?: number;
  isActive?: boolean;
}

function NavBadge({ type, count, isActive }: NavBadgeProps) {
  if (type === 'dot') {
    return (
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0 transition-colors",
          isActive ? "bg-primary" : "bg-primary/70"
        )}
      />
    );
  }

  if (type === 'count' && count !== undefined && count > 0) {
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={cn(
          "h-5 min-w-5 px-1.5 text-xs font-medium shrink-0",
          "transition-all duration-150",
          isActive && "bg-primary text-primary-foreground"
        )}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    );
  }

  return null;
}

export default CollapsibleNavSection;
