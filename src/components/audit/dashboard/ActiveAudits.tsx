import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Calendar, Users, MoreVertical, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function ActiveAudits() {
  const { currentOrg } = useOrganization();
  const navigate = useNavigate();

  const { data: audits, isLoading } = useQuery({
    queryKey: ['active-audits', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return [];

      const { data } = await supabase
        .from('audits')
        .select('*')
        .eq('firm_id', currentOrg.id)
        .in('status', ['in_preparation', 'fieldwork', 'reporting'])
        .order('planned_start_date', { ascending: true })
        .limit(10);

      return data || [];
    },
    enabled: !!currentOrg
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_preparation': return 'secondary';
      case 'fieldwork': return 'default';
      case 'reporting': return 'outline';
      default: return 'secondary';
    }
  };

  const getProgressPercentage = (audit: any) => {
    // Simplified progress calculation based on status
    switch (audit.status) {
      case 'in_preparation': return 25;
      case 'fieldwork': return 60;
      case 'reporting': return 85;
      default: return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Active Audits
          {audits && <Badge variant="secondary">{audits.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : audits && audits.length > 0 ? (
          <div className="space-y-4">
            {audits.map((audit) => (
              <div
                key={audit.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{audit.audit_title}</h4>
                      <Badge variant={getStatusColor(audit.status)} className="capitalize">
                        {audit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{audit.audit_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {audit.audit_type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/audits/${audit.id}/workpapers`)}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          View Workpapers
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{getProgressPercentage(audit)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(audit)} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {audit.planned_start_date && format(new Date(audit.planned_start_date), 'MMM d')}
                      {' - '}
                      {audit.planned_end_date && format(new Date(audit.planned_end_date), 'MMM d, yyyy')}
                    </div>
                    {audit.hours_spent > 0 && (
                      <div>
                        {audit.hours_spent}/{audit.hours_allocated || '—'} hrs
                      </div>
                    )}
                  </div>
                  {audit.priority && (
                    <Badge variant="outline" className="capitalize">
                      {audit.priority} priority
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active audits</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
