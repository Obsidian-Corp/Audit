import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        function: 'notify-boundary-decision',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, approved, reason, logDetails } = await req.json();

    console.log('Sending boundary decision notification:', { userId, approved, logDetails });

    // Create notification for the requester
    const notificationTitle = approved 
      ? 'Schema Boundary Access Approved'
      : 'Schema Boundary Access Denied';
    
    const notificationMessage = approved
      ? `Your request to access ${logDetails.target_schema} from ${logDetails.source_schema} has been approved. ${reason ? `Reason: ${reason}` : ''}`
      : `Your request to access ${logDetails.target_schema} from ${logDetails.source_schema} has been denied. Reason: ${reason}`;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title: notificationTitle,
        message: notificationMessage,
        metadata: {
          boundary_decision: {
            approved,
            reason,
            source_schema: logDetails.source_schema,
            target_schema: logDetails.target_schema,
            operation: logDetails.operation,
          }
        }
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw notificationError;
    }

    console.log('Notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in notify-boundary-decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});