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
        function: "check-data-access",
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

    const { resourceType, resourceId, action, organizationId } = await req.json();

    if (!resourceType || !resourceId || !action || !organizationId) {
      throw new Error("Missing required fields");
    }

    // Get resource markings
    let markings: string[] = [];
    
    if (resourceType === "object") {
      const { data: objectMarkings } = await supabaseClient
        .from("codex_object_markings")
        .select(`
          security_markings(name, sensitivity_level)
        `)
        .eq("object_id", resourceId);

      markings = objectMarkings?.map((om: any) => om.security_markings.name) || [];
    } else if (resourceType === "dataset") {
      const { data: datasetMarkings } = await supabaseClient
        .from("dataset_column_markings")
        .select(`
          security_markings(name, sensitivity_level)
        `)
        .eq("dataset_id", resourceId);

      markings = [...new Set(datasetMarkings?.map((dm: any) => dm.security_markings.name) || [])];
    }

    // Get user clearances
    const { data: userClearances } = await supabaseClient
      .from("user_clearances")
      .select(`
        security_markings(name, sensitivity_level)
      `)
      .eq("user_id", user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const clearanceNames = userClearances?.map((uc: any) => uc.security_markings.name) || [];

    // Check if user has all required clearances
    const missingClearances = markings.filter(m => !clearanceNames.includes(m));
    const accessGranted = missingClearances.length === 0;

    // Log access attempt
    await supabaseClient.from("data_access_logs").insert({
      user_id: user.id,
      resource_type: resourceType,
      resource_id: resourceId,
      action,
      markings_accessed: markings,
      access_granted: accessGranted,
      denial_reason: accessGranted ? null : `Missing clearances: ${missingClearances.join(", ")}`,
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      accessed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        accessGranted,
        requiredMarkings: markings,
        userClearances: clearanceNames,
        missingClearances: accessGranted ? [] : missingClearances,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking data access:", error);
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
