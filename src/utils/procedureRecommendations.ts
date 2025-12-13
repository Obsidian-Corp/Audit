// Procedure Recommendation Engine
// Phase 2: Intelligent Recommendations - Risk-based procedure selection

import type {
  EngagementRiskAssessment,
  RiskAreaAssessment,
  RiskLevel
} from '@/types/risk-assessment';
import type {
  AuditProcedure,
  ProcedureRecommendation,
  ProcedureRiskMapping,
  RecommendationContext,
  RecommendationResult,
  CoverageAnalysis,
  RiskGap
} from '@/types/procedures';

/**
 * Main recommendation engine
 * Recommends procedures based on risk assessment
 */
export function recommendProcedures(
  riskAssessment: EngagementRiskAssessment,
  riskAreas: RiskAreaAssessment[],
  allProcedures: AuditProcedure[],
  procedureRiskMappings: ProcedureRiskMapping[]
): RecommendationResult {
  const recommendations: ProcedureRecommendation[] = [];
  const context: RecommendationContext = {
    engagement_id: riskAssessment.engagement_id,
    risk_assessment_id: riskAssessment.id,
    industry: riskAssessment.industry,
    company_size: riskAssessment.company_size,
    engagement_type: riskAssessment.engagement_type,
    overall_risk: riskAssessment.overall_risk_rating
  };

  // Filter to material risk areas
  const materialAreas = riskAreas.filter(area => area.is_material_area);

  // For each material risk area, find matching procedures
  for (const riskArea of materialAreas) {
    const areaRecommendations = getRecommendationsForArea(
      riskArea,
      allProcedures,
      procedureRiskMappings,
      context
    );
    recommendations.push(...areaRecommendations);
  }

  // Remove duplicates (procedure may apply to multiple areas)
  const uniqueRecommendations = deduplicateRecommendations(recommendations);

  // Sort by priority
  const sortedRecommendations = sortByPriority(uniqueRecommendations);

  // Calculate coverage analysis
  const coverageAnalysis = analyzeCoverage(
    materialAreas,
    sortedRecommendations
  );

  // Calculate total hours
  const totalHours = sortedRecommendations.reduce(
    (sum, rec) => sum + (rec.adjusted_hours || rec.procedure.estimated_hours),
    0
  );

  return {
    recommendations: sortedRecommendations,
    coverage_analysis: coverageAnalysis,
    total_estimated_hours: totalHours
  };
}

/**
 * Get procedure recommendations for a specific risk area
 */
function getRecommendationsForArea(
  riskArea: RiskAreaAssessment,
  allProcedures: AuditProcedure[],
  mappings: ProcedureRiskMapping[],
  context: RecommendationContext
): ProcedureRecommendation[] {
  const recommendations: ProcedureRecommendation[] = [];

  // Find mappings for this area and risk level
  const relevantMappings = mappings.filter(
    mapping =>
      mapping.risk_area === riskArea.area_name.toLowerCase().replace(/ /g, '_') &&
      mapping.risk_level_required === riskArea.combined_risk &&
      mapping.is_recommended
  );

  for (const mapping of relevantMappings) {
    const procedure = allProcedures.find(p => p.id === mapping.procedure_id);
    if (!procedure || !procedure.is_active) continue;

    // Check industry applicability
    if (
      procedure.applicable_industries &&
      procedure.applicable_industries.length > 0 &&
      !procedure.applicable_industries.includes(context.industry)
    ) {
      continue;
    }

    // Create recommendation
    const recommendation: ProcedureRecommendation = {
      procedure,
      recommendation_reason: generateRecommendationReason(riskArea, mapping),
      is_auto_recommended: true,
      risk_areas: [riskArea.area_name],
      priority: mapping.is_required ? 'required' : 'recommended',
      adjusted_sample_size: mapping.sample_size_override || getAdjustedSampleSize(procedure, riskArea.combined_risk),
      adjusted_hours: mapping.estimated_hours_override || getAdjustedHours(procedure, riskArea.combined_risk),
      depth_guidance: mapping.depth_guidance,
      is_industry_specific: procedure.applicable_industries?.includes(context.industry)
    };

    recommendations.push(recommendation);
  }

  return recommendations;
}

/**
 * Generate human-readable recommendation reason
 */
function generateRecommendationReason(
  riskArea: RiskAreaAssessment,
  mapping: ProcedureRiskMapping
): string {
  const riskLevel = riskArea.combined_risk;
  const areaName = riskArea.area_name;

  if (mapping.is_required) {
    return `Required for ${areaName} (assessed as ${riskLevel} risk)`;
  }

  if (riskLevel === 'significant') {
    return `Recommended for ${areaName} due to significant risk level`;
  }

  if (riskLevel === 'high') {
    return `Recommended for ${areaName} (high risk)`;
  }

  return `Recommended for ${areaName} (${riskLevel} risk)`;
}

