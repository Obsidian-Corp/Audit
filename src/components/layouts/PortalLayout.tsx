import { ReactNode } from 'react';

interface PortalLayoutProps {
  children: ReactNode;
}

/**
 * Portal Layout - 12-column asymmetric grid for dashboard-style pages
 * Used for: Portal, Dashboard, Analytics pages
 */
export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
