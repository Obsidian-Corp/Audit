/**
 * Materiality Types
 * Type definitions for materiality calculator
 * Issue #6: Materiality Calculator
 */

export type BenchmarkType = 'revenue' | 'total_assets' | 'net_income' | 'equity' | 'expenses';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface MaterialityCalculation {
  id: string;
  engagement_id: string;
  firm_id: string;

  // Benchmark
  benchmark_type: BenchmarkType;
  benchmark_value: number;
  benchmark_year?: number;

  // Calculated materiality values
  overall_materiality_percentage: number;
  overall_materiality: number;
  performance_materiality_percentage: number;
  performance_materiality: number;
  clearly_trivial_percentage: number;
  clearly_trivial_threshold: number;

  // Component materiality (group audits)
  component_materiality?: number;
  component_performance_materiality?: number;

  // Rationale
  benchmark_rationale?: string;
  percentage_rationale?: string;
  additional_notes?: string;

  // Industry
  industry?: string;
  risk_level?: RiskLevel;

  // Approval
  approved_by?: string;
  approved_at?: string;
  version: number;
  is_current: boolean;

  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialityFormData {
  benchmark_type: BenchmarkType;
  benchmark_value: number;
  benchmark_year?: number;
  overall_materiality_percentage: number;
  performance_materiality_percentage: number;
  clearly_trivial_percentage: number;
  benchmark_rationale?: string;
  percentage_rationale?: string;
  additional_notes?: string;
  industry?: string;
  risk_level?: RiskLevel;
  component_materiality?: number;
}

export interface IndustryGuidance {
  recommended_overall_percentage: number;
  recommended_performance_percentage: number;
  recommended_trivial_percentage: number;
  rationale: string;
}
