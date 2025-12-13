// Admin Access Scopes Edge Function
// Validates platform admin JWT then returns admin access scopes with profile info

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

    const { _admin_id = null } = (await req.json().catch(() => ({ _admin_id: null }))) as { _admin_id?: string | null }

    const query = supabase
      .schema('platform_admin')
      .from('admin_access_scopes')
      .select('id, admin_user_id, scope_type, scope_value, description, is_active, expires_at, created_at, created_by')
      .order('created_at', { ascending: false })

    if (_admin_id) {
      // Filtering after fetch due to limitations on compound queries across schemas
      const { data: all, error: aErr } = await query
      if (aErr) throw aErr
      const filtered = (all || []).filter((s: any) => s.admin_user_id === _admin_id)
      const userIds = Array.from(new Set(filtered.map((s: any) => s.admin_user_id).concat(filtered.map((s: any) => s.created_by)).filter(Boolean)))
      const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
      const profileMap = new Map<string, any>((profs || []).map((p: any) => [p.id, p]))
      const items = filtered.map((s: any) => ({
        id: s.id,
        admin_user_id: s.admin_user_id,
        admin_name: profileMap.get(s.admin_user_id)?.full_name || null,
        admin_email: profileMap.get(s.admin_user_id)?.email || null,
        scope_type: s.scope_type,
        scope_value: s.scope_value,
        description: s.description,
        is_active: s.is_active,
        expires_at: s.expires_at,
        created_at: s.created_at,
        created_by_name: profileMap.get(s.created_by)?.full_name || null,
      }))
      return new Response(JSON.stringify({ scopes: items }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } })
    }

    const { data: scopes, error: sErr } = await query
    if (sErr) throw sErr

    const userIds = Array.from(new Set((scopes || []).map((s: any) => s.admin_user_id).concat((scopes || []).map((s: any) => s.created_by)).filter(Boolean)))
    const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])
    const profileMap = new Map<string, any>((profs || []).map((p: any) => [p.id, p]))

    const items = (scopes || []).map((s: any) => ({
      id: s.id,
      admin_user_id: s.admin_user_id,
      admin_name: profileMap.get(s.admin_user_id)?.full_name || null,
      admin_email: profileMap.get(s.admin_user_id)?.email || null,
      scope_type: s.scope_type,
      scope_value: s.scope_value,
      description: s.description,
      is_active: s.is_active,
      expires_at: s.expires_at,
      created_at: s.created_at,
      created_by_name: profileMap.get(s.created_by)?.full_name || null,
    }))

    return new Response(JSON.stringify({ scopes: items }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (e) {
    console.error('admin-get-scopes error', e)
    return new Response(JSON.stringify({ error: 'Internal error', details: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
  }
})
