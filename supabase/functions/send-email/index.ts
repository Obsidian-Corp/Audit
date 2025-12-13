import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateKey, to, variables } = await req.json();
    console.log('Sending email with template:', templateKey, 'to:', to);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get template from platform_admin schema
    console.log('Fetching template from database...');
    const { data: templates, error: templateError } = await supabase
      .rpc('get_email_template', { p_template_key: templateKey });

    console.log('Template fetch result:', { templates, templateError });

    if (templateError) {
      console.error('Template fetch error:', templateError);
      throw new Error(`Template error: ${templateError.message}`);
    }

    if (!templates || templates.length === 0) {
      console.error('Template not found or empty:', templateKey);
      throw new Error(`Template ${templateKey} not found`);
    }

    const template = templates[0];
    console.log('Template loaded successfully');

    // Render template with variables
    const subject = renderTemplate(template.subject, variables);
    const htmlBody = renderTemplate(template.html_body, variables);
    const textBody = renderTemplate(template.text_body, variables);

    // Send email via Resend (if API key is configured)
    let messageId = 'simulated-' + crypto.randomUUID();
    let status = 'sent';
    let errorMessage = null;

    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        console.log('Sending email via Resend to:', to);
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: Deno.env.get('EMAIL_FROM') || 'Platform <noreply@platform.com>',
            to,
            subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        const resendData = await resendResponse.json();
        console.log('Resend response status:', resendResponse.status);
        console.log('Resend response data:', resendData);

        if (!resendResponse.ok) {
          console.error('Resend API error:', resendData);
          throw new Error(resendData.message || JSON.stringify(resendData));
        }

        messageId = resendData.id;
        console.log('Email sent successfully, message ID:', messageId);
      } catch (error) {
        status = 'failed';
        errorMessage = error.message;
        console.error('Resend API error:', error);
      }
    } else {
      console.log('RESEND_API_KEY not configured, simulating email send');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', htmlBody.substring(0, 200) + '...');
    }

    // Log sent email (don't let this fail the whole request)
    try {
      console.log('Logging email to database...');
      const { error: logError } = await supabase
        .from('email_sent_log')
        .insert({
          template_key: templateKey,
          recipient_email: to,
          subject,
          status,
          provider_message_id: messageId,
          error_message: errorMessage,
          metadata: { variables },
        });

      if (logError) {
        console.error('Failed to log email:', logError);
      }
    } catch (e) {
      console.error('Exception logging email:', e);
    }

    // Update analytics (don't let this fail the whole request)
    try {
      console.log('Updating analytics...');
      const { error: analyticsError } = await supabase.rpc('increment_email_analytics', {
        _template_key: templateKey,
        _metric: status === 'sent' ? 'sent_count' : 'failed_count',
      });

      if (analyticsError) {
        console.error('Failed to update analytics:', analyticsError);
      }
    } catch (e) {
      console.error('Exception updating analytics:', e);
    }

    console.log('Returning response, status:', status);
    return new Response(
      JSON.stringify({
        success: status === 'sent',
        messageId,
        error: errorMessage
      }),
      {
        status: status === 'sent' ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function renderTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return '';

  return template.replace(/\{\{(\w+\.?\w+)\}\}/g, (match, key) => {
    const keys = key.split('.');
    let value: any = variables;

    for (const k of keys) {
      value = value?.[k];
    }

    return value !== undefined && value !== null ? String(value) : match;
  });
}
