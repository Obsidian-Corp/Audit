import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreateAuditDialog } from '@/components/audit/audits/CreateAuditDialog';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function ActiveAuditsList() {
  const { currentFirm } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: audits, isLoading, refetch } = useQuery({
    queryKey: ['audits-list', currentFirm?.id, statusFilter],
    queryFn: async () => {
      if (!currentFirm?.id) return [];
      let query = supabase
        .from('audits')
        .select(`
          *,
          entity:audit_entities(entity_name, entity_code),
          plan:audit_plans(plan_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[ActiveAuditsList] Error:', error);
        return [];
      }
      return data || [];
    }
  });

  const filteredAudits = audits?.filter(audit =>
    audit.audit_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audit.audit_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'outline';
      case 'in_preparation': return 'secondary';
      case 'fieldwork': return 'default';
      case 'reporting': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const getProgressPercentage = (audit: any) => {
    switch (audit.status) {
      case 'planned': return 10;
      case 'in_preparation': return 25;
      case 'fieldwork': return 60;
      case 'reporting': return 85;
      case 'closed': return 100;
      default: return 0;
    }
  };

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'planned', label: 'Planned' },
    { value: 'in_preparation', label: 'Preparation' },
    { value: 'fieldwork', label: 'Fieldwork' },
    { value: 'reporting', label: 'Reporting' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Active Audits' }
        ]} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Audits
            </h1>
            <p className="text-muted-foreground">
              Manage audit engagements and fieldwork
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Audit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {statuses.slice(1).map(status => (
          <Card key={status.value}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">
                {status.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {audits?.filter(a => a.status === status.value).length || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Register</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {statuses.map(status => (
                  <Button
                    key={status.value}
                    variant={statusFilter === status.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredAudits && filteredAudits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit Number</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map((audit: any) => (
                  <TableRow key={audit.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell className="font-mono text-sm">{audit.audit_number}</TableCell>
                    <TableCell className="font-medium">{audit.audit_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {audit.audit_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {audit.entity ? (
                        <div className="text-sm">
                          <div className="font-medium">{audit.entity.entity_name}</div>
                          <div className="text-muted-foreground">{audit.entity.entity_code}</div>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {audit.planned_start_date && format(new Date(audit.planned_start_date), 'MMM d')}
                      {audit.planned_end_date && ` - ${format(new Date(audit.planned_end_date), 'MMM d, yy')}`}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{getProgressPercentage(audit)}%</span>
                        </div>
                        <Progress value={getProgressPercentage(audit)} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(audit.status)} className="capitalize">
                        {audit.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={audit.priority === 'high' || audit.priority === 'critical' ? 'destructive' : 'outline'} className="capitalize">
                        {audit.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No audits found</p>
              <p className="text-sm">Create your first audit engagement</p>
            </div>
          )}
        </CardContent>
      </Card>

        <CreateAuditDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
