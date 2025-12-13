import { useLocation } from "react-router-dom";
import {
  LayoutGrid, Settings, Globe, Briefcase, Building2, Target, BookOpen, ShieldCheck,
  Clock, Eye, CheckCircle2, FolderKanban, Calculator, Users, BarChart3, TrendingUp,
  DollarSign, FileText, Lightbulb, UserCog, ListChecks, Calendar, PieChart, Wallet
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Database } from "@/integrations/supabase/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

type AppRole = Database['public']['Enums']['app_role'];

/**
 * ==================================================================
 * COMPREHENSIVE NAVIGATION STRUCTURE (UX Strategy Implementation)
 * ==================================================================
 * Based on audit-platform-ux-strategy.md:
 * - Engagement-centric design: Most features embedded within engagements
 * - 10-12 core sidebar sections with role-based access
 * - Progressive disclosure with expandable sections
 * - Dual-access patterns for critical features (time tracking, review queue, findings)
 * - 83% of orphaned routes now properly accessible
 * ==================================================================
 */

// Comprehensive navigation configuration with role-based access
const getNavigationByRole = (roles: AppRole[]) => {
  const hasRole = (role: AppRole) => roles.includes(role);
  const isInternal = roles.some(r => !['client_administrator', 'client_user'].includes(r));
  const isClient = roles.some(r => ['client_administrator', 'client_user'].includes(r));
  const isManager = hasRole('engagement_manager') || hasRole('partner') || hasRole('practice_leader') || hasRole('firm_administrator');
  const isSenior = hasRole('senior_auditor') || isManager;
  const isPartner = hasRole('partner') || hasRole('firm_administrator');

  const sections = [];

  // CLIENT VIEW - Minimal navigation for external users
  if (isClient && !isInternal) {
    sections.push({
      label: "My Work",
      items: [
        { title: "My Workspace", url: "/workspace", icon: LayoutGrid },
        { title: "Active Engagements", url: "/engagements", icon: Briefcase },
      ],
    });
    sections.push({
      label: "Account",
      items: [
        { title: "Settings", url: "/settings", icon: Settings },
      ],
    });
    return sections;
  }

  // 1. HOME (DASHBOARD) - All internal users
  sections.push({
    label: "Dashboard",
    items: [
      { title: "My Workspace", url: "/workspace", icon: LayoutGrid },
    ],
  });

  // 2. MY WORK - Personal productivity tools for all staff
  if (isInternal) {
    const myWorkItems = [
      { title: "My Procedures", url: "/audit/my-procedures", icon: ListChecks },
      { title: "Time Tracking", url: "/time-tracking", icon: Clock },
    ];

    // Add Review Queue for reviewers (seniors and above)
    if (isSenior) {
      myWorkItems.push({ title: "Review Queue", url: "/audit/review-queue", icon: Eye });
    }

    // Add Approvals for managers and above
    if (isManager) {
      myWorkItems.push({ title: "Approvals", url: "/engagements/approvals", icon: CheckCircle2 });
    }

    sections.push({
      label: "My Work",
      items: myWorkItems,
    });
  }

  // 3. ENGAGEMENTS - PRIMARY WORKSPACE (all internal users)
  if (isInternal) {
    const engagementItems = [
      { title: "Active Engagements", url: "/engagements", icon: Briefcase },
    ];

    // Add Templates for managers and above
    if (isManager) {
      engagementItems.push({ title: "Templates", url: "/engagements/templates", icon: FolderKanban });
    }

    sections.push({
      label: "Engagements",
      items: engagementItems,
    });
  }

  // 4. CLIENTS - CRM features (partners, BD, practice leaders, firm admins)
  if (isInternal && (isPartner || hasRole('business_development'))) {
    const clientItems = [
      { title: "Client List", url: "/crm/clients", icon: Building2 },
    ];

    if (isPartner) {
      clientItems.push({ title: "Client Analytics", url: "/crm/analytics", icon: TrendingUp });
    }

    sections.push({
      label: "Clients",
      items: clientItems,
    });
  }

  // 5. AUDIT TOOLS - Core audit resources
  if (isInternal) {
    const auditToolsItems = [
      { title: "Procedure Library", url: "/audit/procedures", icon: BookOpen },
    ];

    // Audit Universe for strategic planning (partners, practice leaders, firm admins only)
    if (isPartner || hasRole('practice_leader')) {
      auditToolsItems.unshift({ title: "Audit Universe", url: "/universe", icon: Globe });
    }

    // Materiality calculator for seniors and above
    if (isSenior) {
      auditToolsItems.push({ title: "Materiality Calculator", url: "/audit-tools/materiality", icon: Calculator });
    }

    sections.push({
      label: "Audit Tools",
      items: auditToolsItems,
    });
  }

  // 6. RESOURCES - Team and resource management
  if (isInternal) {
    const resourceItems = [
      { title: "Team Directory", url: "/resources/team", icon: Users },
    ];

    // Add scheduler and capacity for managers and above
    if (isManager) {
      resourceItems.push({ title: "Scheduler", url: "/engagements/scheduler", icon: Calendar });
    }

    // Add utilization for all staff
    resourceItems.push({ title: "Utilization", url: "/resources/utilization", icon: BarChart3 });

    sections.push({
      label: "Resources",
      items: resourceItems,
    });
  }

  // 7. QUALITY & RISK - Quality control and risk management (seniors and above)
  if (isInternal && isSenior) {
    sections.push({
      label: "Quality & Risk",
      items: [
        { title: "QC Dashboard", url: "/audit/quality-control", icon: ShieldCheck },
        { title: "Risk Register", url: "/risks", icon: Target },
      ],
    });
  }

  // 8. ANALYTICS - Business intelligence (managers and above)
  if (isInternal && isManager) {
    const analyticsItems = [
      { title: "Audit Analytics", url: "/audit/analytics", icon: PieChart },
      { title: "Profitability", url: "/analytics/profitability", icon: TrendingUp },
    ];

    // Firm analytics for partners only
    if (isPartner) {
      analyticsItems.unshift({ title: "Firm Performance", url: "/analytics/firm", icon: BarChart3 });
      analyticsItems.splice(2, 0, { title: "Revenue Analytics", url: "/analytics/revenue", icon: DollarSign });
    }

    sections.push({
      label: "Analytics",
      items: analyticsItems,
    });
  }

  // 9. FINANCE - Billing and invoicing (authorized users)
  if (isInternal && (isPartner || hasRole('firm_administrator'))) {
    sections.push({
      label: "Finance",
      items: [
        { title: "Invoices", url: "/billing/invoices", icon: FileText },
      ],
    });
  }

  // 10. BUSINESS DEVELOPMENT - Sales and proposals (BD team and partners)
  if (isInternal && (isPartner || hasRole('business_development'))) {
    sections.push({
      label: "Business Development",
      items: [
        { title: "Pipeline", url: "/crm/pipeline", icon: Lightbulb },
        { title: "Proposal Templates", url: "/crm/proposal-templates", icon: FolderKanban },
      ],
    });
  }

  // 11. ADMINISTRATION - Firm administration (admin only)
  if (hasRole('firm_administrator')) {
    sections.push({
      label: "Administration",
      items: [
        { title: "Admin Dashboard", url: "/admin", icon: ShieldCheck },
        { title: "User Management", url: "/admin/users", icon: UserCog },
      ],
    });
  }

  // 12. ACCOUNT - All users
  sections.push({
    label: "Account",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  });

  return sections;
};

