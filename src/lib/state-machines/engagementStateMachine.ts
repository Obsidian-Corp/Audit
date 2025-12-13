/**
 * Engagement Status State Machine
 *
 * Defines valid state transitions for engagement workflow.
 * Ensures engagements follow the proper audit lifecycle.
 */

export type EngagementStatus =
  | 'planning'
  | 'fieldwork'
  | 'review'
  | 'reporting'
  | 'completed'
  | 'archived'
  | 'on_hold'
  | 'cancelled';

/**
 * State machine definition
 * Maps each status to the list of statuses it can transition to
 */
export const engagementStateMachine: Record<EngagementStatus, EngagementStatus[]> = {
  planning: ['fieldwork', 'on_hold', 'cancelled'],
  fieldwork: ['planning', 'review', 'on_hold', 'cancelled'],
  review: ['fieldwork', 'reporting', 'on_hold'],
  reporting: ['review', 'completed', 'on_hold'],
  completed: ['archived'],
  archived: [], // Terminal state - no transitions allowed
  on_hold: ['planning', 'fieldwork', 'review', 'reporting', 'cancelled'], // Can resume to previous state
  cancelled: [], // Terminal state
};

/**
 * Check if a status transition is valid
 *
 * @param from - Current status
 * @param to - Desired status
 * @returns true if transition is allowed, false otherwise
 */
export function canTransition(from: EngagementStatus, to: EngagementStatus): boolean {
  const allowedTransitions = engagementStateMachine[from];
  return allowedTransitions?.includes(to) ?? false;
}

/**
 * Validate a status transition and throw error if invalid
 *
 * @param from - Current status
 * @param to - Desired status
 * @throws Error if transition is not allowed
 */
export function validateTransition(from: EngagementStatus, to: EngagementStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: Cannot move from '${from}' to '${to}'`);
  }
}

/**
 * Get all valid next statuses from current status
 *
 * @param currentStatus - Current engagement status
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: EngagementStatus): EngagementStatus[] {
  return engagementStateMachine[currentStatus] || [];
}

/**
 * Get human-readable labels for statuses
 */
export const statusLabels: Record<EngagementStatus, string> = {
  planning: 'Planning',
  fieldwork: 'Fieldwork',
  review: 'Review',
  reporting: 'Reporting',
  completed: 'Completed',
  archived: 'Archived',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

/**
 * Get status color for UI display
 */
export const statusColors: Record<EngagementStatus, string> = {
  planning: 'blue',
  fieldwork: 'purple',
  review: 'yellow',
  reporting: 'orange',
  completed: 'green',
  archived: 'gray',
  on_hold: 'amber',
  cancelled: 'red',
};

/**
 * Check if status is a terminal state (no further transitions)
 */
export function isTerminalStatus(status: EngagementStatus): boolean {
  return engagementStateMachine[status].length === 0;
}

/**
 * Get transition reason templates
 */
export const transitionReasons: Record<string, string[]> = {
  'planning->fieldwork': [
    'Risk assessment completed',
    'Audit program approved',
    'Team assigned and ready'
  ],
  'fieldwork->review': [
    'All procedures completed',
    'Workpapers prepared',
    'Ready for partner review'
  ],
  'review->reporting': [
    'Review comments addressed',
    'Partner approval received',
    'Ready for report drafting'
  ],
  'reporting->completed': [
    'Report issued to client',
    'All deliverables sent',
    'Client acceptance received'
  ],
  'completed->archived': [
    'Retention period met',
    'File archived',
    'Project closed'
  ],
  '*->on_hold': [
    'Client request',
    'Missing information',
    'Resource constraints',
    'Awaiting third-party data'
  ],
  '*->cancelled': [
    'Client terminated engagement',
    'Scope dispute',
    'Converted to different service type',
    'Firm declined to continue'
  ]
};

/**
 * Get suggested transition reasons for a specific status change
 */
export function getTransitionReasons(from: EngagementStatus, to: EngagementStatus): string[] {
  const specificKey = `${from}->${to}`;
  const genericKey = `*->${to}`;

  return transitionReasons[specificKey] || transitionReasons[genericKey] || [];
}
