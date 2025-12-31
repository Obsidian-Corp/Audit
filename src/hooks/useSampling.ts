/**
 * Sampling Hooks
 * React Query hooks for audit sampling operations
 *
 * Features:
 * - Sample creation and management
 * - Item selection (MUS, random, systematic)
 * - Testing and documentation
 * - Error projection and evaluation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  AuditSample,
  SampleItem,
  SamplingMethod,
  SamplingPurpose,
  SampleStatus,
  ItemTestResult,
  AuditAssertion,
  ExceptionType,
  PopulationStratum,
  calculateMUSSampleSize,
  calculateAttributesSampleSize,
  calculateMUSInterval,
  generateRandomSelection,
  generateSystematicSelection,
  generateMUSSelection,
  projectMUSMisstatement,
  projectClassicalMisstatement,
  evaluateAttributesSample,
  MUSProjectionResult,
  ClassicalProjectionResult,
  AttributesProjectionResult,
} from '@/lib/sampling';

// ============================================
// Query Keys
// ============================================

export const samplingKeys = {
  all: ['samples'] as const,
  lists: () => [...samplingKeys.all, 'list'] as const,
  list: (engagementId: string) => [...samplingKeys.lists(), engagementId] as const,
  details: () => [...samplingKeys.all, 'detail'] as const,
  detail: (id: string) => [...samplingKeys.details(), id] as const,
  items: (sampleId: string) => [...samplingKeys.all, 'items', sampleId] as const,
  projection: (sampleId: string) => [...samplingKeys.all, 'projection', sampleId] as const,
};

// ============================================
// Sample Queries
// ============================================

/**
 * Get all samples for an engagement
 */
export function useSamples(engagementId: string) {
  return useQuery({
    queryKey: samplingKeys.list(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_samples')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AuditSample[];
    },
    enabled: !!engagementId,
  });
}

/**
 * Get a single sample with items
 */
export function useSample(sampleId: string) {
  return useQuery({
    queryKey: samplingKeys.detail(sampleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_samples')
        .select(`
          *,
          items:sample_items(*)
        `)
        .eq('id', sampleId)
        .single();

      if (error) throw error;
      return data as AuditSample & { items: SampleItem[] };
    },
    enabled: !!sampleId,
  });
}

/**
 * Get sample items
 */
export function useSampleItems(sampleId: string) {
  return useQuery({
    queryKey: samplingKeys.items(sampleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sample_items')
        .select('*')
        .eq('sample_id', sampleId)
        .order('item_number');

      if (error) throw error;
      return data as SampleItem[];
    },
    enabled: !!sampleId,
  });
}

// ============================================
// Sample Mutations
// ============================================

/**
 * Create a new audit sample
 */
