/**
 * Trial Balance Hooks
 * React Query hooks for trial balance management
 *
 * Features:
 * - Trial balance CRUD operations
 * - CSV/Excel import with validation
 * - Account mapping and classification
 * - Lead schedule generation
 * - Variance analysis
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  TrialBalance,
  TrialBalanceAccount,
  LeadSchedule,
  TrialBalanceImport,
  ImportValidationResult,
  AccountMapping,
  VarianceAnalysis,
  FluxAnalysisResult,
  PeriodType,
  TrialBalanceStatus,
  validateTrialBalanceImport,
  autoClassifyAccount,
  calculateVariancePercentage,
  isSignificantVariance,
} from '@/lib/trial-balance';

// ============================================
// Query Keys
// ============================================

export const trialBalanceKeys = {
  all: ['trial-balances'] as const,
  lists: () => [...trialBalanceKeys.all, 'list'] as const,
  list: (engagementId: string) => [...trialBalanceKeys.lists(), engagementId] as const,
  details: () => [...trialBalanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...trialBalanceKeys.details(), id] as const,
  accounts: (trialBalanceId: string) => [...trialBalanceKeys.all, 'accounts', trialBalanceId] as const,
  leadSchedules: (engagementId: string) => [...trialBalanceKeys.all, 'lead-schedules', engagementId] as const,
  leadSchedule: (id: string) => [...trialBalanceKeys.all, 'lead-schedule', id] as const,
  variance: (trialBalanceId: string) => [...trialBalanceKeys.all, 'variance', trialBalanceId] as const,
};

// ============================================
// Trial Balance Queries
// ============================================

/**
 * Fetch all trial balances for an engagement
 */
export function useTrialBalances(engagementId: string) {
  return useQuery({
    queryKey: trialBalanceKeys.list(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_balances')
        .select('*')
        .eq('engagement_id', engagementId)
        .order('period_end_date', { ascending: false });

      if (error) throw error;
      return data as TrialBalance[];
    },
    enabled: !!engagementId,
  });
}

/**
 * Fetch a single trial balance with accounts
 */
export function useTrialBalance(trialBalanceId: string) {
  return useQuery({
    queryKey: trialBalanceKeys.detail(trialBalanceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_balances')
        .select(`
          *,
          accounts:trial_balance_accounts(*)
        `)
        .eq('id', trialBalanceId)
        .single();

      if (error) throw error;
      return data as TrialBalance & { accounts: TrialBalanceAccount[] };
    },
    enabled: !!trialBalanceId,
  });
}

/**
 * Fetch trial balance accounts
 */
export function useTrialBalanceAccounts(trialBalanceId: string) {
  return useQuery({
    queryKey: trialBalanceKeys.accounts(trialBalanceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_balance_accounts')
        .select('*')
        .eq('trial_balance_id', trialBalanceId)
        .order('account_number');

      if (error) throw error;
      return data as TrialBalanceAccount[];
    },
    enabled: !!trialBalanceId,
  });
}

// ============================================
// Trial Balance Mutations
// ============================================

/**
 * Create a new trial balance
 */
export function useCreateTrialBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      periodType: PeriodType;
      periodEndDate: Date;
      sourceSystem?: string;
      importedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('trial_balances')
        .insert({
          engagement_id: params.engagementId,
          period_type: params.periodType,
          period_end_date: params.periodEndDate.toISOString(),
          source_system: params.sourceSystem,
          imported_by: params.importedBy,
          status: 'draft',
          is_locked: false,
          total_debits: 0,
          total_credits: 0,
          is_balanced: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TrialBalance;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.list(variables.engagementId),
      });
    },
  });
}

/**
 * Import trial balance from parsed data
 */
