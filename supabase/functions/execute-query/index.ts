import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "execute-query",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { query, engineType, organizationId } = await req.json();

    if (!query || !engineType || !organizationId) {
      throw new Error("Missing required fields: query, engineType, organizationId");
    }

    const startTime = Date.now();

    // For now, execute all queries directly in Postgres
    // Future: Route to DuckDB for analytical queries
    const { data, error, count } = await supabaseClient
      .rpc('execute_raw_query', { query_text: query });

    const executionTime = Date.now() - startTime;

    if (error) {
      // Log failed execution
      await supabaseClient.from("query_executions").insert({
        user_id: user.id,
        organization_id: organizationId,
        query_text: query,
        engine_type: engineType,
        status: "error",
        error_message: error.message,
        execution_time_ms: executionTime,
      });

      throw error;
    }

    // Log successful execution
    await supabaseClient.from("query_executions").insert({
      user_id: user.id,
      organization_id: organizationId,
      query_text: query,
      engine_type: engineType,
      status: "success",
      execution_time_ms: executionTime,
      rows_returned: data?.length || 0,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data,
        executionTime,
        rowCount: data?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error executing query:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
