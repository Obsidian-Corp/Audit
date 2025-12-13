import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreateAuditPlanDialog } from '@/components/audit/plans/CreateAuditPlanDialog';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function AuditPlans() {
  const { currentFirm } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['audit-plans', currentFirm?.id],
    queryFn: async () => {
      if (!currentFirm?.id) return [];
      const { data, error } = await supabase
        .from('audit_plans')
        .select(`
          *,
          audits:audits(count)
        `)
        .order('plan_year', { ascending: false });

      if (error) {
        console.error('[AuditPlans] Error:', error);
        return [];
      }
      return data || [];
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audit Plans' }
        ]} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Audit Plans
            </h1>
            <p className="text-muted-foreground">
              Annual and quarterly audit planning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {plans?.filter(p => p.status === 'in_progress').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {plans?.filter(p => p.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plans?.filter(p => p.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Plan Register</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Audits</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan: any) => (
                  <TableRow key={plan.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell className="font-medium">{plan.plan_name}</TableCell>
                    <TableCell>{plan.plan_year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.plan_period}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(plan.start_date), 'MMM d')} - {format(new Date(plan.end_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {plan.total_budget ? `$${Number(plan.total_budget).toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell>{plan.allocated_hours || '—'} hrs</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{plan.audits?.[0]?.count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(plan.status)} className="capitalize">
                        {plan.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No audit plans</p>
              <p className="text-sm">Create your first audit plan</p>
            </div>
          )}
        </CardContent>
      </Card>

        <CreateAuditPlanDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
