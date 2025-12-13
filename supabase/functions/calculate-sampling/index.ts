// =============================================================================
// Edge Function: calculate-sampling
// Description: Calculates statistical sample sizes using MUS, Classical Variables, or Attributes sampling
// With comprehensive input validation using Zod (BUG-026)
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schema
const samplingRequestSchema = z.object({
  engagementId: z.string().uuid('Invalid engagement ID format'),
  procedureId: z.string().uuid('Invalid procedure ID format').optional(),
  samplingMethod: z.enum(['mus', 'classical_variables', 'attributes']),
  populationSize: z.number().int().positive('Population size must be a positive integer'),
  populationValue: z.number().positive('Population value must be positive').optional(),
  confidenceLevel: z.enum([90, 95, 99]),
  tolerableMisstatement: z.number().positive('Tolerable misstatement must be positive').optional(),
  expectedMisstatement: z.number().min(0, 'Expected misstatement cannot be negative').optional(),
  expectedErrorRate: z.number().min(0).max(100, 'Expected error rate must be between 0 and 100').optional(),
  tolerableErrorRate: z.number().min(0).max(100, 'Tolerable error rate must be between 0 and 100').optional(),
  stratification: z.array(
    z.object({
      name: z.string().min(1, 'Stratum name is required'),
      rangeMin: z.number(),
      rangeMax: z.number(),
      populationSize: z.number().int().positive(),
      populationValue: z.number().positive().optional()
    })
  ).optional()
}).refine(
  (data) => {
    // Validate MUS requirements
    if (data.samplingMethod === 'mus') {
      return data.populationValue && data.tolerableMisstatement
    }
    return true
  },
  { message: "Population value and tolerable misstatement required for MUS sampling" }
).refine(
  (data) => {
    // Validate attributes sampling requirements
    if (data.samplingMethod === 'attributes') {
      return data.expectedErrorRate !== undefined && data.tolerableErrorRate !== undefined
    }
    return true
  },
  { message: "Expected and tolerable error rates required for attributes sampling" }
).refine(
  (data) => {
    // Ensure expected error rate is less than tolerable error rate
    if (data.expectedErrorRate !== undefined && data.tolerableErrorRate !== undefined) {
      return data.expectedErrorRate < data.tolerableErrorRate
    }
    return true
  },
  { message: "Expected error rate must be less than tolerable error rate" }
).refine(
  (data) => {
    // Ensure expected misstatement is less than tolerable misstatement
    if (data.expectedMisstatement !== undefined && data.tolerableMisstatement !== undefined) {
      return data.expectedMisstatement < data.tolerableMisstatement
    }
    return true
  },
  { message: "Expected misstatement must be less than tolerable misstatement" }
)

type SamplingRequest = z.infer<typeof samplingRequestSchema>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}

// Reliability factors for MUS sampling
const RELIABILITY_FACTORS: Record<number, Record<number, number>> = {
  0: { 90: 2.31, 95: 3.00, 99: 4.61 },
  1: { 90: 3.89, 95: 4.75, 99: 6.64 },
  2: { 90: 5.33, 95: 6.30, 99: 8.41 },
  3: { 90: 6.69, 95: 7.76, 99: 10.05 },
  4: { 90: 8.00, 95: 9.16, 99: 11.61 },
  5: { 90: 9.28, 95: 10.52, 99: 13.11 }
}

// Z-scores for confidence levels
const Z_SCORES: Record<number, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576
}

function calculateMUSSampleSize(input: SamplingRequest): { size: number; interval: number } {
  if (!input.populationValue || !input.tolerableMisstatement) {
    throw new Error('Population value and tolerable misstatement required for MUS sampling')
  }

  // Determine expected errors based on expected misstatement
  let expectedErrors = 0
  if (input.expectedMisstatement) {
    const errorRate = input.expectedMisstatement / input.tolerableMisstatement
    expectedErrors = Math.min(Math.floor(errorRate * 5), 5) // Cap at 5 expected errors
  }

  const rf = RELIABILITY_FACTORS[expectedErrors][input.confidenceLevel] || RELIABILITY_FACTORS[5][input.confidenceLevel]

  // Adjust tolerable misstatement for expected misstatement
  const adjustedTolerable = input.tolerableMisstatement - (input.expectedMisstatement || 0)

  const samplingInterval = Math.floor(adjustedTolerable / rf)
  const sampleSize = Math.ceil(input.populationValue / samplingInterval)

  // Ensure sample size doesn't exceed population
  return {
    size: Math.min(sampleSize, input.populationSize),
    interval: samplingInterval
  }
}

function calculateClassicalVariablesSampleSize(input: SamplingRequest): number {
  const zScore = Z_SCORES[input.confidenceLevel]

  // Standard deviation estimate (using coefficient of variation approach)
  const coefficientOfVariation = 0.5 // Conservative estimate
  const stdDev = input.populationValue
    ? input.populationValue * coefficientOfVariation / Math.sqrt(input.populationSize)
    : input.populationSize * coefficientOfVariation

  // Precision (using tolerable misstatement if provided)
  const precision = input.tolerableMisstatement ||
    (input.populationValue ? input.populationValue * 0.05 : input.populationSize * 0.05)

  // Calculate sample size using standard formula
  const n0 = Math.pow(zScore * stdDev / precision, 2)

  // Apply finite population correction
  const sampleSize = Math.ceil(
    (n0 * input.populationSize) / (n0 + input.populationSize - 1)
  )

  return Math.min(sampleSize, input.populationSize)
}