/**
 * Get risk-adjusted sample size
 */
function getAdjustedSampleSize(procedure: AuditProcedure, riskLevel: RiskLevel): string | undefined {
  if (!procedure.dynamic_parameters) return procedure.sample_size_guidance;

  const params = procedure.dynamic_parameters[`${riskLevel}_risk`];
  return params?.sample_size || procedure.sample_size_guidance;
}

/**
 * Get risk-adjusted hours
 */
function getAdjustedHours(procedure: AuditProcedure, riskLevel: RiskLevel): number {
  if (!procedure.dynamic_parameters) return procedure.estimated_hours;

  const params = procedure.dynamic_parameters[`${riskLevel}_risk`];
  return params?.estimated_hours || procedure.estimated_hours;
}

/**
 * Remove duplicate recommendations (same procedure recommended for multiple areas)
 */
function deduplicateRecommendations(
  recommendations: ProcedureRecommendation[]
): ProcedureRecommendation[] {
  const procedureMap = new Map<string, ProcedureRecommendation>();

  for (const rec of recommendations) {
    const existing = procedureMap.get(rec.procedure.id);

    if (!existing) {
      procedureMap.set(rec.procedure.id, rec);
    } else {
      // Merge risk areas
      const mergedRiskAreas = Array.from(new Set([...existing.risk_areas, ...rec.risk_areas]));

      // Keep the higher priority
      const mergedPriority = existing.priority === 'required' || rec.priority === 'required'
        ? 'required'
        : existing.priority === 'recommended' || rec.priority === 'recommended'
        ? 'recommended'
        : 'optional';

      // Update recommendation reason
      const mergedReason = mergedRiskAreas.length > 1
        ? `Recommended for multiple areas: ${mergedRiskAreas.join(', ')}`
        : existing.recommendation_reason;

      procedureMap.set(rec.procedure.id, {
        ...existing,
        risk_areas: mergedRiskAreas,
        priority: mergedPriority,
        recommendation_reason: mergedReason
      });
    }
  }

  return Array.from(procedureMap.values());
}

/**
 * Sort recommendations by priority
 */
function sortByPriority(recommendations: ProcedureRecommendation[]): ProcedureRecommendation[] {
  const priorityOrder = { required: 0, recommended: 1, optional: 2 };

  return [...recommendations].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Within same priority, sort by procedure code
    return (a.procedure.procedure_code || '').localeCompare(b.procedure.procedure_code || '');
  });
}

/**
 * Analyze risk coverage
 */
function analyzeCoverage(
  riskAreas: RiskAreaAssessment[],
  recommendations: ProcedureRecommendation[]
): CoverageAnalysis {
  const coveredAreas = new Set<string>();
  const allAreas = riskAreas.map(area => area.area_name);

  // Collect covered areas
  recommendations.forEach(rec => {
    rec.risk_areas.forEach(area => coveredAreas.add(area));
  });

  const areasCoveredArray = Array.from(coveredAreas);
  const areasMissing = allAreas.filter(area => !coveredAreas.has(area));

  // Identify risk gaps (high/significant risk areas without coverage)
  const riskGaps: RiskGap[] = riskAreas
    .filter(area =>
      !coveredAreas.has(area.area_name) &&
      (area.combined_risk === 'high' || area.combined_risk === 'significant')
    )
    .map(area => ({
      area_name: area.area_name,
      risk_level: area.combined_risk,
      reason: 'No procedures selected for this high-risk area',
      suggested_procedures: []
    }));

  return {
    areas_covered: areasCoveredArray,
    areas_missing: areasMissing,
    coverage_percentage: allAreas.length > 0
      ? Math.round((areasCoveredArray.length / allAreas.length) * 100)
      : 0,
    risk_gaps: riskGaps
  };
}

/**
 * Filter recommendations by category
 */
export function filterRecommendationsByCategory(
  recommendations: ProcedureRecommendation[],
  category: string
): ProcedureRecommendation[] {
  return recommendations.filter(rec => rec.procedure.category === category);
}

/**
 * Filter recommendations by priority
 */
export function filterRecommendationsByPriority(
  recommendations: ProcedureRecommendation[],
  priority: 'required' | 'recommended' | 'optional'
): ProcedureRecommendation[] {
  return recommendations.filter(rec => rec.priority === priority);
}

/**
 * Get recommended procedures by risk area
 */
export function groupRecommendationsByRiskArea(
  recommendations: ProcedureRecommendation[]
): Map<string, ProcedureRecommendation[]> {
  const grouped = new Map<string, ProcedureRecommendation[]>();

  recommendations.forEach(rec => {
    rec.risk_areas.forEach(area => {
      if (!grouped.has(area)) {
        grouped.set(area, []);
      }
      grouped.get(area)!.push(rec);
    });
  });

  return grouped;
}
