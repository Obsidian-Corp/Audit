import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { OrgSwitcher } from "./OrgSwitcher";
import { AppSwitcher } from "./portal/AppSwitcher";
import { TimeTrackingWidget } from "./time/TimeTrackingWidget";
import obsidianLogo from "@/assets/obsidian-logo.svg";

export function AppLayout() {
  const navigate = useNavigate();

  // Sidebar state with localStorage persistence
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-state');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-state', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Mock user data for UI display
  const userInitials = "AU";

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar */}
          <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
              
              {/* Logo/Brand - Click to go to workspace */}
              <button
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <img src={obsidianLogo} alt="Obsidian" className="h-6 w-auto" />
              </button>

              <div className="border-l border-border h-8 mx-2" />
              
              {/* App Switcher */}
              <AppSwitcher />
            </div>

            <div className="flex items-center gap-4">
              {/* Time Tracking Widget - P0 Critical: Omnipresent access */}
              <TimeTrackingWidget />

              {/* Notifications */}
              <NotificationsDropdown />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-secondary text-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">
                        Audit User
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Account Settings
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/workspace")}>
                    My Workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