export function useCreateSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      leadScheduleId?: string;
      procedureId?: string;
      sampleName: string;
      description: string;
      purpose: SamplingPurpose;
      assertion: AuditAssertion;
      populationDescription: string;
      populationSize: number;
      populationValue: number;
      method: SamplingMethod;
      isStatistical: boolean;
      confidenceLevel: number;
      tolerableError?: number;
      tolerableErrorRate?: number;
      expectedErrorRate?: number;
      expectedMisstatement?: number;
      inherentRisk?: 'low' | 'moderate' | 'high';
      controlRisk?: 'low' | 'moderate' | 'high';
    }) => {
      // Calculate sample size based on method
      let calculatedSampleSize: number;

      if (params.purpose === 'test_of_controls' || params.method === 'attributes') {
        calculatedSampleSize = calculateAttributesSampleSize({
          confidenceLevel: params.confidenceLevel,
          expectedDeviationRate: params.expectedErrorRate || 0,
          tolerableDeviationRate: params.tolerableErrorRate || 0.05,
          populationSize: params.populationSize,
          riskOfOverreliance: 100 - params.confidenceLevel,
        });
      } else if (params.method === 'monetary_unit') {
        calculatedSampleSize = calculateMUSSampleSize({
          confidenceLevel: params.confidenceLevel,
          tolerableMisstatement: params.tolerableError || 0,
          expectedMisstatement: params.expectedMisstatement || 0,
          populationValue: params.populationValue,
          inherentRisk: params.inherentRisk || 'moderate',
          controlRisk: params.controlRisk || 'moderate',
          otherSubstantiveRisk: 'moderate',
        });
      } else {
        // Non-statistical - use judgment-based calculation
        calculatedSampleSize = Math.max(
          25,
          Math.ceil(params.populationSize * 0.1)
        );
      }

      // Handle case where 100% testing is needed
      if (calculatedSampleSize === -1) {
        calculatedSampleSize = params.populationSize;
      }

      const { data, error } = await supabase
        .from('audit_samples')
        .insert({
          engagement_id: params.engagementId,
          lead_schedule_id: params.leadScheduleId,
          procedure_id: params.procedureId,
          sample_name: params.sampleName,
          description: params.description,
          purpose: params.purpose,
          assertion: params.assertion,
          population_description: params.populationDescription,
          population_size: params.populationSize,
          population_value: params.populationValue,
          method: params.method,
          is_statistical: params.isStatistical,
          confidence_level: params.confidenceLevel,
          tolerable_error: params.tolerableError,
          tolerable_error_rate: params.tolerableErrorRate,
          expected_error_rate: params.expectedErrorRate,
          expected_misstatement: params.expectedMisstatement,
          calculated_sample_size: calculatedSampleSize,
          actual_sample_size: calculatedSampleSize,
          exceptions_found: 0,
          total_exception_amount: 0,
          status: 'planned',
        })
        .select()
        .single();

      if (error) throw error;
      return data as AuditSample;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: samplingKeys.list(variables.engagementId),
      });
    },
  });
}

/**
 * Select sample items (execute selection)
 */
export function useSelectSampleItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sampleId: string;
      population: Array<{
        id: string;
        reference: string;
        description: string;
        value: number;
      }>;
      seed?: number;
      startPoint?: number;
    }) => {
      // Get sample details
      const { data: sample, error: fetchError } = await supabase
        .from('audit_samples')
        .select('*')
        .eq('id', params.sampleId)
        .single();

      if (fetchError) throw fetchError;

      let selectedIndices: number[] = [];
      let interval: number | undefined;

      // Select based on method
      switch (sample.method) {
        case 'random':
          selectedIndices = generateRandomSelection(
            params.population.length,
            sample.actual_sample_size,
            params.seed
          );
          break;

        case 'systematic': {
          const result = generateSystematicSelection(
            params.population.length,
            sample.actual_sample_size,
            params.startPoint
          );
          selectedIndices = result.items;
          interval = result.interval;
          break;
        }

        case 'monetary_unit': {
          const musResults = generateMUSSelection(
            params.population.map((p) => ({ id: p.id, value: p.value })),
            sample.actual_sample_size,
            params.startPoint
          );
          const musInterval = sample.population_value / sample.actual_sample_size;

          // Create items for MUS
          const musItems = musResults
            .filter((r) => r.selected)
            .map((r, idx) => {
              const popItem = params.population.find((p) => p.id === r.id);
              return {
                sample_id: params.sampleId,
                item_number: idx + 1,
                item_reference: popItem?.reference || r.id,
                item_description: popItem?.description || '',
                book_value: popItem?.value || 0,
                selection_method: 'monetary_unit' as const,
                cumulative_value: r.cumulativeValue,
                test_result: 'pending' as ItemTestResult,
              };
            });

          const { error: insertError } = await supabase
            .from('sample_items')
            .insert(musItems);

          if (insertError) throw insertError;

          // Update sample status
          await supabase
            .from('audit_samples')
            .update({
              status: 'selected',
              selection_interval: musInterval,
              selection_start_point: params.startPoint,
              actual_sample_size: musItems.length,
            })
            .eq('id', params.sampleId);

          return { itemCount: musItems.length, interval: musInterval };
        }

        default:
          // For haphazard/block/targeted, items will be added manually
          selectedIndices = [];
      }

      // Create sample items for non-MUS methods
      if (selectedIndices.length > 0) {
        const items = selectedIndices.map((idx, i) => {
          const popItem = params.population[idx - 1];
          return {
            sample_id: params.sampleId,
            item_number: i + 1,
            item_reference: popItem?.reference || `Item ${idx}`,
            item_description: popItem?.description || '',
            book_value: popItem?.value || 0,
            selection_method: sample.method as 'random' | 'systematic',
            test_result: 'pending' as ItemTestResult,
          };
        });

        const { error: insertError } = await supabase
          .from('sample_items')
          .insert(items);

        if (insertError) throw insertError;

        // Update sample status
        await supabase
          .from('audit_samples')
          .update({
            status: 'selected',
            selection_seed: params.seed,
            selection_interval: interval,
            selection_start_point: params.startPoint,
            actual_sample_size: items.length,
          })
          .eq('id', params.sampleId);

        return { itemCount: items.length, interval };
      }

      return { itemCount: 0, interval: undefined };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: samplingKeys.detail(variables.sampleId),
      });
      queryClient.invalidateQueries({
        queryKey: samplingKeys.items(variables.sampleId),
      });
    },
  });
}

