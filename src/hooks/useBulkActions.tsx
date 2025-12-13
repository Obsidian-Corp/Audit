import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useBulkActions = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
  };

  const bulkApprove = async (reason: string) => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          supabase.rpc('approve_schema_boundary', {
            _log_id: id,
            _approved: true,
            _reason: reason,
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      toast({
        title: "Bulk Approval Complete",
        description: `${succeeded} approved, ${failed} failed`,
      });

      clearSelection();
      return { succeeded, failed };
    } catch (error) {
      console.error('Bulk approve error:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk approval",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const bulkDeny = async (reason: string) => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          supabase.rpc('approve_schema_boundary', {
            _log_id: id,
            _approved: false,
            _reason: reason,
          })
        )
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      toast({
        title: "Bulk Denial Complete",
        description: `${succeeded} denied, ${failed} failed`,
      });

      clearSelection();
      return { succeeded, failed };
    } catch (error) {
      console.error('Bulk deny error:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk denial",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    bulkApprove,
    bulkDeny,
    isProcessing,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
};
