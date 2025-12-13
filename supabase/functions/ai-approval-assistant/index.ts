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

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        function: 'ai-approval-assistant',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { requestId, requestType } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request details
    const { data: request, error: requestError } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    // Get user history
    const { data: userHistory } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('approved')
      .eq('user_id', request.user_id)
      .not('approved_by', 'is', null);

    const totalRequests = userHistory?.length || 0;
    const approvedRequests = userHistory?.filter((r: any) => r.approved).length || 0;
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Get similar requests
    const { data: similarRequests } = await supabase
      .from('platform_admin.schema_boundary_logs')
      .select('approved')
      .eq('source_schema', request.source_schema)
      .eq('target_schema', request.target_schema)
      .eq('operation', request.operation)
      .not('approved_by', 'is', null)
      .limit(20);

    const similarApproved = similarRequests?.filter((r: any) => r.approved).length || 0;
    const similarTotal = similarRequests?.length || 0;

    // Build context for AI
    const context = `
User Context:
- Approval Rate: ${approvalRate.toFixed(1)}%
- Total Previous Requests: ${totalRequests}
- Previous Approvals: ${approvedRequests}

Request Details:
- Operation: ${request.operation}
- Source Schema: ${request.source_schema}
- Target Schema: ${request.target_schema}
- Data Classification: ${request.data_classification || 'unclassified'}

Similar Requests History:
- Total Similar: ${similarTotal}
- Approved: ${similarApproved}
- Approval Rate: ${similarTotal > 0 ? ((similarApproved / similarTotal) * 100).toFixed(1) : 0}%
`;

    const prompt = `You are a security analyst reviewing a data access request. Analyze the following context and provide a recommendation.

${context}

Provide your analysis in this exact JSON format:
{
  "recommendation": "APPROVE" | "DENY" | "DEFER",
  "confidence": <number 0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "riskFactors": ["<factor1>", "<factor2>"]
}

Consider:
- User's approval history
- Data classification sensitivity
- Similar request patterns
- Security best practices

Respond with ONLY the JSON, no additional text.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('AI Gateway request failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const suggestion = JSON.parse(content);

    // Store suggestion in database
    await supabase
      .from('platform_admin.ai_approval_suggestions')
      .insert({
        request_id: requestId,
        request_type: requestType,
        recommendation: suggestion.recommendation,
        confidence_score: suggestion.confidence,
        reasoning: suggestion.reasoning,
        risk_factors: suggestion.riskFactors,
        model_version: 'gemini-2.5-pro',
      });

    return new Response(
      JSON.stringify({ suggestion }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as any)?.message ?? String(error) }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
