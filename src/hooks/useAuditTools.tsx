/**
 * =================================================================
 * AUDIT TOOLS HOOKS
 * =================================================================
 * TanStack Query hooks for the 8 integrated audit tools per the
 * Comprehensive System Design Document
 *
 * Tools Covered:
 * 1. Sampling (MUS, Classical Variables, Attribute)
 * 2. Materiality Calculations
 * 3. Confirmations (AR, AP, Bank)
 * 4. Analytical Procedures
 * 5. Audit Adjustments (SAJ, PJE, SUM)
 * 6. Independence Declarations
 * 7. Subsequent Events
 * 8. Client PBC Items
 * =================================================================
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =================================================================
// TYPE DEFINITIONS
// =================================================================

export interface AuditSample {
  id: string;
  engagement_id: string;
  audit_area: string;
  created_by: string;
  sampling_method: 'MUS' | 'classical_variables' | 'attribute';
  population_size: number;
  population_value?: number;
  materiality_amount?: number;
  risk_assessment?: 'low' | 'moderate' | 'high' | 'maximum';
  expected_misstatement_rate?: number;
  tolerable_misstatement?: number;
  sample_size: number;
  sampling_interval?: number;
  random_seed?: number;
  selected_items: any[];
  actual_misstatements?: number;
  projected_misstatement?: number;
  upper_misstatement_limit?: number;
  conclusion?: string;
  parameters: any;
  workpaper_reference?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialityCalculation {
  id: string;
  engagement_id: string;
  created_by: string;
  benchmark_type: 'total_revenue' | 'total_assets' | 'total_equity' | 'net_income' | 'gross_profit' | 'other';
  benchmark_amount: number;
  benchmark_description?: string;
  overall_materiality: number;
  performance_materiality: number;
  clearly_trivial_threshold: number;
  overall_percentage: number;
  performance_percentage: number;
  trivial_percentage: number;
  component_materiality?: any[];
  rationale: string;
  risk_factors?: string[];
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  is_active: boolean;
  superseded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Confirmation {
  id: string;
  engagement_id: string;
  created_by: string;
  confirmation_type: 'accounts_receivable' | 'accounts_payable' | 'bank_account' | 'legal_letter' | 'loan_payable' | 'inventory_held_by_third_party' | 'other';
  account_name: string;
  account_number?: string;
  balance_per_books: number;
  as_of_date: string;
  request_sent_date?: string;
  request_sent_to?: string;
  request_sent_by?: string;
  reminder_sent_dates?: string[];
  response_received_date?: string;
  response_method?: 'email' | 'mail' | 'fax' | 'portal' | 'other';
  balance_per_confirmation?: number;
  confirmation_agrees?: boolean;
  exception_amount?: number;
  exception_type?: 'timing_difference' | 'amount_difference' | 'disputed_item' | 'unknown_account' | 'other';
  exception_resolved?: boolean;
  exception_resolution?: string;
  alternative_procedures_performed?: string;
  alternative_procedures_result?: string;
  alternative_procedures_by?: string;
  alternative_procedures_date?: string;
  status: 'pending' | 'sent' | 'received' | 'exception' | 'alternative_procedures' | 'resolved';
  workpaper_reference?: string;
  attachment_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface AnalyticalProcedure {
  id: string;
  engagement_id: string;
  created_by: string;
  procedure_type: 'ratio_analysis' | 'trend_analysis' | 'variance_analysis' | 'reasonableness_test' | 'other';
  account_area: string;
  current_period_amount: number;
  current_period_date: string;
  comparison_period_amount?: number;
  comparison_period_date?: string;
  comparison_type?: 'prior_year' | 'prior_quarter' | 'budget' | 'forecast' | 'industry_average' | 'other';
  variance_amount?: number;
  variance_percentage?: number;
  expected_amount?: number;
  tolerance_percentage: number;
  tolerance_amount?: number;
  requires_investigation?: boolean;
  investigation_performed?: boolean;
  investigation_notes?: string;
  investigation_conclusion?: string;
  ratio_name?: string;
  ratio_current_value?: number;
  ratio_comparison_value?: number;
  ratio_industry_benchmark?: number;
  workpaper_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditAdjustment {
  id: string;
  engagement_id: string;
  created_by: string;
  adjustment_number: string;
  adjustment_type: 'proposed' | 'passed' | 'waived';
  misstatement_type: 'factual' | 'judgmental' | 'projected';
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  additional_entries?: any[];
  affects_income_statement: boolean;
  affects_balance_sheet: boolean;
  income_statement_impact?: number;
  balance_sheet_impact?: number;
  is_material?: boolean;
  materiality_percentage?: number;
  is_above_trivial?: boolean;
  presented_to_client?: boolean;
  presentation_date?: string;
  client_response?: 'accepted' | 'declined' | 'pending' | 'not_presented';
  client_response_date?: string;
  client_response_notes?: string;
  posted_by_client?: boolean;
  posted_date?: string;
  included_in_sum?: boolean;
  sum_category?: string;
  approved_by?: string;
  approved_at?: string;
  workpaper_reference?: string;
  supporting_documentation_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface IndependenceDeclaration {
  id: string;
  user_id: string;
  engagement_id?: string;
  firm_id: string;
  declaration_type: 'annual_firm_wide' | 'engagement_specific' | 'new_hire' | 'periodic_update';
  period_start: string;
  period_end: string;
  is_independent: boolean;
  conflicts_disclosed?: any[];
  financial_interests?: any;
  business_relationships?: any;
  family_relationships?: any;
  recent_employment?: any;
  non_audit_services_provided?: string[];
  nas_independence_threats?: string[];
  nas_safeguards_applied?: string[];
  attestation_statement: string;
  digital_signature?: string;
  attestation_date: string;
  ip_address?: string;
  requires_approval?: boolean;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubsequentEvent {
  id: string;
  engagement_id: string;
  created_by: string;
  event_date: string;
  event_description: string;
  event_type: 'type_1_adjusting' | 'type_2_disclosure';
  balance_sheet_date: string;
  audit_report_date?: string;
  has_financial_impact: boolean;
  estimated_financial_impact?: number;
  financial_impact_description?: string;
  management_assessment?: string;
  management_action_taken?: string;
  requires_adjustment: boolean;
  adjustment_recorded?: boolean;
  adjustment_reference?: string;
  requires_disclosure: boolean;
  disclosure_included?: boolean;
  disclosure_reference?: string;
  disclosure_text?: string;
  requires_opinion_modification?: boolean;
  opinion_modification_type?: 'emphasis_of_matter' | 'going_concern' | 'other_matter' | 'qualified' | 'adverse' | 'disclaimer';
  resolution_status: 'identified' | 'assessing' | 'resolved' | 'pending_client';
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  identified_by?: string;
  identified_date: string;
  workpaper_reference?: string;
  supporting_documentation?: string[];
  created_at: string;
  updated_at: string;
}

export interface ClientPBCItem {
  id: string;
  engagement_id: string;
  created_by: string;
  item_number: string;
  item_description: string;
  item_category?: string;
  requested_from?: string;
  requested_from_email?: string;
  requested_date: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  specific_instructions?: string;
  example_provided?: boolean;
  example_url?: string;
  status: 'pending' | 'in_progress' | 'partial' | 'received' | 'follow_up_needed' | 'waived';
  received_date?: string;
  received_from?: string;
  received_method?: 'email' | 'portal' | 'mail' | 'in_person' | 'other';
  is_complete?: boolean;
  completeness_notes?: string;
  verified_by?: string;
  verified_at?: string;
  follow_up_count?: number;
  last_follow_up_date?: string;
  next_follow_up_date?: string;
  file_urls?: string[];
  file_location?: string;
  workpaper_reference?: string;
  used_in_procedures?: string[];
  created_at: string;
  updated_at: string;
}

// =================================================================
// 1. SAMPLING HOOKS
// =================================================================

export const useSamples = (engagementId: string) => {
  return useQuery({
    queryKey: ['samples', engagementId],
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
};

export const useCreateSample = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sample: Partial<AuditSample>) => {
      const { data, error } = await supabase
        .from('audit_samples')
        .insert([sample as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['samples', data.engagement_id] });
      toast({
        title: 'Sample calculation saved',
        description: 'The sample has been successfully calculated and saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save sample calculation.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSample = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AuditSample> }) => {
      const { data, error } = await supabase
        .from('audit_samples')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['samples', data.engagement_id] });
      toast({
        title: 'Sample updated',
        description: 'The sample has been successfully updated.',
      });
    },
  });
};

// =================================================================
// 2. MATERIALITY HOOKS
// =================================================================

export const useMateriality = (engagementId: string) => {
  return useQuery({
    queryKey: ['materiality', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .select('*')
        .eq('engagement_id', engagementId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as MaterialityCalculation | null;
    },
    enabled: !!engagementId,
  });
};

export const useCreateMateriality = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (materiality: Partial<MaterialityCalculation>) => {
      // Deactivate previous calculations for this engagement
      if (materiality.engagement_id) {
        await supabase
          .from('materiality_calculations')
          .update({ is_active: false })
          .eq('engagement_id', materiality.engagement_id);
      }

      const { data, error } = await supabase
        .from('materiality_calculations')
        .insert([{ ...materiality, is_active: true } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materiality', data.engagement_id] });
      toast({
        title: 'Materiality calculated',
        description: 'Materiality thresholds have been successfully set.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save materiality calculation.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateMateriality = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MaterialityCalculation> }) => {
      const { data, error } = await supabase
        .from('materiality_calculations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['materiality', data.engagement_id] });
      toast({
        title: 'Materiality updated',
        description: 'Materiality thresholds have been updated.',
      });
    },
  });
};

// =================================================================
// 3. CONFIRMATIONS HOOKS
// =================================================================

export const useConfirmations = (engagementId: string) => {
  return useQuery({
    queryKey: ['confirmations', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirmations')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('as_of_date', { ascending: false });

      if (error) throw error;
      return data as Confirmation[];
    },
    enabled: !!engagementId,
  });
};

export const useCreateConfirmation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (confirmation: Partial<Confirmation>) => {
      const { data, error} = await supabase
        .from('confirmations')
        .insert([confirmation as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmations', data.engagement_id] });
      toast({
        title: 'Confirmation created',
        description: 'The confirmation has been added to the tracker.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create confirmation.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateConfirmation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Confirmation> }) => {
      const { data, error } = await supabase
        .from('confirmations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['confirmations', data.engagement_id] });
      toast({
        title: 'Confirmation updated',
        description: 'The confirmation has been updated.',
      });
    },
  });
};

// =================================================================
// 4. ANALYTICAL PROCEDURES HOOKS
// =================================================================

export const useAnalyticalProcedures = (engagementId: string) => {
  return useQuery({
    queryKey: ['analytical-procedures', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytical_procedures')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('current_period_date', { ascending: false });

      if (error) throw error;
      return data as AnalyticalProcedure[];
    },
    enabled: !!engagementId,
  });
};

export const useCreateAnalyticalProcedure = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (procedure: Partial<AnalyticalProcedure>) => {
      const { data, error } = await supabase
        .from('analytical_procedures')
        .insert([procedure as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analytical-procedures', data.engagement_id] });
      toast({
        title: 'Analytical procedure saved',
        description: 'The analysis has been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save analytical procedure.',
        variant: 'destructive',
      });
    },
  });
};

// =================================================================
// 5. AUDIT ADJUSTMENTS HOOKS
// =================================================================

export const useAuditAdjustments = (engagementId: string) => {
  return useQuery({
    queryKey: ['audit-adjustments', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_adjustments')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('adjustment_number', { ascending: true });

      if (error) throw error;
      return data as AuditAdjustment[];
    },
    enabled: !!engagementId,
  });
};

export const useSummaryOfUncorrectedMisstatements = (engagementId: string) => {
  return useQuery({
    queryKey: ['sum', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sum_by_engagement')
        .select('*')
        .eq('engagement_id', engagementId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!engagementId,
  });
};

export const useCreateAuditAdjustment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (adjustment: Partial<AuditAdjustment>) => {
      const { data, error } = await supabase
        .from('audit_adjustments')
        .insert([adjustment as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-adjustments', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['sum', data.engagement_id] });
      toast({
        title: 'Adjustment created',
        description: `${data.adjustment_type === 'proposed' ? 'AJE' : 'PJE'} ${data.adjustment_number} has been created.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create adjustment.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAuditAdjustment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AuditAdjustment> }) => {
      const { data, error } = await supabase
        .from('audit_adjustments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['audit-adjustments', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['sum', data.engagement_id] });
      toast({
        title: 'Adjustment updated',
        description: 'The adjustment has been updated.',
      });
    },
  });
};

// =================================================================
// 6. INDEPENDENCE DECLARATIONS HOOKS
// =================================================================

export const useIndependenceDeclarations = (userId: string, engagementId?: string) => {
  return useQuery({
    queryKey: ['independence', userId, engagementId],
    queryFn: async () => {
      let query = supabase
        .from('independence_declarations')
        .select('*')
        .eq('user_id', userId)
        .order('period_start', { ascending: false });

      if (engagementId) {
        query = query.eq('engagement_id', engagementId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as IndependenceDeclaration[];
    },
    enabled: !!userId,
  });
};

export const useCreateIndependenceDeclaration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (declaration: Partial<IndependenceDeclaration>) => {
      const { data, error } = await supabase
        .from('independence_declarations')
        .insert([declaration as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['independence', data.user_id] });
      toast({
        title: 'Independence declaration submitted',
        description: 'Your independence declaration has been recorded.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit independence declaration.',
        variant: 'destructive',
      });
    },
  });
};

// =================================================================
// 7. SUBSEQUENT EVENTS HOOKS
// =================================================================

export const useSubsequentEvents = (engagementId: string) => {
  return useQuery({
    queryKey: ['subsequent-events', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subsequent_events')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('event_date', { ascending: false });

      if (error) throw error;
      return data as SubsequentEvent[];
    },
    enabled: !!engagementId,
  });
};

export const useCreateSubsequentEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Partial<SubsequentEvent>) => {
      const { data, error } = await supabase
        .from('subsequent_events')
        .insert([event as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subsequent-events', data.engagement_id] });
      toast({
        title: 'Subsequent event logged',
        description: 'The subsequent event has been added.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to log subsequent event.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateSubsequentEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SubsequentEvent> }) => {
      const { data, error } = await supabase
        .from('subsequent_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subsequent-events', data.engagement_id] });
      toast({
        title: 'Event updated',
        description: 'The subsequent event has been updated.',
      });
    },
  });
};

// =================================================================
// 8. CLIENT PBC ITEMS HOOKS
// =================================================================

export const useClientPBCItems = (engagementId: string) => {
  return useQuery({
    queryKey: ['pbc-items', engagementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_pbc_items')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as ClientPBCItem[];
    },
    enabled: !!engagementId,
  });
};

export const useOverduePBCItems = () => {
  return useQuery({
    queryKey: ['overdue-pbc-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('overdue_pbc_items')
        .select('*')
        .order('days_overdue', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useCreatePBCItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Partial<ClientPBCItem>) => {
      const { data, error } = await supabase
        .from('client_pbc_items')
        .insert([item as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['overdue-pbc-items'] });
      toast({
        title: 'PBC item created',
        description: `PBC item ${data.item_number} has been added.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create PBC item.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdatePBCItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientPBCItem> }) => {
      const { data, error } = await supabase
        .from('client_pbc_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pbc-items', data.engagement_id] });
      queryClient.invalidateQueries({ queryKey: ['overdue-pbc-items'] });
      toast({
        title: 'PBC item updated',
        description: 'The PBC item has been updated.',
      });
    },
  });
};