export function useImportTrialBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      trialBalanceId: string;
      engagementId: string;
      importData: TrialBalanceImport;
    }): Promise<{ success: boolean; validation: ImportValidationResult }> => {
      // Validate import data
      const validation = validateTrialBalanceImport(params.importData);

      if (!validation.isValid) {
        return { success: false, validation };
      }

      // Auto-classify accounts
      const accountsWithClassification = params.importData.accounts.map((account) => {
        const classification = autoClassifyAccount(
          account.accountNumber,
          account.accountName
        );
        return {
          trial_balance_id: params.trialBalanceId,
          engagement_id: params.engagementId,
          account_number: account.accountNumber,
          account_name: account.accountName,
          account_type: account.accountType || classification.suggestedType,
          financial_statement: classification.suggestedStatement,
          grouping_category: classification.suggestedCategory,
          beginning_balance: 0,
          ending_balance: (account.debitBalance || 0) - (account.creditBalance || 0),
          audit_adjustments: 0,
          reclassifications: 0,
          final_balance: (account.debitBalance || 0) - (account.creditBalance || 0),
          is_mapped: false,
        };
      });

      // Insert accounts
      const { error: accountsError } = await supabase
        .from('trial_balance_accounts')
        .insert(accountsWithClassification);

      if (accountsError) throw accountsError;

      // Update trial balance totals and status
      const { error: updateError } = await supabase
        .from('trial_balances')
        .update({
          source_system: params.importData.sourceSystem,
          total_debits: validation.summary.totalDebits,
          total_credits: validation.summary.totalCredits,
          is_balanced: validation.summary.isBalanced,
          status: 'imported',
          import_date: new Date().toISOString(),
        })
        .eq('id', params.trialBalanceId);

      if (updateError) throw updateError;

      return { success: true, validation };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.detail(variables.trialBalanceId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.accounts(variables.trialBalanceId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.list(variables.engagementId),
      });
    },
  });
}

/**
 * Update trial balance status
 */
export function useUpdateTrialBalanceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      trialBalanceId: string;
      status: TrialBalanceStatus;
      lockedBy?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        status: params.status,
      };

      if (params.status === 'finalized') {
        updateData.is_locked = true;
        updateData.locked_at = new Date().toISOString();
        updateData.locked_by = params.lockedBy;
      }

      const { data, error } = await supabase
        .from('trial_balances')
        .update(updateData)
        .eq('id', params.trialBalanceId)
        .select()
        .single();

      if (error) throw error;
      return data as TrialBalance;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.detail(data.id),
      });
    },
  });
}

/**
 * Update account classification/mapping
 */
export function useUpdateAccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      accountId: string;
      trialBalanceId: string;
      mapping: Partial<AccountMapping>;
      leadScheduleId?: string;
    }) => {
      const { data, error } = await supabase
        .from('trial_balance_accounts')
        .update({
          account_type: params.mapping.suggestedType,
          financial_statement: params.mapping.suggestedStatement,
          grouping_category: params.mapping.suggestedCategory,
          lead_schedule_id: params.leadScheduleId,
          is_mapped: !!params.leadScheduleId,
        })
        .eq('id', params.accountId)
        .select()
        .single();

      if (error) throw error;
      return data as TrialBalanceAccount;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.accounts(variables.trialBalanceId),
      });
    },
  });
}

/**
 * Bulk update account mappings
 */
export function useBulkUpdateAccountMappings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      trialBalanceId: string;
      mappings: Array<{
        accountId: string;
        accountType: string;
        financialStatement: string;
        groupingCategory: string;
        leadScheduleId?: string;
      }>;
    }) => {
      const updates = params.mappings.map((mapping) =>
        supabase
          .from('trial_balance_accounts')
          .update({
            account_type: mapping.accountType,
            financial_statement: mapping.financialStatement,
            grouping_category: mapping.groupingCategory,
            lead_schedule_id: mapping.leadScheduleId,
            is_mapped: !!mapping.leadScheduleId,
          })
          .eq('id', mapping.accountId)
      );

      await Promise.all(updates);

      // Check if all accounts are mapped
      const { data: accounts } = await supabase
        .from('trial_balance_accounts')
        .select('is_mapped')
        .eq('trial_balance_id', params.trialBalanceId);

      const allMapped = accounts?.every((a) => a.is_mapped) ?? false;

      if (allMapped) {
        await supabase
          .from('trial_balances')
          .update({ status: 'mapped' })
          .eq('id', params.trialBalanceId);
      }

      return { success: true, allMapped };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.accounts(variables.trialBalanceId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.detail(variables.trialBalanceId),
      });
    },
  });
}

