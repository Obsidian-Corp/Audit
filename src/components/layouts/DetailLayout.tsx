import { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DetailLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  sidebar?: ReactNode;
  backUrl?: string;
}

/**
 * Detail Layout - Narrow content with optional context sidebar
 * Used for: Detail pages like Project Details, Task Details, etc.
 */
export function DetailLayout({ 
  children, 
  breadcrumbs,
  title,
  subtitle,
  actions,
  sidebar,
  backUrl
}: DetailLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* Back Button */}
        {backUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backUrl)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        {/* Header */}
        {(title || subtitle || actions) && (
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-2">
              {title && (
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-lg text-muted-foreground">
                  {subtitle}
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

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className={sidebar ? "lg:col-span-8" : "lg:col-span-12"}>
            {children}
          </div>

          {/* Sidebar */}
          {sidebar && (
            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                {sidebar}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
