/**
 * ==================================================================
 * BREADCRUMBS COMPONENT
 * ==================================================================
 * Dynamic breadcrumb navigation based on current route
 * Issue #14: Breadcrumb Navigation
 * ==================================================================
 */

import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

/**
 * Convert path segment to human-readable label
 */
function humanize(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Always include home
  breadcrumbs.push({
    label: 'Home',
    path: '/',
    isCurrentPage: pathname === '/',
  });

  // Build cumulative paths
  let currentPath = '';
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === paths.length - 1;

    // Check if segment is a UUID (skip in breadcrumb)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    if (!isUUID) {
      breadcrumbs.push({
        label: humanize(segment),
        path: currentPath,
        isCurrentPage: isLast,
      });
    }
  });

  return breadcrumbs;
}

/**
 * Breadcrumbs Component
 */
export function Breadcrumbs() {
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  // Don't show breadcrumbs on home page
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={crumb.path}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
          {crumb.isCurrentPage ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.path}
              className={cn(
                'hover:text-foreground transition-colors inline-flex items-center gap-1',
                index === 0 && 'flex items-center gap-1'
              )}
            >
              {index === 0 && <Home className="h-4 w-4" />}
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