/**
 * Record adjusting entry on account
 */
export function useRecordAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      accountId: string;
      trialBalanceId: string;
      adjustmentAmount: number;
      isReclassification: boolean;
    }) => {
      // Get current account
      const { data: account, error: fetchError } = await supabase
        .from('trial_balance_accounts')
        .select('*')
        .eq('id', params.accountId)
        .single();

      if (fetchError) throw fetchError;

      const updateData = params.isReclassification
        ? {
            reclassifications: (account.reclassifications || 0) + params.adjustmentAmount,
            final_balance:
              account.ending_balance +
              (account.audit_adjustments || 0) +
              (account.reclassifications || 0) +
              params.adjustmentAmount,
          }
        : {
            audit_adjustments: (account.audit_adjustments || 0) + params.adjustmentAmount,
            final_balance:
              account.ending_balance +
              (account.audit_adjustments || 0) +
              params.adjustmentAmount +
              (account.reclassifications || 0),
          };

      const { data, error } = await supabase
        .from('trial_balance_accounts')
        .update(updateData)
        .eq('id', params.accountId)
        .select()
        .single();

      if (error) throw error;
      return data as TrialBalanceAccount;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.accounts(variables.trialBalanceId),
      });
    },
  });
}

// ============================================
// Lead Schedule Queries & Mutations
// ============================================

/**
 * Fetch all lead schedules for an engagement
 */
export function useLeadSchedules(engagementId: string) {
  return useQuery({
    queryKey: trialBalanceKeys.leadSchedules(engagementId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_schedules')
        .select(`
          *,
          accounts:trial_balance_accounts(*)
        `)
        .eq('engagement_id', engagementId)
        .order('schedule_number');

      if (error) throw error;
      return data as (LeadSchedule & { accounts: TrialBalanceAccount[] })[];
    },
    enabled: !!engagementId,
  });
}

/**
 * Fetch a single lead schedule with linked accounts
 */
export function useLeadSchedule(leadScheduleId: string) {
  return useQuery({
    queryKey: trialBalanceKeys.leadSchedule(leadScheduleId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_schedules')
        .select(`
          *,
          accounts:trial_balance_accounts(*)
        `)
        .eq('id', leadScheduleId)
        .single();

      if (error) throw error;
      return data as LeadSchedule & { accounts: TrialBalanceAccount[] };
    },
    enabled: !!leadScheduleId,
  });
}

/**
 * Create a new lead schedule
 */
export function useCreateLeadSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      scheduleNumber: string;
      scheduleName: string;
      financialStatementArea: string;
      riskLevel?: 'low' | 'moderate' | 'high';
      significantAccount?: boolean;
      materialityThreshold?: number;
    }) => {
      const { data, error } = await supabase
        .from('lead_schedules')
        .insert({
          engagement_id: params.engagementId,
          schedule_number: params.scheduleNumber,
          schedule_name: params.scheduleName,
          financial_statement_area: params.financialStatementArea,
          risk_level: params.riskLevel || 'moderate',
          significant_account: params.significantAccount || false,
          materiality_threshold: params.materialityThreshold,
          beginning_balance: 0,
          ending_balance: 0,
          audit_adjustments: 0,
          reclassifications: 0,
          final_balance: 0,
          is_material: false,
          procedures_completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LeadSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedules(variables.engagementId),
      });
    },
  });
}

