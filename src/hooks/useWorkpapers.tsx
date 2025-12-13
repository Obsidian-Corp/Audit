import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Workpaper {
  id: string;
  audit_id: string;
  firm_id: string;
  title: string;
  workpaper_type: string;
  reference_number: string;
  content: any;
  status: 'draft' | 'in_review' | 'approved' | 'rejected';
  prepared_by: string;
  prepared_date: string;
  reviewed_by?: string;
  reviewed_date?: string;
  attachments?: any[];
  program_id?: string;
  created_at: string;
  updated_at: string;
  parent_id?: string; // For folder hierarchy
}

export function useWorkpapers(auditId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workpapers, isLoading } = useQuery({
    queryKey: ['workpapers', auditId],
    queryFn: async () => {
      if (!auditId) return [];

      const { data, error } = await supabase
        .from('audit_workpapers')
        .select('*')
        .eq('audit_id', auditId)
        .order('reference_number', { ascending: true });

      if (error) throw error;
      return data as Workpaper[];
    },
    enabled: !!auditId,
  });

  const createWorkpaper = useMutation({
    mutationFn: async (newWorkpaper: Partial<Workpaper>) => {
      const insertData: any = {
        audit_id: auditId,
        firm_id: '00000000-0000-0000-0000-000000000000',
        title: newWorkpaper.title || 'Untitled',
        workpaper_type: newWorkpaper.workpaper_type || 'analysis',
        reference_number: newWorkpaper.reference_number || `WP-${Date.now()}`,
        content: newWorkpaper.content || {},
        prepared_by: null,
        prepared_date: new Date().toISOString().split('T')[0],
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('audit_workpapers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', auditId] });
      toast({
        title: 'Workpaper created',
        description: 'The workpaper has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateWorkpaper = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Workpaper> }) => {
      const { data, error } = await supabase
        .from('audit_workpapers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', auditId] });
      toast({
        title: 'Workpaper updated',
        description: 'The workpaper has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const submitForReview = useMutation({
    mutationFn: async (workpaperId: string) => {
      const { data, error } = await supabase
        .from('audit_workpapers')
        .update({ status: 'in_review' })
        .eq('id', workpaperId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', auditId] });
      toast({
        title: 'Submitted for review',
        description: 'The workpaper has been submitted for review.',
      });
    },
  });

  const approveWorkpaper = useMutation({
    mutationFn: async (workpaperId: string) => {
      const { data, error } = await supabase
        .from('audit_workpapers')
        .update({
          status: 'approved',
          reviewed_by: null,
          reviewed_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', workpaperId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', auditId] });
      toast({
        title: 'Workpaper approved',
        description: 'The workpaper has been approved.',
      });
    },
  });

  const rejectWorkpaper = useMutation({
    mutationFn: async ({ workpaperId, reason }: { workpaperId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('audit_workpapers')
        .update({
          status: 'rejected',
          reviewed_by: null,
          reviewed_date: new Date().toISOString().split('T')[0],
          content: {
            rejection_reason: reason,
          },
        })
        .eq('id', workpaperId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workpapers', auditId] });
      toast({
        title: 'Workpaper rejected',
        description: 'The workpaper has been rejected and returned for revision.',
      });
    },
  });

  return {
    workpapers: workpapers || [],
    isLoading,
    createWorkpaper: createWorkpaper.mutate,
    updateWorkpaper: updateWorkpaper.mutate,
    submitForReview: submitForReview.mutate,
    approveWorkpaper: approveWorkpaper.mutate,
    rejectWorkpaper: rejectWorkpaper.mutate,
  };
}
