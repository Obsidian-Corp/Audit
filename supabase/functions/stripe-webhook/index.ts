import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.0.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    });
  }

  console.log('Stripe event:', event.type);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case 'payment_method.attached':
      await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
      break;

    case 'customer.created':
    case 'customer.updated':
      await handleCustomerUpdate(event.data.object as Stripe.Customer);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organization_subscriptions')
    .upsert({
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id'
    });

  if (error) console.error('Error updating subscription:', error);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) console.error('Error deleting subscription:', error);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Update invoice status
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      amount_paid_cents: invoice.amount_paid,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  if (invoiceError) console.error('Error updating invoice:', invoiceError);

  // Resolve any payment failures
  const { data: stripeCustomer } = await supabase
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (stripeCustomer) {
    await supabase
      .from('payment_failures')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', stripeCustomer.organization_id)
      .eq('stripe_invoice_id', invoice.id);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Get organization
  const { data: stripeCustomer } = await supabase
    .from('stripe_customers')
    .select('organization_id')
    .eq('stripe_customer_id', invoice.customer as string)
    .single();

  if (!stripeCustomer) return;

  // Create payment failure record
  const { error } = await supabase
    .from('payment_failures')
    .insert({
      organization_id: stripeCustomer.organization_id,
      stripe_invoice_id: invoice.id,
      failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
      failure_code: invoice.last_finalization_error?.code || 'unknown',
      retry_count: 0,
      next_retry_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });

  if (error) console.error('Error creating payment failure:', error);

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      status: 'open',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_invoice_id', invoice.id);

  // TODO: Send payment failure email
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const { error } = await supabase
    .from('payment_methods')
    .upsert({
      stripe_customer_id: paymentMethod.customer as string,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
      brand: paymentMethod.card?.brand,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_payment_method_id'
    });

  if (error) console.error('Error saving payment method:', error);
}

async function handleCustomerUpdate(customer: Stripe.Customer) {
  const { error } = await supabase
    .from('stripe_customers')
    .update({
      email: customer.email,
      default_payment_method_id: customer.invoice_settings.default_payment_method as string,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);

  if (error) console.error('Error updating customer:', error);
}
