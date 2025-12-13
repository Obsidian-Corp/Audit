// Admin Active Sessions Edge Function
// Validates platform admin JWT then returns active access justifications with profile/org info

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatTimeRemaining(expiresAt: string) {
  const now = Date.now()
  const exp = new Date(expiresAt).getTime()
  const diff = Math.max(0, Math.floor((exp - now) / 1000))
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
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

    // Verify platform admin JWT via existing function
    const { data: verify, error: verifyErr } = await supabase.functions.invoke('admin-auth-verify', {
      headers: { Authorization: authHeader },
    })
    if (verifyErr || !verify || !verify.valid) {
      return new Response(JSON.stringify({ error: 'Invalid admin token' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    // Fetch active access sessions
    const { data: justs, error: jErr } = await supabase
      .schema('platform_admin')
      .from('access_justifications')
      .select('id, admin_user_id, target_organization_id, reason, ticket_reference, expires_at, created_at, revoked_at, access_granted')
      .eq('access_granted', true)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
      .limit(100)

    if (jErr) throw jErr

    const userIds = Array.from(new Set((justs || []).map((j: any) => j.admin_user_id).filter(Boolean)))
    const orgIds = Array.from(new Set((justs || []).map((j: any) => j.target_organization_id).filter(Boolean)))

    const [profilesRes, orgsRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('organizations').select('id, name').in('id', orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    const profiles = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]))
    const orgs = new Map<string, any>((orgsRes.data || []).map((o: any) => [o.id, o]))

    const items = (justs || []).map((j: any) => ({
      id: j.id,
      admin_user_id: j.admin_user_id,
      admin_name: profiles.get(j.admin_user_id)?.full_name || null,
      admin_email: profiles.get(j.admin_user_id)?.email || null,
      target_organization_id: j.target_organization_id,
      org_name: orgs.get(j.target_organization_id)?.name || null,
      reason: j.reason,
      ticket_reference: j.ticket_reference,
      expires_at: j.expires_at,
      time_remaining: formatTimeRemaining(j.expires_at),
      created_at: j.created_at,
    }))

    return new Response(JSON.stringify({ sessions: items }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    console.error('admin-active-sessions error', e)
    return new Response(JSON.stringify({ error: 'Internal error', details: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