/**
 * Record test result for a sample item
 */
export function useRecordItemTestResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      itemId: string;
      sampleId: string;
      testResult: ItemTestResult;
      auditedValue?: number;
      exceptionType?: ExceptionType;
      exceptionDescription?: string;
      workpaperReference?: string;
      testedBy: string;
    }) => {
      // Get current item to calculate difference
      const { data: item, error: fetchError } = await supabase
        .from('sample_items')
        .select('*')
        .eq('id', params.itemId)
        .single();

      if (fetchError) throw fetchError;

      const difference =
        params.auditedValue !== undefined
          ? params.auditedValue - item.book_value
          : undefined;

      const tainting =
        difference !== undefined && item.book_value !== 0
          ? Math.abs(difference) / item.book_value
          : undefined;

      const { data, error } = await supabase
        .from('sample_items')
        .update({
          test_result: params.testResult,
          audited_value: params.auditedValue,
          difference,
          tainting,
          exception_type: params.exceptionType,
          exception_description: params.exceptionDescription,
          workpaper_reference: params.workpaperReference,
          tested_by: params.testedBy,
          tested_at: new Date().toISOString(),
        })
        .eq('id', params.itemId)
        .select()
        .single();

      if (error) throw error;

      // Update sample exception counts
      const { data: allItems } = await supabase
        .from('sample_items')
        .select('test_result, difference')
        .eq('sample_id', params.sampleId);

      const exceptions = allItems?.filter((i) => i.test_result === 'exception') || [];
      const totalExceptionAmount = exceptions.reduce(
        (sum, i) => sum + Math.abs(i.difference || 0),
        0
      );

      await supabase
        .from('audit_samples')
        .update({
          exceptions_found: exceptions.length,
          total_exception_amount: totalExceptionAmount,
          status: 'in_progress',
        })
        .eq('id', params.sampleId);

      return data as SampleItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: samplingKeys.detail(variables.sampleId),
      });
      queryClient.invalidateQueries({
        queryKey: samplingKeys.items(variables.sampleId),
      });
    },
  });
}

/**
 * Complete testing and project results
 */
