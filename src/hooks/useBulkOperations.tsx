import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BulkOperationParams {
  operationType: 'approve_access' | 'deny_access' | 'update_scope' | 'revoke_access';
  targetIds: string[];
  parameters: Record<string, any>;
  dryRun?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  affectedCount: number;
}

export interface OperationProgress {
  total: number;
  processed: number;
  failed: number;
  percentage: number;
  status: 'idle' | 'validating' | 'executing' | 'completed' | 'failed';
}

export interface OperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
  results: Array<{ id: string; status: string; data?: any }>;
  validation?: ValidationResult;
}

export const useBulkOperations = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<OperationProgress>({
    total: 0,
    processed: 0,
    failed: 0,
    percentage: 0,
    status: 'idle'
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setValidationResult(null);
  };

  const validateOperation = async (params: BulkOperationParams): Promise<ValidationResult | null> => {
    setProgress(prev => ({ ...prev, status: 'validating' }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-operations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...params, dryRun: true }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Validation failed');
      }

      setValidationResult(result.validation);
      setProgress(prev => ({ 
        ...prev, 
        status: 'idle',
        total: result.validation.affectedCount 
      }));

      return result.validation;
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
      setProgress(prev => ({ ...prev, status: 'idle' }));
      return null;
    }
  };

  const executeOperation = async (params: BulkOperationParams): Promise<OperationResult | null> => {
    setProgress({
      total: params.targetIds.length,
      processed: 0,
      failed: 0,
      percentage: 0,
      status: 'executing'
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-operations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...params, dryRun: false }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Operation failed');
      }

      setProgress({
        total: params.targetIds.length,
        processed: result.processedCount,
        failed: result.failedCount,
        percentage: 100,
        status: result.success ? 'completed' : 'failed'
      });

      toast({
        title: result.success ? "Bulk Operation Complete" : "Bulk Operation Completed with Errors",
        description: `${result.processedCount} succeeded, ${result.failedCount} failed`,
        variant: result.success ? "default" : "destructive",
      });

      clearSelection();
      return result;
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setProgress(prev => ({ ...prev, status: 'failed' }));
      return null;
    }
  };

  const resetProgress = () => {
    setProgress({
      total: 0,
      processed: 0,
      failed: 0,
      percentage: 0,
      status: 'idle'
    });
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    validateOperation,
    executeOperation,
    progress,
    validationResult,
    resetProgress,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
};
