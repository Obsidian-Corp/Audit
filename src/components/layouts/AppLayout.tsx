import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * App Layout - Standard layout with optional breadcrumbs, title, and actions
 * Used for: Most app pages with list views, forms, etc.
 * Issue #14: Auto-generates breadcrumbs from route if not provided
 */
export function AppLayout({
  children,
  breadcrumbs,
  title,
  description,
  actions
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Breadcrumbs - Auto-generated from route */}
        <Breadcrumbs />

        {/* Header */}
        {(title || description || actions) && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              {title && (
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