/**
 * Auto-generate lead schedules from trial balance
 */
export function useAutoGenerateLeadSchedules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      engagementId: string;
      trialBalanceId: string;
      materialityThreshold: number;
    }) => {
      // Fetch all accounts
      const { data: accounts, error: fetchError } = await supabase
        .from('trial_balance_accounts')
        .select('*')
        .eq('trial_balance_id', params.trialBalanceId);

      if (fetchError) throw fetchError;

      // Group accounts by category
      const categoryGroups = accounts.reduce(
        (acc, account) => {
          const category = account.grouping_category || 'Other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(account);
          return acc;
        },
        {} as Record<string, typeof accounts>
      );

      // Create lead schedules for each category
      const schedules: Array<{
        engagement_id: string;
        schedule_number: string;
        schedule_name: string;
        financial_statement_area: string;
        beginning_balance: number;
        ending_balance: number;
        audit_adjustments: number;
        reclassifications: number;
        final_balance: number;
        is_material: boolean;
        materiality_threshold: number;
        risk_level: string;
        significant_account: boolean;
        procedures_completed: boolean;
      }> = [];

      let scheduleCounter = 1;

      Object.entries(categoryGroups).forEach(([category, categoryAccounts]) => {
        const endingBalance = categoryAccounts.reduce(
          (sum, acc) => sum + (acc.ending_balance || 0),
          0
        );
        const finalBalance = categoryAccounts.reduce(
          (sum, acc) => sum + (acc.final_balance || 0),
          0
        );
        const isMaterial = Math.abs(finalBalance) > params.materialityThreshold;

        // Determine financial statement area
        const firstAccount = categoryAccounts[0];
        let fsArea = 'Balance Sheet';
        if (
          firstAccount.account_type === 'revenue' ||
          firstAccount.account_type === 'expense'
        ) {
          fsArea = 'Income Statement';
        }

        schedules.push({
          engagement_id: params.engagementId,
          schedule_number: `LS-${String(scheduleCounter).padStart(3, '0')}`,
          schedule_name: category,
          financial_statement_area: fsArea,
          beginning_balance: 0,
          ending_balance: endingBalance,
          audit_adjustments: categoryAccounts.reduce(
            (sum, acc) => sum + (acc.audit_adjustments || 0),
            0
          ),
          reclassifications: categoryAccounts.reduce(
            (sum, acc) => sum + (acc.reclassifications || 0),
            0
          ),
          final_balance: finalBalance,
          is_material: isMaterial,
          materiality_threshold: params.materialityThreshold,
          risk_level: isMaterial ? 'high' : 'moderate',
          significant_account: isMaterial,
          procedures_completed: false,
        });

        scheduleCounter++;
      });

      // Insert lead schedules
      const { data: createdSchedules, error: insertError } = await supabase
        .from('lead_schedules')
        .insert(schedules)
        .select();

      if (insertError) throw insertError;

      // Link accounts to lead schedules
      for (const schedule of createdSchedules) {
        const categoryAccounts = categoryGroups[schedule.schedule_name];
        if (categoryAccounts) {
          const accountIds = categoryAccounts.map((a) => a.id);
          await supabase
            .from('trial_balance_accounts')
            .update({
              lead_schedule_id: schedule.id,
              is_mapped: true,
            })
            .in('id', accountIds);
        }
      }

      return createdSchedules as LeadSchedule[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedules(variables.engagementId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.accounts(variables.trialBalanceId),
      });
    },
  });
}

/**
 * Update lead schedule
 */
export function useUpdateLeadSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      leadScheduleId: string;
      engagementId: string;
      updates: Partial<LeadSchedule>;
    }) => {
      const { data, error } = await supabase
        .from('lead_schedules')
        .update(params.updates)
        .eq('id', params.leadScheduleId)
        .select()
        .single();

      if (error) throw error;
      return data as LeadSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedule(variables.leadScheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedules(variables.engagementId),
      });
    },
  });
}

