/**
 * Materiality Hooks
 * React Query hooks for materiality calculation and approval workflow
 *
 * Features:
 * - Materiality calculation CRUD
 * - Benchmark selection and validation
 * - Qualitative factor assessment
 * - Multi-level approval workflow
 * - Version history
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  MaterialityCalculation,
  MaterialityBenchmark,
  MaterialityStatus,
  MaterialityAllocation,
  QualitativeFactorAssessment,
  calculateOverallMateriality,
  calculatePerformanceMateriality,
  calculateClearlyTrivialThreshold,
  applyQualitativeAdjustments,
  validateMaterialityCalculation,
} from '@/lib/materiality';

// ============================================
// Query Keys
// ============================================

export const materialityKeys = {
  all: ['materiality'] as const,
  lists: () => [...materialityKeys.all, 'list'] as const,
  list: (engagementId: string) => [...materialityKeys.lists(), engagementId] as const,
  details: () => [...materialityKeys.all, 'detail'] as const,
  detail: (id: string) => [...materialityKeys.details(), id] as const,
  current: (engagementId: string) => [...materialityKeys.all, 'current', engagementId] as const,
  allocations: (materialityId: string) => [...materialityKeys.all, 'allocations', materialityId] as const,
  history: (engagementId: string) => [...materialityKeys.all, 'history', engagementId] as const,
};

// ============================================
// Queries
// ============================================

/**
 * Get all materiality calculations for an engagement (all versions)
 */
export function useMaterialityHistory(engagementId: string) {
  return useQuery({
    queryKey: materialityKeys.history(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data as MaterialityCalculation[];
    },
    enabled: !!engagementId,
  });
}

/**
 * Get current (active) materiality calculation for an engagement
 */
export function useCurrentMateriality(engagementId: string) {
  return useQuery({
    queryKey: materialityKeys.current(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_current_version', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as MaterialityCalculation | null;
    },
    enabled: !!engagementId,
  });
}

/**
 * Get materiality calculation by ID
 */
export function useMaterialityCalculation(materialityId: string) {
  return useQuery({
    queryKey: materialityKeys.detail(materialityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('id', materialityId)
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    enabled: !!materialityId,
  });
}

/**
 * Get materiality allocations
 */
export function useMaterialityAllocations(materialityId: string) {
  return useQuery({
    queryKey: materialityKeys.allocations(materialityId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_allocations')
        .select('*')
        .eq('materiality_calculation_id', materialityId)
        .order('account_area');

      if (error) throw error;
      return data as MaterialityAllocation[];
    },
    enabled: !!materialityId,
  });
}

// ============================================
// Mutations
// ============================================

/**
 * Create new materiality calculation
 */
export function useCreateMaterialityCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      primaryBenchmark: MaterialityBenchmark;
      benchmarkAmount: number;
      benchmarkPercentage: number;
      benchmarkRationale: string;
      performanceMaterialityPercentage?: number;
      clearlyTrivialPercentage?: number;
      qualitativeFactors?: QualitativeFactorAssessment[];
      preparedBy: string;
    }) => {
      // Calculate materiality values
      const overallMateriality = calculateOverallMateriality(
        params.benchmarkAmount,
        params.benchmarkPercentage
      );

      const pmPercentage = params.performanceMaterialityPercentage || 75;
      const ctPercentage = params.clearlyTrivialPercentage || 5;

      let performanceMateriality = calculatePerformanceMateriality(
        overallMateriality,
        pmPercentage
      );
      let clearlyTrivialThreshold = calculateClearlyTrivialThreshold(
        overallMateriality,
        ctPercentage
      );

      // Apply qualitative adjustments if provided
      if (params.qualitativeFactors?.length) {
        performanceMateriality = applyQualitativeAdjustments(
          performanceMateriality,
          params.qualitativeFactors
        );
      }

      // Validate
      const validation = validateMaterialityCalculation({
        primaryBenchmark: params.primaryBenchmark,
        benchmarkAmount: params.benchmarkAmount,
        benchmarkPercentage: params.benchmarkPercentage,
        benchmarkRationale: params.benchmarkRationale,
        performanceMaterialityPercentage: pmPercentage,
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      // Mark any existing current version as not current
      await supabase
        .from('materiality_calculations')
        .update({ is_current_version: false })
        .eq('engagement_id', params.engagementId)
        .eq('is_current_version', true);

      // Get version number
      const { count } = await supabase
        .from('materiality_calculations')
        .select('*', { count: 'exact', head: true })
        .eq('engagement_id', params.engagementId);

      // Create new calculation
      const { data, error } = await supabase
        .from('materiality_calculations')
        .insert({
          engagement_id: params.engagementId,
          primary_benchmark: params.primaryBenchmark,
          benchmark_amount: params.benchmarkAmount,
          benchmark_percentage: params.benchmarkPercentage,
          benchmark_rationale: params.benchmarkRationale,
          overall_materiality: overallMateriality,
          performance_materiality: performanceMateriality,
          performance_materiality_percentage: pmPercentage,
          clearly_trivial_threshold: clearlyTrivialThreshold,
          clearly_trivial_percentage: ctPercentage,
          qualitative_factors: params.qualitativeFactors || [],
          risk_adjustment_factor: 1.0,
          status: 'draft',
          prepared_by: params.preparedBy,
          prepared_at: new Date().toISOString(),
          version: (count || 0) + 1,
          is_current_version: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.history(variables.engagementId),
      });
    },
  });
}

