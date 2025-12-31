/**
 * ==================================================================
 * EXCEL IMPORT HOOKS
 * ==================================================================
 * React hooks for importing Excel files into the audit platform
 * ==================================================================
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  importTrialBalance,
  importChartOfAccounts,
  importAdjustments,
  previewExcelFile,
  ExcelImportResult,
  TrialBalanceRow,
  ChartOfAccountsRow,
  AdjustmentRow,
} from '@/lib/excel-import';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============================================
// Types
// ============================================

interface ImportState {
  step: 'upload' | 'preview' | 'mapping' | 'importing' | 'complete' | 'error';
  file: File | null;
  preview: {
    sheets: string[];
    headers: string[];
    rows: unknown[][];
  } | null;
  selectedSheet: string | null;
  mapping: Record<string, string | number> | null;
  result: ExcelImportResult<unknown> | null;
  error: string | null;
}

// ============================================
// useExcelPreview Hook
// ============================================

export function useExcelPreview() {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: {
      sheets: string[];
      preview: { headers: string[]; rows: unknown[][] };
      fileInfo: { name: string; size: number; type: string };
    } | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const preview = useCallback(async (file: File, options?: { rows?: number; sheetName?: string }) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await previewExcelFile(file, options);
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState({ loading: false, error: String(error), data: null });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    preview,
    reset,
  };
}

// ============================================
// useTrialBalanceImport Hook
// ============================================

export function useTrialBalanceImport(engagementId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    preview: null,
    selectedSheet: null,
    mapping: null,
    result: null,
    error: null,
  });

  const setFile = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, step: 'preview', file, error: null }));

    try {
      const previewData = await previewExcelFile(file);
      setState((prev) => ({
        ...prev,
        preview: {
          sheets: previewData.sheets,
          headers: previewData.preview.headers,
          rows: previewData.preview.rows,
        },
        selectedSheet: previewData.sheets[0],
        step: 'mapping',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: `Failed to read file: ${error}`,
      }));
    }
  }, []);

  const setSelectedSheet = useCallback(async (sheetName: string) => {
    if (!state.file) return;

    setState((prev) => ({ ...prev, selectedSheet: sheetName }));

    try {
      const previewData = await previewExcelFile(state.file, { sheetName });
      setState((prev) => ({
        ...prev,
        preview: {
          ...prev.preview!,
          headers: previewData.preview.headers,
          rows: previewData.preview.rows,
        },
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load sheet: ${error}`,
        variant: 'destructive',
      });
    }
  }, [state.file, toast]);

  const setMapping = useCallback((mapping: Record<string, string | number>) => {
    setState((prev) => ({ ...prev, mapping }));
  }, []);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!state.file) throw new Error('No file selected');

      setState((prev) => ({ ...prev, step: 'importing' }));

      const result = await importTrialBalance(state.file, {
        sheetName: state.selectedSheet || undefined,
        mapping: state.mapping || undefined,
        autoDetect: !state.mapping,
      });

      return result;
    },
    onSuccess: async (result) => {
      if (!result.success && result.errors.length > 0) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          result: result as ExcelImportResult<unknown>,
          error: `Import completed with ${result.errors.length} errors`,
        }));
        toast({
          title: 'Import Completed with Errors',
          description: `${result.summary.successfulRows} rows imported, ${result.summary.failedRows} failed`,
          variant: 'destructive',
        });
        return;
      }

      // Save to database
      try {
        // First, create or get trial balance record
        const { data: tbRecord, error: tbError } = await supabase
          .from('trial_balances')
          .insert({
            engagement_id: engagementId,
            period_type: 'year_end',
            period_end_date: new Date().toISOString().split('T')[0],
            status: 'draft',
            total_debits: result.data.reduce((sum, row) => sum + row.debit, 0),
            total_credits: result.data.reduce((sum, row) => sum + row.credit, 0),
          })
          .select()
          .single();

        if (tbError) throw tbError;

        // Insert accounts
        const accounts = result.data.map((row, index) => ({
          trial_balance_id: tbRecord.id,
          engagement_id: engagementId,
          account_number: row.accountNumber,
          account_name: row.accountName,
          unadjusted_balance: row.balance,
          adjustments: 0,
          reclassifications: 0,
          final_balance: row.balance,
          account_type: row.accountType || null,
          fs_caption: row.fsCaption || null,
          sort_order: index,
        }));

        const { error: accountsError } = await supabase
          .from('trial_balance_accounts')
          .insert(accounts);

        if (accountsError) throw accountsError;

        setState((prev) => ({
          ...prev,
          step: 'complete',
          result: result as ExcelImportResult<unknown>,
        }));

        queryClient.invalidateQueries({ queryKey: ['trial-balance', engagementId] });
        queryClient.invalidateQueries({ queryKey: ['trial-balance-accounts', engagementId] });

        toast({
          title: 'Import Successful',
          description: `${result.summary.successfulRows} accounts imported successfully`,
        });
      } catch (dbError) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          error: `Failed to save to database: ${dbError}`,
        }));
        toast({
          title: 'Database Error',
          description: 'Failed to save imported data',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: String(error),
      }));
      toast({
        title: 'Import Failed',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      preview: null,
      selectedSheet: null,
      mapping: null,
      result: null,
      error: null,
    });
  }, []);

  return {
    state,
    setFile,
    setSelectedSheet,
    setMapping,
    startImport: importMutation.mutate,
    isImporting: importMutation.isPending,
    reset,
  };
}

// ============================================
// useChartOfAccountsImport Hook
// ============================================

export function useChartOfAccountsImport(engagementId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await importChartOfAccounts(file);
      return result;
    },
    onSuccess: async (result) => {
      if (result.errors.length > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `${result.summary.successfulRows} accounts imported, ${result.summary.failedRows} failed`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `${result.summary.successfulRows} accounts imported`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts', engagementId] });
      return result;
    },
    onError: (error) => {
      toast({
        title: 'Import Failed',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  return {
    importFile: importMutation.mutate,
    importFileAsync: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    result: importMutation.data,
    error: importMutation.error,
  };
}

// ============================================
// useAdjustmentsImport Hook
// ============================================

export function useAdjustmentsImport(engagementId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await importAdjustments(file);

      if (result.errors.length === 0 && result.data.length > 0) {
        // Save to database
        const adjustments = result.data.map((adj, index) => ({
          engagement_id: engagementId,
          adjustment_number: `AJE-${String(index + 1).padStart(3, '0')}`,
          description: adj.description,
          debit_account: adj.debitAccount,
          debit_amount: adj.debitAmount,
          credit_account: adj.creditAccount,
          credit_amount: adj.creditAmount,
          reference: adj.reference || null,
          status: 'proposed',
          type: 'correcting',
        }));

        const { error } = await supabase
          .from('audit_adjustments')
          .insert(adjustments);

        if (error) throw error;
      }

      return result;
    },
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        toast({
          title: 'Import Completed with Errors',
          description: `${result.summary.successfulRows} adjustments imported, ${result.summary.failedRows} failed`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Import Successful',
          description: `${result.summary.successfulRows} adjustments imported`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['audit-adjustments', engagementId] });
    },
    onError: (error) => {
      toast({
        title: 'Import Failed',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  return {
    importFile: importMutation.mutate,
    importFileAsync: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    result: importMutation.data,
    error: importMutation.error,
  };
}
