import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  activeAudits: number;
  overdueTasks: number;
  criticalFindings: number;
  complianceScore: number;
  lastUpdated: Date;
}

export function useDashboardRealtime() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeAudits: 0,
    overdueTasks: 0,
    criticalFindings: 0,
    complianceScore: 0,
    lastUpdated: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      // Fetch active audits count
      const { count: auditsCount } = await supabase
        .from('audits')
        .select('*', { count: 'exact', head: true })
        .in('status', ['planning', 'in-progress', 'fieldwork']);

      // Fetch overdue tasks (mock for now - would need tasks table)
      const overdueTasks = 12; // Mock data

      // Fetch critical findings
      const { count: findingsCount } = await supabase
        .from('audit_findings')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .eq('status', 'open');

      // Calculate compliance score (mock for now)
      const complianceScore = 87.4; // Mock data

      setMetrics({
        activeAudits: auditsCount || 0,
        overdueTasks,
        criticalFindings: findingsCount || 0,
        complianceScore,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Set up realtime subscriptions
    const auditsChannel = supabase
      .channel('dashboard-audits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audits',
        },
        () => {
          console.log('Audits changed, refreshing metrics...');
          fetchMetrics();
        }
      )
      .subscribe();

    const findingsChannel = supabase
      .channel('dashboard-findings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_findings',
        },
        () => {
          console.log('Findings changed, refreshing metrics...');
          fetchMetrics();
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(auditsChannel);
      supabase.removeChannel(findingsChannel);
    };
  }, []);

  return { metrics, isLoading, refresh: fetchMetrics };
}
