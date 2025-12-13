import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        function: "validate-quality",
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

    const { objectId, ruleIds } = await req.json();

    if (!objectId) {
      throw new Error("Missing required field: objectId");
    }

    // Get object with properties
    const { data: object, error: objectError } = await supabaseClient
      .from("codex_objects")
      .select(`
        *,
        codex_object_property_values(
          property_id,
          value,
          codex_properties(*)
        )
      `)
      .eq("id", objectId)
      .single();

    if (objectError) throw objectError;

    // Get quality rules
    let rulesQuery = supabaseClient
      .from("codex_quality_rules")
      .select("*")
      .eq("object_type_id", object.object_type_id)
      .eq("is_active", true);

    if (ruleIds && ruleIds.length > 0) {
      rulesQuery = rulesQuery.in("id", ruleIds);
    }

    const { data: rules, error: rulesError } = await rulesQuery;
    if (rulesError) throw rulesError;

    const violations = [];

    // Validate each rule
    for (const rule of rules) {
      const config = rule.rule_config;

      switch (rule.rule_type) {
        case "completeness": {
          // Check if required properties are present
          const requiredProps = config.required_properties || [];
          for (const propName of requiredProps) {
            const propValue = object.codex_object_property_values?.find(
              (pv: any) => pv.codex_properties.name === propName
            );
            if (!propValue || !propValue.value) {
              violations.push({
                object_id: objectId,
                rule_id: rule.id,
                property_id: propValue?.property_id,
                violation_details: {
                  rule_type: "completeness",
                  message: `Missing required property: ${propName}`,
                  severity: rule.severity,
                },
              });
            }
          }
          break;
        }

        case "range": {
          // Check numeric range
          const propName = config.property_name;
          const min = config.min;
          const max = config.max;
          const propValue = object.codex_object_property_values?.find(
            (pv: any) => pv.codex_properties.name === propName
          );
          if (propValue && propValue.value) {
            const numValue = Number(propValue.value);
            if ((min !== undefined && numValue < min) || (max !== undefined && numValue > max)) {
              violations.push({
                object_id: objectId,
                rule_id: rule.id,
                property_id: propValue.property_id,
                violation_details: {
                  rule_type: "range",
                  message: `Value ${numValue} is outside allowed range [${min}, ${max}]`,
                  severity: rule.severity,
                },
              });
            }
          }
          break;
        }

        case "pattern": {
          // Check regex pattern
          const propName = config.property_name;
          const pattern = config.pattern;
          const propValue = object.codex_object_property_values?.find(
            (pv: any) => pv.codex_properties.name === propName
          );
          if (propValue && propValue.value) {
            const regex = new RegExp(pattern);
            const strValue = String(propValue.value);
            if (!regex.test(strValue)) {
              violations.push({
                object_id: objectId,
                rule_id: rule.id,
                property_id: propValue.property_id,
                violation_details: {
                  rule_type: "pattern",
                  message: `Value does not match pattern: ${pattern}`,
                  severity: rule.severity,
                },
              });
            }
          }
          break;
        }

        case "uniqueness": {
          // Check if value is unique across objects
          const propName = config.property_name;
          const propValue = object.codex_object_property_values?.find(
            (pv: any) => pv.codex_properties.name === propName
          );
          if (propValue && propValue.value) {
            const { data: duplicates } = await supabaseClient
              .from("codex_object_property_values")
              .select("object_id")
              .eq("property_id", propValue.property_id)
              .eq("value", propValue.value)
              .neq("object_id", objectId);

            if (duplicates && duplicates.length > 0) {
              violations.push({
                object_id: objectId,
                rule_id: rule.id,
                property_id: propValue.property_id,
                violation_details: {
                  rule_type: "uniqueness",
                  message: `Duplicate value found`,
                  severity: rule.severity,
                  duplicate_count: duplicates.length,
                },
              });
            }
          }
          break;
        }
      }
    }

    // Insert violations
    if (violations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from("codex_quality_violations")
        .insert(violations);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        violations: violations.length,
        details: violations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error validating quality:", error);
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
