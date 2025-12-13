import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequireRoleProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

/**
 * RequireRole Guard
 *
 * Protects routes by verifying the user has one of the allowed roles.
 *
 * Usage:
 * <RequireRole allowedRoles={['partner', 'firm_administrator']}>
 *   <AnalyticsPage />
 * </RequireRole>
 *
 * Props:
 * - allowedRoles: Array of role names that can access this route
 * - fallbackPath: Where to redirect if unauthorized (default: /dashboard)
 * - showUnauthorized: Show unauthorized page instead of redirecting
 */
export function RequireRole({
  children,
  allowedRoles,
  fallbackPath = '/dashboard',
  showUnauthorized = false
}: RequireRoleProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      checkRole();
    }
  }, [user, authLoading]);

  const checkRole = async () => {
    if (!user) {
      setHasRole(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error checking user roles:', error);
        setHasRole(false);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      setUserRoles(roles);

      // Check if user has at least one of the allowed roles
      const hasPermission = roles.some(role => allowedRoles.includes(role));
      setHasRole(hasPermission);
    } catch (error) {
      console.error('Error in role check:', error);
      setHasRole(false);
    }
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
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Required Roles:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {allowedRoles.map(role => (
                  <li key={role} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {userRoles.length > 0 && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Your Roles:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {userRoles.map(role => (
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
              <Button onClick={() => window.location.href = fallbackPath} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Unauthorized - redirect
  if (!hasRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Authorized
  return <>{children}</>;
}
