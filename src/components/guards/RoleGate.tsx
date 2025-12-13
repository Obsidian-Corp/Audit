import { ReactNode } from 'react';
import { RequireRole } from './RequireRole';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleGateProps {
  roles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

// Convenience wrapper for RequireRole
export function RoleGate({ roles, children, fallback }: RoleGateProps) {
  return (
    <RequireRole roles={roles} fallback={fallback}>
      {children}
    </RequireRole>
  );
}
