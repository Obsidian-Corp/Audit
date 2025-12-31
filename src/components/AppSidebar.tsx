/**
 * AppSidebar
 * Ticket: NAV-003, UI-003
 *
 * Main application sidebar with collapsible navigation sections.
 * Uses the centralized navigation configuration for role-based access.
 *
 * UI-003 enhancements:
 * - Keyboard navigation support (arrow keys, Home/End, Enter)
 * - Cmd/Ctrl+/ to focus sidebar
 * - Screen reader improvements
 *
 * @see docs/NAVIGATION_RESTRUCTURE_DESIGN.md
 */

import { useRef } from "react";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { sidebarNavigation } from "@/config/navigation";
import { useNavigationBadges } from "@/hooks/useNavigationBadges";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { CollapsibleNavSection } from "@/components/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { FirmSwitcher } from "@/components/FirmSwitcher";
import { RoleBadge } from "@/components/RoleBadge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for sidebar
 * UI-005: Enhanced loading skeleton with staggered animations
 */
function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border px-3 py-2">
        <div className="space-y-2">
          {/* Firm switcher skeleton */}
          <Skeleton className="h-8 w-full animate-pulse" />
          {/* User info skeleton */}
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-3 w-20 animate-pulse" />
            <Skeleton className="h-4 w-16 animate-pulse" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2 space-y-1">
        {/* Section skeletons with staggered animation */}
        {[
          { label: 'Dashboard', items: 1 },
          { label: 'My Work', items: 3 },
          { label: 'Engagements', items: 4 },
          { label: 'Audit', items: 4 },
        ].map((section, sectionIndex) => (
          <div
            key={section.label}
            className="px-2 py-1 space-y-1"
            style={{ animationDelay: `${sectionIndex * 100}ms` }}
          >
            {/* Section header skeleton */}
            <div className="flex items-center justify-between py-1">
              <Skeleton
                className="h-2.5 animate-pulse"
                style={{ width: `${section.label.length * 8}px` }}
              />
              <Skeleton className="h-2.5 w-2.5 animate-pulse" />
            </div>
            {/* Nav item skeletons */}
            {Array.from({ length: section.items }).map((_, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center gap-2 py-1"
                style={{ animationDelay: `${(sectionIndex * 100) + (itemIndex * 50)}ms` }}
              >
                <Skeleton className="h-3.5 w-3.5 rounded animate-pulse" />
                <Skeleton
                  className="h-3 flex-1 animate-pulse"
                  style={{ maxWidth: `${60 + Math.random() * 40}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 flex-1 animate-pulse" />
          <Skeleton className="h-8 w-8 animate-pulse" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Badge loading skeleton (for when badge counts are loading)
 */
function BadgeSkeleton() {
  return (
    <Skeleton className="h-5 w-5 rounded animate-pulse" />
  );
}

export function AppSidebar() {
  const { roles, profile, signOut, isLoading } = useAuth();
  const { open, setOpen } = useSidebar();
  const { badgeCounts, isLoading: badgesLoading } = useNavigationBadges();
  const navRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation hook
  const { handleKeyDown } = useKeyboardNavigation({
    containerRef: navRef,
    itemSelector: 'a[data-nav-item], button[data-nav-item]',
    onEscape: () => setOpen(false),
    enabled: open,
  });

  // Filter sections by user role
  const visibleSections = sidebarNavigation.filter(section =>
    !section.roles || section.roles.some(role => roles.includes(role))
  );

  if (isLoading) {
    return <SidebarSkeleton />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon" ref={navRef}>
        {/* Header with firm switcher and user info */}
        <SidebarHeader className="border-b border-border px-3 py-2">
          {open ? (
            <div className="space-y-1">
              <FirmSwitcher />
              {profile && roles.length > 0 && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {profile.first_name} {profile.last_name}
                  </span>
                  <RoleBadge role={roles[0]} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mx-auto">
              {profile?.first_name?.[0] || 'U'}
            </div>
          )}
        </SidebarHeader>

        {/* Main navigation content */}
        <SidebarContent
          className="overflow-y-auto py-2"
          role="navigation"
          aria-label="Main navigation"
          onKeyDown={handleKeyDown}
        >
          {visibleSections.map(section => (
            <CollapsibleNavSection
              key={section.id}
              section={section}
              isSidebarOpen={open}
              userRoles={roles}
              badgeCounts={badgeCounts}
            />
          ))}
        </SidebarContent>

        {/* Footer with settings and sign out */}
        <SidebarFooter className="border-t border-border p-2">
          {open ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-start h-8"
                asChild
              >
                <NavLink to="/settings">
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  <span className="text-sm">Settings</span>
                </NavLink>
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={signOut}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <NavLink to="/settings">
                      <Settings className="h-3.5 w-3.5" />
                      <span className="sr-only">Settings</span>
                    </NavLink>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Settings
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={signOut}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="sr-only">Sign Out</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Sign Out
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
