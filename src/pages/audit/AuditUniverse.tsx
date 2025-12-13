import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateEntityDialog } from '@/components/audit/universe/CreateEntityDialog';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function AuditUniverse() {
  const { currentFirm } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');

  const { data: entities, isLoading, refetch } = useQuery({
    queryKey: ['audit-entities', currentFirm?.id, entityTypeFilter],
    queryFn: async () => {
      if (!currentFirm?.id) return [];
      let query = supabase
        .from('audit_entities')
        .select('*')
        .order('entity_name');

      if (entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('[AuditUniverse] Error fetching entities:', error);
        return [];
      }
      return data || [];
    }
  });

  const filteredEntities = entities?.filter(entity =>
    entity.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.entity_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'destructive';
    if (score >= 50) return 'default';
    if (score >= 25) return 'secondary';
    return 'outline';
  };

  const entityTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'department', label: 'Department' },
    { value: 'process', label: 'Process' },
    { value: 'account', label: 'Account' },
    { value: 'system', label: 'System' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audit Universe' }
        ]} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Audit Universe
            </h1>
            <p className="text-muted-foreground">
              Manage auditable entities and risk profiles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entities?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {entities?.filter(e => Number(e.risk_score) >= 75).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due for Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {entities?.filter(e => e.next_audit_date && new Date(e.next_audit_date) <= new Date()).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {entities?.filter(e => e.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Auditable Entities</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {entityTypes.map(type => (
                  <Button
                    key={type.value}
                    variant={entityTypeFilter === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEntityTypeFilter(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entities..."
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
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredEntities && filteredEntities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Entity Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Audit Frequency</TableHead>
                  <TableHead>Last Audit</TableHead>
                  <TableHead>Next Audit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={entity.id} className="cursor-pointer hover:bg-accent/50">
                    <TableCell className="font-mono text-sm">{entity.entity_code}</TableCell>
                    <TableCell className="font-medium">{entity.entity_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {entity.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskColor(Number(entity.risk_score))}>
                          {Number(entity.risk_score).toFixed(0)}
                        </Badge>
                        {Number(entity.risk_score) >= 75 && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{entity.audit_frequency}</TableCell>
                    <TableCell>
                      {entity.last_audit_date ? format(new Date(entity.last_audit_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      {entity.next_audit_date ? (
                        <span className={new Date(entity.next_audit_date) <= new Date() ? 'text-red-600 font-semibold' : ''}>
                          {format(new Date(entity.next_audit_date), 'MMM d, yyyy')}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entity.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {entity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No entities found</p>
              <p className="text-sm">Start by adding your first auditable entity</p>
            </div>
          )}
        </CardContent>
      </Card>

        <CreateEntityDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
