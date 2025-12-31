import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, AlertCircle, Info, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateFindingDialog } from '@/components/audit/findings/CreateFindingDialog';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface EngagementFindingsTabProps {
  engagementId: string;
}

interface Finding {
  id: string;
  finding_number: string;
  finding_title: string;
  finding_type: string;
  severity: string;
  status: string;
  condition_description: string;
  target_completion_date: string | null;
  identified_date: string;
  created_at: string;
}

export function EngagementFindingsTab({ engagementId }: EngagementFindingsTabProps) {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch findings for this engagement
  const { data: findings, isLoading, refetch } = useQuery({
    queryKey: ['engagement-findings', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('audit_id', engagementId)
        .order('identified_date', { ascending: false });

      if (error) {
        console.error('[EngagementFindingsTab] Error fetching findings:', error);
        return [];
      }
      return data as Finding[];
    },
    enabled: !!engagementId,
  });

  // Calculate counts by severity
  const criticalCount = findings?.filter(f => f.severity === 'critical').length || 0;
  const highCount = findings?.filter(f => f.severity === 'high').length || 0;
  const mediumCount = findings?.filter(f => f.severity === 'medium').length || 0;
  const lowCount = findings?.filter(f => f.severity === 'low').length || 0;

  // Filter findings by search term
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
      case 'in_progress': case 'in_remediation': return 'default';
      case 'pending_response': return 'secondary';
      case 'resolved': case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Findings & Observations</h3>
          <p className="text-sm text-muted-foreground">
            {findings?.length || 0} findings documented for this engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/audit/findings')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            All Findings
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Finding
          </Button>
        </div>
      </div>

      {/* Findings by Severity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{criticalCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{highCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{mediumCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{lowCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Findings</CardTitle>
              <CardDescription>
                Documented findings and management responses
              </CardDescription>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredFindings && filteredFindings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Finding #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFindings.map((finding) => {
                  const isOverdue = finding.target_completion_date &&
                    new Date(finding.target_completion_date) < new Date() &&
                    !['resolved', 'closed'].includes(finding.status);

                  return (
                    <TableRow key={finding.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell className="font-mono text-sm">{finding.finding_number}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {finding.finding_title}
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
                        <Badge variant={getStatusColor(finding.status)}>
                          {formatStatus(finding.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {finding.target_completion_date ? (
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {format(new Date(finding.target_completion_date), 'MMM d, yyyy')}
                          </span>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No findings for this engagement</p>
              <p className="text-sm mb-4">Document audit exceptions as you identify them</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log First Finding
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateFindingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
        procedureContext={{ auditId: engagementId }}
      />
    </div>
  );
}
