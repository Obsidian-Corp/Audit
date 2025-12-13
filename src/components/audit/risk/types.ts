import type { EngagementRiskAssessment } from '@/types/risk-assessment';
import type { EngagementProcedure } from '@/types/procedures';

export interface RiskAssessmentSummaryCardProps {
  /** The risk assessment to display */
  assessment: EngagementRiskAssessment;

  /** Display mode - full shows all details, compact shows summary only */
  mode?: 'full' | 'compact';

  /** Whether to show the heat map by default */
  defaultShowHeatMap?: boolean;

  /** Whether to show coverage analysis section */
  showCoverageAnalysis?: boolean;

  /** Procedures for coverage analysis (required if showCoverageAnalysis=true) */
  procedures?: EngagementProcedure[];

  /** Callback when reassess button clicked */
  onReassess: () => void;

  /** Callback when build program button clicked (only shown if no program exists) */
  onBuildProgram?: () => void;

  /** Optional className for styling */
  className?: string;
}

export interface RiskStats {
  significant: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}
