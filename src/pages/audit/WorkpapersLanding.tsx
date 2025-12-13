import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Badge } from '@/components/ui/badge';

export default function WorkpapersLanding() {
  const navigate = useNavigate();

  // Fetch all audits for this organization
  const { data: audits, isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('[WorkpapersLanding] Error:', error);
        return [];
      }
      return data || [];
    }
  });

  // Fetch workpaper counts for each audit
  const { data: workpaperCounts } = useQuery({
    queryKey: ['workpaper-counts'],
    queryFn: async () => {
      if (!audits) return {};

      const counts: Record<string, number> = {};
      
      for (const audit of audits) {
        const { count, error } = await supabase
          .from('audit_workpapers')
          .select('*', { count: 'exact', head: true })
          .eq('audit_id', audit.id);

        if (!error && count !== null) {
          counts[audit.id] = count;
        }
      }

      return counts;
    },
    enabled: !!audits && audits.length > 0,
  });

  // If there's only one audit, redirect directly to its workpapers
  useEffect(() => {
    if (audits && audits.length === 1) {
      navigate(`/audits/${audits[0].id}/workpapers`);
    }
  }, [audits, navigate]);

  const getStatusBadge = (status: string) => {
    const configs = {
      planning: { label: 'Planning', className: 'bg-info/20 text-info border-info' },
      fieldwork: { label: 'Fieldwork', className: 'bg-warning/20 text-warning border-warning' },
      reporting: { label: 'Reporting', className: 'bg-primary/20 text-primary border-primary' },
      completed: { label: 'Completed', className: 'bg-success/20 text-success border-success' },
    };
    const config = configs[status as keyof typeof configs] || configs.planning;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Workpapers' },
          ]}
        />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Audit Workpapers
          </h1>
          <p className="text-muted-foreground">
            Select an audit to view and manage workpapers
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : !audits || audits.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Audits Yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Create an audit first to start documenting procedures and findings in workpapers
              </p>
              <Button onClick={() => navigate('/audit-overview')}>
                Go to Audit Overview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {audits.map((audit) => (
              <Card
                key={audit.id}
                className="border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/audits/${audit.id}/workpapers`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {audit.audit_title}
                    </CardTitle>
                    {getStatusBadge(audit.status)}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {audit.objective || 'No objective specified'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(audit.actual_start_date).toLocaleDateString()} - {new Date(audit.actual_end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span>
                        {workpaperCounts?.[audit.id] || 0} workpaper{(workpaperCounts?.[audit.id] || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full group/btn"
                    variant="outline"
                  >
                    View Workpapers
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
