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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, created_at');

    if (orgsError) throw orgsError;

    const predictions = [];

    for (const org of orgs || []) {
      // Calculate churn risk based on various factors
      const features = await calculateFeatures(supabase, org.id);
      const prediction = calculateChurnScore(features);

      predictions.push({
        organization_id: org.id,
        prediction_type: 'churn',
        entity_type: 'organization',
        entity_id: org.id,
        prediction_score: prediction.score,
        confidence: prediction.confidence,
        features: features,
        prediction_details: {
          risk_level: prediction.riskLevel,
          contributing_factors: prediction.factors,
          recommendations: prediction.recommendations
        },
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Insert predictions
    const { error: insertError } = await supabase
      .from('platform_admin.ml_predictions')
      .insert(predictions);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        processed: orgs?.length || 0,
        high_risk: predictions.filter(p => p.prediction_score > 0.7).length,
        predictions: predictions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function calculateFeatures(supabase: any, orgId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Activity metrics
  const { count: recentActivity } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', sevenDaysAgo.toISOString());

  const { count: monthActivity } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  // User engagement
  const { count: activeUsers } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  // Project activity
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['planning', 'in_progress']);

  return {
    recent_activity: recentActivity || 0,
    month_activity: monthActivity || 0,
    active_users: activeUsers || 0,
    active_projects: activeProjects || 0,
    activity_trend: monthActivity ? (recentActivity || 0) / monthActivity : 0
  };
}

function calculateChurnScore(features: any) {
  // Simple ML-like scoring based on features
  let score = 0;
  let factors = [];
  let recommendations = [];

  // Low activity signals churn
  if (features.recent_activity < 10) {
    score += 0.3;
    factors.push('Very low recent activity');
    recommendations.push('Increase user engagement through tutorials or support');
  }

  // Declining activity trend
  if (features.activity_trend < 0.5) {
    score += 0.25;
    factors.push('Declining activity trend');
    recommendations.push('Schedule check-in call with admin');
  }

  // Few active users
  if (features.active_users < 3) {
    score += 0.2;
    factors.push('Low user adoption');
    recommendations.push('Provide onboarding assistance');
  }

  // No active projects
  if (features.active_projects === 0) {
    score += 0.25;
    factors.push('No active projects');
    recommendations.push('Help create initial projects');
  }

  score = Math.min(score, 1.0);
  
  const riskLevel = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
  const confidence = Math.max(0.6, Math.min(0.95, 0.7 + (features.month_activity / 100)));

  return {
    score,
    confidence,
    riskLevel,
    factors,
    recommendations
  };
}
