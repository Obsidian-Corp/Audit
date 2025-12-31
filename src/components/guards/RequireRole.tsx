/**
 * RequireRole Guard
 * Ticket: NAV-004
 *
 * Protects routes by verifying the user has one of the allowed roles.
 * Can use explicit allowedRoles prop or auto-detect from route configuration.
 *
 * @see src/config/routeGuards.ts for route configuration
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { findRouteGuard } from '@/config/routeGuards';

interface RequireRoleProps {
  children: ReactNode;
  /** Explicit roles allowed (overrides route config) */
  allowedRoles?: string[];
  /** Where to redirect if unauthorized (default: /workspace) */
  fallbackPath?: string;
  /** Show unauthorized page instead of redirecting */
  showUnauthorized?: boolean;
  /** Use route configuration to determine roles (default: true) */
  useRouteConfig?: boolean;
}

/**
 * RequireRole Guard
 *
 * Usage with explicit roles:
 * <RequireRole allowedRoles={['partner', 'firm_administrator']}>
 *   <AdminPage />
 * </RequireRole>
 *
 * Usage with auto-detection (uses routeGuards config):
 * <RequireRole>
 *   <ProtectedPage />
 * </RequireRole>
 */
export function RequireRole({
  children,
  allowedRoles,
  fallbackPath,
  showUnauthorized = false,
  useRouteConfig = true,
}: RequireRoleProps) {
  const { user, roles: authRoles, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  // Determine effective allowed roles
  const getEffectiveRoles = (): string[] => {
    // Explicit roles take precedence
    if (allowedRoles && allowedRoles.length > 0) {
      return allowedRoles;
    }

    // Use route config if enabled
    if (useRouteConfig) {
      const guard = findRouteGuard(location.pathname);
      if (guard) {
        return guard.allowedRoles;
      }
    }

    // No roles required = open route
    return [];
  };

  // Determine effective fallback path
  const getEffectiveFallback = (): string => {
    if (fallbackPath) return fallbackPath;

    if (useRouteConfig) {
      const guard = findRouteGuard(location.pathname);
      if (guard?.fallbackPath) return guard.fallbackPath;
    }

    return '/workspace';
  };

  const effectiveRoles = getEffectiveRoles();
  const effectiveFallback = getEffectiveFallback();

  useEffect(() => {
    if (!authLoading) {
      checkRole();
    }
  }, [authLoading, authRoles, effectiveRoles]);

  const checkRole = () => {
    // No roles required = open route
    if (effectiveRoles.length === 0) {
      setHasRole(true);
      return;
    }

    if (!user) {
      setHasRole(false);
      return;
    }

    // Use roles from AuthContext (already fetched)
    const hasPermission = authRoles.some(role => effectiveRoles.includes(role));
    setHasRole(hasPermission);
  };

  // Loading state
  if (authLoading || hasRole === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Unauthorized - show page
  if (!hasRole && showUnauthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveRoles.length > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Required Roles:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {effectiveRoles.map(role => (
                    <li key={role} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {authRoles.length > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Your Roles:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {authRoles.map(role => (
                    <li key={role} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                      {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
                Go Back
              </Button>
              <Button onClick={() => window.location.href = effectiveFallback} className="flex-1">
                Go to Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthorized - redirect
  if (!hasRole) {
    return <Navigate to={effectiveFallback} replace />;
  }

  // Authorized
  return <>{children}</>;
}
