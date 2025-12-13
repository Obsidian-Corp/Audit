import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateRiskAssessmentDialog } from '@/components/audit/risks/CreateRiskAssessmentDialog';
import { format } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function RiskAssessments() {
  const { currentFirm } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: assessments, isLoading, refetch } = useQuery({
    queryKey: ['risk-assessments', currentFirm?.id],
    queryFn: async () => {
      if (!currentFirm?.id) return [];
      const { data, error } = await supabase
        .from('risk_assessments')
        .select(`
          *,
          entity:audit_entities(entity_name, entity_code)
        `)
        .order('inherent_risk', { ascending: false });

      if (error) {
        console.error('[RiskAssessments] Error:', error);
        return [];
      }
      return data || [];
    }
  });

  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: 'Critical', variant: 'destructive' as const };
    if (score >= 50) return { label: 'High', variant: 'default' as const };
    if (score >= 25) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'outline' as const };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Risk Assessments' }
        ]} />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Risk Assessments
            </h1>
            <p className="text-muted-foreground">
              Evaluate and track entity risks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {assessments?.filter(a => Number(a.inherent_risk) >= 75).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {assessments?.filter(a => Number(a.inherent_risk) >= 50 && Number(a.inherent_risk) < 75).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {assessments?.filter(a => a.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Assessment Register</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : assessments && assessments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Likelihood</TableHead>
                  <TableHead className="text-center">Impact</TableHead>
                  <TableHead className="text-center">Inherent Risk</TableHead>
                  <TableHead className="text-center">Control</TableHead>
                  <TableHead className="text-center">Residual Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment: any) => {
                  const inherentRisk = getRiskLevel(Number(assessment.inherent_risk));
                  const residualRisk = assessment.residual_risk ? getRiskLevel(Number(assessment.residual_risk)) : null;
                  
                  return (
                    <TableRow key={assessment.id} className="cursor-pointer hover:bg-accent/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{assessment.entity?.entity_name}</div>
                          <div className="text-sm text-muted-foreground">{assessment.entity?.entity_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(assessment.assessment_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assessment.risk_category || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{assessment.likelihood_score}/5</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{assessment.impact_score}/5</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={inherentRisk.variant}>
                          {Number(assessment.inherent_risk).toFixed(0)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {assessment.control_effectiveness ? (
                          <Badge variant="outline">{assessment.control_effectiveness}/5</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {residualRisk ? (
                          <Badge variant={residualRisk.variant}>
                            {Number(assessment.residual_risk).toFixed(0)}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={assessment.status === 'approved' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {assessment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No risk assessments</p>
              <p className="text-sm">Create your first risk assessment</p>
            </div>
          )}
        </CardContent>
      </Card>

        <CreateRiskAssessmentDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
}