function calculateAttributesSampleSize(input: SamplingRequest): number {
  if (!input.expectedErrorRate || !input.tolerableErrorRate) {
    throw new Error('Expected error rate and tolerable error rate required for attributes sampling')
  }

  const zScore = Z_SCORES[input.confidenceLevel]

  // Convert percentages to decimals
  const p = input.expectedErrorRate / 100
  const allowableError = (input.tolerableErrorRate - input.expectedErrorRate) / 100

  // Initial sample size calculation
  const numerator = (zScore * zScore * p * (1 - p))
  const denominator = allowableError * allowableError

  let sampleSize = Math.ceil(numerator / denominator)

  // Ensure minimum sample size based on confidence level
  const minSamples: Record<number, number> = { 90: 29, 95: 59, 99: 99 }
  sampleSize = Math.max(sampleSize, minSamples[input.confidenceLevel])

  // Apply finite population correction if sample is more than 5% of population
  if (sampleSize > input.populationSize * 0.05) {
    sampleSize = Math.ceil(
      (sampleSize * input.populationSize) / (sampleSize + input.populationSize - 1)
    )
  }

  return Math.min(sampleSize, input.populationSize)
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
    let validatedData: SamplingRequest
    try {
      const body = await req.json()
      validatedData = samplingRequestSchema.parse(body)
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

    // Verify procedure exists if provided
    if (validatedData.procedureId) {
      const { data: procedure, error: procError } = await supabase
        .from('audit_procedures')
        .select('id')
        .eq('id', validatedData.procedureId)
        .eq('engagement_id', validatedData.engagementId)
        .single()

      if (procError || !procedure) {
        return new Response(
          JSON.stringify({ error: 'Procedure not found or not associated with engagement' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Calculate sample size based on method
    let sampleSize: number
    let samplingInterval: number | undefined
    let calculationDetails: any = {}

    try {
      switch (validatedData.samplingMethod) {
        case 'mus': {
          const musResult = calculateMUSSampleSize(validatedData)
          sampleSize = musResult.size
          samplingInterval = musResult.interval
          calculationDetails = {
            method: 'Monetary Unit Sampling (MUS)',
            reliabilityFactor: RELIABILITY_FACTORS[0][validatedData.confidenceLevel],
            samplingInterval,
            formula: '(Population Value × Reliability Factor) / Tolerable Misstatement',
            populationValue: validatedData.populationValue,
            tolerableMisstatement: validatedData.tolerableMisstatement,
            expectedMisstatement: validatedData.expectedMisstatement
          }
          break
        }

        case 'classical_variables':
          sampleSize = calculateClassicalVariablesSampleSize(validatedData)
          calculationDetails = {
            method: 'Classical Variables Sampling',
            zScore: Z_SCORES[validatedData.confidenceLevel],
            formula: 'Based on normal distribution with finite population correction',
            populationSize: validatedData.populationSize,
            populationValue: validatedData.populationValue,
            tolerableMisstatement: validatedData.tolerableMisstatement
          }
          break

        case 'attributes':
          sampleSize = calculateAttributesSampleSize(validatedData)
          calculationDetails = {
            method: 'Attributes Sampling',
            zScore: Z_SCORES[validatedData.confidenceLevel],
            formula: 'Based on binomial distribution',
            expectedErrorRate: validatedData.expectedErrorRate,
            tolerableErrorRate: validatedData.tolerableErrorRate,
            populationSize: validatedData.populationSize
          }
          break

        default:
          throw new Error('Invalid sampling method')
      }
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Calculation error',
          details: error.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save sampling plan to database
    const { data, error } = await supabase
      .from('sampling_plans')
      .insert({
        engagement_id: validatedData.engagementId,
        firm_id: engagement.firm_id,
        procedure_id: validatedData.procedureId,
        sampling_method: validatedData.samplingMethod,
        population_size: validatedData.populationSize,
        population_value: validatedData.populationValue,
        confidence_level: validatedData.confidenceLevel.toString(),
        tolerable_misstatement: validatedData.tolerableMisstatement,
        expected_misstatement: validatedData.expectedMisstatement,
        expected_error_rate: validatedData.expectedErrorRate,
        tolerable_error_rate: validatedData.tolerableErrorRate,
        sample_size: sampleSize,
        sampling_interval: samplingInterval,
        calculation_details: calculationDetails,
        stratification: validatedData.stratification,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to save sampling plan',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log activity
    await supabase.from('activity_log').insert({
      firm_id: engagement.firm_id,
      engagement_id: validatedData.engagementId,
      user_id: user.id,
      action: 'calculate_sampling',
      entity_type: 'sampling_plan',
      entity_id: data.id,
      metadata: {
        sampling_method: validatedData.samplingMethod,
        sample_size: sampleSize,
        confidence_level: validatedData.confidenceLevel,
        population_size: validatedData.populationSize
      }
    })

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          sampleSize,
          samplingInterval,
          calculationDetails,
          samplingMethod: validatedData.samplingMethod,
          confidenceLevel: validatedData.confidenceLevel,
          populationSize: validatedData.populationSize,
          createdAt: data.created_at
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in calculate-sampling function:', error)

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