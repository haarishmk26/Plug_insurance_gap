import { notFound } from 'next/navigation'

import { DEFAULT_DEMO_BROKER_ID, upsertDemoBroker } from '../supabase/demo-broker'
import { createServiceClient } from '../supabase/server'
import type { Client, IntakeData, ReadinessScore, Upload } from '../supabase/types'

export interface DossierData {
  client: Client
  intakeData: IntakeData | null
  uploads: Upload[]
  score: ReadinessScore | null
}

export async function getDossierData(clientId: string): Promise<DossierData> {
  const supabase = createServiceClient() as any
  await upsertDemoBroker(supabase)

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('broker_id', DEFAULT_DEMO_BROKER_ID)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const [intakeResult, uploadsResult, scoreResult] = await Promise.all([
    supabase.from('intake_data').select('*').eq('client_id', client.id).single(),
    supabase.from('uploads').select('*').eq('client_id', client.id).order('uploaded_at', { ascending: true }),
    supabase.from('readiness_scores').select('*').eq('client_id', client.id).single(),
  ])

  return {
    client: client as Client,
    intakeData: (intakeResult.data as IntakeData | null) ?? null,
    uploads: (uploadsResult.data as Upload[] | null) ?? [],
    score: (scoreResult.data as ReadinessScore | null) ?? null,
  }
}
