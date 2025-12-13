// Admin Emergency Access Log Edge Function
// Validates platform admin JWT then returns emergency access entries with profile/org info

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Verify platform admin JWT
    const { data: verify, error: verifyErr } = await supabase.functions.invoke('admin-auth-verify', {
      headers: { Authorization: authHeader },
    })
    if (verifyErr || !verify || !verify.valid) {
      return new Response(JSON.stringify({ error: 'Invalid admin token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { _limit = 50 } = (await req.json().catch(() => ({ _limit: 50 }))) as { _limit?: number }

    const { data: logs, error: lErr } = await supabase
      .schema('platform_admin')
      .from('emergency_access_log')
      .select('id, admin_user_id, target_organization_id, reason, incident_ticket, access_started_at, access_ended_at, actions_taken, created_at')
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(_limit, 1), 200))

    if (lErr) throw lErr

    const userIds = Array.from(new Set((logs || []).map((r: any) => r.admin_user_id).filter(Boolean)))
    const orgIds = Array.from(new Set((logs || []).map((r: any) => r.target_organization_id).filter(Boolean)))

    const [profilesRes, orgsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('organizations').select('id, name').in('id', orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    const profiles = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]))
    const orgs = new Map<string, any>((orgsRes.data || []).map((o: any) => [o.id, o]))

    const items = (logs || []).map((r: any) => ({
      id: r.id,
      admin_user_id: r.admin_user_id,
      admin_name: profiles.get(r.admin_user_id)?.full_name || null,
      admin_email: profiles.get(r.admin_user_id)?.email || null,
      target_organization_id: r.target_organization_id,
      org_name: orgs.get(r.target_organization_id)?.name || null,
      reason: r.reason,
      incident_ticket: r.incident_ticket,
      access_started_at: r.access_started_at,
      access_ended_at: r.access_ended_at,
      duration_minutes: r.access_ended_at ? (new Date(r.access_ended_at).getTime() - new Date(r.access_started_at).getTime()) / 60000 : null,
      actions_taken: r.actions_taken,
      created_at: r.created_at,
    }))

    return new Response(JSON.stringify({ logs: items }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    console.error('admin-emergency-log error', e)
    return new Response(JSON.stringify({ error: 'Internal error', details: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
