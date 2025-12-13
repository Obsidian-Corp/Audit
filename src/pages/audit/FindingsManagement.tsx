import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateFindingDialog } from '@/components/audit/findings/CreateFindingDialog';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function FindingsManagement() {
  const { currentFirm } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: findings, isLoading, refetch } = useQuery({
    queryKey: ['audit-findings', currentFirm?.id, statusFilter],
    queryFn: async () => {
      if (!currentFirm?.id) return [];
      let query = supabase
        .from('audit_findings')
        .select(`
          *,
          audit:audits(audit_number, audit_title)
        `)
        .order('identified_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[FindingsManagement] Error:', error);
        return [];
      }
      return data || [];
    }
  });

  const filteredFindings = findings?.filter(finding =>
    finding.finding_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.finding_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Findings' }
        ]} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Findings & Issues
            </h1>
            <p className="text-muted-foreground">
              Track audit findings and remediation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Finding
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{findings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {findings?.filter(f => f.status === 'open').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {findings?.filter(f => f.status === 'in_progress').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {findings?.filter(f => f.severity === 'critical').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {findings?.filter(f => 
                f.target_completion_date && 
                new Date(f.target_completion_date) < new Date() && 
                f.status !== 'closed'
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Findings Register</CardTitle>
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
                  placeholder="Search findings..."
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
          ) : filteredFindings && filteredFindings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Audit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Identified</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFindings.map((finding: any) => {
                  const isOverdue = finding.target_completion_date && 
                    new Date(finding.target_completion_date) < new Date() && 
                    finding.status !== 'closed';

                  return (
                    <TableRow key={finding.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-mono text-sm">{finding.finding_number}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {finding.finding_title}
                      </TableCell>
                      <TableCell>
                        {finding.audit ? (
                          <div className="text-sm">
                            <div className="font-medium">{finding.audit.audit_number}</div>
                            <div className="text-muted-foreground truncate max-w-xs">
                              {finding.audit.audit_title}
                            </div>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {finding.finding_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(finding.severity)} className="capitalize">
                          {finding.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {finding.identified_date && format(new Date(finding.identified_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {finding.target_completion_date ? (
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {format(new Date(finding.target_completion_date), 'MMM d, yyyy')}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(finding.status)} className="capitalize">
                          {finding.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No findings</p>
              <p className="text-sm">Log your first audit finding</p>
            </div>
          )}
        </CardContent>
      </Card>

        <CreateFindingDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
