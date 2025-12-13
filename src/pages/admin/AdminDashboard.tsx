import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '@/hooks/useUsers';
import { useClients } from '@/hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Briefcase,
  FileText,
  Settings,
  TrendingUp,
  Shield,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: users } = useUsers();
  const { data: clients } = useClients();

  // Fetch engagements
  const { data: engagements } = useQuery({
    queryKey: ['engagements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalUsers = users?.length || 0;
  const adminCount = users?.filter(u => u.user_roles?.some(r => r.role === 'firm_administrator')).length || 0;
  const managerCount = users?.filter(u => u.user_roles?.some(r => r.role === 'engagement_manager')).length || 0;
  const auditorCount = users?.filter(u => u.user_roles?.some(r =>
    r.role === 'senior_auditor' || r.role === 'staff_auditor'
  )).length || 0;

  const totalClients = clients?.length || 0;
  const activeEngagements = engagements?.filter(e => e.status === 'in_progress').length || 0;
  const totalEngagements = engagements?.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your firm's operations and administration
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {auditorCount} auditors, {managerCount} managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Client relationships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Engagements</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEngagements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEngagements} total engagements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Firm administrators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and roles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Invite users, assign roles, and manage permissions for your team members.
            </p>
            <Button variant="outline" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        {/* Firm Settings */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Firm Settings</CardTitle>
                <CardDescription>Configure your firm</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update firm details, preferences, and system configurations.
            </p>
            <Button variant="outline" className="w-full">
              View Settings
            </Button>
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/analytics/firm')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Firm Analytics</CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View detailed analytics on firm performance, revenue, and utilization.
            </p>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Resource Management */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/resources/utilization')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Team capacity & workload</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor team utilization, capacity planning, and workload distribution.
            </p>
            <Button variant="outline" className="w-full">
              View Utilization
            </Button>
          </CardContent>
        </Card>

        {/* Billing & Revenue */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/analytics/revenue')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Financial overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track revenue, billing, and financial performance across engagements.
            </p>
            <Button variant="outline" className="w-full">
              View Revenue
            </Button>
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Activity className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>System activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View audit trails and system activity logs (coming soon).
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" onClick={() => navigate('/admin/users')}>
              <Users className="h-4 w-4 mr-2" />
              Invite User
            </Button>
            <Button variant="outline" onClick={() => navigate('/crm/clients')}>
              <Briefcase className="h-4 w-4 mr-2" />
              Add Client
            </Button>
            <Button variant="outline" onClick={() => navigate('/engagements')}>
              <FileText className="h-4 w-4 mr-2" />
              Create Engagement
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Firm Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          All systems operational. Last updated: {new Date().toLocaleString()}
        </AlertDescription>
      </Alert>
    </div>
  );
}
