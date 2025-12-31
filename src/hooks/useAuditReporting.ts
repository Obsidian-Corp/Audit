/**
 * useAuditReporting Hook
 * React hook for managing audit opinions and reports
 *
 * Implements requirements from:
 * - AU-C 700: Forming an Opinion and Reporting
 * - AU-C 705: Modifications to the Opinion
 * - AU-C 706: Emphasis-of-Matter and Other-Matter Paragraphs
 * - AU-C 701: Key Audit Matters
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  AuditOpinion,
  AuditReport,
  KeyAuditMatter,
  EmphasisOfMatter,
  OtherMatter,
  OpinionType,
  REPORT_ISSUANCE_CHECKLIST,
  generateOpinionParagraph,
} from '@/lib/audit-reporting';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// Audit Opinion Hook
// ============================================

export function useAuditOpinion(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch opinion
  const {
    data: opinion,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-opinion', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_opinions')
        .select(`
          *,
          key_audit_matters(*),
          emphasis_of_matter(*),
          other_matter(*)
        `)
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AuditOpinion | null;
    },
    enabled: !!engagementId,
  });

  // Create opinion
  const createMutation = useMutation({
    mutationFn: async (data: Partial<AuditOpinion>) => {
      const { data: newOpinion, error } = await supabase
        .from('audit_opinions')
        .insert({
          engagement_id: engagementId,
          opinion_type: data.opinionType || 'unmodified',
          opinion_scope: data.opinionScope || 'financial_statements',
          is_modified: data.opinionType !== 'unmodified',
          framework: data.framework || 'US GAAP',
          framework_type: data.frameworkType || 'general_purpose',
          going_concern_included: data.goingConcernIncluded || false,
          other_information_included: data.otherInformationIncluded || false,
          status: 'draft',
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return newOpinion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Audit opinion created');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create opinion');
    },
  });

  // Update opinion
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AuditOpinion>) => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { error } = await supabase
        .from('audit_opinions')
        .update({
          ...data,
          is_modified: data.opinionType !== 'unmodified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', opinion.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Opinion updated');
    },
  });

  // Add Key Audit Matter
  const addKAMMutation = useMutation({
    mutationFn: async (kam: Partial<KeyAuditMatter>) => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { data, error } = await supabase
        .from('key_audit_matters')
        .insert({
          ...kam,
          opinion_id: opinion.id,
          engagement_id: engagementId,
          is_included_in_report: true,
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Key audit matter added');
    },
  });

  // Add Emphasis-of-Matter
  const addEOMMutation = useMutation({
    mutationFn: async (eom: Partial<EmphasisOfMatter>) => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { data, error } = await supabase
        .from('emphasis_of_matter')
        .insert({
          ...eom,
          opinion_id: opinion.id,
          engagement_id: engagementId,
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Emphasis-of-matter paragraph added');
    },
  });

  // Add Other-Matter
  const addOMPMutation = useMutation({
    mutationFn: async (omp: Partial<OtherMatter>) => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { data, error } = await supabase
        .from('other_matter')
        .insert({
          ...omp,
          opinion_id: opinion.id,
          engagement_id: engagementId,
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Other-matter paragraph added');
    },
  });

  // Submit for review
  const submitForReviewMutation = useMutation({
    mutationFn: async () => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { error } = await supabase
        .from('audit_opinions')
        .update({
          status: 'review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', opinion.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Submitted for review');
    },
  });

  // Partner approval
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!opinion?.id) throw new Error('Opinion not found');

      const { error } = await supabase
        .from('audit_opinions')
        .update({
          status: 'approved',
          partner_approved_by: user?.id,
          partner_approved_at: new Date().toISOString(),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', opinion.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-opinion', engagementId] });
      toast.success('Opinion approved');
    },
  });

  // Generate opinion paragraph
  const getOpinionParagraph = useCallback(
    (entityName: string, periodEnd: Date) => {
      if (!opinion) return '';

      return generateOpinionParagraph(
        opinion.opinionType,
        entityName,
        opinion.framework,
        periodEnd,
        opinion.modificationDescription
      );
    },
    [opinion]
  );

  return {
    opinion,
    isLoading,
    error,
    createOpinion: createMutation.mutateAsync,
    updateOpinion: updateMutation.mutateAsync,
    addKeyAuditMatter: addKAMMutation.mutateAsync,
    addEmphasisOfMatter: addEOMMutation.mutateAsync,
    addOtherMatter: addOMPMutation.mutateAsync,
    submitForReview: submitForReviewMutation.mutateAsync,
    approveOpinion: approveMutation.mutateAsync,
    getOpinionParagraph,
    isCreating: createMutation.isPending,
    isSaving: updateMutation.isPending,
    refetch,
  };
}

// ============================================
// Audit Report Hook
// ============================================

export function useAuditReport(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch report
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['audit-report', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('report_version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as AuditReport | null;
    },
    enabled: !!engagementId,
  });

  // Create report
  const createMutation = useMutation({
    mutationFn: async ({
      opinionId,
      ...data
    }: Partial<AuditReport> & { opinionId: string }) => {
      const { data: newReport, error } = await supabase
        .from('audit_reports')
        .insert({
          engagement_id: engagementId,
          opinion_id: opinionId,
          report_number: data.reportNumber || `RPT-${Date.now()}`,
          report_title: data.reportTitle || 'Independent Auditor\'s Report',
          report_date: data.reportDate || new Date().toISOString(),
          format: data.format || 'standard',
          addressee: data.addressee || '',
          report_content: data.reportContent || '',
          report_version: 1,
          firm_name: data.firmName || '',
          firm_city: data.firmCity || '',
          engagement_partner: data.engagementPartner || '',
          issuance_status: 'draft',
          previous_versions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return newReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-report', engagementId] });
      toast.success('Audit report created');
    },
  });

  // Update report
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<AuditReport>) => {
      if (!report?.id) throw new Error('Report not found');

      // Save current version to history
      const previousVersions = [
        ...(report.previousVersions || []),
        {
          version: report.reportVersion,
          content: report.reportContent,
          changedAt: new Date().toISOString(),
          changedBy: user?.id,
          changeReason: 'Update',
        },
      ];

      const { error } = await supabase
        .from('audit_reports')
        .update({
          ...data,
          report_version: report.reportVersion + 1,
          previous_versions: previousVersions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-report', engagementId] });
      toast.success('Report updated');
    },
  });

  // Finalize report
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!report?.id) throw new Error('Report not found');

      const { error } = await supabase
        .from('audit_reports')
        .update({
          issuance_status: 'final',
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-report', engagementId] });
      toast.success('Report finalized');
    },
  });

  // Issue report
  const issueMutation = useMutation({
    mutationFn: async (issuedTo: string[]) => {
      if (!report?.id) throw new Error('Report not found');

      const { error } = await supabase
        .from('audit_reports')
        .update({
          issuance_status: 'issued',
          issued_at: new Date().toISOString(),
          issued_to: issuedTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', report.id);

      if (error) throw error;

      // Update audit status
      // NOTE: Using 'audits' table instead of 'engagements' which doesn't exist
      await supabase
        .from('audits')
        .update({
          status: 'issued',
          report_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', engagementId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-report', engagementId] });
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Report issued');
    },
  });

  return {
    report,
    isLoading,
    error,
    createReport: createMutation.mutateAsync,
    updateReport: updateMutation.mutateAsync,
    finalizeReport: finalizeMutation.mutateAsync,
    issueReport: issueMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isSaving: updateMutation.isPending,
    refetch,
  };
}

// ============================================
// Report Issuance Checklist Hook
// ============================================

export function useReportIssuanceChecklist(reportId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch checklist
  const {
    data: checklist,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['report-issuance-checklist', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_issuance_checklists')
        .select('*')
        .eq('report_id', reportId)
        .order('category', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!reportId,
  });

  // Initialize checklist
  const initializeMutation = useMutation({
    mutationFn: async () => {
      const items = REPORT_ISSUANCE_CHECKLIST.flatMap((category) =>
        category.items.map((item) => ({
          report_id: reportId,
          category: category.category,
          requirement: item.requirement,
          guidance: item.guidance,
          is_completed: false,
        }))
      );

      const { error } = await supabase.from('report_issuance_checklists').insert(items);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-issuance-checklist', reportId] });
      toast.success('Checklist initialized');
    },
  });

  // Update item
  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
      notes,
    }: {
      itemId: string;
      isCompleted: boolean;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('report_issuance_checklists')
        .update({
          is_completed: isCompleted,
          completed_by: isCompleted ? user?.id : null,
          completed_at: isCompleted ? new Date().toISOString() : null,
          notes,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-issuance-checklist', reportId] });
    },
  });

  // Calculate completion
  const completion = useMemo(() => {
    if (!checklist) return { total: 0, completed: 0, percentage: 0, isComplete: false };

    const total = checklist.length;
    const completed = checklist.filter((item) => item.is_completed).length;

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      isComplete: completed === total,
    };
  }, [checklist]);

  return {
    checklist,
    completion,
    isLoading,
    initializeChecklist: initializeMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    refetch,
  };
}

// ============================================
// Combined Reporting Hook
// ============================================

export function useAuditReporting(engagementId: string) {
  const opinion = useAuditOpinion(engagementId);
  const report = useAuditReport(engagementId);

  const isReadyToIssue = useMemo(() => {
    return (
      opinion.opinion?.status === 'approved' &&
      report.report?.issuanceStatus === 'final'
    );
  }, [opinion.opinion, report.report]);

  const reportingStatus = useMemo(() => {
    if (report.report?.issuanceStatus === 'issued') return 'issued';
    if (report.report?.issuanceStatus === 'final') return 'final';
    if (opinion.opinion?.status === 'approved') return 'opinion_approved';
    if (opinion.opinion?.status === 'review') return 'under_review';
    if (opinion.opinion) return 'draft';
    return 'not_started';
  }, [opinion.opinion, report.report]);

  return {
    opinion,
    report,
    isReadyToIssue,
    reportingStatus,
    isLoading: opinion.isLoading || report.isLoading,
  };
}
