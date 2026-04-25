import { createServiceClient } from '@/lib/supabase/server'
import { calculateScore } from '@/lib/score/engine'
import { NextRequest } from 'next/server'
import type { IntakeData } from '@/lib/supabase/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const secret = req.headers.get('x-internal-secret')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceClient()
  const { data: intakeData } = await supabase
    .from('intake_data')
    .select('*')
    .eq('client_id', params.clientId)
    .single()

  if (!intakeData) {
    return new Response('Intake data not found', { status: 404 })
  }

  const result = calculateScore(intakeData as IntakeData)

  await supabase
    .from('readiness_scores')
    .upsert({
      client_id: params.clientId,
      ...result,
    })

  return Response.json(result)
}