/**
 * Update materiality calculation (only in draft status)
 */
export function useUpdateMaterialityCalculation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      materialityId: string;
      engagementId: string;
      updates: Partial<{
        primaryBenchmark: MaterialityBenchmark;
        benchmarkAmount: number;
        benchmarkPercentage: number;
        benchmarkRationale: string;
        performanceMaterialityPercentage: number;
        clearlyTrivialPercentage: number;
        qualitativeFactors: QualitativeFactorAssessment[];
        riskAdjustmentFactor: number;
        riskAdjustmentRationale: string;
      }>;
    }) => {
      // Get current calculation
      const { data: current, error: fetchError } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('id', params.materialityId)
        .single();

      if (fetchError) throw fetchError;

      if (current.status !== 'draft') {
        throw new Error('Can only update materiality calculations in draft status');
      }

      // Recalculate if benchmark values changed
      const benchmarkAmount = params.updates.benchmarkAmount || current.benchmark_amount;
      const benchmarkPercentage =
        params.updates.benchmarkPercentage || current.benchmark_percentage;
      const pmPercentage =
        params.updates.performanceMaterialityPercentage ||
        current.performance_materiality_percentage;
      const ctPercentage =
        params.updates.clearlyTrivialPercentage || current.clearly_trivial_percentage;

      const overallMateriality = calculateOverallMateriality(
        benchmarkAmount,
        benchmarkPercentage
      );
      const performanceMateriality = calculatePerformanceMateriality(
        overallMateriality,
        pmPercentage
      );
      const clearlyTrivialThreshold = calculateClearlyTrivialThreshold(
        overallMateriality,
        ctPercentage
      );

      const { data, error } = await supabase
        .from('materiality_calculations')
        .update({
          ...params.updates,
          primary_benchmark: params.updates.primaryBenchmark,
          benchmark_amount: benchmarkAmount,
          benchmark_percentage: benchmarkPercentage,
          benchmark_rationale: params.updates.benchmarkRationale,
          overall_materiality: overallMateriality,
          performance_materiality: performanceMateriality,
          performance_materiality_percentage: pmPercentage,
          clearly_trivial_threshold: clearlyTrivialThreshold,
          clearly_trivial_percentage: ctPercentage,
          qualitative_factors: params.updates.qualitativeFactors,
          risk_adjustment_factor: params.updates.riskAdjustmentFactor,
          risk_adjustment_rationale: params.updates.riskAdjustmentRationale,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.materialityId)
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.detail(variables.materialityId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
    },
  });
}

/**
 * Submit materiality for review
 */
export function useSubmitMaterialityForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { materialityId: string; engagementId: string }) => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .update({
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.materialityId)
        .eq('status', 'draft')
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.detail(variables.materialityId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
    },
  });
}

/**
 * Review materiality calculation (manager level)
 */
export function useReviewMateriality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      materialityId: string;
      engagementId: string;
      reviewerId: string;
      approved: boolean;
      comments?: string;
    }) => {
      const newStatus: MaterialityStatus = params.approved
        ? 'pending_partner_approval'
        : 'draft';

      const { data, error } = await supabase
        .from('materiality_calculations')
        .update({
          status: newStatus,
          reviewed_by: params.reviewerId,
          reviewed_at: new Date().toISOString(),
          approval_comments: params.comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.materialityId)
        .eq('status', 'pending_review')
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.detail(variables.materialityId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
    },
  });
}

