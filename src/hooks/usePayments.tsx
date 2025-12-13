import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export const usePayments = (invoiceId?: string) => {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices!payments_invoice_id_fkey(
            id,
            invoice_number,
            total_amount,
            client:clients(client_name)
          ),
          creator:profiles!payments_created_by_fkey(full_name)
        `)
        .order('payment_date', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: Partial<Payment> & { invoice_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          ...payment,
          created_by: user.id,
        } as any])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Get invoice and total payments
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('id', payment.invoice_id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id);

      if (paymentsError) throw paymentsError;

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      // Update invoice status if fully paid
      if (totalPaid >= invoice.total_amount) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: payment.payment_date,
          })
          .eq('id', payment.invoice_id);

        if (updateError) throw updateError;
      }

      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Payment recorded',
        description: 'The payment has been successfully recorded.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record payment.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-summary'] });
      toast({
        title: 'Payment deleted',
        description: 'The payment has been removed.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete payment.',
        variant: 'destructive',
      });
    },
  });
};
