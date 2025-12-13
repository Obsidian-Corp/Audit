import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FindingSummary {
  label: string;
  value: number | string;
  change: number;
  color: string;
}

export interface FindingData {
  id: string;
  title: string;
  entity: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'overdue' | 'resolved';
  age: number;
  owner: string;
  dueDate: string;
  trend: number[];
}

export interface FindingAgingData {
  range: string;
  count: number;
  fill: string;
}

export interface RepeatFinding {
  entity: string;
  count: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface ResolutionRateData {
  month: string;
  rate: number;
}

export interface SeverityDistribution {
  name: string;
  value: number;
  fill: string;
}

export function useFindingsAnalytics(engagementId?: string) {
  const { data: findings, isLoading: findingsLoading } = useQuery({
    queryKey: ['findings-analytics', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select(`
          id,
          finding_number,
          title,
          description,
          severity,
          status,
          due_date,
          created_at,
          resolved_at,
          assigned_to,
          engagement_id,
          engagements!inner(name),
          profiles:assigned_to(full_name)
        `);

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((finding: any) => ({
        id: finding.finding_number || finding.id,
        title: finding.title,
        entity: finding.engagements?.name || 'Unknown',
        severity: finding.severity,
        status: finding.status,
        age: Math.floor((new Date().getTime() - new Date(finding.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        owner: finding.profiles?.full_name || 'Unassigned',
        dueDate: finding.due_date ? new Date(finding.due_date).toISOString().split('T')[0] : 'N/A',
        trend: [0, 0, 0, 0, 0, 0, 0], // Placeholder for trend data
      })) as FindingData[];
    },
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['findings-summary', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select('id, status, created_at, resolved_at, due_date');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const openFindings = data?.filter(f => f.status === 'open' || f.status === 'in-progress').length || 0;
      const overdueFindings = data?.filter(f => f.due_date && new Date(f.due_date) < now && f.status !== 'resolved').length || 0;
      const resolvedRecent = data?.filter(f => f.resolved_at && new Date(f.resolved_at) > thirtyDaysAgo).length || 0;

      const resolvedWithDates = data?.filter(f => f.resolved_at && f.created_at) || [];
      const avgResolution = resolvedWithDates.length > 0
        ? Math.round(
            resolvedWithDates.reduce((sum, f) => {
              const days = Math.floor(
                (new Date(f.resolved_at!).getTime() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / resolvedWithDates.length
          )
        : 0;

      return [
        { label: 'Open Findings', value: openFindings, change: 0, color: 'warning' },
        { label: 'Overdue', value: overdueFindings, change: 0, color: 'destructive' },
        { label: 'Resolved (30d)', value: resolvedRecent, change: 0, color: 'success' },
        { label: 'Avg Resolution', value: `${avgResolution} days`, change: 0, color: 'info' },
      ] as FindingSummary[];
    },
  });

  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['findings-aging', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select('id, created_at, status');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query.neq('status', 'resolved');
      if (error) throw error;

      const now = new Date();
      const agingBuckets = {
        '0-7 days': 0,
        '8-14 days': 0,
        '15-30 days': 0,
        '31-60 days': 0,
        '60+ days': 0,
      };

      (data || []).forEach(finding => {
        const age = Math.floor((now.getTime() - new Date(finding.created_at).getTime()) / (1000 * 60 * 60 * 24));

        if (age <= 7) agingBuckets['0-7 days']++;
        else if (age <= 14) agingBuckets['8-14 days']++;
        else if (age <= 30) agingBuckets['15-30 days']++;
        else if (age <= 60) agingBuckets['31-60 days']++;
        else agingBuckets['60+ days']++;
      });

      return [
        { range: '0-7 days', count: agingBuckets['0-7 days'], fill: 'hsl(var(--success))' },
        { range: '8-14 days', count: agingBuckets['8-14 days'], fill: 'hsl(var(--info))' },
        { range: '15-30 days', count: agingBuckets['15-30 days'], fill: 'hsl(var(--warning))' },
        { range: '31-60 days', count: agingBuckets['31-60 days'], fill: 'hsl(var(--destructive))' },
        { range: '60+ days', count: agingBuckets['60+ days'], fill: 'hsl(0 84% 40%)' },
      ] as FindingAgingData[];
    },
  });

  const { data: severityDistribution, isLoading: severityLoading } = useQuery({
    queryKey: ['findings-severity', engagementId],
    queryFn: async () => {
      let query = supabase
        .from('audit_findings')
        .select('severity, status');

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query.neq('status', 'resolved');
      if (error) throw error;

      const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };

      (data || []).forEach(finding => {
        if (finding.severity in severityCounts) {
          severityCounts[finding.severity as keyof typeof severityCounts]++;
        }
      });

      return [
        { name: 'Critical', value: severityCounts.critical, fill: 'hsl(var(--destructive))' },
        { name: 'High', value: severityCounts.high, fill: 'hsl(var(--warning))' },
        { name: 'Medium', value: severityCounts.medium, fill: 'hsl(var(--info))' },
        { name: 'Low', value: severityCounts.low, fill: 'hsl(var(--success))' },
      ] as SeverityDistribution[];
    },
  });

  return {
    findings: findings || [],
    summary: summary || [],
    agingData: agingData || [],
    severityDistribution: severityDistribution || [],
    isLoading: findingsLoading || summaryLoading || agingLoading || severityLoading,
  };
}
