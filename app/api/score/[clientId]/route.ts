import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

import { handleScoreRequest, type ScoreRouteSupabaseClient } from '../../../../lib/api/score-route.js'
import type { Database } from '../../../../lib/supabase/types.js'

type ScoreRouteContext = {
  params: Promise<{ clientId: string }> | { clientId: string }
}

function createServiceClient(): ScoreRouteSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service credentials are not configured')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }) as ScoreRouteSupabaseClient
}

export async function POST(request: NextRequest, context: ScoreRouteContext) {
  const { clientId } = await context.params

  try {
    return await handleScoreRequest({
      clientId,
      internalSecret: request.headers.get('x-internal-secret'),
      expectedSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
      supabase: createServiceClient(),
    })
  } catch (error) {
    console.error('Failed to calculate readiness score', error)
    return Response.json({ error: 'Failed to calculate readiness score' }, { status: 500 })
  }
}
