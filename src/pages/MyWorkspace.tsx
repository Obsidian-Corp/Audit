/**
 * ==================================================================
 * MY WORKSPACE - UNIFIED DASHBOARD
 * ==================================================================
 * Consolidated workspace replacing 5 fragmented dashboards
 * Per System Design Document Section 9
 * ==================================================================
 */

import { QuickStatsBar } from '@/components/workspace/QuickStatsBar';
import { MyEngagementsWidget } from '@/components/workspace/MyEngagementsWidget';
import { MyTasksWidget } from '@/components/workspace/MyTasksWidget';
import { FirmOverviewWidget } from '@/components/workspace/FirmOverviewWidget';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Settings, Layout } from 'lucide-react';

interface WorkspaceWidget {
  id: string;
  component: React.ComponentType;
  roles: string[]; // 'all' or specific roles like 'partner', 'manager', 'admin'
  order: number;
}

const WORKSPACE_WIDGETS: WorkspaceWidget[] = [
  {
    id: 'quick-stats',
    component: QuickStatsBar,
    roles: ['all'],
    order: 1,
  },
  {
    id: 'my-engagements',
    component: MyEngagementsWidget,
    roles: ['all'],
    order: 2,
  },
  {
    id: 'my-tasks',
    component: MyTasksWidget,
    roles: ['all'],
    order: 3,
  },
  {
    id: 'firm-overview',
    component: FirmOverviewWidget,
    roles: ['partner', 'engagement_manager', 'firm_administrator', 'practice_leader'],
    order: 4,
  },
];

export default function MyWorkspace() {
  const { user, profile, roles, hasRole } = useAuth();

  const visibleWidgets = WORKSPACE_WIDGETS.filter((widget) => {
    // Show all widgets if roles include 'all'
    if (widget.roles.includes('all')) {
      return true;
    }
    // Otherwise check if user has any of the required roles
    return widget.roles.some((r) => hasRole(r as any));
  }).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Workspace</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile?.full_name || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Layout className="mr-2 h-4 w-4" />
              Customize Layout
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Workspace Settings
            </Button>
          </div>
        </div>

        {/* Widgets */}
        <div className="space-y-6">
          {visibleWidgets.map((widget) => {
            const Component = widget.component;
            return <Component key={widget.id} />;
          })}
        </div>

        {/* Empty State */}
        {visibleWidgets.length === 0 && (
          <div className="text-center py-12">
            <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No widgets available for your role</p>
          </div>
        )}
      </div>
    </div>
  );
}
