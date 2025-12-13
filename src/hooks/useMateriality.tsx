/**
 * useMateriality Hook
 * Hook for managing materiality calculations
 * Issue #6: Materiality Calculator
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  MaterialityCalculation,
  MaterialityFormData,
  IndustryGuidance,
  BenchmarkType,
} from '@/types/materiality';

/**
 * Hook to fetch current materiality calculation for an engagement
 */
export function useMaterialityCalculation(engagementId: string) {
  return useQuery({
    queryKey: ['materiality', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MaterialityCalculation | null;
    },
    enabled: !!engagementId,
  });
}

/**
 * Hook to fetch all versions of materiality calculations for an engagement
 */
export function useMaterialityHistory(engagementId: string) {
  return useQuery({
    queryKey: ['materiality-history', engagementId],
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
 * Hook to get industry-specific materiality guidance
 */
export function useIndustryGuidance(industry: string, benchmarkType: BenchmarkType) {
  return useQuery({
    queryKey: ['industry-guidance', industry, benchmarkType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_industry_materiality_guidance', {
        industry_param: industry,
        benchmark_type_param: benchmarkType,
      });

      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as IndustryGuidance | null;
    },
    enabled: !!industry && !!benchmarkType,
  });
}

/**
 * Hook to calculate materiality values from inputs
 */
export function useCalculateMateriality() {
  return useQuery({
    queryKey: ['calculate-materiality'],
    queryFn: async ({
      benchmarkValue,
      overallPercentage,
      performancePercentage,
      trivialPercentage,
    }: {
      benchmarkValue: number;
      overallPercentage: number;
      performancePercentage: number;
      trivialPercentage: number;
    }) => {
      const { data, error } = await supabase.rpc('calculate_materiality_values', {
        benchmark_value_param: benchmarkValue,
        overall_percentage_param: overallPercentage,
        performance_percentage_param: performancePercentage,
        trivial_percentage_param: trivialPercentage,
      });

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: false, // Manual query trigger
  });
}

/**
 * Hook to save materiality calculation
 */
export function useSaveMateriality() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagementId,
      formData,
      firmId,
    }: {
      engagementId: string;
      formData: MaterialityFormData;
      firmId: string;
    }) => {
      // Calculate materiality values
      const overallMateriality =
        (formData.benchmark_value * formData.overall_materiality_percentage) / 100;
      const performanceMateriality =
        (overallMateriality * formData.performance_materiality_percentage) / 100;
      const clearlyTrivial =
        (overallMateriality * formData.clearly_trivial_percentage) / 100;

      // Mark existing calculations as not current
      await supabase
        .from('materiality_calculations')
        .update({ is_current: false })
        .eq('engagement_id', engagementId);

      // Get current version
      const { data: existingCalcs } = await supabase
        .from('materiality_calculations')
        .select('version')
        .eq('engagement_id', engagementId)
        .order('version', { ascending: false })
        .limit(1);

      const nextVersion = existingCalcs && existingCalcs.length > 0 ? existingCalcs[0].version + 1 : 1;

      // Insert new calculation
      const { data, error } = await supabase
        .from('materiality_calculations')
        .insert({
          engagement_id: engagementId,
          firm_id: firmId,
          benchmark_type: formData.benchmark_type,
          benchmark_value: formData.benchmark_value,
          benchmark_year: formData.benchmark_year,
          overall_materiality_percentage: formData.overall_materiality_percentage,
          overall_materiality: overallMateriality,
          performance_materiality_percentage: formData.performance_materiality_percentage,
          performance_materiality: performanceMateriality,
          clearly_trivial_percentage: formData.clearly_trivial_percentage,
          clearly_trivial_threshold: clearlyTrivial,
          component_materiality: formData.component_materiality,
          benchmark_rationale: formData.benchmark_rationale,
          percentage_rationale: formData.percentage_rationale,
          additional_notes: formData.additional_notes,
          industry: formData.industry,
          risk_level: formData.risk_level,
          version: nextVersion,
          is_current: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materiality', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['materiality-history', variables.engagementId] });
      queryClient.invalidateQueries({ queryKey: ['engagement-activity', variables.engagementId] });
      toast({
        title: 'Materiality saved',
        description: 'Materiality calculation has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving materiality',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to approve materiality calculation
 */
export function useApproveMateriality() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      materialityId,
      engagementId,
    }: {
      materialityId: string;
      engagementId: string;
    }) => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .update({
          approved_at: new Date().toISOString(),
        })
        .eq('id', materialityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['materiality', variables.engagementId] });
      toast({
        title: 'Materiality approved',
        description: 'Materiality calculation has been approved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error approving materiality',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
