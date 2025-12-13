import { usePermission } from "@/hooks/usePermission";
import { ReactNode } from "react";

interface PermissionGateProps {
  permission: string;
  resourceType?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, resourceType, children, fallback = null }: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermission(permission, resourceType);

  if (isLoading) {
    return null;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
