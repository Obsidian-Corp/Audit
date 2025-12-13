import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, Clock, AlertCircle } from 'lucide-react';

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: program, isLoading } = useQuery({
    queryKey: ['program-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_program_templates')
        .select(`
          *,
          program_procedures(
            *,
            audit_procedures(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Program not found</p>
            <Button className="mt-4" onClick={() => navigate('/audit/programs')}>
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const procedures = program.program_procedures?.map((pp: any) => ({
    ...pp.audit_procedures,
    sequence_order: pp.sequence_order,
    is_required: pp.is_required,
    default_assigned_role: pp.default_assigned_role,
  })) || [];

  const totalHours = procedures.reduce((sum: number, p: any) => sum + (p.estimated_hours || 0), 0);

  const proceduresByCategory = procedures.reduce((acc: any, proc: any) => {
    const category = proc.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(proc);
    return acc;
  }, {});

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/audit/programs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{program.template_name}</h1>
            {program.is_standard && (
              <Badge variant="secondary">Standard</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{program.description}</p>
        </div>
        <Button>Use This Program</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Audit Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{program.audit_type}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{program.industry || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{procedures.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estimated Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalHours}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procedures" className="space-y-6">
        <TabsList>
          <TabsTrigger value="procedures">Procedures ({procedures.length})</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="procedures" className="space-y-6">
          {Object.entries(proceduresByCategory).map(([category, procs]: [string, any]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize">
                {category.replace('_', ' ')} ({procs.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {procs.map((proc: any) => (
                  <Card key={proc.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {proc.procedure_code}
                            </Badge>
                            <Badge variant={getRiskBadgeColor(proc.risk_level)}>
                              {proc.risk_level.toUpperCase()}
                            </Badge>
                            {proc.is_required && (
                              <Badge variant="secondary">Required</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base">{proc.procedure_name}</CardTitle>
                          <CardDescription className="mt-1">{proc.objective}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{proc.estimated_hours}h</span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Program Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{program.description}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">When to Use</h4>
                <p className="text-sm text-muted-foreground">
                  This program is designed for {program.audit_type} audits in the {program.industry || 'general'} industry.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