export function useCompleteSampleTesting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sampleId: string;
      engagementId: string;
    }): Promise<{
      musProjection?: MUSProjectionResult;
      classicalProjection?: ClassicalProjectionResult;
      attributesProjection?: AttributesProjectionResult;
    }> => {
      // Get sample and items
      const { data: sample, error: fetchError } = await supabase
        .from('audit_samples')
        .select(`
          *,
          items:sample_items(*)
        `)
        .eq('id', params.sampleId)
        .single();

      if (fetchError) throw fetchError;

      const items = sample.items as SampleItem[];
      let projectionResult: {
        musProjection?: MUSProjectionResult;
        classicalProjection?: ClassicalProjectionResult;
        attributesProjection?: AttributesProjectionResult;
      } = {};

      // Project based on method
      if (sample.method === 'monetary_unit') {
        const interval = calculateMUSInterval(
          sample.population_value,
          sample.actual_sample_size
        );
        const musResult = projectMUSMisstatement(
          items,
          interval,
          sample.tolerable_error || sample.population_value * 0.05,
          sample.confidence_level
        );
        projectionResult.musProjection = musResult;

        // Update sample with projection
        await supabase
          .from('audit_samples')
          .update({
            projected_misstatement: musResult.projectedMisstatement,
            upper_error_limit: musResult.upperMisstatementLimit,
            status: 'evaluated',
            testing_end_date: new Date().toISOString(),
          })
          .eq('id', params.sampleId);
      } else if (sample.method === 'classical_variable') {
        const classicalResult = projectClassicalMisstatement(
          items,
          sample.population_value,
          sample.population_size,
          sample.tolerable_error || sample.population_value * 0.05,
          sample.confidence_level
        );
        projectionResult.classicalProjection = classicalResult;

        await supabase
          .from('audit_samples')
          .update({
            projected_misstatement: classicalResult.projectedMisstatement,
            upper_error_limit: classicalResult.upperMisstatementLimit,
            status: 'evaluated',
            testing_end_date: new Date().toISOString(),
          })
          .eq('id', params.sampleId);
      } else if (sample.method === 'attributes' || sample.purpose === 'test_of_controls') {
        const attrResult = evaluateAttributesSample(
          items,
          sample.tolerable_error_rate || 0.05,
          sample.confidence_level
        );
        projectionResult.attributesProjection = attrResult;

        await supabase
          .from('audit_samples')
          .update({
            status: 'evaluated',
            testing_end_date: new Date().toISOString(),
          })
          .eq('id', params.sampleId);
      } else {
        // Non-statistical - just mark as tested
        await supabase
          .from('audit_samples')
          .update({
            status: 'tested',
            testing_end_date: new Date().toISOString(),
          })
          .eq('id', params.sampleId);
      }

      return projectionResult;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: samplingKeys.detail(variables.sampleId),
      });
      queryClient.invalidateQueries({
        queryKey: samplingKeys.list(variables.engagementId),
      });
    },
  });
}

/**
 * Sign off on sample
 */
export function useSignOffSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      sampleId: string;
      engagementId: string;
      userId: string;
      role: 'preparer' | 'reviewer';
    }) => {
      const updateData =
        params.role === 'preparer'
          ? {
              prepared_by: params.userId,
              prepared_at: new Date().toISOString(),
            }
          : {
              reviewed_by: params.userId,
              reviewed_at: new Date().toISOString(),
              status: 'concluded' as SampleStatus,
            };

      const { data, error } = await supabase
        .from('audit_samples')
        .update(updateData)
        .eq('id', params.sampleId)
        .select()
        .single();

      if (error) throw error;
      return data as AuditSample;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: samplingKeys.detail(variables.sampleId),
      });
      queryClient.invalidateQueries({
        queryKey: samplingKeys.list(variables.engagementId),
      });
    },
  });
}

// ============================================
// Summary Hook
// ============================================

/**
 * Get sampling summary for an engagement
 */
export function useSamplingSummary(engagementId: string) {
  const { data: samples, isLoading } = useSamples(engagementId);

  return {
    isLoading,
    samples: samples || [],
    summary: {
      totalSamples: samples?.length || 0,
      plannedSamples: samples?.filter((s) => s.status === 'planned').length || 0,
      inProgressSamples:
        samples?.filter((s) => s.status === 'in_progress' || s.status === 'selected')
          .length || 0,
      completedSamples:
        samples?.filter(
          (s) => s.status === 'tested' || s.status === 'evaluated' || s.status === 'concluded'
        ).length || 0,
      totalExceptions: samples?.reduce((sum, s) => sum + s.exceptionsFound, 0) || 0,
      totalProjectedMisstatement:
        samples?.reduce((sum, s) => sum + (s.projectedMisstatement || 0), 0) || 0,
    },
  };
}
