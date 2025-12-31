/**
 * useControlTesting Hook
 * React hook for managing control testing workflows
 *
 * Implements requirements from:
 * - AU-C 330: Performing Audit Procedures in Response to Assessed Risks
 * - AU-C 315: Understanding the Entity and Its Environment
 * - AS 2201: Audit of Internal Control Over Financial Reporting (PCAOB)
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Control,
  ControlEffectiveness,
  TestOfControls,
  ControlDeviation,
  ControlDeficiency,
  DeficiencyClassification,
  ITGeneralControl,
  ControlTestingSummary,
  calculateSampleSize,
  SampleSizeParameters,
  evaluateDeficiencyClassification,
} from '@/lib/control-testing';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ============================================
// Controls Hook
// ============================================

export function useControls(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all controls
  const {
    data: controls,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['controls', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('controls')
        .select(`
          *,
          design_assessment:design_assessments(*),
          tests:test_of_controls(*)
        `)
        .eq('engagement_id', engagementId)
        .order('control_number', { ascending: true });

      if (error) throw error;
      return data as Control[];
    },
    enabled: !!engagementId,
  });

  // Create control
  const createMutation = useMutation({
    mutationFn: async (control: Partial<Control>) => {
      const { data, error } = await supabase
        .from('controls')
        .insert({
          ...control,
          engagement_id: engagementId,
          testing_status: 'not_tested',
          created_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls', engagementId] });
      toast.success('Control created successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create control');
    },
  });

  // Update control
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Control> & { id: string }) => {
      const { data, error } = await supabase
        .from('controls')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls', engagementId] });
      toast.success('Control updated successfully');
    },
  });

  // Delete control
  const deleteMutation = useMutation({
    mutationFn: async (controlId: string) => {
      const { error } = await supabase.from('controls').delete().eq('id', controlId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls', engagementId] });
      toast.success('Control deleted');
    },
  });

  // Get key controls
  const keyControls = useMemo(() => {
    return controls?.filter((c) => c.isKeyControl) || [];
  }, [controls]);

  // Get controls by assertion
  const getControlsByAssertion = useCallback(
    (assertion: string) => {
      return controls?.filter((c) => c.assertions?.includes(assertion as any)) || [];
    },
    [controls]
  );

  return {
    controls,
    keyControls,
    isLoading,
    error,
    createControl: createMutation.mutateAsync,
    updateControl: updateMutation.mutateAsync,
    deleteControl: deleteMutation.mutateAsync,
    getControlsByAssertion,
    refetch,
  };
}

// ============================================
// Test of Controls Hook
// ============================================

export function useTestOfControls(controlId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch test of controls
  const {
    data: test,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['test-of-controls', controlId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_of_controls')
        .select(`
          *,
          deviations:control_deviations(*)
        `)
        .eq('control_id', controlId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TestOfControls | null;
    },
    enabled: !!controlId,
  });

  // Create/Update test
  const saveMutation = useMutation({
    mutationFn: async (testData: Partial<TestOfControls>) => {
      const payload = {
        ...testData,
        control_id: controlId,
        updated_at: new Date().toISOString(),
      };

      if (test?.id) {
        const { data, error } = await supabase
          .from('test_of_controls')
          .update(payload)
          .eq('id', test.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('test_of_controls')
          .insert({
            ...payload,
            prepared_by: user?.id,
            prepared_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-of-controls', controlId] });
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Test saved successfully');
    },
  });

  // Record deviation
  const recordDeviationMutation = useMutation({
    mutationFn: async (deviation: Partial<ControlDeviation>) => {
      if (!test?.id) throw new Error('Test not found');

      const { data, error } = await supabase
        .from('control_deviations')
        .insert({
          ...deviation,
          test_id: test.id,
          control_id: controlId,
          identified_by: user?.id,
          identified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update deviation count on test
      await supabase
        .from('test_of_controls')
        .update({
          deviations_found: (test.deviationsFound || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', test.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-of-controls', controlId] });
      toast.success('Deviation recorded');
    },
  });

  // Complete test with conclusion
  const completeMutation = useMutation({
    mutationFn: async ({
      effectiveness,
      conclusion,
    }: {
      effectiveness: ControlEffectiveness;
      conclusion: string;
    }) => {
      if (!test?.id) throw new Error('Test not found');

      const { error: testError } = await supabase
        .from('test_of_controls')
        .update({
          operating_effectiveness: effectiveness,
          conclusion_narrative: conclusion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', test.id);

      if (testError) throw testError;

      // Update control testing status
      const { error: controlError } = await supabase
        .from('controls')
        .update({
          testing_status: 'tested',
          testing_conclusion: effectiveness,
          updated_at: new Date().toISOString(),
        })
        .eq('id', controlId);

      if (controlError) throw controlError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-of-controls', controlId] });
      queryClient.invalidateQueries({ queryKey: ['controls'] });
      toast.success('Test completed');
    },
  });

  // Calculate sample size
  const getSampleSize = useCallback((params: SampleSizeParameters) => {
    return calculateSampleSize(params);
  }, []);

  return {
    test,
    isLoading,
    error,
    saveTest: saveMutation.mutateAsync,
    recordDeviation: recordDeviationMutation.mutateAsync,
    completeTest: completeMutation.mutateAsync,
    getSampleSize,
    isSaving: saveMutation.isPending,
    refetch,
  };
}

// ============================================
// Control Deficiencies Hook
// ============================================

export function useControlDeficiencies(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch deficiencies
  const {
    data: deficiencies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['control-deficiencies', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('control_deficiencies')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('classification', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ControlDeficiency[];
    },
    enabled: !!engagementId,
  });

  // Create deficiency
  const createMutation = useMutation({
    mutationFn: async (deficiency: Partial<ControlDeficiency>) => {
      const { data, error } = await supabase
        .from('control_deficiencies')
        .insert({
          ...deficiency,
          engagement_id: engagementId,
          status: 'identified',
          prepared_by: user?.id,
          prepared_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-deficiencies', engagementId] });
      toast.success('Deficiency documented');
    },
  });

  // Update deficiency
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ControlDeficiency> & { id: string }) => {
      const { data, error } = await supabase
        .from('control_deficiencies')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-deficiencies', engagementId] });
      toast.success('Deficiency updated');
    },
  });

  // Communicate deficiency
  const communicateMutation = useMutation({
    mutationFn: async ({
      id,
      toManagement,
      toTCWG,
    }: {
      id: string;
      toManagement?: boolean;
      toTCWG?: boolean;
    }) => {
      const updates: Partial<ControlDeficiency> = {
        status: 'communicated',
      };

      if (toManagement) {
        updates.communicateToManagement = true;
        updates.communicatedToManagementAt = new Date();
      }

      if (toTCWG) {
        updates.communicateToTCWG = true;
        updates.communicatedToTCWGAt = new Date();
      }

      const { error } = await supabase
        .from('control_deficiencies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control-deficiencies', engagementId] });
      toast.success('Deficiency communicated');
    },
  });

  // Evaluate and classify deficiency
  const evaluateClassification = useCallback(
    (
      likelihood: 'remote' | 'reasonably_possible' | 'probable',
      magnitude: 'inconsequential' | 'more_than_inconsequential' | 'material'
    ): DeficiencyClassification => {
      return evaluateDeficiencyClassification(likelihood, magnitude);
    },
    []
  );

  // Get deficiencies by classification
  const getByClassification = useCallback(
    (classification: DeficiencyClassification) => {
      return deficiencies?.filter((d) => d.classification === classification) || [];
    },
    [deficiencies]
  );

  // Summary
  const summary = useMemo(() => {
    if (!deficiencies) return null;

    return {
      total: deficiencies.length,
      controlDeficiencies: deficiencies.filter((d) => d.classification === 'control_deficiency')
        .length,
      significantDeficiencies: deficiencies.filter(
        (d) => d.classification === 'significant_deficiency'
      ).length,
      materialWeaknesses: deficiencies.filter((d) => d.classification === 'material_weakness')
        .length,
      communicated: deficiencies.filter((d) => d.status === 'communicated').length,
      remediated: deficiencies.filter((d) => d.status === 'remediated').length,
    };
  }, [deficiencies]);

  return {
    deficiencies,
    summary,
    isLoading,
    error,
    createDeficiency: createMutation.mutateAsync,
    updateDeficiency: updateMutation.mutateAsync,
    communicateDeficiency: communicateMutation.mutateAsync,
    evaluateClassification,
    getByClassification,
    refetch,
  };
}

// ============================================
// IT General Controls Hook
// ============================================

export function useITGeneralControls(engagementId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch ITGCs
  const {
    data: itgcs,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['itgc', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('it_general_controls')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('domain', { ascending: true });

      if (error) throw error;
      return data as ITGeneralControl[];
    },
    enabled: !!engagementId,
  });

  // Create ITGC
  const createMutation = useMutation({
    mutationFn: async (itgc: Partial<ITGeneralControl>) => {
      const { data, error } = await supabase
        .from('it_general_controls')
        .insert({
          ...itgc,
          engagement_id: engagementId,
          testing_status: 'not_tested',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itgc', engagementId] });
      toast.success('ITGC created');
    },
  });

  // Update ITGC
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ITGeneralControl> & { id: string }) => {
      const { data, error } = await supabase
        .from('it_general_controls')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itgc', engagementId] });
      toast.success('ITGC updated');
    },
  });

  // Get ITGCs by domain
  const getByDomain = useCallback(
    (domain: string) => {
      return itgcs?.filter((itgc) => itgc.domain === domain) || [];
    },
    [itgcs]
  );

  // Check overall ITGC effectiveness
  const overallEffectiveness = useMemo(() => {
    if (!itgcs || itgcs.length === 0) return null;

    const tested = itgcs.filter((itgc) => itgc.testingStatus === 'tested');
    if (tested.length === 0) return 'not_tested';

    const ineffective = tested.filter((itgc) => itgc.overallEffectiveness === 'ineffective');
    if (ineffective.length > 0) return 'ineffective';

    const exceptions = tested.filter(
      (itgc) => itgc.overallEffectiveness === 'effective_with_exceptions'
    );
    if (exceptions.length > 0) return 'effective_with_exceptions';

    return 'effective';
  }, [itgcs]);

  return {
    itgcs,
    isLoading,
    error,
    createITGC: createMutation.mutateAsync,
    updateITGC: updateMutation.mutateAsync,
    getByDomain,
    overallEffectiveness,
    refetch,
  };
}

// ============================================
// Control Testing Summary Hook
// ============================================

export function useControlTestingSummary(engagementId: string) {
  const { controls, isLoading: controlsLoading } = useControls(engagementId);
  const { deficiencies, isLoading: deficienciesLoading } =
    useControlDeficiencies(engagementId);
  const { itgcs, overallEffectiveness, isLoading: itgcLoading } =
    useITGeneralControls(engagementId);

  const summary = useMemo((): ControlTestingSummary | null => {
    if (!controls) return null;

    const keyControls = controls.filter((c) => c.isKeyControl);
    const testedControls = controls.filter((c) => c.testingStatus === 'tested');
    const inProgress = controls.filter((c) => c.testingStatus === 'in_progress');

    const effective = testedControls.filter((c) => c.testingConclusion === 'effective');
    const effectiveWithExceptions = testedControls.filter(
      (c) => c.testingConclusion === 'effective_with_exceptions'
    );
    const ineffective = testedControls.filter((c) => c.testingConclusion === 'ineffective');

    return {
      engagementId,
      totalControls: controls.length,
      keyControls: keyControls.length,
      controlsTested: testedControls.length,
      controlsNotTested: controls.length - testedControls.length - inProgress.length,
      controlsInProgress: inProgress.length,
      effectiveControls: effective.length,
      effectiveWithExceptions: effectiveWithExceptions.length,
      ineffectiveControls: ineffective.length,
      totalDeviations: 0, // Would need to aggregate from tests
      isolatedDeviations: 0,
      systemicDeviations: 0,
      controlDeficiencies: deficiencies?.filter((d) => d.classification === 'control_deficiency')
        .length || 0,
      significantDeficiencies:
        deficiencies?.filter((d) => d.classification === 'significant_deficiency').length || 0,
      materialWeaknesses:
        deficiencies?.filter((d) => d.classification === 'material_weakness').length || 0,
      itgcEffective: overallEffectiveness === 'effective',
      itgcExceptions: itgcs?.filter(
        (itgc) => itgc.overallEffectiveness !== 'effective'
      ).length || 0,
    };
  }, [controls, deficiencies, itgcs, overallEffectiveness, engagementId]);

  return {
    summary,
    isLoading: controlsLoading || deficienciesLoading || itgcLoading,
  };
}
