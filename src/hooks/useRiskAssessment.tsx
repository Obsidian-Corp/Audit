// Risk Assessment Hooks
// Phase 1: Foundation - Risk-based audit methodology API hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  EngagementRiskAssessment,
  RiskAreaAssessment,
  RiskAssessmentTemplate,
  RiskAssessmentResponse,
  BusinessProfile,
  FraudRiskAssessment,
  ITRiskAssessment,
  calculateCombinedRisk,
  calculateOverallRisk
} from '@/types/risk-assessment';
import { useToast } from './use-toast';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch risk assessment for an engagement
 */
export function useRiskAssessment(engagementId: string | undefined) {
  return useQuery({
    queryKey: ['risk-assessment', engagementId],
    queryFn: async () => {
      if (!engagementId) return null;

      const { data, error } = await supabase
        .from('engagement_risk_assessments')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as EngagementRiskAssessment | null;
    },
    enabled: !!engagementId
  });
}

/**
 * Fetch risk areas for a risk assessment
 */
export function useRiskAssessmentAreas(riskAssessmentId: string | undefined) {
  return useQuery({
    queryKey: ['risk-assessment-areas', riskAssessmentId],
    queryFn: async () => {
      if (!riskAssessmentId) return [];

      const { data, error } = await supabase
        .from('risk_assessment_areas')
        .select('*')
        .eq('risk_assessment_id', riskAssessmentId)
        .order('area_name');

      if (error) throw error;

      return data as RiskAreaAssessment[];
    },
    enabled: !!riskAssessmentId
  });
}

/**
 * Fetch all risk assessment templates
 */
export function useRiskAssessmentTemplates(industry?: string) {
  return useQuery({
    queryKey: ['risk-assessment-templates', industry],
    queryFn: async () => {
      let query = supabase
        .from('risk_assessment_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (industry) {
        query = query.or(`industry.eq.${industry},industry.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as RiskAssessmentTemplate[];
    }
  });
}

/**
 * Fetch risk assessment responses
 */
export function useRiskAssessmentResponses(riskAssessmentId: string | undefined) {
  return useQuery({
    queryKey: ['risk-assessment-responses', riskAssessmentId],
    queryFn: async () => {
      if (!riskAssessmentId) return [];

      const { data, error } = await supabase
        .from('risk_assessment_responses')
        .select('*')
        .eq('risk_assessment_id', riskAssessmentId);

      if (error) throw error;

      return data as RiskAssessmentResponse[];
    },
    enabled: !!riskAssessmentId
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new risk assessment
 */
export function useCreateRiskAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      businessProfile: BusinessProfile;
      riskAreas: Omit<RiskAreaAssessment, 'id' | 'risk_assessment_id' | 'created_at' | 'updated_at'>[];
      fraudRisk: FraudRiskAssessment;
      itRisk: ITRiskAssessment;
    }) => {
      const { engagementId, businessProfile, riskAreas, fraudRisk, itRisk } = params;

      // Get current user and firm
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Calculate overall risk
      const overallRisk = calculateOverallRisk(
        riskAreas as RiskAreaAssessment[],
        fraudRisk.overall_fraud_risk,
        itRisk.overall_it_dependency
      );

      // Mark any existing assessments as not current
      await supabase
        .from('engagement_risk_assessments')
        .update({ is_current: false })
        .eq('engagement_id', engagementId);

      // Create the risk assessment
      const { data: assessment, error: assessmentError } = await supabase
        .from('engagement_risk_assessments')
        .insert({
          engagement_id: engagementId,
          firm_id: profile.firm_id,
          industry: businessProfile.industry,
          company_size: businessProfile.company_size,
          revenue_range: businessProfile.revenue_range,
          complexity_factors: businessProfile.complexity_factors,
          engagement_type: 'first_year', // This should come from engagement
          overall_risk_rating: overallRisk,
          fraud_risk_rating: fraudRisk.overall_fraud_risk,
          it_dependency_rating: itRisk.overall_it_dependency,
          assessed_by: user.id,
          review_status: 'draft',
          version: 1,
          is_current: true
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Create risk areas
      const riskAreasWithAssessmentId = riskAreas.map(area => ({
        ...area,
        risk_assessment_id: assessment.id
      }));

      const { error: areasError } = await supabase
        .from('risk_assessment_areas')
        .insert(riskAreasWithAssessmentId);

      if (areasError) throw areasError;

      return assessment as EngagementRiskAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessment', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['risk-assessment-areas', data.id] });
      toast({
        title: 'Risk assessment created',
        description: 'Risk assessment has been saved successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating risk assessment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Update existing risk assessment
 */
export function useUpdateRiskAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      riskAssessmentId: string;
      updates: Partial<EngagementRiskAssessment>;
    }) => {
      const { riskAssessmentId, updates } = params;

      const { data, error } = await supabase
        .from('engagement_risk_assessments')
        .update(updates)
        .eq('id', riskAssessmentId)
        .select()
        .single();

      if (error) throw error;

      return data as EngagementRiskAssessment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessment', data.engagement_id] });
      toast({
        title: 'Risk assessment updated',
        description: 'Changes have been saved successfully.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating risk assessment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Update risk areas
 */
export function useUpdateRiskAreas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      riskAssessmentId: string;
      riskAreas: Partial<RiskAreaAssessment>[];
    }) => {
      const { riskAssessmentId, riskAreas } = params;

      // Delete existing areas
      await supabase
        .from('risk_assessment_areas')
        .delete()
        .eq('risk_assessment_id', riskAssessmentId);

      // Insert updated areas
      const areasToInsert = riskAreas.map(area => ({
        ...area,
        risk_assessment_id: riskAssessmentId
      }));

      const { data, error } = await supabase
        .from('risk_assessment_areas')
        .insert(areasToInsert)
        .select();

      if (error) throw error;

      return data as RiskAreaAssessment[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessment-areas', variables.riskAssessmentId] });
      toast({
        title: 'Risk areas updated',
        description: 'Risk area assessments have been saved.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating risk areas',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * Delete risk assessment
 */
export function useDeleteRiskAssessment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (riskAssessmentId: string) => {
      const { error } = await supabase
        .from('engagement_risk_assessments')
        .delete()
        .eq('id', riskAssessmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessment'] });
      toast({
        title: 'Risk assessment deleted',
        description: 'Risk assessment has been removed.'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting risk assessment',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
