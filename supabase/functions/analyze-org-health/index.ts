import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organizationId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get organization data
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    // Get metrics
    const { data: metrics } = await supabase
      .from("organization_metrics")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    // Get config
    const { data: config } = await supabase
      .from("organization_config")
      .select("*")
      .eq("organization_id", organizationId)
      .single();

    // Get recent health history
    const { data: history } = await supabase
      .from("health_score_history")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(30);

    // Prepare context for AI
    const context = {
      organization: {
        name: org?.name,
        tier: config?.tier,
        status: config?.status,
      },
      current_metrics: {
        health_score: metrics?.health_score,
        active_users: metrics?.active_users_count,
        total_users: metrics?.total_users_count,
        storage_percentage: metrics?.storage_percentage,
        projects_count: metrics?.projects_count,
        last_activity: metrics?.last_activity_at,
        health_issues: metrics?.health_issues,
      },
      limits: config?.global_limits,
      history: history?.slice(0, 7).map((h: any) => ({
        score: h.score,
        date: h.created_at,
      })),
    };

    // Use Lovable AI to analyze and generate recommendations
    const systemPrompt = `You are an expert SaaS platform health analyst. Analyze organization metrics and provide actionable recommendations.

Your task is to:
1. Identify health concerns and declining trends
2. Prioritize issues by severity (low, medium, high, critical)
3. Provide specific, actionable recommendations
4. Suggest proactive measures

Be concise, specific, and actionable. Focus on metrics that matter most.`;

    const userPrompt = `Analyze this organization's health:

${JSON.stringify(context, null, 2)}

Provide:
1. Key health concerns (if any)
2. Trend analysis (improving, stable, declining)
3. Top 3-5 specific recommendations with priority
4. Any alerts that should be created`;

    if (!lovableApiKey) {
      // Return basic analysis without AI
      return new Response(
        JSON.stringify({
          analysis: {
            concerns: metrics?.health_issues || [],
            trend: "stable",
            recommendations: [
              {
                priority: "medium",
                title: "Monitor usage patterns",
                description: "Keep an eye on user activity and storage usage",
              },
            ],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_health_analysis",
              description: "Provide structured health analysis and recommendations",
              parameters: {
                type: "object",
                properties: {
                  concerns: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        description: { type: "string" },
                      },
                      required: ["type", "severity", "description"],
                    },
                  },
                  trend: {
                    type: "string",
                    enum: ["improving", "stable", "declining", "critical_decline"],
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        actions: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["priority", "title", "description"],
                    },
                  },
                  alerts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        alert_type: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
                        title: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["alert_type", "severity", "title", "description"],
                    },
                  },
                },
                required: ["concerns", "trend", "recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_health_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const analysis = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    if (!analysis) {
      throw new Error("Failed to parse AI analysis");
    }

    // Create alerts if needed
    if (analysis.alerts && analysis.alerts.length > 0) {
      for (const alert of analysis.alerts) {
        await supabase.from("health_alerts").insert({
          organization_id: organizationId,
          alert_type: alert.alert_type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          recommendations: analysis.recommendations.filter(
            (r: any) => r.priority === alert.severity
          ),
        });
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