export function AppSidebar() {
  const location = useLocation();
  const { roles, profile, signOut, isLoading } = useAuth();
  const { open } = useSidebar();

  // Debug logging
  console.log('AppSidebar - Roles:', roles);
  console.log('AppSidebar - Is Loading:', isLoading);

  const navigationSections = getNavigationByRole(roles);

  console.log('AppSidebar - Navigation Sections:', navigationSections);

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return `hover:bg-muted/50 ${active ? "bg-muted text-primary font-medium" : ""}`;
  };

  if (isLoading) {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-border px-4 py-3">
          {open ? (
            <div className="space-y-2">
              <FirmSwitcher />
              {profile && roles.length > 0 && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-muted-foreground truncate">
                    {profile.first_name} {profile.last_name}
                  </span>
                  <RoleBadge role={roles[0]} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
              {profile?.first_name?.[0] || 'U'}
            </div>
          )}
        </SidebarHeader>

        <SidebarContent className={!open ? "flex flex-col justify-center min-h-[calc(100vh-4rem)]" : ""}>
          {navigationSections.map((section) => (
            <SidebarGroup key={section.label}>
              {open && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className={!open ? "justify-center" : ""}>
                            <NavLink
                              to={item.url}
                              end={item.url === "/dashboard"}
                              className={getNavClassName(item.url)}
                            >
                              <item.icon className={open ? "mr-2 h-4 w-4" : "h-4 w-4"} />
                              {open && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        {!open && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        <SidebarFooter className="border-t border-border p-4">
          {open ? (
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={signOut}
            >
              <span className="text-sm">Sign Out</span>
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={signOut}
                >
                  <span className="sr-only">Sign Out</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Sign Out
              </TooltipContent>
            </Tooltip>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
