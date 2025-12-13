// =============================================================================
// Edge Function: calculate-materiality
// Description: Calculates overall materiality, performance materiality, and clearly trivial threshold
// With comprehensive input validation using Zod (BUG-026)
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schema
const materialityRequestSchema = z.object({
  engagementId: z.string().uuid('Invalid engagement ID format'),
  benchmarkType: z.enum([
    'total_assets',
    'total_revenue',
    'gross_profit',
    'net_income',
    'total_equity',
    'custom'
  ]),
  benchmarkAmount: z.number().positive('Benchmark amount must be greater than 0'),
  percentage: z.number().min(0.1).max(10, 'Percentage must be between 0.1% and 10%'),
  componentAllocations: z.array(
    z.object({
      component: z.string().min(1, 'Component name is required'),
      amount: z.number().positive('Component amount must be positive'),
      percentage: z.number().min(0).max(100, 'Component percentage must be between 0 and 100')
    })
  ).optional(),
  rationale: z.string().max(1000, 'Rationale must be less than 1000 characters').optional(),
  customBenchmarkName: z.string().optional()
}).refine(
  (data) => data.benchmarkType !== 'custom' || data.customBenchmarkName,
  { message: "Custom benchmark name required when benchmark type is 'custom'" }
)

type MaterialityRequest = z.infer<typeof materialityRequestSchema>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    )

    // Parse and validate request body
    let validatedData: MaterialityRequest
    try {
      const body = await req.json()
      validatedData = materialityRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: error.errors.map(e => ({
              path: e.path.join('.'),
              message: e.message
            }))
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw error
    }

    // Verify user has access to engagement
    const { data: engagement, error: engError } = await supabase
      .from('engagements')
      .select('id, firm_id, client_id, engagement_type, status')
      .eq('id', validatedData.engagementId)
      .single()

    if (engError || !engagement) {
      return new Response(
        JSON.stringify({ error: 'Engagement not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if engagement is in a valid status for materiality calculation
    if (engagement.status === 'completed' || engagement.status === 'on_hold') {
      return new Response(
        JSON.stringify({
          error: 'Cannot calculate materiality for completed or on-hold engagements'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate materiality values with proper rounding
    const overallMateriality = Math.round(
      validatedData.benchmarkAmount * (validatedData.percentage / 100) * 100
    ) / 100

    const performanceMateriality = Math.round(
      overallMateriality * 0.75 * 100
    ) / 100

    const clearlyTrivial = Math.round(
      overallMateriality * 0.05 * 100
    ) / 100

    // Validate component allocations if provided
    if (validatedData.componentAllocations && validatedData.componentAllocations.length > 0) {
      const totalAllocation = validatedData.componentAllocations.reduce(
        (sum, comp) => sum + comp.amount, 0
      )

      if (Math.abs(totalAllocation - overallMateriality) > 0.01) {
        return new Response(
          JSON.stringify({
            error: 'Component allocations must sum to overall materiality',
            details: {
              totalAllocation,
              overallMateriality,
              difference: Math.abs(totalAllocation - overallMateriality)
            }
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if calculation already exists for this engagement
    const { data: existing } = await supabase
      .from('materiality_calculations')
      .select('id, version')
      .eq('engagement_id', validatedData.engagementId)
      .eq('is_current', true)
      .single()

    const version = existing ? (existing.version || 0) + 1 : 1

    // If existing, mark it as not current
    if (existing) {
      await supabase
        .from('materiality_calculations')
        .update({ is_current: false })
        .eq('id', existing.id)
    }

    // Save calculation to database
    const { data, error } = await supabase
      .from('materiality_calculations')
      .insert({
        engagement_id: validatedData.engagementId,
        firm_id: engagement.firm_id,
        benchmark_type: validatedData.benchmarkType,
        benchmark_amount: validatedData.benchmarkAmount,
        percentage: validatedData.percentage,
        overall_materiality: overallMateriality,
        performance_materiality: performanceMateriality,
        clearly_trivial: clearlyTrivial,
        component_allocations: validatedData.componentAllocations || [],
        rationale: validatedData.rationale,
        custom_benchmark_name: validatedData.customBenchmarkName,
        version,
        is_current: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to save calculation',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update engagement with current materiality amount
    const { error: updateError } = await supabase
      .from('engagements')
      .update({
        materiality_amount: overallMateriality,
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.engagementId)

    if (updateError) {
      console.error('Failed to update engagement:', updateError)
      // Don't fail the request, just log the error
    }

    // Log activity
    await supabase.from('activity_log').insert({
      firm_id: engagement.firm_id,
      engagement_id: validatedData.engagementId,
      user_id: user.id,
      action: 'calculate_materiality',
      entity_type: 'materiality_calculation',
      entity_id: data.id,
      metadata: {
        benchmark_type: validatedData.benchmarkType,
        overall_materiality: overallMateriality,
        performance_materiality: performanceMateriality,
        clearly_trivial: clearlyTrivial,
        version
      }
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          overallMateriality,
          performanceMateriality,
          clearlyTrivial,
          benchmarkType: validatedData.benchmarkType,
          benchmarkAmount: validatedData.benchmarkAmount,
          percentage: validatedData.percentage,
          version,
          createdAt: data.created_at,
          componentAllocations: validatedData.componentAllocations
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in calculate-materiality function:', error)

    // Sanitize error message for production
    const errorMessage = Deno.env.get('ENV') === 'production'
      ? 'Internal server error'
      : (error.message || 'Unknown error')

    return new Response(
      JSON.stringify({
        error: errorMessage,
        requestId: crypto.randomUUID() // For error tracking
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})