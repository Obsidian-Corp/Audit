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
        function: "execute-transform",
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

    const { transformId, triggerType = "manual" } = await req.json();

    if (!transformId) {
      throw new Error("Missing required field: transformId");
    }

    // Get transform
    const { data: transform, error: transformError } = await supabaseClient
      .from("transforms")
      .select("*, transform_repositories(*)")
      .eq("id", transformId)
      .single();

    if (transformError) throw transformError;
    if (!transform.is_active) {
      throw new Error("Transform is not active");
    }

    // Create execution run
    const { data: run, error: runError } = await supabaseClient
      .from("transform_runs")
      .insert({
        transform_id: transformId,
        status: "running",
        started_at: new Date().toISOString(),
        triggered_by: user.id,
        trigger_type: triggerType,
      })
      .select()
      .single();

    if (runError) throw runError;

    try {
      const startTime = Date.now();
      let rowsAffected = 0;

      // Execute based on transform type
      if (transform.transform_type === "sql") {
        // Execute SQL transform
        const { count, error: execError } = await supabaseClient
          .rpc('execute_raw_query', { query_text: transform.code });

        if (execError) throw execError;
        rowsAffected = count || 0;
      } else if (transform.transform_type === "python") {
        // Python transforms would need a separate execution environment
        throw new Error("Python transforms not yet supported");
      }

      const executionTime = Date.now() - startTime;

      // Update run with success
      await supabaseClient
        .from("transform_runs")
        .update({
          status: "success",
          completed_at: new Date().toISOString(),
          rows_affected: rowsAffected,
        })
        .eq("id", run.id);

      // Save checkpoint for incremental builds
      if (transform.is_incremental && transform.incremental_key) {
        await supabaseClient
          .from("transform_checkpoints")
          .insert({
            transform_id: transformId,
            checkpoint_value: new Date().toISOString(),
            checkpoint_type: "timestamp",
          });
      }

      return new Response(
        JSON.stringify({
          success: true,
          runId: run.id,
          executionTime,
          rowsAffected,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (execError) {
      // Update run with failure
      const errorMsg = execError instanceof Error ? execError.message : String(execError);
      await supabaseClient
        .from("transform_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMsg,
        })
        .eq("id", run.id);

      throw execError;
    }
  } catch (error) {
    console.error("Error executing transform:", error);
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
