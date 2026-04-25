import { calculateScore, type IntakeData, type ScoreResult } from '../score/engine'

type IntakeDataQuery = {
  select(columns: string): {
    eq(column: 'client_id', value: string): {
      single(): Promise<{ data: IntakeData | null; error: Error | null }>
    }
  }
}

type ReadinessScoresMutation = {
  upsert(
    value: { client_id: string } & ScoreResult,
    options?: { onConflict?: string },
  ): Promise<{ error: Error | null }>
}

export interface ScoreRouteSupabaseClient {
  from(table: 'intake_data'): IntakeDataQuery
  from(table: 'readiness_scores'): ReadinessScoresMutation
}

export interface HandleScoreRequestInput {
  clientId: string
  internalSecret: string | null
  expectedSecret: string | undefined
  supabase: ScoreRouteSupabaseClient
}

function jsonResponse(body: unknown, status: number = 200): Response {
  return Response.json(body, { status })
}

export async function handleScoreRequest(input: HandleScoreRequestInput): Promise<Response> {
  const { clientId, expectedSecret, internalSecret, supabase } = input

  if (!expectedSecret || internalSecret !== expectedSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const { data: intakeData, error: intakeError } = await supabase
    .from('intake_data')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (intakeError || !intakeData) {
    return jsonResponse({ error: 'Intake data not found' }, 404)
  }

  const result = calculateScore(intakeData)
  const { error: upsertError } = await supabase.from('readiness_scores').upsert(
    {
      client_id: clientId,
      ...result,
    },
    { onConflict: 'client_id' },
  )

  if (upsertError) {
    return jsonResponse({ error: 'Failed to save readiness score' }, 500)
  }

  return jsonResponse(result)
}
