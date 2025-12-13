import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Report {
  id: string;
  firm_id: string;
  engagement_id: string;
  report_number: string;
  report_title: string;
  report_type: 'executive_summary' | 'management_letter' | 'soc_report' | 'audit_report' | 'custom';
  status: 'draft' | 'in_review' | 'approved' | 'delivered';
  content: any; // JSON content for the report builder
  cover_letter?: string;
  executive_summary?: string;
  scope_description?: string;
  methodology?: string;
  conclusions?: string;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  review_date?: string;
  approval_date?: string;
  distribution_date?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  engagement_id?: string;
  status?: string;
  report_type?: string;
}

export const useReports = (filters?: ReportFilters) => {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_reports')
        .select(`
          *,
          engagement:audits!audit_reports_engagement_id_fkey(id, audit_title, audit_number, clients(client_name)),
          creator:profiles!audit_reports_created_by_fkey(id, full_name),
          reviewer:profiles!audit_reports_reviewed_by_fkey(id, full_name),
          approver:profiles!audit_reports_approved_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.engagement_id) {
        query = query.eq('engagement_id', filters.engagement_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.report_type) {
        query = query.eq('report_type', filters.report_type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Report[];
    },
  });
};

export const useReportDetails = (reportId: string) => {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select(`
          *,
          engagement:audits!audit_reports_engagement_id_fkey(*),
          creator:profiles!audit_reports_created_by_fkey(*),
          reviewer:profiles!audit_reports_reviewed_by_fkey(*),
          approver:profiles!audit_reports_approved_by_fkey(*),
          findings:report_findings(*, finding:audit_findings(*))
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newReport: Partial<Report>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate report number
      const { data: lastReport } = await supabase
        .from('audit_reports')
        .select('report_number')
        .eq('engagement_id', newReport.engagement_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastReport ? parseInt(lastReport.report_number.split('-')[1]) : 0;
      const reportNumber = `RPT-${String(lastNumber + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('audit_reports')
        .insert([{
          ...newReport,
          report_number: reportNumber,
          created_by: user.id,
          status: newReport.status || 'draft',
          version: 1,
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report created',
        description: 'The report has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create report.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Report> }) => {
      const { data, error } = await supabase
        .from('audit_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report', variables.id] });
      toast({
        title: 'Report updated',
        description: 'The report has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report.',
        variant: 'destructive',
      });
    },
  });
};

export const useSubmitForReview = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ reportId, reviewerId }: { reportId: string; reviewerId: string }) => {
      const { data, error } = await supabase
        .from('audit_reports')
        .update({
          status: 'in_review',
          reviewed_by: reviewerId,
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Submitted for review',
        description: 'The report has been submitted for review.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit report.',
        variant: 'destructive',
      });
    },
  });
};

export const useApproveReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('audit_reports')
        .update({
          status: 'approved',
          approved_by: user.id,
          approval_date: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report approved',
        description: 'The report has been approved for delivery.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve report.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeliverReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase
        .from('audit_reports')
        .update({
          status: 'delivered',
          distribution_date: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Upload to client portal, send notification

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report delivered',
        description: 'The report has been delivered to the client.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deliver report.',
        variant: 'destructive',
      });
    },
  });
};

export const useGenerateReportFromFindings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagementId,
      reportType,
      reportTitle,
      includeFindingStatuses = ['finalized'],
    }: {
      engagementId: string;
      reportType: string;
      reportTitle: string;
      includeFindingStatuses?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get finalized findings for the engagement
      const { data: findings, error: findingsError } = await supabase
        .from('audit_findings')
        .select('*')
        .eq('engagement_id', engagementId)
        .in('status', includeFindingStatuses)
        .order('risk_rating', { ascending: false });

      if (findingsError) throw findingsError;

      // Generate report number
      const { data: lastReport } = await supabase
        .from('audit_reports')
        .select('report_number')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastReport ? parseInt(lastReport.report_number.split('-')[1]) : 0;
      const reportNumber = `RPT-${String(lastNumber + 1).padStart(3, '0')}`;

      // Create report
      const { data: report, error: reportError } = await supabase
        .from('audit_reports')
        .insert([{
          engagement_id: engagementId,
          report_number: reportNumber,
          report_title: reportTitle,
          report_type: reportType,
          created_by: user.id,
          status: 'draft',
          version: 1,
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Link findings to report
      if (findings && findings.length > 0) {
        const reportFindings = findings.map((finding, index) => ({
          report_id: report.id,
          finding_id: finding.id,
          sequence_order: index + 1,
        }));

        const { error: linkError } = await supabase
          .from('report_findings')
          .insert(reportFindings);

        if (linkError) throw linkError;
      }

      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report generated',
        description: 'Report has been created from finalized findings.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report.',
        variant: 'destructive',
      });
    },
  });
};
