import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Invoice {
  id: string;
  firm_id: string;
  engagement_id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  subtotal: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paid_date?: string;
  payment_terms?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  time_entry_id?: string;
}

export interface InvoiceFilters {
  client_id?: string;
  engagement_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export const useInvoices = (filters?: InvoiceFilters) => {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          client:clients!invoices_client_id_fkey(id, client_name, client_code),
          engagement:audits!invoices_engagement_id_fkey(id, audit_title, audit_number),
          creator:profiles!invoices_created_by_fkey(id, full_name)
        `)
        .order('invoice_date', { ascending: false });

      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.engagement_id) {
        query = query.eq('engagement_id', filters.engagement_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.start_date) {
        query = query.gte('invoice_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('invoice_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });
};

export const useInvoiceDetails = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients!invoices_client_id_fkey(*),
          engagement:audits!invoices_engagement_id_fkey(*, clients(client_name)),
          line_items:invoice_line_items(*),
          payments:payments(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
};

export const useInvoiceSummary = () => {
  return useQuery({
    queryKey: ['invoice-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, status, due_date');

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      const summary = {
        total_outstanding: data
          .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
          .reduce((sum, i) => sum + i.total_amount, 0),
        total_overdue: data
          .filter(i => i.status !== 'paid' && i.due_date < today)
          .reduce((sum, i) => sum + i.total_amount, 0),
        total_paid: data
          .filter(i => i.status === 'paid')
          .reduce((sum, i) => sum + i.total_amount, 0),
        draft_count: data.filter(i => i.status === 'draft').length,
        sent_count: data.filter(i => i.status === 'sent').length,
        overdue_count: data.filter(i => i.status !== 'paid' && i.due_date < today).length,
      };

      return summary;
    },
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newInvoice: Partial<Invoice>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoices')
        .insert([{
          ...newInvoice,
          created_by: user.id,
          status: newInvoice.status || 'draft',
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Invoice created',
        description: 'The invoice has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Invoice> }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Invoice updated',
        description: 'The invoice has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Invoice deleted',
        description: 'The invoice has been deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice.',
        variant: 'destructive',
      });
    },
  });
};

export const useGenerateInvoiceFromTime = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      engagement_id,
      start_date,
      end_date,
      include_non_billable = false,
    }: {
      engagement_id: string;
      start_date: string;
      end_date: string;
      include_non_billable?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get approved time entries for the engagement
      let query = supabase
        .from('time_entries')
        .select('*, user:profiles!time_entries_user_id_fkey(full_name)')
        .eq('engagement_id', engagement_id)
        .eq('status', 'approved')
        .gte('entry_date', start_date)
        .lte('entry_date', end_date);

      if (!include_non_billable) {
        query = query.eq('is_billable', true);
      }

      const { data: timeEntries, error: timeError } = await query;
      if (timeError) throw timeError;

      if (!timeEntries || timeEntries.length === 0) {
        throw new Error('No approved time entries found for this period');
      }

      // Get engagement and client details
      const { data: engagement, error: engError } = await supabase
        .from('audits')
        .select('*, clients(id, client_name)')
        .eq('id', engagement_id)
        .single();

      if (engError) throw engError;

      // Calculate totals
      const subtotal = timeEntries.reduce((sum, entry) => sum + (entry.billable_amount || 0), 0);

      // Generate invoice number (simple incrementing for now)
      const { data: lastInvoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoice_number.split('-')[1]) : 0;
      const invoiceNumber = `INV-${String(lastNumber + 1).padStart(5, '0')}`;

      // Create invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([{
          engagement_id,
          client_id: engagement.clients.id,
          invoice_number: invoiceNumber,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          subtotal,
          total_amount: subtotal,
          status: 'draft',
          created_by: user.id,
        }])
        .select()
        .single();

      if (invError) throw invError;

      // Create line items from time entries
      const lineItems = timeEntries.map(entry => ({
        invoice_id: invoice.id,
        description: `${entry.user.full_name} - ${entry.task_description || 'Time entry'} (${entry.hours} hours)`,
        quantity: entry.hours,
        unit_price: entry.hourly_rate || 0,
        total_amount: entry.billable_amount || 0,
        time_entry_id: entry.id,
      }));

      const { error: lineError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems);

      if (lineError) throw lineError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Invoice generated',
        description: 'Invoice has been created from approved time entries.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice.',
        variant: 'destructive',
      });
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Invoice sent',
        description: 'The invoice has been marked as sent.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice.',
        variant: 'destructive',
      });
    },
  });
};
