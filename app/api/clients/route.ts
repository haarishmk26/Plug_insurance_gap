import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { seedDemoIntakeCompletion } from '@/lib/dashboard/demo-intake'
import { buildTelegramLink } from '@/lib/dashboard/dossier'
import { getDemoBrokerClientInsert, upsertDemoBroker } from '@/lib/supabase/demo-broker'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { businessName, ownerName, ownerContact } = await request.json()

  if (!businessName?.trim() || !ownerName?.trim()) {
    return NextResponse.json(
      { error: 'Business name and owner name are required.' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient() as any
  await upsertDemoBroker(supabase)

  const intakeToken = randomUUID()
  const clientInsert = getDemoBrokerClientInsert({
    business_name: businessName.trim(),
    owner_name: ownerName.trim(),
    owner_contact: ownerContact?.trim() || null,
    intake_token: intakeToken,
    intake_status: 'complete',
  })

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert(clientInsert)
    .select('*')
    .single()

  if (clientError || !client) {
    return NextResponse.json(
      { error: clientError?.message ?? 'Failed to create client.' },
      { status: 500 },
    )
  }

  const demo = await seedDemoIntakeCompletion(supabase, client)

  return NextResponse.json(
    {
      ...demo.client,
      telegramLink: buildTelegramLink(demo.client.intake_token),
    },
    { status: 201 },
  )
}