/**
 * Final partner approval
 */
export function useApproveMateriality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      materialityId: string;
      engagementId: string;
      partnerId: string;
      approved: boolean;
      comments?: string;
    }) => {
      const newStatus: MaterialityStatus = params.approved ? 'approved' : 'draft';

      const { data, error } = await supabase
        .from('materiality_calculations')
        .update({
          status: newStatus,
          approved_by: params.partnerId,
          approved_at: new Date().toISOString(),
          approval_comments: params.comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.materialityId)
        .eq('status', 'pending_partner_approval')
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.detail(variables.materialityId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
    },
  });
}

/**
 * Revise materiality (creates new version)
 */
export function useReviseMateriality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      currentMaterialityId: string;
      engagementId: string;
      revisedBy: string;
      revisionRationale: string;
    }) => {
      // Get current calculation
      const { data: current, error: fetchError } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('id', params.currentMaterialityId)
        .single();

      if (fetchError) throw fetchError;

      // Mark current as revised
      await supabase
        .from('materiality_calculations')
        .update({
          status: 'revised',
          is_current_version: false,
        })
        .eq('id', params.currentMaterialityId);

      // Create new version based on current
      const { data, error } = await supabase
        .from('materiality_calculations')
        .insert({
          engagement_id: params.engagementId,
          primary_benchmark: current.primary_benchmark,
          benchmark_amount: current.benchmark_amount,
          benchmark_percentage: current.benchmark_percentage,
          benchmark_rationale: current.benchmark_rationale,
          overall_materiality: current.overall_materiality,
          performance_materiality: current.performance_materiality,
          performance_materiality_percentage: current.performance_materiality_percentage,
          clearly_trivial_threshold: current.clearly_trivial_threshold,
          clearly_trivial_percentage: current.clearly_trivial_percentage,
          qualitative_factors: current.qualitative_factors,
          risk_adjustment_factor: current.risk_adjustment_factor,
          risk_adjustment_rationale: params.revisionRationale,
          prior_year_materiality: current.overall_materiality,
          status: 'draft',
          prepared_by: params.revisedBy,
          prepared_at: new Date().toISOString(),
          version: current.version + 1,
          is_current_version: true,
          previous_version_id: params.currentMaterialityId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityCalculation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.current(variables.engagementId),
      });
      queryClient.invalidateQueries({
        queryKey: materialityKeys.history(variables.engagementId),
      });
    },
  });
}

/**
 * Create materiality allocation for specific account area
 */
export function useCreateMaterialityAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      materialityCalculationId: string;
      leadScheduleId?: string;
      accountArea: string;
      allocatedAmount: number;
      allocationRationale: string;
      riskLevel: 'low' | 'moderate' | 'high';
    }) => {
      const { data, error } = await supabase
        .from('materiality_allocations')
        .insert({
          materiality_calculation_id: params.materialityCalculationId,
          lead_schedule_id: params.leadScheduleId,
          account_area: params.accountArea,
          allocated_amount: params.allocatedAmount,
          allocation_rationale: params.allocationRationale,
          risk_level: params.riskLevel,
        })
        .select()
        .single();

      if (error) throw error;
      return data as MaterialityAllocation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: materialityKeys.allocations(variables.materialityCalculationId),
      });
    },
  });
}

// ============================================
// Summary Hook
// ============================================

/**
 * Get materiality summary for an engagement
 */
export function useMaterialitySummary(engagementId: string) {
  const { data: current, isLoading: currentLoading } = useCurrentMateriality(engagementId);
  const { data: history, isLoading: historyLoading } = useMaterialityHistory(engagementId);

  return {
    isLoading: currentLoading || historyLoading,
    currentMateriality: current,
    history: history || [],
    summary: {
      hasApprovedMateriality: current?.status === 'approved',
      overallMateriality: current?.overallMateriality || 0,
      performanceMateriality: current?.performanceMateriality || 0,
      clearlyTrivialThreshold: current?.clearlyTrivialThreshold || 0,
      status: current?.status || 'draft',
      version: current?.version || 0,
      totalVersions: history?.length || 0,
      pendingApproval:
        current?.status === 'pending_review' ||
        current?.status === 'pending_partner_approval',
    },
  };
}
