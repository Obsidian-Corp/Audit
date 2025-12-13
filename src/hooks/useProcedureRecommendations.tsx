import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { recommendProcedures } from '@/utils/procedureRecommendations';
import type { RecommendationResult } from '@/types/procedures';

export function useProcedureRecommendations(riskAssessmentId: string | undefined) {
  return useQuery({
    queryKey: ['recommendations', riskAssessmentId],
    queryFn: async (): Promise<RecommendationResult | null> => {
      if (!riskAssessmentId) return null;

      // Fetch risk assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('engagement_risk_assessments')
        .select('*')
        .eq('id', riskAssessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Fetch risk areas
      const { data: areas, error: areasError } = await supabase
        .from('risk_assessment_areas')
        .select('*')
        .eq('risk_assessment_id', riskAssessmentId);

      if (areasError) throw areasError;

      // Fetch all active procedures
      const { data: procedures, error: proceduresError } = await supabase
        .from('audit_procedures')
        .select('*')
        .eq('is_active', true);

      if (proceduresError) throw proceduresError;

      // Fetch procedure risk mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('procedure_risk_mappings')
        .select('*')
        .eq('is_recommended', true);

      if (mappingsError) throw mappingsError;

      // Compute recommendations locally
      const result = recommendProcedures(
        assessment,
        areas || [],
        procedures || [],
        mappings || []
      );

      return result;
    },
    enabled: !!riskAssessmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}
