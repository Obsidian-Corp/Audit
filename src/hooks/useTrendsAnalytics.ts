import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditCycleData {
  month: string;
  planned: number;
  actual: number;
  target: number;
}

export interface FindingsBySeverity {
  month: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface BudgetVarianceData {
  month: string;
  planned: number;
  actual: number;
}

export interface AuditStatusDistribution {
  month: string;
  planning: number;
  inProgress: number;
  review: number;
  completed: number;
}

export function useTrendsAnalytics(engagementId?: string) {
  const { data: auditCycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['audit-cycle-trends', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagements')
        .select(`
          id,
          name,
          start_date,
          target_completion_date,
          actual_completion_date,
          status,
          created_at
        `);

      if (engagementId) {
        query = query.eq('id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month and calculate averages
      const monthlyData = new Map<string, { planned: number[], actual: number[], count: number }>();
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.set(monthKey, { planned: [], actual: [], count: 0 });
      }

      (data || []).forEach((engagement: any) => {
        if (!engagement.start_date || !engagement.target_completion_date) return;

        const completedDate = new Date(engagement.actual_completion_date || engagement.target_completion_date);
        const monthKey = completedDate.toLocaleDateString('en-US', { month: 'short' });

        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey)!;

          const plannedDays = Math.ceil(
            (new Date(engagement.target_completion_date).getTime() - new Date(engagement.start_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          const actualDays = engagement.actual_completion_date
            ? Math.ceil(
                (new Date(engagement.actual_completion_date).getTime() - new Date(engagement.start_date).getTime()) / (1000 * 60 * 60 * 24)
              )
            : plannedDays;

          monthData.planned.push(plannedDays);
          monthData.actual.push(actualDays);
          monthData.count++;
        }
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        planned: data.count > 0 ? Math.round(data.planned.reduce((a, b) => a + b, 0) / data.count) : 45,
        actual: data.count > 0 ? Math.round(data.actual.reduce((a, b) => a + b, 0) / data.count) : 42,
        target: 40,
      })) as AuditCycleData[];
    },
  });

  const { data: findingsTrends, isLoading: findingsLoading } = useQuery({
    queryKey: ['findings-trends', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select('id, severity, created_at');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { critical: number; high: number; medium: number; low: number }>();
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.set(monthKey, { critical: 0, high: 0, medium: 0, low: 0 });
      }

      (data || []).forEach((finding: any) => {
        const date = new Date(finding.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey)!;
          const severity = finding.severity.toLowerCase();
          if (severity in monthData) {
            monthData[severity as keyof typeof monthData]++;
          }
        }
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        ...data,
      })) as FindingsBySeverity[];
    },
  });

  const { data: budgetTrends, isLoading: budgetLoading } = useQuery({
    queryKey: ['budget-trends', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagements')
        .select('id, budget_hours, actual_hours, created_at, target_completion_date');

      if (engagementId) {
        query = query.eq('id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { planned: number[]; actual: number[] }>();
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.set(monthKey, { planned: [], actual: [] });
      }

      (data || []).forEach((engagement: any) => {
        if (!engagement.target_completion_date) return;

        const date = new Date(engagement.target_completion_date);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey)!;
          monthData.planned.push(engagement.budget_hours * 150 || 125000); // Assuming $150/hour
          monthData.actual.push((engagement.actual_hours || engagement.budget_hours) * 150 || 120000);
        }
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        planned: data.planned.length > 0 ? Math.round(data.planned.reduce((a, b) => a + b, 0) / data.planned.length) : 125000,
        actual: data.actual.length > 0 ? Math.round(data.actual.reduce((a, b) => a + b, 0) / data.actual.length) : 120000,
      })) as BudgetVarianceData[];
    },
  });

  const { data: statusDistribution, isLoading: statusLoading } = useQuery({
    queryKey: ['status-distribution', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('engagements')
        .select('id, status, created_at');

      if (engagementId) {
        query = query.eq('id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by month
      const monthlyData = new Map<string, { planning: number; inProgress: number; review: number; completed: number }>();
      const now = new Date();

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData.set(monthKey, { planning: 0, inProgress: 0, review: 0, completed: 0 });
      }

      (data || []).forEach((engagement: any) => {
        const date = new Date(engagement.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey)!;
          const status = engagement.status.toLowerCase();

          if (status === 'planning') monthData.planning++;
          else if (status === 'in_progress' || status === 'in-progress') monthData.inProgress++;
          else if (status === 'review' || status === 'in_review') monthData.review++;
          else if (status === 'completed' || status === 'complete') monthData.completed++;
        }
      });

      return Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        ...data,
      })) as AuditStatusDistribution[];
    },
  });

  return {
    auditCycleData: auditCycleData || [],
    findingsTrends: findingsTrends || [],
    budgetTrends: budgetTrends || [],
    statusDistribution: statusDistribution || [],
    isLoading: cycleLoading || findingsLoading || budgetLoading || statusLoading,
  };
}
