/**
 * Engagement Utility Functions
 * Helper functions for engagement calculations and formatting
 * Issue #1: Missing Engagement Detail Page
 */

/**
 * Calculate engagement progress based on procedure completion
 */
export function calculateProgress(procedures: any[]): number {
  if (!procedures || procedures.length === 0) return 0;

  const completedProcedures = procedures.filter(
    (p) => p.status === 'completed'
  ).length;

  return Math.round((completedProcedures / procedures.length) * 100);
}

/**
 * Get color class for engagement phase
 */
export function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    fieldwork: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    review: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    reporting: 'bg-green-500/10 text-green-500 border-green-500/20',
    complete: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };
  return colors[phase] || 'bg-secondary text-secondary-foreground';
}

/**
 * Get color class for engagement status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    pending_approval: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    fieldwork: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    reporting: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    complete: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    on_hold: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return colors[status] || 'bg-secondary text-secondary-foreground';
}

/**
 * Format budget variance with color indication
 */
export function formatBudgetVariance(
  budget: number,
  actual: number
): {
  variance: number;
  percentage: number;
  color: string;
  text: string;
} {
  const variance = actual - budget;
  const percentage = budget > 0 ? Math.round((variance / budget) * 100) : 0;

  let color = 'text-muted-foreground';
  let text = 'On budget';

  if (percentage > 10) {
    color = 'text-red-500';
    text = 'Over budget';
  } else if (percentage > 5) {
    color = 'text-yellow-500';
    text = 'Near budget';
  } else if (percentage < -10) {
    color = 'text-green-500';
    text = 'Under budget';
  }

  return {
    variance,
    percentage,
    color,
    text,
  };
}

/**
 * Validate phase progression
 * Ensures engagement can only progress to the next phase or backwards
 */
export function canProgressToPhase(
  currentPhase: string,
  nextPhase: string
): boolean {
  const progression = ['planning', 'fieldwork', 'review', 'reporting', 'complete'];
  const currentIdx = progression.indexOf(currentPhase);
  const nextIdx = progression.indexOf(nextPhase);

  // Can move forward one phase or backwards any amount
  return nextIdx <= currentIdx + 1;
}

/**
 * Get next phase in progression
 */
export function getNextPhase(currentPhase: string): string | null {
  const progression = ['planning', 'fieldwork', 'review', 'reporting', 'complete'];
  const currentIdx = progression.indexOf(currentPhase);

  if (currentIdx === -1 || currentIdx === progression.length - 1) {
    return null;
  }

  return progression[currentIdx + 1];
}

/**
 * Get previous phase in progression
 */
export function getPreviousPhase(currentPhase: string): string | null {
  const progression = ['planning', 'fieldwork', 'review', 'reporting', 'complete'];
  const currentIdx = progression.indexOf(currentPhase);

  if (currentIdx <= 0) {
    return null;
  }

  return progression[currentIdx - 1];
}

/**
 * Format phase name for display
 */
export function formatPhaseName(phase: string): string {
  return phase
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format status name for display
 */
export function formatStatusName(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate budget utilization percentage
 */
export function calculateBudgetUtilization(
  budgetAllocated: number,
  budgetSpent: number
): number {
  if (budgetAllocated === 0) return 0;
  return Math.round((budgetSpent / budgetAllocated) * 100);
}

/**
 * Calculate hours utilization percentage
 */
export function calculateHoursUtilization(
  hoursAllocated: number,
  hoursSpent: number
): number {
  if (hoursAllocated === 0) return 0;
  return Math.round((hoursSpent / hoursAllocated) * 100);
}

/**
 * Get utilization status color
 */
export function getUtilizationColor(percentage: number): string {
  if (percentage >= 100) return 'text-red-500';
  if (percentage >= 90) return 'text-yellow-500';
  if (percentage >= 75) return 'text-orange-500';
  return 'text-green-500';
}

/**
 * Format activity type for display
 */
export function formatActivityType(activityType: string): string {
  const typeMap: Record<string, string> = {
    workpaper_added: 'Workpaper Added',
    evidence_uploaded: 'Evidence Uploaded',
    time_logged: 'Time Logged',
    status_changed: 'Status Changed',
    phase_changed: 'Phase Changed',
    procedure_completed: 'Procedure Completed',
    finding_added: 'Finding Added',
    team_member_added: 'Team Member Added',
    team_member_removed: 'Team Member Removed',
    milestone_completed: 'Milestone Completed',
    comment_added: 'Comment Added',
  };

  return typeMap[activityType] || activityType;
}

/**
 * Get days remaining until engagement end date
 */
export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get engagement health status
 */
export function getEngagementHealth(engagement: {
  progress_percentage: number;
  budget_allocated?: number;
  budget_spent?: number;
  end_date?: string;
}): {
  status: 'healthy' | 'at-risk' | 'critical';
  color: string;
  text: string;
} {
  const { progress_percentage, budget_allocated, budget_spent, end_date } = engagement;

  // Calculate budget utilization
  const budgetUtil = budget_allocated && budget_spent
    ? (budget_spent / budget_allocated) * 100
    : 0;

  // Calculate time remaining
  const daysRemaining = end_date ? getDaysRemaining(end_date) : 999;

  // Determine health status
  if (budgetUtil > 100 || daysRemaining < 0) {
    return { status: 'critical', color: 'text-red-500', text: 'Critical' };
  }

  if (budgetUtil > 90 || (daysRemaining < 7 && progress_percentage < 90)) {
    return { status: 'at-risk', color: 'text-yellow-500', text: 'At Risk' };
  }

  return { status: 'healthy', color: 'text-green-500', text: 'Healthy' };
}

/**
 * Calculate completion date estimate based on current progress
 */
export function estimateCompletionDate(
  startDate: string,
  currentProgress: number
): Date | null {
  if (currentProgress === 0) return null;

  const start = new Date(startDate);
  const now = new Date();
  const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0 || currentProgress <= 0) return null;

  const daysPerPercent = elapsedDays / currentProgress;
  const remainingDays = Math.ceil((100 - currentProgress) * daysPerPercent);

  const estimatedCompletion = new Date();
  estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays);

  return estimatedCompletion;
}
