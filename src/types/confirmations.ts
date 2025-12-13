/**
 * ==================================================================
 * CONFIRMATION TRACKER TYPES
 * ==================================================================
 * TypeScript types for audit confirmation tracking
 * Issue #9: Confirmation Tracker
 * ==================================================================
 */

export type ConfirmationType =
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'bank'
  | 'legal'
  | 'inventory'
  | 'investment'
  | 'loan'
  | 'insurance'
  | 'other';

export type ConfirmationStatus =
  | 'pending'          // Request sent, awaiting response
  | 'received'         // Response received, no exceptions
  | 'exception'        // Response received with exceptions
  | 'not_responded'    // No response after follow-up
  | 'cancelled';       // Confirmation cancelled/not needed

export type ResponseMethod =
  | 'email'
  | 'mail'
  | 'fax'
  | 'portal'
  | 'phone'
  | 'in_person';

export interface Confirmation {
  id: string;
  engagement_id: string;
  firm_id: string;

  // Confirmation Details
  confirmation_type: ConfirmationType;
  entity_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Financial Details
  amount: number | null;
  currency: string;
  account_number: string | null;

  // Request & Response Tracking
  request_date: string; // ISO date string
  response_date: string | null;
  follow_up_date: string | null;
  response_method: ResponseMethod | null;

  // Status Tracking
  status: ConfirmationStatus;

  // Exception Details
  has_exception: boolean;
  exception_notes: string | null;
  exception_amount: number | null;
  resolution_notes: string | null;

  // Workpaper Reference
  workpaper_reference: string | null;
  procedure_id: string | null;

  // Assigned Team Member
  assigned_to: string | null;
  prepared_by: string | null;
  reviewed_by: string | null;

  // Audit Trail
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ConfirmationStats {
  total_confirmations: number;
  pending_count: number;
  received_count: number;
  exception_count: number;
  not_responded_count: number;
  response_rate: number;
  overdue_count: number;
}

export interface CreateConfirmationInput {
  engagement_id: string;
  confirmation_type: ConfirmationType;
  entity_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  amount?: number;
  currency?: string;
  account_number?: string;
  request_date: string; // ISO date string
  follow_up_date?: string;
  assigned_to?: string;
  workpaper_reference?: string;
  procedure_id?: string;
}

export interface UpdateConfirmationInput {
  response_date?: string;
  response_method?: ResponseMethod;
  status?: ConfirmationStatus;
  exception_notes?: string;
  exception_amount?: number;
  resolution_notes?: string;
  reviewed_by?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  amount?: number;
  account_number?: string;
  follow_up_date?: string;
  assigned_to?: string;
}

/**
 * Confirmation type labels for display
 */
export const CONFIRMATION_TYPE_LABELS: Record<ConfirmationType, string> = {
  accounts_receivable: 'Accounts Receivable',
  accounts_payable: 'Accounts Payable',
  bank: 'Bank',
  legal: 'Legal',
  inventory: 'Inventory',
  investment: 'Investment',
  loan: 'Loan',
  insurance: 'Insurance',
  other: 'Other',
};

/**
 * Confirmation status labels for display
 */
export const CONFIRMATION_STATUS_LABELS: Record<ConfirmationStatus, string> = {
  pending: 'Pending',
  received: 'Received',
  exception: 'Exception',
  not_responded: 'Not Responded',
  cancelled: 'Cancelled',
};

/**
 * Response method labels for display
 */
export const RESPONSE_METHOD_LABELS: Record<ResponseMethod, string> = {
  email: 'Email',
  mail: 'Mail',
  fax: 'Fax',
  portal: 'Online Portal',
  phone: 'Phone',
  in_person: 'In Person',
};