/**
 * Sign off on lead schedule
 */
export function useSignOffLeadSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      leadScheduleId: string;
      engagementId: string;
      userId: string;
      role: 'preparer' | 'reviewer';
    }) => {
      const updateData =
        params.role === 'preparer'
          ? {
              prepared_by: params.userId,
              prepared_at: new Date().toISOString(),
            }
          : {
              reviewed_by: params.userId,
              reviewed_at: new Date().toISOString(),
              procedures_completed: true,
            };

      const { data, error } = await supabase
        .from('lead_schedules')
        .update(updateData)
        .eq('id', params.leadScheduleId)
        .select()
        .single();

      if (error) throw error;
      return data as LeadSchedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedule(variables.leadScheduleId),
      });
      queryClient.invalidateQueries({
        queryKey: trialBalanceKeys.leadSchedules(variables.engagementId),
      });
    },
  });
}

// ============================================
// Variance Analysis
// ============================================

/**
 * Perform variance/flux analysis
 */
export function useVarianceAnalysis(
  trialBalanceId: string,
  materialityThreshold: number
) {
  return useQuery({
    queryKey: trialBalanceKeys.variance(trialBalanceId),
    queryFn: async (): Promise<FluxAnalysisResult> => {
      const { data: accounts, error } = await supabase
        .from('trial_balance_accounts')
        .select('*')
        .eq('trial_balance_id', trialBalanceId);

      if (error) throw error;

      const variances: VarianceAnalysis[] = accounts
        .filter((account) => account.prior_year_balance !== null)
        .map((account) => {
          const variance = account.final_balance - (account.prior_year_balance || 0);
          const variancePercentage = calculateVariancePercentage(
            account.final_balance,
            account.prior_year_balance || 0
          );
          const significant = isSignificantVariance(
            variance,
            variancePercentage,
            materialityThreshold
          );

          return {
            accountId: account.id,
            accountNumber: account.account_number,
            accountName: account.account_name,
            currentBalance: account.final_balance,
            priorBalance: account.prior_year_balance || 0,
            variance,
            variancePercentage,
            isSignificant: significant,
            requiresInvestigation: significant && Math.abs(variancePercentage) > 25,
          };
        });

      return {
        totalAccounts: variances.length,
        significantVariances: variances.filter((v) => v.isSignificant).length,
        investigationRequired: variances.filter((v) => v.requiresInvestigation).length,
        variances: variances.sort(
          (a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage)
        ),
      };
    },
    enabled: !!trialBalanceId && materialityThreshold > 0,
  });
}

// ============================================
// Summary Hook
// ============================================

/**
 * Get trial balance summary for an engagement
 */
export function useTrialBalanceSummary(engagementId: string) {
  const { data: trialBalances, isLoading: tbLoading } = useTrialBalances(engagementId);
  const { data: leadSchedules, isLoading: lsLoading } = useLeadSchedules(engagementId);

  const currentYearTB = trialBalances?.find((tb) => tb.periodType === 'year_end');
  const priorYearTB = trialBalances?.find((tb) => tb.periodType === 'prior_year');

  return {
    isLoading: tbLoading || lsLoading,
    currentYearTrialBalance: currentYearTB,
    priorYearTrialBalance: priorYearTB,
    leadSchedules: leadSchedules || [],
    summary: {
      totalTrialBalances: trialBalances?.length || 0,
      totalLeadSchedules: leadSchedules?.length || 0,
      materialLeadSchedules: leadSchedules?.filter((ls) => ls.isMaterial).length || 0,
      completedProcedures:
        leadSchedules?.filter((ls) => ls.proceduresCompleted).length || 0,
      isBalanced: currentYearTB?.isBalanced ?? true,
      status: currentYearTB?.status || 'draft',
    },
  };
}
