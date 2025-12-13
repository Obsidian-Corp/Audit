/**
 * ============================================================================
 * PLATFORM ADMIN ROUTE GUARD
 * ============================================================================
 * Authentication System: PLATFORM ADMIN (platform_admin.admin_users)
 * DO NOT MIX with client auth (auth.users)
 * 
 * This guard protects platform admin routes by verifying:
 * 1. Valid admin session exists in localStorage
 * 2. Session token is valid via admin-auth-verify edge function
 * 3. Admin user exists and is active in platform_admin.admin_users
 * ============================================================================
 */

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Shield, Loader2 } from "lucide-react";

interface PlatformAdminGuardProps {
  children: ReactNode;
}

export function PlatformAdminGuard({ children }: PlatformAdminGuardProps) {
  const { session, isValidating } = useAdminSession();

  // Show loading state while validating session
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground font-mono text-sm">Validating admin session...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin auth if no valid session
  if (!session) {
    console.log('[Platform Admin Guard] No valid session, redirecting to auth');
    return <Navigate to="/platform-admin/auth" replace />;
  }

  // Session is valid, render protected content
  console.log('[Platform Admin Guard] Valid session found, rendering admin dashboard');
  return <>{children}</>;
}
