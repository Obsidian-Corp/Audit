import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertTriangle, Clock, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardRealtime } from '@/hooks/useDashboardRealtime';
import { DrillDownDialog } from './DrillDownDialog';

export function DashboardKPIs() {
  const { metrics, isLoading } = useDashboardRealtime();
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<any>(null);

  const kpis = [
    {
      id: 'activeAudits',
      title: 'Active Audits',
      value: metrics.activeAudits.toString(),
      change: '+12%',
      icon: Activity,
      trend: 'up' as const,
    },
    {
      id: 'overdueTasks',
      title: 'Overdue Tasks',
      value: metrics.overdueTasks.toString(),
      change: '-24%',
      icon: Clock,
      trend: 'down' as const,
    },
    {
      id: 'criticalFindings',
      title: 'Critical Findings',
      value: metrics.criticalFindings.toString(),
      change: '+8%',
      icon: AlertTriangle,
      trend: 'up' as const,
    },
    {
      id: 'complianceScore',
      title: 'Compliance Score',
      value: `${metrics.complianceScore}%`,
      change: '+2%',
      icon: CheckCircle2,
      trend: 'up' as const,
    },
  ];

  const handleDrillDown = (kpi: typeof kpis[0]) => {
    setSelectedMetric(kpi);
    setDrillDownOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card/50 border-border">
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card 
              key={kpi.title} 
              className="bg-card/50 border-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => handleDrillDown(kpi)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      {kpi.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold tracking-tight">
                        {kpi.value}
                      </p>
                      <span
                        className={`text-sm font-medium ${
                          kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click for details
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedMetric && (
        <DrillDownDialog
          open={drillDownOpen}
          onOpenChange={setDrillDownOpen}
          title={selectedMetric.title}
          metric={selectedMetric.id}
          data={selectedMetric}
        />
      )}
    </>
  );
}
